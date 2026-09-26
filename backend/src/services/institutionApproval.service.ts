import crypto from "crypto";
import mongoose from "mongoose";
import { Institution, IInstitution, InstitutionType } from "../models/institution.model.js";
import { InstitutionApplication } from "../models/institutionApplication.model.js";
import { User } from "../models/user.model.js";
import { PlatformAuditLog } from "../models/platformAudit.model.js";
import { NotificationLog } from "../models/notificationLog.model.js";
import { FeedbackSession, FeedbackResponse } from "../models/feedback.model.js";
import { StudentProfile, FacultyProfile } from "../models/profiles.model.js";
import { EmailNotificationService } from "./emailNotification.service.js";
import { CustomError } from "../middleware/errorHandler.js";
import bcrypt from "bcrypt";
import { SeedService } from "../seed/seed.service.js";

export class InstitutionApprovalService {
  // Generate deterministic/sequential tenant identifier like INS-2026-0002
  static async generateInstitutionId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await Institution.countDocuments();
    const sequence = String(count + 1).padStart(4, "0");
    let candidate = `INS-${year}-${sequence}`;

    const exists = await Institution.findOne({ institutionId: candidate });
    if (exists) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      return `INS-${year}-${randomSuffix}`;
    }
    return candidate;
  }

  // Generate clean, url-friendly unique slug
  static async generateUniqueSlug(name: string, customSlug?: string): Promise<string> {
    let base = (customSlug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!base) base = "institution";

    let slug = base;
    let counter = 1;
    while (await Institution.findOne({ slug })) {
      slug = `${base}-${counter}`;
      counter++;
    }
    return slug;
  }

  // Helper to extract clean domain
  static extractDomain(emailOrUrl: string): string {
    if (emailOrUrl.includes("@")) {
      return emailOrUrl.split("@")[1].toLowerCase().trim();
    }
    try {
      let formatted = emailOrUrl.trim().toLowerCase();
      if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
        formatted = `https://${formatted}`;
      }
      const parsed = new URL(formatted);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return emailOrUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase().trim();
    }
  }

  // Phase 6: Approve Application and Provision Isolated Tenant
  static async approveApplication(
    applicationId: string,
    options: {
      customSlug?: string;
      allowedEmailDomains?: string[];
      adminNotes?: string;
    } = {},
    adminId?: string
  ) {
    const application = await InstitutionApplication.findById(applicationId);
    if (!application) {
      throw new CustomError("Application not found", 404);
    }

    if (application.status === "APPROVED" && application.approvedInstitutionId) {
      const existingInst = await Institution.findById(application.approvedInstitutionId);
      if (existingInst) {
        const rootAdmin = await User.findOne({ institutionId: existingInst._id, role: "admin" });
        return {
          institution: {
            id: existingInst._id,
            institutionId: existingInst.institutionId,
            name: existingInst.name,
            slug: existingInst.slug,
            status: existingInst.status,
            portalUrl: `/college/${existingInst.slug}`,
          },
          rootAdmin: {
            id: rootAdmin?._id,
            username: rootAdmin?.username || `admin@${existingInst.slug}.ac.in`,
            name: application.representativeName,
            tempPassword: "Password unavailable (already provisioned)",
          },
          activationToken: application.activationToken || "",
          activationLink: `https://acadexa-fb.vercel.app/activate-institution?token=${application.activationToken || ""}&ref=${application.referenceId}`,
        };
      }
    }

    // 1. Generate unique Institution ID and Slug
    const institutionId = await this.generateInstitutionId();
    const targetSlug = options.customSlug || application.collegeCode || application.institutionName;
    const slug = await this.generateUniqueSlug(application.institutionName, targetSlug);

    // Compute allowed domains
    const primaryDomain = this.extractDomain(application.officialEmail);
    const repDomain = this.extractDomain(application.representativeEmail);
    const domainList: string[] = [];
    if (primaryDomain) domainList.push(primaryDomain);
    if (repDomain && !["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(repDomain)) {
      if (!domainList.includes(repDomain)) domainList.push(repDomain);
    }
    if (options.allowedEmailDomains && Array.isArray(options.allowedEmailDomains)) {
      options.allowedEmailDomains.forEach((d) => {
        const clean = d.trim().toLowerCase();
        if (clean && !domainList.includes(clean)) domainList.push(clean);
      });
    }

    // 2. Create Institution Tenant Record
    const institution = await Institution.create({
      institutionId,
      name: application.institutionName,
      slug,
      type: application.institutionType as InstitutionType,
      website: application.officialWebsite,
      officialEmail: application.officialEmail,
      state: application.state,
      city: application.city,
      address: application.fullAddress,
      affiliationDetails: application.affiliationDetails,
      approxStudents: application.approxStudents || 0,
      approxFaculty: application.approxFaculty || 0,
      status: "active",
      approvedAt: new Date(),
      settings: {
        systemName: application.institutionName,
        domainRestriction: domainList.join(", "),
        googleLoginEnabled: true,
        sessionTimeout: 30,
        anonymousFeedback: true,
        themeMode: "dark",
        accentColor: "#0B3D91",
        logoUrl: "",
        allowPublicStats: true,
      },
      applicationId: application._id as any,
    });

    // 3. Create or link Root Institution Administrator Account
    const cleanCode = (application.collegeCode || slug || "college").replace(/[^a-zA-Z0-9]/g, "");
    const adminUsername = `admin@${cleanCode}.ac.in`.toLowerCase().trim();
    let rootAdmin = await User.findOne({ username: adminUsername });

    // Generate random secure activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Generate clear initial password for root administrator
    const randomHex = crypto.randomBytes(4).toString("hex");
    const generatedPassword = `Adm#${randomHex}26!`;
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    if (!rootAdmin) {
      rootAdmin = await User.create({
        username: adminUsername,
        role: "admin",
        password: hashedPassword,
        institutionId: institution._id as any,
        status: "active",
      });
    } else {
      rootAdmin.password = hashedPassword;
      rootAdmin.institutionId = institution._id as any;
      rootAdmin.role = "admin";
      rootAdmin.status = "active";
      await rootAdmin.save();
    }

    // Link rootAdmin to institution
    institution.adminUserId = rootAdmin._id as any;
    await institution.save();

    // 3.5. Seed Default Academic Master Data for New Institution
    await SeedService.seedNewInstitutionData(
      institution._id,
      institution.name,
      primaryDomain || application.officialWebsite
    ).catch((err) => console.error("Seed new institution error:", err));

    // 4. Update Application Record
    application.status = "APPROVED";
    application.approvedInstitutionId = institution._id as any;
    application.reviewedAt = new Date();
    if (adminId) {
      application.reviewedBy = new mongoose.Types.ObjectId(adminId) as any;
    }
    if (options.adminNotes !== undefined) {
      application.adminNotes = options.adminNotes;
    }
    application.activationToken = activationToken;
    application.activationTokenExpiresAt = activationExpires;
    application.isActivated = false;
    await application.save();

    // 5. Record Platform Audit Log
    await PlatformAuditLog.create({
      platformAdminId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
      action: "INSTITUTION_APPROVED",
      details: `Institution ${institution.name} approved. Tenant ID: ${institution.institutionId}, Slug: ${institution.slug}`,
      targetInstitutionId: institution._id,
      targetApplicationId: application._id,
      severity: "info",
      metadata: {
        institutionId: institution.institutionId,
        slug: institution.slug,
        rootAdminEmail: rootAdmin.username,
      },
      timestamp: new Date(),
    }).catch(() => {});

    // 6. Record & Dispatch Activation Email via Web3Forms with graceful fallback
    const activationLink = `https://acadexa-fb.vercel.app/activate-institution?token=${activationToken}&ref=${application.referenceId}`;
    await EmailNotificationService.sendApprovalActivationEmail({
      to: rootAdmin.username,
      representativeName: application.representativeName,
      institutionName: institution.name,
      institutionId: institution.institutionId,
      slug: institution.slug,
      activationLink,
      referenceId: application.referenceId,
      instObjId: institution._id,
      appObjId: application._id,
    }).catch(() => {});

    return {
      institution: {
        id: institution._id,
        institutionId: institution.institutionId,
        name: institution.name,
        slug: institution.slug,
        status: institution.status,
        portalUrl: `/college/${institution.slug}`,
      },
      rootAdmin: {
        id: rootAdmin._id,
        username: rootAdmin.username,
        name: application.representativeName,
        tempPassword: generatedPassword,
      },
      activationToken,
      activationLink,
    };
  }

  // Phase 7: List all institutions with aggregated tenant metrics
  static async listInstitutions(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.status && params.status !== "ALL") {
      filter.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), "i");
      filter.$or = [
        { institutionId: regex },
        { name: regex },
        { slug: regex },
        { officialEmail: regex },
        { city: regex },
        { state: regex },
      ];
    }

    const [institutions, total] = await Promise.all([
      Institution.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Institution.countDocuments(filter),
    ]);

    // Attach real domain metrics per tenant
    const enrichedInstitutions = await Promise.all(
      institutions.map(async (inst) => {
        const instObjId = inst._id;
        const [sessionsCount, studentsCount, facultyCount, responsesCount] = await Promise.all([
          FeedbackSession.countDocuments({ institutionId: instObjId }).catch(() => 0),
          StudentProfile.countDocuments({ institutionId: instObjId }).catch(() => 0),
          FacultyProfile.countDocuments({ institutionId: instObjId }).catch(() => 0),
          FeedbackResponse.countDocuments({ institutionId: instObjId }).catch(() => 0),
        ]);

        return {
          ...inst,
          metrics: {
            feedbackSessions: sessionsCount,
            studentsEnrolled: studentsCount,
            facultyMembers: facultyCount,
            feedbackSubmissions: responsesCount,
          },
        };
      })
    );

    return {
      institutions: enrichedInstitutions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single institution details with metrics
  static async getInstitutionById(id: string): Promise<any> {
    const institution = await Institution.findById(id).lean();
    if (!institution) {
      throw new CustomError("Institution not found", 404);
    }

    const instObjId = institution._id;
    const [sessionsCount, studentsCount, facultyCount, responsesCount, rootAdmins] = await Promise.all([
      FeedbackSession.countDocuments({ institutionId: instObjId }).catch(() => 0),
      StudentProfile.countDocuments({ institutionId: instObjId }).catch(() => 0),
      FacultyProfile.countDocuments({ institutionId: instObjId }).catch(() => 0),
      FeedbackResponse.countDocuments({ institutionId: instObjId }).catch(() => 0),
      User.find({ institutionId: instObjId, role: "admin" }).select("username status createdAt").lean(),
    ]);

    return {
      ...institution,
      rootAdmins,
      metrics: {
        feedbackSessions: sessionsCount,
        studentsEnrolled: studentsCount,
        facultyMembers: facultyCount,
        feedbackSubmissions: responsesCount,
      },
    };
  }

  // Update institution settings
  static async updateInstitution(
    id: string,
    data: any,
    adminId?: string
  ) {
    const institution = await Institution.findById(id);
    if (!institution) {
      throw new CustomError("Institution not found", 404);
    }

    if (data.name) institution.name = data.name.trim();
    if (data.type) institution.type = data.type;
    if (data.website) institution.website = data.website.trim();
    if (data.officialEmail) institution.officialEmail = data.officialEmail.trim();
    if (data.address) institution.address = data.address.trim();
    if (data.city) institution.city = data.city.trim();
    if (data.state) institution.state = data.state.trim();
    if (data.settings) {
      institution.settings = { ...institution.settings, ...data.settings };
    }

    await institution.save();

    await PlatformAuditLog.create({
      platformAdminId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
      action: "INSTITUTION_UPDATED",
      details: `Institution ${institution.name} (${institution.institutionId}) configuration updated`,
      targetInstitutionId: institution._id,
      timestamp: new Date(),
    }).catch(() => {});

    return institution;
  }

  // Suspend tenant
  static async suspendInstitution(id: string, reason: string, adminId?: string) {
    if (!reason || !reason.trim()) {
      throw new CustomError("Suspension reason is required.", 400);
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      throw new CustomError("Institution not found", 404);
    }

    institution.status = "suspended";
    institution.statusReason = reason.trim();
    institution.suspendedAt = new Date();
    await institution.save();

    await PlatformAuditLog.create({
      platformAdminId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
      action: "INSTITUTION_SUSPENDED",
      details: `Tenant ${institution.name} (${institution.institutionId}) SUSPENDED. Reason: ${reason}`,
      targetInstitutionId: institution._id,
      severity: "warning",
      metadata: { reason },
      timestamp: new Date(),
    }).catch(() => {});

    return institution;
  }

  // Reactivate tenant
  static async reactivateInstitution(id: string, adminId?: string) {
    const institution = await Institution.findById(id);
    if (!institution) {
      throw new CustomError("Institution not found", 404);
    }

    institution.status = "active";
    institution.statusReason = "";
    await institution.save();

    await PlatformAuditLog.create({
      platformAdminId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
      action: "INSTITUTION_REACTIVATED",
      details: `Tenant ${institution.name} (${institution.institutionId}) REACTIVATED`,
      targetInstitutionId: institution._id,
      severity: "info",
      timestamp: new Date(),
    }).catch(() => {});

    return institution;
  }

  // Permanently delete institution tenant
  static async deleteInstitution(id: string, adminId?: string) {
    const institution = await Institution.findById(id);
    if (!institution) {
      throw new CustomError("Institution not found", 404);
    }

    const instName = institution.name;
    const instIdCode = institution.institutionId;

    await Institution.findByIdAndDelete(id);

    await InstitutionApplication.updateMany(
      { approvedInstitutionId: id },
      { $set: { approvedInstitutionId: null } }
    );

    await PlatformAuditLog.create({
      platformAdminId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
      action: "INSTITUTION_DELETED",
      details: `Tenant ${instName} (${instIdCode}) permanently DELETED from platform directory`,
      severity: "critical",
      metadata: { institutionId: instIdCode, name: instName },
      timestamp: new Date(),
    }).catch(() => {});

    return { message: `Institution ${instName} deleted successfully.` };
  }
}

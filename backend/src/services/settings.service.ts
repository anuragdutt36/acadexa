import { SystemSettings } from "../models/settings.model.js";
import { Institution } from "../models/institution.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import mongoose from "mongoose";

export class SettingsService {
  private static getDefaultSettingsTemplate() {
    return {
      systemName: "Acadexa",
      instituteName: "Institution",
      academicYear: "2026-27",
      googleLoginEnabled: true,
      domainRestriction: "",
      sessionTimeout: 30,
      anonymousFeedback: true,
      oneSubmissionPerStudent: true,
      autoActivateBasedOnDate: true,
      themeMode: "dark",
      logoUrl: "",
      campusImageUrl: "",
      campusImages: [],
    };
  }

  private static async resolveInstitution(identifier: string | mongoose.Types.ObjectId) {
    const idStr = identifier.toString().trim();
    let inst = null;
    if (mongoose.Types.ObjectId.isValid(idStr)) {
      inst = await Institution.findById(idStr);
    }
    if (!inst) {
      inst = await Institution.findOne({ institutionId: idStr });
    }
    if (!inst) {
      inst = await Institution.findOne({ slug: idStr.toLowerCase() });
    }
    return inst;
  }

  static async getSettings(institutionId?: string | mongoose.Types.ObjectId) {
    if (!institutionId) {
      return SettingsService.getDefaultSettingsTemplate() as any;
    }

    const inst = await SettingsService.resolveInstitution(institutionId);
    if (!inst) {
      return SettingsService.getDefaultSettingsTemplate() as any;
    }

    const canonicalId = inst._id;
    let settings = await SystemSettings.findOne({ institutionId: canonicalId });

    if (!settings) {
      settings = await SystemSettings.create({
        institutionId: canonicalId,
        systemName: inst.settings?.systemName || inst.name || "Acadexa",
        instituteName: inst.name || "Institution",
        academicYear: "2026-27",
        googleLoginEnabled: inst.settings?.googleLoginEnabled ?? true,
        domainRestriction: inst.settings?.domainRestriction || "",
        sessionTimeout: inst.settings?.sessionTimeout || 30,
        anonymousFeedback: inst.settings?.anonymousFeedback ?? true,
        oneSubmissionPerStudent: true,
        autoActivateBasedOnDate: true,
        themeMode: inst.settings?.themeMode || "dark",
        logoUrl: inst.logoUrl || inst.settings?.logoUrl || "",
        campusImageUrl: inst.settings?.campusImageUrl || "",
        campusImages: inst.settings?.campusImages || [],
      });
    }

    // Normalize any legacy string items in campusImages
    if (Array.isArray(settings.campusImages)) {
      let isModified = false;
      const normalized = settings.campusImages.map((img: any, idx: number) => {
        if (typeof img === "string") {
          isModified = true;
          return { url: img, publicId: "", order: idx + 1 };
        }
        return img;
      });
      if (isModified) {
        settings.campusImages = normalized as any;
        settings.markModified("campusImages");
        await settings.save().catch(() => {});
      }
    }
    return settings;
  }

  static async updateSettings(institutionId: string | mongoose.Types.ObjectId | undefined, updateData: any) {
    if (!institutionId) {
      throw new CustomError("Institution context is required to update settings", 400);
    }

    const inst = await SettingsService.resolveInstitution(institutionId);
    if (!inst) {
      throw new CustomError("Institution not found for settings update", 404);
    }

    const canonicalId = inst._id;
    let settings = await SystemSettings.findOne({ institutionId: canonicalId });

    if (!settings) {
      settings = new SystemSettings({
        ...SettingsService.getDefaultSettingsTemplate(),
        ...updateData,
        institutionId: canonicalId,
        instituteName: updateData.instituteName || inst.name,
        systemName: updateData.systemName || inst.settings?.systemName || inst.name,
      });
    } else {
      Object.assign(settings, updateData);
      settings.institutionId = canonicalId;
    }

    if (updateData.campusImages) {
      settings.markModified("campusImages");
    }
    await settings.save();

    // Sync settings & branding to Institution document
    await Institution.findByIdAndUpdate(canonicalId, {
      $set: {
        "settings.systemName": settings.systemName,
        "settings.domainRestriction": settings.domainRestriction,
        "settings.googleLoginEnabled": settings.googleLoginEnabled,
        "settings.sessionTimeout": settings.sessionTimeout,
        "settings.anonymousFeedback": settings.anonymousFeedback,
        "settings.themeMode": settings.themeMode,
        "settings.logoUrl": settings.logoUrl || "",
        "settings.campusImageUrl": settings.campusImageUrl || "",
        "settings.campusImages": settings.campusImages || [],
        logoUrl: settings.logoUrl || "",
      }
    }).catch(() => {});

    return settings;
  }
}
export default SettingsService;

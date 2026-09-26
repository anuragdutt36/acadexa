import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser, UserRole } from "../models/user.model.js";
import { StudentProfile, FacultyProfile } from "../models/profiles.model.js";
import { Course, Branch } from "../models/academic.model.js";
import { SystemSettings } from "../models/settings.model.js";
import { RollMapping } from "../models/rollMapping.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { OAuth2Client } from "google-auth-library";
import { Institution } from "../models/institution.model.js";

// Dummy hash used for constant-time comparison when user is not found (mitigates timing attacks)
const DUMMY_HASH = "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUUabcdefghij";

export class AuthService {
  static async generateTokens(user: IUser) {
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
      institutionId: user.institutionId,
    };

    const dbSettings = user.institutionId
      ? await SystemSettings.findOne({ institutionId: user.institutionId })
      : null;
    const timeout = dbSettings ? dbSettings.sessionTimeout : 30;

    const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
      expiresIn: `${timeout}m` as any,
    });

    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRY as any,
    });

    return { accessToken, refreshToken };
  }

  // Password-based authentication for Admin users only
  // Faculty, HOD, and Dean must use staffLogin() below.
  static async login(usernameInput: string, passwordInput: string) {
    const username = (usernameInput || "").toLowerCase().trim();

    const user = await User.findOne({ username });

    if (!user) {
      // Run dummy comparison to prevent user enumeration via timing attack
      await bcrypt.compare(passwordInput, DUMMY_HASH).catch(() => {});
      throw new CustomError("Invalid credentials or unauthorized login role", 401);
    }

    // Only admin roles can use this endpoint
    // Faculty, HOD, Dean must use POST /api/auth/staff/login
    if (["faculty", "hod", "dean"].includes(user.role)) {
      throw new CustomError(
        "Faculty, HOD, and Dean accounts must sign in using the Staff Login form.",
        403
      );
    }

    if (user.status !== "active") {
      throw new CustomError("Your account has been deactivated. Please contact administration.", 403);
    }

    let isMatch = false;
    if (user.password) {
      isMatch = await bcrypt.compare(passwordInput, user.password);
    }

    if (!isMatch) {
      throw new CustomError("Invalid credentials or unauthorized login role", 401);
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    const profile = await this.getUserProfile(user);

    return {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
        institutionId: user.institutionId,
      },
      profile,
      accessToken,
      refreshToken,
    };
  }

  // Dedicated manual password login for Faculty, HOD, and Dean.
  // This endpoint has ZERO Google OAuth involvement.
  static async staffLogin(emailInput: string, passwordInput: string) {
    const email = (emailInput || "").toLowerCase().trim();

    if (!email || !passwordInput) {
      throw new CustomError("Email and password are required.", 400);
    }

    // Find User record by email (username)
    const user = await User.findOne({ username: email }).select("+password");

    // Always run a bcrypt comparison (even on dummy) to prevent timing-based user enumeration
    const hashToCompare = user?.password || DUMMY_HASH;
    const isMatch = await bcrypt.compare(passwordInput, hashToCompare);

    if (!user) {
      // Check if a FacultyProfile exists without a User record (admin hasn't set password yet)
      const profile = await FacultyProfile.findOne({ email });
      if (profile) {
        throw new CustomError(
          "Your account exists but login credentials have not been set up yet. Please contact your institution administrator to set your password.",
          401
        );
      }
      throw new CustomError("Account not found. Please contact your institution administrator.", 401);
    }

    // Security: Only staff roles can use this endpoint
    if (!["faculty", "hod", "dean"].includes(user.role)) {
      // Run dummy compare to equalise timing; then reject
      await bcrypt.compare(passwordInput, DUMMY_HASH).catch(() => {});
      throw new CustomError("Invalid credentials or unauthorized login role.", 401);
    }

    // Check account status
    if (user.status !== "active") {
      throw new CustomError(
        "Your account is currently inactive. Please contact your institution administrator.",
        403
      );
    }

    // Password must be set
    if (!user.password) {
      throw new CustomError(
        "Your account exists but login credentials have not been set up yet. Please contact your institution administrator to set your password.",
        401
      );
    }

    if (!isMatch) {
      throw new CustomError("Invalid username or password.", 401);
    }

    // Confirm the role from DB record — never trust frontend-supplied role
    const authorizedRole = user.role; // Comes from DB

    // Multi-tenant safety: institutionId must be set
    if (!user.institutionId) {
      // Try to resolve it from FacultyProfile
      const fp = await FacultyProfile.findOne({ email });
      if (fp?.institutionId) {
        user.institutionId = fp.institutionId;
        await user.save();
      }
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    // Fetch the faculty profile for the response
    const userId = user._id || (user as any).id;
    const facultyProfile = await FacultyProfile.findOne({
      $or: [{ userId }, { email }]
    }).populate("branchId");

    if (facultyProfile && (!facultyProfile.userId || facultyProfile.userId.toString() !== user._id.toString())) {
      facultyProfile.userId = user._id as any;
      await facultyProfile.save();
    }

    return {
      user: {
        id: user._id,
        username: user.username,
        role: authorizedRole,
        status: user.status,
        institutionId: user.institutionId,
      },
      profile: facultyProfile || { name: email, email, role: authorizedRole },
      accessToken,
      refreshToken,
    };
  }


  // Multi-Role Institutional Google OAuth Sign-In & Authorization
  // STUDENTS ONLY — Faculty, HOD, and Dean are explicitly blocked here.
  static async googleLogin(idToken: string) {
    if (!idToken) {
      throw new CustomError("Google ID token is required", 400);
    }

    let email = "";
    let googleId = "";

    // Secure backend verification with Google Auth Library
    try {
      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error("Empty payload from Google token");
      }
      if (!payload.email_verified) {
        throw new Error("Google email is not verified");
      }

      email = payload.email?.toLowerCase().trim() || "";
      googleId = payload.sub;

      if (!email) {
        throw new Error("No email found in token");
      }
    } catch (err: any) {
      throw new CustomError("Failed to verify Google Sign-In token securely. Please try again.", 401);
    }

    // 1. Tenant Resolution: Find the corresponding Institution by email domain
    const emailDomain = email.split("@")[1];
    if (!emailDomain) {
      throw new CustomError("Please sign in using your official institutional Google account.", 400);
    }

    const cleanDomain = emailDomain.replace(/^@/, "").toLowerCase();
    let institution = await Institution.findOne({
      $or: [
        { "settings.domainRestriction": cleanDomain },
        { "settings.domainRestriction": `@${cleanDomain}` },
        { "settings.domainRestriction": { $regex: cleanDomain, $options: "i" } },
        { officialEmail: { $regex: cleanDomain, $options: "i" } },
        { website: { $regex: cleanDomain, $options: "i" } },
        { slug: cleanDomain.split(".")[0] },
      ],
      status: "active"
    });

    if (!institution) {
      throw new CustomError("No registered or active institution found for your institutional email domain. Please contact your administrator.", 403);
    }

    if (institution.settings && institution.settings.googleLoginEnabled === false) {
      throw new CustomError("Google login is currently disabled by the administrator for your institution.", 403);
    }

    const institutionId = institution._id;

    // 2. Query database records across all stakeholder pools STRICTLY for this institution
    const facultyRecords = await FacultyProfile.find({ email });
    const studentRecords = await StudentProfile.find({ email });
    const adminUser = await User.findOne({ username: email, role: "admin" });

    // SECURITY: Faculty, HOD, and Dean must use the Staff Login form (manual password).
    // Block Google OAuth for any email that matches a FacultyProfile.
    // This prevents the Google redirect bug where staff accounts were authenticated via Google.
    if (facultyRecords.length > 0) {
      throw new CustomError(
        "Faculty, HOD, and Dean accounts must sign in using the Staff Login form with username and password. Google Sign-In is only available for students.",
        403
      );
    }

    // Universal email parsing for student roll mappings if not in StudentProfile yet
    const localPart = email.split("@")[0] || "";
    const rollMatch = localPart.match(/\d+/);
    const rollNum = rollMatch ? parseInt(rollMatch[0], 10) : 0;
    let matchedMapping = null;
    if (rollNum > 0) {
      const mappings = await RollMapping.find({ isActive: true, institutionId });
      for (const mapping of mappings) {
        const start = parseInt(mapping.startRoll, 10);
        const end = parseInt(mapping.endRoll, 10);
        if (rollNum >= start && rollNum <= end) {
          matchedMapping = mapping;
          break;
        }
      }
    }

    // Determine candidate role records
    const allMatchingRecords: { role: UserRole; status: "active" | "inactive"; profileObj: any }[] = [];

    // Process Faculty / HOD / Dean profiles
    for (const fp of facultyRecords) {
      const role = (fp.role || "faculty") as UserRole;
      allMatchingRecords.push({ role, status: fp.status, profileObj: fp });
    }

    // Process Student profiles (or roll mapping authorization)
    if (studentRecords.length > 0) {
      for (const sp of studentRecords) {
        allMatchingRecords.push({ role: "student", status: sp.status, profileObj: sp });
      }
    } else if (matchedMapping || (institution && rollNum > 0)) {
      // Authorized student via roll mapping record or roll email format
      allMatchingRecords.push({ role: "student", status: "active", profileObj: null });
    }

    // Process Admin user record
    if (adminUser) {
      allMatchingRecords.push({ role: "admin", status: adminUser.status, profileObj: adminUser });
    }

    // 3. Authorization Check: Unregistered email
    if (allMatchingRecords.length === 0) {
      throw new CustomError("Your institutional account has not been authorized for Acadexa. Please contact your institution administrator.", 403);
    }

    // 4. Authorization Check: Inactive account status
    const activeRecords = allMatchingRecords.filter((r) => r.status === "active");
    if (activeRecords.length === 0) {
      throw new CustomError("Your account is currently inactive. Please contact your institution administrator.", 403);
    }

    // 5. Authorization Check: Conflicting role assignments
    const activeRoles = Array.from(new Set(activeRecords.map((r) => r.role)));
    if (activeRoles.length > 1) {
      throw new CustomError("Your account has conflicting role assignments. Please contact the administrator.", 403);
    }

    const authorizedRole = activeRoles[0];
    const authorizedRecord = activeRecords.find((r) => r.role === authorizedRole) || allMatchingRecords[0];

    // 6. Find or create user document with authorized role
    let user = await User.findOne({ username: email });
    if (!user) {
      user = await User.create({
        username: email,
        role: authorizedRole,
        status: "active",
        institutionId: institutionId,
      });
    } else {
      // Ensure user role matches server-authorized role
      user.role = authorizedRole;
      user.institutionId = institutionId;
      await user.save();
    }

    if (user.status !== "active") {
      throw new CustomError("Your account is currently inactive. Please contact your institution administrator.", 403);
    }

    let returnedProfile: any = null;

    // Handle student profile creation/syncing
    if (authorizedRole === "student") {
      const { Course, Branch } = await import("../models/academic.model.js");
      const parts = localPart.split(".");
      let rawName = parts[0] || localPart;
      rawName = rawName.replace(/[^a-zA-Z\s-]/g, "").trim();
      const studentName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase() : "Student";
      let rollStr = rollMatch ? rollMatch[0] : localPart.toUpperCase();

      let studentProfile = await StudentProfile.findOne({
        $or: [{ email }, { userId: user._id }]
      });

      if (!studentProfile) {
        // Check if an existing profile has this enrollmentNo
        const existingRollProfile = await StudentProfile.findOne({ enrollmentNo: rollStr, institutionId });
        if (existingRollProfile) {
          // If the profile exists and has matching email or no userId, link to this student
          if (!existingRollProfile.userId || existingRollProfile.email === email) {
            studentProfile = existingRollProfile;
            studentProfile.email = email;
            studentProfile.userId = user._id as any;
            if (googleId) studentProfile.googleId = googleId;
            await studentProfile.save();
          } else {
            // Otherwise generate a unique enrollmentNo suffix
            rollStr = `${rollStr}-${Math.floor(100 + Math.random() * 900)}`;
          }
        }
      }

      if (!studentProfile) {
        let courseId;
        let branchId;
        let year = 1;
        let semester = 1;
        let academicSession = "2025-26";

        if (matchedMapping) {
          courseId = matchedMapping.courseId;
          branchId = matchedMapping.branchId;
          year = matchedMapping.currentYear;
          semester = matchedMapping.currentSemester;
          academicSession = matchedMapping.academicSession;
        } else {
          const firstCourse = await Course.findOne({ institutionId });
          const firstBranch = await Branch.findOne({ courseId: firstCourse?._id, institutionId });
          courseId = firstCourse?._id;
          branchId = firstBranch?._id;
        }

        try {
          studentProfile = await StudentProfile.create({
            userId: user._id,
            institutionId: institutionId,
            enrollmentNo: rollStr,
            name: studentName,
            email: email,
            courseId,
            branchId,
            year,
            semester,
            academicSession,
            status: "active",
            googleId,
          });
        } catch (createErr: any) {
          // Fallback if enrollmentNo race condition occurs
          const uniqueRoll = `${rollStr}_${Date.now().toString().slice(-5)}`;
          studentProfile = await StudentProfile.create({
            userId: user._id,
            institutionId: institutionId,
            enrollmentNo: uniqueRoll,
            name: studentName,
            email: email,
            courseId,
            branchId,
            year,
            semester,
            academicSession,
            status: "active",
            googleId,
          });
        }
      } else {
        studentProfile.userId = user._id as any;
        if (googleId) {
          studentProfile.googleId = googleId;
        }
        await studentProfile.save();
      }

      returnedProfile = await studentProfile.populate(["courseId", "branchId"]);
    } else if (authorizedRole === "faculty" || authorizedRole === "hod" || authorizedRole === "dean") {
      // Link user ID to Faculty/HOD/Dean profile
      const facultyProfile = authorizedRecord?.profileObj || (await FacultyProfile.findOne({ email, institutionId }));
      if (facultyProfile) {
        facultyProfile.userId = user._id as any;
        await facultyProfile.save();
        returnedProfile = facultyProfile;
      }
    } else if (authorizedRole === "admin") {
      returnedProfile = { name: "System Administrator", email: user.username };
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    return {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
        institutionId: user.institutionId,
      },
      profile: returnedProfile,
      accessToken,
      refreshToken,
    };
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as any;
      const user = await User.findById(decoded.id);

      if (!user || !user.refreshTokens.includes(token) || user.status !== "active") {
        throw new CustomError("Invalid refresh token", 401);
      }

      const tokens = await this.generateTokens(user);

      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch (err: any) {
      throw new CustomError(err.message || "Invalid refresh token", 401);
    }
  }

  static async logout(userId: string, token: string) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      await user.save();
    }
  }

  static async getUserProfile(user: IUser) {
    if (user.role === "student") {
      const userId = user._id || (user as any).id;
      let studentProfile = await StudentProfile.findOne({ userId })
        .populate("courseId")
        .populate("branchId");

      if (!studentProfile) {
        studentProfile = await StudentProfile.findOne({ email: user.username })
          .populate("courseId")
          .populate("branchId");
      }

      if (studentProfile) {
        const localPart = user.username.split("@")[0] || "";
        const parts = localPart.split(".");
        let rawName = parts[0] || localPart;
        rawName = rawName.replace(/[^a-zA-Z\s-]/g, "").trim();
        const studentName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase() : "Student";

        const rollMatch = localPart.match(/\d+/);
        const rollNum = rollMatch ? parseInt(rollMatch[0], 10) : 0;
        const rollStr = rollMatch ? rollMatch[0] : "";

        if (rollNum > 0) {
          const mappings = await RollMapping.find({ isActive: true });
          for (const mapping of mappings) {
            const start = parseInt(mapping.startRoll, 10);
            const end = parseInt(mapping.endRoll, 10);
            if (rollNum >= start && rollNum <= end) {
              studentProfile.courseId = mapping.courseId as any;
              studentProfile.branchId = mapping.branchId as any;
              studentProfile.year = mapping.currentYear;
              studentProfile.semester = mapping.currentSemester;
              studentProfile.academicSession = mapping.academicSession;
              break;
            }
          }
        }
        if (studentName && !studentProfile.name) studentProfile.name = studentName;
        if (rollStr && (!studentProfile.enrollmentNo || studentProfile.enrollmentNo !== rollStr)) {
          const conflicting = await StudentProfile.findOne({
            enrollmentNo: rollStr,
            _id: { $ne: studentProfile._id }
          });
          if (!conflicting) {
            studentProfile.enrollmentNo = rollStr;
          }
        }
        await studentProfile.save();
        await studentProfile.populate(["courseId", "branchId"]);
      }
      return studentProfile || { name: "Student", email: user.username, role: user.role };
    }
    if (user.role === "faculty" || user.role === "hod" || user.role === "dean") {
      const userId = user._id || (user as any).id;
      let facultyProfile = await FacultyProfile.findOne({ $or: [{ userId }, { email: user.username }] })
        .populate("branchId");
      return facultyProfile || { name: "Faculty Member", email: user.username, role: user.role };
    }
    return { name: "System Administrator", email: user.username, role: user.role };
  }

  static async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPass, user.password || "");
    if (!isMatch) {
      throw new CustomError("Current password is incorrect", 400);
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPass, salt);
    user.refreshTokens = [];
    await user.save();
  }
}

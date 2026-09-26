import mongoose from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { FeedbackResponse, FeedbackSession, SubmissionStatus } from "../models/feedback.model.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";
import { Subject, Branch } from "../models/academic.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { SystemSettings } from "../models/settings.model.js";
import { Institution } from "../models/institution.model.js";
import { logger } from "../utils/logger.js";

export class ReportsService {
  private static async getInstitutionBranding(institutionId?: string) {
    let name = "Institution";
    let address = "";
    if (institutionId) {
      const inst = await Institution.findById(institutionId);
      if (inst) {
        name = inst.name || name;
        address = [inst.city, inst.state].filter(Boolean).join(", ") || (typeof inst.address === "string" ? inst.address : "");
      }
      const settings = await SystemSettings.findOne({ institutionId: new mongoose.Types.ObjectId(institutionId) });
      if (settings?.instituteName) {
        name = settings.instituteName;
      }
    }
    return { name, address };
  }

  static async getacadexaRecords(facultyUserId: string, institutionId?: string) {
    const UserModule = await import("../models/user.model.js");
    const User = UserModule.User;

    const instFilter = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};

    let faculty = await FacultyProfile.findOne({ userId: facultyUserId, ...instFilter }).populate("branchId");
    if (!faculty) {
      faculty = await FacultyProfile.findOne({ _id: facultyUserId, ...instFilter }).populate("branchId");
    }
    const user = await User.findOne({ _id: facultyUserId, ...instFilter });
    if (!faculty && user) {
      faculty = await FacultyProfile.findOne({ email: user.username.toLowerCase().trim(), ...instFilter }).populate("branchId");
      if (faculty) {
        faculty.userId = user._id as any;
        await faculty.save();
      }
    }
    if (!faculty) throw new CustomError("Faculty profile not found", 404);

    // Collect all candidate profile IDs for this faculty
    const allFacultyProfiles = await FacultyProfile.find({
      $or: [
        { userId: facultyUserId },
        { email: faculty.email.toLowerCase().trim() },
        { _id: faculty._id }
      ],
      ...instFilter,
    });
    const facultyIds = Array.from(new Set([
      faculty._id.toString(),
      facultyUserId,
      ...allFacultyProfiles.map(f => f._id.toString())
    ]));

    const responses = await FeedbackResponse.find({
      facultyId: { $in: facultyIds },
      ...instFilter,
    }).populate("subjectId");

    const recordsMap = new Map();
    for (const res of responses) {
      if (!res.subjectId) continue;
      const sessIdStr = res.feedbackSessionId.toString();
      const subj = res.subjectId as any;
      const subjIdStr = subj._id.toString();

      const key = `${sessIdStr}_${subjIdStr}`;
      if (!recordsMap.has(key)) {
        recordsMap.set(key, {
          sessionId: sessIdStr,
          subjectId: subjIdStr,
          subjectName: subj.name,
          subjectCode: subj.code,
          responses: []
        });
      }
      recordsMap.get(key).responses.push(res);
    }

    const records = [];
    let totalRatingSum = 0;
    let totalRatingCount = 0;
    const uniqueSessions = new Set<string>();
    const uniqueSubjects = new Set<string>();
    let latestAcademicYear = "2025–26";
    let latestPeriod = "Current Term";

    for (const [key, data] of recordsMap.entries()) {
      const session = await FeedbackSession.findOne({ _id: data.sessionId, ...instFilter }).populate("questions");
      if (!session) continue;

      uniqueSessions.add(session._id.toString());
      uniqueSubjects.add(data.subjectId.toString());
      if (session.academicYear) latestAcademicYear = session.academicYear;
      if (session.name) latestPeriod = session.name;

      let overallScoreSum = 0;
      let ratingCount = 0;

      const questionsList = (session.questions as any[]) || [];
      const questionAverages: any[] = [];
      const questionScores: any[] = [];
      const categoryMap = new Map<string, { sum: number; count: number }>();
      const comments: string[] = [];

      for (const q of questionsList) {
        let qSum = 0;
        let qCount = 0;

        data.responses.forEach((res: any) => {
          const matchingRating = res.ratings?.find((r: any) => r.questionId?.toString() === q._id.toString());
          if (matchingRating && typeof matchingRating.rating === "number" && !isNaN(matchingRating.rating)) {
            qSum += matchingRating.rating;
            qCount++;
          }
          if (res.comments && typeof res.comments === "string" && res.comments.trim()) {
            if (!comments.includes(res.comments.trim())) {
              comments.push(res.comments.trim());
            }
          }
        });

        const avg = qCount > 0 ? parseFloat((qSum / qCount).toFixed(2)) : 0.0;
        questionAverages.push({
          questionId: q._id,
          text: q.text,
          category: q.category || "General",
          average: avg,
          totalVotes: qCount,
        });

        questionScores.push({
          id: q._id,
          question: q.text,
          category: q.category || "General",
          score: avg,
        });

        const catName = q.category || "General";
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { sum: 0, count: 0 });
        }
        const cEntry = categoryMap.get(catName)!;
        cEntry.sum += qSum;
        cEntry.count += qCount;

        overallScoreSum += qSum;
        ratingCount += qCount;
      }

      const categoryScores = Array.from(categoryMap.entries()).map(([name, val]) => ({
        name,
        score: val.count > 0 ? parseFloat((val.sum / val.count).toFixed(2)) : 0.0,
      }));

      const overallScore = ratingCount > 0 ? parseFloat((overallScoreSum / ratingCount).toFixed(2)) : 0.0;
      totalRatingSum += overallScoreSum;
      totalRatingCount += ratingCount;

      const deptName = (faculty.branchId as any)?.name || faculty.department || "Academic Department";

      const reportData = {
        facultyName: faculty.name,
        department: deptName,
        designation: faculty.designation || "Assistant Professor",
        subjectName: data.subjectName,
        semester: `Semester ${session.semester}`,
        sessionName: session.name,
        academicYear: session.academicYear || "2025-26",
        responseCount: data.responses.length,
        overallScore,
        categoryScores,
        questionScores,
        trends: [
          { period: session.academicYear || "2025-26", score: overallScore }
        ],
        comments,
        isLowResponseGroup: data.responses.length < 3,
        faculty: {
          id: faculty._id,
          name: faculty.name,
          email: faculty.email,
          designation: faculty.designation,
          branch: deptName,
        },
        session: {
          id: session._id,
          name: session.name,
          academicYear: session.academicYear,
          status: session.status,
        },
        overallAverage: overallScore,
        questionAverages,
      };

      records.push({
        id: key,
        subjectName: data.subjectName,
        subjectCode: data.subjectCode,
        semester: `Sem ${session.semester}`,
        academicYear: session.academicYear || "2025-26",
        sessionName: session.name,
        responseCount: data.responses.length,
        overallScore,
        status: session.status || "active",
        reportData
      });
    }

    // Also include mapped subjects count if not yet having responses
    const mappings = await FacultySubjectMapping.find({
      facultyId: { $in: facultyIds },
      ...instFilter,
    });
    const subjectsCount = Math.max(uniqueSubjects.size, mappings.length);

    const overallScore = totalRatingCount > 0 ? parseFloat((totalRatingSum / totalRatingCount).toFixed(1)) : 0.0;

    return {
      academicSession: latestAcademicYear,
      totalSessions: uniqueSessions.size,
      subjectsCount,
      overallScore,
      totalResponses: responses.length,
      latestPeriod,
      records
    };
  }

  // Aggregated Department Dashboard for HOD
  static async getDepartmentDashboardData(hodUserId: string, institutionId?: string) {
    const UserModule = await import("../models/user.model.js");
    const User = UserModule.User;
    const user = await User.findById(hodUserId);

    const instId = institutionId || user?.institutionId?.toString();
    const instFilter = instId ? { institutionId: new mongoose.Types.ObjectId(instId) } : {};

    let hodProfile = await FacultyProfile.findOne({ userId: hodUserId, ...instFilter }).populate("branchId");
    if (!hodProfile) {
      hodProfile = await FacultyProfile.findOne({ _id: hodUserId, ...instFilter }).populate("branchId");
    }
    if (!hodProfile && user) {
      hodProfile = await FacultyProfile.findOne({ email: user.username.toLowerCase().trim(), ...instFilter }).populate("branchId");
      if (hodProfile) {
        hodProfile.userId = user._id as any;
        await hodProfile.save();
      }
    }
    if (!hodProfile) {
      hodProfile = await FacultyProfile.findOne({ role: "hod", ...instFilter }).populate("branchId");
    }

    let branchId = hodProfile?.branchId?._id || hodProfile?.branchId;
    let deptName = hodProfile?.department || (hodProfile?.branchId as any)?.name || "Department";

    // Find related branches for this department name
    const branchQuery: any = {
      $or: [
        ...(branchId ? [{ _id: branchId }] : []),
        { name: { $regex: new RegExp(deptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } },
        { code: { $regex: new RegExp(deptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ],
      ...instFilter,
    };
    const matchedBranches = await Branch.find(branchQuery);
    const matchedBranchIds = matchedBranches.map(b => b._id);
    if (branchId && !matchedBranchIds.some(id => id.toString() === branchId.toString())) {
      matchedBranchIds.push(branchId);
    }

    // Find active sessions for this institution/department
    const sessionQuery: any = { status: "active", ...instFilter };
    if (matchedBranchIds.length > 0) {
      sessionQuery.branchId = { $in: matchedBranchIds };
    }
    const activeSessionsCount = await FeedbackSession.countDocuments(sessionQuery);

    // Find all feedback responses for faculty in this department or branch
    const deptFaculties = await FacultyProfile.find({
      $or: [
        ...(deptName ? [{ department: { $regex: new RegExp(deptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }] : []),
        ...(matchedBranchIds.length > 0 ? [{ branchId: { $in: matchedBranchIds } }] : [])
      ],
      ...instFilter,
    });
    const deptFacultyIds = deptFaculties.map(f => f._id);

    const matchQuery: any = {
      $or: [
        { facultyId: { $in: deptFacultyIds } },
        ...(matchedBranchIds.length > 0 ? [{ branchId: { $in: matchedBranchIds } }] : [])
      ],
      ...instFilter,
    };

    const responses = await FeedbackResponse.find(matchQuery).populate("subjectId").populate("facultyId");

    let ratingSum = 0;
    let ratingCount = 0;
    const evaluatedFacultySet = new Set<string>();
    const evaluatedSubjectSet = new Set<string>();
    const facultyScoresMap = new Map<string, { faculty: any; sum: number; count: number; responses: number }>();

    for (const res of responses) {
      const fId = res.facultyId?._id?.toString() || res.facultyId?.toString();
      if (fId) evaluatedFacultySet.add(fId);
      if (res.subjectId) evaluatedSubjectSet.add((res.subjectId as any)._id?.toString() || res.subjectId.toString());

      if (fId) {
        if (!facultyScoresMap.has(fId)) {
          const fac = deptFaculties.find(f => f._id.toString() === fId) || (typeof res.facultyId === "object" ? res.facultyId : null);
          facultyScoresMap.set(fId, { faculty: fac, sum: 0, count: 0, responses: 0 });
        }
        const entry = facultyScoresMap.get(fId)!;
        entry.responses++;

        if (res.ratings && Array.isArray(res.ratings)) {
          for (const r of res.ratings) {
            if (typeof r.rating === "number" && !isNaN(r.rating)) {
              ratingSum += r.rating;
              ratingCount++;
              entry.sum += r.rating;
              entry.count++;
            }
          }
        }
      }
    }

    const overallScore = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 0.0;

    // Calculate response rate
    const studentQuery: any = { ...instFilter };
    if (matchedBranchIds.length > 0) {
      studentQuery.branchId = { $in: matchedBranchIds };
    }
    const studentCount = await StudentProfile.countDocuments(studentQuery);

    const subQuery: any = { submitted: true, ...instFilter };
    if (matchedBranchIds.length > 0) {
      const studentIdsInBranch = await StudentProfile.find(studentQuery).distinct("_id");
      subQuery.studentId = { $in: studentIdsInBranch };
    }
    const totalSubmissionsCount = await SubmissionStatus.countDocuments(subQuery);
    const responseRate = studentCount > 0 ? Math.min(100, Math.round((totalSubmissionsCount / studentCount) * 100)) : (responses.length > 0 ? 100 : 0);

    // Build faculty rankings
    const facultyRankings = [];
    for (const [, data] of facultyScoresMap.entries()) {
      const score = data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0.0;
      facultyRankings.push({
        name: data.faculty ? data.faculty.name : "Faculty Member",
        department: data.faculty ? (data.faculty.department || deptName) : deptName,
        score,
        responses: data.responses
      });
    }
    facultyRankings.sort((a, b) => b.score - a.score);

    const latestSession = await FeedbackSession.findOne(sessionQuery).sort({ createdAt: -1 });

    return {
      scopeName: deptName,
      academicYear: latestSession?.academicYear || "2025–26",
      activeSessions: activeSessionsCount,
      overallScore,
      responseRate,
      evaluatedFacultyCount: evaluatedFacultySet.size,
      evaluatedSubjectsCount: evaluatedSubjectSet.size,
      facultyRankings
    };
  }

  // Aggregated Institution Dashboard for Dean
  static async getDeanDashboardData(deanUserId: string, institutionId?: string) {
    const UserModule = await import("../models/user.model.js");
    const User = UserModule.User;
    const user = await User.findById(deanUserId);
    const instId = institutionId || user?.institutionId?.toString();
    const instFilter = instId ? { institutionId: new mongoose.Types.ObjectId(instId) } : {};

    const sessionQuery: any = { status: "active", ...instFilter };
    const activeSessionsCount = await FeedbackSession.countDocuments(sessionQuery);

    const responseQuery: any = { ...instFilter };
    const responses = await FeedbackResponse.find(responseQuery).populate("branchId").populate("facultyId").populate("subjectId");

    let ratingSum = 0;
    let ratingCount = 0;
    const evaluatedFacultySet = new Set<string>();
    const evaluatedSubjectSet = new Set<string>();
    const branchScoresMap = new Map<string, { branchName: string; sum: number; count: number; totalResponses: number }>();
    const facultyScoresMap = new Map<string, { name: string; department: string; sum: number; count: number; responses: number }>();

    for (const res of responses) {
      const facObj = res.facultyId as any;
      const fIdStr = facObj?._id?.toString() || res.facultyId?.toString() || "";
      if (fIdStr) evaluatedFacultySet.add(fIdStr);

      const subjObj = res.subjectId as any;
      const sIdStr = subjObj?._id?.toString() || res.subjectId?.toString() || "";
      if (sIdStr) evaluatedSubjectSet.add(sIdStr);

      const branchObj = res.branchId as any;
      const bName = branchObj?.name || facObj?.department || "General";
      const bIdStr = branchObj?._id?.toString() || bName;

      if (!branchScoresMap.has(bIdStr)) {
        branchScoresMap.set(bIdStr, { branchName: bName, sum: 0, count: 0, totalResponses: 0 });
      }
      const bEntry = branchScoresMap.get(bIdStr)!;
      bEntry.totalResponses++;

      const fName = facObj?.name || "Faculty Member";
      const fDept = facObj?.department || bName;

      if (fIdStr) {
        if (!facultyScoresMap.has(fIdStr)) {
          facultyScoresMap.set(fIdStr, { name: fName, department: fDept, sum: 0, count: 0, responses: 0 });
        }
        const fEntry = facultyScoresMap.get(fIdStr)!;
        fEntry.responses++;

        if (res.ratings && Array.isArray(res.ratings)) {
          for (const r of res.ratings) {
            if (typeof r.rating === "number" && !isNaN(r.rating)) {
              ratingSum += r.rating;
              ratingCount++;
              bEntry.sum += r.rating;
              bEntry.count++;
              fEntry.sum += r.rating;
              fEntry.count++;
            }
          }
        }
      }
    }

    const overallScore = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 0.0;

    const studentCount = await StudentProfile.countDocuments(instFilter);
    const totalSubmissionsCount = await SubmissionStatus.countDocuments({ submitted: true, ...instFilter });
    const responseRate = studentCount > 0 ? Math.min(100, Math.round((totalSubmissionsCount / studentCount) * 100)) : (responses.length > 0 ? 100 : 0);

    // Build department rankings
    const departmentRankings = [];
    const allBranches = await Branch.find(instFilter);
    for (const br of allBranches) {
      const bIdStr = br._id.toString();
      const data = branchScoresMap.get(bIdStr) || branchScoresMap.get(br.name);
      const score = data && data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0.0;
      const branchStudentCount = await StudentProfile.countDocuments({ branchId: br._id, ...instFilter });
      const deptResponseRate = branchStudentCount > 0 ? Math.min(100, Math.round(((data?.totalResponses || 0) / branchStudentCount) * 100)) : (data?.totalResponses ? 100 : 0);

      departmentRankings.push({
        name: br.name,
        score,
        responseRate: deptResponseRate
      });
    }
    departmentRankings.sort((a, b) => b.score - a.score);

    // Build faculty rankings
    const facultyRankings = [];
    for (const [, data] of facultyScoresMap.entries()) {
      const score = data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0.0;
      facultyRankings.push({
        name: data.name,
        department: data.department,
        score,
        responses: data.responses
      });
    }
    facultyRankings.sort((a, b) => b.score - a.score);

    const latestSession = await FeedbackSession.findOne(sessionQuery).sort({ createdAt: -1 });

    return {
      scopeName: "All Academic Departments",
      academicYear: latestSession?.academicYear || "2025–26",
      activeSessions: activeSessionsCount,
      overallScore,
      responseRate,
      evaluatedFacultyCount: evaluatedFacultySet.size,
      evaluatedSubjectsCount: evaluatedSubjectSet.size,
      departmentRankings,
      facultyRankings
    };
  }

  // Aggregate individual faculty report data
  static async getIndividualFacultyData(facultyId: string, sessionId: string, institutionId?: string) {
    const instFilter = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};

    const faculty = await FacultyProfile.findOne({ _id: facultyId, ...instFilter }).populate("branchId");
    if (!faculty) throw new CustomError("Faculty not found", 404);

    const session = await FeedbackSession.findOne({ _id: sessionId, ...instFilter }).populate(["courseId", "branchId", "questions"]);
    if (!session) throw new CustomError("Feedback session not found", 404);

    // Find all responses for this faculty in this session
    const responses = await FeedbackResponse.find({
      feedbackSessionId: sessionId,
      facultyId: facultyId,
      ...instFilter,
    });

    const responseCount = responses.length;

    // Calculate averages per question
    const questionsList = (session.questions as any[]) || [];
    const questionAverages = [];
    let overallRatingSum = 0;
    let ratingCount = 0;

    for (const q of questionsList) {
      let qSum = 0;
      let qCount = 0;

      responses.forEach((res) => {
        const matchingRating = res.ratings.find((r) => r.questionId.toString() === q._id.toString());
        if (matchingRating) {
          qSum += matchingRating.rating;
          qCount++;
        }
      });

      const avg = qCount > 0 ? parseFloat((qSum / qCount).toFixed(2)) : 0.0;
      questionAverages.push({
        questionId: q._id,
        text: q.text,
        category: q.category,
        average: avg,
        totalVotes: qCount,
      });

      overallRatingSum += qSum;
      ratingCount += qCount;
    }

    const overallAverage = ratingCount > 0 ? parseFloat((overallRatingSum / ratingCount).toFixed(2)) : 0.0;

    return {
      institutionId,
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        designation: faculty.designation,
        branch: (faculty.branchId as any)?.name || "N/A",
      },
      session: {
        id: session._id,
        name: session.name,
        academicYear: session.academicYear,
        status: session.status,
      },
      responseCount,
      overallAverage,
      questionAverages,
    };
  }

  // Aggregate consolidated class report data
  static async getConsolidatedClassData(sessionId: string, institutionId?: string) {
    const instFilter = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};

    const session = await FeedbackSession.findOne({ _id: sessionId, ...instFilter })
      .populate("courseId")
      .populate("branchId");
    if (!session) throw new CustomError("Feedback session not found", 404);

    const sessCourseId = (session.courseId as any)?._id || session.courseId;
    const sessBranchId = (session.branchId as any)?._id || session.branchId;

    let mappings = await FacultySubjectMapping.find({
      courseId: sessCourseId,
      branchId: sessBranchId,
      semester: session.semester,
      academicYear: session.academicYear,
      ...instFilter,
    })
      .populate("facultyId")
      .populate("subjectId");

    if (mappings.length === 0) {
      mappings = await FacultySubjectMapping.find({
        branchId: sessBranchId,
        semester: session.semester,
        academicYear: session.academicYear,
        ...instFilter,
      })
        .populate("facultyId")
        .populate("subjectId");
    }

    const rows = [];
    let grandAverageSum = 0;
    let validAveragesCount = 0;

    const distinctSubmissions = await SubmissionStatus.distinct("studentId", {
      feedbackSessionId: sessionId,
      submitted: true,
      ...instFilter,
    });
    const totalResponsesReceived = distinctSubmissions.length;

    const eligibleStudentsCount = await StudentProfile.countDocuments({
      courseId: sessCourseId,
      branchId: sessBranchId,
      year: session.year,
      ...instFilter,
    });

    const responseRate = eligibleStudentsCount > 0 
      ? parseFloat(((totalResponsesReceived / eligibleStudentsCount) * 100).toFixed(1)) 
      : 0;

    for (const map of mappings) {
      const faculty = map.facultyId as any;
      const subject = map.subjectId as any;

      if (!faculty || !subject) continue;

      const responses = await FeedbackResponse.find({
        feedbackSessionId: sessionId,
        facultyId: faculty._id,
        subjectId: subject._id,
        ...instFilter,
      });

      const responseCount = responses.length;

      let scoreSum = 0;
      let scoreCount = 0;
      responses.forEach((res) => {
        res.ratings.forEach((r) => {
          scoreSum += r.rating;
          scoreCount++;
        });
      });

      const avg = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;

      rows.push({
        facultyId: faculty._id,
        facultyName: faculty.name,
        facultyDesignation: faculty.designation,
        subjectCode: subject.code,
        subjectName: subject.name,
        responseCount,
        averageRating: avg,
      });

      if (avg > 0) {
        grandAverageSum += avg;
        validAveragesCount++;
      }
    }

    const classAverage = validAveragesCount > 0 ? parseFloat((grandAverageSum / validAveragesCount).toFixed(2)) : 0.0;

    return {
      institutionId,
      session: {
        id: session._id,
        name: session.name,
        course: (session.courseId as any)?.name || "Course",
        branch: (session.branchId as any)?.name || "Branch",
        year: session.year,
        semester: session.semester,
        academicYear: session.academicYear,
      },
      metrics: {
        totalStudentsEligible: eligibleStudentsCount,
        totalResponsesReceived,
        responseRate,
      },
      classAverage,
      records: rows,
    };
  }

  // --- Excel Generators ---
  static async generateIndividualFacultyExcel(data: any, institutionId?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Acadexa Report");

    const branding = await this.getInstitutionBranding(institutionId || data.institutionId);

    // Title Block
    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = branding.name.toUpperCase();
    sheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0B3D91" } };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = "INDIVIDUAL Acadexa REPORT";
    sheet.getCell("A2").font = { name: "Calibri", size: 12, bold: true, color: { argb: "0B3D91" } };
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    // Metadata Row
    sheet.addRow(["Faculty Name:", data.faculty.name, "", "Department:", data.faculty.branch]);
    sheet.addRow(["Designation:", data.faculty.designation, "", "Session Name:", data.session.name]);
    sheet.addRow(["Total Feedbacks:", data.responseCount, "", "Overall Score:", `${data.overallAverage} / 5.00`]);

    sheet.addRow([]);
    sheet.addRow([]);

    // Question Scores Header
    const headerRow = sheet.addRow(["S.No", "Question Category", "Evaluation Criteria / Question text", "Valid Responses", "Average Rating"]);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F4E79" } };
    });

    data.questionAverages.forEach((q: any, i: number) => {
      sheet.addRow([i + 1, q.category, q.text, q.totalVotes, q.average]);
    });

    // Auto-fit column widths
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        if (val.length > maxLen) maxLen = val.length;
      });
      column.width = Math.min(Math.max(maxLen + 2, 10), 50);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async generateConsolidatedClassExcel(data: any, institutionId?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Class Consolidated Report");

    const branding = await this.getInstitutionBranding(institutionId || data.institutionId);

    // Title Block
    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = branding.name.toUpperCase();
    sheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0B3D91" } };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = "CONSOLIDATED CLASS FEEDBACK REPORT";
    sheet.getCell("A2").font = { name: "Calibri", size: 12, bold: true, color: { argb: "0B3D91" } };
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    // Metadata
    sheet.addRow(["Course & Branch:", `${data.session.course} (${data.session.branch})`, "", "Academic Year:", data.session.academicYear]);
    sheet.addRow(["Year / Semester:", `Year ${data.session.year} - Sem ${data.session.semester}`, "", "Academic Year:", data.session.academicYear]);
    sheet.addRow(["Feedback Session:", data.session.name, "", "Class Average Rating:", `${data.classAverage} / 5.00`]);

    // Add Response Metrics
    sheet.addRow(["Eligible Students:", data.metrics.totalStudentsEligible, "", "Total Responses:", data.metrics.totalResponsesReceived]);
    sheet.addRow(["Response Rate:", `${data.metrics.responseRate}%`, "", "", ""]);

    sheet.addRow([]);
    sheet.addRow([]);

    // Table Header
    const headerRow = sheet.addRow(["Faculty Name", "Designation", "Subject Code", "Subject Name", "Total Responses", "Average Rating"]);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F4E79" } };
    });

    data.records.forEach((row: any) => {
      sheet.addRow([row.facultyName, row.facultyDesignation, row.subjectCode, row.subjectName, row.responseCount, row.averageRating]);
    });

    // Auto-fit column widths
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        if (val.length > maxLen) maxLen = val.length;
      });
      column.width = Math.min(Math.max(maxLen + 2, 10), 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // --- PDF Generators ---
  static async generateIndividualFacultyPDF(data: any, res: any, institutionId?: string) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    const branding = await this.getInstitutionBranding(institutionId || data.institutionId);

    doc.fontSize(16).fillColor("#0B3D91").text(branding.name.toUpperCase(), { align: "center", bold: true } as any);
    if (branding.address) {
      doc.fontSize(10).fillColor("#5A6E8E").text(branding.address, { align: "center" });
    }
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor("#0D1B3E").text("INDIVIDUAL FACULTY EVALUATION REPORT", { align: "center", bold: true } as any);
    doc.moveDown(1);

    // Draw Line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Metadata grid
    const metadataY = doc.y;
    doc.fontSize(10).fillColor("#5A6E8E").text("Faculty Name:", 50, metadataY);
    doc.fillColor("#0D1B3E").text(data.faculty.name, 140, metadataY);

    doc.fillColor("#5A6E8E").text("Department:", 300, metadataY);
    doc.fillColor("#0D1B3E").text(data.faculty.branch, 390, metadataY);

    doc.moveDown(0.5);
    const nextY = doc.y;
    doc.fillColor("#5A6E8E").text("Designation:", 50, nextY);
    doc.fillColor("#0D1B3E").text(data.faculty.designation, 140, nextY);

    doc.fillColor("#5A6E8E").text("Session:", 300, nextY);
    doc.fillColor("#0D1B3E").text(data.session.name, 390, nextY);

    doc.moveDown(0.5);
    const lastY = doc.y;
    doc.fillColor("#5A6E8E").text("Feedbacks:", 50, lastY);
    doc.fillColor("#0D1B3E").text(data.responseCount.toString(), 140, lastY);

    doc.fillColor("#5A6E8E").text("Overall Rating:", 300, lastY);
    doc.fillColor("#0B3D91").text(`${data.overallAverage} / 5.00`, 390, lastY, { bold: true } as any);

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Question Scores Header
    doc.fontSize(11).fillColor("#0B3D91").text("Feedback Breakdown by Question Criteria", { bold: true } as any);
    doc.moveDown(0.5);

    data.questionAverages.forEach((q: any, index: number) => {
      const questionY = doc.y;
      doc.fontSize(9).fillColor("#0D1B3E").text(`${index + 1}. [${q.category}] ${q.text}`, 50, questionY, { width: 380 } as any);
      doc.fontSize(9).fillColor("#0B3D91").text(`Rating: ${q.average} (${q.totalVotes} responses)`, 440, questionY, { align: "right", bold: true } as any);
      doc.moveDown(1.2);
    });

    doc.end();
  }

  static async generateConsolidatedClassPDF(data: any, res: any, institutionId?: string) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    const branding = await this.getInstitutionBranding(institutionId || data.institutionId);

    doc.fontSize(16).fillColor("#0B3D91").text(branding.name.toUpperCase(), { align: "center", bold: true } as any);
    if (branding.address) {
      doc.fontSize(10).fillColor("#5A6E8E").text(branding.address, { align: "center" });
    }
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor("#0D1B3E").text("CONSOLIDATED CLASS FEEDBACK REPORT", { align: "center", bold: true } as any);
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Metadata grid
    const metadataY = doc.y;
    doc.fontSize(10).fillColor("#5A6E8E").text("Course & Branch:", 50, metadataY);
    doc.fillColor("#0D1B3E").text(`${data.session.course} (${data.session.branch})`, 140, metadataY);

    doc.fillColor("#5A6E8E").text("Academic Year:", 300, metadataY);
    doc.fillColor("#0D1B3E").text(data.session.academicYear, 390, metadataY);

    doc.moveDown(0.5);
    const nextY = doc.y;
    doc.fillColor("#5A6E8E").text("Semester:", 50, nextY);
    doc.fillColor("#0D1B3E").text(`Sem ${data.session.semester}`, 140, nextY);

    doc.fillColor("#5A6E8E").text("Class Average:", 300, nextY);
    doc.fillColor("#0B3D91").text(`${data.classAverage} / 5.00`, 390, nextY, { bold: true } as any);

    // Add Response Metrics
    doc.moveDown(0.5);
    const metricsY = doc.y;
    doc.fontSize(10).fillColor("#5A6E8E").text("Eligible Students:", 50, metricsY);
    doc.fillColor("#0D1B3E").text(data.metrics.totalStudentsEligible, 140, metricsY);

    doc.fillColor("#5A6E8E").text("Responses / Rate:", 300, metricsY);
    doc.fillColor("#0B3D91").text(`${data.metrics.totalResponsesReceived} (${data.metrics.responseRate}%)`, 390, metricsY, { bold: true } as any);

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Records table
    doc.fontSize(11).fillColor("#0B3D91").text("Class Summary Table", { bold: true } as any);
    doc.moveDown(0.8);

    // Table Header
    const tableHeaderY = doc.y;
    doc.fontSize(9).fillColor("#5A6E8E").text("Faculty Name", 50, tableHeaderY, { bold: true } as any);
    doc.text("Subject Code", 220, tableHeaderY, { bold: true } as any);
    doc.text("Subject Name", 300, tableHeaderY, { bold: true } as any);
    doc.text("Responses", 440, tableHeaderY, { align: "right", bold: true } as any);
    doc.text("Rating", 490, tableHeaderY, { align: "right", bold: true } as any);
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Table Rows
    data.records.forEach((row: any) => {
      const rowY = doc.y;
      doc.fontSize(9).fillColor("#0D1B3E").text(row.facultyName, 50, rowY, { width: 160 } as any);
      doc.text(row.subjectCode, 220, rowY);
      doc.text(row.subjectName, 300, rowY, { width: 140 } as any);
      doc.text(row.responseCount.toString(), 440, rowY, { align: "right" });
      doc.fontSize(9).fillColor("#0B3D91").text(row.averageRating.toFixed(2), 490, rowY, { align: "right", bold: true } as any);
      doc.moveDown(1.2);
    });

    doc.end();
  }

  // Aggregate Department Report data
  static async getDepartmentReportData(branchId: string, sessionId: string, institutionId?: string) {
    const instFilter = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};

    let branch = await Branch.findOne({ _id: branchId, ...instFilter });
    if (!branch) {
      branch = await Branch.findOne({
        $or: [
          { code: { $regex: new RegExp(`^${branchId}$`, "i") } },
          { name: { $regex: new RegExp(`^${branchId}$`, "i") } },
        ],
        ...instFilter,
      });
    }
    if (!branch) throw new CustomError("Branch not found", 404);

    const session = await FeedbackSession.findOne({ _id: sessionId, ...instFilter })
      .populate("courseId")
      .populate("branchId");
    if (!session) throw new CustomError("Feedback session not found", 404);

    // Find equivalent branches (e.g. MCA vs Master of Computer Applications)
    const equivalentBranches = await Branch.find({
      $or: [
        { _id: branch._id },
        { code: { $regex: new RegExp(`^${branch.code}$`, "i") } },
        { name: { $regex: new RegExp(`^${branch.name}$`, "i") } },
      ],
      ...instFilter,
    });

    const branchIdsToMatch = equivalentBranches.map((b) => b._id);
    const branchCodesToMatch = equivalentBranches.map((b) => b.code.toUpperCase());

    // Gather candidate faculty members from direct profile branch, mappings, and submitted responses
    const directFaculties = await FacultyProfile.find({
      $or: [
        { branchId: { $in: branchIdsToMatch } },
        { department: { $in: branchCodesToMatch } },
        { department: { $regex: new RegExp(branch.code, "i") } },
      ],
      ...instFilter,
    });

    const mappedFacultyIds = await FacultySubjectMapping.distinct("facultyId", {
      $or: [
        { branchId: { $in: branchIdsToMatch } },
        { courseId: session.courseId },
        { semester: session.semester },
      ],
      ...instFilter,
    });

    const responseFacultyIds = await FeedbackResponse.distinct("facultyId", {
      feedbackSessionId: session._id,
      ...instFilter,
    });

    const candidateIds = [
      ...directFaculties.map((f) => f._id.toString()),
      ...mappedFacultyIds.map((id) => id.toString()),
      ...responseFacultyIds.map((id) => id.toString()),
    ];
    const uniqueCandidateIds = [...new Set(candidateIds)].filter(Boolean);

    let faculties = await FacultyProfile.find({ _id: { $in: uniqueCandidateIds }, ...instFilter });
    if (faculties.length === 0) {
      faculties = await FacultyProfile.find({ status: "active", ...instFilter });
    }

    const rankings = [];

    for (const faculty of faculties) {
      let responses = await FeedbackResponse.find({
        feedbackSessionId: session._id,
        facultyId: faculty._id,
        ...instFilter,
      });

      if (responses.length === 0) {
        responses = await FeedbackResponse.find({
          facultyId: faculty._id,
          branchId: { $in: branchIdsToMatch },
          semester: session.semester,
          ...instFilter,
        });
      }

      const responseCount = responses.length;
      let scoreSum = 0;
      let scoreCount = 0;

      responses.forEach((res) => {
        if (res.ratings && Array.isArray(res.ratings)) {
          res.ratings.forEach((r) => {
            if (r && typeof r.rating === "number" && !isNaN(r.rating)) {
              scoreSum += r.rating;
              scoreCount++;
            }
          });
        }
      });

      const averageRating = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;

      rankings.push({
        facultyId: faculty._id,
        name: faculty.name,
        designation: faculty.designation || "Faculty Member",
        averageRating,
        responseCount,
      });
    }

    // Sort rankings by averageRating descending, then by responseCount descending, then by name ascending
    rankings.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.responseCount !== a.responseCount) {
        return b.responseCount - a.responseCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Determine top and bottom performers
    const validRankings = rankings.filter((r) => r.responseCount > 0 || r.averageRating > 0);
    const displayRankings = validRankings.length > 0 ? validRankings : rankings;

    const topPerformers = displayRankings.slice(0, 2);

    let bottomPerformers: any[] = [];
    if (displayRankings.length > 1) {
      const candidates = displayRankings
        .slice()
        .reverse()
        .filter((r) => !topPerformers.some((tp) => tp.facultyId.toString() === r.facultyId.toString()));
      bottomPerformers = candidates.slice(0, 2);
    }

    // Calculate overall department average
    let ratingSum = 0;
    let ratingCount = 0;
    for (const rank of rankings) {
      if (rank.responseCount > 0 && rank.averageRating > 0) {
        ratingSum += rank.averageRating;
        ratingCount++;
      }
    }
    const deptAverage = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(2)) : 0.0;

    // Calculate participation rate
    const totalSubmissions = await SubmissionStatus.countDocuments({
      feedbackSessionId: session._id,
      submitted: true,
      ...instFilter,
    });

    const studentCount = await StudentProfile.countDocuments({
      branchId: { $in: branchIdsToMatch },
      ...instFilter,
    });
    const fallbackStudentCount = studentCount > 0 ? studentCount : await StudentProfile.countDocuments(instFilter);

    const participationRateNum =
      fallbackStudentCount > 0
        ? Math.min(100, Math.round((totalSubmissions / fallbackStudentCount) * 100))
        : totalSubmissions > 0
        ? 100
        : 0;

    const participationRate = `${participationRateNum}%`;

    return {
      department: {
        id: branch._id,
        name: branch.name,
        code: branch.code,
      },
      session: {
        id: session._id,
        name: session.name,
        academicYear: session.academicYear,
      },
      deptAverage,
      participationRate,
      rankings,
      topPerformers,
      bottomPerformers,
    };
  }

  // Aggregate Semester Report data
  static async getSemesterReportData(courseId: string, branchId: string, academicYear: string, institutionId?: string) {
    const instFilter = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};

    const sessions = await FeedbackSession.find({
      courseId,
      branchId,
      academicYear,
      ...instFilter,
    }).sort({ semester: 1 });

    const semesterData = [];
    for (const session of sessions) {
      const responses = await FeedbackResponse.find({
        feedbackSessionId: session._id,
        ...instFilter,
      });

      let scoreSum = 0;
      let scoreCount = 0;
      responses.forEach((res) => {
        res.ratings.forEach((r) => {
          scoreSum += r.rating;
          scoreCount++;
        });
      });

      const averageScore = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;
      const responseCount = await SubmissionStatus.countDocuments({
        feedbackSessionId: session._id,
        ...instFilter,
      });

      semesterData.push({
        semester: session.semester,
        sessionName: session.name,
        averageScore,
        responseCount,
      });
    }

    return semesterData;
  }

  // Aggregate Trend Report data
  static async getTrendReportData(courseId: string, branchId: string, institutionId?: string) {
    const instFilter = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};

    const sessions = await FeedbackSession.find({
      courseId,
      branchId,
      ...instFilter,
    }).sort({ academicYear: 1, semester: 1 });

    const trendData = [];
    for (const session of sessions) {
      const responses = await FeedbackResponse.find({
        feedbackSessionId: session._id,
        ...instFilter,
      });

      let scoreSum = 0;
      let scoreCount = 0;
      responses.forEach((res) => {
        res.ratings.forEach((r) => {
          scoreSum += r.rating;
          scoreCount++;
        });
      });

      const averageScore = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;
      const responseCount = await SubmissionStatus.countDocuments({
        feedbackSessionId: session._id,
        ...instFilter,
      });

      trendData.push({
        academicYear: session.academicYear,
        semester: session.semester,
        sessionName: session.name,
        averageScore,
        responseCount,
      });
    }

    return trendData;
  }

  // Aggregate Faculty Performance Ranking report data
  static async getFacultyPerformanceRankingData(filters: {
    sessionId?: string;
    courseId?: string;
    branchId?: string;
    semester?: string;
    academicYear?: string;
    institutionId?: string;
  }) {
    const instFilter = filters.institutionId ? { institutionId: new mongoose.Types.ObjectId(filters.institutionId) } : {};
    const matchQuery: any = { ...instFilter };

    if (filters.sessionId && filters.sessionId !== "all") {
      matchQuery.feedbackSessionId = filters.sessionId;
    }

    let branchFacultyIds: string[] = [];

    if (filters.branchId && filters.branchId !== "all") {
      const targetBranch = await Branch.findOne({ _id: filters.branchId, ...instFilter });
      let branchIdsToMatch: any[] = [filters.branchId];
      let branchCodesToMatch: string[] = [];
      if (targetBranch) {
        const equivalentBranches = await Branch.find({
          $or: [
            { _id: targetBranch._id },
            { code: { $regex: new RegExp(`^${targetBranch.code}$`, "i") } },
            { name: { $regex: new RegExp(`^${targetBranch.name}$`, "i") } },
          ],
          ...instFilter,
        });
        branchIdsToMatch = equivalentBranches.map((b) => b._id);
        branchCodesToMatch = equivalentBranches.map((b) => b.code.toUpperCase());
        if (targetBranch.code) branchCodesToMatch.push(targetBranch.code.toUpperCase());
      }

      matchQuery.branchId = { $in: branchIdsToMatch };

      const profiles = await FacultyProfile.find({
        $or: [
          { branchId: { $in: branchIdsToMatch } },
          { department: { $in: branchCodesToMatch } },
        ],
        ...instFilter,
      });

      const mappedIds = await FacultySubjectMapping.distinct("facultyId", {
        branchId: { $in: branchIdsToMatch },
        ...instFilter,
      });

      const combined = [
        ...profiles.map((p) => p._id.toString()),
        ...mappedIds.map((m) => m.toString()),
      ];
      branchFacultyIds = [...new Set(combined)];
    }

    if (filters.semester && filters.semester !== "all") {
      const semNum = parseInt(filters.semester, 10);
      if (!isNaN(semNum)) {
        matchQuery.semester = semNum;
      }
    }

    if (filters.academicYear && filters.academicYear !== "all") {
      matchQuery.academicYear = filters.academicYear;
    }

    const rawFacultyIds = await FeedbackResponse.distinct("facultyId", matchQuery);

    const facultyIds =
      branchFacultyIds.length > 0
        ? rawFacultyIds.filter((id) => branchFacultyIds.includes(id.toString()))
        : rawFacultyIds;

    const rankings = [];

    for (const facId of facultyIds) {
      const faculty = await FacultyProfile.findOne({ _id: facId, ...instFilter }).populate("branchId");
      if (!faculty) continue;

      const responses = await FeedbackResponse.find({
        ...matchQuery,
        facultyId: facId,
      });

      const responseCount = responses.length;
      if (responseCount < 1) continue;

      let scoreSum = 0;
      let scoreCount = 0;
      const subjectSet = new Set<string>();

      responses.forEach((res) => {
        if (res.subjectId) {
          subjectSet.add(res.subjectId.toString());
        }
        if (res.ratings && Array.isArray(res.ratings)) {
          res.ratings.forEach((r) => {
            if (r && typeof r.rating === "number" && !isNaN(r.rating)) {
              scoreSum += r.rating;
              scoreCount++;
            }
          });
        }
      });

      const averageRating = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;

      let subjectCount = subjectSet.size;
      if (subjectCount === 0) {
        subjectCount = await FacultySubjectMapping.countDocuments({
          facultyId: facId,
          status: "active",
          ...instFilter,
        });
      }
      subjectCount = Math.max(1, subjectCount);

      const branchObj = faculty.branchId as any;
      const branchName = branchObj?.code || branchObj?.name || faculty.department || "General";
      const semDisplay = responses[0]?.semester ? `Sem ${responses[0].semester}` : filters.semester ? `Sem ${filters.semester}` : "Sem 2";

      let grade = "C";
      if (averageRating >= 4.5) grade = "A+";
      else if (averageRating >= 4.0) grade = "A";
      else if (averageRating >= 3.5) grade = "B+";
      else if (averageRating >= 3.0) grade = "B";

      rankings.push({
        facultyId: faculty._id.toString(),
        employeeId: faculty.employeeId || faculty._id.toString().substring(0, 8),
        name: faculty.name,
        designation: faculty.designation || "Faculty Member",
        branch: branchName,
        semester: semDisplay,
        subjectCount,
        responseCount,
        averageRating,
        grade,
      });
    }

    rankings.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.responseCount !== a.responseCount) {
        return b.responseCount - a.responseCount;
      }
      return a.name.localeCompare(b.name);
    });

    const finalRankings = rankings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return {
      rankings: finalRankings,
      totalCount: finalRankings.length,
    };
  }
}
export default ReportsService;

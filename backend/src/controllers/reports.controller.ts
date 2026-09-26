import { Response, NextFunction } from "express";
import { ReportsService } from "../services/reports.service.js";
import { FacultyProfile } from "../models/profiles.model.js";
import { FeedbackSession } from "../models/feedback.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { CustomError } from "../middleware/errorHandler.js";

export class ReportsController {
  static async getMyFeedbackRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== "faculty") {
        throw new CustomError("Access denied: Faculty permissions required", 403);
      }
      const institutionId = req.user.institutionId || req.institutionId;
      const data = await ReportsService.getacadexaRecords(req.user.id, institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("My feedback records fetched", data));
    } catch (error) {
      next(error);
    }
  }

  static async getMyDepartmentDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== "hod" && req.user.role !== "admin")) {
        throw new CustomError("Access denied: HOD permissions required", 403);
      }
      const institutionId = req.user.institutionId || req.institutionId;
      const data = await ReportsService.getDepartmentDashboardData(req.user.id, institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Department dashboard data fetched", data));
    } catch (error) {
      next(error);
    }
  }

  static async getInstitutionScopeDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== "dean" && req.user.role !== "admin")) {
        throw new CustomError("Access denied: Dean permissions required", 403);
      }
      const institutionId = req.user.institutionId || req.institutionId;
      const data = await ReportsService.getDeanDashboardData(req.user.id, institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Institution scope dashboard data fetched", data));
    } catch (error) {
      next(error);
    }
  }

  static async getIndividualFacultyReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { facultyId, sessionId } = req.params;
      const format = (req.query.format as string || "json").toLowerCase();

      if (!req.user) {
        throw new CustomError("Unauthorized: Authentication required", 401);
      }

      const institutionId = req.user.institutionId || req.institutionId;
      const instIdStr = institutionId ? institutionId.toString() : undefined;

      const facultyProfile = await FacultyProfile.findOne({
        _id: facultyId,
        ...(institutionId ? { institutionId } : {}),
      });
      if (!facultyProfile) throw new CustomError("Faculty profile not found", 404);

      // Scoping Check:
      // Faculty: Can ONLY view their own report
      if (req.user.role === "faculty") {
        const myProfile = await FacultyProfile.findOne({
          userId: req.user.id,
          ...(institutionId ? { institutionId } : {}),
        });
        if (!myProfile || myProfile._id.toString() !== facultyId) {
          throw new CustomError("Access denied: You can only view your own feedback report", 403);
        }
      } else if (req.user.role === "hod") {
        const myProfile = await FacultyProfile.findOne({
          userId: req.user.id,
          ...(institutionId ? { institutionId } : {}),
        });
        if (myProfile && myProfile.department && facultyProfile.department !== myProfile.department) {
          throw new CustomError("Access denied: Faculty belongs to another department", 403);
        }
      } else if (req.user.role !== "admin" && req.user.role !== "dean") {
        throw new CustomError("Access denied: Unauthorized role", 403);
      }

      const data = await ReportsService.getIndividualFacultyData(facultyId, sessionId, instIdStr);

      if (format === "excel") {
        const buffer = await ReportsService.generateIndividualFacultyExcel(data, instIdStr);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=Faculty_Report_${facultyId}.xlsx`);
        return res.send(buffer);
      } else if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Faculty_Report_${facultyId}.pdf`);
        return ReportsService.generateIndividualFacultyPDF(data, res, instIdStr);
      } else {
        return res.status(200).json(ApiResponse.success("Individual report data fetched", data));
      }
    } catch (error) {
      next(error);
    }
  }

  static async getConsolidatedClassReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const format = (req.query.format as string || "json").toLowerCase();

      if (!req.user || !["admin", "hod", "dean"].includes(req.user.role)) {
        throw new CustomError("Access denied: Admin, HOD, or Dean permissions required", 403);
      }

      const institutionId = req.user.institutionId || req.institutionId;
      const instIdStr = institutionId ? institutionId.toString() : undefined;

      const session = await FeedbackSession.findOne({
        _id: sessionId,
        ...(institutionId ? { institutionId } : {}),
      });
      if (!session) throw new CustomError("Feedback session not found", 404);

      const data = await ReportsService.getConsolidatedClassData(sessionId, instIdStr);

      if (format === "excel") {
        const buffer = await ReportsService.generateConsolidatedClassExcel(data, instIdStr);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=Class_Report_${sessionId}.xlsx`);
        return res.send(buffer);
      } else if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Class_Report_${sessionId}.pdf`);
        return ReportsService.generateConsolidatedClassPDF(data, res, instIdStr);
      } else {
        return res.status(200).json(ApiResponse.success("Consolidated class report fetched", data));
      }
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { branchId, sessionId } = req.params;
      if (!req.user || !["admin", "hod", "dean"].includes(req.user.role)) {
        throw new CustomError("Access denied: Admin, HOD, or Dean permissions required", 403);
      }
      const institutionId = req.user.institutionId || req.institutionId;
      const data = await ReportsService.getDepartmentReportData(branchId, sessionId, institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Department report fetched", data));
    } catch (error) {
      next(error);
    }
  }

  static async getTrendReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { courseId, branchId } = req.params;
      if (!req.user || !["admin", "hod", "dean", "faculty"].includes(req.user.role)) {
        throw new CustomError("Access denied: Authorized role required", 403);
      }
      const institutionId = req.user.institutionId || req.institutionId;
      const data = await ReportsService.getTrendReportData(courseId, branchId, institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Historical trend report fetched", data));
    } catch (error) {
      next(error);
    }
  }
}
export default ReportsController;

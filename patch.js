const fs = require("fs");

const reportsServicePath = "backend/src/services/reports.service.ts";
let serviceContent = fs.readFileSync(reportsServicePath, "utf-8");

if (!serviceContent.includes("getacadexaRecords")) {
  const newMethod = `
  static async getacadexaRecords(facultyUserId: string) {
    const faculty = await FacultyProfile.findOne({ userId: facultyUserId }).populate("branchId");
    if (!faculty) throw new CustomError("Faculty profile not found", 404);

    const responses = await FeedbackResponse.find({ facultyId: faculty._id }).populate("subjectId");
    
    const recordsMap = new Map();
    for (const res of responses) {
      if (!res.subjectId) continue;
      const sessIdStr = res.feedbackSessionId.toString();
      const subj = res.subjectId as any;
      const subjIdStr = subj._id.toString();
      
      const key = \`\${sessIdStr}_\${subjIdStr}\`;
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
    for (const [key, data] of recordsMap.entries()) {
      const session = await FeedbackSession.findById(data.sessionId).populate("questions");
      if (!session) continue;
      
      let overallScoreSum = 0;
      let ratingCount = 0;
      
      const questionsList = session.questions as any[];
      const questionAverages = [];
      
      for (const q of questionsList) {
        let qSum = 0;
        let qCount = 0;

        data.responses.forEach((res) => {
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

        overallScoreSum += qSum;
        ratingCount += qCount;
      }
      
      const overallScore = ratingCount > 0 ? parseFloat((overallScoreSum / ratingCount).toFixed(2)) : 0.0;
      
      const reportData = {
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
        responseCount: data.responses.length,
        overallAverage: overallScore,
        questionAverages,
      };

      records.push({
        id: key,
        subjectName: data.subjectName,
        subjectCode: data.subjectCode,
        semester: session.semester.toString(),
        academicYear: session.academicYear,
        sessionName: session.name,
        responseCount: data.responses.length,
        overallScore,
        status: session.status,
        reportData
      });
    }
    
    return records;
  }
`;

  serviceContent = serviceContent.replace("export class ReportsService {", "export class ReportsService {" + newMethod);
  fs.writeFileSync(reportsServicePath, serviceContent);
}

const controllerPath = "backend/src/controllers/reports.controller.ts";
let controllerContent = fs.readFileSync(controllerPath, "utf-8");

if (!controllerContent.includes("getMyFeedbackRecords")) {
  const newMethod = `
  static async getMyFeedbackRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== "faculty") {
        throw new CustomError("Access denied: Faculty permissions required", 403);
      }
      const records = await ReportsService.getacadexaRecords(req.user.id);
      return res.status(200).json(ApiResponse.success("My feedback records fetched", { records }));
    } catch (error) {
      next(error);
    }
  }
`;

  controllerContent = controllerContent.replace("export class ReportsController {", "export class ReportsController {" + newMethod);
  fs.writeFileSync(controllerPath, controllerContent);
}

const routesPath = "backend/src/routes/reports.routes.ts";
let routesContent = fs.readFileSync(routesPath, "utf-8");

if (!routesContent.includes("/faculty/me")) {
  const newRoute = `
router.get(
  "/faculty/me",
  authenticate,
  authorize("faculty"),
  ReportsController.getMyFeedbackRecords
);
`;

  routesContent = routesContent.replace("const router = Router();", "const router = Router();" + newRoute);
  fs.writeFileSync(routesPath, routesContent);
}

console.log("Patch applied.");

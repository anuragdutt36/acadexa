import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import "./src/models/academic.model.js";
import "./src/models/institution.model.js";
import "./src/models/user.model.js";
import "./src/models/profiles.model.js";
import "./src/models/feedback.model.js";
import "./src/models/mapping.model.js";

import { User } from "./src/models/user.model.js";
import { FacultyProfile } from "./src/models/profiles.model.js";
import { ReportsService } from "./src/services/reports.service.js";
import { FeedbackResponse } from "./src/models/feedback.model.js";

async function checkAdityaDashboard() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/feedback");
  const user = await User.findOne({ username: "aditya@knit.ac.in" });
  console.log("User:", user?._id, user?.username, user?.role);

  const profile = await FacultyProfile.findOne({ email: "aditya@knit.ac.in" });
  console.log("Profile:", profile?._id, "userId:", profile?.userId, profile?.name);

  const responses = await FeedbackResponse.find({
    $or: [{ facultyId: profile?._id }, { facultyId: user?._id }]
  });
  console.log("FeedbackResponses found for Aditya:", responses.length);
  for (const r of responses) {
    console.log("Response:", r._id, "session:", r.feedbackSessionId, "subject:", r.subjectId, "faculty:", r.facultyId, "ratings count:", r.ratings?.length);
  }

  const reportsData = await ReportsService.getacadexaRecords(user!._id.toString());
  console.log("reportsData from ReportsService.getacadexaRecords:", JSON.stringify(reportsData, null, 2));

  process.exit(0);
}
checkAdityaDashboard().catch(e => { console.error(e); process.exit(1); });

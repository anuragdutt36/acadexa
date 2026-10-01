import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { RoleRoute } from "./RoleRoute.js";
import { DashboardLayout } from "../components/layout/DashboardLayout.js";

// Pages
import { LandingPage } from "../pages/LandingPage.js";
import { PlatformLandingPage } from "../pages/PlatformLandingPage.js";
import { LoginPage } from "../pages/auth/LoginPage.js";
import { InstitutionLoginPage } from "../pages/auth/InstitutionLoginPage.js";

// Helper to detect if currently on a college subdomain (e.g. knit.acadexa-fb.vercel.app)
const isTenantSubdomain = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  const platformDomains = ["acadexa-fb.vercel.app", "acadexa.in", "acadexa.com", "localhost"];
  for (const pDomain of platformDomains) {
    if (hostname.endsWith(`.${pDomain}`)) {
      const sub = hostname.replace(`.${pDomain}`, "");
      if (sub && sub !== "www" && sub !== "app" && sub !== "platform") {
        return true;
      }
    }
  }
  return false;
};

// Platform Admin Pages & Layout
import { PlatformProtectedRoute } from "./PlatformProtectedRoute.js";
import { PlatformAdminLayout } from "../components/layout/PlatformAdminLayout.js";
import { PlatformLoginPage } from "../pages/platform-admin/PlatformLoginPage.js";
import { PlatformDashboard } from "../pages/platform-admin/PlatformDashboard.js";
import { PlatformAuditLogsPage } from "../pages/platform-admin/PlatformAuditLogsPage.js";
import { PlatformNotificationLogsPage } from "../pages/platform-admin/PlatformNotificationLogsPage.js";
import { PlatformSettingsPage } from "../pages/platform-admin/PlatformSettingsPage.js";
import { PlatformApplicationsListPage } from "../pages/platform-admin/PlatformApplicationsListPage.js";
import { PlatformApplicationReviewPage } from "../pages/platform-admin/PlatformApplicationReviewPage.js";
import { PlatformApproveApplicationPage } from "../pages/platform-admin/PlatformApproveApplicationPage.js";
import { PlatformInstitutionsPage } from "../pages/platform-admin/PlatformInstitutionsPage.js";
import { ApplicationStatusPage } from "../pages/platform/ApplicationStatusPage.js";
import { InstitutionRegistrationPage } from "../pages/platform/InstitutionRegistrationPage.js";
import { ActivateInstitutionPage } from "../pages/auth/ActivateInstitutionPage.js";
import { TenantProvider } from "../context/TenantContext.js";

// Student Portal Pages
import { StudentDashboard } from "../pages/student/Dashboard.js";
import { FeedbackHistory } from "../pages/student/FeedbackHistory.js";
import { Notifications } from "../pages/student/Notifications.js";
import { HelpFAQ } from "../pages/student/HelpFAQ.js";
import { PrivacyPolicy } from "../pages/student/PrivacyPolicy.js";

// Feedback Form Page
import { FeedbackForm } from "../pages/feedback/FeedbackForm.js";

// Admin Portal Pages
import { AdminDashboard } from "../pages/admin/Dashboard.js";
import { AcademicStructure } from "../pages/admin/AcademicStructure.js";
import { Subjects } from "../pages/admin/Subjects.js";
import { Faculty } from "../pages/admin/Faculty.js";
import { QuestionBank } from "../pages/admin/QuestionBank.js";
import { Mapping } from "../pages/admin/Mapping.js";
import { FeedbackSessions } from "../pages/admin/FeedbackSessions.js";
import { Reports } from "../pages/admin/Reports.js";
import { Analytics } from "../pages/admin/Analytics.js";
import { AuditLogs } from "../pages/admin/AuditLogs.js";
import { Settings } from "../pages/admin/Settings.js";

// Faculty Portal Pages
import { FacultyDashboard } from "../pages/faculty/FacultyDashboard.js";
import { MyFeedback } from "../pages/faculty/MyFeedback.js";
import { FacultyProfile } from "../pages/faculty/FacultyProfile.js";

// Dean & HOD Shared Portal Pages
import { DeanHodDashboard } from "../pages/hod/DeanHodDashboard.js";
import { FacultyPerformance } from "../pages/hod/FacultyPerformance.js";
import { SubjectPerformance } from "../pages/hod/SubjectPerformance.js";
import { FeedbackTrends } from "../pages/hod/FeedbackTrends.js";
import { DeanHodReports } from "../pages/hod/DeanHodReports.js";
import { DeanHodProfile } from "../pages/hod/DeanHodProfile.js";
import { RouteTransitionLoader } from "../components/common/RouteTransitionLoader.js";

export const AppRouter: React.FC = () => {
  const hasSubdomain = isTenantSubdomain();

  return (
    <>
      <RouteTransitionLoader />
      <Routes>
      {/* Public Platform & College Root Routes */}
      <Route
        path="/"
        element={
          hasSubdomain ? (
            <TenantProvider>
              <LandingPage />
            </TenantProvider>
          ) : (
            <PlatformLandingPage />
          )
        }
      />
      <Route path="/platform" element={<PlatformLandingPage />} />
      <Route path="/product" element={<PlatformLandingPage />} />

      {/* Generic Platform Institution Login Gateway */}
      <Route path="/institution-login" element={<InstitutionLoginPage />} />
      <Route path="/select-institution" element={<InstitutionLoginPage />} />

      {/* College Tenant Portals (Dynamic Path /college/:slug and KNIT defaults) */}
      <Route
        path="/college/:slug"
        element={
          <TenantProvider>
            <LandingPage />
          </TenantProvider>
        }
      />
      <Route
        path="/college/:slug/login"
        element={
          <TenantProvider>
            <LoginPage />
          </TenantProvider>
        }
      />
      <Route
        path="/college/knit"
        element={
          <TenantProvider>
            <LandingPage />
          </TenantProvider>
        }
      />
      <Route
        path="/college/knit/login"
        element={
          <TenantProvider>
            <LoginPage />
          </TenantProvider>
        }
      />
      <Route
        path="/knit"
        element={
          <TenantProvider>
            <LandingPage />
          </TenantProvider>
        }
      />
      <Route
        path="/knit/login"
        element={
          <TenantProvider>
            <LoginPage />
          </TenantProvider>
        }
      />
      <Route
        path="/college-portal"
        element={
          <TenantProvider>
            <LandingPage />
          </TenantProvider>
        }
      />
      <Route
        path="/college-portal/login"
        element={
          <TenantProvider>
            <LoginPage />
          </TenantProvider>
        }
      />
      <Route
        path="/login"
        element={
          <TenantProvider>
            <LoginPage />
          </TenantProvider>
        }
      />

      <Route path="/register-institution" element={<InstitutionRegistrationPage />} />
      <Route path="/register" element={<InstitutionRegistrationPage />} />
      <Route path="/institution/register" element={<InstitutionRegistrationPage />} />
      <Route path="/application-status" element={<ApplicationStatusPage />} />
      <Route path="/status" element={<ApplicationStatusPage />} />
      <Route path="/activate-institution" element={<ActivateInstitutionPage />} />

      {/* Platform Admin Public Login */}
      <Route path="/platform-admin/login" element={<PlatformLoginPage />} />

      {/* Platform Admin Portal (Protected) */}
      <Route
        path="/platform-admin"
        element={
          <PlatformProtectedRoute>
            <PlatformAdminLayout />
          </PlatformProtectedRoute>
        }
      >
        <Route index element={<PlatformDashboard />} />
        <Route path="applications" element={<PlatformApplicationsListPage />} />
        <Route path="applications/:id" element={<PlatformApplicationReviewPage />} />
        <Route path="applications/:id/approve" element={<PlatformApproveApplicationPage />} />
        <Route path="institutions" element={<PlatformInstitutionsPage />} />
        <Route path="audit-logs" element={<PlatformAuditLogsPage />} />
        <Route path="notification-logs" element={<PlatformNotificationLogsPage />} />
        <Route path="settings" element={<PlatformSettingsPage />} />
      </Route>

      {/* Student Portal (Protected, role="student") */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="history" element={<FeedbackHistory />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="help" element={<HelpFAQ />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
      </Route>

      {/* Student Feedback Form (Protected, separate fullscreen view) */}
      <Route
        path="/feedback-form"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <FeedbackForm />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Admin Portal (Protected, role="admin") */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="structure" element={<AcademicStructure />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="faculty" element={<Faculty />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="mapping" element={<Mapping />} />
        <Route path="sessions" element={<FeedbackSessions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* HOD Portal (Protected, role="hod") */}
      <Route
        path="/hod"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["hod"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DeanHodDashboard />} />
        <Route path="faculty-performance" element={<FacultyPerformance />} />
        <Route path="subject-performance" element={<SubjectPerformance />} />
        <Route path="trends" element={<FeedbackTrends />} />
        <Route path="reports" element={<DeanHodReports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<DeanHodProfile />} />
        <Route path="settings" element={<DeanHodProfile />} />
        <Route path="help" element={<HelpFAQ />} />
      </Route>

      {/* Dean Portal (Protected, role="dean") */}
      <Route
        path="/dean"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["dean"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DeanHodDashboard />} />
        <Route path="faculty-performance" element={<FacultyPerformance />} />
        <Route path="subject-performance" element={<SubjectPerformance />} />
        <Route path="trends" element={<FeedbackTrends />} />
        <Route path="reports" element={<DeanHodReports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<DeanHodProfile />} />
        <Route path="settings" element={<DeanHodProfile />} />
        <Route path="help" element={<HelpFAQ />} />
      </Route>

      {/* Faculty Portal (Protected, role="faculty") */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["faculty"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="my-feedback" element={<MyFeedback />} />
        <Route path="reports" element={<MyFeedback />} />
        <Route path="profile" element={<FacultyProfile />} />
        <Route path="settings" element={<FacultyProfile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="help" element={<HelpFAQ />} />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

export default AppRouter;

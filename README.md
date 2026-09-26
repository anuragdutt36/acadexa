# Acadexa Platform — Multi-Institution Enterprise Edition

> A modern, multi-tenant academic evaluation platform engineered for universities, autonomous institutes, and engineering colleges. Built with cryptographic student anonymity, NAAC/NBA compliance analytics, and strict multi-tenant data isolation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248.svg)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

---

## 1. Platform Architecture Overview

The system establishes a clean separation between the parent **Acadexa Platform** (marketing, institution onboarding, application verification, and platform-wide monitoring) and individual **Isolated Institution Portals** (student evaluations, department mapping, faculty scorecards, and NAAC/NBA accreditation reports).

```
                              ┌─────────────────────────────────────────┐
                              │         PLATFORM ROOT DOMAIN            │
                              │       acadexa-fb.vercel.app        │
                              └────────────────────┬────────────────────┘
                                                   │
                   ┌───────────────────────────────┴───────────────────────────────┐
                   ▼                                                               ▼
    ┌─────────────────────────────┐                                 ┌─────────────────────────────┐
    │    PLATFORM LANDING PAGE    │                                 │    PLATFORM ADMIN PORTAL    │
    │  - Institution Registration │                                 │  - /platform-admin/login    │
    │  - Institution Login Gateway│                                 │  - 7-Point Verification     │
    │  - Status Tracking (/status)│                                 │  - Tenant Approval Engine   │
    │  - Platform Capabilities    │                                 │  - Multi-Tenant Directory   │
    │  - Request Live Demo        │                                 │  - Audit & Notification Logs│
    └──────────────┬──────────────┘                                 └──────────────┬──────────────┘
                   │                                                               │
                   │ (1. Application Submitted)                                    │
                   ▼                                                               │
    ┌─────────────────────────────┐                                                │
    │   Institution Application   │◄───────────────────────────────────────────────┘
    │   (Ref: FF-2026-XXXX)       │  (2. Verification & Provisioning)
    └──────────────┬──────────────┘
                   │
                   │ (3. Tenant Created & Activation Dispatched)
                   ▼
  ═══════════════════════════════════════════════════════════════════════════════════════════════
                             ISOLATED INSTITUTION TENANT WORKSPACES
  ═══════════════════════════════════════════════════════════════════════════════════════════════
                   │                                                               │
                   ▼                                                               ▼
    ┌─────────────────────────────┐                                 ┌─────────────────────────────┐
    │       KNIT SULTANPUR        │                                 │   OTHER APPROVED COLLEGES   │
    │      Tenant ID: INS-0001    │                                 │      Tenant ID: INS-XXXX    │
    │   /college/knit (Subdomain) │                                 │  /college/:slug (Subdomain) │
    ├─────────────────────────────┤                                 ├─────────────────────────────┤
    │ • Dynamic College Branding  │                                 │ • Dynamic College Branding  │
    │ • Departmental Hierarchies  │                                 │ • Departmental Hierarchies  │
    │ • Anonymous Student Surveys │                                 │ • Anonymous Student Surveys │
    │ • NAAC/NBA Export Reports   │                                 │ • NAAC/NBA Export Reports   │
    │ • Strict Tenant Isolation   │                                 │ • Strict Tenant Isolation   │
    └─────────────────────────────┘                                 └─────────────────────────────┘
```

---

## 2. Platform vs. Institution Portals

| Aspect | Acadexa Platform | Individual Institution Portal (e.g. KNIT) |
|---|---|---|
| **Audience** | University leaders, Deans, Platform Operators | Enrolled Students, Faculty Members, College HODs/Admins |
| **Theme & UI** | Clean Light Academic Theme (`#FFFFFF`, `#F8FAFC`, blue `#0B3D91` accents) | Institutional Branded Theme |
| **Authentication** | Platform Admin Login (`/platform-admin/login`) | Google Workspace SSO & College Admin (`/college/:slug/login`) |
| **Key Actions** | Register Institution, Track Status, Review Applications, System Health | Submit Anonymous Feedback, View Subject Scorecards, NAAC/NBA Dossiers |
| **Primary Route** | `/`, `/platform`, `/institution-login` | `/college/:slug` (or `{slug}.acadexa-fb.vercel.app`) |

---

## 3. Authentication & Login Switching Architecture

The platform supports distinct authentication realms without cross-contamination of sessions:

1. **Platform Admin Login** (`/admin`):
   - Authenticates Super Administrators against the `PlatformAdmin` collection.
   - Clean, light-themed authentication card with robust error handling.
   - Strictly isolated; no toggles or links to public institution portals.
2. **Simplified Institution Login Gateway** (`/login` or `/institution-login`):
   - Accessible from the Platform Landing Page.
   - Allows users to search active colleges, select their campus, or enter a direct subdomain/slug (e.g. `knit`).
   - Seamlessly routes users to their college login (`/college/:slug/login`).
   - Strictly isolated; no hidden toggles to Platform Admin.
3. **Tenant-Specific College Login** (`/college/:slug/login` or `/knit/login`):
   - Authenticates students (via domain-restricted Google Workspace OAuth or verified email) and college admins (via salted password).
   - Scoped strictly to the active `institutionId`.

---

## 4. Secure Passwordless Authentication Architecture

The system implements strict, passwordless authentication for institutional users (Students, Faculty, HODs, Deans):

1. **Google Identity Verification:** Users authenticate via their official institutional Google account using `google-auth-library`.
2. **Tenant Resolution:** The system extracts the email domain (e.g., `@knit.ac.in`) and matches it to the active `Institution` tenant.
3. **Database Authorization:** Identity does NOT guarantee access. The backend queries `FacultyProfile` and `StudentProfile` to ensure the user is an **authorized, active member** of the specific institution.
4. **Role-Based Access Control (RBAC):** Roles (Faculty, HOD, Dean, Student) are securely assigned server-side based on database records. The frontend does not determine roles, preventing tampering.
5. **Session Security:** JWT access and refresh tokens are securely transmitted via `HttpOnly`, `Secure`, `SameSite=Strict` cookies instead of `localStorage`.

---

## 5. Institution-First Landing Pages & Campus Hero Backgrounds

Individual institution portals (e.g. `knit.acadexa-fb.vercel.app` or `/college/knit`) are designed to feel strictly like the college's official feedback site, completely separate from platform marketing:

1. **Clean Academic Header**: Displays official college logo, institution name, streamlined navigation, and a single **`[Access Portal]`** CTA.
2. **Cloudinary Campus Hero Background (1–3 Images & Automatic 7-Second Crossfade)**:
   - Institution Administrators can upload 1, 2, or 3 campus photos via **Admin Settings $\rightarrow$ Appearance**.
   - Images are stored per-tenant and preloaded into browser memory to eliminate white flashing during transitions.
   - Smooth **7-second display window** with a subtle **1.5–2s opacity crossfade** (`transition-opacity duration-[1800ms]`).
   - Strictly atmospheric: ~10% opacity, 12px blur, reduced saturation, and dark navy scrim (WCAG AAA compliant text contrast).
   - Zero horizontal/vertical slide motion, zero zoom, zero Ken Burns, and zero layout shift or extra scrollbars.
   - Respects `prefers-reduced-motion`: automatically freezes on a static primary image if reduced motion is requested.
3. **Database-Driven Active Session Status Logic**:
   - Strictly scoped by `institutionId` (zero global un-filtered session leaks).
   - Automatically excludes soft-deleted, expired, or inactive sessions via date validation (`startDate <= now <= endDate`).
   - If an active session exists, displays the live session title, academic session, and quick action.
   - If no live session exists (or after session deletion), renders a clean institutional empty state: *"No feedback session is currently live. Please check back when the institution opens the next evaluation window."*
4. **Structured Academic Information**: Includes Purpose Statement, 4-step Workflow (01 Sign In, 02 Evaluate, 03 Submit Confidentially, 04 Academic Review), FAQ Accordion, and official academic footer.

---

## 5. Multi-Tenant Routing & Hostname Resolution

The system seamlessly supports two routing strategies across production and local development:

### Strategy A: Subdomain-Based Routing (Production)
- **Root Platform Landing**: `acadexa-fb.vercel.app` / `acadexa.in`
- **College-Specific Portal**: `{slug}.acadexa-fb.vercel.app` (e.g. `knit.acadexa-fb.vercel.app`)
- When a user visits a tenant subdomain, the root `/` automatically renders the institution's dedicated portal without platform marketing.

### Strategy B: Path-Based Routing (Development & Demos)
- **Platform Landing Page**: `http://localhost:5173/`
- **Institution Login Gateway**: `http://localhost:5173/institution-login`
- **KNIT Portal (Default Tenant)**: `http://localhost:5173/college/knit` or `/knit`
- **Dynamic College Portal**: `http://localhost:5173/college/:slug`

---

## 6. Institution Onboarding & Lifecycle Workflow

1. **Registration Flow**:
   - Institutional representatives visit `/register-institution`, `/register`, or click **Register Your Institution** on the platform landing page.
   - Designed as a wide, structured 2-column card (`max-w-5xl`) optimized to fit within standard desktop/laptop viewports without vertical page scrolling.
   - Sections cover Institution Information (Name, Type, Website, Email, City, State), Contact Details (Representative, Email, Phone, Designation), and Verification/Affiliation records.
   - Automatically checks **Official Email Domain Verification Signals** and generates a unique Application Reference ID (e.g. `FF-2026-0001`).
2. **Public Status Tracking**:
   - Applicants can track their onboarding verification in real-time at `/application-status` using their Reference ID and Representative Email.
3. **Platform Admin Verification**:
   - Platform Administrators review applications at `/platform-admin/applications/:id` with a 7-point statutory checklist.
4. **Tenant Provisioning & Administrator Account Creation**:
   - On approval, the platform automatically provisions an isolated `Institution` record and generates the root institutional administrator account with an activation token.
5. **Transactional Email Notification**:
   - Dispatches formal approval notifications with an activation link (`/activate-institution?token=...&ref=...`) to the applicant's official email via Web3Forms API.
6. **Administrator Activation**:
   - Representative accesses `/activate-institution`, sets a permanent password, and logs into their isolated institutional workspace.

---

## 7. Theme Architecture & Color System

The platform uses a clean, light-themed visual design inspired by modern institutional software (such as Google Workspace and Google Admin) for maximum clarity and trustworthiness:

- **Base Background**: `#FFFFFF` / `#F8FAFC` (Light neutral gray and crisp white)
- **Cards & Surfaces**: `#FFFFFF` with subtle borders (`border-slate-200`) and minimal shadows (`shadow-xs` / `shadow-sm`)
- **Typography**:
  - Headings: Crisp Navy/Charcoal (`text-slate-900 font-bold`, `Plus Jakarta Sans`)
  - Body Text: High-contrast Slate (`text-slate-600` and `text-slate-500`)
- **Primary Accent**: Institutional Royal Blue (`#0B3D91` / `#2563EB`)
- **Success & Status**: Restrained Emerald (`#059669`) and Amber (`#D97706`)
- **Stability & Performance**: Zero scroll-jacking, zero layout shifts, completely responsive across Mobile, Tablet, and Desktop.

---

## 8. Portals & Default Credentials

### Platform Administration Portal
- **URL**: [`/platform-admin/login`](http://localhost:5173/platform-admin/login)
- **Email / Username**: `<Hidden for security>`
- **Password**: `<Hidden for security>`
- **Role**: `superadmin`

### Default College Portal (KNIT Sultanpur)
- **URL**: [`/college/knit`](http://localhost:5173/college/knit) or [`/college/knit/login`](http://localhost:5173/college/knit/login)
- **Admin Username**: `<Hidden for security>`
- **Admin Password**: Configured via `DEFAULT_ADMIN_PASSWORD` or `<Hidden for security>`
- **Student Login**: Google Workspace OAuth / Enrolled institutional email

---

## 9. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 6, React Router v7 |
| **Styling** | Clean Light Institutional Design System, Lucide React Icons |
| **Backend** | Node.js, Express.js (ESM), TypeScript |
| **Database** | MongoDB 7.x, Mongoose ODM |
| **Authentication** | Dual-Layer JWT (Platform Admin vs Tenant Users), bcrypt, Google OAuth |
| **Transactional Email** | Web3Forms REST API (Configured with fallback logging) |
| **File Export** | PDFKit (PDF), ExcelJS (Excel) for NAAC/NBA scorecards |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, CORS origin isolation |

---

## 10. Installation & Local Setup

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB running locally on port `27017` (or MongoDB Atlas URI)

### 2. Environment Setup
```bash
# In project root:
cp .env.example .env
```

**Key Environment Variables (`.env` & `backend/src/config/env.ts`):**
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/knit-feedback
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key
DEFAULT_PLATFORM_ADMIN_EMAIL=<your-admin-email>
DEFAULT_PLATFORM_ADMIN_PASSWORD=<your-admin-password>
WEB3FORMS_ACCESS_KEY=<your-web3forms-key>
```

### 3. Install & Start Backend
```bash
cd backend
npm install
npm run dev
# Backend running at http://localhost:5001
```

### 4. Install & Start Frontend
```bash
# In project root:
npm install
npm run dev
# Frontend running at http://localhost:5173
```

---

## 11. Directory Structure

```
Faculty-Feedback-Management-System/
├── src/                                  # React Frontend
│   ├── app/                              # App root & providers
│   ├── components/
│   │   ├── layout/                       # PlatformAdminLayout, DashboardLayout, Footer
│   │   ├── platform/                     # InstitutionRegistrationModal
│   │   └── common/                       # LogoMark, AnimatedCounter, UI primitives
│   ├── context/                          # PlatformAuthContext, TenantContext, SettingsContext, AuthContext
│   ├── pages/
│   │   ├── platform-admin/               # Dashboard, Applications, Review, Institutions, Audit, PlatformLoginPage
│   │   ├── platform/                     # ApplicationStatusPage
│   │   ├── admin/                        # College admin structure, mapping, sessions, reports
│   │   ├── student/                      # Student dashboard, feedback form, history
│   │   ├── auth/                         # InstitutionLoginPage, LoginPage (KNIT), ActivateInstitutionPage
│   │   ├── LandingPage.tsx               # Isolated KNIT / Tenant Landing Page
│   │   └── PlatformLandingPage.tsx       # Root Acadexa Platform Landing Page
│   └── routes/                           # AppRouter, PlatformProtectedRoute, RoleRoute, ProtectedRoute
│
├── backend/                              # Express TypeScript Backend
│   └── src/
│       ├── config/                       # env.ts, database.ts
│       ├── controllers/                  # platformAdmin, institutionApplication, publicInstitution
│       ├── middleware/                   # platformAuth, tenantResolver, auth, rateLimiter
│       ├── models/                       # PlatformAdmin, Institution, InstitutionApplication, Audit
│       ├── routes/                       # platformAdmin, application, publicInstitution, auth
│       ├── services/                     # platformAdmin, institutionApproval, emailNotification
│       └── seed/                         # seed.service.ts (Idempotent Platform & KNIT seed)
└── README.md
```

---

## 12. Role-Based Data Scoping & Reporting Architecture

The platform enforces strict, database-driven data flow and analytics across all user roles without relying on fake, hardcoded, or client-side filtered data:

### 12.1 End-to-End Feedback Data Flow
```
Institution Admin (Maps Faculty & Subject, Creates Session)
       │
       ▼
Student Eligible & Receives Session Notification
       │
       ▼
Student Submits Anonymous Ratings (Likert 1-5 & Remarks)
       │
       ▼
Database Storage (FeedbackResponse with facultyId, subjectId, branchId, semester, academicYear, institutionId)
       │
       ▼
Backend Aggregation Engines (ReportsService & AnalyticsService)
       │
  ┌────┴───────────────────────────┬──────────────────────────────┐
  ▼                                ▼                              ▼
Faculty Dashboard            HOD Dashboard                  Dean Dashboard
(Personal Scorecards)        (Department Analytics)         (Institute Benchmarking)
```

### 12.2 Dashboard Analytics Engines
- **Faculty Dashboard (`GET /api/reports/faculty/me`)**:
  - Aggregates overall score, evaluated courses, total student responses, and subject-wise scorecards strictly for the authenticated faculty member.
- **HOD Dashboard (`GET /api/reports/department/my-dept`)**:
  - Aggregates department-wide average score, student response rate, active sessions count, evaluated faculty count, and departmental faculty rankings for the authenticated HOD's department.
- **Dean Dashboard (`GET /api/reports/institution/scope`)**:
  - Aggregates institution-wide performance metrics, overall response rate, departmental benchmarking rankings, and faculty performance rankings across the entire campus.

### 12.3 Privacy, Isolation & Compliance Guarantees
- **Tenant Isolation**: Every database query strictly filters by `institutionId` (e.g. KNIT data is completely isolated from other colleges).
- **Server-Side Authorization**: Scope is derived exclusively from the authenticated session (`req.user.id`, `req.user.role`, `req.user.institutionId`), rendering client-side parameter tampering impossible.
- **Cryptographic Student Anonymity**: Student identities, roll numbers, and emails are never attached to evaluation payloads in database persistence.
- **Historical Session Preservation**: Completed and closed feedback sessions remain permanently accessible in reporting dossiers for NAAC/NBA statutory compliance.

---

## 13. Institution Branding & Cloudinary Asset Isolation Architecture

The platform enforces end-to-end multi-tenant isolation for all branding assets (college logos, campus hero/cover images, system names, and themes) across the storage layer, database layer, and frontend client:

### 13.1 Cloudinary Folder & Public ID Namespacing
Uploads are dynamically namespaced per institution, guaranteeing that institutions never overwrite or delete each other's assets:
- **Logos**: `institutions/{institutionId}/logo_{timestamp}`
- **Campus Cover Images**: `institutions/{institutionId}/covers/{imageId}`
- **Local Disk Fallback**: `uploads/institutions/{institutionId}/logo/` and `uploads/institutions/{institutionId}/covers/`

```
Cloudinary Asset Root
       │
       ├── institutions/INS-2026-0001/ (KNIT Sultanpur)
       │      ├── logo_1725801234
       │      └── covers/
       │             ├── img_hero_01
       │             └── img_library_02
       │
       └── institutions/INS-2026-0002/ (Apex Institute)
              ├── logo_1725805678
              └── covers/
                     └── img_campus_01
```

### 13.2 Deletion & Replacement Authorization Guards
- **Strict Ownership Verification**: Before any asset deletion is dispatched (`cloudinary.uploader.destroy`), the backend verifies that the targeted public ID explicitly belongs to the requesting institution's namespace (`institutions/${tenantId}/`).
- **Cross-Tenant Attack Prevention**: Any attempt by Institution B to delete, overwrite, or mutate Institution A's branding assets is blocked and rejected with an access denial.
- **Safe Replacement**: Uploading a new logo automatically schedules the previous logo belonging to that specific tenant for cleanup, preventing orphaned storage without affecting any other tenant.

### 13.3 Database Scoping & Zero-Fallback Guarantees
- **Compound & Unique Tenant Indexing**: The `SystemSettings` schema indexes `institutionId` with `{ unique: true, sparse: true }`. Each tenant maintains exactly one dedicated configuration record.
- **No Global Queries**: `SettingsService.getSettings()` and `updateSettings()` never perform unfiltered `findOne({})` queries.
- **Clean Slate Provisioning**: Newly approved institutions start with 0 logos and 0 cover images.
- **Neutral Default Fallbacks**: If an institution has no logo or cover images uploaded, the portal renders the institution's own placeholder (graduation cap icon and dark atmospheric scrim). It NEVER falls back to another institution's branding.

### 13.4 Frontend State & Cache Isolation
- **Tenant-Scoped Caching**: Client-side storage is partitioned by institution identifier (`tenant_{slug}_logo`, `currentInstitutionSlug`). Global, un-scoped localStorage keys for branding are permanently removed.
- **Clean Portal Switching**: Navigating between institution portals immediately invalidates and reloads the active tenant's branding in React state, preventing cross-tenant visual bleed.

---

## 14. Platform Admin Institution Onboarding & Governance Architecture

The Platform Administration system manages multi-tenant institution registration, verification, automated provisioning, and tenant governance:

### 14.1 Application Lifecycle Workflow
```
Institution Registration (College Code / Slug Captured)
       │
       ▼
Pending Verification (Database Status: PENDING)
       │
       ▼
Platform Admin Review & Checklist (Database Status: UNDER_REVIEW)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
Approved (Database Status: APPROVED)  Rejected (Database Status: REJECTED)
       │                                 │
       ▼                                 ▼
Tenant Provisioned (URL & Admin)    Reason Logged & Dispatched
       │
       ▼
Active Institution (Database Status: ACTIVE) ◄──► Suspended (Database Status: SUSPENDED)
```

### 14.2 Technical Onboarding Rules
- **Idempotent Approval:** Approving an institution multiple times safely returns the existing tenant and administrator details without creating duplicate records or throwing error exceptions.
- **Automated Academic Master Data Seeding:** Upon approval, initial academic master data (Courses like B.Tech/MCA, Branches, Evaluation Question Bank, Faculty Accounts with institution domain, Mappings, Roll Mappings, and Sessions) is provisioned for the new tenant ID.
- **Institution Slug & Custom URL:** Custom URL slug (e.g. `/college/recbanda`) is generated based on registered `collegeCode` or custom slug, yielding URL `http://localhost:5173/college/recbanda`.
- **Initial Admin Account:** Creates root admin account (`User` with role `admin`) and generates initial credentials (`Admin@<slug>2026!`).
- **Web3Forms Dispatch:** Dispatches formal activation email via Web3Forms API.
- **Platform Audit Logging:** All state changes (`APPLICATION_SUBMITTED`, `APPLICATION_REVIEW_STARTED`, `APPLICATION_APPROVED`, `APPLICATION_REJECTED`, `INSTITUTION_SUSPENDED`, `INSTITUTION_REACTIVATED`) produce immutable `PlatformAuditLog` entries.
- **Tenant Isolation & Suspension Enforcement:** When an institution is suspended, access to its portal (`/college/:slug`) is blocked with a suspension notice, while preserving all database records intact.

---

## 15. License

This project is licensed under the [MIT License](LICENSE).
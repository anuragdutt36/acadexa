# System Architecture

**Acadexa — KNIT Sultanpur**

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                            │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │              React + Vite Frontend (Port 5173)            │   │
│   │                                                           │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │   │
│   │  │  Admin   │  │ Student  │  │  Faculty │  │   HOD   │  │   │
│   │  │  Portal  │  │  Portal  │  │  Portal  │  │  Portal │  │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │   │
│   │                                                           │   │
│   │  Context: AuthContext | ThemeContext | SettingsContext    │   │
│   │  Router: React Router v7 (role-based protected routes)   │   │
│   │  Services: Axios-based API service layer                 │   │
│   └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              │ JWT Auth Header
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│               Node.js + Express Backend (Port 5001)              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Middleware Layer                       │    │
│  │  Helmet | CORS | Rate Limiter | Morgan | Mongo Sanitize  │    │
│  │  JWT Authentication | Role Authorization | Error Handler │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────────────────┐  │
│  │    Routes    │ │  Controllers   │ │       Services        │  │
│  │  (12 groups) │→│  (12 modules) │→│  (Business Logic)     │  │
│  └──────────────┘ └────────────────┘ └───────────────────────┘  │
│                                               │                  │
│  ┌───────────────┐  ┌────────────┐  ┌────────────────────────┐  │
│  │    Models     │  │    Jobs    │  │       Utilities        │  │
│  │  (Mongoose)   │  │ (AutoClose)│  │  logger | apiResponse  │  │
│  │  9 schemas    │  │            │  │  auditLogger           │  │
│  └───────────────┘  └────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MongoDB Database                               │
│                (mongodb://127.0.0.1:27017/knit-feedback)         │
│                                                                  │
│   16 Collections: users, studentprofiles, facultyprofiles,       │
│   courses, branches, subjects, facultysubjectmappings,           │
│   rollmappings, feedbacksessions, questions, feedbackresponses,  │
│   submissionstatuses, systemsettings, auditlogs, notifications   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Tech Stack
- **React 18** with TypeScript
- **Vite 6** as the build tool
- **React Router v7** for client-side routing
- **Recharts** for analytics charts
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **PDFKit / ExcelJS** (via backend) for report exports

### Component Hierarchy
```
App
└── BrowserRouter
    └── SettingsProvider
        └── AuthProvider
            └── ThemeProvider
                └── AppRouter
                    ├── Public Routes
                    │   ├── / → LandingPage
                    │   └── /login → LoginPage
                    ├── Student Routes (ProtectedRoute + RoleRoute)
                    │   └── DashboardLayout
                    │       ├── /student → StudentDashboard
                    │       ├── /student/history → FeedbackHistory
                    │       ├── /student/notifications → Notifications
                    │       ├── /student/help → HelpFAQ
                    │       └── /student/privacy → PrivacyPolicy
                    ├── /feedback-form → FeedbackForm (fullscreen)
                    ├── Admin Routes (ProtectedRoute + RoleRoute)
                    │   └── DashboardLayout
                    │       ├── /admin → AdminDashboard
                    │       ├── /admin/structure → AcademicStructure
                    │       ├── /admin/subjects → Subjects
                    │       ├── /admin/faculty → Faculty
                    │       ├── /admin/questions → QuestionBank
                    │       ├── /admin/mapping → Mapping
                    │       ├── /admin/sessions → FeedbackSessions
                    │       ├── /admin/reports → Reports
                    │       ├── /admin/analytics → Analytics
                    │       ├── /admin/audit → AuditLogs
                    │       └── /admin/settings → Settings
                    ├── HOD Routes → Reports access only
                    └── Faculty Routes → Reports + Trends access
```

### State Management
Global state is managed via React Context:
- **`AuthContext`** — logged-in user, JWT token, login/logout
- **`ThemeContext`** — dark/light mode toggle
- **`SettingsContext`** — system name, logo, feature flags (fetched from backend)

---

## Backend Architecture

### Tech Stack
- **Node.js** with **Express.js**
- **TypeScript**
- **Mongoose** (MongoDB ODM)
- **JWT** for authentication
- **bcrypt** for password hashing
- **PDFKit** for PDF generation
- **ExcelJS** for Excel export
- **Winston** for structured logging
- **Helmet / express-rate-limit** for security

### Request Flow
```
HTTP Request
    │
    ▼
Express Middleware Stack
  (Helmet → CORS → Rate Limiter → Morgan → Body Parser → Mongo Sanitize)
    │
    ▼
Route Handler (e.g., /api/sessions)
    │
    ▼
Auth Middleware (authenticate → authorize by role)
    │
    ▼
Controller (validates input, calls service)
    │
    ▼
Service (business logic, DB operations)
    │
    ▼
Mongoose Model (query MongoDB)
    │
    ▼
JSON Response → Client
```

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS in production; CORS whitelist |
| Authentication | JWT (HS256), short-lived access tokens |
| Authorization | Role-based middleware (`admin`, `student`, `faculty`, `hod`) |
| Input Sanitization | express-mongo-sanitize prevents NoSQL injection |
| HTTP Headers | Helmet sets secure headers (CSP, HSTS, etc.) |
| Rate Limiting | 1000 req / 15 min per IP |
| Password Storage | bcrypt with cost factor 12 |
| Audit Trail | All admin mutations logged to `auditlogs` collection |

---

## Data Flow: Feedback Submission

```
Student Login
    │
    ▼
Roll Number → RollMapping lookup → assign courseId/branchId/year/semester
    │
    ▼
GET /api/student/active-feedback
  → Find FeedbackSessions where course/branch/semester match
  → autoUpdateSessionStatuses() checks start/end dates
    │
    ▼
Student selects a session → navigates to /feedback-form
    │
    ▼
FeedbackForm loads mappings (faculty ↔ subjects) for that session
    │
    ▼
Student submits ratings per question per faculty
    │
    ▼
POST /api/feedback/submit
  → Creates FeedbackResponse documents
  → Creates/updates SubmissionStatus
    │
    ▼
Admin views Reports / Analytics
  → Aggregated by faculty, branch, semester
  → Exported as PDF or Excel
```

---

## Folder Structure

```
Faculty-Feedback-Management-System/
│
├── frontend (project root — Vite/React)
│   ├── src/
│   │   ├── app/            # App.tsx root component
│   │   ├── components/
│   │   │   ├── common/     # Badge, Button, Card, Input, Table...
│   │   │   ├── layout/     # Header, Sidebar, Footer, DashboardLayout
│   │   │   └── admin/      # AdminShared, RollMappingTab
│   │   ├── context/        # AuthContext, ThemeContext, SettingsContext
│   │   ├── hooks/          # useDebounce
│   │   ├── pages/
│   │   │   ├── admin/      # 11 admin page components
│   │   │   ├── student/    # 5 student page components
│   │   │   ├── auth/       # LoginPage
│   │   │   └── feedback/   # FeedbackForm
│   │   ├── routes/         # AppRouter, ProtectedRoute, RoleRoute
│   │   ├── services/       # 12 API service modules
│   │   ├── styles/         # globals.css, theme.css, fonts.css
│   │   └── types/          # TypeScript type definitions
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── app.ts          # Express app setup
│   │   ├── server.ts       # Server entry point
│   │   ├── config/         # db.ts (MongoDB connection)
│   │   ├── controllers/    # 12 controller modules
│   │   ├── services/       # 12 service modules (business logic)
│   │   ├── routes/         # 12 route modules
│   │   ├── models/         # 9 Mongoose schema models
│   │   ├── middleware/     # auth.ts, errorHandler.ts, validate.ts
│   │   ├── utils/          # logger, apiResponse, auditLogger
│   │   ├── seed/           # SeedService + index entry point
│   │   ├── jobs/           # sessionAutoClose.job.ts
│   │   └── validators/     # Input validation schemas
│   ├── uploads/            # Uploaded files (logos, photos)
│   ├── tsconfig.json
│   └── package.json
│
├── docs/
│   ├── API_Documentation.md
│   ├── Database_Schema.md
│   ├── Architecture.md
│   └── Screenshots/
│
├── .gitignore
├── .env.example
├── README.md
├── LICENSE
└── deploy.md
```

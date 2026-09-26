# Database Schema

**Acadexa — MongoDB / Mongoose**

---

## Collections Overview

| Collection | Model File | Description |
|------------|------------|-------------|
| `users` | `user.model.ts` | Authentication accounts (admin, student, faculty, hod) |
| `studentprofiles` | `profiles.model.ts` | Extended student profile data |
| `facultyprofiles` | `profiles.model.ts` | Extended faculty profile data |
| `courses` | `academic.model.ts` | Degree programs (B.Tech, MCA, M.Tech) |
| `branches` | `academic.model.ts` | Specializations/departments per course |
| `subjects` | `academic.model.ts` | Subjects with course/branch/semester association |
| `facultysubjectmappings` | `mapping.model.ts` | Faculty assigned to subjects |
| `rollmappings` | `rollMapping.model.ts` | Roll number ranges mapped to branches/years |
| `feedbacksessions` | `feedback.model.ts` | Active/scheduled/closed feedback windows |
| `questions` | `feedback.model.ts` | Question bank for feedback forms |
| `feedbackresponses` | `feedback.model.ts` | Individual student responses |
| `submissionstatuses` | `feedback.model.ts` | Tracks which student submitted for which session |
| `activesubmissiontokens` | `feedback.model.ts` | In-progress anonymous submission tokens |
| `systemsettings` | `settings.model.ts` | Admin-configured system-wide settings |
| `auditlogs` | `audit.model.ts` | Admin action audit trail |
| `notifications` | `notification.model.ts` | Student notification messages |

---

## Schema Definitions

### `users`
```
_id         ObjectId
username    String (unique, required) — email or roll number
password    String (bcrypt hashed)
role        Enum: "admin" | "student" | "faculty" | "hod"
status      Enum: "active" | "inactive"  default: "active"
createdAt   Date (auto)
updatedAt   Date (auto)
```

### `studentprofiles`
```
_id           ObjectId
userId        ObjectId → users._id
rollNo        String (unique, required)
name          String
email         String
phone         String
courseId      ObjectId → courses._id
branchId      ObjectId → branches._id
currentYear   Number
currentSem    Number
photoUrl      String
status        Enum: "active" | "inactive"
createdAt     Date (auto)
```

### `facultyprofiles`
```
_id           ObjectId
userId        ObjectId → users._id
employeeId    String (unique, required)
name          String
email         String
phone         String
department    String
designation   String
branchId      ObjectId → branches._id
photoUrl      String
status        Enum: "active" | "inactive"
createdAt     Date (auto)
```

### `courses`
```
_id       ObjectId
name      String (unique, required) — "Bachelor of Technology"
duration  Number — years (e.g., 4 for B.Tech, 2 for MCA)
status    Enum: "active" | "inactive"  default: "active"
```

### `branches`
```
_id             ObjectId
code            String (unique, required) — "CSE", "MCA"
name            String
courseId        ObjectId → courses._id
coordinatorId   ObjectId → facultyprofiles._id (optional)
status          Enum: "active" | "inactive"  default: "active"
```

### `subjects`
```
_id        ObjectId
code       String (unique, required) — "MCA101"
name       String
courseId   ObjectId → courses._id
branchId   ObjectId → branches._id
semester   Number
credits    Number
status     Enum: "active" | "inactive"  default: "active"
```

### `facultysubjectmappings`
```
_id         ObjectId
facultyId   ObjectId → facultyprofiles._id
subjectId   ObjectId → subjects._id
courseId    ObjectId → courses._id
branchId    ObjectId → branches._id
semester    Number
status      Enum: "active" | "inactive"  default: "active"
createdAt   Date (auto)
```

### `rollmappings`
```
_id              ObjectId
startRoll        String — start of roll number range
endRoll          String — end of roll number range
courseId         ObjectId → courses._id
branchId         ObjectId → branches._id
currentYear      Number
currentSemester  Number
academicSession  String — "2025-26"
```

### `feedbacksessions`
```
_id           ObjectId
name          String
courseId      ObjectId → courses._id
branchId      ObjectId → branches._id
year          Number
semester      Number
academicYear  String — "2025-26"
status        Enum: "scheduled" | "active" | "closed"
startDate     Date
endDate       Date
questions     [ObjectId] → questions._id[]
createdAt     Date (auto)
```

### `questions`
```
_id       ObjectId
code      String (unique) — "Q01"
text      String — the question text
category  String — "Teaching Effectiveness"
weight    Number  default: 1.0
order     Number — display order
status    Enum: "active" | "inactive"  default: "active"
```

### `feedbackresponses`
```
_id           ObjectId
sessionId     ObjectId → feedbacksessions._id
mappingId     ObjectId → facultysubjectmappings._id
studentId     ObjectId → studentprofiles._id (null if anonymous)
isAnonymous   Boolean
responses     [{ questionId: ObjectId, rating: Number 1–5, comment: String }]
submittedAt   Date (auto)
```

### `submissionstatuses`
```
_id           ObjectId
studentId     ObjectId → studentprofiles._id
sessionId     ObjectId → feedbacksessions._id
mappingIds    [ObjectId] — which mappings have been submitted
isComplete    Boolean
submittedAt   Date
```

### `activesubmissiontokens`
```
_id         ObjectId
studentId   ObjectId → studentprofiles._id
sessionId   ObjectId → feedbacksessions._id
mappingId   ObjectId → facultysubjectmappings._id
token       String (unique)
expiresAt   Date
```

### `systemsettings`
```
_id                      ObjectId
systemName               String  default: "KNIT"
instituteName            String
logoUrl                  String
version                  String
academicYear             String
googleLoginEnabled       Boolean  default: true
anonymousFeedback        Boolean  default: true
autoActivateBasedOnDate  Boolean  default: true
hodViewResponses         Boolean  default: false
backupDaily              Boolean  default: true
cloudSync                Boolean  default: false
```

### `auditlogs`
```
_id         ObjectId
adminId     ObjectId → users._id
action      String — "Created Session", "Deleted Faculty", etc.
target      String — entity type affected
targetId    ObjectId — ID of the affected document
details     String — additional context
timestamp   Date (auto)
```

### `notifications`
```
_id         ObjectId
studentId   ObjectId → studentprofiles._id
title       String
message     String
type        Enum: "session_opened" | "session_closed" | "reminder" | "general"
isRead      Boolean  default: false
createdAt   Date (auto)
```

---

## Relationships Diagram (Text)

```
users ──────────── studentprofiles (1:1 via userId)
users ──────────── facultyprofiles (1:1 via userId)

courses ────────── branches (1:N via courseId)
branches ───────── subjects (1:N via branchId)
courses ────────── subjects (1:N via courseId)

facultyprofiles ── facultysubjectmappings (1:N via facultyId)
subjects ────────── facultysubjectmappings (1:N via subjectId)

feedbacksessions ── feedbackresponses (1:N via sessionId)
feedbacksessions ── submissionstatuses (1:N via sessionId)
studentprofiles ─── submissionstatuses (1:N via studentId)
studentprofiles ─── feedbackresponses (1:N via studentId)
facultysubjectmappings ── feedbackresponses (1:N via mappingId)

rollmappings ────── branches (N:1 via branchId)
rollmappings ────── courses (N:1 via courseId)

studentprofiles ─── notifications (1:N via studentId)
```

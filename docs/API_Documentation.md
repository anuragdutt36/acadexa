# API Documentation

**Acadexa — KNIT Sultanpur**  
Base URL: `http://localhost:5001/api`

---

## Authentication

All protected routes require a JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Roles: `admin`, `student`, `faculty`, `hod`

---

## 1. Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/login` | Public | Login with username + password |
| `POST` | `/google` | Public | Google OAuth login |
| `POST` | `/logout` | Protected | Logout and invalidate token |
| `GET` | `/me` | Protected | Get current authenticated user |

### POST `/api/auth/login`
**Body:**
```json
{ "username": "string", "password": "string" }
```
**Response:**
```json
{ "success": true, "token": "jwt_token", "user": { "id": "...", "role": "admin", "name": "..." } }
```

---

## 2. Academic Routes — `/api/academic`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/courses` | Protected | Get all courses |
| `POST` | `/courses` | Admin | Create a course |
| `PUT` | `/courses/:id` | Admin | Update a course |
| `DELETE` | `/courses/:id` | Admin | Delete a course |
| `GET` | `/branches` | Protected | Get all branches |
| `POST` | `/branches` | Admin | Create a branch |
| `PUT` | `/branches/:id` | Admin | Update a branch |
| `DELETE` | `/branches/:id` | Admin | Delete a branch |
| `GET` | `/subjects` | Protected | Get all subjects |
| `POST` | `/subjects` | Admin | Create a subject |
| `PUT` | `/subjects/:id` | Admin | Update a subject |
| `DELETE` | `/subjects/:id` | Admin | Delete a subject |

---

## 3. Profiles Routes — `/api/profiles`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/faculty` | Admin | Get all faculty profiles |
| `POST` | `/faculty` | Admin | Create a faculty profile |
| `PUT` | `/faculty/:id` | Admin | Update a faculty profile |
| `DELETE` | `/faculty/:id` | Admin | Delete a faculty profile |
| `PATCH` | `/faculty/:id/status` | Admin | Toggle faculty active/inactive |
| `GET` | `/students` | Admin | Get all student profiles |
| `GET` | `/students/me` | Student | Get own student profile |
| `PUT` | `/students/me` | Student | Update own student profile |
| `POST` | `/students/upload-photo` | Student | Upload profile photo |

---

## 4. Questions Routes — `/api/questions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Admin | Get all questions |
| `POST` | `/` | Admin | Create a question |
| `PUT` | `/:id` | Admin | Update a question |
| `DELETE` | `/:id` | Admin | Delete a question |
| `PATCH` | `/:id/status` | Admin | Toggle question active/inactive |

---

## 5. Mappings Routes — `/api/mappings`

Faculty-Subject-Branch-Semester mappings.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Admin | Get all faculty-subject mappings |
| `POST` | `/` | Admin | Create a mapping |
| `PUT` | `/:id` | Admin | Update a mapping |
| `DELETE` | `/:id` | Admin | Delete a mapping |
| `GET` | `/by-session/:sessionId` | Protected | Get mappings for a specific session |

---

## 6. Sessions Routes — `/api/sessions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Admin | Get all feedback sessions |
| `POST` | `/` | Admin | Create a new session |
| `PUT` | `/:id` | Admin | Update a session |
| `DELETE` | `/:id` | Admin | Delete a session |
| `PATCH` | `/:id/status` | Admin | Manually change session status |
| `GET` | `/student` | Student | Get active sessions for the logged-in student |

---

## 7. Feedback Routes — `/api/feedback`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/submit` | Student | Submit feedback for a mapping |
| `GET` | `/my-submissions` | Student | Get all past feedback submitted by student |
| `GET` | `/status/:sessionId` | Student | Check submission status for a session |

---

## 8. Reports Routes — `/api/reports`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Admin/HOD | Get feedback reports with filters |
| `GET` | `/export/pdf` | Admin/HOD | Download report as PDF |
| `GET` | `/export/excel` | Admin/HOD | Download report as Excel |

**Query Parameters:**
- `sessionId` — filter by session
- `facultyId` — filter by faculty
- `branchId` — filter by branch
- `semester` — filter by semester

---

## 9. Analytics Routes — `/api/analytics`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/summary` | Admin | Overall system statistics |
| `GET` | `/trends` | Admin | Session feedback trends over time |
| `GET` | `/departments` | Admin | Per-department rating breakdown |
| `GET` | `/rating-distribution` | Admin | Distribution of 1–5 ratings |

---

## 10. Settings Routes — `/api/settings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Protected | Get system settings |
| `PUT` | `/` | Admin | Update system settings |
| `POST` | `/logo` | Admin | Upload system logo |
| `DELETE` | `/logo` | Admin | Remove system logo |
| `POST` | `/seed` | Admin | Reseed the database |
| `POST` | `/clear` | Admin | Clear all data except admin user |
| `GET` | `/audit-logs` | Admin | Get system audit log entries |

---

## 11. Roll Mappings Routes — `/api/roll-mappings`

Maps student roll number ranges to courses, branches, years, and semesters.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Admin | Get all roll number mappings |
| `POST` | `/` | Admin | Create a roll mapping range |
| `PUT` | `/:id` | Admin | Update a roll mapping |
| `DELETE` | `/:id` | Admin | Delete a roll mapping |

---

## 12. Notifications Routes — `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Student | Get notifications for the logged-in student |
| `PATCH` | `/:id/read` | Student | Mark a notification as read |
| `POST` | `/mark-all-read` | Student | Mark all notifications as read |

---

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "statusCode": 400
}
```

## Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

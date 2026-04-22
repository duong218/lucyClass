# Security Audit Report (Targeted by Architecture Context)

Scope reviewed: `backend` (route -> middleware -> controller -> model flow).  
Constraint honored: only `.env.example` was read for environment structure.

## 1. Overall Risk Assessment

- **Grade: C**
- **Reason (short):** Core system has strong baseline controls (JWT auth, role middleware, CSRF checks, rate limiting), but there are confirmed broken access control paths where any teacher can access or modify data outside their assigned classes.

## 2. Confirmed Vulnerabilities (Only Real Ones)

### VULN-1: Teacher can read student PII from any course (horizontal privilege escalation)

- **Affected component:** Core
- **Severity:** High
- **Exact code reference:** `backend/routes/courseRoutes.js` (`GET /:id/students`, `GET /:id/attendance`, `GET /:id/attendance/export-excel`, `POST /:id/attendance`) + `backend/controllers/registrationController.js` (`getStudentsByCourse`) + `backend/controllers/courseController.js` (`getAttendance`, `saveAttendance`, `exportAttendanceExcel`)
- **Attack scenario:** A teacher logs in normally, then calls `/api/courses/{other_teacher_course_id}/students` (or attendance endpoints) for a class they do not teach. The API returns student lists including parent name, phone, and email.
- **Why it works (code logic):**
  - Route-level check is only `auth + authorizeRoles('admin', 'teacher')` in `courseRoutes`.
  - No controller check ties `req.user.id` to course ownership (`Course.teacher`/`Course.additionalTeachers` via `Teacher.staffAccountId`).
  - `getStudentsByCourse` explicitly returns PII fields (`parentName`, `phone`, `email`) for whichever `courseId` is passed.

### VULN-2: Teacher can write attendance for courses they do not teach

- **Affected component:** Core
- **Severity:** High
- **Exact code reference:** `backend/routes/courseRoutes.js` (`POST /:id/attendance`) + `backend/controllers/courseController.js` (`saveAttendance`)
- **Attack scenario:** A teacher submits attendance for another teacher's class by passing that class `id` in the URL and arbitrary `records` payload, altering operational data for unauthorized classes.
- **Why it works (code logic):**
  - Route allows any authenticated teacher (`authorizeRoles('admin', 'teacher')`).
  - `saveAttendance` validates `courseId`, `studentId`, status format, but does not verify that the caller is assigned to that course.
  - `findOneAndUpdate({ courseId: id, date })` upserts attendance regardless of teacher-course relationship.

### VULN-3: Teacher can create/update rankings for students outside their classes

- **Affected component:** Core
- **Severity:** Medium
- **Exact code reference:** `backend/routes/rankingRoutes.js` (`POST /`) + `backend/controllers/rankingController.js` (`createOrUpdateRanking`)
- **Attack scenario:** A teacher submits ranking data for a `studentId` and `courseId` unrelated to their own classes, changing leaderboard/business results.
- **Why it works (code logic):**
  - Route allows role `teacher` or `admin`.
  - Controller validates data shape and ObjectId formats, then performs upsert by `studentId/month/year`.
  - There is no authorization check that `studentId` belongs to a class owned by the requesting teacher.

## 3. Needs Verification (Do Not Assume)

- **Google OAuth callback exposure impact (`backend/routes/googleRoutes.js` + `backend/controllers/google.controller.js`):** callback route is unauthenticated but protected by signed `google_oauth_state` cookie set from an admin-only route. Need deployment verification of log access and cookie secret management to determine practical exploitability.
- **CSRF origin source consistency (`backend/server.js` vs `backend/middlewares/securityMiddleware.js`):** logic differs (`server.js` includes fallback origins; `verifyCSRF` reads `CORS_ORIGINS`). This can cause operational mismatch, but exploitable bypass depends on exact production env configuration.
- **Streak anti-abuse storage (`backend/middlewares/phoneLimiter.js`):** in-memory limiter state resets on restart. This is acceptable for low-security streak context unless deployment scale/restart patterns allow abuse at volume.

## 4. Safe / Correct Implementations

- **Core auth + role baseline is present:** `auth` middleware verifies JWT signature and enforces active staff status; role checks are centralized with `authorizeRoles` / `isAdmin`.
- **High-risk admin operations are gated:** backup/restore routes require `auth + isAdmin`, have heavy-operation rate limiting, and restore requires explicit `"CONFIRM"` plus admin password re-auth.
- **Public form abuse controls exist:** registration endpoints apply rate limiting, captcha validation, duplicate checks, and input length validation.
- **CSRF protection exists across mutating requests:** global CSRF/origin checks are applied before routes (except explicit whitelist behavior), plus route-level CSRF middleware on sensitive endpoints.
- **Streak system already has abuse controls consistent with design:** streak endpoints use multiple limiters (`streakLimiter`, phone/IP guards) and input validators, which matches the lower-security architecture for that separate mini-game.


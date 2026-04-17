# Backend Structure (lucyClass-main/backend)

## 1. Tổng quan kiến trúc

- Runtime: Node.js (CommonJS), Express 4.
- Database: MongoDB + Mongoose.
- Auth: JWT access token (Bearer) + refresh token cookie (`httpOnly`) + sessionId cookie để chống đăng nhập đa thiết bị.
- Security:
- `helmet`, `express-mongo-sanitize`, `xss-clean`.
- CSRF kép: `csurf` middleware + `verifyCSRF` (origin + custom header) cho một số flow.
- `express-rate-limit` cho global/auth/register/streak...
- File upload: `multer` memory storage + kiểm tra MIME + magic number (`file-type`) + upload Cloudinary.
- Background/scheduler:
- `node-cron` backup tự động và cleanup ranking cũ.
- `utils/scheduledTasks.js` chạy cleanup DB tạm restore.
- Backup/restore:
- Backup DB bằng `mongodump` -> zip -> encrypt AES-256-GCM -> upload Google Drive.
- Restore tải file `.enc` từ Drive, giải mã, tạo safety backup, restore tạm rồi restore chính.
- Logging:
- `winston` system log (`logs/error.log`, `logs/combined.log`).
- Audit log hành động admin (`AuditLog`).
- Ngoài API chính còn có endpoint submit public (`/api/submit`) ghi MongoDB + đồng bộ Google Sheets.

### Cách tổ chức project

- Kiến trúc theo lớp: `routes -> controllers -> models/services/utils`.
- Middleware tách riêng cho auth, RBAC, CSRF, rate-limit, validate, upload.
- Controller giữ business logic + gọi service (backup/restore/drive).
- Model Mongoose định nghĩa schema/index/TTL.

## 2. Cấu trúc thư mục (tree)

```text
backend/
├─ .env.example
├─ server.js
├─ package.json
├─ googleSheets.js
├─ config/
│  ├─ cron.js
│  ├─ db.js
│  ├─ google.js
│  └─ redis.js
├─ controllers/
│  ├─ announcementController.js
│  ├─ auditController.js
│  ├─ authController.js
│  ├─ courseController.js
│  ├─ feedbackController.js
│  ├─ google.controller.js
│  ├─ rankingController.js
│  ├─ registrationController.js
│  ├─ restore.controller.js
│  ├─ statsController.js
│  ├─ streakController.js
│  ├─ teacherController.js
│  └─ timetableController.js
├─ middlewares/
│  ├─ adminValidator.js
│  ├─ auth.js
│  ├─ authorizeRoles.js
│  ├─ csrf.js
│  ├─ errorHandler.js
│  ├─ isAdmin.js
│  ├─ rateLimiter.js
│  ├─ securityMiddleware.js
│  ├─ streakAuth.js
│  ├─ upload.js
│  ├─ userIdentifier.js
│  ├─ validate.js
│  └─ validateRegistration.js
├─ models/
│  ├─ Admin.js
│  ├─ Announcement.js
│  ├─ AuditLog.js
│  ├─ Course.js
│  ├─ Feedback.js
│  ├─ GoogleToken.js
│  ├─ Log.js
│  ├─ Ranking.js
│  ├─ Registration.js
│  ├─ Streak.js
│  ├─ Teacher.js
│  ├─ TimetableCell.js
│  └─ TimetableRow.js
├─ routes/
│  ├─ announcementRoutes.js
│  ├─ auditRoutes.js
│  ├─ authRoutes.js
│  ├─ courseRoutes.js
│  ├─ feedbackRoutes.js
│  ├─ googleRoutes.js
│  ├─ rankingRoutes.js
│  ├─ registrationRoutes.js
│  ├─ restoreRoutes.js
│  ├─ statsRoutes.js
│  ├─ streakRoutes.js
│  ├─ teacherRoutes.js
│  └─ timetableRoutes.js
├─ services/
│  ├─ backup.service.js
│  ├─ drive.service.js
│  └─ restore.service.js
├─ scripts/
│  ├─ backup.js
│  └─ cleanRestoreTmp.js
├─ validators/
│  ├─ registrationValidator.js
│  └─ streakValidator.js
└─ utils/
   ├─ catchAsync.js
   ├─ cloudinary.js
   ├─ emailService.js
   ├─ encryptionUtils.js
   ├─ logAdminAction.js
   ├─ logger.js
   ├─ sanitize.js
   ├─ scheduledTasks.js
   ├─ systemLogger.js
   └─ test-encryption.js
```

## 3. Mô tả từng thư mục chính

- `config/`: kết nối DB, OAuth Google, Redis, lịch cron.
- `controllers/`: xử lý nghiệp vụ theo domain (auth/course/teacher/restore...).
- `routes/`: khai báo endpoint + middleware pipeline + map sang controller.
- `middlewares/`: xác thực, phân quyền, CSRF, rate-limit, validate, upload.
- `models/`: schema MongoDB, index và TTL.
- `services/`: nghiệp vụ hạ tầng nặng (backup/drive/restore).
- `utils/`: helper dùng chung (sanitize, cloudinary, email, encryption, logs).
- `validators/`: validation bằng `express-validator`.
- `scripts/`: script vận hành/maintenance độc lập.

## 4. Mô tả từng file quan trọng

### 4.1 Entry & bootstrap

- `server.js`
- Chức năng: bootstrap Express app, middleware global, mount toàn bộ route, healthcheck, submit form public, init cron/jobs, graceful shutdown.
- Export: không export; chạy app trực tiếp.
- Luồng chính: load env -> validate env bắt buộc -> security middleware -> mount `/api/*` -> errorHandler -> connect MongoDB -> start server.

### 4.2 Routes layer

- `routes/authRoutes.js`: `/me`, `/login`, `/logout`, `/refresh-token`, `/forgot-password`, `/reset-password/:token`, `/check-session`.
- `routes/courseRoutes.js`: CRUD khóa học + `/courses/:id/students`.
- `routes/teacherRoutes.js`: CRUD giáo viên.
- `routes/feedbackRoutes.js`: CRUD feedback.
- `routes/registrationRoutes.js`: danh sách/chi tiết/tạo/cập nhật/xóa đăng ký + export excel + remove student.
- `routes/announcementRoutes.js`: CRUD announcement.
- `routes/timetableRoutes.js`: lấy lịch tuần, quản lý row/cell, export timetable.
- `routes/streakRoutes.js`: start/me/leaderboard/checkin/revive.
- `routes/rankingRoutes.js`: upsert ranking theo tháng + top ranking.
- `routes/statsRoutes.js`: số liệu tổng quan và dashboard.
- `routes/auditRoutes.js`: lịch sử hành động admin + export CSV.
- `routes/googleRoutes.js`: OAuth Google Drive + backup/list/restore.
- `routes/restoreRoutes.js`: theo dõi tiến độ restore.

### 4.3 Controllers layer

- `authController.js`
- Chức năng: login/logout/refresh/forgot/reset/check-session.
- Export: `login`, `refreshToken`, `logout`, `forgotPassword`, `resetPassword`, `checkSession`.
- Luồng: login kiểm captcha + password + lock attempts -> phát access/refresh token + sessionId; refresh xoay vòng refreshToken và check session conflict.

- `registrationController.js`
- Chức năng: quản lý đăng ký + export excel + remove student.
- Export: `getAll`, `getById`, `create`, `update`, `remove`, `getStudentsByCourse`, `removeStudent`, `exportExcel`.
- Luồng nổi bật: `create` dùng transaction để chống race (limit/ngày, max active course, duplicate check, class capacity), sau commit mới gửi email + sync Google Sheets.

- `courseController.js`, `teacherController.js`, `feedbackController.js`, `announcementController.js`
- Chức năng: CRUD chính + soft delete (course/teacher/feedback), upload ảnh Cloudinary, sanitize input.
- Luồng: validate -> upload ảnh mới -> update DB -> dọn ảnh cũ -> log admin action.

- `timetableController.js`
- Chức năng: timetable tuần (rows + cells), reorder row, upsert cell, export excel.
- Export: `getTimetable`, `createRow`, `updateRow`, `updateRowOrder`, `deleteRow`, `upsertCell`, `exportTimetable`.
- Luồng: chuẩn hóa `weekDate` về Monday UTC; map cell theo `rowId-dayOfWeek`.

- `streakController.js`
- Chức năng: game streak theo số điện thoại.
- Export: `startStreak`, `getLeaderboard`, `getStreak`, `checkIn`, `reviveStreak`, `getWeeklyLeaderboard`.
- Luồng: chuẩn hóa phone, tính chênh lệch ngày, xử lý check-in/revive/reset chuỗi.

- `rankingController.js`
- Chức năng: upsert ranking theo `studentId + month + year`, lấy top, dọn ranking cũ.
- Export: `createOrUpdateRanking`, `getTopRankings`, `cleanOldRankings`.

- `statsController.js`
- Chức năng: aggregate thống kê hệ thống và dashboard.
- Export: `getStats`, `getDashboardData`.

- `google.controller.js` + `restore.controller.js`
- Chức năng: OAuth Google Drive, backup lên Drive, list backup, restore backup có re-auth mật khẩu admin.

### 4.4 Middleware quan trọng

- `middlewares/auth.js`: verify JWT Bearer + check `sessionId` conflict.
- `middlewares/isAdmin.js`: bắt buộc role admin.
- `middlewares/authorizeRoles.js`: RBAC động (ví dụ ranking cho teacher/admin).
- `middlewares/csrf.js`: `csurf` + exempt route auth nhạy cảm.
- `middlewares/securityMiddleware.js`: CSRF kiểu origin + `X-Requested-With` (prod).
- `middlewares/rateLimiter.js`: nhiều limiter theo use-case.
- `middlewares/upload.js`: whitelist extension/MIME + magic number validate.
- `middlewares/errorHandler.js`: chuẩn hóa lỗi trả về JSON.
- `middlewares/validateRegistration.js`: anti-bot honeypot + cooldown + validation cơ bản.

### 4.5 Services/Utils quan trọng

- `services/backup.service.js`: chạy mongodump, zip, encrypt `.enc`, upload Drive, retry file `.uploading`.
- `services/drive.service.js`: getDrive, upload/download/list/cleanup rotation backup.
- `services/restore.service.js`: restore an toàn (decrypt, safety backup, temp restore, main restore).
- `utils/encryptionUtils.js`: AES-256-GCM encrypt/decrypt file.
- `utils/cloudinary.js`: upload/delete ảnh Cloudinary.
- `utils/emailService.js`: gửi mail SendGrid (reset password + đăng ký).
- `googleSheets.js`: append dữ liệu đăng ký sang Google Sheets.

## 5. API Endpoints

### 5.1 System/common

| Method | URL | Controller | Mô tả |
|---|---|---|---|
| GET | `/api/health` | inline `server.js` | Healthcheck backend |
| GET | `/api/csrf-token` | inline `server.js` + csrf middleware | Lấy CSRF token |
| POST | `/api/submit` | inline `server.js` | Public submit + verify captcha + lưu registration + sync Sheets |

### 5.2 Auth (`/api/auth`)

| Method | URL | Controller |
|---|---|---|
| GET | `/me` | `authRoutes` inline (req.user) |
| POST | `/login` | `authController.login` |
| POST | `/logout` | `authController.logout` |
| POST | `/refresh-token` | `authController.refreshToken` |
| POST | `/forgot-password` | `authController.forgotPassword` |
| POST | `/reset-password/:token` | `authController.resetPassword` |
| GET | `/check-session` | `authController.checkSession` |

### 5.3 Course/Teacher/Feedback/Announcement

| Method | URL | Controller |
|---|---|---|
| GET | `/api/courses` | `courseController.getAll` |
| GET | `/api/courses/:id` | `courseController.getById` |
| GET | `/api/courses/:id/students` | `registrationController.getStudentsByCourse` |
| POST | `/api/courses` | `courseController.create` |
| PUT | `/api/courses/:id` | `courseController.update` |
| DELETE | `/api/courses/:id` | `courseController.remove` |
| GET | `/api/teachers` | `teacherController.getAll` |
| GET | `/api/teachers/:id` | `teacherController.getById` |
| POST | `/api/teachers` | `teacherController.create` |
| PUT | `/api/teachers/:id` | `teacherController.update` |
| DELETE | `/api/teachers/:id` | `teacherController.remove` |
| GET | `/api/feedback` | `feedbackController.getAll` |
| GET | `/api/feedback/:id` | `feedbackController.getById` |
| POST | `/api/feedback` | `feedbackController.create` |
| PUT | `/api/feedback/:id` | `feedbackController.update` |
| DELETE | `/api/feedback/:id` | `feedbackController.remove` |
| GET | `/api/announcements` | `announcementController.getAll` |
| POST | `/api/announcements` | `announcementController.create` |
| PUT | `/api/announcements/:id` | `announcementController.update` |
| DELETE | `/api/announcements/:id` | `announcementController.remove` |

### 5.4 Registration/Student

| Method | URL | Controller |
|---|---|---|
| GET | `/api/registrations` | `registrationController.getAll` |
| GET | `/api/registrations/:id` | `registrationController.getById` |
| POST | `/api/registrations` | `registrationController.create` |
| PUT | `/api/registrations/:id` | `registrationController.update` |
| DELETE | `/api/registrations/:id` | `registrationController.remove` |
| POST | `/api/registrations/export-excel` | `registrationController.exportExcel` |
| GET | `/api/registrations/:id/students` | `registrationController.getStudentsByCourse` |
| PUT | `/api/registrations/:id/remove` | `registrationController.removeStudent` |
| GET | `/api/students` | alias mount của registrationRoutes |
| PUT | `/api/students/:id/remove` | alias `registrationController.removeStudent` |

### 5.5 Stats/Audit

| Method | URL | Controller |
|---|---|---|
| GET | `/api/stats` | `statsController.getStats` |
| GET | `/api/stats/dashboard` | `statsController.getDashboardData` |
| GET | `/api/admin/history` | `auditController.getHistory` |
| GET | `/api/admin/history/stats` | `auditController.getStats` |
| POST | `/api/admin/history/export` | `auditController.exportCSV` |

### 5.6 Google Backup/Restore

| Method | URL | Controller |
|---|---|---|
| GET | `/api/auth/google/auth` | `googleController.redirectToGoogle` |
| GET | `/api/auth/google/callback` | `googleController.handleGoogleCallback` |
| POST | `/api/auth/google/backup` | `googleController.backupToDrive` |
| GET | `/api/auth/google/backups` | `restoreController.listBackups` |
| POST | `/api/auth/google/restore` | `restoreController.restoreBackup` |
| GET | `/api/restore/progress` | `restoreController.getRestoreProgress` |

### 5.7 Timetable/Ranking/Streak

| Method | URL | Controller |
|---|---|---|
| GET | `/api/timetable` | `timetableController.getTimetable` |
| POST | `/api/timetable/export` | `timetableController.exportTimetable` |
| POST | `/api/timetable/rows` | `timetableController.createRow` |
| PUT | `/api/timetable/rows/reorder` | `timetableController.updateRowOrder` |
| PUT | `/api/timetable/rows/:id` | `timetableController.updateRow` |
| DELETE | `/api/timetable/rows/:id` | `timetableController.deleteRow` |
| PUT | `/api/timetable/cells` | `timetableController.upsertCell` |
| POST | `/api/rankings` | `rankingController.createOrUpdateRanking` |
| GET | `/api/rankings/top` | `rankingController.getTopRankings` |
| POST | `/api/streak/start` | `streakController.startStreak` |
| GET | `/api/streak/me` | `streakController.getStreak` |
| GET | `/api/streak/leaderboard` | `streakController.getLeaderboard` |
| GET | `/api/streak/leaderboard-weekly` | `streakController.getWeeklyLeaderboard` |
| POST | `/api/streak/checkin` | `streakController.checkIn` |
| POST | `/api/streak/revive` | `streakController.reviveStreak` |

## 6. Database

### Models và field chính

- `Admin`
- `username`, `email`, `password`, `refreshTokens[]`, `activeSessionId`, `loginAttempts`, `lockUntil`, reset token/expire, `role`.

- `Course`
- `name`, `ageGroup`, `duration`, `classSize`, `currentStudents`, `description`, `highlights[]`, `teacher(ref Teacher)`, ảnh (`image`, `imagePublicId`), soft-delete fields.

- `Teacher`
- `name`, `specialization`, `experience`, `description`, `feedback`, `rating`, avatar + soft-delete.

- `Feedback`
- `parentName`, `childName`, `childAge`, `rating`, `text`, `photo`, soft-delete.

- `Registration`
- `parentName`, `phone`, `childName`, `childAge`, `courseId(ref Course)`, `email`, `message`, `status(not_contacted/contacted/registered)`, `isActive`, timestamps.
- Index: `email+phone+courseId`, `phone+isActive`, `courseId+status+isActive`.
- TTL index theo `createdAt` (1 năm).

- `Announcement`
- `title`, `description`, `image`, `imagePublicId`, timestamps.

- `AuditLog`
- `adminId(ref Admin)`, `adminName`, `action`, `targetType`, `targetId`, `description`, `ipAddress`, `userAgent`, `suspicious`.
- TTL 90 ngày.

- `Ranking`
- `studentId`, `courseId`, `childName`, `courseName`, `stars`, `title`, `skill`, `month`, `year`, `createdAt`.
- Unique index: `studentId + month + year`.

- `Streak`
- `phone(unique)`, `name`, `email`, `streakCount`, `lastCheckin`, `reviveUsed`, `identityKey`.

- `TimetableRow`
- `roomName`, `timeSlot`, `order(unique)`.

- `TimetableCell`
- `rowId(ref TimetableRow)`, `dayOfWeek(1-7)`, `weekDate`, `note`, `color`.
- Unique compound index `rowId + dayOfWeek + weekDate`.

- `GoogleToken`
- OAuth token fields (`access_token`, `refresh_token`, `expiry_date`, ...).

- `Log`
- action log tổng quát (`action`, `ip`, `userAgent`, `metadata`).

### Quan hệ chính

- `Course.teacher` -> `Teacher` (1 course có thể gán 1 teacher).
- `Registration.courseId` -> `Course` (nhiều registration thuộc 1 course).
- `AuditLog.adminId` -> `Admin`.
- `TimetableCell.rowId` -> `TimetableRow`.
- `Ranking.courseId` -> `Course` (optional).

## 7. Authentication / Security

### Cơ chế xác thực

- Access token JWT gửi qua `Authorization: Bearer <token>`.
- Refresh token lưu trong cookie `refreshToken` (`httpOnly`, `sameSite`, `secure` tùy môi trường).
- Cookie `sessionId` dùng chống session conflict nhiều thiết bị.
- Auth middleware đối chiếu `sessionId` cookie với `activeSessionId` trong DB.

### Middleware bảo vệ

- `auth`: bắt buộc token hợp lệ.
- `isAdmin` / `authorizeRoles`: phân quyền endpoint admin/teacher.
- `csrf` (`csurf`) + `verifyCSRF` (origin/header) cho request thay đổi dữ liệu.
- `rateLimiter`: bảo vệ brute force/spam (login/register/forgot/reset/streak/global API).
- `upload + validateMagicNumber`: chặn upload giả mạo MIME.
- Sanitization: `mongoSanitize`, `xss-clean`, `cleanInput` (sanitize-html).
- `errorHandler`: chặn lộ stack trace ra client.

### Điểm vận hành đáng chú ý

- Graceful shutdown đóng HTTP server + MongoDB.
- Process handlers cho `uncaughtException` / `unhandledRejection`.
- Backup upload crash-safe bằng đuôi `.uploading` và retry lúc startup.
- Restore yêu cầu `confirm = CONFIRM` + nhập lại mật khẩu admin.

# 📁 Detailed Backend Structure

This document provides a full, recursive scan of the backend directory.

---

## 📂 Root Directory: `backend/`
→ The core server-side application built with Node.js and Express.

### 📄 Root Files
* `.dockerignore` → Files to ignore in Docker builds.
* `.env.example` → Template for environment variables (safe to read).
* `Dockerfile` → Docker configuration for the backend.
* `googleSheets.js` → Logic for Google Sheets API integration.
* `migrate-childAge.js` → Data migration script for child age fields.
* `nodemon.json` → Configuration for nodemon dev server.
* `package.json` → Backend dependencies and scripts.
* `readme1.txt` → Legacy readme file.
* `server.js` → Application entry point; initializes server and DB.

---

## 📁 `config/`
→ Centralized configuration for various services.

* `cron.js` → Scheduled task definitions.
* `db.js` → MongoDB connection logic using Mongoose.
* `google.js` → Google API authentication config.
* `redis.js` → Redis client setup for caching.

---

## 📁 `controllers/`
→ Contains business logic for each API route.

* `announcementController.js` → Logic for creating and fetching announcements.
* `auditController.js` → Logic for retrieving admin audit logs.
* `authController.js` → Core login, logout, and password management.
* `courseController.js` → CRUD operations for course data.
* `feedbackController.js` → Handles student/user feedback submissions.
* `google.controller.js` → Logic for Google-specific operations (Tokens/Sheets).
* `rankingController.js` → Calculates and manages student rankings.
* `registrationController.js` → Manages class registration and enrollment.
* `restore.controller.js` → Logic for system data restoration.
* `staffController.js` → Management of staff accounts and permissions.
* `statsController.js` → Aggregates dashboard statistics.
* `streakController.js` → Manages student check-in streaks and rewards.
* `teacherController.js` → Logic for managing teacher profiles.
* `timetableController.js` → Complex logic for schedule management.

---

## 📁 `middlewares/`
→ Functions that run during the request-response cycle.

* `adminValidator.js` → Validates admin-level access tokens.
* `auth.js` → Primary JWT authentication middleware.
* `authorizeRoles.js` → Role-based access control (RBAC).
* `cacheMiddleware.js` → Redis caching for expensive queries.
* `csrf.js` → Cross-Site Request Forgery protection.
* `errorHandler.js` → Global Express error handling logic.
* `isAdmin.js` → Simple check for admin role.
* `phoneLimiter.js` → Rate limiting based on phone numbers.
* `rateLimiter.js` → General API rate limiting for security.
* `securityMiddleware.js` → Common security headers and sanitization.
* `streakAuth.js` → Authentication specific to streak operations.
* `upload.js` → File upload handling using Multer.
* `userIdentifier.js` → Logic to identify users/devices.
* `validate.js` → Generic validation runner.
* `validateRegistration.js` → Specific validation for registration forms.

---

## 📁 `models/`
→ Mongoose schemas defining the MongoDB database structure.

* `Admin.js` → Schema for administrator accounts.
* `Announcement.js` → Schema for system announcements.
* `Attendance.js` → Schema for tracking class attendance.
* `AuditLog.js` → Schema for recording admin actions.
* `Course.js` → Schema for course details.
* `DeviceUsage.js` → Schema for tracking device-specific sessions.
* `Feedback.js` → Schema for user feedback.
* `GoogleToken.js` → Schema for storing Google OAuth tokens.
* `Log.js` → Generic system logging schema.
* `Ranking.js` → Schema for stored ranking snapshots.
* `Registration.js` → Schema for student registrations.
* `StaffAccount.js` → Schema for staff/teacher accounts.
* `Streak.js` → Schema for tracking daily streaks.
* `Teacher.js` → Schema for teacher profile information.
* `TimetableCell.js` → Schema for individual schedule blocks.
* `TimetableRow.js` → Schema for rows in the timetable grid.

---

## 📁 `routes/`
→ Defines the API endpoints and maps them to controllers.

* `announcementRoutes.js` → Routes for announcements.
* `auditRoutes.js` → Routes for viewing system audits.
* `authRoutes.js` → Authentication routes (login, forgot pass).
* `courseRoutes.js` → Course management routes.
* `feedbackRoutes.js` → Feedback submission routes.
* `googleRoutes.js` → Routes for Google integration.
* `rankingRoutes.js` → Routes for ranking data.
* `registrationRoutes.js` → Enrollment and registration routes.
* `restoreRoutes.js` → Data restoration endpoints.
* `staffDashboardRoutes.js` → Routes for staff-specific dashboard views.
* `staffRoutes.js` → Staff management endpoints.
* `statsRoutes.js` → Statistics and report endpoints.
* `streakRoutes.js` → Check-in and streak tracking routes.
* `teacherRoutes.js` → Teacher profile routes.
* `timetableRoutes.js` → Schedule and timetable routes.

---

## 📁 `scripts/`
→ Helper scripts for maintenance and deployment.

* `backup.js` → Database backup utility.
* `cleanRestoreTmp.js` → Cleans up temporary files from restoration processes.

---

## 📁 `services/`
→ Logic for external integrations and complex background tasks.

* `backup.service.js` → Core backup logic.
* `drive.service.js` → Interaction with Google Drive API.
* `restore.service.js` → Core data restoration service.

---

## 📁 `utils/`
→ Shared helper functions used across the application.

* `catchAsync.js` → Utility to wrap async functions for error handling.
* `cloudinary.js` → Configuration for Cloudinary image hosting.
* `emailService.js` → Logic for sending transactional emails (Nodemailer).
* `encryptionUtils.js` → AES encryption for sensitive data.
* `logAdminAction.js` → Helper to record actions in AuditLog.
* `logger.js` → Winston/standard logger configuration.
* `normalizePhone.js` → Standardizes phone number formats.
* `sanitize.js` → Input sanitization to prevent XSS/Injection.
* `scheduledTasks.js` → Logic for cron-based background jobs.
* `systemLogger.js` → Specific logger for system-level events.
* `test-encryption.js` → Script to verify encryption logic.

---

## 📁 `validators/`
→ Joi/Custom schema validation for request bodies.

* `registrationValidator.js` → Validation for student registration data.
* `streakValidator.js` → Validation for check-in and streak updates.

---

## 📁 `logs/`
→ Contains runtime log files generated by the application.

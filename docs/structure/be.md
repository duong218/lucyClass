# 📁 Backend Structure (BE)

Full recursive scan of the backend project structure.

---

## 📂 backend/
→ Root directory of the backend application

### 📂 config/
→ Configuration files for various services and integrations
* `cron.js` → Scheduled tasks and cron job definitions
* `db.js` → MongoDB connection configuration using Mongoose
* `google.js` → Google OAuth and API client configuration
* `redis.js` → Redis client configuration for caching

### 📂 controllers/
→ Handles business logic for each API route
* `announcementController.js` → Logic for creating, updating, and retrieving announcements
* `auditController.js` → Logic for retrieving and managing admin audit logs
* `authController.js` → Authentication logic (login, register, forgot password, reset password)
* `courseController.js` → CRUD operations for courses and course details
* `feedbackController.js` → Logic for handling user feedback submissions
* `google.controller.js` → Logic for Google-specific integrations (e.g., Google Sheets)
* `rankingController.js` → Logic for calculating and retrieving student rankings
* `registrationController.js` → Logic for handling student registrations and enrollments
* `restore.controller.js` → Logic for system data restoration and backups
* `staffController.js` → Logic for managing staff accounts and dashboards
* `statsController.js` → Logic for generating system-wide statistics and reports
* `streakController.js` → Logic for managing user streaks and check-ins
* `syncController.js` → Logic for synchronizing data across systems
* `teacherController.js` → Logic for managing teacher profiles and dashboards
* `timetableController.js` → Logic for managing class schedules and timetables

### 📂 middlewares/
→ Functions that run during the request-response cycle (auth, validation, security)
* `adminValidator.js` → Middleware to validate admin-level access
* `auth.js` → Core authentication middleware for JWT verification
* `authorizeRoles.js` → Middleware for role-based access control (RBAC)
* `cacheMiddleware.js` → Middleware for handling Redis caching of responses
* `csrf.js` → CSRF protection middleware
* `errorHandler.js` → Global error handling middleware
* `isAdmin.js` → Specific check for admin role
* `phoneLimiter.js` → Rate limiting specific to phone number verification
* `rateLimiter.js` → General API rate limiting middleware
* `securityMiddleware.js` → General security headers and protections
* `streakAuth.js` → Specialized authentication for streak-related endpoints
* `upload.js` → Middleware for handling file uploads (e.g., images)
* `userIdentifier.js` → Middleware to identify users/devices uniquely
* `validate.js` → Generic validation runner middleware
* `validateRegistration.js` → Specialized validation for registration data

### 📂 models/
→ Mongoose schemas defining the data structure in MongoDB
* `Admin.js` → Schema for administrator accounts
* `Announcement.js` → Schema for system-wide announcements
* `Attendance.js` → Schema for tracking student attendance
* `AuditLog.js` → Schema for recording administrative actions
* `Course.js` → Schema for course information
* `DeviceUsage.js` → Schema for tracking device-specific sessions
* `Feedback.js` → Schema for user-submitted feedback
* `GoogleToken.js` → Schema for storing Google OAuth tokens
* `Log.js` → General system logging schema
* `Ranking.js` → Schema for stored student rankings
* `Registration.js` → Schema for student registration records
* `StaffAccount.js` → Schema for staff and teacher accounts
* `Streak.js` → Schema for tracking user streaks
* `Teacher.js` → Schema for teacher-specific profile data
* `TimetableCell.js` → Schema for individual entries in the timetable
* `TimetableRow.js` → Schema for rows/groupings in the timetable

### 📂 routes/
→ Defines the API endpoints and maps them to controllers
* `announcementRoutes.js` → Routes for announcement operations
* `auditRoutes.js` → Routes for viewing audit logs
* `authRoutes.js` → Routes for authentication and account management
* `courseRoutes.js` → Routes for course management
* `feedbackRoutes.js` → Routes for feedback operations
* `googleRoutes.js` → Routes for Google integration features
* `rankingRoutes.js` → Routes for student ranking data
* `registrationRoutes.js` → Routes for handling enrollments
* `restoreRoutes.js` → Routes for system restoration features
* `staffDashboardRoutes.js` → Specialized dashboard routes for staff
* `staffRoutes.js` → General staff management routes
* `statsRoutes.js` → Routes for system statistics
* `streakRoutes.js` → Routes for streak and check-in operations
* `syncRoutes.js` → Routes for data synchronization
* `teacherRoutes.js` → Routes for teacher management
* `timetableRoutes.js` → Routes for timetable and schedule management

### 📂 scripts/
→ Utility scripts for maintenance and automation
* `backup.js` → Script for manual or automated database backups
* `cleanRestoreTmp.js` → Script to clean up temporary files after restoration

### 📂 services/
→ Specialized logic layer for external integrations and complex tasks
* `backup.service.js` → Core logic for creating and managing backups
* `deepCleanService.js` → Service for performing deep system cleanup
* `drive.service.js` → Service for interacting with Google Drive API
* `restore.service.js` → Core logic for restoring data from backups

### 📂 utils/
→ Shared utility functions used throughout the backend
* `catchAsync.js` → Wrapper to handle asynchronous errors in Express routes
* `cloudinary.js` → Integration for Cloudinary image hosting
* `emailService.js` → Utility for sending transactional emails
* `encryptionUtils.js` → Helpers for data encryption and hashing
* `logAdminAction.js` → Helper to record actions in the audit log
* `logger.js` → Standardized logging configuration
* `normalizePhone.js` → Utility to format and normalize phone numbers
* `sanitize.js` → Helpers to sanitize input and prevent injection
* `scheduledTasks.js` → Logic for background tasks and cron jobs
* `systemLogger.js` → Specialized logger for system-level events
* `test-encryption.js` → Utility for testing encryption/decryption logic

### 📂 validators/
→ Request body validation logic (using Joi or similar)
* `registrationValidator.js` → Validation schema for registration data
* `streakValidator.js` → Validation schema for streak updates

---

### 📄 Root Files
* `.dockerignore` → Files and folders to exclude from Docker images
* `.env.example` → Template for environment variables (safe to read)
* `Dockerfile` → Configuration for building the backend Docker image
* `googleSheets.js` → Specialized script for Google Sheets integration
* `migrate-childAge.js` → Migration script for updating data schemas
* `nodemon.json` → Configuration for the nodemon development server
* `package.json` → Project metadata, dependencies, and script definitions
* `server.js` → Entry point of the Express server application

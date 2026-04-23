# 📁 Backend Structure (BE)

---

## 🌳 System Architecture Tree

```text
backend/
├── 📁 config/ (Core configuration for external services and databases)
│   ├── ⚙️ cron.js → schedules automated tasks and data cleanup
│   ├── ⚙️ db.js → MongoDB connection setup using Mongoose
│   ├── ⚙️ google.js → Google API client and auth configuration
│   └── ⚙️ redis.js → Redis client connection for server-side caching
├── 📁 controllers/ (Handles business logic for each API module)
│   ├── 🎮 announcementController.js → CRUD and logic for school news/updates
│   ├── 🎮 auditController.js → logic for tracking and exporting admin actions
│   ├── 🎮 authController.js → handles login, logout, refresh tokens, and password reset
│   ├── 🎮 courseController.js → manages courses, class details, and attendance
│   ├── 🎮 feedbackController.js → processes parent/student feedback submissions
│   ├── 🎮 google.controller.js → manages Google Drive backups and Sheet syncing
│   ├── 🎮 rankingController.js → calculates and serves student star leaderboards
│   ├── 🎮 registrationController.js → handles new student enrollments and capacity
│   ├── 🎮 restore.controller.js → triggers database restoration from encrypted backups
│   ├── 🎮 staffController.js → manages staff accounts, roles, and permissions
│   ├── 🎮 statsController.js → aggregates data for dashboard charts and reports
│   ├── 🎮 streakController.js → logic for daily check-ins, revives, and streak counts
│   ├── 🎮 syncController.js → manual triggers for maintenance and data syncing
│   ├── 🎮 teacherController.js → manages teacher profiles, avatars, and bios
│   └── 🎮 timetableController.js → handles class schedule rows, cells, and reordering
├── 📁 middlewares/ (Request interceptors for security, authentication, and validation)
│   ├── 🛡️ adminValidator.js → schema validation for administrative requests
│   ├── 🛡️ auth.js → primary JWT authentication and session conflict check
│   ├── 🛡️ authorizeRoles.js → RBAC (Role-Based Access Control) permission checker
│   ├── 🛡️ cacheMiddleware.js → logic for reading and writing to Redis cache
│   ├── 🛡️ errorHandler.js → global error handling and standardized JSON responses
│   ├── 🛡️ isAdmin.js → strict middleware to enforce admin-only access
│   ├── 🛡️ phoneLimiter.js → rate limits requests based on student phone numbers
│   ├── 🛡️ rateLimiter.js → generic rate limiting to prevent API abuse/DDoS
│   ├── 🛡️ securityMiddleware.js → Origin and Custom Header-based CSRF protection
│   ├── 🛡️ streakAuth.js → specialized authentication for the streak system
│   ├── 🛡️ upload.js → Multer configuration for processing image uploads
│   ├── 🛡️ userIdentifier.js → generates unique IDs for anonymous rate limiting
│   ├── 🛡️ validate.js → helper to check express-validator result objects
│   └── 🛡️ validateRegistration.js → complex validation logic for new enrollments
├── 📁 models/ (Mongoose schemas defining the database architecture)
│   ├── 📊 Admin.js → schema for root administrative users
│   ├── 📊 Announcement.js → schema for school news and banners
│   ├── 📊 Attendance.js → records of student presence in classes
│   ├── 📊 AuditLog.js → persistent log of all administrative changes
│   ├── 📊 Course.js → schema for class information and teacher links
│   ├── 📊 DeviceUsage.js → tracks daily activity per device to prevent spam
│   ├── 📊 Feedback.js → storage for user-submitted feedback and photos
│   ├── 📊 GoogleToken.js → persists OAuth2 tokens for Google services
│   ├── 📊 Log.js → generic schema for application event logging
│   ├── 📊 Ranking.js → stores monthly star rankings for students
│   ├── 📊 Registration.js → primary schema for student enrollment data
│   ├── 📊 StaffAccount.js → credentials and profile links for teachers/staff
│   ├── 📊 Streak.js → tracks daily check-in activity and user data
│   ├── 📊 Teacher.js → detailed profile data for teaching staff
│   ├── 📊 TimetableCell.js → individual entry in the class schedule
│   └── 📊 TimetableRow.js → definition of a time slot in the schedule
├── 📁 routes/ (Defines the API endpoints and connects them to controllers)
│   ├── 🛣️ announcementRoutes.js → endpoints for school updates and news
│   ├── 🛣️ auditRoutes.js → routes for viewing and exporting action logs
│   ├── 🛣️ authRoutes.js → authentication endpoints (login, logout, password)
│   ├── 🛣️ courseRoutes.js → management routes for courses and attendance
│   ├── 🛣️ feedbackRoutes.js → endpoints for submitting and viewing feedback
│   ├── 🛣️ googleRoutes.js → integration routes for Drive and Sheets
│   ├── 🛣️ rankingRoutes.js → routes for fetching student leaderboards
│   ├── 🛣️ registrationRoutes.js → primary endpoints for student enrollments
│   ├── 🛣️ restoreRoutes.js → specialized routes for DB restore operations
│   ├── 🛣️ staffDashboardRoutes.js → aggregate data routes for the staff UI
│   ├── 🛣️ staffRoutes.js → management routes for staff and teachers
│   ├── 🛣️ statsRoutes.js → endpoints for dashboard statistics
│   ├── 🛣️ streakRoutes.js → routes for daily check-ins and streak revival
│   ├── 🛣️ syncRoutes.js → maintenance triggers for data synchronization
│   ├── 🛣️ teacherRoutes.js → public and admin routes for teacher profiles
│   └── 🛣️ timetableRoutes.js → routes for class schedule management
├── 📁 scripts/ (Utility scripts for maintenance and automation)
│   ├── 📜 backup.js → standalone script to trigger a local DB backup
│   └── 📜 cleanRestoreTmp.js → cleans up temporary files after a restoration
├── 📁 services/ (Decoupled business logic for complex operations)
│   ├── ⚡ backup.service.js → core logic for creating and encrypting database dumps
│   ├── ⚡ deepCleanService.js → logic for deleting orphan records and old rankings
│   ├── ⚡ drive.service.js → wrapper for Google Drive file operations
│   └── ⚡ restore.service.js → handles decryption and importing of backup files
├── 📁 utils/ (Reusable helper functions and system utilities)
│   ├── 🧰 catchAsync.js → wrapper to eliminate try-catch blocks in routes
│   ├── 🧰 cloudinary.js → service for managing image uploads to Cloudinary
│   ├── 🧰 emailService.js → handles sending all transactional emails
│   ├── 🧰 encryptionUtils.js → cryptographic logic for securing backup files
│   ├── 🧰 logAdminAction.js → helper function to log admin events to DB
│   ├── 🧰 logger.js → simple console/file logger for events
│   ├── 🧰 normalizePhone.js → standardizes phone formats (+84 to 0, etc.)
│   ├── 🧰 sanitize.js → cleans user input strings to prevent XSS/Injection
│   ├── 🧰 scheduledTasks.js → definition of recurring system jobs
│   ├── 🧰 systemLogger.js → enhanced logging with contextual metadata
│   └── 🧰 test-encryption.js → validation script for the encryption system
├── 📁 validators/ (Input validation schemas using express-validator)
│   ├── 📝 registrationValidator.js → strict rules for enrollment form data
│   └── 📝 streakValidator.js → rules for phone and name in streak check-ins
├── 📄 .dockerignore → specifies files to exclude from Docker builds
├── 📄 .env.example → template for environment variables (safe to commit)
├── 🐳 Dockerfile → containerization instructions for the backend
├── 📄 googleSheets.js → standalone utility for Google Sheets syncing
├── 📄 migrate-childAge.js → one-time database migration script
├── 📄 nodemon.json → configuration for the nodemon development runner
├── 📦 package.json → project metadata, scripts, and dependencies
└── 🚀 server.js → entry point; initializes express, DB, and routes
```

---

## 📂 Summary

*   **Logic Core**: All business rules reside in `controllers/` (🎮) and `services/` (⚡).
*   **Security**: Handled by `middlewares/` (🛡️) (Auth, CSRF, Rate Limiting).
*   **Data Structure**: Defined in `models/` (📊) using Mongoose.
*   **API Mapping**: All endpoints are strictly defined in `routes/` (🛣️).

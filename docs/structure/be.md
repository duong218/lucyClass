# 📁 Backend Documentation (BE)

## 🧭 Overview
* **Tech Stack**: Node.js, Express, MongoDB, Mongoose
* **Architecture Style**: MVC (Model-View-Controller) pattern, separating routing, business logic, and data access.

## 🔐 Auth Flow
* **req.user injection**: The `auth` middleware verifies the JWT signature on incoming requests. If valid, the decoded payload (e.g., ID, role) is injected into `req.user`, granting downstream controllers access to the user's identity.
* **JWT Flow**: Users authenticate via login endpoints. The server generates a signed JSON Web Token and sends it back to the client (often in HTTP-only cookies). The client sends this token in subsequent API requests.

## 🌐 API Structure
* **/attendance**: Endpoints for student class attendance tracking.
* **/staff**: Endpoints for staff profile management and dashboard statistics.
* **/auth**: Login, logout, refresh tokens, and password reset.
* **/courses**: Endpoints for course enrollment, class details, and scheduling.
* **/streak**: Logic for daily check-ins, revives, and streak counts.

## 📁 Folder Breakdown & File Structure

```text
backend/
├── 📁 config/
│   ├── ⚙️ cron.js
│   │   * 🧠 Purpose: Schedules automated tasks and data cleanup
│   │   * 🔗 Relationships: mongoose, scheduledTasks
│   ├── ⚙️ db.js
│   │   * 🧠 Purpose: MongoDB connection setup
│   │   * 🔗 Relationships: mongoose
│   ├── ⚙️ google.js
│   │   * 🧠 Purpose: Google API client and auth configuration
│   │   * 🔗 Relationships: googleapis
│   └── ⚙️ redis.js
│       * 🧠 Purpose: Redis client connection for server-side caching
│       * 🔗 Relationships: redis
├── 📁 controllers/
│   ├── 🎮 announcementController.js
│   │   * 🧠 Purpose: Handles logic for school news and updates
│   │   * 🔗 Relationships: Announcement Model
│   ├── 🎮 attendanceController.js
│   │   * 🧠 Purpose: Logic for student attendance tracking
│   │   * 🔗 Relationships: Attendance Model
│   ├── 🎮 auditController.js
│   │   * 🧠 Purpose: Logic for tracking and exporting admin actions
│   │   * 🔗 Relationships: AuditLog Model
│   ├── 🎮 authController.js
│   │   * 🧠 Purpose: Handles login, logout, refresh tokens, password reset
│   │   * 🔗 Relationships: StaffAccount Model, jwt
│   ├── 🎮 courseController.js
│   │   * 🧠 Purpose: Manages courses, class details, and attendance
│   │   * 🔗 Relationships: Course Model
│   ├── 🎮 feedbackController.js
│   │   * 🧠 Purpose: Processes parent/student feedback submissions
│   │   * 🔗 Relationships: Feedback Model
│   ├── 🎮 google.controller.js
│   │   * 🧠 Purpose: Manages Google Drive backups and Sheet syncing
│   │   * 🔗 Relationships: googleapis
│   ├── 🎮 rankingController.js
│   │   * 🧠 Purpose: Calculates and serves student leaderboards
│   │   * 🔗 Relationships: Ranking Model
│   ├── 🎮 registrationController.js
│   │   * 🧠 Purpose: Handles new student enrollments
│   │   * 🔗 Relationships: Registration Model
│   ├── 🎮 restore.controller.js
│   │   * 🧠 Purpose: Triggers DB restoration from backups
│   │   * 🔗 Relationships: restoreService
│   ├── 🎮 staffAttendanceController.js
│   │   * 🧠 Purpose: Handles staff check-in/out logic
│   │   * 🔗 Relationships: StaffAttendance Model
│   ├── 🎮 staffController.js
│   │   * 🧠 Purpose: Manages staff accounts, roles, and permissions
│   │   * 🔗 Relationships: StaffAccount Model
│   ├── 🎮 statsController.js
│   │   * 🧠 Purpose: Aggregates data for dashboard charts and reports
│   │   * 🔗 Relationships: Mongoose aggregations
│   ├── 🎮 streakController.js
│   │   * 🧠 Purpose: Logic for daily check-ins, revives, and streak counts
│   │   * 🔗 Relationships: Streak Model
│   ├── 🎮 syncController.js
│   │   * 🧠 Purpose: Manual triggers for data synchronization
│   │   * 🔗 Relationships: External sync services
│   ├── 🎮 teacherController.js
│   │   * 🧠 Purpose: Manages teacher profiles and bios
│   │   * 🔗 Relationships: Teacher Model
│   └── 🎮 timetableController.js
│       * 🧠 Purpose: Handles class schedule logic
│       * 🔗 Relationships: TimetableRow, TimetableCell Models
├── 📁 middlewares/
│   ├── 🔐 adminValidator.js
│   │   * 🧠 Purpose: Validates admin specific requests
│   │   * 🔗 Relationships: express-validator
│   ├── 🔐 auth.js
│   │   * 🧠 Purpose: Primary JWT authentication and verification
│   │   * 🔗 Relationships: jwt
│   ├── 🔐 authorizeRoles.js
│   │   * 🧠 Purpose: Role-Based Access Control permission checker
│   │   * 🔗 Relationships: auth.js
│   ├── 🔐 cacheMiddleware.js
│   │   * 🧠 Purpose: Intercepts and caches API responses using Redis
│   │   * 🔗 Relationships: redis.js
│   ├── 🔐 errorHandler.js
│   │   * 🧠 Purpose: Global error handling and response formatting
│   │   * 🔗 Relationships: logger
│   ├── 🔐 isAdmin.js
│   │   * 🧠 Purpose: Strict middleware to enforce admin-only access
│   │   * 🔗 Relationships: express req.user
│   ├── 🔐 phoneLimiter.js
│   │   * 🧠 Purpose: Rate limits requests based on phone numbers
│   │   * 🔗 Relationships: express-rate-limit
│   ├── 🔐 rateLimiter.js
│   │   * 🧠 Purpose: Generic rate limiting to prevent abuse
│   │   * 🔗 Relationships: express-rate-limit
│   ├── 🔐 securityMiddleware.js
│   │   * 🧠 Purpose: Origin and Custom Header-based CSRF protection
│   │   * 🔗 Relationships: express, helmet
│   ├── 🔐 streakAuth.js
│   │   * 🧠 Purpose: Specialized authentication for the streak system
│   │   * 🔗 Relationships: Device usage tracking
│   ├── 🔐 upload.js
│   │   * 🧠 Purpose: Multer configuration for image uploads
│   │   * 🔗 Relationships: multer
│   ├── 🔐 userIdentifier.js
│   │   * 🧠 Purpose: Generates unique IDs for rate limiting
│   │   * 🔗 Relationships: crypto
│   ├── 🔐 validate.js
│   │   * 🧠 Purpose: Checks express-validator result objects
│   │   * 🔗 Relationships: express-validator
│   └── 🔐 validateRegistration.js
│       * 🧠 Purpose: Complex validation logic for new enrollments
│       * 🔗 Relationships: express-validator
├── 📁 models/
│   ├── 📊 Admin.js
│   │   * 🧠 Purpose: Schema for root administrative users
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Announcement.js
│   │   * 🧠 Purpose: Schema for school news and banners
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Attendance.js
│   │   * 🧠 Purpose: Schema for student attendance records
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 AuditLog.js
│   │   * 🧠 Purpose: Schema for persistent log of admin changes
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Course.js
│   │   * 🧠 Purpose: Schema for class info and teacher links
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 DeviceUsage.js
│   │   * 🧠 Purpose: Schema to track daily activity per device
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Feedback.js
│   │   * 🧠 Purpose: Schema for user-submitted feedback
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 GoogleToken.js
│   │   * 🧠 Purpose: Schema for Google OAuth tokens
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Log.js
│   │   * 🧠 Purpose: Schema for application event logging
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Ranking.js
│   │   * 🧠 Purpose: Schema for monthly star rankings
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Registration.js
│   │   * 🧠 Purpose: Schema for student enrollment data
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 StaffAccount.js
│   │   * 🧠 Purpose: Schema for staff credentials and roles
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 StaffAttendance.js
│   │   * 🧠 Purpose: Schema for staff check-in/out records
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Streak.js
│   │   * 🧠 Purpose: Schema for daily check-in activity
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 Teacher.js
│   │   * 🧠 Purpose: Schema for teacher profiles
│   │   * 🔗 Relationships: mongoose
│   ├── 📊 TimetableCell.js
│   │   * 🧠 Purpose: Schema for a class schedule cell
│   │   * 🔗 Relationships: mongoose
│   └── 📊 TimetableRow.js
│       * 🧠 Purpose: Schema for a time slot row
│       * 🔗 Relationships: mongoose
├── 📁 routes/
│   ├── 🌐 announcementRoutes.js
│   │   * 🧠 Purpose: Endpoints for school updates
│   │   * 🔗 Relationships: express.Router, announcementController
│   ├── 🌐 attendanceRoutes.js
│   │   * 🧠 Purpose: Endpoints for attendance logic
│   │   * 🔗 Relationships: express.Router, attendanceController
│   ├── 🌐 auditRoutes.js
│   │   * 🧠 Purpose: Endpoints for action logs
│   │   * 🔗 Relationships: express.Router, auditController
│   ├── 🌐 authRoutes.js
│   │   * 🧠 Purpose: Authentication endpoints
│   │   * 🔗 Relationships: express.Router, authController
│   ├── 🌐 courseRoutes.js
│   │   * 🧠 Purpose: Management routes for courses
│   │   * 🔗 Relationships: express.Router, courseController
│   ├── 🌐 feedbackRoutes.js
│   │   * 🧠 Purpose: Endpoints for feedback
│   │   * 🔗 Relationships: express.Router, feedbackController
│   ├── 🌐 googleRoutes.js
│   │   * 🧠 Purpose: Integration routes for Google APIs
│   │   * 🔗 Relationships: express.Router, google.controller
│   ├── 🌐 rankingRoutes.js
│   │   * 🧠 Purpose: Routes for fetching leaderboards
│   │   * 🔗 Relationships: express.Router, rankingController
│   ├── 🌐 registrationRoutes.js
│   │   * 🧠 Purpose: Endpoints for student enrollments
│   │   * 🔗 Relationships: express.Router, registrationController
│   ├── 🌐 restoreRoutes.js
│   │   * 🧠 Purpose: Specialized routes for DB restore
│   │   * 🔗 Relationships: express.Router, restore.controller
│   ├── 🌐 staffDashboardRoutes.js
│   │   * 🧠 Purpose: Data routes for the staff UI
│   │   * 🔗 Relationships: express.Router, statsController
│   ├── 🌐 staffRoutes.js
│   │   * 🧠 Purpose: Management routes for staff
│   │   * 🔗 Relationships: express.Router, staffController
│   ├── 🌐 statsRoutes.js
│   │   * 🧠 Purpose: Endpoints for dashboard statistics
│   │   * 🔗 Relationships: express.Router, statsController
│   ├── 🌐 streakRoutes.js
│   │   * 🧠 Purpose: Routes for daily check-ins
│   │   * 🔗 Relationships: express.Router, streakController
│   ├── 🌐 syncRoutes.js
│   │   * 🧠 Purpose: Triggers for data sync
│   │   * 🔗 Relationships: express.Router, syncController
│   ├── 🌐 teacherRoutes.js
│   │   * 🧠 Purpose: Routes for teacher profiles
│   │   * 🔗 Relationships: express.Router, teacherController
│   └── 🌐 timetableRoutes.js
│       * 🧠 Purpose: Routes for class schedules
│       * 🔗 Relationships: express.Router, timetableController
├── 📁 scripts/
│   ├── ⚙️ backup.js
│   │   * 🧠 Purpose: Database backup utility
│   │   * 🔗 Relationships: child_process
│   └── ⚙️ cleanRestoreTmp.js
│       * 🧠 Purpose: Cleans temporary backup files
│       * 🔗 Relationships: fs
├── 📁 services/
│   ├── ⚙️ backup.service.js
│   │   * 🧠 Purpose: Creates and encrypts database dumps
│   │   * 🔗 Relationships: child_process
│   ├── ⚙️ deepCleanService.js
│   │   * 🧠 Purpose: Logic for deleting old records
│   │   * 🔗 Relationships: Models
│   ├── ⚙️ drive.service.js
│   │   * 🧠 Purpose: Wrapper for Google Drive files
│   │   * 🔗 Relationships: googleapis
│   └── ⚙️ restore.service.js
│       * 🧠 Purpose: Handles decryption of backup files
│       * 🔗 Relationships: child_process, encryptionUtils
├── 📁 utils/
│   ├── ⚙️ catchAsync.js
│   │   * 🧠 Purpose: Wrapper to eliminate try-catch blocks
│   │   * 🔗 Relationships: express
│   ├── ⚙️ cloudinary.js
│   │   * 🧠 Purpose: Cloudinary image upload helper
│   │   * 🔗 Relationships: cloudinary
│   ├── ⚙️ emailService.js
│   │   * 🧠 Purpose: Handles sending automated emails
│   │   * 🔗 Relationships: nodemailer
│   ├── ⚙️ encryptionUtils.js
│   │   * 🧠 Purpose: Cryptographic logic for secure backups
│   │   * 🔗 Relationships: crypto
│   ├── ⚙️ logAdminAction.js
│   │   * 🧠 Purpose: Logs admin events to DB
│   │   * 🔗 Relationships: AuditLog Model
│   ├── ⚙️ logger.js
│   │   * 🧠 Purpose: Standard file/console logger
│   │   * 🔗 Relationships: winston
│   ├── ⚙️ normalizePhone.js
│   │   * 🧠 Purpose: Standardizes phone formats
│   │   * 🔗 Relationships: regex
│   ├── ⚙️ sanitize.js
│   │   * 🧠 Purpose: Cleans user input to prevent XSS
│   │   * 🔗 Relationships: xss
│   ├── ⚙️ scheduledTasks.js
│   │   * 🧠 Purpose: Recurring system jobs
│   │   * 🔗 Relationships: node-cron
│   ├── ⚙️ systemLogger.js
│   │   * 🧠 Purpose: Enhanced logger with metadata
│   │   * 🔗 Relationships: winston
│   └── ⚙️ test-encryption.js
│       * 🧠 Purpose: Validation for the encryption system
│       * 🔗 Relationships: crypto
├── 📁 validators/
│   ├── 🔐 registrationValidator.js
│   │   * 🧠 Purpose: Validation rules for user enrollment
│   │   * 🔗 Relationships: express-validator
│   └── 🔐 streakValidator.js
│       * 🧠 Purpose: Validation rules for check-ins
│       * 🔗 Relationships: express-validator
├── 📄 .dockerignore
│   * 🧠 Purpose: Specifies ignored files for Docker build
│   * 🔗 Relationships: Docker
├── 🔐 .env.example
│   * 🧠 Purpose: Safe template for environment variables
│   * 🔗 Relationships: dotenv
├── 📄 Dockerfile
│   * 🧠 Purpose: Container build instructions
│   * 🔗 Relationships: Docker
├── ⚙️ googleSheets.js
│   * 🧠 Purpose: Google Sheets integration logic
│   * 🔗 Relationships: googleapis
├── ⚙️ migrate-childAge.js
│   * 🧠 Purpose: Database migration script for age calculation
│   * 🔗 Relationships: mongoose
├── 📄 nodemon.json
│   * 🧠 Purpose: Configuration for development runner
│   * 🔗 Relationships: nodemon
├── 📄 package.json
│   * 🧠 Purpose: Project dependencies and scripts
│   * 🔗 Relationships: npm
├── 📄 package-lock.json
│   * 🧠 Purpose: Locked dependency versions
│   * 🔗 Relationships: npm
└── ⚙️ server.js
    * 🧠 Purpose: Main entry point, initializes Express, DB, and routes
    * 🔗 Relationships: express, mongoose, routes
```

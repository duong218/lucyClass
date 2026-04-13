# Backend Architecture Documentation - Lucy's Class

## 🌐 System Overview
The **Lucy's Class** backend is a Node.js/Express application designed for performance, security, and reliability. It follows a layered architecture to separate concerns and ensure maintainability.

- **Frontend Interaction**: Communicates with the React frontend via a RESTful API.
- **Database**: Uses **MongoDB Atlas** as the primary cloud database, managed through Mongoose.
- **API Flow**: Request → `routes/` (Routing) → `middlewares/` (Auth/Validation) → `controllers/` (Req/Res handling) → `services/` (Business Logic) → `models/` (Data schemas).
- **Data Protection**: Implements a multi-layered backup and restore system with end-to-end encryption.

---

## ✨ Key Features

### 📦 Backup System
A robust, automated backup pipeline:
1.  **Dumping**: Uses `mongodump` to create consistent database snapshots.
2.  **Compression**: Bundles data into ZIP archives using `archiver`.
3.  **Encryption**: Encrypts ZIP files using **AES-256-CBC** before any external transmission.
4.  **Cloud Storage**: Uploads encrypted backups to **Google Drive** via the Drive API.
5.  **Rotation**: Maintains only the last 20 backups on Google Drive to manage storage efficiency.

### 🛡️ Restore System
Designed for safety and data integrity:
1.  **Safety Backup**: Automatically creates a local "safety" snapshot before starting any restore operation.
2.  **Validation**: decrypts and restores data into a **temporary database** first to verify integrity.
3.  **Destructive Restore**: Only after validation, it performs a `--drop` restore to the primary database.
4.  **Cleanup**: Automatically wipes temporary artifacts and decrypted files after completion.

### ⏰ Cron Jobs
Managed by `node-cron` for automated maintenance:
-   **Database Backups**: Scheduled daily/weekly backups with auto-upload to Google Drive.
-   **Temporary Cleanup**: Periodic cleaning of expired restore artifacts and logs.

---

## 📁 Folder Structure

```text
backend/
├── config/             # System configuration (DB, Cron, Redis, Google)
├── controllers/        # Request handlers and response formatting
├── middlewares/        # Auth guards, security headers, rate limiting
├── models/             # Mongoose schemas and data validation
├── routes/             # API endpoint definitions
├── scripts/            # One-off maintenance and utility scripts
├── services/           # Core business logic (Backup, Restore, Drive)
├── utils/              # Helper functions (Encryption, Email, Logger)
├── validators/         # Input validation rules (express-validator)
├── server.js           # Entry point
└── package.json        # Dependencies and scripts
```

---

## 🔍 Detailed Component Analysis

### `config/`
Centralizes environment-dependent settings.
- `cron.js`: Defines scheduling for automated tasks.
- `db.js`: MongoDB connection logic.
- `google.js`: OAuth2 configuration for Drive/Sheets integration.

### `services/`
The heart of the application logic.
- `backup.service.js`: Manages the entire backup lifecycle.
- `restore.service.js`: Orchestrates the multi-phase restore process.
- `drive.service.js`: Wrapper for Google Drive API operations (upload, download, rotation).

### `controllers/`
Translates HTTP requests into service calls.
- `authController.js`: Manages JWT-based authentication and sessions.
- `registrationController.js`: Handles complex student enrollment logic.
- `restore.controller.js`: Thin layer exposing restore functionality to the admin UI.

### `utils/`
Stateless utility functions.
- `encryptionUtils.js`: AES-256 encryption/decryption routines for backups.
- `emailService.js`: Nodemailer integration for notifications.
- `logger.js`: Winston-based logging for production monitoring.

### `models/`
Defines the data structure using Mongoose.
- `Course.js`, `Teacher.js`, `Registration.js`: Core entity models.
- `AuditLog.js`: Tracks sensitive administrative actions.

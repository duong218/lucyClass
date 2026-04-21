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
- Backup/restore:
  - Backup DB bằng `mongodump` -> zip -> encrypt AES-256-GCM -> upload Google Drive.
  - Restore tải file `.enc` từ Drive, giải mã, tạo safety backup, restore tạm rồi restore chính.
- Logging: `winston` system log (`logs/error.log`, `logs/combined.log`) + Audit log hành động admin.

## 2. Cấu trúc thư mục (tree)

```text
backend/
├─ .env.example              # File mẫu các biến môi trường (Database, Cloudinary, JWT, OAuth...)
├─ server.js                 # File khởi tạo server và mount route
├─ package.json
├─ googleSheets.js           # Đồng bộ dữ liệu đăng ký sang Google Sheets
├─ migrate-childAge.js       # Script migration dữ liệu
├─ Dockerfile, .dockerignore # Cấu hình container hóa
├─ nodemon.json              # Cấu hình watch mode khi development
├─ config/                   # Cấu hình các kết nối ngoại vi
│  ├─ cron.js, db.js, google.js, redis.js
├─ controllers/              # Xử lý nghiệp vụ logic
│  ├─ authController.js, registrationController.js, staffController.js...
│  ├─ courseController.js, teacherController.js, feedbackController.js...
│  ├─ timetableController.js, streakController.js, rankingController.js...
│  ├─ auditController.js, google.controller.js, restore.controller.js, statsController.js
├─ middlewares/              # Lớp bảo vệ và tiền xử lý request
│  ├─ auth.js, isAdmin.js, authorizeRoles.js (RBAC)
│  ├─ csrf.js, securityMiddleware.js
│  ├─ rateLimiter.js, phoneLimiter.js
│  ├─ cacheMiddleware.js     # Cache response public data
│  ├─ upload.js, errorHandler.js, validate.js...
├─ models/                   # Schema định nghĩa dữ liệu (Mongoose)
│  ├─ Admin.js, StaffAccount.js, DeviceUsage.js
│  ├─ Course.js, Teacher.js, Feedback.js, Registration.js
│  ├─ Announcement.js, Ranking.js, Streak.js
│  ├─ TimetableCell.js, TimetableRow.js
│  ├─ Log.js, AuditLog.js, GoogleToken.js
├─ routes/                   # Khai báo endpoint API
│  ├─ authRoutes.js, staffRoutes.js, staffDashboardRoutes.js
│  ├─ registrationRoutes.js, courseRoutes.js, teacherRoutes.js...
│  ├─ googleRoutes.js, restoreRoutes.js, auditRoutes.js, statsRoutes.js...
├─ services/                 # Xử lý các tác vụ phức tạp/ngoại vi
│  ├─ backup.service.js, drive.service.js, restore.service.js
├─ scripts/                  # Các script vận hành hệ thống
│  ├─ backup.js, cleanRestoreTmp.js
├─ validators/               # Validation schema bằng express-validator
│  ├─ registrationValidator.js, streakValidator.js
└─ utils/                    # Các hàm tiện ích dùng chung
   ├─ encryptionUtils.js, cloudinary.js, emailService.js, normalizePhone.js...
   ├─ catchAsync.js, logger.js, systemLogger.js, sanitize.js...
```

## 3. Các thực thể chính (Models)

- `Admin`: Tài khoản quản trị cấp cao nhất.
- `StaffAccount`: Tài khoản nhân viên (Marketing, Teacher).
- `Course` & `Teacher`: Thông tin khóa học và giáo viên.
- `Registration`: Dữ liệu đăng ký từ phụ huynh.
- `Streak` & `DeviceUsage`: Quản lý chuỗi check-in và định danh thiết bị.
- `TimetableRow` & `TimetableCell`: Cấu trúc lịch học theo tuần.
- `AuditLog`: Lưu trữ mọi thao tác nhạy cảm của Admin/Staff.

## 4. API Endpoints (Tổng hợp)

| Nhóm | Method | Prefix | Mô tả |
|---|---|---|---|
| Auth | POST | `/api/auth` | Login, Logout, Refresh, Forgot/Reset Password |
| Staff | GET/POST | `/api/staff` | CRUD tài khoản nhân viên (Admin only) |
| Profile | GET | `/api/me/profile` | Xem profile cá nhân của Staff |
| Course | GET/POST | `/api/courses` | Quản lý khóa học & danh sách học viên |
| Teacher | GET/POST | `/api/teachers` | Quản lý đội ngũ giáo viên |
| Registration | GET/POST | `/api/registrations`| Quản lý đăng ký, export Excel |
| Streak | GET/POST | `/api/streak` | Check-in, Leaderboard, Revive streak |
| Timetable | GET/PUT | `/api/timetable` | Quản lý lịch học tuần |
| Backup | POST | `/api/auth/google`| Backup/Restore dữ liệu lên Google Drive |
| Stats | GET | `/api/stats` | Thống kê Dashboard & Biểu đồ |

## 5. Security Features

- **Xác thực**: JWT Access Token (ngắn hạn) kết hợp Refresh Token (dài hạn, lưu cookie httpOnly).
- **Phân quyền**: RBAC nghiêm ngặt (Admin > Staff roles).
- **Chống Spam**: Rate limiting theo IP và theo Số điện thoại (Streak).
- **Bảo mật dữ liệu**: Mã hóa AES-256-GCM cho file backup trước khi lên Drive.
- **CSRF**: Token-based kết hợp Origin/Header check.

## Ghi chú scan

- Đã quét và cập nhật đúng cấu trúc thực tế của backend.
- **TUYỆT ĐỐI TUÂN THỦ QUY TẮC BẢO MẬT**: Đã bỏ qua hoàn toàn nội dung các file `.env` và `.env.production`. Chỉ đề cập đến cấu trúc mẫu qua `.env.example`.
- Bổ sung hệ thống Staff Management và Device Usage Tracking.

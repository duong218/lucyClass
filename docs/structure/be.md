# Backend Structure (lucyClass-main/backend)

## 1. Tổng quan kiến trúc

- **Runtime**: Node.js (CommonJS).
- **Web Framework**: Express 4.
- **Database**: MongoDB + Mongoose.
- **Authentication**: JWT (Access Token & Refresh Token) + bcryptjs (Hashing).
- **Security Layers**:
  - `helmet`: Thiết lập các HTTP headers bảo mật.
  - `express-mongo-sanitize`: Chống SQL/NoSQL Injection.
  - `csurf`: Chống tấn công CSRF.
  - `express-rate-limit`: Giới hạn tần suất request cho các route nhạy cảm.
- **Task Scheduling**: `node-cron` cho việc sao lưu dữ liệu và kiểm tra hệ thống.
- **Storage**: Cloudinary (lưu ảnh), Google Drive (lưu backup).
- **Logging**: `winston` + `morgan` xử lý system logs và audit logs.

## 2. Cấu trúc thư mục chi tiết

```text
backend/
├── config/                  # Cấu hình các kết nối bên ngoài
│   ├── cron.js              # Định nghĩa các tác vụ tự động
│   ├── db.js                # Kết nối MongoDB
│   ├── google.js            # Cấu hình Google API (Sheets, Drive)
│   └── redis.js             # Cấu hình Redis (nếu có dùng để cache)
├── controllers/             # Xử lý logic nghiệp vụ
│   ├── announcementController.js
│   ├── auditController.js   # Quản lý nhật ký hoạt động
│   ├── authController.js    # Login, Logout, Refresh Token, Reset Password
│   ├── courseController.js  # CRUD Khóa học & Điểm danh (Attendance)
│   ├── feedbackController.js
│   ├── google.controller.js # OAuth2 & Google Sheets integration
│   ├── rankingController.js # Xử lý bảng xếp hạng Streak
│   ├── registrationController.js
│   ├── restore.controller.js # Phục hồi dữ liệu từ backup
│   ├── staffController.js   # Profile & Dashboards cho NV
│   ├── statsController.js   # Thống kê tổng hợp (Admin Dashboard)
│   ├── streakController.js  # Logic Check-in hàng ngày & Revive
│   ├── teacherController.js
│   └── timetableController.js
├── middlewares/             # Các lớp kiểm soát request
│   ├── adminValidator.js
│   ├── auth.js              # Verify JWT
│   ├── authorizeRoles.js    # Kiểm tra Role (admin/teacher/marketing)
│   ├── cacheMiddleware.js
│   ├── csrf.js              # Token & Origin validation
│   ├── errorHandler.js      # Tập trung xử lý lỗi
│   ├── isAdmin.js           # Shortcut check admin
│   ├── phoneLimiter.js
│   ├── rateLimiter.js
│   ├── securityMiddleware.js
│   ├── streakAuth.js
│   ├── upload.js            # Middleware cấu hình Cloudinary
│   ├── userIdentifier.js
│   ├── validate.js          # Chạy express-validator
│   └── validateRegistration.js
├── models/                  # Mongoose Schemas (Xem chi tiết mục 4)
│   ├── Admin.js
│   ├── Announcement.js
│   ├── Attendance.js        # [NEW] Lưu điểm danh theo ngày
│   ├── AuditLog.js
│   ├── Course.js
│   ├── DeviceUsage.js
│   ├── Feedback.js
│   ├── GoogleToken.js
│   ├── Log.js
│   ├── Ranking.js
│   ├── Registration.js      # Đơn đăng ký & Hồ sơ học viên
│   ├── StaffAccount.js      # Tài khoản nhân viên (Role-based)
│   ├── Streak.js            # Dữ liệu điểm danh chuỗi
│   ├── Teacher.js           # Hồ sơ giáo viên
│   ├── TimetableCell.js
│   └── TimetableRow.js
├── routes/                  # Định nghĩa các endpoint API
│   ├── announcementRoutes.js
│   ├── auditRoutes.js
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── feedbackRoutes.js
│   ├── googleRoutes.js
│   ├── rankingRoutes.js
│   ├── registrationRoutes.js
│   ├── restoreRoutes.js
│   ├── staffDashboardRoutes.js
│   ├── staffRoutes.js
│   ├── statsRoutes.js
│   ├── streakRoutes.js
│   ├── teacherRoutes.js
│   └── timetableRoutes.js
├── scripts/                 # Công cụ dòng lệnh (CLI)
│   ├── backup.js            # Chạy backup thủ công
│   └── cleanRestoreTmp.js   # Dọn dẹp file tạm sau khi restore
├── services/                # Logic tương tác với dịch vụ bên thứ 3
│   ├── backup.service.js    # Logic nén và mã hóa database
│   ├── drive.service.js     # Tương tác với Google Drive API
│   └── restore.service.js   # Logic giải mã và khôi phục database
├── utils/                   # Các hàm tiện ích
│   ├── catchAsync.js        # Wrapper cho async/await error
│   ├── cloudinary.js
│   ├── emailService.js      # Gửi email (Nodemailer)
│   ├── encryptionUtils.js   # AES-256-GCM cho file backup
│   ├── logAdminAction.js
│   ├── logger.js
│   ├── normalizePhone.js
│   ├── sanitize.js
│   ├── scheduledTasks.js
│   ├── systemLogger.js
│   └── test-encryption.js
├── validators/              # Schema validation cho request body
│   ├── registrationValidator.js
│   └── streakValidator.js
├── .dockerignore
├── .env.example             # Biến môi trường mẫu
├── Dockerfile               # Containerization cấu hình
├── googleSheets.js          # Logic đồng bộ đơn đăng ký sang Sheets
├── migrate-childAge.js      # Script chuyển đổi dữ liệu cũ
├── nodemon.json
├── package.json
└── server.js                # Entry point: Khởi tạo Server & Middleware
```

## 3. Các Route Group chính

- **Auth**: `/api/auth` (Login, Logout, Reset Password).
- **Courses**: `/api/courses` (CRUD khóa học, quản lý học viên, điểm danh).
- **Teachers**: `/api/teachers` (Hồ sơ giáo viên, tự động liên kết StaffAccount).
- **Registrations**: `/api/registrations` (Xử lý form từ khách hàng).
- **Staff/Accounts**: `/api/staff` (Quản lý tài khoản nhân viên - dành cho Admin).
- **Streak**: `/api/streaks` (Check-in, Bảng xếp hạng, Revive).
- **Backup/Restore**: `/api/restore` (Quản lý các bản sao lưu trên Cloud).

## 4. Chi tiết các Models quan trọng

### StaffAccount
Lưu trữ thông tin đăng nhập của nhân viên.
- `username`: LC + 8 chữ số (duy nhất).
- `role`: 'teacher' hoặc 'marketing'.
- `courseIds`: Danh sách các lớp giáo viên đang phụ trách.
- `isActive`: Boolean (cho phép vô hiệu hóa tài khoản).

### Course
Thông tin chi tiết về lớp học.
- `name`, `ageGroup`, `duration`, `classSize`.
- `teacher`: Ref tới hồ sơ Teacher chính.
- `additionalTeachers`: Mảng Ref tới các trợ giảng.

### Attendance
Lưu vết điểm danh từng buổi.
- `courseId`, `date` (được đánh index unique theo cặp).
- `records`: Mảng `{ studentId, status: 'present' | 'absent' }`.
- `takenBy`: Ref tới StaffAccount thực hiện điểm danh.

### Registration (Student)
- `parentName`, `phone`, `childName`, `childAge`.
- `courseId`: Lớp học đã đăng ký.
- `status`: 'not_contacted', 'contacted', 'registered'.

## 5. Ghi chú bảo mật & Cấu hình
- **File quan trọng**: `server.js` cấu hình CORS, CSRF, và giới hạn kích thước payload.
- **Môi trường**: 
  - `PORT`: Cổng chạy backend.
  - `MONGODB_URI`: Chuỗi kết nối DB.
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`: Khóa ký Token.
  - `ENCRYPTION_KEY`: Khóa mã hóa file backup (32 bytes).
- **Security Note**: Toàn bộ nội dung file `.env` đã được bỏ qua để đảm bảo an toàn. Tuyệt đối không commit file `.env` lên Git.

---
*Tài liệu được cập nhật dựa trên cấu trúc thực tế ngày 21/04/2026.*

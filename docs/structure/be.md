# Cấu trúc Backend

## Phạm vi
- Tài liệu này mô tả backend đang chạy trong thư mục `backend/`.
- Mục tiêu là phản ánh đúng cấu trúc hiện tại của codebase, các nhóm module chính, route đang mount và các luồng nghiệp vụ quan trọng.
- Không liệt kê `node_modules/`, log runtime hoặc nội dung sinh ra khi build/chạy.

## Tổng quan
- Stack chính: `Node.js`, `Express`, `MongoDB/Mongoose`, `Redis`, `Google Drive API`.
- Entry point: `backend/server.js`.
- Backend phục vụ đồng thời:
  - website public,
  - khu vực admin,
  - khu vực teacher,
  - khu vực marketing,
  - tác vụ backup/restore,
  - tính năng public `streak/ranking`.

## Sơ đồ thư mục

```text
backend/
|-- config/
|-- controllers/
|-- middlewares/
|-- models/
|-- routes/
|-- scripts/
|-- services/
|-- utils/
|-- validators/
|-- .env
|-- .env.example
|-- .env.production
|-- Dockerfile
|-- googleSheets.js
|-- migrate-childAge.js
|-- nodemon.json
|-- package.json
`-- server.js
```

## Entry point `server.js`
- Nạp biến môi trường và kiểm tra các biến bắt buộc như `MONGO_URI`, `BACKUP_PATH`, `CLOUDINARY_*`, `BACKUP_ENCRYPTION_KEY`, `RECAPTCHA_SECRET_KEY`.
- Khởi tạo các middleware nền:
  - `cookie-parser`,
  - `cors`,
  - `helmet`,
  - CSRF tự triển khai qua `Origin` + `X-Requested-With`,
  - `express.json` và `urlencoded`,
  - `express-mongo-sanitize`,
  - `xss-clean`,
  - `userIdentifier`,
  - rate limit cho toàn bộ `/api`.
- Mount toàn bộ API chính:
  - `/api/auth`
  - `/api/courses`
  - `/api/teachers`
  - `/api/registrations`
  - `/api/students`
  - `/api/feedback`
  - `/api/stats`
  - `/api/admin/history`
  - `/api/auth/google`
  - `/api/restore`
  - `/api/announcements`
  - `/api/timetable`
  - `/api/rankings`
  - `/api/streak`
  - `/api/staff`
  - `/api/me`
  - `/api/sync`
  - `/api/attendance`
  - `/api/staff-attendance`
- Có thêm 2 endpoint được định nghĩa trực tiếp:
  - `POST /api/submit`: form đăng ký public có reCAPTCHA, lưu MongoDB và đồng bộ Google Sheets.
  - `GET /api/health`: kiểm tra trạng thái dịch vụ.
- Khi khởi động:
  - kết nối MongoDB,
  - retry backup upload dang dở,
  - kết nối Redis nếu khả dụng,
  - khởi tạo cron jobs,
  - nạp `utils/scheduledTasks`,
  - bật HTTP server.
- Có xử lý `uncaughtException`, `unhandledRejection`, `SIGINT`, `SIGTERM` và graceful shutdown cho HTTP, MongoDB, Redis.

## Cấu hình `config/`

### `config/db.js`
- Tạo kết nối MongoDB cho toàn hệ thống.

### `config/redis.js`
- Khởi tạo Redis client bằng `ioredis`.
- Hỗ trợ cả `REDIS_URL` và cấu hình host/port/password riêng.
- Redis được dùng cho cache và một phần rate limit/chống spam.

### `config/google.js`
- Cấu hình OAuth Google cho luồng backup/restore qua Drive.

### `config/cron.js`
- Chứa cron jobs nền khi `ENABLE_CRON=true`.
- Các lịch đang có:
  - backup hằng ngày lúc `02:00`,
  - dọn ranking cũ lúc `02:15`,
  - dọn orphan ranking lúc `02:30`,
  - dọn database restore tạm lúc `03:00`,
  - deep clean định kỳ 6 tháng lúc `04:00` ngày `01/01` và `01/07`.

## Điều hướng API `routes/`

### `authRoutes.js`
- Đăng nhập, đăng xuất, refresh token, quên mật khẩu, đặt lại mật khẩu, lấy user hiện tại, kiểm tra xung đột session.

### `courseRoutes.js`
- CRUD khóa học, dữ liệu điểm danh theo khóa, danh sách học sinh theo lớp, chuyển lớp.

### `teacherRoutes.js`
- Public read cho website và admin CRUD cho giáo viên.

### `registrationRoutes.js`
- Quản lý đăng ký học, export Excel, cập nhật trạng thái, xóa hoặc chuyển đổi dữ liệu học viên.

### `feedbackRoutes.js`
- Public read và admin CRUD cho phản hồi.

### `statsRoutes.js`
- Dữ liệu dashboard và thống kê chi tiết.

### `auditRoutes.js`
- Lịch sử thao tác admin và export log.

### `googleRoutes.js`
- OAuth Google và các thao tác backup liên quan Drive.

### `restoreRoutes.js`
- Theo dõi tiến độ restore và kích hoạt khôi phục dữ liệu.

### `announcementRoutes.js`
- Thông báo public, submission của marketing, review/admin CRUD, đánh dấu đã xem.

### `timetableRoutes.js`
- Đọc và chỉnh sửa thời khóa biểu dạng lưới, export file thời khóa biểu.

### `rankingRoutes.js`
- Tạo/cập nhật ranking và lấy top ranking public.

### `streakRoutes.js`
- Start, check-in, revive và leaderboard cho streak public.

### `staffRoutes.js`
- Quản lý tài khoản `teacher` và `marketing`.

### `staffDashboardRoutes.js`
- API hồ sơ cá nhân cho staff đã đăng nhập.

### `syncRoutes.js`
- Đồng bộ hoặc dọn dữ liệu nặng như ranking/deep clean.

### `attendanceRoutes.js`
- Chấm công staff, lịch sử chấm công, chỉnh sửa và export.

## Điều phối nghiệp vụ `controllers/`

### Nhóm nội bộ
- `authController.js`: xác thực, access token, refresh token, session conflict, forgot/reset password.
- `staffController.js`: tạo và quản lý tài khoản staff.
- `staffAttendanceController.js`: check-in/check-out và admin attendance.
- `attendanceController.js`: lớp bọc route cho attendance staff.
- `auditController.js`: lấy log và export CSV.
- `statsController.js`: widget và dữ liệu dashboard admin.

### Nhóm học vụ
- `courseController.js`: khóa học, điểm danh, phân quyền teacher theo lớp, export attendance.
- `registrationController.js`: tạo và quản lý đơn đăng ký, chống trùng, đồng bộ dữ liệu học viên.
- `teacherController.js`: CRUD giáo viên, avatar Cloudinary, liên kết `StaffAccount`.
- `timetableController.js`: lưới thời khóa biểu theo tuần.

### Nhóm public/content
- `feedbackController.js`: phản hồi website.
- `announcementController.js`: thông báo public và luồng duyệt bài marketing.
- `rankingController.js`: bảng xếp hạng.
- `streakController.js`: streak public và leaderboard.

### Nhóm backup/sync
- `google.controller.js`: kết nối Google và gọi backup.
- `restore.controller.js`: danh sách backup, tiến độ và restore.
- `syncController.js`: đồng bộ ranking, deep clean.

## Tầng bảo vệ `middlewares/`
- `auth.js`: xác thực JWT access token, gắn `req.user`, kiểm tra session đang hoạt động.
- `authorizeRoles.js`: phân quyền theo role.
- `isAdmin.js`: chặn nếu không phải admin.
- `securityMiddleware.js`: xác thực CSRF cho request thay đổi dữ liệu.
- `rateLimiter.js`: bộ limiter cho API chung, login, đăng ký, thống kê, forgot/reset password, streak, backup/restore.
- `checkBlockedIP.js`: chặn IP bị khóa trước khi cho login.
- `phoneLimiter.js`: chống spam theo phone/IP cho streak.
- `userIdentifier.js`: nhận diện user hiện tại để hỗ trợ limiter và logging.
- `upload.js`: upload ảnh qua `multer`, kiểm tra extension, MIME, magic number, kích thước, pixel và re-encode ảnh.
- `cacheMiddleware.js`: cache GET response bằng Redis và hỗ trợ xóa cache theo prefix.
- `validate.js`, `validateRegistration.js`, `adminValidator.js`: validate dữ liệu đầu vào.
- `errorHandler.js`: chuẩn hóa lỗi ở tầng cuối.

## Mô hình dữ liệu `models/`
- `Admin.js`: tài khoản admin.
- `StaffAccount.js`: tài khoản teacher/marketing.
- `Teacher.js`: dữ liệu giáo viên public và liên kết staff nội bộ.
- `Course.js`: khóa học.
- `Registration.js`: đăng ký học/học viên.
- `Attendance.js`: điểm danh theo khóa/ngày.
- `StaffAttendance.js`: chấm công staff.
- `Feedback.js`: phản hồi public.
- `Announcement.js`: thông báo và trạng thái duyệt.
- `AuditLog.js`: log thao tác admin.
- `Ranking.js`, `Streak.js`, `DeviceUsage.js`: dữ liệu streak/ranking/chống spam.
- `GoogleToken.js`: token OAuth Google.
- `BlockedIP.js`, `LoginAttemptLog.js`, `Log.js`: hỗ trợ bảo mật và logging.
- `TimetableRow.js`, `TimetableCell.js`: lưới thời khóa biểu.

## Tầng dịch vụ `services/`

### `backup.service.js`
- Chạy backup MongoDB, nén, mã hóa, upload Google Drive.
- Có logic retry file upload dở dang khi server khởi động lại.

### `drive.service.js`
- Đóng gói thao tác với Google Drive: upload, download, liệt kê và dọn backup cũ.

### `restore.service.js`
- Giải mã backup, kiểm tra an toàn file, restore thử vào DB tạm, restore thật và xóa Redis cache sau khôi phục.

### `deepCleanService.js`
- Các tác vụ dọn dữ liệu sâu, xử lý ranking orphan và nghiệp vụ dọn dẹp định kỳ.

## Tiện ích `utils/`
- `catchAsync.js`: wrapper cho controller async.
- `cloudinary.js`: upload/xóa ảnh trên Cloudinary.
- `emailService.js`: gửi email đăng ký và reset mật khẩu.
- `encryptionUtils.js`: mã hóa/giải mã file backup.
- `logAdminAction.js`: ghi log thao tác admin.
- `logger.js`, `systemLogger.js`: logging nghiệp vụ và hệ thống.
- `normalizePhone.js`, `sanitize.js`: chuẩn hóa dữ liệu đầu vào.
- `scheduledTasks.js`: các tác vụ nền phụ trợ ngoài cron.

## Script và file gốc
- `googleSheets.js`: ghi dữ liệu đăng ký sang Google Sheets.
- `migrate-childAge.js`: script migrate trường `childAge`.
- `scripts/cleanRestoreTmp.js`: dọn artifact restore tạm.
- `Dockerfile`: build image backend.
- `nodemon.json`: cấu hình chạy dev.
- `.env.example`, `.env.production`: mẫu cấu hình môi trường.

## Luồng chính

### Public website
- Frontend public gọi các API như khóa học, giáo viên, phản hồi, thông báo, thời khóa biểu, ranking, streak, submit đăng ký.

### Xác thực nội bộ
- Người dùng đăng nhập qua `POST /api/auth/login`.
- Backend trả `accessToken` cho header `Authorization` và dùng refresh token qua cookie `httpOnly`.
- Session được kiểm tra lại qua `GET /api/auth/check-session`.

### Backup/restore
- Admin kết nối Google.
- Backup chạy thủ công hoặc theo cron, file được mã hóa trước khi upload.
- Restore dùng DB tạm để kiểm tra trước khi đè dữ liệu chính.

### Teacher/marketing
- Teacher xem dashboard, danh sách học sinh lớp mình và chấm công.
- Marketing có dashboard riêng và gửi thông báo chờ admin duyệt.

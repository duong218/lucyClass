# Cấu trúc Backend

## Phạm vi tài liệu
- Tài liệu này mô tả phần mã nguồn backend thực tế trong `backend/`.
- Chủ đích là ghi rõ từng folder, từng file chính và chức năng hiện có của chúng.
- Không liệt kê `node_modules/`, `logs/`, file build tạm, hoặc nội dung phụ thuộc cài từ package manager.

## Tổng quan
- Stack chính: `Node.js`, `Express`, `MongoDB`, `Mongoose`, `Redis`.
- Điểm vào ứng dụng: `backend/server.js`.
- Kiến trúc chính: tách `config`, `routes`, `controllers`, `middlewares`, `models`, `services`, `utils`, `validators`, `scripts`.
- Chức năng nghiệp vụ chính:
  - Xác thực và quản lý phiên cho `admin`, `teacher`, `marketing`.
  - Quản lý khóa học, giáo viên, học viên đăng ký, phản hồi, thông báo.
  - Chấm công staff, thời khóa biểu, thống kê, lịch sử thao tác admin.
  - Sao lưu và khôi phục dữ liệu qua Google Drive.
  - Tính năng `streak/ranking` riêng cho luồng tương tác công khai.

## Sơ đồ thư mục

```text
backend/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── scripts/
├── services/
├── utils/
├── validators/
├── .dockerignore
├── .env
├── .env.example
├── .env.production
├── Dockerfile
├── googleSheets.js
├── migrate-childAge.js
├── nodemon.json
├── package-lock.json
├── package.json
├── readme1.txt
└── server.js
```

## Thư mục `config`

### `backend/config/cron.js`
- Khởi tạo các cron job nền.
- Phục vụ lịch sao lưu định kỳ và các tác vụ dọn dẹp bảo trì.

### `backend/config/db.js`
- Tạo kết nối MongoDB cho toàn hệ thống.
- Được gọi khi server khởi động.

### `backend/config/google.js`
- Cấu hình OAuth/client Google dùng cho luồng sao lưu và khôi phục qua Drive.

### `backend/config/redis.js`
- Khởi tạo Redis client dùng cho cache và một số cơ chế giới hạn spam.

## Thư mục `controllers`

### `backend/controllers/announcementController.js`
- Xử lý toàn bộ nghiệp vụ thông báo.
- Bao gồm:
  - lấy danh sách thông báo public đã `published`,
  - lấy thông báo mới nhất cho chuông thông báo,
  - đánh dấu đã xem,
  - marketing gửi bài chờ duyệt,
  - admin duyệt/từ chối,
  - admin CRUD trực tiếp.

### `backend/controllers/attendanceController.js`
- Là lớp bọc xuất lại nghiệp vụ từ `staffAttendanceController.js`.
- Dùng để giữ interface route `/api/attendance` thống nhất.

### `backend/controllers/auditController.js`
- Xử lý lịch sử thao tác admin.
- Bao gồm:
  - lấy danh sách log có phân trang/lọc,
  - thống kê log,
  - xuất CSV lịch sử thao tác.
- Có sanitize ô CSV để chống Excel formula injection.

### `backend/controllers/authController.js`
- Xử lý đăng nhập, refresh token, đăng xuất, quên mật khẩu, đặt lại mật khẩu, kiểm tra session.
- Các điểm đáng chú ý:
  - sinh `accessToken` và `refreshToken`,
  - lưu `activeSessionId`,
  - rotate refresh token,
  - khóa tạm tài khoản khi login sai nhiều lần,
  - bắt reCAPTCHA ở login và forgot password,
  - hỗ trợ cả `Admin` và `StaffAccount`.

### `backend/controllers/courseController.js`
- Xử lý nghiệp vụ khóa học.
- Bao gồm:
  - lấy danh sách/public chi tiết khóa học,
  - tạo/sửa/xóa khóa học,
  - lấy danh sách điểm danh theo khóa,
  - lưu điểm danh,
  - xuất Excel điểm danh,
  - kiểm tra quyền giáo viên với khóa học qua giáo viên chính/phụ.

### `backend/controllers/feedbackController.js`
- Quản lý phản hồi/phụ huynh đánh giá.
- Bao gồm public read và admin CRUD.

### `backend/controllers/google.controller.js`
- Điều phối OAuth Google và sao lưu Drive.
- Bao gồm:
  - chuyển hướng xác thực Google,
  - xử lý callback,
  - backup dữ liệu lên Google Drive.

### `backend/controllers/rankingController.js`
- Xử lý bảng xếp hạng.
- Bao gồm tạo/cập nhật ranking và lấy top ranking công khai.

### `backend/controllers/registrationController.js`
- Xử lý đơn đăng ký học và chuyển đổi thành học viên.
- Bao gồm:
  - tạo đăng ký công khai,
  - kiểm tra trùng,
  - kiểm tra sức chứa lớp,
  - gửi email,
  - đồng bộ Google Sheets,
  - cập nhật/xóa đăng ký,
  - xuất Excel đăng ký,
  - lấy danh sách học sinh theo lớp,
  - cho học sinh nghỉ,
  - chuyển lớp học viên.

### `backend/controllers/restore.controller.js`
- Điều phối khôi phục dữ liệu từ Google Drive hoặc file backup.
- Bao gồm:
  - liệt kê danh sách backup trên Drive,
  - kích hoạt restore,
  - trả tiến độ restore.

### `backend/controllers/staffAttendanceController.js`
- Xử lý chấm công staff.
- Bao gồm:
  - check-in/check-out,
  - lấy chấm công hôm nay,
  - lấy lịch sử chấm công,
  - admin xem theo ngày,
  - admin chỉnh sửa/upsert,
  - admin xuất Excel chấm công.

### `backend/controllers/staffController.js`
- Quản lý tài khoản staff.
- Bao gồm:
  - admin tạo tài khoản teacher/marketing,
  - cập nhật thông tin staff,
  - reset mật khẩu staff,
  - vô hiệu hóa hoặc xóa vĩnh viễn tài khoản,
  - staff tự xem hồ sơ cá nhân và lớp phụ trách.

### `backend/controllers/statsController.js`
- Cung cấp dữ liệu thống kê tổng quan cho dashboard admin.
- Bao gồm số liệu nhanh và dữ liệu biểu đồ.

### `backend/controllers/streakController.js`
- Xử lý tính năng streak công khai.
- Bao gồm tạo streak, xem streak hiện tại, check-in, revive, leaderboard ngày/tuần.

### `backend/controllers/syncController.js`
- Xử lý các thao tác đồng bộ/dọn dẹp dữ liệu nặng.
- Bao gồm:
  - đồng bộ ranking,
  - deep clean dữ liệu.

### `backend/controllers/teacherController.js`
- Quản lý giáo viên.
- Bao gồm:
  - public read danh sách/chi tiết,
  - admin CRUD,
  - upload avatar lên Cloudinary,
  - tự động tạo `StaffAccount` cho giáo viên mới,
  - soft delete giáo viên và vô hiệu hóa tài khoản staff liên kết,
  - ẩn các field nội bộ khỏi response public.

### `backend/controllers/timetableController.js`
- Xử lý thời khóa biểu.
- Bao gồm:
  - lấy lưới thời khóa biểu theo tuần,
  - tạo/sửa/xóa hàng,
  - đổi thứ tự hàng,
  - upsert ô trong bảng,
  - xuất file thời khóa biểu.

## Thư mục `middlewares`

### `backend/middlewares/adminValidator.js`
- Chứa rule validate cho các form admin như khóa học, giáo viên.

### `backend/middlewares/auth.js`
- Middleware xác thực JWT access token.
- Gắn `req.user`, nhận diện role, kiểm tra `activeSessionId`, kiểm tra staff bị vô hiệu hóa.
- Với role `teacher`, tự truy ra `teacherId` để dùng cho kiểm soát truy cập lớp.

### `backend/middlewares/authorizeRoles.js`
- Middleware phân quyền theo danh sách role cho route.

### `backend/middlewares/cacheMiddleware.js`
- Cache response GET bằng Redis.
- Có hàm xóa cache theo prefix và xóa toàn bộ cache sau restore.

### `backend/middlewares/errorHandler.js`
- Bộ xử lý lỗi toàn cục của Express.

### `backend/middlewares/isAdmin.js`
- Middleware chặn nếu user không phải admin.

### `backend/middlewares/phoneLimiter.js`
- Bộ limiter theo số điện thoại/IP cho tính năng streak.
- Chống 1 IP dùng quá nhiều số, 1 số spam liên tục, 1 IP đổi số quá nhiều lần.

### `backend/middlewares/rateLimiter.js`
- Tập hợp limiter dùng `express-rate-limit`.
- Có limiter riêng cho:
  - API chung,
  - login,
  - đăng ký,
  - thống kê,
  - forgot/reset password,
  - streak,
  - tác vụ nặng backup/restore,
  - toggle attendance.

### `backend/middlewares/securityMiddleware.js`
- Kiểm tra CSRF theo `Origin` + header `X-Requested-With`.
- Bỏ qua `GET/HEAD/OPTIONS` và một số path public được whitelist.

### `backend/middlewares/streakAuth.js`
- Middleware xác thực/phụ trợ riêng cho khu vực `streak` nếu cần phân tách luồng.

### `backend/middlewares/upload.js`
- Cấu hình upload ảnh bằng `multer.memoryStorage()`.
- Kiểm tra:
  - phần mở rộng,
  - MIME type,
  - magic number,
  - kích thước file,
  - giới hạn pixel,
  - re-encode ảnh để loại EXIF/payload ẩn.

### `backend/middlewares/userIdentifier.js`
- Nhận diện người dùng từ token mà không chặn request.
- Dùng để limiter có thể biết admin và bỏ qua giới hạn nếu cần.

### `backend/middlewares/validate.js`
- Middleware gom lỗi validation và trả response chuẩn hóa.

### `backend/middlewares/validateRegistration.js`
- Validate form đăng ký public.
- Bao gồm:
  - honeypot `website`,
  - cooldown theo IP,
  - kiểm tra tên, số điện thoại, nhóm tuổi, email.

## Thư mục `models`

### `backend/models/Admin.js`
- Model tài khoản admin.
- Chứa email, password hash, refresh tokens, lock trạng thái, reset token.

### `backend/models/Announcement.js`
- Model dữ liệu thông báo.
- Lưu trạng thái như pending/published/rejected và metadata duyệt bài.

### `backend/models/Attendance.js`
- Model dữ liệu điểm danh học viên theo khóa/ngày.

### `backend/models/AuditLog.js`
- Model log thao tác admin.
- Dùng cho trang lịch sử và export CSV.

### `backend/models/Course.js`
- Model khóa học.
- Lưu thông tin lớp, giáo viên chính/phụ, sức chứa, trạng thái hoạt động.

### `backend/models/DeviceUsage.js`
- Model theo dõi sử dụng thiết bị, phục vụ streak hoặc cơ chế chống spam.

### `backend/models/Feedback.js`
- Model phản hồi/phụ huynh đánh giá hiển thị trên website.

### `backend/models/GoogleToken.js`
- Model lưu token Google OAuth để thao tác Drive.

### `backend/models/Log.js`
- Model log hệ thống/phụ trợ cho hoạt động nội bộ.

### `backend/models/Ranking.js`
- Model dữ liệu xếp hạng.

### `backend/models/Registration.js`
- Model đăng ký học.
- Có:
  - trạng thái đăng ký,
  - cờ `isActive`,
  - lịch sử chuyển lớp,
  - index phục vụ kiểm tra trùng/lọc,
  - TTL index dọn dữ liệu cũ sau 1 năm.

### `backend/models/StaffAccount.js`
- Model tài khoản staff cho `teacher` và `marketing`.
- Có:
  - username dạng `LC########`,
  - password hash,
  - role,
  - displayName,
  - `isActive`,
  - refresh tokens,
  - helper tạo username/mật khẩu ngẫu nhiên.

### `backend/models/StaffAttendance.js`
- Model lưu log chấm công staff.

### `backend/models/Streak.js`
- Model lưu trạng thái streak của người dùng công khai.

### `backend/models/Teacher.js`
- Model giáo viên public.
- Có liên kết nội bộ tới `StaffAccount` qua `staffAccountId`.
- `toJSON()` tự loại bỏ `staffAccountId`, `avatarPublicId`, `isDeleted`, `deletedAt`.

### `backend/models/TimetableCell.js`
- Model ô dữ liệu của thời khóa biểu.

### `backend/models/TimetableRow.js`
- Model hàng của thời khóa biểu.

## Thư mục `routes`

### `backend/routes/announcementRoutes.js`
- Route thông báo public, staff và admin.

### `backend/routes/attendanceRoutes.js`
- Route chấm công staff dùng chung cho teacher/marketing/admin.

### `backend/routes/auditRoutes.js`
- Route lịch sử thao tác admin.

### `backend/routes/authRoutes.js`
- Route xác thực:
  - `me`,
  - login,
  - logout,
  - refresh-token,
  - forgot/reset password,
  - check-session.

### `backend/routes/courseRoutes.js`
- Route khóa học, danh sách học sinh theo lớp, điểm danh theo lớp, chuyển lớp.

### `backend/routes/feedbackRoutes.js`
- Route phản hồi public/admin.

### `backend/routes/googleRoutes.js`
- Route kết nối Google, backup và restore qua Drive.

### `backend/routes/rankingRoutes.js`
- Route tạo/cập nhật ranking và lấy top ranking.

### `backend/routes/registrationRoutes.js`
- Route quản lý đăng ký học và export đăng ký.

### `backend/routes/restoreRoutes.js`
- Route lấy tiến độ restore.

### `backend/routes/staffDashboardRoutes.js`
- Route để teacher/marketing lấy profile cá nhân.

### `backend/routes/staffRoutes.js`
- Route quản lý tài khoản staff cho admin.

### `backend/routes/statsRoutes.js`
- Route thống kê admin và dữ liệu dashboard.

### `backend/routes/streakRoutes.js`
- Route tính năng streak public.

### `backend/routes/syncRoutes.js`
- Route đồng bộ ranking và deep clean dữ liệu.

### `backend/routes/teacherRoutes.js`
- Route public/admin cho giáo viên.

### `backend/routes/timetableRoutes.js`
- Route quản lý thời khóa biểu.

## Thư mục `services`

### `backend/services/backup.service.js`
- Dịch vụ backup MongoDB.
- Bao gồm:
  - chạy `mongodump`,
  - tạo file ZIP,
  - mã hóa file trước khi upload,
  - upload Google Drive,
  - retry file `.uploading` dở dang khi khởi động lại.

### `backend/services/deepCleanService.js`
- Dịch vụ dọn sâu dữ liệu phục vụ `sync/deep-clean`.

### `backend/services/drive.service.js`
- Lớp làm việc với Google Drive.
- Bao gồm upload, download, dọn backup cũ, lấy danh sách backup.

### `backend/services/restore.service.js`
- Dịch vụ restore dữ liệu.
- Bao gồm:
  - giải mã file `.enc`,
  - safety backup trước restore,
  - chống zip slip,
  - restore thử vào DB tạm,
  - restore thật bằng `mongorestore --drop`,
  - xóa toàn bộ Redis cache sau restore.

## Thư mục `utils`

### `backend/utils/catchAsync.js`
- Wrapper bắt lỗi async cho controller route.

### `backend/utils/cloudinary.js`
- Tiện ích upload/xóa ảnh trên Cloudinary.

### `backend/utils/emailService.js`
- Gửi email xác nhận đăng ký, email admin notification, email reset mật khẩu.

### `backend/utils/encryptionUtils.js`
- Mã hóa/giải mã file bằng `AES-256-GCM`.
- Dùng cho backup trước khi đẩy lên Drive.

### `backend/utils/logAdminAction.js`
- Ghi log thao tác admin vào `AuditLog`.

### `backend/utils/logger.js`
- Ghi log nghiệp vụ chung.

### `backend/utils/normalizePhone.js`
- Chuẩn hóa số điện thoại trước khi xử lý/lưu dữ liệu.

### `backend/utils/sanitize.js`
- Làm sạch chuỗi và object đệ quy.
- Loại HTML tag, chặn key nguy hiểm như `__proto__`, chuẩn hóa Unicode, giới hạn độ dài.

### `backend/utils/scheduledTasks.js`
- Đăng ký/cấu hình các tác vụ nền cần khởi chạy cùng ứng dụng.

### `backend/utils/systemLogger.js`
- Logger hệ thống cho lỗi nghiêm trọng, rate limit, CSRF, startup/shutdown.

### `backend/utils/test-encryption.js`
- File test/thử nghiệm cho luồng mã hóa backup.

## Thư mục `validators`

### `backend/validators/registrationValidator.js`
- Validator bổ sung cho đăng ký nếu cần dùng ở những route chuyên biệt.

### `backend/validators/streakValidator.js`
- Rule validate cho `start`, `checkin`, `revive` của streak.

## Thư mục `scripts`

### `backend/scripts/backup.js`
- Script chạy backup thủ công từ môi trường dòng lệnh.

### `backend/scripts/cleanRestoreTmp.js`
- Script dọn file/thư mục tạm sinh ra trong quá trình restore.

## Các file gốc ở `backend/`

### `backend/.dockerignore`
- Khai báo file/thư mục bỏ qua khi build Docker image.

### `backend/.env`
- Biến môi trường nội bộ cho local/deploy hiện tại.

### `backend/.env.example`
- Mẫu biến môi trường tham chiếu.

### `backend/.env.production`
- Mẫu/cấu hình môi trường production.

### `backend/Dockerfile`
- Cấu hình build container backend.

### `backend/googleSheets.js`
- Tiện ích ghi dữ liệu đăng ký sang Google Sheets.

### `backend/migrate-childAge.js`
- Script migrate dữ liệu `childAge`.

### `backend/nodemon.json`
- Cấu hình chạy dev với `nodemon`.

### `backend/package-lock.json`
- Khóa phiên bản dependency backend.

### `backend/package.json`
- Khai báo package, script và dependency backend.

### `backend/readme1.txt`
- Tài liệu ghi chú cũ của backend.

### `backend/server.js`
- File khởi động chính của backend.
- Chức năng chính:
  - nạp env,
  - validate biến môi trường bắt buộc,
  - cấu hình cookie parser, CORS, Helmet, CSRF, body parser,
  - gắn sanitize toàn cục,
  - mount toàn bộ route,
  - định nghĩa endpoint `/api/submit` và `/api/health`,
  - kết nối MongoDB/Redis,
  - khởi động cron job,
  - cấu hình graceful shutdown.

## Luồng chính backend

### Luồng public
- Website gọi các API public như:
  - `/api/courses`,
  - `/api/teachers`,
  - `/api/feedback`,
  - `/api/announcements`,
  - `/api/registrations`,
  - `/api/streak`,
  - `/api/rankings/top`,
  - `/api/timetable`,
  - `/api/submit`,
  - `/api/health`.

### Luồng admin/staff
- Frontend đăng nhập qua `/api/auth/login`.
- Access token gửi trong header `Authorization`.
- Refresh token lưu bằng cookie `httpOnly`.
- Route protected đi qua `auth` rồi mới đến `authorizeRoles` hoặc `isAdmin`.

### Luồng backup/restore
- Admin kết nối Google.
- Backup dùng `backup.service.js` để dump DB, zip, mã hóa, upload Drive.
- Restore dùng `restore.service.js` để giải mã, kiểm tra file, restore thử, restore thật và xóa cache Redis.

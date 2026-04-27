# Mô tả chức năng project Lucy's Class

## Mục đích của project

Đây là hệ thống quản lý cho trung tâm tiếng Anh `Lucy's Class`, gồm:

- Website public để giới thiệu trung tâm, khóa học, giáo viên, hoạt động và nhận đăng ký.
- Khu admin để quản lý dữ liệu, nội dung, tài khoản và thống kê.
- Khu teacher để giáo viên xem thông tin lớp mình phụ trách.
- Khu marketing để nhân sự marketing theo dõi dashboard và gửi thông báo chờ duyệt.
- Hệ thống chấm công staff, backup/restore dữ liệu, và một số tính năng public như `streak` hoặc `ranking`.

## Người dùng trong hệ thống

- `Khách vãng lai`: vào trang chủ, xem nội dung, gửi form đăng ký, xem thông báo.
- `Admin`: quản lý gần như toàn bộ hệ thống.
- `Teacher`: xem dashboard riêng, xem học sinh thuộc lớp mình, chấm công.
- `Marketing`: xem dashboard riêng, gửi thông báo để admin duyệt, chấm công.

## Frontend đang có những phần gì

### `frontend/src/main.jsx`

- Điểm khởi động của frontend.
- Gắn `BrowserRouter`, `AuthProvider`, `RecaptchaProvider`.
- Gọi `keepAliveBackend()` để đánh thức backend khi cần.

### `frontend/src/App.jsx`

- File chia toàn bộ route của ứng dụng.
- Tách rõ 5 khu:
  - `public`
  - `admin`
  - `teacher`
  - `marketing`
  - `attendance` dùng chung cho staff

## Các màn hình chính ở frontend

### Public

- `HomePage.jsx`: trang landing page chính của trung tâm.
- `AdminLogin.jsx`: màn hình đăng nhập cho tài khoản nội bộ.
- `ForgotPassword.jsx`: nhập email/tài khoản để xin reset mật khẩu.
- `ResetPassword.jsx`: đặt lại mật khẩu bằng token.
- `NotFound.jsx`: trang 404.

### Admin

- `Dashboard.jsx`: màn hình tổng quan, thường là nơi xem số liệu nhanh và tác vụ hệ thống.
- `RegistrationManagement.jsx`: quản lý danh sách đăng ký học từ website.
- `CourseManagement.jsx`: quản lý khóa học/lớp học.
- `TeacherManagement.jsx`: quản lý thông tin giáo viên.
- `FeedbackManagement.jsx`: quản lý phản hồi/testimonial từ người dùng.
- `Statistics.jsx`: xem thống kê chi tiết.
- `StudentManagement.jsx`: quản lý dữ liệu học viên sau khi đã vào hệ thống.
- `CourseStudentList.jsx`: xem danh sách học viên của một khóa/lớp cụ thể.
- `AnnouncementManagement.jsx`: duyệt và quản lý thông báo/bài đăng.
- `TimetableEditor.jsx`: chỉnh sửa thời khóa biểu.
- `AccountManagement.jsx`: quản lý tài khoản staff.
- `AdminHistory.jsx`: xem lịch sử thao tác admin.
- `Admin/AttendanceManagement.jsx`: quản lý chấm công staff toàn hệ thống.

### Teacher

- `Teacher/TeacherDashboard.jsx`: dashboard riêng cho giáo viên.
- `CourseStudentList.jsx`: giáo viên xem danh sách học sinh của lớp mình.

### Marketing

- `Marketing/MarketingDashboard.jsx`: dashboard riêng cho marketing.
- `Marketing/MktAnnouncementPage.jsx`: tạo/gửi thông báo để admin review.

### Attendance dùng chung cho staff

- `Attendance/StaffAttendance.jsx`: check-in, check-out và xem lịch sử chấm công cá nhân.

## Các component chính ở frontend

### Nhóm hiển thị trang chủ

- `HeroSection.jsx`: phần mở đầu nổi bật của trang chủ.
- `WhyChooseUs.jsx`: lý do chọn trung tâm.
- `CoursesSection.jsx`: giới thiệu khóa học.
- `LearningJourney.jsx`: mô tả hành trình học.
- `ActivitiesSection.jsx`: hoạt động của trung tâm.
- `TeachersSection.jsx`: giới thiệu giáo viên.
- `TestimonialsSection.jsx`: phản hồi từ phụ huynh/học viên.
- `AnnouncementSection.jsx`: hiển thị thông báo ngoài public.
- `RegistrationForm.jsx`: form đăng ký học.

### Nhóm popup/modal

- `ActivityPopup.jsx`: popup chi tiết hoạt động.
- `CourseDetailModal.jsx`: popup chi tiết khóa học.
- `AnnouncementModal.jsx`: popup thông báo.
- `AnnouncementListModal.jsx`: danh sách nhiều thông báo.
- `AnnouncementReviewModal.jsx`: review thông báo ở khu nội bộ.
- `CreatorPopup.jsx`: popup giới thiệu người tạo hoặc credit.
- `MilestonePopup.jsx`: popup mốc thành tích/sự kiện.
- `common/ConfirmModal.jsx`: modal xác nhận dùng chung.

### Nhóm hệ thống

- `ProtectedRoute.jsx`: chặn route nếu chưa đăng nhập hoặc sai role.
- `NotificationBell.jsx`: chuông thông báo.
- `RecaptchaBox.jsx`: ô xác thực reCAPTCHA ở form cần bảo vệ.
- `RecaptchaProvider.jsx`: provider bọc reCAPTCHA cho app.
- `AttendanceExportPanel.jsx`: export dữ liệu attendance.
- `PrimaryButton.jsx`: nút dùng chung.

### Nhóm timetable

- `Timetable/WeekSelector.jsx`: chọn tuần.
- `Timetable/RowManager.jsx`: quản lý dòng của thời khóa biểu.
- `Timetable/CellPopover.jsx`: sửa dữ liệu từng ô.

### Nhóm hiệu ứng/trải nghiệm

- `FlameButton.jsx`: nút nổi bật để mở tính năng hoặc điểm nhấn UI.
- `Fireworks.jsx`: hiệu ứng pháo hoa.
- `HeartRain.jsx`: hiệu ứng mưa tim.
- `ScrollHintButton.jsx`: hỗ trợ cuộn/xem tiếp nội dung.

## Các phần hạ tầng frontend

### `contexts`

- `AuthContext.jsx`: giữ trạng thái đăng nhập, role hiện tại, kiểm tra session, logout và refresh token.

### `layouts`

- `AdminLayout.jsx`: khung dùng cho khu admin.
- `StaffLayout.jsx`: khung dùng cho teacher, marketing và attendance.
- `Navbar.jsx`: thanh điều hướng public.
- `Footer.jsx`: chân trang public.

### `services`

- `api.js`: Axios client dùng chung, tự gắn token và xử lý refresh token.
- `announcementService.js`: gọi API thông báo.
- `attendanceService.js`: gọi API chấm công.
- `timetableService.js`: gọi API thời khóa biểu.
- `streakService.js`: gọi API streak/ranking kiểu public.

### `utils`

- `keepAlive.js`: ping backend để tránh ngủ.
- `deviceId.js`: tạo mã định danh thiết bị cho các tính năng như streak.
- `getImageUrl.js`: chuẩn hóa URL ảnh.
- `dateUtils.js`: format ngày giờ.
- `draggableStreak.js`: xử lý kéo/thả hoặc tương tác UI streak.
- `modalScrollLock.js`: khóa scroll khi mở modal.
- `popupActivityData.js`: dữ liệu cấu hình cho popup hoạt động.
- `toastUtils.jsx`: helper hiển thị toast.

### `hooks`

- `useLockBodyScroll.js`: khóa body scroll.
- `useNotifications.js`: quản lý state thông báo.

### `i18n`

- `vi.json`, `en.json`, `zh.json`: dữ liệu đa ngôn ngữ.
- `i18n.js` và `i18n/index.js`: khởi tạo dịch thuật cho app.

## Backend đang làm những gì

### `backend/server.js`

- Là entry point của backend.
- Khởi tạo `Express`.
- Nạp middleware bảo mật như:
  - `cookie-parser`
  - `cors`
  - `helmet`
  - CSRF custom
  - sanitize body
  - rate limit
- Kết nối MongoDB và Redis.
- Mount toàn bộ API route.
- Có endpoint public `POST /api/submit` để nhận form đăng ký.
- Có endpoint `GET /api/health` để kiểm tra tình trạng server.
- Bật cron job, retry upload backup đang dở, xử lý graceful shutdown.

## Các nhóm API chính ở backend

### `authRoutes.js` + `authController.js`

- Đăng nhập.
- Đăng xuất.
- Refresh token.
- Lấy user hiện tại.
- Quên mật khẩu và đặt lại mật khẩu.
- Kiểm tra xung đột session hoặc trạng thái đăng nhập.

### `courseRoutes.js` + `courseController.js`

- CRUD khóa học.
- Quản lý dữ liệu lớp/học sinh theo khóa.
- Hỗ trợ attendance liên quan tới khóa học.
- Hỗ trợ giáo viên xem lớp mình phụ trách.

### `teacherRoutes.js` + `teacherController.js`

- CRUD giáo viên.
- Quản lý avatar hoặc ảnh giáo viên.
- Cung cấp dữ liệu giáo viên cho website public.

### `registrationRoutes.js` + `registrationController.js`

- Quản lý danh sách đăng ký từ website.
- Cập nhật trạng thái chăm sóc/đã liên hệ.
- Chuyển dữ liệu đăng ký thành dữ liệu học viên khi cần.
- Export danh sách.

### `feedbackRoutes.js` + `feedbackController.js`

- Quản lý phản hồi/testimonial.
- Vừa có phần public để hiển thị, vừa có phần admin để CRUD.

### `announcementRoutes.js` + `announcementController.js`

- Quản lý thông báo.
- Marketing có thể gửi bài.
- Admin có thể duyệt, sửa, publish hoặc từ chối.
- Public có thể đọc thông báo đã được xuất bản.

### `timetableRoutes.js` + `timetableController.js`

- Lấy dữ liệu thời khóa biểu.
- Tạo/sửa/xóa hàng hoặc ô thời khóa biểu.
- Export thời khóa biểu.

### `statsRoutes.js` + `statsController.js`

- Trả dữ liệu tổng hợp cho dashboard.
- Trả số liệu thống kê chi tiết cho admin.

### `auditRoutes.js` + `auditController.js`

- Ghi và đọc lịch sử thao tác admin.
- Phục vụ màn hình `AdminHistory`.
- Có thể hỗ trợ export log.

### `staffRoutes.js` + `staffController.js`

- Tạo và quản lý tài khoản `teacher` hoặc `marketing`.
- Đổi trạng thái tài khoản, reset thông tin, phân role staff.

### `staffDashboardRoutes.js`

- API kiểu `/api/me`.
- Trả dữ liệu hồ sơ hoặc thông tin dashboard cho user nội bộ đã đăng nhập.

### `attendanceRoutes.js` + `attendanceController.js` + `staffAttendanceController.js`

- Check-in/check-out cho teacher và marketing.
- Xem lịch sử chấm công.
- Admin sửa dữ liệu attendance khi cần.
- Export attendance.

### `googleRoutes.js` + `google.controller.js`

- Xử lý kết nối Google.
- Hỗ trợ luồng backup/restore qua Google Drive.

### `restoreRoutes.js` + `restore.controller.js`

- Liệt kê backup.
- Theo dõi tiến độ restore.
- Thực hiện khôi phục dữ liệu.

### `syncRoutes.js` + `syncController.js`

- Đồng bộ hoặc dọn dữ liệu hệ thống.
- Thường là các tác vụ maintenance.

### `rankingRoutes.js` + `rankingController.js`

- API bảng xếp hạng public.
- Dùng cho các tính năng thi đua hoặc gamification.

### `streakRoutes.js` + `streakController.js`

- Check-in theo streak.
- Giữ chuỗi ngày hoạt động.
- Hỗ trợ revive hoặc leaderboard nếu có.

## Những thư mục backend còn lại dùng để làm gì

### `models`

- Chứa schema MongoDB/Mongoose.
- Mỗi file là một loại dữ liệu như:
  - `Admin`
  - `StaffAccount`
  - `Teacher`
  - `Course`
  - `Registration`
  - `Attendance`
  - `StaffAttendance`
  - `Feedback`
  - `Announcement`
  - `AuditLog`
  - `Ranking`
  - `Streak`
  - `GoogleToken`

### `middlewares`

- `auth.js`: xác thực JWT.
- `authorizeRoles.js`: kiểm tra role.
- `isAdmin.js`: chặn nếu không phải admin.
- `securityMiddleware.js`: CSRF và bảo vệ request nhạy cảm.
- `rateLimiter.js`: chống spam theo API.
- `phoneLimiter.js`: chống spam theo số điện thoại.
- `checkBlockedIP.js`: chặn IP bị đánh dấu xấu.
- `upload.js`: kiểm tra file upload.
- `cacheMiddleware.js`: cache response bằng Redis.
- `errorHandler.js`: chuẩn hóa lỗi trả về.
- `userIdentifier.js`: nhận diện user/IP phục vụ log và limiter.
- `validate.js`, `validateRegistration.js`, `adminValidator.js`: validate dữ liệu đầu vào.

### `config`

- `db.js`: kết nối MongoDB.
- `redis.js`: kết nối Redis.
- `google.js`: cấu hình tích hợp Google.
- `cron.js`: cron job chạy định kỳ.

### `services`

- `backup.service.js`: tạo backup, nén, mã hóa, upload.
- `drive.service.js`: thao tác với Google Drive.
- `restore.service.js`: giải mã và khôi phục backup.
- `deepCleanService.js`: dọn dữ liệu sâu theo lịch.

### `utils`

- `cloudinary.js`: upload/xóa ảnh Cloudinary.
- `emailService.js`: gửi email.
- `encryptionUtils.js`: mã hóa/giải mã file backup.
- `logAdminAction.js`: ghi log hành động admin.
- `logger.js`, `systemLogger.js`: logging hệ thống.
- `normalizePhone.js`: chuẩn hóa số điện thoại.
- `sanitize.js`: làm sạch dữ liệu.
- `scheduledTasks.js`: các tác vụ chạy nền.
- `catchAsync.js`: wrapper cho async controller.

### `validators`

- `registrationValidator.js`: validate dữ liệu đăng ký.
- `streakValidator.js`: validate dữ liệu streak.

### `scripts`

- `backup.js`: script hỗ trợ backup thủ công hoặc tác vụ nền.
- `cleanRestoreTmp.js`: dọn file tạm sau restore.

## Luồng hoạt động dễ hiểu nhất của project

### Luồng 1: khách đăng ký học

- Khách vào `HomePage`.
- Điền `RegistrationForm`.
- Frontend gửi request lên `POST /api/submit`.
- Backend kiểm tra `reCAPTCHA`, validate dữ liệu, lưu MongoDB.
- Sau đó backend đồng bộ dữ liệu sang Google Sheets ở chế độ nền.

### Luồng 2: admin xử lý dữ liệu

- Admin đăng nhập.
- Vào dashboard hoặc các trang quản lý như đăng ký, khóa học, giáo viên, học viên.
- Mọi thao tác CRUD đi qua backend và có thể được ghi log vào audit history.

### Luồng 3: marketing gửi thông báo

- Marketing đăng nhập vào khu riêng.
- Tạo nội dung thông báo.
- Thông báo được gửi sang backend ở trạng thái chờ duyệt.
- Admin vào `AnnouncementManagement` để review trước khi public.

### Luồng 4: teacher theo dõi lớp

- Teacher đăng nhập.
- Xem dashboard.
- Mở danh sách học sinh theo lớp mình phụ trách.
- Có thể dùng khu attendance để chấm công bản thân.

### Luồng 5: backup và restore

- Admin kết nối Google/Drive nếu cần.
- Hệ thống tạo backup định kỳ hoặc thủ công.
- Backup được mã hóa trước khi lưu.
- Khi cần, admin có thể restore từ file backup đã lưu.

## Nên đọc file nào trước nếu muốn hiểu project nhanh

- `backend/server.js`: hiểu backend đang mở route nào và có middleware gì.
- `frontend/src/App.jsx`: hiểu app có những màn hình nào.
- `docs/structure/be.md`: bản cấu trúc backend chi tiết hơn.
- `docs/structure/fe.md`: bản cấu trúc frontend chi tiết hơn.
- File tài liệu này: bản tóm tắt dễ đọc để nắm chức năng trước.

## Ghi chú

- Tài liệu này được viết dựa trên code hiện có trong project và các file cấu trúc sẵn có trong `docs/structure/`.
- Khi làm tài liệu này, chỉ dùng `backend/.env.example` để hiểu tên biến môi trường mẫu, không đọc `backend/.env` hay `backend/.env.production`.

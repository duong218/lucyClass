# Cấu trúc Frontend

## Phạm vi
- Tài liệu này mô tả frontend trong thư mục `frontend/`.
- Chỉ phản ánh cấu trúc source và trạng thái tích hợp hiện tại.
- Bỏ qua `node_modules/`, thư mục build `dist/`.
- **BẢO MẬT**: NGHIÊM CẤM đọc/tham chiếu các file `.env`, `.env.*` thật để tránh lộ secret key.
- File môi trường duy nhất được phép tham chiếu ở đây là `frontend/.env.example`.

## Tổng quan
- Stack chính: `React 18`, `Vite`, `React Router`, `Tailwind CSS`, `Axios`, `react-toastify`, `framer-motion`, `Lenis`, `chart.js`, `ExcelJS`.
- Entry point: `frontend/src/main.jsx`.
- Frontend là một codebase dùng chung cho:
  - website public,
  - admin portal,
  - teacher portal,
  - marketing portal,
  - màn hình chấm công staff.

## Sơ đồ thư mục

```text
frontend/
|-- public/
|   |-- decorate/
|   |-- images/
|   |-- sounds/
|   |-- logo.svg
|   |-- robot.txt
|   `-- sitemap.xml
|-- src/
|   |-- assets/
|   |   |-- 404.png
|   |   |-- hero-bg.png
|   |   `-- why-us-main.png
|   |-- components/
|   |   |-- ChatBox/
|   |   |-- Timetable/
|   |   `-- common/
|   |-- config/
|   |-- contexts/
|   |-- hooks/
|   |-- i18n/
|   |-- layouts/
|   |-- pages/
|   |   |-- Admin/
|   |   |-- Attendance/
|   |   |-- Marketing/
|   |   |-- NotFound/
|   |   `-- Teacher/
|   |-- services/
|   |-- theme/
|   |-- utils/
|   |-- App.jsx
|   |-- i18n.js
|   |-- index.css
|   `-- main.jsx
|-- .env.example
|-- index.html
|-- package-lock.json
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
|-- vercel.json
`-- vite.config.js
```

## Entry flow

### `src/main.jsx`
- Mount ứng dụng React với:
  - `LenisProvider`,
  - `BrowserRouter`,
  - `AuthProvider`,
  - `RecaptchaProvider`.
- Gọi `keepAliveBackend()` ngay khi app khởi động để đánh thức backend nếu cần.
- Nạp `i18n.js`, `lenis/dist/lenis.css` và `index.css`.

### `src/App.jsx`
- Khai báo toàn bộ route đang chạy.
- Luôn render:
  - `FlameButton`,
  - `ToastContainer`.
- Tách route theo 4 khu vực:
  - public,
  - admin,
  - teacher,
  - marketing,
  - attendance staff dùng chung.

## Route map hiện tại

### Public
- `/`
- `/admin/login`
- `/forgot-password`
- `/reset-password/:token`

### Admin
- `/admin/dashboard`
- `/admin/registrations`
- `/admin/courses`
- `/admin/teachers`
- `/admin/feedback`
- `/admin/statistics`
- `/admin/students`
- `/admin/students/course/:courseId`
- `/admin/announcements`
- `/admin/timetable`
- `/admin/accounts`
- `/admin/history`
- `/admin/attendance`
- `/admin/salary-config`
- `/admin/salary-report`
- `/admin/chat-config`

### Teacher
- `/teacher/dashboard`
- `/teacher/students/course/:courseId`
- `/teacher/attendance` chuyển sang `/attendance`

### Marketing
- `/marketing/dashboard`
- `/marketing/announcements`
- `/marketing/attendance` chuyển sang `/attendance`

### Shared staff
- `/attendance`

### Fallback
- `*` -> `NotFound`

## Bảo vệ route và xác thực

### `src/components/ProtectedRoute.jsx`
- Chặn truy cập nếu chưa đăng nhập hoặc sai role.
- Dùng cho admin, teacher, marketing và attendance staff.

### `src/contexts/AuthContext.jsx`
- Quản lý trạng thái user đăng nhập toàn app.
- Luồng khởi tạo:
  - gọi `/auth/me`,
  - nếu cần thì refresh token qua `/auth/refresh-token`,
  - lưu cờ `hasSession` ở `localStorage`,
  - xử lý timeout khởi tạo.
- Có xử lý:
  - logout chủ động,
  - session conflict khi tài khoản bị đăng nhập ở thiết bị khác,
  - polling `/auth/check-session` mỗi 10 giây khi user đang online.
- Export helper `getDashboardPath(role)` để điều hướng theo role.

### `src/services/api.js`
- Axios client trung tâm của frontend.
- Đặc điểm chính:
  - `baseURL` là `${BASE_URL}/api`,
  - gửi cookie với `withCredentials`,
  - luôn gắn header `X-Requested-With`,
  - giữ `accessToken` trong memory,
  - request interceptor tự gắn `Authorization`,
  - response interceptor tự refresh token khi gặp `401`,
  - queue các request đang chờ refresh,
  - phát event `auth:logout` và `session:conflict`.

### `src/config/api.js`
- Tính `API_BASE_URL` từ `VITE_API_URL`.
- Nếu đang trỏ `localhost:5000` hoặc `127.0.0.1:5000` thì dùng same-origin để đi qua Vite proxy.

## Layouts `src/layouts/`
- `AdminLayout.jsx`: layout shell cho admin area, sidebar menu và vùng render route con.
- `StaffLayout.jsx`: layout dùng chung cho teacher, marketing và attendance staff.
- `Navbar.jsx`: thanh điều hướng website public.
- `Footer.jsx`: footer website public.

### Ghi chú mới ở `AdminLayout.jsx`
- Sidebar đã có menu `/admin/chat-config`.
- `src/App.jsx` hiện cũng đã khai báo route này và render `Admin/ChatConfigPage.jsx`.

## Pages `src/pages/`

### Public
- `HomePage.jsx`: trang chủ public, ghép toàn bộ section landing page.
- `AdminLogin.jsx`: login dùng chung cho `admin`, `teacher`, `marketing`.
- `ForgotPassword.jsx`, `ResetPassword.jsx`: luồng quên mật khẩu.
- `NotFound/NotFound.jsx`, `NotFound/GameLogic.js`, `NotFound.css`: trang 404 và logic mini-game.

### Admin
- `Dashboard.jsx`: dashboard tổng quan, backup/restore, thống kê nhanh.
- `RegistrationManagement.jsx`: quản lý đăng ký học.
- `CourseManagement.jsx`: CRUD khóa học.
- `TeacherManagement.jsx`: CRUD giáo viên và avatar.
- `FeedbackManagement.jsx`: quản lý phản hồi public.
- `Statistics.jsx`: thống kê chi tiết.
- `StudentManagement.jsx`: quản lý học viên/dữ liệu học.
- `CourseStudentList.jsx`: danh sách học sinh theo khóa, dùng chung cho admin và teacher, có export Excel và cập nhật ghi chú.
- `AnnouncementManagement.jsx`: quản lý và duyệt thông báo.
- `TimetableEditor.jsx`: chỉnh sửa thời khóa biểu.
- `AccountManagement.jsx`: quản lý tài khoản staff.
- `AdminHistory.jsx`: lịch sử thao tác admin.
- `Admin/AttendanceManagement.jsx`: quản lý chấm công staff.
- `Admin/SalaryConfig.jsx`: cấu hình hệ thống lương.
- `Admin/SalaryReport.jsx`: tính toán và xuất báo cáo lương.
- `Admin/ChatConfigPage.jsx`: UI admin để chỉnh cấu hình chatbox Lucy, gọi `GET/PUT /chat-config`, có preview trực tiếp và chức năng reset về default.

### Teacher
- `Teacher/TeacherDashboard.jsx`: dashboard giáo viên.

### Marketing
- `Marketing/MarketingDashboard.jsx`: dashboard marketing.
- `Marketing/MktAnnouncementPage.jsx`: gửi thông báo chờ admin duyệt.

### Shared staff
- `Attendance/StaffAttendance.jsx`: check-in/check-out và xem lịch sử chấm công cá nhân.

## Components `src/components/`

### Public landing page
- `HeroSection.jsx`
- `WhyChooseUs.jsx`
- `CoursesSection.jsx`
- `LearningJourney.jsx`
- `ActivitiesSection.jsx`
- `TeachersSection.jsx`
- `TestimonialsSection.jsx`
- `AnnouncementSection.jsx`
- `RegistrationForm.jsx`

### Modal và popup
- `ActivityPopup.jsx`
- `CourseDetailModal.jsx`
- `AnnouncementModal.jsx`
- `AnnouncementListModal.jsx`
- `AnnouncementReviewModal.jsx`
- `CreatorPopup.jsx`
- `MilestonePopup.jsx`
- `common/ConfirmModal.jsx`

### Thành phần hệ thống
- `FlameButton.jsx`: nút truy cập nhanh cho streak/trải nghiệm nổi bật.
- `LenisProvider.jsx`: bọc toàn app để bật smooth scroll và đồng bộ với `modalScrollLock`.
- `NotificationBell.jsx`: chuông thông báo cho khu vực nội bộ.
- `RecaptchaBox.jsx`, `RecaptchaProvider.jsx`: reCAPTCHA cho form public và login.
- `AttendanceExportPanel.jsx`: panel export attendance.
- `ScrollHintButton.jsx`: hỗ trợ điều hướng/scroll.
- `common/PrimaryButton.jsx`: nút dùng chung.

### Timetable
- `Timetable/WeekSelector.jsx`
- `Timetable/RowManager.jsx`
- `Timetable/CellPopover.jsx`

### Hiệu ứng và tương tác
- `Fireworks.jsx`
- `HeartRain.jsx`

### Cụm ChatBox mới
- `ChatBox/ChatBox.jsx`: widget chat nổi, load config từ `/api/chat-config`, ưu tiên fallback nội bộ cho câu hỏi phổ biến và gọi AI qua `askAssistant`.
- `ChatBox/chatConfig.js`: default config fallback cho chatbox, export `DEFAULT_CENTER_INFO`, `DEFAULT_SYSTEM_PROMPT`, `DEFAULT_SUGGESTIONS`, `DEFAULT_CHAT_CONFIG`, `CHAT_CONFIG`.
- `ChatBox/ChatMessage.jsx`: bubble hiển thị từng tin nhắn.
- `ChatBox/TypingIndicator.jsx`: hiệu ứng đang gõ.

### Trạng thái tích hợp của ChatBox
- `HomePage.jsx` đã render `ChatBox` sau `Footer`, nên widget chat đã tham gia giao diện public.
- Chatbox ưu tiên lấy cấu hình từ backend qua `/api/chat-config`; nếu API lỗi hoặc chưa có dữ liệu thì fallback về `src/components/ChatBox/chatConfig.js`.
- `ChatConfigPage.jsx` còn giữ state `centerInfo` để hỗ trợ biên tập nội dung prompt, nhưng backend hiện lưu chính các nhóm `systemPrompt`, `suggestions` và `chatConfig`.

## Services `src/services/`
- `announcementService.js`: API cho thông báo public, thông báo nội bộ, submission marketing và review admin.
- `attendanceService.js`: API cho attendance staff và admin attendance.
- `timetableService.js`: API cho thời khóa biểu.
- `streakService.js`: API cho streak public, dùng `fetch` riêng và gửi kèm `deviceId`.
- `salaryService.js`: API cho quản lý lương.
- `api.js`: Axios client dùng chung toàn app.

### File mới
- `chatAssistantService.js`: wrapper gọi backend proxy `/api/chat-config/ask` qua `fetch`; frontend không còn gọi AI provider trực tiếp.

## Hooks và utilities

### `src/hooks/`
- `useLockBodyScroll.js`: khóa cuộn body khi mở modal.
- `useNotifications.js`: quản lý state/thao tác thông báo nội bộ.

### `src/utils/`
- `keepAlive.js`: đánh thức backend.
- `deviceId.js`: sinh và lưu định danh thiết bị cho streak.
- `getImageUrl.js`: chuẩn hóa URL ảnh.
- `dateUtils.js`: format ngày giờ và thời gian tương đối.
- `draggableStreak.js`: logic tương tác cho UI streak.
- `exportStudentExcel.js`: helper xuất Excel danh sách học sinh.
- `exportTimetableExcel.js`: helper xuất Excel thời khóa biểu.
- `modalScrollLock.js`: hỗ trợ khóa scroll nền.
- `popupActivityData.js`: dữ liệu cấu hình cho popup hoạt động.
- `toastUtils.jsx`: helper toast dùng chung.

## i18n và style

### `src/i18n/`
- `vi.json`, `en.json`, `zh.json`: resource đa ngôn ngữ.
- `src/i18n/index.js`: export resource và cấu hình nội bộ.
- `src/i18n.js`: khởi tạo i18n cho toàn app.

### `src/theme/`
- `lucyBrand.js`: token màu sắc và style cốt lõi theo nhận diện Lucy.

### `tailwind.config.js`
- Mở rộng palette màu, `fontFamily`, `boxShadow`, `borderRadius`, `keyframes`, `animation`.

### `index.css`
- Tailwind base và style global của ứng dụng.

## Asset và public file
- `public/` chứa logo, ảnh nền, audio, icon trang trí, Lottie asset, `sitemap.xml`, `robot.txt`.
- `src/assets/` chứa ảnh import trực tiếp vào React như `404`, `hero`, `announcement`, `why-us`.
- `dist/` hiện tồn tại trong repo nhưng là build artifact, không nên xem như source frontend.

## Cấu hình chạy và deploy

### `vite.config.js`
- Dev server chạy cổng `5173`.
- Proxy `/api` về `http://localhost:5000`.
- Có thêm proxy `/uploads`, dù backend hiện chủ yếu dùng ảnh qua Cloudinary.

### `vercel.json`
- Cấu hình deploy frontend lên Vercel.

### `.env.example`
- Chứa các biến mẫu cho frontend:
  - `CLIENT_URL`
  - `VITE_RECAPTCHA_SITE_KEY`

## Luồng chính trên frontend

### Website public
- `HomePage.jsx` ghép các section landing page.
- Form đăng ký gọi backend qua `RegistrationForm.jsx`.
- Có tích hợp reCAPTCHA trước khi submit.
- `ChatBox` được mount trực tiếp trên trang chủ dưới dạng widget nổi.

### Khu vực admin
- Sau login, admin vào `AdminLayout`.
- Các page quản lý gọi API qua `services/api.js`.
- Dashboard là điểm tập trung cho thống kê, backup/restore và dữ liệu tổng quan.

### Khu vực teacher/marketing
- Dùng chung `StaffLayout`.
- Teacher có dashboard và truy cập danh sách học sinh theo lớp bằng `CourseStudentList`.
- Marketing có dashboard và trang tạo thông báo chờ duyệt.

### Attendance staff
- Teacher và marketing đi qua route `/attendance`.
- Admin có màn riêng để xem/sửa/export attendance toàn hệ thống.

### Ghi chú về cụm chat
- Frontend đã có UI chatbox, trang cấu hình admin và service gọi backend proxy AI.
- Cụm này hiện đã nối được luồng chính:
  - admin chỉnh cấu hình ở `/admin/chat-config`,
  - website public mount `ChatBox`,
  - backend cung cấp `/api/chat-config`,
  - frontend có default fallback trong `src/components/ChatBox/chatConfig.js`.
- Việc trả lời AI hiện đi qua backend `POST /api/chat-config/ask`; key AI không còn nằm ở frontend.

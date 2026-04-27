# Cấu trúc Frontend

## Phạm vi
- Tài liệu này mô tả frontend đang dùng trong thư mục `frontend/`.
- Nội dung tập trung vào cấu trúc mã nguồn, route, layout, service và các khối UI chính.
- Không liệt kê chi tiết toàn bộ asset tĩnh nhỏ lẻ hoặc `node_modules`.

## Tổng quan
- Stack chính: `React 18`, `Vite`, `React Router`, `Tailwind CSS`, `Axios`, `react-toastify`, `framer-motion`, `chart.js`.
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
|-- src/
|   |-- assets/
|   |-- components/
|   |-- config/
|   |-- contexts/
|   |-- hooks/
|   |-- i18n/
|   |-- layouts/
|   |-- pages/
|   |-- services/
|   |-- utils/
|   |-- App.jsx
|   |-- i18n.js
|   |-- index.css
|   `-- main.jsx
|-- .env
|-- .env.example
|-- .env.production
|-- index.html
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
|-- vercel.json
`-- vite.config.js
```

## Entry flow

### `src/main.jsx`
- Mount ứng dụng React với:
  - `BrowserRouter`,
  - `AuthProvider`,
  - `RecaptchaProvider`.
- Gọi `keepAliveBackend()` ngay khi app khởi động để đánh thức backend nếu cần.
- Nạp `i18n.js` và `index.css`.

### `src/App.jsx`
- Khai báo toàn bộ route của ứng dụng.
- Luôn render:
  - `FlameButton`,
  - `ToastContainer`.
- Phân tách route theo 4 khu vực:
  - public,
  - admin,
  - teacher,
  - marketing,
  - shared attendance route.

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

### Teacher
- `/teacher/dashboard`
- `/teacher/students/course/:courseId`
- `/teacher/attendance` sẽ chuyển sang `/attendance`

### Marketing
- `/marketing/dashboard`
- `/marketing/announcements`
- `/marketing/attendance` sẽ chuyển sang `/attendance`

### Shared staff
- `/attendance`

### Fallback
- `*` -> trang `NotFound`

## Bảo vệ route và xác thực

### `src/components/ProtectedRoute.jsx`
- Chặn truy cập nếu chưa đăng nhập hoặc sai role.
- Dùng cho toàn bộ route admin, teacher, marketing và attendance staff.

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

### `AdminLayout.jsx`
- Layout shell cho toàn bộ admin area.
- Chứa phần điều hướng và vùng render nội dung con.

### `StaffLayout.jsx`
- Layout dùng chung cho teacher, marketing và route attendance staff.

### `Navbar.jsx`
- Thanh điều hướng website public.

### `Footer.jsx`
- Footer website public.

## Pages `src/pages/`

### Public
- `HomePage.jsx`: trang chủ public, ghép toàn bộ section landing page.
- `AdminLogin.jsx`: login dùng chung cho `admin`, `teacher`, `marketing`.
- `ForgotPassword.jsx`, `ResetPassword.jsx`: luồng quên mật khẩu.
- `NotFound/NotFound.jsx`: trang 404.
- `NotFound/GameLogic.js`, `NotFound.css`: logic và style riêng cho 404.

### Admin
- `Dashboard.jsx`: dashboard tổng quan, backup/restore, thống kê nhanh.
- `RegistrationManagement.jsx`: quản lý đăng ký học.
- `CourseManagement.jsx`: CRUD khóa học.
- `TeacherManagement.jsx`: CRUD giáo viên và avatar.
- `FeedbackManagement.jsx`: quản lý phản hồi public.
- `Statistics.jsx`: thống kê chi tiết.
- `StudentManagement.jsx`: quản lý học viên/dữ liệu học.
- `CourseStudentList.jsx`: danh sách học sinh theo khóa.
- `AnnouncementManagement.jsx`: quản lý và duyệt thông báo.
- `TimetableEditor.jsx`: chỉnh sửa thời khóa biểu.
- `AccountManagement.jsx`: quản lý tài khoản staff.
- `AdminHistory.jsx`: lịch sử thao tác admin.
- `Admin/AttendanceManagement.jsx`: quản lý chấm công staff.

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
- `components/common/ConfirmModal.jsx`

### Thành phần hệ thống
- `FlameButton.jsx`: nút truy cập nhanh cho streak/trải nghiệm nổi bật.
- `NotificationBell.jsx`: chuông thông báo cho khu vực nội bộ.
- `RecaptchaBox.jsx`, `RecaptchaProvider.jsx`: reCAPTCHA cho form public và login.
- `AttendanceExportPanel.jsx`: panel export attendance.
- `ScrollHintButton.jsx`: điều hướng/scroll hỗ trợ.
- `components/common/PrimaryButton.jsx`: nút dùng chung.

### Timetable
- `Timetable/WeekSelector.jsx`
- `Timetable/RowManager.jsx`
- `Timetable/CellPopover.jsx`

### Hiệu ứng và tương tác
- `Fireworks.jsx`
- `HeartRain.jsx`

## Services `src/services/`

### `announcementService.js`
- API cho thông báo public, thông báo nội bộ, submission marketing và review admin.

### `attendanceService.js`
- API cho attendance staff và admin attendance.

### `timetableService.js`
- API cho thời khóa biểu: đọc lưới, CRUD row/cell, export.

### `streakService.js`
- API cho tính năng streak public.
- Dùng `fetch` riêng và gửi kèm `deviceId`.

### `api.js`
- Client Axios dùng chung toàn app.

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
- `modalScrollLock.js`: hỗ trợ khóa scroll nền.
- `popupActivityData.js`: dữ liệu cấu hình cho popup hoạt động.
- `toastUtils.jsx`: helper toast dùng chung.

## i18n và style

### `src/i18n/`
- `vi.json`, `en.json`, `zh.json`: resource đa ngôn ngữ.
- `src/i18n/index.js`: export resource và cấu hình nội bộ.
- `src/i18n.js`: khởi tạo i18n cho toàn app.

### `tailwind.config.js`
- Dùng palette màu riêng theo phong cách trung tâm thiếu nhi.
- Có mở rộng `fontFamily`, `boxShadow`, `borderRadius`, `keyframes`, `animation`.

### `index.css`
- Chứa Tailwind base và style global của ứng dụng.

## Public assets
- `public/` chứa logo, hình nền, audio, ảnh hoạt động, icon trang trí, Lottie asset và các file tĩnh như `sitemap.xml`.
- `src/assets/` chứa ảnh được import trực tiếp vào code React.

## Cấu hình chạy và deploy

### `vite.config.js`
- Dev server chạy cổng `5173`.
- Proxy `/api` về `http://localhost:5000`.
- Có thêm proxy `/uploads`, dù backend hiện tại chủ yếu dùng ảnh qua Cloudinary.

### `vercel.json`
- Cấu hình deploy frontend lên Vercel.

### `.env`, `.env.example`, `.env.production`
- Biến môi trường cho local, mẫu cấu hình và production.

## Luồng chính trên frontend

### Website public
- `HomePage.jsx` ghép các section landing page.
- Form đăng ký gọi backend qua `RegistrationForm.jsx`.
- Có tích hợp reCAPTCHA trước khi submit.

### Khu vực admin
- Sau login, admin vào `AdminLayout`.
- Các page quản lý gọi API qua `services/api.js`.
- Dashboard là điểm tập trung cho thống kê, backup/restore và dữ liệu tổng quan.

### Khu vực teacher/marketing
- Dùng chung `StaffLayout`.
- Teacher có dashboard và truy cập danh sách học sinh theo lớp phụ trách.
- Marketing có dashboard và trang tạo thông báo chờ duyệt.

### Attendance staff
- Teacher và marketing đi qua route `/attendance`.
- Admin có màn riêng để xem/sửa/export attendance toàn hệ thống.

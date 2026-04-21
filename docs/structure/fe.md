# Frontend Structure (lucyClass-main/frontend)

## 1. Tổng quan

- Framework: React 18 + Vite.
- Routing: `react-router-dom` (public + admin/staff nested route).
- HTTP client:
  - Axios instance trung tâm tại `src/services/api.js` (CSRF header, refresh token flow, auto retry khi 401).
  - Một số module dùng `fetch` trực tiếp (`streakService`, `keepAlive`).
- State management:
  - Chủ yếu bằng React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
  - Global auth state qua `AuthContext`.
  - Không dùng Redux/Zustand.
- i18n: `i18next` + `react-i18next`.
- UI: Tailwind CSS + Framer Motion + React Icons/Lucide + React Toastify + Chart.js.

## 2. Cấu trúc thư mục (tree)

```text
frontend/
├─ .env.example              # File cấu hình biến môi trường mẫu (API URL, reCAPTCHA key)
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ vercel.json
├─ public/                   # Tài nguyên tĩnh phục vụ trực tiếp qua URL
│  ├─ images/
│  ├─ ranking/
│  ├─ avatar-ranking/
│  ├─ decorate/
│  ├─ model-transform/
│  ├─ sounds/
│  ├─ bg-login.png, bg-announcement.png, kids.png, placeholder.jpg
│  ├─ logo.jpeg, logo.svg, robot.txt, sitemap.xml
├─ src/
│  ├─ main.jsx               # Điểm khởi tạo ứng dụng
│  ├─ App.jsx                # Cấu hình Routing và Layout chính
│  ├─ i18n.js                # Cấu hình đa ngôn ngữ i18next
│  ├─ index.css              # Style toàn cục (Tailwind imports)
│  ├─ assets/                # Hình ảnh và asset được import vào component
│  │  ├─ 404.png, flame.png, hero-bg.png, why-us-main.png...
│  ├─ config/
│  │  └─ api.js              # Cấu hình endpoint API (từ biến môi trường)
│  ├─ contexts/
│  │  └─ AuthContext.jsx     # Quản lý trạng thái đăng nhập, user profile
│  ├─ hooks/
│  │  └─ useLockBodyScroll.js
│  ├─ i18n/
│  │  ├─ index.js
│  │  ├─ vi.json, en.json    # File dịch nội dung tiếng Việt/Anh
│  ├─ layouts/
│  │  ├─ Navbar.jsx, Footer.jsx
│  │  ├─ AdminLayout.jsx     # Bố cục trang quản trị
│  │  └─ StaffLayout.jsx     # Bố cục trang nhân viên
│  ├─ pages/
│  │  ├─ HomePage.jsx        # Landing page chính
│  │  ├─ AdminLogin.jsx      # Trang đăng nhập hệ thống
│  │  ├─ Dashboard.jsx       # Tổng quan số liệu admin
│  │  ├─ RegistrationManagement.jsx
│  │  ├─ CourseManagement.jsx
│  │  ├─ TeacherManagement.jsx
│  │  ├─ FeedbackManagement.jsx
│  │  ├─ Statistics.jsx      # Thống kê chi tiết
│  │  ├─ AdminHistory.jsx    # Nhật ký hoạt động admin
│  │  ├─ AnnouncementManagement.jsx
│  │  ├─ TimetableEditor.jsx
│  │  ├─ StudentManagement.jsx
│  │  ├─ CourseStudentList.jsx
│  │  ├─ ForgotPassword.jsx, ResetPassword.jsx
│  │  ├─ Marketing/
│  │  │  └─ MarketingDashboard.jsx
│  │  ├─ Teacher/
│  │  │  └─ TeacherDashboard.jsx
│  │  └─ NotFound/           # Trang 404 tích hợp mini game
│  ├─ components/
│  │  ├─ Sections: HeroSection, CoursesSection, TeachersSection, ActivitiesSection...
│  │  ├─ Forms: RegistrationForm, AnnouncementModal...
│  │  ├─ Widgets: FlameButton (Streak), Fireworks, HeartRain, ScrollHintButton...
│  │  ├─ Auth: ProtectedRoute, RecaptchaProvider, RecaptchaBox...
│  │  ├─ Timetable: WeekSelector, RowManager, CellPopover...
│  │  └─ common: PrimaryButton, ConfirmModal...
│  ├─ services/
│  │  ├─ api.js              # Axios instance & interceptors
│  │  ├─ streakService.js
│  │  └─ timetableService.js
│  └─ utils/
│     ├─ dateUtils.js, deviceId.js, draggableStreak.js
│     ├─ getImageUrl.js, keepAlive.js, modalScrollLock.js
│     ├─ popupActivityData.js, toastUtils.jsx
```

## 3. Components

### Public/home components

- `HeroSection`: hero landing, responsive desktop/mobile background.
- `CoursesSection`: gọi `/courses`, hiển thị card khóa học, mở `CourseDetailModal`.
- `TeachersSection`: gọi `/teachers`, card + modal giáo viên, animation mạnh bằng Framer Motion.
- `ActivitiesSection`: lưới hoạt động + mở `ActivityPopup`.
- `ActivityPopup`: gallery ảnh/video (YouTube/TikTok/mp4), carousel/modal lock scroll.
- `TestimonialsSection`: gọi `/feedback`, hiển thị feedback, có modal mobile.
- `AnnouncementSection`: gọi `/announcements`, ticker/slider + mở `AnnouncementModal`.
- `RegistrationForm`: form đăng ký học viên, gọi `/registrations`, tích hợp reCAPTCHA.
- `WhyChooseUs`: section lợi ích + bảng ranking (gọi `/rankings/top`, `/streak/leaderboard`).
- `LearningJourney`: timeline hành trình học với motion.

### Utility/interactive components

- `FlameButton`: widget streak game nổi (draggable), gọi `streakService`, popup game/checkin/revive.
- `Fireworks`: hiệu ứng pháo hoa.
- `ScrollHintButton`: nút cuộn xuống/lên trên mobile.
- `CreatorPopup`, `HeartRain`: popup thông tin creator + hiệu ứng tim.
- `RecaptchaProvider` + `RecaptchaBox`: nạp script Google reCAPTCHA và render widget an toàn.
- `ProtectedRoute`: chặn route admin/staff khi chưa xác thực.
- `PrimaryButton`, `ConfirmModal`: UI component dùng lại trong admin/staff pages.

### Timetable components

- `Timetable/WeekSelector`: chọn tuần theo Monday-Sunday.
- `Timetable/RowManager`: CRUD row + reorder row bằng drag (`Reorder` của Framer Motion).
- `Timetable/CellPopover`: chỉnh nội dung cell, màu, lưu về backend.

## 4. Pages / Screens

### Router map (từ `App.jsx`)

- Public:
  - `/` -> `HomePage`
  - `/admin/login` -> `AdminLogin`
  - `/forgot-password` -> `ForgotPassword`
  - `/reset-password/:token` -> `ResetPassword`

- Admin protected (`ProtectedRoute` + `AdminLayout`):
  - `/admin/dashboard` -> `Dashboard`
  - `/admin/registrations` -> `RegistrationManagement`
  - `/admin/courses` -> `CourseManagement`
  - `/admin/teachers` -> `TeacherManagement`
  - `/admin/feedback` -> `FeedbackManagement`
  - `/admin/statistics` -> `Statistics`
  - `/admin/students` -> `StudentManagement`
  - `/admin/students/course/:courseId` -> `CourseStudentList`
  - `/admin/announcements` -> `AnnouncementManagement`
  - `/admin/timetable` -> `TimetableEditor`
  - `/admin/history` -> `AdminHistory`

- Staff protected (`ProtectedRoute` + `StaffLayout`):
  - `/staff/marketing` -> `MarketingDashboard`
  - `/staff/teacher` -> `TeacherDashboard`

- Catch-all:
  - `*` -> `NotFound` (game tìm Lucy).

## 5. Hooks & Utilities

- `hooks/useLockBodyScroll.js`: Khóa scroll khi mở modal.
- `pages/NotFound/GameLogic.js`: Logic game Lucy.
- `utils/draggableStreak.js`: Logic kéo thả widget streak, lưu vị trí qua `localStorage`.
- `utils/deviceId.js`: Định danh thiết bị người dùng.
- `utils/keepAlive.js`: Duy trì kết nối session.

## 6. API integration

- `services/api.js`: Axios instance tập trung, xử lý 401 (refresh token) và CSRF token.
- Mapping: Tương tác với các endpoint `/auth`, `/courses`, `/teachers`, `/registrations`, `/streak`, `/rankings`, `/timetable`.

## Ghi chú scan

- Đã quét và cập nhật đúng cấu trúc thư mục thực tế của frontend.
- **TUYỆT ĐỐI TUÂN THỦ QUY TẮC BẢO MẬT**: Không đọc và không trích dẫn nội dung file `.env` hay `.env.production`. Chỉ liệt kê `.env.example` như file mẫu.
- Thêm StaffLayout và các chức năng phân quyền nhân viên.

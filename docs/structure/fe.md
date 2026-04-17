# Frontend Structure (lucyClass-main/frontend)

## 1. Tổng quan

- Framework: React 18 + Vite.
- Routing: `react-router-dom` (public + admin nested route).
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
├─ .env.example
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ vercel.json
├─ public/
│  ├─ bg-login.png, bg-announcement.png, logo.jpeg, placeholder.jpg...
│  ├─ images/, ranking/, avatar-ranking/, decorate/, model-transform/, sounds/
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ i18n.js
│  ├─ index.css
│  ├─ assets/
│  ├─ config/
│  │  └─ api.js
│  ├─ contexts/
│  │  └─ AuthContext.jsx
│  ├─ hooks/
│  │  └─ useLockBodyScroll.js
│  ├─ i18n/
│  │  ├─ index.js
│  │  ├─ vi.json
│  │  └─ en.json
│  ├─ layouts/
│  │  ├─ Navbar.jsx
│  │  ├─ Footer.jsx
│  │  └─ AdminLayout.jsx
│  ├─ pages/
│  │  ├─ HomePage.jsx
│  │  ├─ AdminLogin.jsx
│  │  ├─ Dashboard.jsx
│  │  ├─ RegistrationManagement.jsx
│  │  ├─ CourseManagement.jsx
│  │  ├─ TeacherManagement.jsx
│  │  ├─ FeedbackManagement.jsx
│  │  ├─ Statistics.jsx
│  │  ├─ AdminHistory.jsx
│  │  ├─ AnnouncementManagement.jsx
│  │  ├─ TimetableEditor.jsx
│  │  ├─ StudentManagement.jsx
│  │  ├─ CourseStudentList.jsx
│  │  ├─ ForgotPassword.jsx
│  │  ├─ ResetPassword.jsx
│  │  └─ NotFound/
│  │     ├─ NotFound.jsx
│  │     ├─ NotFound.css
│  │     └─ GameLogic.js
│  ├─ components/
│  │  ├─ HeroSection.jsx, CoursesSection.jsx, TeachersSection.jsx, ActivitiesSection.jsx
│  │  ├─ WhyChooseUs.jsx, LearningJourney.jsx, TestimonialsSection.jsx
│  │  ├─ RegistrationForm.jsx, AnnouncementSection.jsx, AnnouncementModal.jsx
│  │  ├─ ActivityPopup.jsx, CreatorPopup.jsx, HeartRain.jsx
│  │  ├─ FlameButton.jsx, Fireworks.jsx, ScrollHintButton.jsx
│  │  ├─ ProtectedRoute.jsx, RecaptchaProvider.jsx, RecaptchaBox.jsx
│  │  ├─ CourseDetailModal.jsx
│  │  ├─ Timetable/
│  │  │  ├─ WeekSelector.jsx
│  │  │  ├─ RowManager.jsx
│  │  │  └─ CellPopover.jsx
│  │  └─ common/
│  │     ├─ PrimaryButton.jsx
│  │     └─ ConfirmModal.jsx
│  ├─ services/
│  │  ├─ api.js
│  │  ├─ streakService.js
│  │  └─ timetableService.js
│  └─ utils/
│     ├─ dateUtils.js
│     ├─ draggableStreak.js
│     ├─ getImageUrl.js
│     ├─ keepAlive.js
│     ├─ modalScrollLock.js
│     ├─ popupActivityData.js
│     └─ toastUtils.jsx
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
- `ProtectedRoute`: chặn route admin khi chưa xác thực.
- `PrimaryButton`, `ConfirmModal`: UI component dùng lại trong admin pages.

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

- Catch-all:
- `*` -> `NotFound` (game tìm Lucy).

### Chức năng chính từng page

- `HomePage`: ghép toàn bộ section landing + navbar/footer + flame widget hỗ trợ conversion.
- `AdminLogin`: đăng nhập admin, captcha, xử lý redirect nếu đã auth.
- `Dashboard`: số liệu tổng hợp, biểu đồ, backup/restore, export excel registrations.
- `RegistrationManagement`: danh sách + filter + đổi status + xóa registration.
- `CourseManagement`, `TeacherManagement`, `FeedbackManagement`, `AnnouncementManagement`: CRUD admin với upload ảnh multipart.
- `Statistics`: biểu đồ thống kê sâu (`Bar`, `Line`, `Pie`).
- `AdminHistory`: nhật ký thao tác, filter theo action/date, export CSV, backup Drive.
- `TimetableEditor`: quản lý lịch tuần (row/cell), export Excel timetable.
- `StudentManagement`: danh sách khóa học và điều hướng sang học viên theo khóa.
- `CourseStudentList`: danh sách học viên của khóa, remove student, gán ranking sao.
- `ForgotPassword` / `ResetPassword`: flow khôi phục mật khẩu admin.
- `NotFound`: game mini tương tác + đa ngôn ngữ.

## 5. Hooks

- `hooks/useLockBodyScroll.js`
- Custom hook khóa scroll khi mở modal, xử lý mobile/iOS để tránh jump layout.

- `pages/NotFound/GameLogic.js` (`useLucyGame`)
- Hook quản lý logic game tìm Lucy: lives, random vị trí, hint cooldown, win/loss.

- `utils/draggableStreak.js` (`useDraggableStreak`)
- Hook kéo-thả widget streak, nhớ vị trí bằng `localStorage`, hỗ trợ pointer/touch.

## 6. API integration

### Axios tập trung

- `services/api.js`
- Base URL theo `VITE_API_URL`.
- Tự gắn `Authorization` access token in-memory.
- Tự gắn `X-CSRF-Token` cho write methods.
- Interceptor 401: refresh token qua `/auth/refresh-token`, queue request đang chờ, bắt `SESSION_CONFLICT`.

### Service riêng

- `services/timetableService.js`: wrap toàn bộ API timetable + normalize response rows/cells.
- `services/streakService.js`: gọi `fetch` cho `/api/streak/*` và normalize payload.

### Mapping nơi gọi API chính

- Auth/session: `AuthContext.jsx` (`/auth/login`, `/auth/me`, `/auth/refresh-token`, `/auth/logout`, `/auth/check-session`).
- Public data: `CoursesSection`, `TeachersSection`, `TestimonialsSection`, `AnnouncementSection`.
- Form đăng ký: `RegistrationForm` -> `POST /registrations`.
- Admin CRUD: các trang management gọi endpoint tương ứng (`/courses`, `/teachers`, `/feedback`, `/announcements`, `/registrations`).
- Dashboard/history: `/stats`, `/stats/dashboard`, `/admin/history*`, `/auth/google/*`, `/restore/progress`.
- Ranking/Streak: `WhyChooseUs` + `CourseStudentList` + `FlameButton`.
- Timetable: `TimetableEditor` + `timetableService`.

## 7. State / Logic

- Global state duy nhất rõ ràng: `AuthContext`.
- Lưu `user`, `loading`, `isInitialized`, `sessionConflict`.
- Quản lý init auth có timeout, silent cleanup khi conflict.

- Local UI state:
- Mỗi page/component quản lý bằng `useState` (form, modal, filter, pagination, loading...).
- Không có Redux/MobX.

- Persistence cục bộ:
- `localStorage.hasSession` để biết có session kỳ vọng.
- `localStorage.streak_position` để lưu vị trí widget flame.

- i18n state:
- `i18next` với 2 ngôn ngữ `vi/en`, mặc định `vi`.

## 8. UI / Animation

- Thư viện và kỹ thuật:
- `framer-motion`: modal transition, stagger reveal, ranking animation, timetable interactions.
- `react-chartjs-2` + `chart.js`: chart dashboard/statistics.
- `react-toastify`: toast notification (`utils/toastUtils.jsx`).
- `react-icons` + `lucide-react`: icon hệ thống.
- Tailwind CSS: utility-first styling + responsive layouts.

- Animation logic nổi bật:
- Home sections dùng fade/hover/scale + decorative floating assets.
- `FlameButton` có logic drag + snap edge + popup + fireworks.
- `TimetableEditor` dùng `AnimatePresence` cho modal row/cell.
- `NotFound` có game-state animation (shake/hint/win/lose overlay).

## Ghi chú scan

- Đã scan và cập nhật cả khu vực `docs/structure` (không phát hiện file `be.md`/`fe.md` cũ trước khi ghi).
- Đã bỏ qua `.env` và `.env.production`; chỉ dùng `.env.example` theo yêu cầu.

# Frontend Structure (lucyClass-main/frontend)

## 1. Tổng quan

- **Framework**: React 18 + Vite.
- **Routing**: `react-router-dom` (Hỗ trợ public routes và nested routes cho Admin/Staff).
- **HTTP Client**: 
  - Axios instance chính tại `src/services/api.js` tích hợp CSRF protection, refresh token flow, và tự động thử lại khi token hết hạn.
  - Một số dịch vụ nhẹ sử dụng `fetch` API (`streakService`, `keepAlive`).
- **State Management**:
  - Quản lý trạng thái cục bộ bằng React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
  - Quản lý trạng thái đăng nhập toàn cục qua `AuthContext`.
- **Đa ngôn ngữ**: Sử dụng `i18next` và `react-i18next` (hỗ trợ Tiếng Việt, Tiếng Anh, Tiếng Trung).
- **UI/UX**: 
  - **Styling**: Tailwind CSS.
  - **Animations**: Framer Motion.
  - **Icons**: Lucide React, React Icons.
  - **Notifications**: React Toastify.
  - **Charts**: Chart.js + react-chartjs-2.

## 2. Cấu trúc thư mục chi tiết

```text
frontend/
├── public/                  # Static assets (favicon, robots.txt)
├── src/
│   ├── assets/              # Ảnh và tài nguyên tĩnh dùng trong code
│   │   ├── 404.png
│   │   ├── 404-9x16.png
│   │   ├── announcement-bg.png
│   │   ├── flame.png
│   │   ├── hero-bg.png
│   │   ├── hero-mobile.png
│   │   ├── why-us-main.png
│   │   ├── why-us-step1.png
│   │   ├── why-us-step2.png
│   │   └── why-us-step3.png
│   ├── components/
│   │   ├── common/          # Components dùng chung toàn dự án
│   │   │   ├── ConfirmModal.jsx
│   │   │   └── PrimaryButton.jsx
│   │   ├── Timetable/       # Chuyên biệt cho quản lý lịch học
│   │   │   ├── CellPopover.jsx
│   │   │   ├── RowManager.jsx
│   │   │   └── WeekSelector.jsx
│   │   ├── ActivitiesSection.jsx
│   │   ├── ActivityPopup.jsx
│   │   ├── AnnouncementModal.jsx
│   │   ├── AnnouncementSection.jsx
│   │   ├── CourseDetailModal.jsx
│   │   ├── CoursesSection.jsx
│   │   ├── CreatorPopup.jsx
│   │   ├── Fireworks.jsx
│   │   ├── FlameButton.jsx  # Floating UI cho tính năng Streak (điểm danh chuỗi)
│   │   ├── HeartRain.jsx
│   │   ├── HeroSection.jsx
│   │   ├── LearningJourney.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RecaptchaBox.jsx
│   │   ├── RecaptchaProvider.jsx
│   │   ├── RegistrationForm.jsx
│   │   ├── ScrollHintButton.jsx
│   │   ├── TeachersSection.jsx
│   │   ├── TestimonialsSection.jsx
│   │   └── WhyChooseUs.jsx
│   ├── config/
│   │   └── api.js           # Cấu hình BASE_URL API
│   ├── contexts/
│   │   └── AuthContext.jsx  # Context quản lý đăng nhập và role-based access
│   ├── hooks/
│   │   └── useLockBodyScroll.js
│   ├── i18n/
│   │   ├── en.json
│   │   ├── index.js         # Entry point cho i18n
│   │   ├── vi.json
│   │   └── zh.json
│   ├── layouts/
│   │   ├── AdminLayout.jsx  # Giao diện dành cho quản trị viên (Sidebar + Header)
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   └── StaffLayout.jsx  # Giao diện rút gọn cho nhân viên (GV/Marketing)
│   ├── pages/
│   │   ├── Marketing/
│   │   │   └── MarketingDashboard.jsx
│   │   ├── NotFound/
│   │   │   ├── GameLogic.js
│   │   │   ├── NotFound.css
│   │   │   └── NotFound.jsx
│   │   ├── Teacher/
│   │   │   └── TeacherDashboard.jsx
│   │   ├── AccountManagement.jsx
│   │   ├── AdminHistory.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── AnnouncementManagement.jsx
│   │   ├── CourseManagement.jsx
│   │   ├── CourseStudentList.jsx # Điểm danh & Quản lý danh sách học viên theo lớp
│   │   ├── Dashboard.jsx
│   │   ├── FeedbackManagement.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── HomePage.jsx
│   │   ├── RegistrationManagement.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Statistics.jsx
│   │   ├── StudentManagement.jsx
│   │   ├── TeacherManagement.jsx
│   │   └── TimetableEditor.jsx
│   ├── services/
│   │   ├── api.js           # Axios base & API methods
│   │   ├── streakService.js
│   │   └── timetableService.js
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── deviceId.js
│   │   ├── draggableStreak.js # Logic cho nút Streak trôi nổi
│   │   ├── getImageUrl.js
│   │   ├── keepAlive.js
│   │   ├── modalScrollLock.js
│   │   ├── popupActivityData.js
│   │   └── toastUtils.jsx
│   ├── App.jsx              # Định nghĩa Router
│   ├── i18n.js              # Cấu hình i18next
│   ├── index.css            # Global CSS (Tailwind)
│   └── main.jsx             # Entry point ứng dụng
├── .env.example             # Biến môi trường mẫu
├── index.html               # HTML Shell
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json              # Cấu hình deploy Vercel
└── vite.config.js           # Cấu hình Vite (proxy, plugins)
```

## 3. Router Mapping (Chi tiết tại `App.jsx`)

### Public Routes (Ai cũng có thể truy cập)
- `/` -> `HomePage`: Trang chủ giới thiệu.
- `/admin/login` -> `AdminLogin`: Trang đăng nhập chung cho mọi cấp bậc.
- `/forgot-password` -> `ForgotPassword`: Quên mật khẩu.
- `/reset-password/:token` -> `ResetPassword`: Đặt lại mật khẩu từ link email.

### Admin Routes (Chỉ dành cho Role: `admin`)
- `/admin/dashboard` -> `Dashboard`: Thống kê tổng quan.
- `/admin/accounts` -> `AccountManagement`: Quản lý tài khoản GV và Marketing.
- `/admin/registrations` -> `RegistrationManagement`: Quản lý đơn đăng ký học.
- `/admin/courses` -> `CourseManagement`: Quản lý danh mục khóa học.
- `/admin/teachers` -> `TeacherManagement`: Quản lý hồ sơ giáo viên.
- `/admin/feedback` -> `FeedbackManagement`: Quản lý ý kiến phản hồi.
- `/admin/students` -> `StudentManagement`: Danh sách tất cả học viên.
- `/admin/students/course/:courseId` -> `CourseStudentList`: Danh sách lớp cụ thể & Điểm danh.
- `/admin/announcements` -> `AnnouncementManagement`: Quản lý thông báo hệ thống.
- `/admin/timetable` -> `TimetableEditor`: Chỉnh sửa thời khóa biểu.
- `/admin/history` -> `AdminHistory`: Nhật ký thao tác hệ thống.

### Staff Routes (Dành cho Role: `teacher`, `marketing`)
- **Teacher**:
  - `/teacher/dashboard` -> `TeacherDashboard`: Lớp học đang phụ trách.
  - `/teacher/students/course/:courseId` -> `CourseStudentList`: Điểm danh lớp mình dạy.
- **Marketing**:
  - `/marketing/dashboard` -> `MarketingDashboard`: Thống kê đăng ký và tương tác.

### Fallback
- `*` -> `NotFound`: Trang 404 tích hợp trò chơi nhỏ.

## 4. File cấu hình quan trọng
- `vite.config.js`: Định nghĩa proxy để tránh CORS khi phát triển, cấu hình alias `@`.
- `tailwind.config.js`: Định nghĩa bảng màu thương hiệu, fonts (Inter, Montserrat) và các animation custom.
- `src/services/api.js`: Nơi xử lý tập trung logic Token (gắn JWT vào Header, tự động Refresh khi token hết hạn).

## 5. Ghi chú bảo mật
- **QUAN TRỌNG**: Các file `.env` chứa secret key thực tế đã được loại trừ hoàn toàn khỏi tài liệu này. 
- Mọi cấu hình nhạy cảm được quản lý qua biến môi trường trên server deploy.
- Sử dụng reCAPTCHA v2 cho các form công khai (Đăng ký, Đăng nhập).

---
*Tài liệu được cập nhật dựa trên cấu trúc thực tế ngày 21/04/2026.*

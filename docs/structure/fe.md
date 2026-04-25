# Cấu trúc Frontend

## Phạm vi tài liệu
- Tài liệu này mô tả phần frontend thực tế trong `frontend/`.
- Tập trung vào mã nguồn đang dùng, route, component, service, assets và file cấu hình chính.
- Không liệt kê chi tiết `node_modules/` và `dist/` vì đó là đầu ra cài đặt/build.

## Tổng quan
- Stack chính: `React`, `Vite`, `Tailwind CSS`, `React Router`, `Axios`.
- Điểm vào ứng dụng: `frontend/src/main.jsx`.
- Frontend phục vụ đồng thời:
  - website public,
  - trang admin,
  - trang giáo viên,
  - trang marketing,
  - các màn hình chấm công và quản trị nội bộ.

## Sơ đồ thư mục

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── hooks/
│   ├── i18n/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── i18n.js
│   ├── index.css
│   └── main.jsx
├── .env
├── .env.example
├── .env.production
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

## Thư mục `src/assets`

### `frontend/src/assets/404-9x16.png`
- Ảnh nền/trang trí cho trang 404 tỉ lệ dọc.

### `frontend/src/assets/404.png`
- Ảnh minh họa chính cho trang 404.

### `frontend/src/assets/announcement-bg.png`
- Ảnh nền cho khu vực thông báo.

### `frontend/src/assets/flame.png`
- Asset dùng cho nút truy cập nhanh `FlameButton`.

### `frontend/src/assets/hero-bg.png`
- Ảnh hero nền desktop cho trang chủ.

### `frontend/src/assets/hero-mobile.png`
- Ảnh hero nền mobile cho trang chủ.

### `frontend/src/assets/why-us-main.png`
- Ảnh minh họa chính cho section lý do chọn trung tâm.

### `frontend/src/assets/why-us-step1.png`
- Ảnh bước 1 trong section `WhyChooseUs`.

### `frontend/src/assets/why-us-step2.png`
- Ảnh bước 2 trong section `WhyChooseUs`.

### `frontend/src/assets/why-us-step3.png`
- Ảnh bước 3 trong section `WhyChooseUs`.

## Thư mục `src/components`

### `frontend/src/components/common/ConfirmModal.jsx`
- Modal xác nhận dùng lại ở nhiều màn hình quản trị.

### `frontend/src/components/common/PrimaryButton.jsx`
- Nút chuẩn dùng chung để đồng bộ giao diện thao tác chính.

### `frontend/src/components/Timetable/CellPopover.jsx`
- Popup chỉnh nội dung một ô trong thời khóa biểu.

### `frontend/src/components/Timetable/RowManager.jsx`
- Quản lý thêm/sửa/xóa/sắp xếp hàng của thời khóa biểu.

### `frontend/src/components/Timetable/WeekSelector.jsx`
- Bộ chọn tuần khi xem/chỉnh sửa thời khóa biểu.

### `frontend/src/components/ActivitiesSection.jsx`
- Section hoạt động nổi bật trên trang chủ.

### `frontend/src/components/ActivityPopup.jsx`
- Popup hiển thị chi tiết hoạt động.

### `frontend/src/components/AnnouncementListModal.jsx`
- Modal hiển thị danh sách thông báo.

### `frontend/src/components/AnnouncementModal.jsx`
- Modal xem nội dung chi tiết một thông báo.

### `frontend/src/components/AnnouncementReviewModal.jsx`
- Modal admin duyệt/từ chối thông báo do marketing gửi.

### `frontend/src/components/AnnouncementSection.jsx`
- Section thông báo trên homepage.

### `frontend/src/components/CourseDetailModal.jsx`
- Modal chi tiết khóa học.

### `frontend/src/components/CoursesSection.jsx`
- Section danh sách khóa học public trên homepage.

### `frontend/src/components/CreatorPopup.jsx`
- Popup giới thiệu/tương tác phụ trợ liên quan người tạo hoặc nội dung đặc biệt.

### `frontend/src/components/Fireworks.jsx`
- Hiệu ứng pháo hoa trang trí ở trang chủ.

### `frontend/src/components/FlameButton.jsx`
- Nút nổi hỗ trợ điều hướng nhanh/tương tác đặc biệt.

### `frontend/src/components/HeartRain.jsx`
- Hiệu ứng mưa tim dùng cho trải nghiệm động.

### `frontend/src/components/HeroSection.jsx`
- Khu vực hero đầu trang chủ.

### `frontend/src/components/LearningJourney.jsx`
- Section mô tả lộ trình học tập.

### `frontend/src/components/NotificationBell.jsx`
- Chuông thông báo cho khu vực nội bộ.
- Kết nối với `announcementService` để lấy thông báo mới và đánh dấu đã xem.

### `frontend/src/components/ProtectedRoute.jsx`
- Chặn route theo trạng thái đăng nhập và role.
- Nếu sai role sẽ điều hướng về dashboard phù hợp.

### `frontend/src/components/RecaptchaBox.jsx`
- Render widget Google reCAPTCHA.
- Có logic reset và tạo mới DOM node để tránh lỗi render lại.

### `frontend/src/components/RecaptchaProvider.jsx`
- Nạp script reCAPTCHA và cung cấp trạng thái sẵn sàng qua context.

### `frontend/src/components/RegistrationForm.jsx`
- Form đăng ký học trên trang chủ.
- Bao gồm:
  - lấy danh sách khóa học,
  - nhập thông tin phụ huynh/học sinh,
  - chặn lớp đầy,
  - tích hợp reCAPTCHA,
  - xử lý cảnh báo trùng,
  - gửi đăng ký lên backend.

### `frontend/src/components/ScrollHintButton.jsx`
- Nút gợi ý cuộn trang hoặc nhảy tới section tiếp theo.

### `frontend/src/components/TeachersSection.jsx`
- Section danh sách giáo viên trên trang chủ.

### `frontend/src/components/TestimonialsSection.jsx`
- Section phản hồi/phụ huynh đánh giá.

### `frontend/src/components/WhyChooseUs.jsx`
- Section lý do chọn trung tâm.

## Thư mục `src/config`

### `frontend/src/config/api.js`
- Tiện ích cấu hình base API URL hoặc helper liên quan endpoint.

## Thư mục `src/contexts`

### `frontend/src/contexts/AuthContext.jsx`
- Context xác thực toàn frontend.
- Quản lý:
  - bootstrap phiên khi app mở,
  - login,
  - logout,
  - refresh token flow,
  - session conflict,
  - cờ role như `isAdmin`, `isTeacher`, `isMarketing`.

## Thư mục `src/hooks`

### `frontend/src/hooks/useLockBodyScroll.js`
- Hook khóa cuộn body khi mở modal/drawer.

### `frontend/src/hooks/useNotifications.js`
- Hook phục vụ quản lý trạng thái/thao tác với thông báo nội bộ.

## Thư mục `src/i18n`

### `frontend/src/i18n/en.json`
- Bản dịch tiếng Anh.

### `frontend/src/i18n/index.js`
- Cấu hình nguồn dữ liệu dịch, export tài nguyên i18n.

### `frontend/src/i18n/vi.json`
- Bản dịch tiếng Việt.

### `frontend/src/i18n/zh.json`
- Bản dịch tiếng Trung.

## Thư mục `src/layouts`

### `frontend/src/layouts/AdminLayout.jsx`
- Layout chung cho toàn bộ route admin.
- Chứa khung sidebar/header/nội dung lồng.

### `frontend/src/layouts/Footer.jsx`
- Footer website public.

### `frontend/src/layouts/Navbar.jsx`
- Thanh điều hướng website public.

### `frontend/src/layouts/StaffLayout.jsx`
- Layout dùng cho teacher/marketing và route attendance staff.

## Thư mục `src/pages`

### `frontend/src/pages/Admin/AttendanceManagement.jsx`
- Màn hình admin quản lý chấm công staff.
- Hỗ trợ xem theo ngày, sửa log, xuất Excel.

### `frontend/src/pages/Attendance/StaffAttendance.jsx`
- Màn hình teacher/marketing tự check-in/check-out và xem lịch sử chấm công.

### `frontend/src/pages/Marketing/MarketingDashboard.jsx`
- Dashboard riêng cho marketing.

### `frontend/src/pages/Marketing/MktAnnouncementPage.jsx`
- Trang marketing gửi thông báo chờ duyệt và xem lịch sử submission của mình.

### `frontend/src/pages/NotFound/GameLogic.js`
- Logic minigame/hiệu ứng tương tác cho trang 404.

### `frontend/src/pages/NotFound/NotFound.css`
- CSS riêng cho trang 404.

### `frontend/src/pages/NotFound/NotFound.jsx`
- Trang 404.

### `frontend/src/pages/Teacher/TeacherDashboard.jsx`
- Dashboard riêng cho giáo viên.
- Thường hiển thị hồ sơ, lớp phụ trách và điều hướng nhanh.

### `frontend/src/pages/AccountManagement.jsx`
- Màn hình admin quản lý tài khoản staff.

### `frontend/src/pages/AdminHistory.jsx`
- Màn hình admin xem lịch sử thao tác và export log.

### `frontend/src/pages/AdminLogin.jsx`
- Màn hình đăng nhập chung cho admin/teacher/marketing.
- Có reCAPTCHA và điều hướng theo role sau đăng nhập.

### `frontend/src/pages/AnnouncementManagement.jsx`
- Màn hình admin quản lý thông báo.
- Hỗ trợ:
  - tạo mới,
  - cập nhật,
  - xóa,
  - duyệt bài marketing,
  - chuyển tab published/pending.

### `frontend/src/pages/CourseManagement.jsx`
- Màn hình admin quản lý khóa học.
- Hỗ trợ CRUD, ảnh khóa học, giáo viên phụ trách, trạng thái hoạt động.

### `frontend/src/pages/CourseStudentList.jsx`
- Màn hình xem danh sách học sinh theo khóa.
- Dùng cho admin và teacher theo quyền truy cập.

### `frontend/src/pages/Dashboard.jsx`
- Dashboard tổng quan admin.
- Hỗ trợ:
  - widget thống kê,
  - biểu đồ,
  - đăng ký gần đây,
  - backup/restore Google Drive,
  - xuất Excel đăng ký.

### `frontend/src/pages/FeedbackManagement.jsx`
- Màn hình admin quản lý phản hồi hiển thị công khai.

### `frontend/src/pages/ForgotPassword.jsx`
- Màn hình yêu cầu quên mật khẩu.
- Hỗ trợ flow admin và staff.

### `frontend/src/pages/HomePage.jsx`
- Trang chủ public.
- Ghép các section public theo thứ tự hiển thị.

### `frontend/src/pages/RegistrationManagement.jsx`
- Màn hình admin quản lý danh sách đăng ký học.

### `frontend/src/pages/ResetPassword.jsx`
- Màn hình đặt lại mật khẩu từ token email.

### `frontend/src/pages/Statistics.jsx`
- Màn hình thống kê chi tiết cho admin.

### `frontend/src/pages/StudentManagement.jsx`
- Màn hình admin quản lý học viên đã đăng ký/học.

### `frontend/src/pages/TeacherManagement.jsx`
- Màn hình admin quản lý giáo viên.
- Hỗ trợ tạo/sửa/xóa giáo viên, avatar, tài khoản liên kết.

### `frontend/src/pages/TimetableEditor.jsx`
- Màn hình admin chỉnh sửa thời khóa biểu dạng lưới.

## Thư mục `src/services`

### `frontend/src/services/announcementService.js`
- Tập hợp API call cho thông báo.
- Bao gồm:
  - lấy thông báo public,
  - lấy thông báo mới nhất,
  - đánh dấu đã xem,
  - marketing submit bài,
  - lấy bài đã gửi,
  - admin lấy pending,
  - review, create, update, delete.

### `frontend/src/services/api.js`
- Axios client trung tâm của frontend.
- Chức năng chính:
  - cấu hình `baseURL`,
  - `withCredentials`,
  - gắn header `X-Requested-With`,
  - giữ access token trong memory,
  - tự refresh khi gặp 401,
  - xử lý queue request chờ refresh,
  - phát sự kiện `auth:logout` và `session:conflict`.

### `frontend/src/services/attendanceService.js`
- API service cho chấm công staff/admin.

### `frontend/src/services/streakService.js`
- API service cho tính năng streak public.
- Gọi backend bằng `fetch`, gửi `deviceId`, normalize response.

### `frontend/src/services/timetableService.js`
- API service cho thời khóa biểu.
- Bao gồm normalize response, CRUD row/cell và export.

## Thư mục `src/utils`

### `frontend/src/utils/dateUtils.js`
- Hàm tiện ích format ngày giờ, relative time.

### `frontend/src/utils/deviceId.js`
- Sinh/lấy mã thiết bị dùng cho streak hoặc chống spam phía client.

### `frontend/src/utils/draggableStreak.js`
- Logic kéo thả hoặc tương tác động cho giao diện streak.

### `frontend/src/utils/getImageUrl.js`
- Chuẩn hóa URL ảnh từ dữ liệu backend/Cloudinary/static fallback.

### `frontend/src/utils/keepAlive.js`
- Tiện ích giữ kết nối hoặc đánh thức dịch vụ nếu cần.

### `frontend/src/utils/modalScrollLock.js`
- Tiện ích khóa cuộn nền cho modal.

### `frontend/src/utils/popupActivityData.js`
- Dữ liệu cấu hình cho popup hoạt động.

### `frontend/src/utils/toastUtils.jsx`
- Hàm tiện ích hiển thị toast thống nhất.

## Các file gốc trong `src`

### `frontend/src/App.jsx`
- Khai báo toàn bộ route của ứng dụng.
- Các nhóm route:
  - `/` public,
  - `/admin/*` cho admin,
  - `/teacher/*` cho giáo viên,
  - `/marketing/*` cho marketing,
  - `/attendance` cho teacher/marketing,
  - `*` cho 404.

### `frontend/src/i18n.js`
- Khởi tạo i18n ở mức ứng dụng.

### `frontend/src/index.css`
- CSS nền của toàn ứng dụng, bao gồm Tailwind import và style global.

### `frontend/src/main.jsx`
- Điểm vào React app.
- Thường mount `App`, router, provider xác thực, i18n và provider khác.

## Các file cấu hình ở `frontend/`

### `frontend/.env`
- Biến môi trường frontend local.

### `frontend/.env.example`
- Mẫu biến môi trường frontend.

### `frontend/.env.production`
- Biến môi trường frontend production.

### `frontend/index.html`
- HTML shell do Vite dùng để mount React app.

### `frontend/package-lock.json`
- Khóa phiên bản dependency frontend.

### `frontend/package.json`
- Khai báo package, script và dependency frontend.

### `frontend/postcss.config.js`
- Cấu hình PostCSS cho Tailwind/autoprefixer.

### `frontend/tailwind.config.js`
- Cấu hình theme, màu sắc, font, utility của Tailwind.

### `frontend/vercel.json`
- Cấu hình deploy frontend trên Vercel.

### `frontend/vite.config.js`
- Cấu hình build/dev server Vite.
- Có thể chứa proxy API cho môi trường local.

## Vai trò chức năng theo khu vực

### Website public
- `HomePage.jsx` ghép các section:
  - hero,
  - lý do chọn trung tâm,
  - khóa học,
  - lộ trình học,
  - hoạt động,
  - giáo viên,
  - cảm nhận,
  - thông báo,
  - form đăng ký.

### Khu vực admin
- `AdminLayout.jsx` là shell chính.
- Các màn hình quản lý:
  - dashboard,
  - đăng ký,
  - khóa học,
  - giáo viên,
  - phản hồi,
  - thống kê,
  - học sinh,
  - thông báo,
  - thời khóa biểu,
  - tài khoản staff,
  - lịch sử admin,
  - chấm công.

### Khu vực giáo viên
- `TeacherDashboard.jsx` là màn hình chính.
- Có thể xem lớp phụ trách, danh sách học sinh lớp và chấm công staff.

### Khu vực marketing
- `MarketingDashboard.jsx` là màn hình chính.
- `MktAnnouncementPage.jsx` dùng để gửi thông báo chờ admin duyệt.

## Luồng xác thực frontend
- Người dùng đăng nhập tại `AdminLogin.jsx`.
- `AuthContext.jsx` lưu access token trong memory.
- `services/api.js` tự gắn token vào request.
- Khi access token hết hạn:
  - frontend gọi `/auth/refresh-token`,
  - nhận access token mới,
  - retry request cũ.
- Nếu session conflict:
  - frontend phát event,
  - hiện modal yêu cầu đăng nhập lại.

## Ghi chú triển khai
- Frontend public và frontend quản trị dùng chung một codebase, phân luồng bằng route và layout.
- Phần API call tập trung ở `src/services/`, giúp UI component không phải tự xử lý token/refresh.
- Hệ thống hỗ trợ đa ngôn ngữ qua thư mục `src/i18n/`.

## 📌 Mục đích
Tài liệu này mô tả chi tiết kiến trúc giao diện, cấu trúc thư mục và quy trình tích hợp API của phần Frontend trong dự án **Lucy's Class**. Đây là tài liệu tham khảo chính cho các nhà phát triển khi làm việc với giao diện người dùng.

## 🌐 Tổng quan Hệ thống
Frontend của **Lucy's Class** là một ứng dụng SPA (Single Page Application) hiện đại được xây dựng trên nền tảng **React** và trình đóng gói **Vite**. Ứng dụng tập trung vào việc cung cấp trải nghiệm mượt mà, cao cấp cho cả học viên và quản trị viên.

- **Tương tác Backend**: Kết nối với Node.js backend thông qua một lớp giao tiếp API tập trung và an toàn.
- **Công nghệ cốt lõi**:
    - **UI Library**: React 18.
    - **Styling**: Tailwind CSS cho việc thiết kế giao diện nhanh và linh hoạt.
    - **Animations**: Framer Motion để tạo các hiệu ứng chuyển cảnh và tương tác sinh động.
    - **Icons**: Lucide React.
- **Quản lý Tài nguyên**: 
    - Hình ảnh động được tối ưu qua **Cloudinary**.
    - Các tài nguyên tĩnh được lưu trữ tại thư mục `public/`.

## 🚀 Luồng Tích hợp API
Toàn bộ giao tiếp mạng được tập trung tại `src/services/api.js` để đảm bảo tính nhất quán và bảo mật tối đa.

### 🛠️ Client Axios Tập trung
- **Instance**: Sử dụng một instance Axios duy nhất được cấu hình `withCredentials: true` để quản lý phiên làm việc qua HTTP-only cookie.
- **Biện pháp Bảo mật**:
    - **Bảo vệ CSRF**: Tự động trích xuất và đính kèm header `X-CSRF-Token` cho các yêu cầu làm thay đổi dữ liệu (POST, PUT, DELETE).
    - **Quản lý JWT**: Xử lý Access Token lưu trong bộ nhớ (memory), thực hiện xoay vòng token tự động qua cơ chế refresh.

### 🔁 Cơ chế Làm mới Token (Auto-refresh)
1. Khi một yêu cầu API trả về lỗi **401 Unauthorized**, interceptor sẽ tạm dừng các yêu cầu đang chờ.
2. Hệ thống thực hiện gọi API `/auth/refresh-token` để lấy Access Token mới bằng Refresh Token (lưu trong HttpOnly cookie).
3. Nếu thành công, hệ thống sẽ thực hiện lại toàn bộ các yêu cầu trong hàng đợi với token mới.
4. Nếu thất bại (phiên làm việc hết hạn), ứng dụng sẽ kích hoạt quy trình đăng xuất toàn cục và chuyển người dùng về trang đăng nhập.

## 📁 Cấu trúc Thư mục

```text
frontend/
├── public/             # Tài nguyên tĩnh (favicons, manifest, robot.txt)
├── src/
│   ├── assets/         # Styles toàn cục, font chữ và hình ảnh tĩnh
│   ├── components/     # Các thành phần giao diện có thể tái sử dụng
│   │   ├── common/     # Các thành phần cơ bản (Modals, Buttons, Inputs)
│   │   └── Timetable/  # Các thành phần chuyên biệt theo tính năng
│   ├── config/         # Hằng số ứng dụng và cấu hình môi trường
│   ├── contexts/       # React Context providers (Auth, Theme, Notification)
│   ├── hooks/          # Các custom hooks (useAuth, useFetch, useWindowSize)
│   ├── layouts/        # Các bộ khung trang dùng chung (AdminLayout, MainLayout)
│   ├── pages/          # Các thành phần trang và logic hiển thị chính
│   ├── services/       # Client API và các dịch vụ xử lý dữ liệu theo tính năng
│   ├── utils/          # Các hàm hỗ trợ định dạng (date, currency) và xác thực
│   ├── App.jsx         # Thành phần gốc và cấu hình bộ định tuyến (routing)
│   └── main.jsx        # Điểm khởi đầu của ứng dụng (entry point)
└── vite.config.js      # Cấu hình bộ đóng gói Vite và thiết lập Proxy
```

## 🔍 Phân tích Thành phần Chi tiết

### 🧩 Thư mục `components/`
- **`TeachersSection.jsx`**: Carousel tương tác hiển thị thông tin đội ngũ giáo viên.
- **`RegistrationForm.jsx`**: Biểu mẫu đăng ký nhiều bước (multi-step) với xác thực dữ liệu ngay lập tức.
- **`RecaptchaBox.jsx`**: Thành phần bao bọc Google reCAPTCHA v2 để chống spam.

### 📑 Thư mục `pages/` (Quản trị)
- **`Dashboard.jsx`**: Trang quản lý tổng quan với các biểu đồ thống kê và lối tắt tác vụ.
- **`CourseStudentList.jsx`**: Bảng dữ liệu nâng cao hỗ trợ lọc, tìm kiếm và quản lý học viên.
- **`TimetableEditor.jsx`**: Giao diện tương tác kéo-thả để sắp xếp lịch học.

### ⚙️ Thư mục `services/`
- **`api.js`**: Lớp xử lý giao tiếp cốt lõi (như đã mô tả ở trên).
- **`timetableService.js`**: Xử lý logic phức tạp khi chuyển đổi dữ liệu lịch học cho giao diện lưới.

### 🖼️ Thư mục `layouts/`
- **`AdminLayout.jsx`**: Cung cấp Side Navigation và kiểm tra quyền truy cập cho khu vực quản lý.
- **`Topbar.jsx`**: Thanh công cụ phía trên xử lý tìm kiếm và thông tin tài khoản cá nhân.

## 🔗 Liên kết
- [Tài liệu Kiến trúc Backend](backend.md)
- [Hướng dẫn thiết kế UI/UX](../../docs/design/GUIDE.md)

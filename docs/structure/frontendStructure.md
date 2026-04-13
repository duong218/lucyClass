---

# Tài liệu Kiến trúc Frontend - Lớp học của Lucy (Bản dịch tiếng Việt)

## 🌐 Tổng quan Hệ thống
Frontend của **Lucy's Class** là một SPA (Single Page Application) hiện đại được xây dựng bằng **React** và **Vite**. Nó cung cấp giao diện tương tác và cao cấp cho cả học sinh và quản trị viên.

- **Tương tác Backend**: Kết nối với backend Node.js thông qua một client API tập trung và bảo mật.
- **Ngôn ngữ & Công nghệ**:
    - **Giao diện**: React 18, Tailwind CSS cho việc tạo kiểu (styling).
    - **Hiệu ứng**: Framer Motion cho các chuyển cảnh mượt mà và các yếu tố tương tác.
    - **Biểu tượng**: Lucide React.
- **Tài nguyên**: Hình ảnh được cung cấp qua **Cloudinary**, trong khi các tài nguyên tĩnh nằm trong thư mục `public/`.

---

## 🚀 Luồng Tích hợp API

Frontend tập trung tất cả các giao tiếp mạng trong `src/services/api.js` để đảm bảo tính bảo mật và nhất quán.

### 🛠️ Client Axios Tập trung
-   **Instance**: Một instance Axios được cấu hình với `withCredentials: true` cho việc theo dõi phiên làm việc dựa trên cookie.
-   **Bảo mật**: Triển khai các biện pháp bảo mật cấp cao:
    -   **Bảo vệ CSRF**: Tự động lấy và đính kèm header `X-CSRF-Token` cho các yêu cầu thay đổi trạng thái (POST, PUT, DELETE).
    -   **Quản lý JWT**: Xử lý các token Bearer được lưu trữ trong bộ nhớ, xoay vòng chúng thông qua luồng làm mới tự động.

### 🔁 Làm mới Token Tự động
1.  Nếu một yêu cầu thất bại với lỗi **401 Unauthorized**, interceptor sẽ tạm dừng hàng đợi yêu cầu.
2.  Nó cố gắng gọi `/auth/refresh-token` để lấy access token mới bằng cookie refresh HttpOnly.
3.  Khi thành công, nó sẽ thử lại tất cả các yêu cầu trong hàng đợi với token mới.
4.  Khi thất bại (ví dụ: phiên làm việc hết hạn), nó sẽ kích hoạt sự kiện đăng xuất toàn cục.

---

## 📁 Cấu trúc Thư mục

```text
frontend/
├── public/             # Tài nguyên tĩnh (favicons, manifest)
├── src/
│   ├── assets/         # Styles toàn cục, font và hình ảnh
│   ├── components/     # Các thành phần UI có thể tái sử dụng
│   │   ├── common/     # Modals, Buttons, Inputs (Chung)
│   │   └── Timetable/  # Các thành phần theo tính năng cụ thể
│   ├── config/         # Các hằng số ứng dụng và cài đặt môi trường
│   ├── contexts/       # Các React Context providers (Auth, Theme)
│   ├── hooks/          # Các custom hooks (useAuth, useFetch)
│   ├── layouts/        # Các layout dùng chung (AdminLayout, MainLayout)
│   ├── pages/          # Các thành phần trang và logic hiển thị
│   ├── services/       # Client API và các dịch vụ theo tính năng
│   ├── utils/          # Các hàm bổ trợ định dạng và xác thực
│   ├── App.jsx         # Thành phần gốc và bộ định tuyến
│   └── main.jsx        # Điểm đầu vào ứng dụng
└── vite.config.js      # Cấu hình build và proxy
```

---

## 🔍 Phân tích Thành phần Chi tiết

### `components/`
-   **`TeachersSection.jsx`**: Một carousel tương tác và phức tạp hiển thị chi tiết về giáo viên.
-   **`RegistrationForm.jsx`**: Biểu mẫu nhiều bước với tính năng xác thực thời gian thực để đăng ký học sinh.
-   **`RecaptchaBox.jsx`**: Lớp bao bọc Google reCAPTCHA v2 tập trung.

### `pages/` (Quản trị)
-   **`Dashboard.jsx`**: Trung tâm điều khiển với các số liệu thống kê và hành động nhanh.
-   **`CourseStudentList.jsx`**: Các bảng dữ liệu nâng cao để quản lý đăng ký theo khóa học.
-   **`TimetableEditor.jsx`**: Giao diện kéo-thả/dạng lưới để quản lý lịch học.

### `services/`
-   **`api.js`**: Lớp giao tiếp cốt lõi được mô tả trong Luồng Tích hợp API.
-   **`timetableService.js`**: Logic chuyên biệt cho các chuyển đổi dữ liệu dạng lưới phức tạp.

### `layouts/`
-   **`AdminLayout.jsx`**: Cung cấp thanh điều hướng bên hông và lớp bao bọc xác thực cho các trang quản lý.
-   **`Topbar.jsx`**: Xử lý các hành động về hồ sơ người dùng và tìm kiếm toàn cục.

# Lucy's Class - Hệ thống Quản lý Trung tâm Tiếng Anh

Website Lucy's Class là một ứng dụng Full-stack hiện đại, được xây dựng để tối ưu hóa việc quản lý các khóa học, học sinh và hoạt động của trung tâm tiếng Anh dành cho trẻ em. Hệ thống cung cấp trang Landing Page chuyên nghiệp cho phụ huynh và Dashboard quản trị tập trung cho Admin.

---

## 📝 Tổng quan dự án

Dự án này phục vụ hai mục đích chính:
1. **Trang chủ công khai**: Hiển thị thông tin khóa học, giáo viên, tin tức và cho phép phụ huynh đăng ký trực tuyến mà không cần đăng nhập.
2. **Dashboard quản trị**: Khu vực bảo mật dành riêng cho **một Admin duy nhất** để quản lý toàn bộ dữ liệu hệ thống, từ nhân sự đến tài chính và lịch sử hoạt động.

---

## ✨ Tính năng chính

Hệ thống được trang bị đầy đủ các module quản lý chuyên sâu:

*   **🛡️ Xác thực & Bảo mật**: Đăng nhập Admin bảo mật với JWT, Refresh Token, Cookie HTTP-only và bảo vệ chống tấn công CSRF.
*   **📋 Quản lý Đăng ký (Registrations)**: Tiếp nhận, theo dõi và phê duyệt các đơn đăng ký học từ phụ huynh.
*   **🎓 Quản lý Khóa học (Courses)**: Tạo, chỉnh sửa và quản lý danh sách các lớp học với các thuộc tính chi tiết (học phí, độ tuổi, cấp độ).
*   **👥 Quản lý Học sinh (Students)**: Lưu trữ hồ sơ học sinh chính thức, theo dõi lớp học đang theo học.
*   **👩‍🏫 Quản lý Giáo viên (Teachers)**: Quản lý thông tin profile, trình độ và hình ảnh của đội ngũ giảng dạy.
*   **📢 Hệ thống Thông báo (Announcements)**: Soạn thảo và đăng tải các tin tức, sự kiện lên trang chủ.
*   **📩 Quản lý Phản hồi (Feedback)**: Tiếp nhận và xử lý các ý kiến gửi từ trang liên hệ.
*   **📊 Thống kê & Báo cáo (Statistics)**: Tổng hợp dữ liệu bằng biểu đồ trực quan về số lượng học sinh và tình hình trung tâm.
*   **📜 Nhật ký hoạt động (Audit Logs)**: Ghi lại chi tiết mọi thay đổi trên hệ thống để đảm bảo tính minh bạch.
*   **💾 Sao lưu & Đồng bộ**: Hỗ trợ sao lưu dữ liệu tự động hoặc thủ công lên Google Drive.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

Hệ thống sử dụng các công nghệ hiện đại đảm bảo hiệu năng và tính bảo mật cao:

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **UI Components**: Framer Motion (hiệu ứng), Lucide React (icon), Swiper (carousel)
- **Charts**: Chart.js & React Chartjs 2
- **i18n**: i18next (Hỗ trợ đa ngôn ngữ Anh/Việt)
- **API Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Auth**: JSON Web Token (JWT) + Bcryptjs
- **File Management**: Multer (upload), Adm-zip / Archiver (backup)
- **Communications**: Nodemailer (gửi mail reset mật khẩu)
- **Security**: CSURF, Helmet, Express-rate-limit, Sanitize, XSS-clean
- **Logging**: Winston
- **Cloud Integration**: Google Drive API & Google OAuth2

### Database
- **Primary**: MongoDB (thông qua Mongoose)
- **Caching**: Redis (tích hợp sẵn cho giới hạn lượt truy cập)

---

## 📁 Cấu trúc thư mục

Dự án được tổ chức theo cấu trúc module rõ ràng:

```bash
root/
├── backend/
│   ├── config/          # Cấu hình Database, Passport, Google API
│   ├── controllers/     # Xử lý Logic nghiệp vụ cho các Route
│   ├── middlewares/      # Kiểm tra Auth, bảo mật CSRF, upload file
│   ├── models/          # Định nghĩa cấu trúc dữ liệu MongoDB (Schemas)
│   ├── routes/          # Định nghĩa các đầu cuối API (v1)
│   ├── services/         # Dịch vụ bên thứ 3 (Mail, Google Drive)
│   ├── utils/           # Các hàm tiện ích (Format date, logger)
│   └── server.js        # File chạy chính của server
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Các UI Components dùng chung và các Section trang chủ
│   │   ├── layouts/     # Bố cục trang (Navbar, Footer, AdminLayout)
│   │   ├── pages/       # Các trang chính (Dashboard, Login, Management)
│   │   ├── services/    # Cấu hình gọi API bằng Axios
│   │   ├── contexts/    # Quản lý trạng thái toàn cục (AuthContext)
│   │   └── i18n/        # Cấu hình đa ngôn ngữ (Translation files)
│   └── index.html
└── Huongdansudung.md   # Hướng dẫn chi tiết cho người dùng cuối
```

---

## 🔧 Biến môi trường (.env)

Hệ thống yêu cầu các biến môi trường sau trong `backend/.env`:

- `PORT`: Cổng chạy server (mặc định 5000)
- `MONGO_URI`: Đường dẫn kết nối MongoDB Atlas
- `JWT_SECRET`: Khóa bí mật mã hóa Token
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Cho tính năng sao lưu Google Drive
- `EMAIL_USER` & `EMAIL_PASS`: Tài khoản gửi email khôi phục mật khẩu
- `FRONTEND_URL`: URL của frontend (cho phép CORS)

---

## 🛠️ Hướng dẫn cài đặt & Chạy dự án

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 22 trở lên.
- **MongoDB**: Đã cài đặt cục bộ hoặc sử dụng Atlas cloud.

### 1. Cài đặt Backend
```bash
cd backend
npm install
npm run dev
```
*Server sẽ khởi chạy tại: http://localhost:5000*

### 2. Cài đặt Frontend
```bash
cd frontend
npm install
npm run dev
```
*Ứng dụng sẽ khởi chạy tại: http://localhost:5173*

---

## ⚠️ Lưu ý quan trọng cho Lập trình viên

1.  **Chỉ một Admin**: Hệ thống được thiết kế cho mô hình 1 người quản trị. Tài khoản admin mặc định được khởi tạo lần đầu trong `server.js`.
2.  **Cấu trúc API**: Mọi API route đều nằm dưới tiền tố `/api/`. Các route quản trị đều yêu cầu xác thực qua Middleware `protectAdmin`.
3.  **Bảo mật CSRF**: Frontend cần truyền `xsrf-token` trong Header cho các phương thức POST/PUT/DELETE.
4.  **Lưu trữ hình ảnh**: Hiện tại đang hỗ trợ lưu cục bộ tại `backend/uploads` và đồng bộ Drive. Hãy đảm bảo thư mục này có quyền ghi.

---
*Phát triển bởi đội ngũ kỹ thuật của Lucy's Class.* 🚀

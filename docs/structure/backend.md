## 📌 Mục đích
Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc, cấu trúc thư mục và các thành phần kỹ thuật cốt lõi của hệ thống Backend dự án **Lucy's Class**. Đây là hướng dẫn dành cho các nhà phát triển để hiểu cách hệ thống được tổ chức và vận hành.

## 🌐 Tổng quan Hệ thống
Backend của **Lucy's Class** là một ứng dụng Node.js/Express được thiết kế hướng tới hiệu suất, bảo mật và độ tin cậy. Hệ thống tuân theo kiến trúc phân lớp (layered architecture) để tách biệt trách nhiệm và đảm bảo tính bảo trì lâu dài.

- **Tương tác Frontend**: Giao tiếp với React frontend thông qua các API RESTful.
- **Cơ sở dữ liệu**: Sử dụng **MongoDB Atlas** làm cơ sở dữ liệu đám mây chính, được quản lý qua Mongoose ODM.
- **Luồng xử lý API**: Request → `routes/` (Định tuyến) → `middlewares/` (Xác thực/Kiểm tra) → `controllers/` (Xử lý Yêu cầu/Phản hồi) → `services/` (Logic nghiệp vụ) → `models/` (Schema dữ liệu).
- **Bảo vệ dữ liệu**: Triển khai hệ thống sao lưu và khôi phục nhiều lớp với mã hóa đầu cuối.

## ✨ Các Tính năng Chính

### 📦 Hệ thống Sao lưu (Backup)
Quy trình sao lưu tự động và mạnh mẽ bao gồm:
1. **Dumping**: Sử dụng `mongodump` để tạo ảnh chụp (snapshots) dữ liệu nhất quán.
2. **Nén**: Đóng gói dữ liệu vào tệp ZIP bằng thư viện `archiver`.
3. **Mã hóa**: Bảo mật tệp ZIP bằng thuật toán **AES-256-CBC** trước khi truyền tải.
4. **Lưu trữ đám mây**: Tự động tải bản sao lưu đã mã hóa lên **Google Drive** qua Drive API.
5. **Xoay vòng (Rotation)**: Chỉ duy trì 20 bản sao lưu gần nhất trên Google Drive để tối ưu dung lượng.

### 🛡️ Hệ thống Khôi phục (Restore)
Được thiết kế để đảm bảo an toàn và toàn vẹn dữ liệu:
1. **Sao lưu an toàn**: Tự động tạo một bản snapshot "an toàn" cục bộ trước khi thực hiện khôi phục.
2. **Xác minh**: Giải mã và khôi phục dữ liệu vào một **cơ sở dữ liệu tạm thời** để kiểm tra tính toàn vẹn.
3. **Ghi đè có kiểm soát**: Chỉ sau khi xác minh thành công, hệ thống mới thực hiện khôi phục vào DB chính (sử dụng tham số `--drop`).
4. **Dọn dẹp**: Tự động xóa các tệp tạm và tệp đã giải mã sau khi hoàn tất quy trình.

### ⏰ Công việc Định kỳ (Cron Jobs)
Sử dụng `node-cron` để tự động hóa các tác vụ bảo trì:
- **Sao lưu định kỳ**: Lập lịch sao lưu hàng ngày/hàng tuần và tự động tải lên Google Drive.
- **Dọn dẹp hệ thống**: Định kỳ xóa các tệp khôi phục tạm thời đã hết hạn và các bản ghi nhật ký (logs) cũ.

## 📁 Cấu trúc Thư mục

```text
backend/
├── config/             # Cấu hình hệ thống (DB, Cron, Redis, Google)
├── controllers/        # Xử lý yêu cầu và định dạng phản hồi
├── middlewares/        # Xác thực, header bảo mật, giới hạn tốc độ (rate limit)
├── models/             # Mongoose schemas và xác thực dữ liệu
├── routes/             # Định nghĩa các điểm cuối (endpoints) API
├── scripts/            # Các script bảo trì và tiện ích chạy một lần
├── services/           # Logic nghiệp vụ cốt lõi (Backup, Restore, Drive)
├── utils/              # Các hàm bổ trợ (Mã hóa, Email, Logger)
├── validators/         # Quy tắc xác thực đầu vào (express-validator)
├── server.js           # Điểm đầu vào (entry point) của ứng dụng
└── package.json        # Quản lý phụ thuộc và các câu lệnh thực thi
```

## 🔍 Phân tích Thành phần Chi tiết

### ⚙️ Thư mục `config/`
Tập trung các cài đặt phụ thuộc vào môi trường:
- `cron.js`: Thiết lập lịch trình cho các tác vụ tự động.
- `db.js`: Logic kết nối và cấu hình MongoDB.
- `google.js`: Cấu hình OAuth2 để tích hợp với Google Drive/Sheets.

### 🧠 Thư mục `services/`
Nơi chứa logic xử lý nghiệp vụ chính của ứng dụng:
- `backup.service.js`: Quản lý toàn bộ vòng đời của quy trình sao lưu.
- `restore.service.js`: Điều phối quy trình khôi phục dữ liệu qua nhiều giai đoạn.
- `drive.service.js`: Lớp giao tiếp (wrapper) cho các hoạt động với Google Drive API.

### 🎮 Thư mục `controllers/`
Chuyển đổi các yêu cầu HTTP thành các lệnh gọi dịch vụ tương ứng:
- `authController.js`: Quản lý xác thực JWT và quản lý phiên làm việc.
- `registrationController.js`: Xử lý logic đăng ký học viên (quy trình phức tạp).
- `restore.controller.js`: Cung cấp giao diện chức năng khôi phục cho trang quản trị.

### 🛠️ Thư mục `utils/`
Các hàm tiện ích không trạng thái (stateless):
- `encryptionUtils.js`: Quy trình mã hóa/giải mã AES-256 cho các bản sao lưu.
- `emailService.js`: Tích hợp Nodemailer để gửi thông báo tự động.
- `logger.js`: Sử dụng Winston để ghi nhật ký hệ thống trong môi trường production.

### 📊 Thư mục `models/`
Định nghĩa cấu trúc dữ liệu linh hoạt với Mongoose:
- `Course.js`, `Teacher.js`, `Registration.js`: Các thực thể dữ liệu cốt lõi.
- `AuditLog.js`: Nhật ký theo dõi các hành động quản trị nhạy cảm để phục vụ kiểm tra.

## 🔗 Liên kết
- [Tài liệu Kiến trúc Frontend](frontend.md)
- [Hướng dẫn Cài đặt & Triển khai](../../README.md)

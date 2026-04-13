---

# Tài liệu Kiến trúc Backend - Lớp học của Lucy (Bản dịch tiếng Việt)

## 🌐 Tổng quan Hệ thống
Backend của **Lucy's Class** là một ứng dụng Node.js/Express được thiết kế cho hiệu suất, bảo mật và độ tin cậy. Nó tuân theo kiến trúc phân lớp để tách biệt các trách nhiệm và đảm bảo tính bảo trì.

- **Tương tác Frontend**: Giao tiếp với React frontend thông qua API RESTful.
- **Cơ sở dữ liệu**: Sử dụng **MongoDB Atlas** làm cơ sở dữ liệu đám mây chính, được quản lý thông qua Mongoose.
- **Luồng API**: Request → `routes/` (Định tuyến) → `middlewares/` (Xác thực/Kiểm tra) → `controllers/` (Xử lý Yêu cầu/Phản hồi) → `services/` (Logic nghiệp vụ) → `models/` (Schema dữ liệu).
- **Bảo vệ dữ liệu**: Triển khai hệ thống sao lưu và khôi phục nhiều lớp với mã hoá đầu cuối.

---

## ✨ Các Tính năng Chính

### 📦 Hệ thống Sao lưu
Một luồng sao lưu tự động và mạnh mẽ:
1.  **Dumping**: Sử dụng `mongodump` để tạo các ảnh chụp (snapshots) cơ sở dữ liệu nhất quán.
2.  **Nén**: Đóng gói dữ liệu vào các tệp nén ZIP bằng `archiver`.
3.  **Mã hoá**: Mã hoá các tệp ZIP bằng **AES-256-CBC** trước khi truyền tải ra bên ngoài.
4.  **Lưu trữ đám mây**: Tải các bản sao lưu đã mã hoá lên **Google Drive** thông qua API Drive.
5.  **Xoay vòng**: Chỉ duy trì 20 bản sao lưu gần nhất trên Google Drive để quản lý hiệu quả dung lượng lưu trữ.

### 🛡️ Hệ thống Khôi phục
Được thiết kế cho sự an toàn và toàn vẹn dữ liệu:
1.  **Sao lưu an toàn**: Tự động tạo một ảnh chụp "an toàn" cục bộ trước khi bắt đầu bất kỳ hoạt động khôi phục nào.
2.  **Xác minh**: Giải mã và khôi phục dữ liệu vào một **cơ sở dữ liệu tạm thời** trước để xác minh tính toàn vẹn.
3.  **Khôi phục ghi đè**: Chỉ sau khi xác minh thành công, hệ thống mới thực hiện khôi phục với tham số `--drop` vào cơ sở dữ liệu chính.
4.  **Dọn dẹp**: Tự động xóa các tệp tạm thời và tệp đã giải mã sau khi hoàn thành.

### ⏰ Công việc Định kỳ (Cron Jobs)
Được quản lý bởi `node-cron` để tự động bảo trì:
-   **Sao lưu cơ sở dữ liệu**: Lập lịch sao lưu hàng ngày/hàng tuần với tính năng tự động tải lên Google Drive.
-   **Dọn dẹp tạm thời**: Định kỳ dọn dẹp các tệp khôi phục tạm thời đã hết hạn và nhật ký.

---

## 📁 Cấu trúc Thư mục

```text
backend/
├── config/             # Cấu hình hệ thống (DB, Cron, Redis, Google)
├── controllers/        # Xử lý yêu cầu và định dạng phản hồi
├── middlewares/        # Bảo vệ xác thực, header bảo mật, giới hạn tốc độ
├── models/             # Mongoose schemas và xác thực dữ liệu
├── routes/             # Định nghĩa các điểm cuối API
├── scripts/            # Các script bảo trì và tiện ích một lần
├── services/           # Logic nghiệp vụ cốt lõi (Sao lưu, Khôi phục, Drive)
├── utils/              # Các hàm bổ trợ (Mã hoá, Email, Logger)
├── validators/         # Quy tắc xác thực đầu vào (express-validator)
├── server.js           # Điểm đầu vào ứng dụng
└── package.json        # Các phụ thuộc và script chạy ứng dụng
```

---

## 🔍 Phân tích Thành phần Chi tiết

### `config/`
Tập trung các cài đặt phụ thuộc vào môi trường.
- `cron.js`: Định nghĩa lịch trình cho các tác vụ tự động.
- `db.js`: Logic kết nối MongoDB.
- `google.js`: Cấu hình OAuth2 để tích hợp Drive/Sheets.

### `services/`
Trái tim của logic ứng dụng.
- `backup.service.js`: Quản lý toàn bộ vòng đời sao lưu.
- `restore.service.js`: Điều phối quy trình khôi phục nhiều giai đoạn.
- `drive.service.js`: Lớp bao bọc cho các hoạt động của API Google Drive (tải lên, tải xuống, xoay vòng).

### `controllers/`
Chuyển đổi các yêu cầu HTTP thành các lệnh gọi dịch vụ.
- `authController.js`: Quản lý xác thực dựa trên JWT và phiên làm việc.
- `registrationController.js`: Xử lý logic đăng ký học sinh phức tạp.
- `restore.controller.js`: Lớp mỏng cung cấp chức năng khôi phục cho giao diện quản trị.

### `utils/`
Các hàm tiện ích không trạng thái (stateless).
- `encryptionUtils.js`: Các quy trình mã hoá/giải mã AES-256 cho các bản sao lưu.
- `emailService.js`: Tích hợp Nodemailer để gửi thông báo.
- `logger.js`: Nhật ký dựa trên Winston để giám sát môi trường sản xuất.

### `models/`
Định nghĩa cấu trúc dữ liệu bằng Mongoose.
- `Course.js`, `Teacher.js`, `Registration.js`: Các model thực thể cốt lõi.
- `AuditLog.js`: Theo dõi các hành động quản trị nhạy cảm.

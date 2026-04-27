# Security Audit

- Audit date: 2026-04-27
- Scope: `backend`, `frontend`, `docs`
- Method: static code review of FE/BE, route/middleware/controller/model flow review, config example review
- Basis used for config intent: `backend/.env.example`, `frontend/.env.example`
- Note: kết luận dưới đây dựa trên mã nguồn và cấu hình mẫu, không dựa trên secret vận hành thật

## 1. Kết luận nhanh

Mức bảo mật hiện tại của web: **Trung bình khá**.

Đánh giá thực tế:

- đủ dùng cho một hệ thống custom nội bộ/quy mô vừa, có ý thức bảo mật tốt hơn mặt bằng chung;
- chưa phải mức hardened cho môi trường nhiều người dùng, nhiều giáo viên phụ, hoặc yêu cầu bảo vệ dữ liệu nghiêm ngặt;
- **không thấy lỗ hổng Critical kiểu takeover admin không cần auth, RCE, hoặc public upload nguy hiểm** qua lần rà soát này;
- còn **2 nhóm cần ưu tiên xử lý**:
  - lộ dữ liệu nhiều hơn mức cần thiết cho role `teacher`;
  - dependency upload đang giữ `multer` 1.x đã có cảnh báo bảo mật upstream.

Điểm chấm nội bộ tham chiếu: **6.8/10**.

## 2. Phạm vi loại trừ theo mô tả hệ thống

Các điểm dưới đây **không tính là lỗ hổng** trong audit này vì đúng với chủ đích nghiệp vụ mà bạn mô tả:

### 2.1 Điểm danh 1 giáo viên chính + tối đa 4 giáo viên phụ

Hệ thống hiện tại cho phép giáo viên chính và giáo viên phụ cùng truy cập lớp nếu họ thực sự thuộc khóa đó:

- kiểm tra quyền nằm ở `backend/controllers/courseController.js:67`
- giới hạn tối đa 4 giáo viên phụ nằm ở `backend/controllers/courseController.js`

Kết luận:

- đây **không phải broken access control**;
- việc 5 giáo viên cùng xem cùng một lớp để điểm danh thay phiên là **đúng nghiệp vụ**;
- audit chỉ xem đây là accepted design, không ghi lỗi vì “giáo viên phụ xem được danh sách lớp”.

### 2.2 Streak cho phép check-in hộ

Bạn đã xác nhận đây là mini game marketing, có chủ đích “nới lỏng” để giữ user quay lại.

Kết luận:

- audit **không coi đây là lỗ hổng auth của hệ lõi**;
- nhưng vẫn ghi nhận đây là **bề mặt privacy/abuse** riêng của module streak.

### 2.3 Excel chỉ xuất, không có upload Excel

Theo mô tả hiện tại:

- hệ thống chủ yếu **export Excel**;
- không có role public upload file Excel vào server.

Kết luận:

- audit **không xếp rủi ro malware từ upload Excel** vào findings;
- phần Excel chỉ được đánh giá theo hướng lộ dữ liệu khi export và vệ sinh dữ liệu đầu ra.

## 3. Điểm mạnh đang có

Các lớp bảo vệ làm khá tốt:

- Auth dùng access token trong memory + refresh token qua `httpOnly` cookie:
  - `backend/controllers/authController.js:211`
  - `backend/controllers/authController.js:224`
  - `backend/controllers/authController.js:252`
- FE luôn gửi `X-Requested-With` và `withCredentials`:
  - `frontend/src/services/api.js:14`
  - `frontend/src/services/api.js:19`
- CSP, HSTS, CORS allowlist đã bật:
  - `backend/server.js:93`
  - `backend/server.js:116`
  - `backend/server.js:125`
- Upload ảnh có nhiều lớp lọc:
  - giới hạn MIME/type: `backend/middlewares/upload.js:9`
  - giới hạn kích thước: `backend/middlewares/upload.js:47`
  - chống pixel bomb + re-encode: `backend/middlewares/upload.js:83`
- Restore/backup đã có hardening khá tốt:
  - admin re-auth trước restore: `backend/controllers/restore.controller.js:93`
  - chặn chạy restore song song: `backend/services/restore.service.js:105`
  - log restore đã redact URI: `backend/services/restore.service.js:192`
  - restore không đè collection `admins`: `backend/services/restore.service.js:283`
- `.env` thật đang được ignore khỏi git, chỉ giữ `env.example`:
  - `.gitignore:5`
  - `.gitignore:6`
  - `.gitignore:7`
  - `git ls-files` hiện chỉ thấy `.env.example`

## 4. Findings còn tồn tại

### F1. Medium - Teacher đang thấy PII phụ huynh rộng hơn mức cần thiết

- Mức độ: `Medium`
- Nhóm ảnh hưởng: privacy / least privilege / data minimization
- File ảnh hưởng:
  - `backend/controllers/registrationController.js:430`
  - `backend/controllers/registrationController.js:448`
  - `backend/controllers/courseController.js:442`
  - `frontend/src/App.jsx`

Mô tả:

- API danh sách học sinh theo lớp cho teacher trả luôn `parentName`, `phone`, `email`.
- Giáo viên phụ cũng vào được lớp theo đúng nghiệp vụ, nên về mặt thực tế có tối đa 5 người thấy dữ liệu liên hệ phụ huynh của cùng một khóa.
- Export điểm danh theo lớp cho teacher cũng làm tăng bề mặt rò rỉ dữ liệu ra file tải xuống.

Vì sao đây là vấn đề:

- Điểm danh không nhất thiết cần full PII của phụ huynh.
- Quyền hiện tại đang đúng về “được vào lớp”, nhưng vẫn **quá rộng về dữ liệu nhìn thấy**.
- Rủi ro lớn nhất là lộ số điện thoại/email phụ huynh khi giáo viên phụ không thực sự cần dùng.

Hướng xử lý:

- Tách payload teacher-facing và admin-facing.
- Với teacher, mặc định chỉ trả:
  - `childName`
  - `childAge`
  - `isActive`
  - trạng thái điểm danh
- Chỉ mở `phone` hoặc `email` khi có use case rõ ràng.
- Nếu vẫn cần liên hệ phụ huynh, cân nhắc:
  - chỉ cho giáo viên chính xem full số;
  - giáo viên phụ xem số đã mask.

### F2. Medium - Backend vẫn đang dùng `multer` 1.x có cảnh báo bảo mật upstream

- Mức độ: `Medium`
- Nhóm ảnh hưởng: dependency risk / upload surface
- File ảnh hưởng:
  - `backend/package.json`
  - `backend/package-lock.json:3886`
  - các route dùng upload middleware:
    - `backend/routes/announcementRoutes.js`
    - `backend/routes/courseRoutes.js`
    - `backend/routes/feedbackRoutes.js`
    - `backend/routes/teacherRoutes.js`

Mô tả:

- `package-lock` ghi thẳng rằng `Multer 1.x is impacted by a number of vulnerabilities`.
- Dù hệ thống hiện đã bọc thêm nhiều lớp kiểm tra ở `backend/middlewares/upload.js`, rủi ro dependency vẫn còn vì lõi parser multipart vẫn là bản cũ.

Vì sao đây là vấn đề:

- Đây không phải lỗ hổng logic do bạn viết, mà là **technical security debt**.
- Upload hiện không public hoàn toàn, nhưng vẫn là bề mặt có thật cho admin/marketing.

Hướng xử lý:

- Ưu tiên nâng `multer` lên 2.x sau khi test lại toàn bộ upload flow.
- Nếu có thời gian refactor, cân nhắc chuyển sang parser multipart khác ổn định hơn.
- Sau nâng version, test lại:
  - upload ảnh course
  - upload ảnh teacher
  - upload feedback
  - upload announcement

### F3. Low - Module streak vẫn lộ trạng thái theo số điện thoại và dễ bị “xem/check hộ” ngoài ý muốn

- Mức độ: `Low`
- Nhóm ảnh hưởng: privacy / abuse surface
- File ảnh hưởng:
  - `backend/controllers/streakController.js:58`
  - `backend/controllers/streakController.js:169`
  - `backend/controllers/streakController.js:206`
  - `backend/controllers/streakController.js:294`
  - `frontend/src/services/streakService.js`
  - `frontend/src/components/FlameButton.jsx:328`
  - `frontend/src/components/FlameButton.jsx:405`

Mô tả:

- `streak/me`, `checkin`, `revive` đang chạy theo `phone`.
- FE còn lưu `streak_phone` ở `localStorage`.
- Ai biết số điện thoại đều có thể thử xem trạng thái streak hoặc thao tác hộ.

Đánh giá theo nghiệp vụ của bạn:

- đây là **accepted risk** vì module này cố ý nới lỏng để phục vụ marketing;
- không xem là lỗi auth của core system.

Vì sao vẫn cần ghi lại:

- vẫn là dữ liệu hành vi gắn với số điện thoại;
- nếu sau này gắn quà thật, voucher, ưu đãi hoặc reward có giá trị thì model hiện tại không đủ an toàn.

Hướng xử lý:

- Nếu streak tiếp tục chỉ là mini game: giữ nguyên nhưng ghi rõ đây là module low-trust.
- Giảm dữ liệu trả về ở `GET /api/streak/me` nếu không thật sự cần.
- Không mở rộng streak sang quyền lợi có giá trị nếu chưa thêm OTP hoặc signed challenge.

### F4. Low - CSP vẫn cho phép `'unsafe-inline'`, làm giảm giá trị phòng thủ khi có XSS ở nơi khác

- Mức độ: `Low`
- Nhóm ảnh hưởng: defense in depth
- File ảnh hưởng:
  - `backend/server.js:116`
  - `backend/server.js:120`

Mô tả:

- CSP đã có, nhưng `script-src` vẫn chứa `'unsafe-inline'`.
- Điều này không tạo lỗ hổng XSS mới, nhưng làm **giảm blast-radius** nếu một điểm XSS xuất hiện ở chỗ khác.

Hướng xử lý:

- Nếu không còn phụ thuộc inline script, chuyển sang nonce/hash CSP.
- Ít nhất nên rà lại recaptcha/script hiện tại để xem có thể bỏ `'unsafe-inline'` hay không.

### F5. Low - Frontend vẫn dùng `innerHTML` ở fallback render, hiện chưa nguy hiểm nhưng không nên giữ

- Mức độ: `Low`
- Nhóm ảnh hưởng: frontend hardening
- File ảnh hưởng:
  - `frontend/src/pages/AdminLogin.jsx:124`
  - `frontend/src/pages/ForgotPassword.jsx:138`
  - `frontend/src/pages/ResetPassword.jsx:125`

Mô tả:

- Các chỗ này đang chèn HTML bằng `innerHTML` khi ảnh logo lỗi.
- Hiện tại chuỗi chèn vào là hard-coded, nên **chưa phải XSS thực tế**.

Vì sao vẫn nên xử lý:

- đây là pattern xấu về mặt an toàn frontend;
- nếu sau này sửa thành chuỗi động hoặc nối thêm dữ liệu ngoài ý muốn, nó sẽ thành sink XSS.

Hướng xử lý:

- thay `innerHTML` bằng state/JSX fallback bình thường;
- tránh duy trì pattern DOM mutation thủ công trong code React.

## 5. Điểm đã rà nhưng không coi là lỗi

### 5.1 Attendance shared giữa giáo viên chính/phụ

Kết luận:

- đúng nghiệp vụ;
- access control hiện tại phù hợp;
- không ghi lỗi vì giáo viên phụ được điểm danh/xem lớp của khóa mình.

Lưu ý:

- cơ chế hiện tại là chia sẻ cùng một bản ghi attendance;
- đây là quyết định nghiệp vụ chấp nhận được với mô hình vận hành bạn mô tả.

### 5.2 Backup/restore

Sau rà soát hiện tại:

- restore yêu cầu admin auth;
- có re-auth bằng mật khẩu trước thao tác phá hủy;
- có limit thao tác nặng;
- có lock chống restore song song;
- log restore đã redact URI.

Kết luận:

- đây là khu vực nhạy cảm nhưng hiện tại đã được harden ở mức khá tốt;
- chưa ghi finding mới tại thời điểm audit này.

### 5.3 Repo secrets

Ở mức repo:

- `.env` và `.env.*` đang bị ignore khỏi git;
- `git ls-files` hiện chỉ thấy `.env.example`.

Kết luận:

- về mặt git tracking, repo đang theo hướng an toàn;
- vẫn cần giữ kỷ luật không commit nhầm secret thật về sau.

## 6. Thứ tự ưu tiên xử lý

1. Giảm dữ liệu PII teacher nhìn thấy ở danh sách học sinh và export attendance.
2. Nâng `multer` khỏi 1.x và test lại toàn bộ luồng upload.
3. Thu gọn dữ liệu public của streak nếu muốn giảm bề mặt privacy.
4. Siết CSP để bỏ `'unsafe-inline'` nếu khả thi.
5. Dọn toàn bộ `innerHTML` fallback khỏi frontend React.

## 7. Đánh giá cuối cùng

Hệ thống của bạn **không yếu theo kiểu “vỡ từ gốc”**. Nền tảng auth, CSRF, upload ảnh, backup/restore và tách role đang làm tương đối ổn cho một web custom nội bộ.

Điểm còn thiếu chủ yếu nằm ở:

- nguyên tắc least privilege cho giáo viên;
- nợ bảo mật dependency;
- hardening/privacy ở các module phụ như streak và frontend fallback.

Nếu xử lý xong `F1` và `F2`, mức an toàn thực tế của hệ thống sẽ tăng rõ rệt và phù hợp hơn để vận hành lâu dài.

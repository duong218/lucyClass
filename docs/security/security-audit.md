Security Audit - LucyClass

Ngày audit: 2026-05-06
Phạm vi: `backend/`, `frontend/`
Mục tiêu: rà soát bảo mật ứng dụng theo code hiện tại, ưu tiên auth, phân quyền, session, CSRF/CORS, dữ liệu nội bộ và các luồng vận hành nhạy cảm.

## 1. Phương pháp và giới hạn

Đã đọc trực tiếp các nhóm mã sau:
- `backend/server.js`
- `backend/controllers/authController.js`
- `backend/controllers/salaryController.js`
- `backend/controllers/announcementController.js`
- `backend/controllers/restore.controller.js`
- `backend/services/backup.service.js`
- `backend/services/restore.service.js`
- `backend/middlewares/auth.js`
- `backend/middlewares/securityMiddleware.js`
- `backend/middlewares/rateLimiter.js`
- các route chính trong `backend/routes/`
- `frontend/src/services/api.js`
- `docs/security/security-audit.md`

Chỉ đọc file cấu hình mẫu:
- `backend/.env.example`
- `frontend/.env.example`

Không đọc:
- `backend/.env`
- `frontend/.env`
- mọi file `env*` thật
- key, secret, token, backup thật

Đây là audit tĩnh theo source code hiện có. Kết luận dưới đây không dựa vào giả định “hệ thống đang cấu hình đúng”, mà dựa vào hành vi thực tế của code.

## 2. Kết luận nhanh

Điểm bảo mật hiện tại mình chấm: **7.5 / 10**

Đánh giá tổng quan:
- Nền tảng bảo mật cơ bản khá tốt: có rate limit, reCAPTCHA, refresh token qua httpOnly cookie, check upload tương đối chặt, restore flow có guard tốt.
- Tuy nhiên hiện vẫn còn một lỗi phân quyền nghiệp vụ đáng kể và một số điểm “thiết kế nói một đằng, code chạy một nẻo”.
- Vì vậy, kết luận cũ kiểu “9.5/10, chỉ còn CSP low” không còn đúng với codebase hiện tại.

Mức ưu tiên xử lý:
- Cao: 1
- Trung bình: 2
- Thấp: 3

## 3. Điểm mạnh đang có

### 3.1 Auth và chống brute-force
- Login có reCAPTCHA server-side và ngưỡng cao hơn cho luồng nhạy cảm.
- Có `loginLimiter`, `forgotPasswordLimiter`, `resetPasswordLimiter`.
- Có cơ chế block IP khi đăng nhập sai nhiều lần.

### 3.2 Token và session
- Access token đi qua header bearer, không thấy lưu vào `localStorage`.
- Refresh token dùng cookie `httpOnly`.
- Có cơ chế `activeSessionId` để kiểm soát phiên.

### 3.3 Upload ảnh
- Dùng `multer` memory storage.
- Kiểm tra magic number.
- Re-encode ảnh bằng `sharp`.
- Có chặn pixel bomb cơ bản.

### 3.4 Restore / backup
- Luồng restore yêu cầu admin, confirm tay, nhập lại mật khẩu, có audit log.
- Restore service có kiểm tra zip-slip khi giải nén.
- Dùng `spawn` cho `mongodump` / `mongorestore`, tránh shell injection kiểu nối chuỗi thô.

## 4. Findings chi tiết

### F1. High - Hở phân quyền theo đối tượng ở endpoint giáo viên theo ô thời khóa biểu

Mức độ: High

Ảnh hưởng:
- Giáo viên có thể truy vấn thông tin giáo viên khác và thông tin lớp của ô thời khóa biểu không thuộc phạm vi mình phụ trách.
- Dữ liệu lộ ra gồm:
  - `teacherId` được populate với `displayName`, `username`, `role`
  - `courseId` được populate với `name`, `currentStudents`
- Đây là đúng nhóm dữ liệu nội bộ mà policy nội bộ cần chặn: phân công giáo viên, sĩ số lớp, dữ liệu vận hành lớp học.

Bằng chứng:
- Route cho phép cả `admin` và `teacher`:
  - `backend/routes/salaryRoutes.js:21`
- Controller không kiểm tra ownership hay phạm vi lớp:
  - `backend/controllers/salaryController.js:322`
  - `backend/controllers/salaryController.js:325`
  - `backend/controllers/salaryController.js:326`
  - `backend/controllers/salaryController.js:327`

Phân tích:
- `GET /api/salary/session-teachers/:cellId` hiện chỉ cần role `teacher`.
- Sau đó controller chạy `SessionTeacher.find({ sessionId: cellId })` và trả dữ liệu luôn.
- Không có bước xác minh:
  - `cellId` này có thuộc lớp giáo viên đang phụ trách không
  - giáo viên có được phép xem ô này không
  - dữ liệu course/teacher trả về có cần che bớt không

Đánh giá:
- Đây là lỗi authorization thật, không phải chỉ là “route chưa đẹp”.
- Nếu `cellId` lộ qua frontend, network tab hoặc API khác, việc khai thác là thực tế.

Khuyến nghị:
- Chỉ cho `admin` dùng endpoint này nếu frontend teacher không thật sự cần.
- Nếu teacher cần dùng:
  - kiểm tra `cellId` phải thuộc một lớp mà teacher đang phụ trách
  - chỉ trả dữ liệu tối thiểu cần thiết
  - không populate các trường không cần như `currentStudents` nếu teacher không cần biết

### F2. Medium - Cơ chế single-session chưa chặn được access token replay ngoài trình duyệt

Mức độ: Medium

Ảnh hưởng:
- Nếu `accessToken` bị lộ, attacker có thể gọi API bằng script/Postman mà không gửi cookie `sessionId`.
- Middleware auth hiện chỉ chặn khi có `sessionId` cookie và cookie đó lệch với `activeSessionId`.
- Kết quả là claim “mỗi lần login sẽ văng thiết bị cũ 100%” không đúng hoàn toàn.

Bằng chứng:
- Điều kiện check phụ thuộc cookie:
  - `backend/middlewares/auth.js:65`
  - `backend/middlewares/auth.js:67`
  - `backend/middlewares/auth.js:68`
  - `backend/middlewares/auth.js:69`
- Claim cũ trong tài liệu:
  - `docs/security/security-audit.md` bản trước đã khẳng định “single-session bảo vệ 100%”

Phân tích:
- Nếu request có bearer token hợp lệ nhưng không kèm `req.cookies.sessionId`, nhánh conflict check không chạy.
- Điều đó không phá toàn bộ auth, nhưng làm suy yếu lớp chống session hijack.

Khuyến nghị:
- Gắn `sessionId` hoặc `sessionVersion` vào access token và verify ở mọi request.
- Hoặc bắt buộc access token chỉ hợp lệ khi đi kèm cookie phiên tương ứng.
- Nếu vẫn giữ mô hình hiện tại, không nên tuyên bố “100%”.

### F3. Medium - CORS và CSRF đang dùng hai nguồn cấu hình origin khác nhau

Mức độ: Medium

Ảnh hưởng:
- CORS ở server cho phép origin từ:
  - `CORS_ORIGINS`
  - hoặc `CLIENT_URL`
  - hoặc `FRONTEND_URL`
- Nhưng CSRF middleware chỉ đọc `CORS_ORIGINS`.
- Kịch bản xấu nhất: production chỉ set `CLIENT_URL` hoặc `FRONTEND_URL`, khi đó:
  - CORS vẫn cho qua
  - request ghi dữ liệu lại bị CSRF chặn
- Đây là kiểu lệch cấu hình rất dễ dẫn đến việc “tạm tắt CSRF cho chạy trước”.

Bằng chứng:
- `backend/server.js:92`
- `backend/server.js:93`
- `backend/server.js:102`
- `backend/middlewares/securityMiddleware.js:32`
- `backend/middlewares/securityMiddleware.js:33`
- `backend/middlewares/securityMiddleware.js:41`

Phân tích:
- Đây không phải lỗ hổng đọc trộm dữ liệu trực tiếp.
- Nhưng đây là vấn đề thiết kế bảo mật không nhất quán giữa lớp CORS và lớp CSRF.
- Những lỗi kiểu này rất hay dẫn tới “sửa nóng bằng cách nới bảo mật”.

Khuyến nghị:
- Tạo một hàm parse origin dùng chung cho cả CORS và CSRF.
- Chỉ có một source of truth cho allowed origins.
- Nên fail-fast khi danh sách origin rỗng ở production.

### F4. Low - Staff thường vẫn biết số lượng announcement đang chờ duyệt

Mức độ: Low

Ảnh hưởng:
- `GET /api/announcements/latest` chỉ cần `auth`.
- Response trả cả `pendingCount`.
- Điều này làm teacher/marketing biết được trạng thái moderation nội bộ dù không có quyền duyệt.

Bằng chứng:
- Route:
  - `backend/routes/announcementRoutes.js:17`
- Controller:
  - `backend/controllers/announcementController.js:35`
  - `backend/controllers/announcementController.js:47`
  - `backend/controllers/announcementController.js:48`
  - `backend/controllers/announcementController.js:50`

Khuyến nghị:
- Chỉ trả `pendingCount` cho admin.
- Hoặc bỏ hẳn trường này khỏi endpoint `/latest`.

### F5. Low - Hardcode Google Drive folder ID trong backup service

Mức độ: Low

Ảnh hưởng:
- Source đang fallback sang một `GOOGLE_DRIVE_FOLDER_ID` cố định nếu env không có.
- Đây là internal integration identifier không nên hardcode trong codebase.
- Ngoài vấn đề lộ định danh, còn có rủi ro backup bị đẩy sang sai thư mục nếu deployment cấu hình thiếu.

Bằng chứng:
- `backend/services/backup.service.js:66`
- `backend/services/backup.service.js:114`

Khuyến nghị:
- Bỏ fallback hardcoded.
- Production phải fail-fast nếu thiếu `GOOGLE_DRIVE_FOLDER_ID`.

### F6. Low - CSP vẫn còn `unsafe-inline` trong `script-src`

Mức độ: Low

Ảnh hưởng:
- `script-src` hiện vẫn chứa `'unsafe-inline'`.
- Điều này làm giảm độ chặt của CSP nếu sau này frontend phát sinh XSS ở nơi khác.

Bằng chứng:
- `backend/server.js:116`
- `backend/server.js:120`

Đánh giá:
- Đây vẫn là accepted risk có thể hiểu được nếu đang phải tương thích với reCAPTCHA.
- Tuy nhiên không thể coi đây là finding duy nhất như kết luận audit cũ.

Khuyến nghị:
- Nếu muốn siết thêm, chuyển dần sang nonce-based CSP cho script được inject.

## 5. Những điểm không thấy lộ hổng rõ trong phạm vi đã đọc

Trong phạm vi source đã kiểm tra, mình chưa thấy bằng chứng rõ của:
- RCE trực tiếp qua upload hoặc restore
- SQLi/NoSQLi rõ ràng kiểu concat query thô
- đọc secret trực tiếp từ frontend
- public route lộ bảng lương hoặc danh sách phụ huynh/học viên hàng loạt

Lưu ý:
- “Không thấy trong mẫu kiểm tra” không đồng nghĩa “chứng minh tuyệt đối là không có”.
- Để kết luận mạnh hơn cần thêm dynamic testing và review sâu hơn từng module business.

## 6. So sánh với bản audit trước

Bản trước đánh giá `9.5/10` và kết luận gần như chỉ còn CSP low. Kết luận đó hiện không còn phù hợp vì:
- đã bỏ sót lỗi authorization ở `salary/session-teachers`
- đã đánh giá quá mạnh cơ chế single-session
- chưa chỉ ra sự lệch cấu hình giữa CORS và CSRF
- chưa coi `pending announcement state` là internal data leak

Do đó, nếu tài liệu này dùng làm tài liệu bàn giao hoặc cam kết chất lượng, nên lấy bản hiện tại làm mốc mới.

## 7. Thứ tự ưu tiên sửa

### Ưu tiên 1 - Sửa ngay
- Vá `GET /api/salary/session-teachers/:cellId`
- Quyết định rõ teacher có được xem endpoint này hay không

### Ưu tiên 2 - Sửa trong cùng đợt auth/security
- Buộc ràng buộc access token với session state thật sự
- Gom CORS và CSRF về chung một nguồn cấu hình origin

### Ưu tiên 3 - Dọn nợ bảo mật
- Ẩn `pendingCount` khỏi staff thường
- Bỏ hardcoded Drive folder ID
- Lập kế hoạch giảm dần `unsafe-inline` trong CSP

## 8. Kết luận cuối

Hệ thống hiện có nền tảng bảo mật khá hơn mức trung bình và không có dấu hiệu “vỡ trận” ở các lớp cơ bản. Tuy nhiên, hệ thống **chưa ở mức có thể tự tin gọi là 9.5/10** vì vẫn còn:
- 1 lỗi phân quyền nghiệp vụ đáng kể
- 2 điểm trung bình làm suy yếu các cam kết bảo mật hiện tại
- 3 điểm rò rỉ/thiết kế yếu ở mức thấp

Điểm tổng hợp hợp lý ở thời điểm audit này: **7.5 / 10**

Nếu vá xong `F1`, `F2`, `F3`, mình đánh giá hệ thống có thể tăng lên khoảng **8.7 - 9.0 / 10** mà không cần thay đổi kiến trúc quá lớn.

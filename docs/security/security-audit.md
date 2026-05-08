# Security Audit - LucyClass

Ngày audit: 2026-05-07
Phạm vi: `backend/`, `frontend/`
Phương pháp: static review theo source code hiện có, không pentest động

## 1. Nguyên tắc audit và giới hạn

Phần đánh giá này tập trung vào:
- Auth, session, refresh token, phân quyền.
- Bề mặt public API, chống lạm dụng, CORS/CSRF.
- Luồng điểm danh, học viên, thông báo, chat AI, backup/restore.
- Frontend storage, route guard, cách gọi API, rò rỉ dữ liệu hiển thị.

Phần cấu hình chỉ dùng để hiểu shape hệ thống từ:
- `backend/.env.example`
- `frontend/.env.example`

Không dùng giá trị secret thật để kết luận và không trích dẫn secret thật vào tài liệu này.

## 2. Loại trừ theo mô tả hệ thống

Các điểm dưới đây được xem là chủ đề nghiệp vụ đã chủ động chấp nhận, không tính là lỗ hổng trọng điểm:

### 2.1 Điểm danh học sinh theo khóa học

Theo mô tả hệ thống:
- Mỗi khóa có 1 giáo viên chính và tối đa 15 giáo viên phụ.
- Mọi giáo viên thuộc cùng khóa đều được phép xem danh sách lớp và điểm danh thay nhau.
- Dữ liệu điểm danh được đồng bộ giữa các giáo viên của cùng khóa sau khi lưu.

Đối chiếu code:
- Backend đã khóa quyền theo giáo viên chính hoặc giáo viên phụ của khóa ở `backend/controllers/courseController.js`.
- Khi teacher lấy danh sách học viên, API đã tự ẩn `phone` và `email` ở `backend/controllers/registrationController.js`.
- Khi teacher xuất Excel điểm danh, số điện thoại cũng bị che ở `backend/controllers/courseController.js`.

Kết luận:
- Đây là behavior phù hợp với yêu cầu khách hàng, không phải authorization bypass.
- Riêng endpoint `GET /api/salary/session-teachers/:cellId` hiện chỉ cho teacher xem session mà chính mình được gán trong session đó. Đây là hạn chế vận hành, không phải lỗ hổng rò rỉ quyền.

### 2.2 Streak mini game

Theo mô tả hệ thống:
- Streak là mini game marketing, có chủ đích nới lỏng.
- Có cho checkin hộ để tăng retention.

Đối chiếu code:
- API streak hiện dùng số điện thoại làm định danh chính.
- API công khai trả về tên, số điện thoại và trạng thái streak tương ứng số đó.
- Có limiter theo IP, device và số điện thoại, nhưng không có OTP hay xác minh danh tính thật.

Kết luận:
- Đây là accepted risk theo thiết kế sản phẩm hiện tại.
- Không chấm là lỗi auth/business logic trong điểm số tổng.

### 2.3 Excel

Theo mô tả hệ thống:
- Hệ thống chủ yếu export file.
- Không có role business thông thường được upload Excel vào hệ thống.

Kết luận:
- Bề mặt tấn công từ file upload dạng Excel là rất thấp.
- Audit vẫn kiểm tra upload ảnh và luồng backup/restore vì đây mới là file input thực tế trong hệ thống.

## 3. Kết luận nhanh

Điểm bảo mật hiện tại: **8.8 / 10** (Tăng từ 8.6)

Nhận xét tổng quan:
- Hệ thống đã có những cải tiến đáng kể: Lỗ hổng `F4` (rò rỉ pendingCount) đã được vá triệt để bằng cách kiểm tra quyền Admin. Bề mặt AI Proxy (`F2`) đã được vá hoàn toàn với cả rate limiter chuyên dụng (10 req/min/IP) và reCAPTCHA v3 để chặn bot tự động. Sự bất đồng nhất cấu hình CORS/CSRF (`F1`) cũng đã được xử lý triệt để.
- Nền tảng bảo mật cơ bản vẫn rất tốt: JWT + refresh cookie, session conflict, least privilege cho teacher, upload ảnh có magic-number + sharp re-encode.
- Luồng Restore là một trong những phần được làm kỹ nhất với 4 lớp bảo vệ (Admin role, Explicit string confirm, Password re-auth, 4s Security delay).
- Các điểm yếu còn tồn tại: dependency cũ (`multer` 1.x), CSP `unsafe-inline`, các cấu hình hardcode phụ.

Phân loại hiện tại:
- Medium: 1 (F3)
- Low: 4 (F5, F6, F7, F8)

## 4. Điểm mạnh đang có

### 4.1 Session và auth đã được siết tốt hơn trước
- Access token có mang `sid`.
- Backend bắt buộc `sessionId` cookie khớp với `sid`.
- Frontend chỉ giữ `accessToken` in-memory.

### 4.2 Teacher access least privilege
- Ẩn `phone`, `email` ở API học viên cho role `teacher`.
- Che số điện thoại trong Excel điểm danh.
- Ràng buộc quyền truy cập theo danh sách giáo viên được gán cho khóa học.

### 4.3 Upload ảnh đa lớp bảo vệ
- `multer.memoryStorage()` + file size limit.
- Magic number check (`file-type`).
- Re-encode (`sharp`), strip metadata, pixel bomb protection.

### 4.4 Luồng Restore (Gold Standard cho module này)
- 4 lớp Guard: Role check -> String confirm ('CONFIRM') -> Password re-auth -> 4s Delay.
- Validation run trong Temp DB trước khi ghi đè DB chính.
- Zip Slip protection.
- Cache flush tự động sau restore.

## 5. Findings chi tiết

### F1. SOLVED - CORS và CSRF đang dùng hai nguồn cấu hình origin khác nhau (FULLY IMPROVED)
- **Kết quả**: Đã tạo module `backend/config/allowedOrigins.js` làm "Single Source of Truth" cho cả `cors` middleware và `verifyCSRF`.
- **Đánh giá**: Ngăn chặn hoàn toàn nguy cơ lệch cấu hình dẫn đến bypass CSRF bảo vệ.

### F2. SOLVED - Public AI proxy (FULLY IMPROVED)
- **Kết quả**: Đã thêm `aiProxyLimiter` (10 req/phút/IP) và `verifyRecaptcha('chat')` vào endpoint `/api/chat-config/ask`.
- **Đánh giá**: Hoàn toàn ngăn chặn nguy cơ lạm dụng tự động và flood quota Groq.

### F3. Medium - Dependency upload vẫn dùng Multer 1.x (STILL PRESENT)
- **Mô tả**: `multer` 1.4.5-lts.1 có các cảnh báo bảo mật về parser multipart.
- **Hướng xử lý**: Nâng lên `multer` 2.x.

### F4. SOLVED - `pendingCount` của thông báo lộ cho staff
- **Kết quả**: Đã vá. Controller `getLatest` trong `announcementController.js` hiện chỉ trả `pendingCount` cho user có role `admin`.

### F5. Low - Hardcoded fallback Google Drive folder ID (STILL PRESENT)
- **File**: `backend/services/backup.service.js`
- **Mô tả**: Có fallback cứng ID folder Drive nếu thiếu env.
- **Rủi ro**: Rò rỉ ID tích hợp nội bộ vào codebase và rủi ro backup nhầm chỗ.

### F6. Low - CSP vẫn giữ `unsafe-inline` cho script (STILL PRESENT)
- **File**: `backend/server.js`
- **Mô tả**: CSP cho phép `'unsafe-inline'` để tương thích với reCAPTCHA và legacy scripts.
- **Rủi ro**: Giảm hiệu quả của CSP trong việc ngăn chặn XSS.

### F7. Low - Redundant Bcrypt Libraries (NEW)
- **File**: `backend/package.json`
- **Mô tả**: Cài đặt cả `bcrypt` (native) và `bcryptjs` (pure JS).
- **Rủi ro**: Gây nhầm lẫn trong phát triển và bảo trì. Nên thống nhất dùng một thư viện.

### F8. Low - Unmaintained Dependency: xss-clean (NEW)
- **File**: `backend/package.json`
- **Mô tả**: Thư viện `xss-clean` đã ngưng bảo trì từ lâu.
- **Rủi ro**: Không được vá các lỗ hổng parser mới.
- **Hướng xử lý**: Chuyển hẳn sang dùng `sanitize-html` (đã có sẵn trong project) hoặc các giải pháp middleware hiện đại hơn như `dompurify`.

## 6. Mức độ hoàn thiện theo từng lớp

- **Auth và session**: Tốt (9/10) - Đã có session conflict check và in-memory token.
- **Authorization nghiệp vụ**: Khá tốt (8.5/10) - Đã vá rò rỉ `pendingCount`, PII teacher được bảo vệ.
- **Public API abuse resistance**: Tốt (8.5/10) - Đã bảo vệ bằng rate limit và CAPTCHA cho Submit và AI Proxy.
- **File handling**: Khá (8/10) - Logic xử lý ảnh rất tốt, cần nâng version dependency.
- **Restore flow**: Tuyệt vời (9.5/10) - Thiết kế rất an toàn.

## 7. Thứ tự ưu tiên sửa

### Ưu tiên 1 - Nên làm sớm
- Nâng `multer` 1.x lên 2.x.

### Ưu tiên 2 - Dọn nợ bảo mật
- Thống nhất dùng 1 thư viện bcrypt (khuyên dùng `bcrypt` native).
- Thay thế `xss-clean` bằng `sanitize-html` cho toàn bộ input.
- Bỏ hardcoded Drive folder ID.
- Lập kế hoạch dùng nonce-based CSP để bỏ `unsafe-inline`.

## 8. Kết luận cuối

Hệ thống LucyClass đang ở trạng thái bảo mật **khá tốt (8.8/10)**. Việc vá lỗ hổng rò rỉ metadata (`F4`), siết chặt bảo vệ AI Proxy (`F2`) bằng rate limiter lẫn reCAPTCHA, và hợp nhất cấu hình CORS/CSRF (`F1`) cho thấy sự quan tâm đúng mức đến hardening.

Điểm sáng nhất của hệ thống là luồng **Restore** và **Upload ảnh** - cả hai đều được thiết kế với tư duy "defense in depth" (phòng thủ chiều sâu) rất rõ ràng.

Nếu xử lý nốt điểm Medium (`F3` - Multer), hệ thống hoàn toàn có thể đạt mức **9.0 / 10**.

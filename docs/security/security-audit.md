# Security Audit - LucyClass

Ngày audit: 2026-05-06
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

Các điểm dưới đây được xem là chu de nghiep vu da chu dong chap nhan, khong tinh la lo hong trong diem so:

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
- Nếu sau này muốn siết bảo mật, phải đổi kiến trúc streak sang mô hình xác minh sở hữu số điện thoại hoặc user account thật.

### 2.3 Excel

Theo mô tả hệ thống:
- Hệ thống chủ yếu export file.
- Không có role business thông thường được upload Excel vào hệ thống.

Kết luận:
- Bề mặt tấn công từ file upload dạng Excel là rất thấp.
- Audit vẫn kiểm tra upload ảnh và luồng backup/restore vì đây mới là file input thực tế trong hệ thống.

## 3. Kết luận nhanh

Điểm bảo mật hiện tại: **8.2 / 10**

Nhận xét tổng quan:
- Nền tảng bảo mật cơ bản của hệ thống đang tốt hơn mức trung bình: JWT + refresh cookie, session conflict, phân quyền teacher theo khóa, reCAPTCHA, limiter, upload ảnh có magic-number + re-encode, restore có guard khá chặt.
- Các false positive lớn của bản audit cũ về teacher attendance và session replay toàn phần hiện không còn đúng với code hiện tại.
- Tuy nhiên hệ thống vẫn còn một số điểm cần vá, chủ yếu nằm ở bề mặt public API, tính nhất quán giữa CORS và CSRF, dependency upload cũ, và vài rò rỉ vận hành mức thấp.

Phân loại hiện tại:
- Medium: 3
- Low: 3

## 4. Điểm mạnh đang có

### 4.1 Session và auth đã được siết tốt hơn trước

Điểm tốt:
- Access token có mang `sid` tại `backend/controllers/authController.js`.
- Backend bắt buộc request hợp lệ phải đi kèm `sessionId` cookie nếu tài khoản đang có phiên hoạt động tại `backend/middlewares/auth.js`.
- Khi `activeSessionId` lệch cookie hoặc lệch `sid`, backend trả `SESSION_CONFLICT`.
- Frontend chỉ giữ `accessToken` trong memory, không lưu vào `localStorage`, tại `frontend/src/services/api.js`.

Ý nghĩa:
- Lỗi access token replay đã được siết tốt hơn nhiều so với bản audit cũ.
- Kẻ tấn công không thể chỉ dùng access token đơn lẻ theo cách cũ nếu thiếu session cookie hợp lệ.

### 4.2 Teacher access ở module học viên và điểm danh đang đi đúng hướng least privilege

Điểm tốt:
- `checkCourseAccess()` trong `backend/controllers/courseController.js` chỉ cho teacher thuộc khóa truy cập.
- `backend/controllers/registrationController.js` ẩn `phone` và `email` khỏi teacher khi lấy danh sách học viên.
- `backend/controllers/courseController.js` che số điện thoại khi teacher export Excel điểm danh.

Ý nghĩa:
- Flow "giáo viên chính/phụ cùng khóa điểm danh thay nhau" đang được giữ, nhưng PII đã được giảm bớt.

### 4.3 Upload ảnh có nhiều lớp kiểm tra hữu ích

Điểm tốt:
- `multer.memoryStorage()`, giới hạn file size và số field ở `backend/middlewares/upload.js`.
- Kiểm tra magic number bằng `file-type`.
- Re-encode qua `sharp`, strip metadata, chặn pixel bomb bằng `limitInputPixels`.

Ý nghĩa:
- Đây là lớp phòng thủ thực dụng và tốt hơn rất nhiều so với upload chỉ kiểm tra extension.

### 4.4 Luồng restore có guard tương đối nghiêm túc

Điểm tốt:
- Restore chỉ cho admin.
- Có xác nhận lại mật khẩu trong controller restore.
- Có chặn zip slip ở `backend/services/restore.service.js`.
- Có restore thử vào temp DB trước khi `--drop` DB chính.
- Có flush Redis cache sau restore.

Ý nghĩa:
- Đây là một trong các phần được làm cẩn thận nhất của backend.

## 5. Findings chi tiết

### F1. Medium - CORS và CSRF đang dùng hai nguồn cấu hình origin khác nhau

Mức độ: Medium

File ảnh hưởng:
- `backend/server.js`
- `backend/middlewares/securityMiddleware.js`

Mô tả:
- CORS ở `backend/server.js` nhận origin từ chuỗi ưu tiên:
  - `CORS_ORIGINS`
  - hoặc `CLIENT_URL`
  - hoặc `FRONTEND_URL`
- Nhưng CSRF layer ở `backend/middlewares/securityMiddleware.js` chỉ đọc `CORS_ORIGINS`.

Rủi ro:
- Nếu production chỉ set `CLIENT_URL` hoặc `FRONTEND_URL` mà không set `CORS_ORIGINS`, hệ thống có thể rơi vào trạng thái:
  - CORS cho qua.
  - Request ghi dữ liệu lại bị CSRF chặn.
- Kiểu lệch này rất dễ dẫn đến hotfix kiểu "tạm nới CSRF cho chạy trước", làm giảm bảo mật thực tế.

Bằng chứng:
- `backend/server.js:93`
- `backend/middlewares/securityMiddleware.js:32-41`

Hướng xử lý:
- Tạo một hàm parse origin dùng chung cho cả CORS lẫn CSRF.
- Chỉ giữ một source of truth cho danh sách origin được phép.
- Trong production, fail-fast nếu danh sách origin hợp lệ bị rỗng.

### F2. Medium - Public AI proxy có thể bị lạm dụng để đốt quota Groq

Mức độ: Medium

File ảnh hưởng:
- `backend/routes/chatConfigRoutes.js`
- `backend/controllers/chatConfigController.js`
- `backend/middlewares/rateLimiter.js`
- `backend/middlewares/securityMiddleware.js`

Mô tả:
- Endpoint `POST /api/chat-config/ask` là public.
- Route chỉ gắn `publicLimiter` chung, không có auth, không có captcha, không có rate limit riêng cho AI proxy.
- Backend nhận lịch sử chat rồi gọi thẳng Groq bằng API key server-side.

Rủi ro:
- Bất kỳ ai cũng có thể dùng endpoint này như một relay AI công khai.
- `Origin` + `X-Requested-With` chỉ có giá trị chặn trình duyệt cross-site, không phải cơ chế trust thật với client script/server-to-server.
- Kết quả xấu nhất là:
  - Tốn quota Groq.
  - Tăng chi phí.
  - Gây degradation dịch vụ cho người dùng thật.

Bằng chứng:
- `backend/routes/chatConfigRoutes.js:16`
- `backend/controllers/chatConfigController.js:114-175`
- `backend/server.js` đang áp limiter API chung nhưng chưa có limiter chuyên cho AI proxy.

Đánh giá thực tế:
- Đây là rủi ro availability/cost abuse, không phải data breach trực tiếp.
- Vì có safety layer nội dung, rủi ro lộ dữ liệu thấp hơn rủi ro bị lạm dụng tài nguyên.

Hướng xử lý:
- Tạo limiter riêng cho `/api/chat-config/ask`, chặt hơn nhiều so với `publicLimiter`.
- Thêm CAPTCHA cho chat public hoặc token widget ngắn hạn do backend phát.
- Cân nhắc chỉ cho chat widget gọi qua signed request hoặc nonce do backend cấp.
- Bổ sung logging theo IP, UA, volume và circuit breaker khi Groq lỗi/rate limit tăng đột biến.

### F3. Medium - Dependency upload vẫn dùng Multer 1.x đã bị upstream cảnh báo có lỗ hổng

Mức độ: Medium

File ảnh hưởng:
- `backend/package.json`
- `backend/package-lock.json`
- `backend/middlewares/upload.js`

Mô tả:
- Backend đang dùng `multer` 1.x.
- Chính `package-lock` ghi rõ nhánh 1.x bị ảnh hưởng bởi nhiều lỗ hổng đã được vá ở 2.x.

Rủi ro:
- Ứng dụng hiện đã có nhiều lớp tự vệ ở tầng app, nên exploitability giảm.
- Tuy vậy parser multipart là lớp đầu vào rất gần network boundary; dependency cũ ở đây không nên để kéo dài.

Bằng chứng:
- `backend/package.json:33`
- `backend/package-lock.json:3862`
- Upload hiện đang dùng trực tiếp `multer` ở `backend/middlewares/upload.js:1-45`

Đánh giá thực tế:
- Không nên chấm High vì:
  - Upload route chủ yếu là admin/marketing.
  - App có giới hạn size, magic number, re-encode ảnh.
- Nhưng vẫn đủ để chấm Medium do đây là dependency nằm ngay bề mặt upload.

Hướng xử lý:
- Lên kế hoạch nâng lên `multer` 2.x.
- Re-test toàn bộ các route upload ảnh sau khi nâng.
- Giữ nguyên các lớp kiểm tra magic number và `sharp`, không bỏ vì nâng version dependency.

### F4. Low - `pendingCount` của thông báo đang lộ cho mọi staff đã đăng nhập

Mức độ: Low

File ảnh hưởng:
- `backend/routes/announcementRoutes.js`
- `backend/controllers/announcementController.js`

Mô tả:
- `GET /api/announcements/latest` chỉ yêu cầu `auth`.
- Response trả cả `pendingCount`.

Rủi ro:
- Teacher và marketing thường vẫn biết được số lượng bài đang chờ duyệt.
- Đây là rò rỉ trạng thái moderation nội bộ, mức thấp.

Bằng chứng:
- `backend/controllers/announcementController.js:35-50`

Hướng xử lý:
- Chỉ trả `pendingCount` cho admin.
- Hoặc tách trường này sang endpoint admin riêng.

### F5. Low - Hardcoded fallback Google Drive folder ID trong backup service

Mức độ: Low

File ảnh hưởng:
- `backend/services/backup.service.js`

Mô tả:
- Backup service có fallback cứng cho `GOOGLE_DRIVE_FOLDER_ID` nếu env không có.

Rủi ro:
- Dễ đẩy backup sang sai folder nếu deployment thiếu config.
- Lộ internal integration identifier vào codebase.
- Làm giảm tính an toàn vận hành của backup/restore.

Bằng chứng:
- `backend/services/backup.service.js:66`
- `backend/services/backup.service.js:114`

Hướng xử lý:
- Bỏ fallback hardcoded.
- Production phải fail-fast nếu thiếu `GOOGLE_DRIVE_FOLDER_ID`.

### F6. Low - CSP vẫn giữ `unsafe-inline` cho script

Mức độ: Low

File ảnh hưởng:
- `backend/server.js`

Mô tả:
- CSP hiện vẫn cho phép `'unsafe-inline'` trong `script-src`.

Rủi ro:
- Nếu sau này phát sinh XSS ở nơi khác, CSP sẽ giảm hiệu quả chặn.
- Hiện tại điều này có vẻ đang được giữ để tương thích với reCAPTCHA và một số đoạn frontend hiện hữu.

Bằng chứng:
- `backend/server.js:120`

Hướng xử lý:
- Lập kế hoạch chuyển dần sang nonce-based CSP.
- Rà các script inline và các chỗ frontend đang phụ thuộc vào DOM mutation trực tiếp.

## 6. Những điểm đã kiểm tra và không xem là lỗ hổng ở thời điểm này

### 6.1 Teacher attendance sharing trong cùng khóa

Không tính là lỗ hổng vì:
- Business rule đã nêu rất rõ.
- Code có check teacher chính/phụ theo khóa.
- Dữ liệu nhạy cảm đã được giảm bớt cho teacher ở các API học viên.

File tham chiếu:
- `backend/controllers/courseController.js`
- `backend/controllers/registrationController.js`
- `backend/routes/courseRoutes.js`

### 6.2 Session binding cũ đã được vá

Bản audit cũ từng coi access token replay là vấn đề trung bình. Với code hiện tại:
- Access token có `sid`.
- Auth middleware buộc kiểm tra `sessionId` cookie.
- Khi thiếu cookie hoặc lệch `sid`, backend trả `SESSION_CONFLICT`.

File tham chiếu:
- `backend/controllers/authController.js`
- `backend/middlewares/auth.js`
- `frontend/src/services/api.js`

Kết luận:
- Finding cũ này không còn là finding chính ở bản audit hiện tại.

### 6.3 Endpoint `session-teachers` không còn là authorization leak kiểu cũ

Hiện tại teacher chỉ đọc được session có chính mình trong đó:
- `backend/controllers/salaryController.js:322-345`

Kết luận:
- Đây không phải lỗ hổng rò rỉ dữ liệu hàng loạt.
- Nếu cần cho teacher xem "hôm nay dạy ai" ở mức rộng hơn, đó là yêu cầu nghiệp vụ mới, không phải vá bảo mật.

## 7. Mức độ hoàn thiện theo từng lớp

### 7.1 Auth và session

Đánh giá: Tốt

Lý do:
- Refresh token trong cookie httpOnly.
- Access token chỉ giữ in-memory ở frontend.
- Có session conflict check và invalidate phiên cũ.
- Có reCAPTCHA và limiter cho login/forgot/reset.

### 7.2 Authorization nghiệp vụ

Đánh giá: Khá tốt

Lý do:
- Teacher access theo khóa đã đúng ở module học viên/điểm danh.
- Admin-only routes ở backup, restore, salary report, timetable đang khá rõ.
- Vẫn còn vài rò rỉ vận hành nhẹ như `pendingCount`.

### 7.3 Public API abuse resistance

Đánh giá: Trung bình khá

Lý do:
- Có limiter và reCAPTCHA cho form public chính.
- Nhưng AI proxy public vẫn còn hơi mở, chưa có abuse control đủ mạnh.

### 7.4 File handling

Đánh giá: Khá

Lý do:
- Upload ảnh được làm cẩn thận ở tầng ứng dụng.
- Tuy vậy dependency `multer` nên được nâng.

### 7.5 Khả năng chống rò rỉ dữ liệu

Đánh giá: Khá

Lý do:
- Teacher đã bị ẩn phone/email khi xem học viên.
- Frontend không lưu access token.
- Vẫn còn vài metadata nội bộ đang lộ cho staff đã đăng nhập.

## 8. Thứ tự ưu tiên sửa

### Ưu tiên 1 - Nên làm sớm

- Gom CORS và CSRF về cùng một nguồn cấu hình origin.
- Siết `POST /api/chat-config/ask` bằng limiter riêng và cơ chế anti-abuse tốt hơn.
- Nâng `multer` 1.x lên 2.x rồi re-test toàn bộ upload route.

### Ưu tiên 2 - Dọn nợ bảo mật

- Ẩn `pendingCount` khỏi staff thường.
- Bỏ hardcoded Drive folder ID.
- Lập kế hoạch giảm dần `unsafe-inline` trong CSP.

## 9. Kết luận cuối

Hệ thống hiện tại **không yếu**, và ở nhiều phần đã được làm tốt hơn so với mặt bằng web custom nhỏ:
- Teacher attendance theo khóa đang đi đúng business rule và đã có least privilege tương đối tốt.
- Session/auth hiện đã chặt hơn đáng kể.
- Upload ảnh và restore flow có nhiều guard hữu ích.

Nhưng hệ thống **chưa ở mức có thể tự tin gọi là gần tuyệt đối an toàn**, vì vẫn còn:
- 3 điểm Medium đáng xử lý.
- 3 điểm Low nên dọn trong cùng đợt hardening.

Điểm hợp lý cho trạng thái hiện tại: **8.2 / 10**

Nếu xử lý xong `F1`, `F2`, `F3`, mình đánh giá hệ thống có thể lên khoảng **8.8 - 9.0 / 10** mà không cần thay đổi kiến trúc quá lớn.

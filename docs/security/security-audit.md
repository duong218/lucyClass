# Kiểm kê bảo mật hiện có

## Phạm vi
- Tài liệu này mô tả các cơ chế bảo mật **đang tồn tại trong code hiện tại** của hệ thống `backend` và `frontend`.
- Mục tiêu là phản ánh đầy đủ lớp bảo vệ hiện có, không chỉ liệt kê các phần mới sửa.
- Phạm vi đọc chính:
  - `backend/server.js`
  - `backend/controllers/authController.js`
  - `backend/controllers/registrationController.js`
  - `backend/controllers/teacherController.js`
  - `backend/controllers/auditController.js`
  - `backend/middlewares/*`
  - `backend/models/*`
  - `backend/services/backup.service.js`
  - `backend/services/restore.service.js`
  - `backend/utils/*`
  - `frontend/src/contexts/AuthContext.jsx`
  - `frontend/src/services/api.js`
  - `frontend/src/components/RecaptchaProvider.jsx`
  - `frontend/src/components/RecaptchaBox.jsx`
  - `frontend/src/components/RegistrationForm.jsx`

## Tóm tắt ngắn
- Hệ thống hiện đã có các lớp bảo vệ chính:
  - xác thực JWT + refresh token + session conflict,
  - phân quyền theo role,
  - CORS allowlist,
  - CSRF bằng `Origin` + `X-Requested-With`,
  - Helmet/CSP/HSTS,
  - rate limit nhiều tầng,
  - sanitize input và chống NoSQL/XSS,
  - upload ảnh nhiều lớp,
  - giới hạn lộ dữ liệu nội bộ,
  - backup/restore có mã hóa và kiểm tra an toàn,
  - audit log cho thao tác quản trị.

## 1. Kiểm tra cấu hình và khởi động an toàn

### Kiểm tra biến môi trường bắt buộc
- `backend/server.js` dừng tiến trình nếu thiếu các biến quan trọng như:
  - `MONGO_URI`
  - `BACKUP_PATH`
  - thông tin Cloudinary
  - `BACKUP_ENCRYPTION_KEY`
  - `RECAPTCHA_SECRET_KEY`

### Graceful shutdown
- `backend/server.js` đóng có thứ tự:
  - HTTP server,
  - MongoDB connection,
  - Redis client.
- Có handler cho:
  - `uncaughtException`
  - `unhandledRejection`
  - `SIGINT`
  - `SIGTERM`

## 2. Bảo vệ lớp mạng và header HTTP

### CORS allowlist
- `backend/server.js` parse danh sách origin hợp lệ từ:
  - `CORS_ORIGINS`
  - `CLIENT_URL`
  - `FRONTEND_URL`
- Request có `origin` ngoài allowlist sẽ bị chặn bởi CORS.

### Helmet
- `backend/server.js` dùng `helmet()` cho toàn bộ response.
- Có cấu hình:
  - `contentSecurityPolicy`
  - `img-src` giới hạn ảnh từ `self`, `data`, `res.cloudinary.com`
  - `script-src` chỉ cho script nội bộ và Google reCAPTCHA
  - `frame-src` cho reCAPTCHA
  - `connect-src` cho backend, Cloudinary, reCAPTCHA
  - `hsts` trong production

### Trust proxy
- `app.set('trust proxy', 1)` được bật để limiter hoạt động đúng khi chạy sau reverse proxy.

## 3. CSRF protection

### Cơ chế chính
- `backend/middlewares/securityMiddleware.js` kiểm tra CSRF dựa trên:
  - `Origin`
  - header `X-Requested-With`
- Chỉ áp dụng cho request thay đổi dữ liệu.
- Bỏ qua:
  - `GET`
  - `HEAD`
  - `OPTIONS`

### Whitelist giới hạn
- Một số route public được whitelist để không bị cản sai luồng public form.
- Login không còn nằm trong whitelist, giúp tránh Login CSRF.

### Phối hợp frontend
- `frontend/src/services/api.js` luôn gắn `X-Requested-With: XMLHttpRequest`.
- `frontend/src/services/streakService.js` cũng tự gắn header này cho các request `fetch`.

## 4. Xác thực, session và token

### Access token + refresh token
- `backend/controllers/authController.js` sinh:
  - `accessToken` dùng JWT `HS256`,
  - `refreshToken` JWT riêng.
- Frontend lưu access token trong memory, không ghi bền xuống localStorage.

### Cookie bảo mật
- `refreshToken` và `sessionId` được set bằng cookie:
  - `httpOnly: true`
  - `secure` trong production
  - `sameSite: none` ở production, `lax` ở dev
  - `domain` theo `COOKIE_DOMAIN` nếu có

### Session conflict
- Backend dùng `activeSessionId` để đảm bảo một phiên đang hiệu lực.
- `auth.js` và `refreshToken()` đều so sánh cookie `sessionId` với dữ liệu DB.
- Nếu lệch:
  - backend trả `SESSION_CONFLICT`,
  - frontend hiện modal buộc đăng nhập lại.

### Refresh token rotation
- Khi refresh thành công:
  - token cũ bị loại,
  - token mới được thêm vào danh sách hợp lệ,
  - cookie được cập nhật.
- Điều này giúp giảm rủi ro replay token.

### Logout an toàn
- `logout()` dùng `jwt.verify()` thay vì `decode()` để tránh tin vào token đã bị chỉnh sửa.
- Khi logout:
  - xóa refresh token khỏi DB,
  - unset `activeSessionId`,
  - clear cookie.

### Bảo vệ tài khoản
- `loginAttempts` và `lockUntil` có trên `Admin` và `StaffAccount`.
- Sau nhiều lần đăng nhập sai, tài khoản bị khóa tạm.

## 5. Phân quyền

### Middleware phân quyền
- `backend/middlewares/auth.js` xác thực user.
- `backend/middlewares/isAdmin.js` chỉ cho admin đi tiếp.
- `backend/middlewares/authorizeRoles.js` kiểm tra role theo danh sách.

### Phân quyền theo vai trò
- Hệ thống hiện dùng các role:
  - `admin`
  - `teacher`
  - `marketing`

### Phân quyền theo phạm vi dữ liệu
- Giáo viên không chỉ bị chặn theo role mà còn bị kiểm tra phạm vi lớp.
- `courseController.checkCourseAccess()` và các luồng liên quan chỉ cho teacher truy cập lớp mình phụ trách qua:
  - `course.teacher`
  - `course.additionalTeachers`

## 6. Rate limit và chống spam

### Limiter HTTP nhiều tầng
- `backend/middlewares/rateLimiter.js` có:
  - `apiLimiter`
  - `loginLimiter`
  - `registerLimiter`
  - `statsLimiter`
  - `publicLimiter`
  - `forgotPasswordLimiter`
  - `resetPasswordLimiter`
  - `streakLimiter`
  - `heavyOpLimiter`
  - `toggleAttendanceLimiter`

### Chống spam form đăng ký
- `backend/middlewares/validateRegistration.js` có:
  - honeypot `website`,
  - cooldown theo IP,
  - validate tên/số điện thoại/email/nhóm tuổi.

### Chống spam streak theo IP/số điện thoại
- `backend/middlewares/phoneLimiter.js` dùng Redis để:
  - giới hạn số phone khác nhau từ cùng 1 IP trong ngày,
  - chặn 1 phone spam liên tục,
  - chặn 1 IP đổi số quá nhiều lần trong ngày.

### Chống đăng ký lặp
- `registrationController.create()` còn có thêm:
  - kiểm tra số lần đăng ký trong ngày theo số điện thoại,
  - giới hạn số khóa đang active cho cùng một số,
  - kiểm tra duplicate nhiều mức,
  - kiểm tra sức chứa lớp trong transaction.

## 7. Làm sạch dữ liệu đầu vào

### Sanitize toàn cục
- `backend/server.js` dùng:
  - `express-mongo-sanitize`
  - `xss-clean`

### Sanitize thủ công theo nghiệp vụ
- `backend/utils/sanitize.js` có:
  - `cleanInput()`
  - `cleanObject()`
- Tính năng:
  - loại toàn bộ HTML tag/attribute,
  - normalize Unicode NFC,
  - giới hạn độ dài payload,
  - lọc key nguy hiểm như `__proto__`, `prototype`, `constructor`,
  - sanitize đệ quy object/array.

### Whitelist khi cập nhật
- `registrationController.update()` chỉ cho cập nhật các field nằm trong danh sách `ALLOWED`.
- Điều này giảm rủi ro mass assignment.

### Whitelist khi tạo teacher
- `teacherController.js` chỉ pick các field mong muốn từ request body qua `pickTeacherInput()`.

## 8. Giới hạn body và payload

### Giới hạn body parser
- `backend/server.js` giới hạn JSON và URL encoded ở mức `6mb`.

### Giới hạn input theo field
- Nhiều controller kiểm tra độ dài và kiểu dữ liệu trước khi ghi DB.
- Ví dụ:
  - teacher name/specialization/feedback/rating,
  - registration parent/child/email/phone/message,
  - reset password độ mạnh mật khẩu.

## 9. Bảo mật upload ảnh

### Điều kiện file đầu vào
- `backend/middlewares/upload.js` chỉ nhận:
  - `.jpeg`
  - `.jpg`
  - `.png`
  - `.webp`

### Nhiều lớp kiểm tra
- Kiểm tra đồng thời:
  - extension,
  - MIME type,
  - magic bytes thực tế của file.

### Chống tên file nguy hiểm
- Tên file được sanitize để chỉ còn ký tự an toàn.

### Chống pixel bomb và payload ẩn
- Dùng `sharp` với:
  - `limitInputPixels`,
  - giới hạn kích thước tối đa,
  - re-encode ảnh,
  - loại metadata EXIF.

### Giới hạn request upload
- Chỉ cho:
  - 1 file/request,
  - giới hạn `fileSize`,
  - giới hạn số field/part.

## 10. Kiểm soát lộ dữ liệu

### Ẩn field nội bộ của giáo viên
- `backend/models/Teacher.js` loại khỏi JSON:
  - `staffAccountId`
  - `avatarPublicId`
  - `isDeleted`
  - `deletedAt`

### Controller teacher cũng loại field nội bộ
- `teacherController.js` dùng `select(EXCLUDED_FIELDS)` để chặn lộ dữ liệu từ tầng query.

### Ẩn field nhạy cảm của staff/admin
- `staffController.js` loại bỏ:
  - `password`
  - `refreshTokens`
  - `activeSessionId`
  - `resetPasswordToken`
  - `resetPasswordExpire`

### Public endpoint chỉ trả field trình bày
- Các API public như course/teacher/announcement/feedback được thiết kế để chỉ trả dữ liệu phục vụ hiển thị.

## 11. Bảo vệ đăng nhập và quên mật khẩu

### reCAPTCHA
- `authController.login()` và `forgotPassword()` đều gọi Google reCAPTCHA verify trước khi xử lý sâu.

### Chống username enumeration một phần
- Ở login, reCAPTCHA được kiểm tra trước khi truy vấn DB.
- Message sai tài khoản/mật khẩu được gom chung thay vì phân biệt rõ.

### Quên mật khẩu có tách luồng
- Admin và staff dùng luồng riêng.
- Staff bắt buộc có `accountType`, `username`, `email` khớp.

### Reset password
- Token reset được hash bằng `sha256` trước khi lưu DB.
- Token có thời hạn.
- Khi reset thành công:
  - xóa reset token,
  - reset loginAttempts,
  - xóa toàn bộ refresh token,
  - hủy session cũ.

### Độ mạnh mật khẩu
- `resetPassword()` yêu cầu mật khẩu:
  - từ 8 đến 64 ký tự,
  - có chữ hoa,
  - chữ thường,
  - số,
  - ký tự đặc biệt.

## 12. An toàn dữ liệu nghiệp vụ

### Transaction trong đăng ký
- `registrationController.create()` dùng `mongoose.startSession()` + transaction.
- Mục tiêu:
  - duplicate check,
  - capacity check,
  - lưu registration
  được thực hiện atomically.

### Capacity check khi cập nhật trạng thái
- Khi chuyển đăng ký sang `registered`, hệ thống kiểm tra sức chứa lớp trong transaction.

### Chuyển lớp an toàn
- `transferStudent()` kiểm tra:
  - course đích hợp lệ,
  - học viên active,
  - không chuyển vào chính lớp cũ,
  - lớp đích chưa đầy.

## 13. Audit log và theo dõi

### Audit log admin
- `backend/utils/logAdminAction.js` ghi thao tác quản trị vào `AuditLog`.
- Áp dụng ở nhiều nghiệp vụ:
  - tạo/sửa/xóa giáo viên,
  - tạo/sửa/xóa/reset staff,
  - loại học sinh,
  - chuyển lớp,
  - thao tác quản trị khác.

### System logger
- `systemLogger` dùng ghi:
  - CSRF block,
  - rate limit,
  - lỗi nghiêm trọng,
  - startup/shutdown issue.

### CSV export an toàn
- `auditController.exportCSV()` sanitize từng cell trước khi ghi CSV.
- Ngăn Excel hiểu dữ liệu thành công thức nếu bắt đầu bằng `=`, `+`, `-`, `@`, tab, CR.

## 14. Cache và Redis

### Redis cache
- `cacheMiddleware.js` cache response GET theo URL.
- Có clear cache theo prefix khi dữ liệu thay đổi.

### Xóa cache sau restore
- `restore.service.js` gọi `clearAllCache()` sau khi khôi phục DB để tránh trả dữ liệu stale từ Redis.

### Redis lỗi không làm sập luồng chính
- Nhiều chỗ có fallback: Redis lỗi thì bỏ qua cache/limiter thay vì làm hệ thống ngừng xử lý hoàn toàn.

## 15. Backup và restore an toàn

### Backup
- `backup.service.js`:
  - chạy `mongodump` bằng `spawn` thay vì shell command ghép chuỗi,
  - zip dữ liệu,
  - mã hóa file bằng `AES-256-GCM`,
  - upload file `.enc` lên Google Drive,
  - giữ file `.uploading` để retry khi upload dở dang.

### Mã hóa backup
- `backend/utils/encryptionUtils.js` dùng:
  - `AES-256-GCM`
  - IV ngẫu nhiên
  - auth tag

### Restore
- `restore.service.js` chỉ cho restore từ file `.enc`.
- Các lớp bảo vệ hiện có:
  - kiểm tra file tồn tại và không rỗng,
  - bắt buộc có `BACKUP_ENCRYPTION_KEY`,
  - giải mã trước khi dùng,
  - tạo safety backup trước khi đụng DB hiện tại,
  - chống Zip Slip khi giải nén,
  - restore thử vào DB tạm trước,
  - mới restore thật với `mongorestore --drop`,
  - giữ collection `admins` bằng `--nsExclude=*.admins`,
  - xóa cache Redis sau cùng,
  - cleanup file tạm ở `finally`.

## 16. Bảo mật phía frontend

### Access token chỉ ở memory
- `frontend/src/services/api.js` giữ access token trong biến module `_accessToken`.
- `AuthContext.jsx` chỉ dùng `localStorage.hasSession` như cờ gợi ý có phiên, không lưu access token.

### Tự refresh an toàn
- `services/api.js` có queue `failedQueue` để tránh nhiều request cùng refresh chồng chéo.

### Logout/session conflict event-driven
- Khi refresh thất bại hoặc có session conflict:
  - frontend phát event,
  - đồng bộ trạng thái toàn app,
  - chuyển người dùng về login.

### ProtectedRoute
- `frontend/src/components/ProtectedRoute.jsx` kiểm soát truy cập theo role ở phía client.
- Đây là lớp UX bổ sung; quyền thực vẫn do backend quyết định.

### reCAPTCHA phía client
- `RecaptchaProvider.jsx` nạp script an toàn và kiểm tra trạng thái sẵn sàng.
- `RecaptchaBox.jsx` xử lý reset/render lại để tránh lỗi widget reuse.

## 17. Giới hạn hiện trạng cần lưu ý

### Một số lớp bảo vệ phụ thuộc cấu hình deploy
- Hiệu lực thực tế của:
  - `secure cookie`,
  - `COOKIE_DOMAIN`,
  - allowlist CORS,
  - HSTS,
  - Google Drive backup
  phụ thuộc môi trường deploy đúng biến môi trường.

### Client-side guard không thay thế server-side auth
- `ProtectedRoute` chỉ hỗ trợ UX.
- Mọi quyền thật vẫn phải đi qua `auth`, `isAdmin`, `authorizeRoles` và kiểm tra phạm vi dữ liệu ở backend.

### Một số route public vẫn cần review khi mở rộng schema
- Nếu tương lai thêm field mới vào `Teacher`, `Course`, `Announcement`, `Feedback`, cần kiểm tra lại khả năng lộ dữ liệu nội bộ.

## 18. Kết luận
- Ở trạng thái hiện tại, hệ thống đã có nền bảo mật tương đối đầy đủ cho một ứng dụng quản trị web gồm:
  - xác thực và quản lý phiên,
  - phân quyền,
  - chống CSRF/XSS/NoSQL injection,
  - rate limit/chống spam,
  - upload an toàn,
  - backup/restore có mã hóa,
  - audit log.
- Phần `security` hiện hành không chỉ nằm ở một file mới sửa mà đang trải dài ở:
  - `server.js`,
  - `authController.js`,
  - `middlewares`,
  - `services backup/restore`,
  - `models`,
  - `frontend api/auth flow`.

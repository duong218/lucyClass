# Security Audit — LucyClass

- **Ngày audit:** 2026-04-29 (cập nhật lần 3: 2026-04-29)
- **Phạm vi:** `backend/`, `frontend/`
- **Phương pháp:**
  - Đọc source code trực tiếp: `authController.js`, `courseController.js`, `checkBlockedIP.js`, `logAdminAction.js`, `rateLimiter.js`, `securityMiddleware.js`, `upload.js`, `server.js`, `Course.js`, `api.js`, `AdminLogin.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `AuthContext.jsx`, `ProtectedRoute.jsx`
  - Đọc cấu hình: `backend/.env.example`
  - Đọc tài liệu kiến trúc: `be.md`, `fe.md`
  - Static code review: route → controller → middleware → model flow
  - Auth / session / CSRF / CORS / rate-limit review
  - Upload / export / attendance / streak / backup-restore review
- **Cơ sở cấu hình được đọc:**
  - `backend/.env.example` ✅
- **Loại trừ tuyệt đối:**
  - Không đọc `backend/.env` ✅
  - Không đọc `frontend/.env` ✅
  - Không đọc `*.env.production` ✅
  - Không đọc secret thật hay key thật ✅

---

## 1. Kết luận nhanh

**Mức bảo mật hiện tại sau các lần fix: 8.5 / 10 — Tốt**

Các finding đã được xử lý sau audit:

- **F1 (`parseAdditionalTeachers` limit 15→4) và `sessionId` httpOnly tường minh:** Đã fix.
- **F2 (IP acquisition):** Đã fix toàn bộ — `checkBlockedIP.js`, `logAdminAction.js`, `authController.js` đều dùng `req.ip` nhất quán, bỏ `x-forwarded-for` raw và `req.connection.remoteAddress`.
- **F3 (attendance date validation):** Accepted — bỏ khỏi findings.
- **F4 (CSP `unsafe-inline`):** Còn tồn tại — accepted risk tạm thời do ràng buộc reCAPTCHA v2.
- **`innerHTML` trong FE:** Đã xác nhận không còn.

**Findings còn lại: 1 (Low)**

---

## 2. Loại trừ theo mô tả hệ thống

### 2.1 Điểm danh dùng chung cho giáo viên chính và giáo viên phụ

**Accepted business rule:**
- 1 khóa học có 1 giáo viên chính, tối đa 15 giáo viên phụ
- Cả 16 người đều được xem danh sách lớp và điểm danh thay nhau
- Dữ liệu điểm danh đồng bộ real-time giữa các giáo viên của cùng khóa

**Kết luận:**
- `checkCourseAccess()` trong `courseController.js` xác nhận đúng logic này: admin luôn được phép, teacher phải là `teacher` chính hoặc nằm trong `additionalTeachers` của khóa
- Việc 16 giáo viên cùng xem và điểm danh không bị tính là broken access control
- Audit chỉ xem là vấn đề nếu vượt quá 1 chính + 15 phụ, hoặc cho người ngoài khóa truy cập

### 2.2 Streak cho phép check-in hộ

**Accepted business rule:**
- Streak là mini game marketing, có chủ đích nới lỏng để giữ user
- Cho phép check-in hộ

**Kết luận:**
- Không coi riêng "check-in hộ" là lỗi auth
- Phần streak vẫn là khu vực `low-trust` về privacy và abuse — **accepted risk** theo mô tả hiện tại

### 2.3 Excel chỉ là export, không có upload Excel công khai

**Accepted business rule:**
- Hệ thống chủ yếu xuất file Excel
- Không có role nào được upload Excel lên server

**Kết luận:**
- Không đưa nhóm rủi ro "malicious spreadsheet upload" vào findings chính
- Code `exportAttendanceExcel` trong `courseController.js` xác nhận: chỉ ghi vào response stream, không nhận file từ client

---

## 3. Điểm mạnh hiện có (xác nhận qua code thực tế)

### 3.1 Authentication và session

- `api.js` FE: access token giữ hoàn toàn in-memory (`let _accessToken = null`), không lưu vào `localStorage` hay `sessionStorage`
- `authController.js`: refresh token dùng cookie `httpOnly: true`, `secure: true` (prod), `sameSite: 'none'` (prod)
- `sessionId` cookie được set `httpOnly: true` tường minh ở cả login lẫn refresh — không còn phụ thuộc ngầm vào spread
- Single-session thực sự: mỗi lần login tạo `sessionId` mới bằng `crypto.randomBytes(32)`, ghi đè `activeSessionId` trong DB — thiết bị cũ bị đẩy ra ngay
- `AuthContext.jsx`: polling `check-session` mỗi 10 giây, phát event `session:conflict` khi phát hiện đăng nhập từ thiết bị khác
- Token rotation: mỗi lần refresh tạo `newRefreshToken` mới, xóa token cũ khỏi `user.refreshTokens`
- Delay 1000ms sau khi sai mật khẩu để chống timing-based enumeration
- Password reset token được hash bằng `sha256` trước khi lưu DB — raw token chỉ tồn tại trong URL email, không lưu plaintext

### 3.2 Bảo vệ request và trình duyệt

- `server.js`: `helmet()` được mount trước `verifyCSRF`, đảm bảo mọi response (kể cả lỗi CSRF) đều có security headers
- `securityMiddleware.js`: CSRF check dùng strict equality (`allowedOrigins.includes(normalizedOrigin)`) thay vì `startsWith` — tránh bypass kiểu `https://trusted.com.attacker.tld`
- CORS dùng allowlist từ env, không mở `*`; có normalize trailing slash
- `api.js` FE: luôn gửi `X-Requested-With: XMLHttpRequest` cho mọi request
- `server.js`: `trust proxy 1` đã được set đúng

### 3.3 IP acquisition nhất quán (đã fix)

- `checkBlockedIP.js`: dùng `req.ip || req.socket?.remoteAddress || 'unknown'` — không còn đọc `x-forwarded-for` raw
- `logAdminAction.js`: dùng `req.ip || req.socket?.remoteAddress || 'unknown'` — bỏ `req.connection.remoteAddress` deprecated và bỏ fallback raw header
- `authController.js` `getClientIP()`: dùng `req.clientIP || req.ip || req.socket?.remoteAddress || 'unknown'` — nhất quán với 2 file trên
- Block IP không thể bị bypass bằng cách inject `X-Forwarded-For` giả từ client

### 3.4 Upload ảnh

- `upload.js`: extension check + MIME check + **magic bytes** (FileType.fromBuffer) + **sharp re-encode** + strip EXIF
- Chống pixel bomb: `limitInputPixels: MAX_IMAGE_PIXELS` (4096×4096)
- Filename sanitize: chỉ cho phép `[a-zA-Z0-9_\-]`, giới hạn 64 ký tự
- 1 file / request, giới hạn fileSize 5MB, parts 21

### 3.5 Rate limiting

- `rateLimiter.js`: có 10 limiter riêng biệt cho các use case khác nhau
- Login: 5 lần / 10 phút (prod), skip successful requests
- Forgot password: 3 lần / giờ (prod)
- Reset password: 5 lần / 30 phút (prod)
- Heavy ops (backup/restore): 5 lần / 15 phút (prod)
- Streak: 5 lần / phút (prod)

### 3.6 Input validation và sanitization

- `express-mongo-sanitize` + `xss-clean` ở tầng global
- `sanitize.js` + `cleanInput()` trước khi lưu DB
- `escapeStringRegexp()` trong `authController.js` trước khi dùng email trong MongoDB regex query — tránh ReDoS
- Password strength enforced cả FE (`ResetPassword.jsx`) lẫn BE (`authController.js`): min 8 ký tự, chữ hoa, thường, số, ký tự đặc biệt

### 3.7 reCAPTCHA

- Login, forgot password đều verify reCAPTCHA server-side trước khi xử lý
- `POST /api/submit` public form cũng verify reCAPTCHA

### 3.8 ProtectedRoute FE

- `ProtectedRoute.jsx` chờ `isInitialized` trước khi render, tránh flash unauthorized content
- Redirect sai role về đúng dashboard của role hiện tại, không về login

### 3.9 Dữ liệu nhạy cảm trong export

- `exportAttendanceExcel`: teacher role nhận `'***'` thay vì số điện thoại thật — đã mask đúng

### 3.10 Dependency audit

- `npm audit --omit=dev`: `0 vulnerabilities` cho cả FE và BE tại thời điểm scan

---

## 4. Findings còn tồn tại

### F1. Low — CSP còn `unsafe-inline` trong `script-src`

- **Mức độ:** `Low`
- **Trạng thái:** Còn tồn tại — accepted risk tạm thời do ràng buộc reCAPTCHA v2
- **File ảnh hưởng:**
  - `backend/server.js`
- **Mô tả:**
  ```js
  "script-src": ["'self'", "'unsafe-inline'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"]
  ```
  - `'unsafe-inline'` vô hiệu hóa một phần bảo vệ XSS của CSP
  - Cần thiết hiện tại vì reCAPTCHA v2 inject inline script — nếu bỏ thì reCAPTCHA vỡ
- **Hướng giải quyết:**
  - Khảo sát xem reCAPTCHA v2 có hỗ trợ nonce-based loading không
  - Nếu chuyển sang reCAPTCHA v3 hoặc `grecaptcha.enterprise`, có thể loại bỏ `unsafe-inline`
  - Ưu tiên thấp — chỉ xử lý khi có kế hoạch nâng cấp reCAPTCHA

---

## 5. Những điểm đã được fix và xác nhận

- **IP acquisition (`checkBlockedIP.js`, `logAdminAction.js`, `authController.js`):** Đã fix — toàn bộ dùng `req.ip`, không còn đọc `x-forwarded-for` raw hay `req.connection.remoteAddress`. Block IP không thể bị bypass bằng header giả. Audit log ghi IP đáng tin cậy.
- **`sessionId` cookie `httpOnly` tường minh:** `authController.js` đã set `httpOnly: true` tường minh cho `sessionId` ở cả login lẫn refresh — không còn phụ thuộc ngầm vào spread `options`.
- **`parseAdditionalTeachers` limit:** Đã fix về đúng giới hạn nghiệp vụ 4 giáo viên phụ.
- **`innerHTML` trong FE:** Đọc `AdminLogin.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` — không còn `innerHTML` dynamic trong JSX.
- **Payload học sinh cho teacher:** `exportAttendanceExcel` mask số điện thoại thành `'***'` khi `req.user?.role === 'teacher'` — đúng.
- **CSRF whitelist bỏ `/api/auth/login`:** `securityMiddleware.js` đã xóa login khỏi whitelist, login phải chịu CSRF check để phòng Login CSRF.
- **MongoDB injection:** `escapeStringRegexp()` được dùng trước regex query, `express-mongo-sanitize` ở tầng global.
- **reCAPTCHA:** `forgotPassword` và `login` đều verify server-side, không chỉ client-side.
- **Password không lưu plaintext:** `bcryptjs` compare, reset password hash token bằng `sha256`.
- **Session invalidation khi reset password:** `user.refreshTokens = []` và `user.activeSessionId = undefined` khi reset thành công.
- **ProtectedRoute:** Không render children khi chưa `isInitialized` — tránh flash content.

---

## 6. Accepted risk cần giữ nguyên nhãn

### 6.1 Streak theo số điện thoại

- **Trạng thái:** Accepted risk theo mô tả nghiệp vụ marketing hiện tại
- **File liên quan:** `backend/controllers/streakController.js`, `backend/middlewares/phoneLimiter.js`, `frontend/src/utils/deviceId.js`
- **Khuyến nghị:** Nếu streak sau này gắn với phần thưởng có giá trị thật (voucher, tiền mặt), nâng cấp sang xác minh OTP hoặc token ký server-side. Hiện tại là mini game marketing thì accepted.

---

## 7. Đánh giá cuối

Sau các lần fix, hệ thống đã giải quyết toàn bộ finding `Medium` và hầu hết finding `Low`. Finding duy nhất còn tồn tại là CSP `unsafe-inline` (Low) — đây là trade-off kỹ thuật có chủ đích, không phải bỏ sót.

Điểm mạnh nổi bật: auth flow nhiều lớp (token rotation, single-session, session conflict polling), IP acquisition nhất quán sau fix, upload ảnh được kiểm tra kỹ ở nhiều tầng, rate limiting chi tiết theo từng use case, CSRF strict equality.

**Điểm bảo mật hiện tại: 8.5 / 10 — đủ tốt cho hệ thống quản lý trung tâm thiếu nhi tự xây dựng.**
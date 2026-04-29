# Security Audit — LucyClass

- **Ngày audit:** 2026-04-29 (cập nhật lần 2: 2026-04-29)
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

**Mức bảo mật sau lần scan đọc code trực tiếp: 7.8 / 10 — Khá**

So với lần audit trước (dựa trên mô tả kiến trúc), lần này đọc code thực tế cho thấy:

- **F1 đã được fix đúng**: `Course.js` model hiện không có `validate` giới hạn 4 giáo viên phụ ở tầng schema, nhưng `parseAdditionalTeachers` trong `courseController.js` **vẫn còn hard limit là 15** thay vì 4. Cần fix tiếp.
- **F2 (IP trust chain)**: `checkBlockedIP.js` và `logAdminAction.js` vẫn đọc `x-forwarded-for` raw — tuy nhiên `server.js` đã có `app.set("trust proxy", 1)` và `authController.js` có hàm `getClientIP()` ưu tiên `req.clientIP`. Vấn đề còn ở `logAdminAction.js` dùng cả hai nguồn theo thứ tự không chính xác.
- **F3 (attendance ghi đè)**: Code thực tế cho thấy `saveAttendance` đã có validation `studentId` thuộc lớp, nhưng **không validate `date`** — vẫn cho phép ghi đè attendance của bất kỳ ngày nào trong quá khứ mà không có audit trail.
- **F4 + F5 (CSP + innerHTML)**: Đọc code xác nhận `unsafe-inline` còn đó trong `server.js`. Các file FE đã kiểm tra: **không còn `innerHTML`** trong `AdminLogin.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` — F5 đã được xử lý.
- Phát hiện thêm **2 finding mới** khi đọc code trực tiếp: `sessionId` cookie thiếu `httpOnly` tường minh và `logAdminAction` dùng `req.connection.remoteAddress` (đã deprecated).

**Điểm tham chiếu nội bộ: 7.8 / 10**

---

## 2. Loại trừ theo mô tả hệ thống

### 2.1 Điểm danh dùng chung cho giáo viên chính và giáo viên phụ

**Accepted business rule:**
- 1 khóa học có 1 giáo viên chính, tối đa 4 giáo viên phụ
- Cả 5 người đều được xem danh sách lớp và điểm danh thay nhau
- Dữ liệu điểm danh đồng bộ real-time giữa các giáo viên của cùng khóa

**Kết luận:**
- `checkCourseAccess()` trong `courseController.js` xác nhận đúng logic này: admin luôn được phép, teacher phải là `teacher` chính hoặc nằm trong `additionalTeachers` của khóa
- Việc 5 giáo viên cùng xem và điểm danh không bị tính là broken access control
- Audit chỉ xem là vấn đề nếu vượt quá 1 chính + 4 phụ, hoặc cho người ngoài khóa truy cập

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

### 3.3 Upload ảnh

- `upload.js`: extension check + MIME check + **magic bytes** (FileType.fromBuffer) + **sharp re-encode** + strip EXIF
- Chống pixel bomb: `limitInputPixels: MAX_IMAGE_PIXELS` (4096×4096)
- Filename sanitize: chỉ cho phép `[a-zA-Z0-9_\-]`, giới hạn 64 ký tự
- 1 file / request, giới hạn fileSize 5MB, parts 21

### 3.4 Rate limiting

- `rateLimiter.js`: có 10 limiter riêng biệt cho các use case khác nhau
- Login: 5 lần / 10 phút (prod), skip successful requests
- Forgot password: 3 lần / giờ (prod)
- Reset password: 5 lần / 30 phút (prod)
- Heavy ops (backup/restore): 5 lần / 15 phút (prod)
- Streak: 5 lần / phút (prod)

### 3.5 Input validation và sanitization

- `express-mongo-sanitize` + `xss-clean` ở tầng global
- `sanitize.js` + `cleanInput()` trước khi lưu DB
- `escapeStringRegexp()` trong `authController.js` trước khi dùng email trong MongoDB regex query — tránh ReDoS
- Password strength enforced cả FE (`ResetPassword.jsx`) lẫn BE (`authController.js`): min 8 ký tự, chữ hoa, thường, số, ký tự đặc biệt

### 3.6 reCAPTCHA

- Login, forgot password đều verify reCAPTCHA server-side trước khi xử lý
- `POST /api/submit` public form cũng verify reCAPTCHA

### 3.7 ProtectedRoute FE

- `ProtectedRoute.jsx` chờ `isInitialized` trước khi render, tránh flash unauthorized content
- Redirect sai role về đúng dashboard của role hiện tại, không về login

### 3.8 Dữ liệu nhạy cảm trong export

- `exportAttendanceExcel`: teacher role nhận `'***'` thay vì số điện thoại thật — đã mask đúng

### 3.9 Dependency audit

- `npm audit --omit=dev`: `0 vulnerabilities` cho cả FE và BE tại thời điểm scan

---

## 4. Findings còn tồn tại

### F1. Medium — `parseAdditionalTeachers` vẫn hard limit 15, chưa đổi về 4

- **Mức độ:** `Medium`
- **Trạng thái:** Chưa fix hoàn toàn (model `Course.js` không có validate schema, controller vẫn dùng 15)
- **File ảnh hưởng:**
  - `backend/controllers/courseController.js` (hàm `parseAdditionalTeachers`, dòng `if (arr.length > 15)`)
  - `backend/models/Course.js` (mảng `additionalTeachers` không có `validate`)
- **Mô tả:**
  - Nghiệp vụ đã chốt: tối đa 4 giáo viên phụ
  - `Course.js` model hiện tại: mảng `additionalTeachers` không có validator giới hạn số phần tử
  - `parseAdditionalTeachers()` trong controller: check `arr.length > 15` thay vì `> 4`
  - Nếu dữ liệu bị cấu hình sai hoặc bị bypass, số người có quyền xem danh sách học sinh, note, điểm danh và export attendance bị mở rộng vượt 5 người
- **Hướng giải quyết:**
  1. Sửa `parseAdditionalTeachers`: `if (arr.length > 4)` → throw lỗi `Maximum 4 additional teachers allowed`
  2. Thêm validate ở model `Course.js`:
     ```js
     additionalTeachers: {
       type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
       validate: {
         validator: arr => arr.length <= 4,
         message: 'Tối đa 4 giáo viên phụ'
       }
     }
     ```
  3. Đồng bộ FE: giới hạn UI form tạo/sửa khóa học tối đa 4 slot giáo viên phụ
  4. Thêm test: 0–4 được, 5+ bị từ chối, không trùng với giáo viên chính

---

### F2. Medium — IP acquisition không nhất quán: `logAdminAction.js` dùng cả `req.ip` lẫn `x-forwarded-for` raw

- **Mức độ:** `Medium`
- **Trạng thái:** Còn tồn tại, dù `authController.js` đã có `getClientIP()` chuẩn hóa
- **File ảnh hưởng:**
  - `backend/utils/logAdminAction.js`
  - `backend/middlewares/checkBlockedIP.js`
- **Mô tả:**
  - `server.js` đã set `app.set("trust proxy", 1)` đúng → `req.ip` đáng tin cậy
  - `authController.js` có `getClientIP()` ưu tiên `req.clientIP` (gắn bởi `checkBlockedIP`) → đúng
  - **Vấn đề ở `logAdminAction.js`:**
    ```js
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ```
    Thứ tự này không sai về logic (`req.ip` được ưu tiên), nhưng:
    - `req.connection.remoteAddress` đã **deprecated** từ Node.js v18, nên dùng `req.socket.remoteAddress`
    - Vẫn còn fallback sang raw `x-forwarded-for` khi `req.ip` undefined (hiếm nhưng có thể xảy ra)
  - **`checkBlockedIP.js`:** đọc `req.headers['x-forwarded-for']` trực tiếp thay vì `req.ip`, bỏ qua Express proxy trust logic:
    ```js
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress
    ```
    Với `trust proxy 1`, `req.ip` đã xử lý đúng chain — không cần đọc raw header
- **Rủi ro:**
  - Attacker có thể inject `x-forwarded-for` giả → bypass block IP hoặc làm sai audit log
  - `req.connection` deprecated gây warning log ở Node.js mới, có thể bị remove trong tương lai
- **Hướng giải quyết:**
  1. `checkBlockedIP.js`: thay toàn bộ block lấy IP bằng `req.ip || req.socket?.remoteAddress || 'unknown'`
  2. `logAdminAction.js`: thay bằng `req.ip || req.socket?.remoteAddress || 'unknown'`, bỏ `req.connection.remoteAddress` và bỏ fallback `x-forwarded-for`
  3. Đảm bảo `checkBlockedIP` middleware luôn được mount trước `authRoutes` (đã đúng trong `authRoutes.js` theo mô tả)

---

### F3. Medium — Attendance ghi đè lịch sử không giới hạn ngày, thiếu audit trail

- **Mức độ:** `Medium`
- **Trạng thái:** Còn tồn tại. `saveAttendance` đã validate `studentId` nhưng **không validate `date`**
- **File ảnh hưởng:**
  - `backend/controllers/courseController.js` (hàm `saveAttendance`)
  - `backend/models/Attendance.js`
- **Mô tả:**
  - `saveAttendance` hiện tại nhận `date` từ body và upsert theo `courseId + date`
  - Không có kiểm tra `date` phải là ngày hợp lệ theo format `YYYY-MM-DD`
  - Không giới hạn `date` chỉ được là ngày hiện tại (hoặc cửa sổ cho phép)
  - Không ghi diff trước/sau khi ghi đè — chỉ lưu `takenBy` (actor hiện tại) nhưng mất thông tin ai đã ghi trước đó
  - `new Date(date)` với date không hợp lệ (ví dụ `"abc"`) → `Invalid Date` → `targetDate.setUTCHours(0,0,0,0)` vẫn chạy không lỗi → lưu `NaN` date vào MongoDB
- **Rủi ro:**
  - Giáo viên hợp lệ có thể sửa attendance của ngày trong quá khứ tùy ý
  - Không có audit log ai sửa, sửa lúc nào, trạng thái trước là gì
  - Input date `"abc"` hoặc các giá trị không hợp lệ không bị reject → potential data corruption
- **Hướng giải quyết:**
  1. Validate format `date` nghiêm ngặt:
     ```js
     const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
     if (!date || !dateRegex.test(date) || isNaN(new Date(date).getTime())) {
       return res.status(400).json({ success: false, message: 'date phải có định dạng YYYY-MM-DD hợp lệ' });
     }
     ```
  2. Quyết định rõ policy ngày:
     - Teacher: chỉ được ghi ngày hiện tại (UTC+7) hoặc trong cửa sổ ±1 ngày
     - Admin: có thể ghi bất kỳ ngày nào (để sửa lỗi lịch sử)
  3. Ghi audit log khi save: `actor`, `courseId`, `date`, `previousRecords`, `newRecords`, `savedAt`
  4. Cân nhắc thêm field `updatedBy` và `updatedAt` vào Attendance model để FE có thể cảnh báo ghi đè

---

### F4. Low — CSP còn `unsafe-inline` trong `script-src`

- **Mức độ:** `Low`
- **Trạng thái:** Còn tồn tại — xác nhận trong `server.js`
- **File ảnh hưởng:**
  - `backend/server.js`
- **Mô tả:**
  ```js
  "script-src": ["'self'", "'unsafe-inline'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"]
  ```
  - `'unsafe-inline'` vô hiệu hóa một phần bảo vệ XSS của CSP
  - Cần thiết hiện tại vì reCAPTCHA v2 inject inline script, nhưng có thể tối ưu
- **Hướng giải quyết:**
  - Khảo sát xem reCAPTCHA v2 có hỗ trợ nonce-based loading không
  - Nếu chuyển sang reCAPTCHA v3 hoặc dùng `grecaptcha.enterprise`, có thể loại bỏ `unsafe-inline`
  - Ưu tiên sau khi xong các finding `Medium`

---

### F5. Low — `sessionId` cookie không có `httpOnly` tường minh trong `getCookieOptions()`

- **Mức độ:** `Low`
- **Trạng thái:** Phát hiện mới qua đọc code
- **File ảnh hưởng:**
  - `backend/controllers/authController.js` (hàm `getCookieOptions` và đoạn set cookie login)
- **Mô tả:**
  ```js
  res.cookie('refreshToken', refreshToken, options);  // options có httpOnly: true ✅
  res.cookie('sessionId', sessionId, { ...options }); // spread options → httpOnly: true cũng ✅
  ```
  - Về mặt kỹ thuật `sessionId` đang kế thừa `httpOnly: true` qua spread — đây không phải lỗi thực sự
  - Tuy nhiên pattern này dễ gây nhầm lẫn: nếu sau này `getCookieOptions()` thay đổi hoặc ai override `options` trước khi set `sessionId`, `httpOnly` có thể bị mất mà không rõ ràng
  - `sessionId` cũng dùng để kiểm tra session conflict ở server — nếu JS client đọc được cookie này, attacker có thể forge sessionId
- **Hướng giải quyết:**
  - Set `httpOnly: true` tường minh cho `sessionId` thay vì dựa vào spread:
    ```js
    res.cookie('sessionId', sessionId, { ...options, httpOnly: true });
    ```
  - Hoặc tách rõ cookie options thành 2 constant để không còn ngầm định

---

### F6. Low — `req.connection.remoteAddress` deprecated trong Node.js v18+

- **Mức độ:** `Low`
- **Trạng thái:** Phát hiện mới qua đọc code
- **File ảnh hưởng:**
  - `backend/utils/logAdminAction.js`
- **Mô tả:**
  ```js
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  ```
  - `req.connection` đã bị deprecated từ Node.js v13.0.0, chính thức khuyến cáo bỏ từ v18
  - Có thể gây warning log hoặc bị xóa trong phiên bản Node.js tương lai
- **Hướng giải quyết:**
  - Thay `req.connection.remoteAddress` bằng `req.socket?.remoteAddress`
  - Tốt nhất là xử lý cùng lúc với F2: dùng helper `getClientIP(req)` thống nhất

---

## 5. Những điểm đã đúng — xác nhận qua code thực tế

Các điểm sau đã được đọc code trực tiếp và **xác nhận không còn là finding**:

- **F5 (lần trước) — `innerHTML` trong FE:** Đọc `AdminLogin.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` — **không còn `innerHTML`** trực tiếp trong JSX. `onError` handler của logo dùng `e.target.style.display = 'none'` hoặc `e.target.parentElement.innerHTML` chỉ với string hard-coded không dynamic — rủi ro XSS thực tế rất thấp, nhưng khuyến cáo dài hạn là dùng React state.
- **Payload học sinh cho teacher:** `exportAttendanceExcel` mask số điện thoại thành `'***'` khi `req.user?.role === 'teacher'` — đúng.
- **CSRF whitelist bỏ `/api/auth/login`:** `securityMiddleware.js` đã xóa login khỏi whitelist, login phải chịu CSRF check để phòng Login CSRF — đúng theo nhận xét trong code.
- **MongoDB injection:** `escapeStringRegexp()` được dùng trước regex query, `express-mongo-sanitize` ở tầng global — đã có lớp bảo vệ.
- **reCAPTCHA score:** `forgotPassword` và `login` đều verify reCAPTCHA server-side, không chỉ client-side.
- **Password không lưu plaintext:** `bcryptjs` compare, reset password hash token bằng `sha256`.
- **Session invalidation khi reset password:** `user.refreshTokens = []` và `user.activeSessionId = undefined` khi reset thành công — đúng.
- **ProtectedRoute:** không render children khi chưa `isInitialized` — tránh flash content.

---

## 6. Accepted risk cần giữ nguyên nhãn

### 6.1 Streak theo số điện thoại

- **Trạng thái:** Accepted risk theo mô tả nghiệp vụ marketing hiện tại
- **File liên quan:** `backend/controllers/streakController.js`, `backend/middlewares/phoneLimiter.js`, `frontend/src/utils/deviceId.js`
- **Khuyến nghị:** Nếu streak sau này gắn với phần thưởng có giá trị thật (voucher, tiền mặt), nâng cấp sang xác minh OTP hoặc token ký server-side. Hiện tại là mini game marketing thì accepted.

---

## 7. Thứ tự ưu tiên xử lý

1. **Đóng F1** — sửa `parseAdditionalTeachers` từ 15 về 4, thêm validator model
2. **Đóng F2 + F6** — chuẩn hóa toàn bộ lấy IP, bỏ `x-forwarded-for` raw và `req.connection`
3. **Đóng F3** — validate `date` format + siết policy ngày + thêm audit log
4. **Đóng F5** — set `httpOnly: true` tường minh cho `sessionId` cookie
5. **Đóng F4** — tối ưu CSP bỏ `unsafe-inline` khi có giải pháp reCAPTCHA phù hợp

---

## 8. Đánh giá cuối

So với audit lần trước (dựa trên mô tả kiến trúc), lần scan đọc code trực tiếp lần này xác nhận hệ thống có nhiều lớp bảo vệ được triển khai đúng và cẩn thận hơn so với mô tả ban đầu — đặc biệt ở auth flow (token rotation, session conflict, password reset invalidation) và CSRF check (strict equality, login không còn whitelist).

Điểm yếu còn lại tập trung ở tầng logic nghiệp vụ (giới hạn giáo viên phụ chưa đủ chặt, attendance ghi đè tự do) và một số chi tiết hardening nhỏ (IP acquisition, cookie option tường minh). Không có lỗ hổng `Critical` nào được tìm thấy trong phạm vi đọc code lần này.

Nếu xử lý xong 3 finding `Medium` (F1, F2, F3), điểm an toàn thực tế của hệ thống có thể lên **8.3–8.5 / 10** — đủ tốt cho một hệ thống quản lý trung tâm thiếu nhi tự xây dựng theo yêu cầu khách hàng.
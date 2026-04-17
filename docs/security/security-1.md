# Báo cáo Audit Bảo mật Toàn bộ Project (Backend + Frontend)

## Phạm vi và nguyên tắc audit

- Đã scan code backend và frontend trong project hiện tại.
- **Không đọc** các file chứa secret thực tế:
  - `.env`
  - `.env.production`
- **Chỉ đọc** `.env.example` để phân tích cách tổ chức và cách sử dụng biến môi trường.
- Không suy đoán giá trị secret thật.

---

## 1. Tổng quan bảo mật hệ thống

### 1.1 Kiến trúc bảo mật hiện tại

- Backend dùng Express + MongoDB/Mongoose.
- Có các lớp bảo vệ chính:
  - JWT access token (Bearer header).
  - Refresh token qua cookie `httpOnly`.
  - Session conflict check bằng `sessionId` cookie so với `activeSessionId` trong DB.
  - `helmet`, `express-mongo-sanitize`, `xss-clean`.
  - CSRF bằng 2 lớp (`csurf` + `verifyCSRF` custom origin/header).
  - `express-rate-limit` theo nhóm endpoint.
  - Upload có whitelist extension/MIME + kiểm tra magic number.

### 1.2 Điểm entry bề mặt tấn công

- API REST (`/api/*`) là entry chính.
- Public form:
  - `POST /api/registrations`
  - `POST /api/submit`
- Upload file:
  - courses/teachers/feedback/announcements (multipart).
- Auth flow:
  - `/api/auth/login`, `/api/auth/refresh-token`, `/api/auth/logout`.
- Backup/restore:
  - `/api/auth/google/*`
  - `/api/restore/progress`
- Frontend client app (React) gọi API qua `src/services/api.js` và một số `fetch` trực tiếp.

---

## 2. Environment Variables

## 2.1 Biến môi trường trong `backend/.env.example`

- `BACKUP_ENCRYPTION_KEY`
- `BACKUP_PATH`
- `CLIENT_URL`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_URL`
- `COOKIE_SECRET`
- `CORS_ORIGINS`
- `EMAIL_PASS`
- `EMAIL_USER`
- `ENABLE_CRON`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_SERVICE_ACCOUNT`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_NAME`
- `JWT_EXPIRES_IN`
- `JWT_SECRET`
- `MAX_REG_PER_DAY`
- `MONGO_URI`
- `NODE_ENV`
- `RECAPTCHA_SECRET_KEY`
- `REFRESH_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`
- `SENDGRID_API_KEY`
- `EMAIL_FROM`
- `CRON_TIMEZONE`
- `STREAK_COLLECTION`
- `STREAK_TZ`

## 2.2 Biến môi trường trong `frontend/.env.example`

- `CLIENT_URL`
- `VITE_RECAPTCHA_SITE_KEY`

## 2.3 Phân tích rủi ro

- Biến nhạy cảm rõ ràng:
  - `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `COOKIE_SECRET`
  - `MONGO_URI`
  - `CLOUDINARY_API_SECRET`
  - `GOOGLE_CLIENT_SECRET`, `GOOGLE_SERVICE_ACCOUNT`
  - `SENDGRID_API_KEY`
  - `RECAPTCHA_SECRET_KEY`
  - `BACKUP_ENCRYPTION_KEY`
- Không thấy hardcode secret thật trong code backend/frontend (ngoài placeholder trong `.env.example` là chấp nhận được).
- Frontend chỉ dùng `VITE_RECAPTCHA_SITE_KEY` (site key là public-by-design).
- Không thấy backend secret bị expose trực tiếp sang frontend.

---

## 3. Authentication & Authorization

## 3.1 Cơ chế đăng nhập

- `backend/controllers/authController.js`:
  - `login`: xác thực user/pass + captcha, phát:
    - access token (trả qua JSON)
    - refresh token (`httpOnly` cookie)
    - `sessionId` cookie để phát hiện đăng nhập thiết bị khác.
  - `refreshToken`: verify refresh token + rotation token + check session conflict.

## 3.2 Nơi lưu token

- Access token: lưu **in-memory** (`frontend/src/services/api.js`, biến `_accessToken`) -> tốt hơn localStorage.
- Refresh token: cookie `httpOnly` -> giảm nguy cơ XSS lấy token.
- Frontend có `localStorage.hasSession` chỉ là cờ trạng thái, không phải token.

## 3.3 Middleware bảo vệ

- `backend/middlewares/auth.js`: verify JWT Bearer và kiểm tra `sessionId`.
- `backend/middlewares/isAdmin.js` và `authorizeRoles.js`: RBAC.
- Hầu hết route quản trị đã gắn `auth + isAdmin`.

## 3.4 Rủi ro tiềm năng

- Một số endpoint streak hoạt động không cần auth, chỉ dựa vào số điện thoại (chi tiết ở mục 9).
- Endpoint logout không có CSRF riêng (rủi ro chủ yếu là forced logout/nuisance).

---

## 4. API Security

## 4.1 Input validation

- Có dùng `express-validator` ở nhiều route (`adminValidator`, `registrationValidator`, `streakValidator`, `validate`).
- Ngoài validator, nhiều controller còn kiểm tra thủ công + sanitize (`cleanInput`).
- `registrationController.create` có transaction + duplicate/capacity checks.

## 4.2 Rate limit

- Có limiter theo nhóm (`backend/middlewares/rateLimiter.js`):
  - `apiLimiter`, `loginLimiter`, `registerLimiter`, `forgotPasswordLimiter`, `resetPasswordLimiter`, `streakLimiter`.
- Tốt: có chuẩn hóa JSON khi bị block.

## 4.3 CORS

- `backend/server.js`: CORS origin allowlist đọc từ env (fallback localhost + domain production).
- Có normalize origin, credentials enabled.

## 4.4 Error handling

- `backend/middlewares/errorHandler.js` không trả stack trace ra client (tốt).
- Tuy nhiên một số controller trả thẳng `error.message` cho client, có thể làm lộ chi tiết nội bộ (xem mục 9).

## 4.5 HTTP methods

- REST method tương đối hợp lý (GET/POST/PUT/DELETE).
- Route quản trị quan trọng đa phần có auth + CSRF.

---

## 5. Database Security

- Dùng Mongoose schema có `required`, `enum`, `min/max`, `maxlength`, `index/unique`.
- Có chống NoSQL injection ở mức middleware global: `express-mongo-sanitize` (`backend/server.js`).
- Có sanitize input text bằng `sanitize-html` (`backend/utils/sanitize.js`).
- Truy vấn regex trong registration/search có escape regex (`escapeStringRegexp`) -> giảm regex injection.
- Có TTL index cho một số collection (`Registration`, `AuditLog`) -> giảm tích lũy dữ liệu nhạy cảm lâu dài.

---

## 6. Frontend Security

## 6.1 XSS

- Không thấy `dangerouslySetInnerHTML` trong source frontend.
- Không thấy `eval`, `new Function`, `document.write` nguy hiểm.

## 6.2 Token và dữ liệu nhạy cảm trên client

- Access token không lưu localStorage (tốt).
- `localStorage` vẫn lưu một số dữ liệu:
  - `hasSession`
  - `streak_phone`, `streak_last_login_date`, `streak_position`
- Đây không phải secret hệ thống nhưng là dữ liệu có thể bị đọc bởi XSS.

## 6.3 Lộ API key

- Chỉ thấy `VITE_RECAPTCHA_SITE_KEY` (site key public).
- Không thấy secret backend bị bundle vào frontend.

## 6.4 Kiểm soát input ở FE

- FE có validate cơ bản, nhưng bảo vệ chính vẫn nằm ở backend (đúng hướng).

---

## 7. File Upload / External Input

- `backend/middlewares/upload.js`:
  - Chỉ cho phép `.jpeg/.jpg/.png/.webp`.
  - Giới hạn size: 5MB.
  - Kiểm tra magic number bằng `file-type`.
  - Đối chiếu extension với MIME thực tế.
- Đây là cấu hình tốt, giảm đáng kể nguy cơ upload file giả mạo.

Lưu ý:
- Vẫn nên thêm antivirus scanning (ClamAV/service scanning) nếu cần mức enterprise.

---

## 8. Dependency Security

## 8.1 Kết quả kiểm tra tự động

- Chạy `npm audit --omit=dev --json`:
  - Backend: `0` lỗ hổng được báo cáo.
  - Frontend: `0` lỗ hổng được báo cáo.

## 8.2 Nhận xét bổ sung

- Dù `npm audit` sạch, vẫn có một số thư viện cần theo dõi vòng đời bảo trì:
  - `csurf` (package cũ, ecosystem ít active hơn trước).
  - `xss-clean` (ít được khuyến nghị ở dự án mới).
- Khuyến nghị theo dõi advisory định kỳ và cân nhắc thay thế bằng giải pháp actively maintained.

---

## 9. Các lỗ hổng tiềm ẩn (quan trọng)

## 9.1 [High] Bypass danh tính ở hệ thống streak (chỉ cần số điện thoại)

- File:
  - `backend/routes/streakRoutes.js`
  - `backend/controllers/streakController.js`
- Mô tả:
  - Endpoint streak (`/start`, `/me`, `/checkin`, `/revive`) không yêu cầu auth mạnh, chỉ dựa vào `phone`.
- Nguy cơ:
  - Kẻ tấn công có thể thao túng streak của người khác nếu biết/suy đoán số điện thoại.
- Cách khai thác:
  - Gửi request `POST /api/streak/checkin` hoặc `/revive` với số điện thoại nạn nhân.
- Khuyến nghị:
  - Bắt buộc OTP (SMS) hoặc signed challenge/session cho streak user.
  - Thêm chống enumeration theo phone (throttle theo phone + IP, response trung tính).

## 9.2 [Medium] Excel/CSV Injection khi export dữ liệu

- File:
  - `backend/controllers/auditController.js` (CSV export)
  - `backend/controllers/registrationController.js` (Excel export)
- Mô tả:
  - Dữ liệu người dùng có thể bắt đầu bằng `=`, `+`, `-`, `@` rồi được export sang CSV/XLSX.
- Nguy cơ:
  - Khi admin mở file bằng Excel, có thể kích hoạt công thức độc hại (CSV/Formula injection).
- Cách khai thác:
  - User nhập value dạng công thức vào trường text (vd `parentName`) rồi chờ admin export/open file.
- Khuyến nghị:
  - Escape prefix công thức bằng cách prepend `'` cho cell bắt đầu bằng ký tự nguy hiểm.
  - Áp dụng cho mọi export CSV/XLSX.

## 9.3 [Medium] Rò rỉ thông tin nội bộ qua `error.message`

- File:
  - `backend/controllers/registrationController.js` (L266, L273, L393, L405)
  - `backend/controllers/timetableController.js` (L125, L167, L310)
- Mô tả:
  - Một số API trả trực tiếp `error.message` cho client.
- Nguy cơ:
  - Có thể lộ chi tiết cấu trúc DB/logic nội bộ, hỗ trợ reconnaissance.
- Cách khai thác:
  - Gửi payload gây lỗi validation/db để thu thập thông tin lỗi chi tiết.
- Khuyến nghị:
  - Trả message chuẩn hóa cho client, log chi tiết chỉ ở server.

## 9.4 [Medium] Bề mặt route mở rộng ngoài ý định qua alias `/api/students`

- File:
  - `backend/server.js` (mount `app.use('/api/students', registrationRoutes);`)
  - `backend/routes/registrationRoutes.js`
- Mô tả:
  - Cùng một router đăng ký được mount ở cả `/api/registrations` và `/api/students`.
  - Dẫn tới tồn tại thêm entrypoint cho các route public/nhạy cảm trong cùng router.
- Nguy cơ:
  - Tăng bề mặt tấn công, dễ bỏ sót khi bảo trì rule WAF/rate-limit/monitoring.
- Khuyến nghị:
  - Tách router riêng cho student-admin endpoint, tránh mount alias toàn bộ.

## 9.5 [Medium] `trust proxy` cấu hình cứng có thể ảnh hưởng rate-limit/IP logging

- File:
  - `backend/server.js` (L68: `app.set('trust proxy', 1)`)
- Mô tả:
  - Tin tưởng proxy level 1 cố định, nếu hạ tầng không đúng kỳ vọng có thể bị spoof `X-Forwarded-For`.
- Nguy cơ:
  - Sai IP thật trong log/rate-limit, giảm hiệu quả chống abuse.
- Khuyến nghị:
  - Cấu hình `trust proxy` theo hạ tầng thực tế (boolean/list subnet) qua env.

## 9.6 [Low] Lộ chi tiết lỗi OAuth qua query param redirect

- File:
  - `backend/controllers/google.controller.js` (L109)
- Mô tả:
  - Redirect lỗi kèm `encodeURIComponent(error.message)` lên URL frontend.
- Nguy cơ:
  - Lộ chi tiết lỗi nội bộ/3rd-party ra client URL/history/log.
- Khuyến nghị:
  - Trả mã lỗi chuẩn hóa (vd `oauth_token_exchange_failed`) thay vì message thô.

## 9.7 [Low] Logging token reset (một phần) ở frontend

- File:
  - `frontend/src/pages/ResetPassword.jsx` (L16)
- Mô tả:
  - Có `console.log` chứa một phần token reset.
- Nguy cơ:
  - Rò rỉ thông tin qua console/log collector/browser extension.
- Khuyến nghị:
  - Xóa log token khỏi production build.

## 9.8 [Low] Rủi ro CSRF nếu deploy nhầm `NODE_ENV=development`

- File:
  - `backend/middlewares/securityMiddleware.js` (L9)
- Mô tả:
  - `verifyCSRF` bỏ qua toàn bộ check khi `NODE_ENV=development`.
- Nguy cơ:
  - Nếu cấu hình môi trường sai ở production sẽ mất lớp bảo vệ CSRF custom.
- Khuyến nghị:
  - Bổ sung guard runtime fail-fast nếu production host chạy không phải `NODE_ENV=production`.

---

## 10. Đề xuất cải thiện (fix cụ thể)

## 10.1 Ưu tiên cao (nên làm ngay)

1. Bảo vệ streak bằng xác thực thực sự:
- OTP/SMS verify trước khi cho `checkin/revive`.
- Tạo session/token riêng cho user streak, không tin mỗi phone.

2. Chặn Excel/CSV injection:
- Viết utility sanitize export:
  - Nếu string bắt đầu `=`, `+`, `-`, `@` -> prepend `'`.
- Áp dụng ở:
  - `auditController.exportCSV`
  - `registrationController.exportExcel`
  - mọi export mới trong tương lai.

3. Chuẩn hóa lỗi trả về:
- Không trả trực tiếp `error.message` từ exception hệ thống.
- Trả mã lỗi nội bộ + thông điệp user-friendly.
- Giữ stack/message chi tiết ở server log.

## 10.2 Ưu tiên trung bình

1. Tách route `/api/students` khỏi `registrationRoutes`:
- Tạo router chuyên cho admin student actions.
- Giảm route alias không cần thiết.

2. Cấu hình `trust proxy` theo env:
- Ví dụ `TRUST_PROXY=loopback,linklocal,uniquelocal` hoặc danh sách CIDR cụ thể.

3. Giảm lộ lỗi OAuth:
- Đổi query param lỗi sang mã tĩnh.

## 10.3 Hardening bổ sung

1. Bật kiểm tra bảo mật CI:
- `npm audit` định kỳ trong CI.
- Thêm SCA tools (Snyk/Dependabot/GitHub Advisory).

2. Nâng cấp/thay thế thư viện cũ:
- Theo dõi `csurf`, `xss-clean`; cân nhắc chiến lược thay thế.

3. Chính sách logging an toàn:
- Không log token, không log nhạy cảm.
- Chuẩn hóa redaction trong logger.

4. Thiết lập security regression tests:
- Test tự động cho auth refresh/session conflict/CSRF/rate-limit/upload validation.

---

## Kết luận nhanh

- Hệ thống hiện tại đã có nền bảo mật khá tốt ở mức ứng dụng web phổ biến: JWT + refresh cookie, middleware bảo vệ, sanitize, upload validation, rate-limit, và không thấy lộ secret trực tiếp trong frontend.
- Tuy nhiên còn các điểm cần xử lý để đạt mức production hardened:
  - **High**: streak xác thực yếu (phone-only).
  - **Medium**: CSV/Excel injection, lộ `error.message`, route alias tăng bề mặt tấn công, `trust proxy` cứng.
  - **Low**: chi tiết lỗi OAuth/token log ở frontend.

Sau khi fix các mục High/Medium ở trên, độ an toàn tổng thể sẽ cải thiện đáng kể.

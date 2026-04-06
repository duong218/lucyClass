# SECURITY AUDIT

> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

## 🛡️ CURRENT SECURITY MIDDLEWARE (backend/server.js)
- **Helmet**: Used for setting secure HTTP headers (CSP, HSTS, etc.).
- **Mongo-Sanitize**: Prevents NoSQL injection by clearing `$` and `.` from query params/body.
- **XSS-Clean**: Sanitizes user input to prevent Cross-Site Scripting.
- **CSRF Protection**: Implemented via `csurf` and custom middleware.
- **Rate Limiting**: Used for API protection (especially `/api/submit`) to prevent DDoS/Spam.
- **CORS**: Configured to restrict access to allowed origins only (with Vercel wildcard support).

## 🔐 AUTHENTICATION PROTOCOL
- **Password Hashing**: `bcryptjs` is used for securely storing user credentials.
- **Session Management**: JWT Access tokens (short-lived) + Refresh tokens (long-lived, HTTP-only cookie).
- **Proactive Security**: `check-session` endpoint helps track concurrent logins.
- **Token Handling**: HTTP-only, secure, and signed cookies for sensitive identifiers.

## 📝 AUDIT FINDINGS (Initial Scan)
- **Sensitive Data**: reCAPTCHA secret and Google Sheets credentials are required via `.env`.
- **Validation**: `express-validator` and manual regex (e.g., phone numbers) are used for backend data integrity.
- **Sanitization**: Standard sanitization rules are applied to all public-facing endpoints (e.g., `/api/submit`).
- **Google Sheets Integration**: Uses `appendToSheet` for off-site data archival.

## ✅ ĐÃ FIX
- **Rate limiting cho /login**: Bảo vệ chống brute-force (DEV: 100/1p, PROD: 5/10p).
- **Rate limiting cho /forgot-password**: Chống spam email (DEV: 100/1h, PROD: 3/1h).
- **Rate limiting cho /reset-password**: Chống brute-force token (DEV: 1000/1h, PROD: 5/30p).
- **Magic number validation cho upload**: Đã áp dụng `file-type` để kiểm tra file signature thực tế cho tất cả các route upload (Course, Announcement, v.v.).
- **Export Timetable từ GET → POST**: Đã chuyển sang dùng POST method để bảo mật thông tin và ngăn chặn CSRF (áp dụng cho Timetable, Registrations, Audit Logs).
- **NoSQL injection protection**: Đã áp dụng cơ chế sanitize ($ và .), whitelist fields cho cập nhật dữ liệu, và kiểm tra ObjectID hợp lệ.

## ⚠️ CHƯA FIX
- 🔴 **CSRF bị skip cho login/refresh-token**: Để ngăn chặn lỗi session recovery block, CSRF hiện tại bị tắt ở các route này. **Cần bật lại khi lên production**.

## 📊 FINAL SECURITY STATUS (Confirmed Fixes)

| ID | Vấn đề | Mức độ | File | Trạng thái | Hành động tiếp theo |
|----|--------|--------|------|------------|---------------------|
| 01 | Rate limiting login | 🟠 High | rateLimiter.js | ✅ ĐÃ FIX | - |
| 02 | CSRF bị skip cho login | 🔴 Critical | authRoutes.js | ❌ CHƯA FIX | Bật khi lên production |
| 03 | Upload file thiếu validation | 🟠 High | upload.js | ✅ ĐÃ FIX | Magic number active |
| 04 | Export dùng GET | 🟡 Medium | timetableRoutes.js | ✅ ĐÃ FIX | Đã chuyển sang POST |
| 05 | NoSQL injection | 🟡 Medium | registrationController.js | ✅ ĐÃ FIX | Sanitize & Whitelist active |

## 🚫 RESTRICTIONS
- **Environment Files**: The project MUST NOT index or read active `.env` files.
- **Error Handling**: A global error handler prevents leaking stack traces in production (via `errorHandler.js`).

# Security Audit Report - Lucy's Class Project

**Date**: 2026-04-21  
**Scope**: Frontend and Backend of `lucyClass-main`  
**Security Rules**: No real secrets were read. Only code structure and `.env.example` were analyzed.

---

## 1. FILE CẤU HÌNH NHẠY CẢM (Sensitive Configuration Files)

| File | Vị trí | Mức độ rủi ro | Lý do | Hành động khuyến nghị |
|------|--------|---------------|-------|----------------------|
| `.env` | `frontend/`, `backend/` | 🔴 CAO | Chứa secret thật (DB URI, JWT keys) | Đã được `.gitignore` chính xác. |
| `.env.example` | `frontend/`, `backend/` | 🟡 TRUNG BÌNH | Mẫu biến môi trường, không chứa giá trị thật | An toàn. |
| `vercel.json` | `frontend/` | 🟢 THẤP | Chỉ chứa rule rewrite SPA | An toàn. |
| `vite.config.js` | `frontend/` | 🟢 THẤP | Cấu hình build & proxy dev | An toàn. |
| `package.json` | `frontend/`, `backend/` | 🟢 THẤP | Lộ version của thư viện | Cần cập nhật dependency thường xuyên. |

---

## 2. FILE CHỨA SECRET CỨNG (Hardcoded Secrets)

Quét toàn bộ codebase (`.js`, `.jsx`):

| Pattern cần tìm | Mức độ | File nghi ngờ | Ghi chú |
|----------------|--------|--------------------------|---------|
| `password = '...'` | 🔴 CAO | Không phát hiện | |
| `secret = '...'` | 🔴 CAO | Không phát hiện | |
| `token = '...'` | 🔴 CAO | Không phát hiện | |
| `apiKey = '...'` | 🔴 CAO | Không phát hiện | |
| `privateKey` | 🔴 CAO | Không phát hiện | |
| `Bearer '...'` | 🔴 CAO | Không phát hiện | |
| `console.log` | 🟠 TRUNG BÌNH | Không phát hiện rò rỉ | |

---

## 3. CẤU HÌNH CORS (Cross-Origin Resource Sharing)

Phân tích tại `backend/server.js`:

| Tiêu chí | Trạng thái | Mức độ rủi ro | Ghi chú |
|----------|-----------|---------------|---------|
| CORS có được cấu hình không? | ✅ Có | - | Sử dụng middleware `cors`. |
| `origin` có bị để `'*'` không? | ❌ Không | 🟢 AN TOÀN | Sử dụng whitelist từ `CORS_ORIGINS`. |
| `credentials` có được bật không? | ✅ Có | 🟡 TRUNG BÌNH | Cần thiết cho Cookie Auth. |
| Danh sách origin được phép | Whitelist động | 🟢 TỐT | Lấy từ biến môi trường. |

---

## 4. BẢO VỆ HTTP HEADERS (Helmet)

Phân tích tại `backend/server.js`:

| Tiêu chí | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Helmet có được sử dụng không? | ✅ Có | Đã tích hợp. |
| CSP (Content-Security-Policy) | ✅ Có | Cho phép Cloudinary, Google reCAPTCHA. |
| HSTS | ✅ Có | Bật khi `NODE_ENV === 'production'`. |

---

## 5. XÁC THỰC & PHÂN QUYỀN (Authentication & Authorization)

| Kiểm tra | File | Mức độ | Kết quả |
|----------|------|--------|---------|
| JWT secret từ env | `authController.js` | 🔴 CAO nếu sai | ✅ Từ env (`JWT_SECRET`). |
| Refresh token cookie | `authController.js` | 🟢 TỐT | ✅ `httpOnly: true`, `secure: true`. |
| Session conflict check | `middlewares/auth.js` | 🟢 TỐT | ✅ Kiểm tra `activeSessionId`. |
| Rate limiting cho Auth | `rateLimiter.js` | 🟢 TỐT | ✅ 5 lần/10 phút (login). |
| Brute force protection | `authController.js` | 🟢 TỐT | ✅ Lock 2 phút sau 5 lần sai. |

---

## 6. CSRF PROTECTION

| Kiểm tra | File | Mức độ | Kết quả |
|----------|------|--------|---------|
| CSRF middleware | `server.js`, `csrf.js` | 🟢 TỐT | ✅ Có sử dụng `csurf` và custom check. |
| Endpoint exempt | `securityMiddleware.js` | 🟡 TRUNG BÌNH | Whitelist `/api/auth/login`, `/api/registrations`. |
| Origin/Referer check | `securityMiddleware.js` | 🟢 TỐT | ✅ Kiểm tra nghiêm ngặt `Origin` và `X-Requested-With`. |

---

## 7. INPUT VALIDATION & SANITIZATION

| Kiểm tra | File | Mức độ | Kết quả |
|----------|------|--------|---------|
| `express-validator` | `validators/` | 🟢 TỐT | ✅ Có sử dụng. |
| `mongo-sanitize` | `server.js` | 🟢 TỐT | ✅ Đã tích hợp. |
| `xss-clean` | `server.js` | 🟢 TỐT | ✅ Đã tích hợp. |
| File upload validation | `middlewares/upload.js`| 🟢 TỐT | ✅ Kiểm tra extension & mimetype. |

---

## 8. FILE UPLOAD SECURITY

| Kiểm tra | File | Mức độ | Kết quả |
|----------|------|--------|---------|
| Giới hạn kích thước | `upload.js` | 🟢 TỐT | ✅ Max 5MB. |
| Magic number check | `upload.js` | 🟢 TỐT | ✅ Sử dụng `file-type` để check content buffer. |
| Nơi lưu trữ | `cloudinary.js` | 🟢 TỐT | ✅ Cloudinary (MemoryStorage), không lưu local. |
| Sanitize tên file | `upload.js` | 🟢 TỐT | ✅ Metadata Cloudinary xử lý. |

---

## 9. DEPENDENCY SECURITY

Phân tích `package.json`:

| Kiểm tra | Kết quả | Ghi chú |
|----------|---------|---------|
| Dependencies (Frontend) | 14 | Mức độ trung bình. |
| Dependencies (Backend) | 33 | Khá nhiều, cần audit định kỳ. |
| Dependency cũ/nguy hiểm | `csurf` | Thư viện này đã bị deprecated bởi Express, nên thay thế. |
| `axios` version | `^1.7.7` | An toàn. |
| `jsonwebtoken` version | `^9.0.2` | An toàn. |

---

## 10. LOGGING & GIÁM SÁT

| Kiểm tra | File | Kết quả |
|----------|------|---------|
| Winston logger | `utils/logger.js` | ✅ Có sử dụng. |
| Audit log admin | `models/AuditLog.js` | ✅ Có ghi lại mọi hành động CRUD. |
| Ghi IP & User-Agent | `logAdminAction.js` | ✅ Đầy đủ. |
| Password logging | Toàn dự án | ✅ An toàn (Không tìm thấy pattern log password). |

---

## 11. ERROR HANDLING & LEAK INFORMATION

| Kiểm tra | File | Mức độ | Kết quả |
|----------|------|--------|---------|
| Error handler middleware| `errorHandler.js` | 🟢 TỐT | ✅ Xử lý tập trung. |
| Stack trace leak | `errorHandler.js` | 🟢 TỐT | ✅ Ẩn hoàn toàn trong Production. |
| Custom error messages | `errorHandler.js` | 🟢 TỐT | ✅ Không tiết lộ cấu trúc DB hay lỗi hệ thống. |

---

## 12. ENVIRONMENT VARIABLES (Từ .env.example)

| Biến môi trường | Dùng cho | Mức độ nhạy cảm | Ghi chú |
|----------------|----------|-----------------|---------|
| `MONGO_URI` | Database | 🔴 CAO | Cần bảo mật tuyệt đối. |
| `JWT_SECRET` | Auth | 🔴 CAO | Cần xoay vòng định kỳ. |
| `COOKIE_SECRET` | Session | 🔴 CAO | - |
| `RECAPTCHA_SECRET` | Bot protection | 🟡 TRUNG BÌNH | - |
| `BACKUP_ENCRYPTION_KEY` | Backup | 🔴 CAO | Nếu mất sẽ không thể restore. |

---

## 13. TỔNG HỢP RỦI RO & KHUYẾN NGHỊ

### 🔴 RỦI RO CAO (Cần xử lý ngay)
- Không phát hiện rủi ro nghiêm trọng đe dọa trực tiếp hệ thống.

### 🟠 RỦI RO TRUNG BÌNH (Nên xử lý)
- **Dependency `csurf`**: Thư viện này đã bị chính tác giả Express khuyến cáo không nên dùng tiếp. Nên chuyển sang các giải pháp thay thế hoặc đảm bảo cấu hình custom CSRF hiện tại đủ mạnh.
- **Whitelist CSRF**: Việc whitelist `/api/registrations` cho phép các request không có token. Cần đảm bảo `rateLimiter` và `captcha` ở endpoint này hoạt động cực tốt để tránh spam.

### 🟡 RỦI RO THẤP (Có thể cải thiện)
- **Log suspicious behavior**: Hiện tại chỉ detect `DELETE` nhiều lần. Nên thêm detect login thất bại nhiều lần từ một IP vào Audit Log.

### ✅ ĐIỂM MẠNH (Đã làm tốt)
- **Upload Security**: Làm cực tốt với việc kiểm tra Magic Number (nội dung thực) của file thay vì chỉ tin vào extension.
- **Session Control**: Có cơ chế phát hiện và ngăn chặn đăng nhập đa thiết bị (`activeSessionId`).
- **Data Sanitization**: Tích hợp đầy đủ `mongo-sanitize` và `xss-clean`.

---
*Báo cáo được thực hiện bởi Antigravity AI Security Auditor.*

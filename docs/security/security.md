# Security Overview - Lucy's Class

## 🔍 System Overview
The **Lucy's Class** application implements a "defense-in-depth" strategy, utilizing multiple layers of security at the network, application, and database levels. The system is designed to handle sensitive student data and administrative functions with high integrity and availability.

---

## 🎭 1. Threat Model (Simplified)

### Attacker Types
-   **Unauthenticated Bots**: Attempting brute-force login or spamming registration forms.
-   **Unauthorized Users**: Attempting to bypass the admin dashboard login.
-   **Malicious Insiders**: (Hypothetically) Attempting to download or tamper with backup data.
-   **Session Hijackers**: Attempting to reuse stolen tokens/cookies from a legitimate admin session.

### Key Attack Surfaces
-   **Admin API**: Endpoints for student, teacher, and timetable management.
-   **Auth Routes**: Login, Refresh, and Forgot Password endpoints.
-   **Backup Pipeline**: Transmission of data between the server and Google Drive.
-   **Public Forms**: Student registration, feedback, and course browsing.

---

## 🛡️ 2. Trust Boundaries

-   **Frontend (Untrusted)**: Resides on the user's browser. All data coming from the frontend is considered untrusted and must be validated.
-   **Backend (Trusted)**: The Node.js application server. This is where business logic, authentication, and authorization are enforced.
-   **Database (Restricted)**: MongoDB Atlas. Accessed only via the Backend using secure URI credentials. No direct public access allowed.
-   **External Services (Semi-Trusted)**:
    -   **Google Drive API**: Trust is established via OAuth2 tokens; data is encrypted locally before transmission.
    -   **Cloudinary**: Used for image storage; requests are signed and validated.

---

## 🔐 3. Authentication & Authorization

### JWT Handling & Session Logic
-   **Access Token**: 
    -   Type: JWT (HS256)
    -   Lifetime: **15 minutes**
    -   Storage: **In-Memory** (Client-side) to mitigate XSS theft.
-   **Refresh Token**: 
    -   Type: JWT (HS256)
    -   Lifetime: **7 days**
    -   Storage: **HttpOnly, Secure, SameSite=None** Cookie.
    -   **Rotation**: A new refresh token is issued on every refresh request; the old one is invalidated to prevent replay attacks.
-   **Single-Session Enforcement**: 
    -   Each admin login generates a unique `sessionId` stored in a session cookie and the database (`activeSessionId`).
    -   If a new login occurs on a different device, the previous `sessionId` becomes invalid, immediately forcing the older session to log out (detected via 10s polling or next API call).

### Role-Based Access Control (RBAC)
-   The system enforces an `admin` role for all management routes via the `auth` and `authorizeRoles('admin')` middlewares.

---

## 📦 4. Data Protection

### Encryption Standards
-   **Backup Encryption**: Uses **AES-256-GCM** (Authenticated Encryption). Every database backup is encrypted locally using a 32-byte hex key before being compressed or uploaded.
-   **Password Security**: Hashed using **Bcrypt** with a secure salt factor.
-   **Sensitive Data**: Emails and personal details are handled solely within the trusted backend environment.

### Sensitive Data Handling
-   Audit logs are maintained for all critical administrative actions (e.g., automated backups, manual restores).

---

## 🚀 5. API Security

### CSRF Protection (Two-Layered)
1.  **Custom Header Check**: All non-GET requests require an `X-Requested-With` header (automatically added by Axios), which is difficult for multi-origin malicious sites to forge.
2.  **Standard CSRF**: Utilizes the `csurf` library for stateful CSRF token validation on sensitive data-changing operations.
3.  **Origin Validation**: Strict checking of the `Origin` header against a whitelist of allowed domains defined in `CORS_ORIGINS`.

### Rate Limiting (Production Thresholds)
-   **Global API**: 200 requests per 5 minutes.
-   **Login**: **5 failed attempts per 10 minutes** (account locking after 5 failures).
-   **Registration**: 5 attempts per 1 hour.
-   **Forgot Password**: 3 attempts per 1 hour.
-   **Reset Password**: 5 attempts per 30 minutes.

### Input Validation & Error Handling
-   **Validation**: Every endpoint uses `express-validator` to enforce strict schemas on all `req.body` and `req.params`.
-   **Error Masking**: Production errors are sanitized; stack traces are never returned to the client to prevent environmental leakage.

---

## 📂 6. Backup & Restore Security

### Secure Pipeline
-   **Zero-Knowledge Upload**: Backups are encrypted at rest on the server before being transmitted to Google Drive via HTTPS.
-   **Drive Safety**: The system maintains only the last **20 backups** using an automated rotation policy in `drive.service.js`.

### Safe Restoration
-   **Validation Run**: The `restore.service.js` performs a "dry-run" by restoring data into a **temporary database** first to ensure the backup isn't corrupted.
-   **Safety Snapshot**: A local safety backup is taken immediately before the production database is cleared (`--drop`).
-   **Cleanup**: Temporary decrypted ZIP files and extraction folders are immediately wiped from disk upon completion or failure.

---

## 💻 7. Frontend Security

-   **Token Storage**: Tokens are kept in JavaScript memory, never in `localStorage`, significantly reducing the risk of token theft via XSS.
-   **Axios Interceptors**: Automated handling of CSRF token fetching and refresh token calls.
-   **reCAPTCHA v2**: Integrated into **Login** and **Forgot Password** forms to prevent automated brute-force attacks.

---

## 🚩 8. Potential Risks & Improvements

-   **Risk**: Centralized encryption key in `.env` could be a single point of failure if the server environment is compromised.
    -   *Improvement*: Integrate with a dedicated Secrets Management service (e.g., AWS Secrets Manager or HashiCorp Vault) for enterprise-grade key rotation.
-   **Risk**: Google Drive storage relies on a single service account.
    -   *Improvement*: Implement secondary offsite backup storage (e.g., AWS S3 with Object Lock) for enhanced disaster recovery.
-   **Improvement**: Implement IP-based anomaly detection to block distributed brute-force attacks that stay under the per-IP rate limit.

---

# Advanced Security Audit (Updated)

This section documents the transition from identified vulnerabilities to verified mitigations.

## 1. Stored XSS (FIXED)

### Description (Before)
- User input from public forms (registration, feedback) and admin panels was stored without sanitization.
- This allowed injection of malicious scripts like: `<script>alert('XSS')</script>`
- Risk: Script execution in admin dashboard → session hijacking.

### Fix Implemented
- **Backend Sanitization**: Introduced `sanitize-html` to strip all HTML tags from user strings.
- **Centralized Utility**: Created `backend/utils/sanitize.js` with a strict `cleanInput()` function.
- **Comprehensive Application**: Applied sanitization BEFORE saving to DB in all critical controllers:
  - `registrationController`, `feedbackController`, `announcementController`, `courseController`, `teacherController`, `timetableController`, `rankingController`.
- **Logic Cleanup**: Removed legacy `escapeHtml()` from the teacher controller to prevent double-encoding issues.
- **Frontend Hardening**: Verified and ensured that the frontend does NOT use `dangerouslySetInnerHTML` for any user-controlled data.

### Result
- All HTML tags are stripped and stored as plain text.
- XSS payloads are neutralized at the entry point.
- Verified via manual browser testing with script and image-based payloads.

---

## 2. Destructive Restore Abuse (FIXED)

### Description (Before)
- The restore endpoint (`/api/auth/google/restore`) could be triggered with minimal protection.
- Only required standard authentication (JWT).
- No strong confirmation or identity re-verification existed.
- Risk: A compromised admin session could be used to overwrite the entire production database.

### Fix Implemented

#### 2.1 Explicit Confirmation Guard
- The system now requires a specific string literal: `confirm === "CONFIRM"`.
- This prevents accidental triggers or simple boolean-based bypasses.

#### 2.2 Admin Password Re-authentication
- The backend now enforces a "sudo-style" re-authentication.
- Admins must re-enter their password, which is verified using `bcrypt.compare()` against the database before any restore logic begins.
- This ensures that even with a stolen session token, an attacker cannot perform destructive actions without the plaintext password.

#### 2.3 Comprehensive Audit Logging
- Every restore attempt is now logged with high granularity:
  - `adminId` and `adminName`.
  - Action status (`RESTORE_ATTEMPT`, `RESTORE_SUCCESS`, or `RESTORE_FAILED`).
  - Origin IP address.
- Logs are recorded *before* the process starts to ensure traceability even in the event of a crash.

#### 2.4 Anti-Automation Safety Delay
- Implemented a mandatory **4-second artificial delay** before the restore execution starts.
- This makes scripted abuse impractical and provides a window for log monitoring tools to detect and flag anomalous activity.

#### 2.5 Logic & Scope Fixes
- **Model Integrity**: Fixed incorrect model references (changed legacy `User` references to the correct `Admin` model).
- **Cleanup Safety**: Fixed a scope issue with `tempZipPath` to ensure temporary files are properly deleted even if the download or decryption fails.

---

## 3. Verification Summary

### Stored XSS Test
- **Payload**: `<script>alert('XSS')</script>`
- **Result**: Stored as plain text `" alert('XSS') "`, rendered safely as text. No execution.
- **Payload**: `<img src=x onerror=alert(1)>`
- **Result**: Tags stripped, no execution.

### Restore Abuse Test
- **Scenario**: Incorrect password entered.
- **Result**: Request blocked with `"Password incorrect"` (401).
- **Scenario**: Correct password + `CONFIRM` string.
- **Result**: 4-second delay followed by successful background restoration.

---

## 4. Final Security Status

| Vulnerability | Severity | Status |
| :--- | :--- | :--- |
| **Stored XSS** | **HIGH** | ✅ **FIXED** |
| **Restore Abuse** | **CRITICAL** | ✅ **FIXED** |
| **Rate Limit Gaps** | **MEDIUM** | ⚠️ *Partial (Ongoing)* |
| **CSRF Inconsistent** | **LOW** | ⚠️ *Monitored* |

---

## 5. Conclusion

The "Lucy's Class" security posture has been significantly hardened through:
- **Strict Input Sanitization**: Neutralizing the #1 vector for admin takeover.
- **Defense-in-Depth for Destructive Actions**: Requiring re-authentication for high-risk operations.
- **Enhanced Traceability**: Ensuring all critical actions leave a permanent, verifiable log.

The system is now better prepared for production deployment with robust protections against both automated bots and sophisticated session abuse.

---

# Tổng quan Bảo mật - Lớp học của Lucy (Bản dịch tiếng Việt)

## 🔍 Tổng quan Hệ thống
Ứng dụng **Lucy's Class** triển khai chiến lược "phòng thủ theo chiều sâu", sử dụng nhiều lớp bảo mật ở các cấp độ mạng, ứng dụng và cơ sở dữ liệu. Hệ thống được thiết kế để xử lý dữ liệu học sinh nhạy cảm và các chức năng quản trị với tính toàn vẹn và sẵn sàng cao.

---

## 🎭 1. Mô hình Mối đe dọa (Rút gọn)

### Các loại đối tượng tấn công
-   **Bot chưa xác thực**: Cố gắng đăng nhập brute-force hoặc spam các biểu mẫu đăng ký.
-   **Người dùng chưa được cấp quyền**: Cố gắng vượt qua lớp đăng nhập bảng điều khiển quản trị.
-   **Kẻ xấu nội bộ**: (Giả định) Cố gắng tải xuống hoặc làm xáo trộn dữ liệu sao lưu.
-   **Kẻ đánh cắp phiên làm việc**: Cố gắng sử dụng lại các token/cookie bị đánh cắp từ một phiên làm việc hợp lệ của quản trị viên.

### Các bề mặt tấn công chính
-   **Admin API**: Các điểm cuối (endpoints) để quản lý học sinh, giáo viên và thời khóa biểu.
-   **Auth Routes**: Các điểm cuối Đăng nhập, Làm mới và Quên mật khẩu.
-   **Luồng dữ liệu sao lưu**: Truyền dữ liệu giữa máy chủ và Google Drive.
-   **Biểu mẫu công khai**: Đăng ký học sinh, phản hồi và xem khóa học.

---

## 🛡️ 2. Ranh giới Tin cậy

-   **Frontend (Không tin cậy)**: Nằm trên trình duyệt của người dùng. Tất cả dữ liệu đến từ frontend đều được coi là không tin cậy và phải được xác thực.
-   **Backend (Tin cậy)**: Máy chủ ứng dụng Node.js. Đây là nơi thực thi logic nghiệp vụ, xác thực và phân quyền.
-   **Cơ sở dữ liệu (Hạn chế)**: MongoDB Atlas. Chỉ được truy cập thông qua Backend bằng thông tin xác thực URI bảo mật. Không cho phép truy cập công khai trực tiếp.
-   **Dịch vụ bên ngoài (Bán tin cậy)**:
    -   **Google Drive API**: Sự tin cậy được thiết lập qua token OAuth2; dữ liệu được mã hóa cục bộ trước khi truyền đi.
    -   **Cloudinary**: Được sử dụng để lưu trữ hình ảnh; các yêu cầu được ký và xác thực.

---

## 🔐 3. Xác thực & Phân quyền

### Xử lý JWT & Logic Phiên làm việc
-   **Access Token**: 
    -   Loại: JWT (HS256)
    -   Thời hạn: **15 phút**
    -   Lưu trữ: **Trong bộ nhớ** (phía Client) để giảm thiểu rủi ro bị đánh cắp qua XSS.
-   **Refresh Token**: 
    -   Loại: JWT (HS256)
    -   Thời hạn: **7 ngày**
    -   Lưu trữ: **Cookie HttpOnly, Secure, SameSite=None**.
    -   **Xoay vòng**: Một refresh token mới được cấp sau mỗi yêu cầu làm mới; token cũ sẽ bị vô hiệu hóa để ngăn chặn các cuộc tấn công phát lại (replay attacks).
-   **Thực thi Phiên đơn duy nhất**: 
    -   Mỗi lần đăng nhập admin tạo ra một `sessionId` duy nhất được lưu trong cookie và cơ sở dữ liệu (`activeSessionId`).
    -   Nếu một đăng nhập mới xảy ra trên thiết bị khác, `sessionId` trước đó sẽ trở nên vô hiệu, buộc phiên làm việc cũ phải đăng xuất ngay lập tức.

### Kiểm soát truy cập dựa trên vai trò (RBAC)
-   Hệ thống thực thi vai trò `admin` cho tất cả các luồng quản lý thông qua các middleware `auth` và `authorizeRoles('admin')`.

---

## 📦 4. Bảo vệ Dữ liệu

### Tiêu chuẩn Mã hóa
-   **Mã hóa Sao lưu**: Sử dụng **AES-256-GCM** (Mã hóa có xác thực). Mọi bản sao lưu cơ sở dữ liệu đều được mã hóa cục bộ bằng khóa hex 32 byte trước khi nén hoặc tải lên.
-   **Bảo mật Mật khẩu**: Được băm bằng **Bcrypt** với hệ số salt bảo mật.
-   **Dữ liệu nhạy cảm**: Email và chi tiết cá nhân chỉ được xử lý trong môi trường backend tin cậy.

### Xử lý Dữ liệu Nhạy cảm
-   Nhật ký kiểm tra (Audit logs) được duy trì cho tất cả các hành động quản trị quan trọng (ví dụ: sao lưu tự động, khôi phục thủ công).

---

## 🚀 5. Bảo mật API

### Bảo vệ CSRF (Hai lớp)
1.  **Kiểm tra Header tùy chỉnh**: Tất cả các yêu cầu không phải GET đều yêu cầu header `X-Requested-With`, điều này gây khó khăn cho các trang web độc hại đa nguồn trong việc giả mạo.
2.  **CSRF Tiêu chuẩn**: Sử dụng thư viện `csurf` để xác thực token CSRF có trạng thái cho các hoạt động thay đổi dữ liệu nhạy cảm.
3.  **Xác thực Nguồn (Origin)**: Kiểm tra nghiêm ngặt header `Origin` so với danh sách cho phép được định nghĩa trong `CORS_ORIGINS`.

### Giới hạn tốc độ (Ngưỡng sản xuất)
-   **API chung**: 200 yêu cầu mỗi 5 phút.
-   **Đăng nhập**: **5 lần thử thất bại mỗi 10 phút** (khóa tài khoản sau 5 lần thất bại).
-   **Đăng ký**: 5 lần thử mỗi 1 giờ.
-   **Quên mật khẩu**: 3 lần thử mỗi 1 giờ.
-   **Đặt lại mật khẩu**: 5 lần thử mỗi 30 phút.

### Xác thực đầu vào & Xử lý lỗi
-   **Xác thực**: Mọi điểm cuối đều sử dụng `express-validator` để thực thi các schema nghiêm ngặt trên `req.body` và `req.params`.
-   **Che dấu lỗi**: Các lỗi trong môi trường sản xuất được làm sạch; các dấu vết ngăn xếp (stack traces) không bao giờ được trả về cho client để ngăn chặn rò rỉ thông tin môi trường.

---

## 📂 6. Bảo mật Sao lưu & Khôi phục

### Luồng dữ liệu bảo mật
-   **Tải lên Zero-Knowledge**: Các bản sao lưu được mã hóa ở trạng thái nghỉ trên máy chủ trước khi được truyền đến Google Drive qua HTTPS.
-   **An toàn Drive**: Hệ thống chỉ duy trì **20 bản sao lưu** gần nhất bằng chính sách xoay vòng tự động trong `drive.service.js`.

### Khôi phục an toàn
-   **Chạy thử xác minh**: `restore.service.js` thực hiện khôi phục dữ liệu vào một **cơ sở dữ liệu tạm thời** trước để đảm bảo bản sao lưu không bị hỏng.
-   **Ảnh chụp an toàn**: Một bản sao lưu an toàn cục bộ được thực hiện ngay trước khi cơ sở dữ liệu sản xuất được xóa sạch (`--drop`).
-   **Dọn dẹp**: Các tệp ZIP đã giải mã tạm thời và các thư mục giải nén sẽ được xóa khỏi ổ đĩa ngay sau khi hoàn thành hoặc thất bại.

---

## 💻 7. Bảo mật Frontend

-   **Lưu trữ Token**: Token được giữ trong bộ nhớ JavaScript, không bao giờ để trong `localStorage`, giúp giảm đáng kể rủi ro bị mất token qua XSS.
-   **Axios Interceptors**: Tự động xử lý việc lấy token CSRF và các cuộc gọi làm mới token.
-   **reCAPTCHA v2**: Được tích hợp vào các biểu mẫu **Đăng nhập** và **Quên mật khẩu** để ngăn chặn các cuộc tấn công brute-force tự động.

---

## 🚩 8. Rủi ro Tiềm ẩn & Cải thiện

-   **Rủi ro**: Khóa mã hóa tập trung trong `.env` có thể là một điểm yếu duy nhất nếu môi trường máy chủ bị xâm nhập.
    -   *Cải thiện*: Tích hợp với dịch vụ Quản lý Khóa chuyên dụng (ví dụ: AWS Secrets Manager).
-   **Rủi ro**: Lưu trữ Google Drive phụ thuộc vào một tài khoản dịch vụ duy nhất.
    -   *Cải thiện*: Triển khai lưu trữ sao lưu phụ ở nơi khác (ví dụ: AWS S3).
-   **Cải thiện**: Triển khai phát hiện bất thường dựa trên IP để chặn các cuộc tấn công brute-force phân tán.

---

# Kiểm tra Bảo mật Nâng cao (Đã cập nhật)

Phần này ghi lại quá trình chuyển đổi từ các lỗ hổng đã xác định sang các biện pháp giảm thiểu đã được xác minh.

## 1. Lỗ hổng Stored XSS (ĐÃ KHẮC PHỤC)

### Mô tả (Trước đây)
- Dữ liệu nhập từ người dùng qua các biểu mẫu công khai (đăng ký, phản hồi) và bảng điều khiển quản trị được lưu trữ mà không qua kiểm duyệt.
- Điều này cho phép chèn các mã độc như: `<script>alert('XSS')</script>`
- Nguy cơ: Thực thi mã độc trong bảng điều khiển quản trị -> đánh cắp phiên làm việc (session hijacking).

### Giải pháp đã triển khai
- **Kiểm duyệt phía Backend**: Sử dụng thư viện `sanitize-html` để loại bỏ tất cả các thẻ HTML khỏi chuỗi dữ liệu của người dùng.
- **Tiện ích tập trung**: Tạo tệp `backend/utils/sanitize.js` với hàm `cleanInput()` nghiêm ngặt.
- **Áp dụng toàn diện**: Thực hiện kiểm duyệt TRƯỚC KHI lưu vào DB trong tất cả các controller quan trọng:
  - `registrationController`, `feedbackController`, `announcementController`, `courseController`, `teacherController`, `timetableController`, `rankingController`.
- **Dọn dẹp Logic**: Loại bỏ hàm `escapeHtml()` cũ trong teacher controller để tránh lỗi mã hóa kép (double-encoding).
- **Thắt chặt Frontend**: Xác minh và đảm bảo rằng frontend KHÔNG sử dụng `dangerouslySetInnerHTML` cho bất kỳ dữ liệu nào do người dùng kiểm soát.

### Kết quả
- Tất cả các thẻ HTML bị loại bỏ và lưu trữ dưới dạng văn bản thuần túy.
- Các mã độc XSS bị vô hiệu hóa ngay tại điểm nhập liệu.
- Đã xác minh qua kiểm tra thủ công trên trình duyệt với các mã độc dựa trên script và hình ảnh.

---

## 2. Lạm dụng khôi phục dữ liệu (ĐÃ KHẮC PHỤC)

### Mô tả (Trước đây)
- Điểm cuối khôi phục (`/api/auth/google/restore`) có thể bị kích hoạt với bảo vệ tối thiểu.
- Chỉ yêu cầu xác thực tiêu chuẩn (JWT).
- Không có bước xác nhận mạnh mẽ hoặc xác minh lại danh tính.
- Nguy cơ: Một phiên làm việc của admin bị xâm nhập có thể bị lợi dụng để ghi đè toàn bộ cơ sở dữ liệu sản xuất.

### Giải pháp đã triển khai

#### 2.1 Lớp bảo vệ xác nhận rõ ràng
- Hệ thống hiện yêu cầu một chuỗi ký tự cụ thể: `confirm === "CONFIRM"`.
- Điều này ngăn chặn việc kích hoạt vô tình hoặc các hành vi vượt qua dựa trên giá trị boolean đơn giản.

#### 2.2 Xác thực lại mật khẩu Admin
- Backend hiện thực thi cơ chế xác thực lại kiểu "sudo".
- Quản trị viên phải nhập lại mật khẩu của họ, mật khẩu này được xác minh bằng `bcrypt.compare()` với cơ sở dữ liệu trước khi bất kỳ logic khôi phục nào bắt đầu.
- Điều này đảm bảo rằng ngay cả khi mã thông báo phiên (session token) bị đánh cắp, kẻ tấn công cũng không thể thực hiện các hành động phá hủy nếu không có mật khẩu dạng văn bản thuần túy.

#### 2.3 Hệ thống nhật ký (Audit Log) chi tiết
- Mọi lần thử khôi phục hiện được ghi nhật ký với độ chi tiết cao:
  - `adminId` và `adminName`.
  - Trạng thái hành động (`RESTORE_ATTEMPT`, `RESTORE_SUCCESS`, hoặc `RESTORE_FAILED`).
  - Địa chỉ IP nguồn.
- Nhật ký được ghi lại *trước khi* quá trình bắt đầu để đảm bảo khả năng truy vết ngay cả khi xảy ra lỗi hệ thống.

#### 2.4 Độ trễ an toàn chống tự động hóa
- Triển khai **độ trễ nhân tạo bắt buộc 4 giây** trước khi quá trình khôi phục bắt đầu thực thi.
- Điều này khiến việc lạm dụng bằng script hoặc tấn công vét cạn (brute-force) trở nên bất khả thi và tạo ra một khoảng thời gian để các công cụ giám sát nhật ký phát hiện các hoạt động bất thường.

#### 2.5 Sửa lỗi logic và phạm vi biến
- **Tính toàn vẹn của Model**: Sửa các tham chiếu model không chính xác (thay đổi các tham chiếu `User` cũ thành model `Admin` chính xác).
- **An toàn dọn dẹp**: Sửa lỗi phạm vi biến của `tempZipPath` để đảm bảo các tệp tạm thời được xóa đúng cách ngay cả khi việc tải xuống hoặc giải mã thất bại.

---

## 3. Tóm tắt xác minh

### Kiểm tra Stored XSS
- **Mã độc**: `<script>alert('XSS')</script>`
- **Kết quả**: Được lưu trữ dưới dạng văn bản thuần túy `" alert('XSS') "`, hiển thị an toàn dưới dạng văn bản. Không thực thi.
- **Mã độc**: `<img src=x onerror=alert(1)>`
- **Kết quả**: Các thẻ bị loại bỏ, không thực thi.

### Kiểm tra lạm dụng khôi phục
- **Kịch bản**: Nhập sai mật khẩu.
- **Kết quả**: Yêu cầu bị chặn với thông báo `"Password incorrect"` (401).
- **Kịch bản**: Nhập đúng mật khẩu + chuỗi `CONFIRM`.
- **Kết quả**: Độ trễ 4 giây sau đó quá trình khôi phục chạy nền thành công.

---

## 4. Trạng thái bảo mật cuối cùng

| Lỗ hổng | Mức độ nghiêm trọng | Trạng thái |
| :--- | :--- | :--- |
| **Stored XSS** | **CAO** | ✅ **ĐÃ KHẮC PHỤC** |
| **Lạm dụng khôi phục** | **CHÍ THÂN** | ✅ **ĐÃ KHẮC PHỤC** |
| **Lỗ hổng giới hạn tốc độ** | **TRUNG BÌNH** | ⚠️ *Một phần (Đang xử lý)* |
| **Bất cập CSRF** | **THẤP** | ⚠️ *Đang giám sát* |

---

## 5. Kết luận

Cấu hình bảo mật của "Lucy's Class" đã được thắt chặt đáng kể thông qua:
- **Kiểm duyệt đầu vào nghiêm ngặt**: Vô hiệu hóa vector tấn công hàng đầu để chiếm quyền điều khiển admin.
- **Phòng thủ theo chiều sâu cho các hành động phá hủy**: Yêu cầu xác thực lại cho các hoạt động có rủi ro cao.
- **Tăng cường khả năng truy vết**: Đảm bảo tất cả các hành động quan trọng đều để lại nhật ký vĩnh viễn, có thể xác minh được.

Hệ thống hiện đã chuẩn bị tốt hơn cho việc triển khai thực tế với các biện pháp bảo vệ mạnh mẽ chống lại cả bot tự động và các hình thức lạm dụng phiên làm việc tinh vi.

---

# 🔐 Security Audit Report (Auto Generated)

## 🟢 Summary

* **Overall risk level:** LOW
* **Key concerns:** The system implements a robust defense-in-depth strategy. Core vulnerabilities like XSS and backup abuse have been structurally neutralized. Minor concerns exist regarding deprecated dependency usage, missing strict typing on password inputs, and potential rate-limit scalability.

## 🔴 Critical Issues

*None found.*

## 🟠 Medium Issues

*None found.*

## 🟡 Minor Issues

1. **Unstrict Password Typing in Authentication**
   * **Explanation:** In `backend/controllers/authController.js`, `req.body.password` is passed directly to `bcrypt.compare`. If an attacker passes an object (e.g., `{ $gt: "" }`) instead of a string, `bcrypt` might crash, leading to an unhandled rejection (500 error). 
   * **File Path:** `backend/controllers/authController.js`
   * **Fix:** Explicitly cast to string: `const isMatch = await bcrypt.compare(String(password), user.password);`

2. **Deprecated Security Dependencies**
   * **Explanation:** The project uses `xss-clean` (v0.1.4), which is unmaintained and considered deprecated. While effective for basic cases, it might not cover all modern XSS vectors. The project currently supplements this safely with `sanitize-html`.
   * **File Path:** `backend/package.json`
   * **Fix:** Migrate entirely to `sanitize-html` configured as a global middleware, or adopt `dompurify` in a Node environment.

3. **Inconsistent CSRF Application**
   * **Explanation:** As noted in comments, the `/api/auth/login` route intentionally skips CSRF enforcement. This introduces a theoretical Login-CSRF vulnerability (where an attacker logs the victim into the attacker's account). 
   * **File Path:** `backend/routes/authRoutes.js` 
   * **Fix:** Enforce CSRF on login, or accept the risk if Login-CSRF has minimal impact on this system's threat model.

## 🛠 Recommendations

* **Input Type Validation:** Implement strict schema validation (e.g., via `Joi` or `express-validator`) across all auth routes, not just registrations and streaks. This prevents NoSQL object injection vectors proactively.
* **Rate-Limit Store:** `express-rate-limit` is configured using memory storage. If scaling to multiple instances, configure it to use the already-installed `rate-limit-redis` to prevent users from bypassing limits by hitting different load-balanced nodes.
* **Security Middleware Review:** Ensure `CORS_ORIGINS` is strictly defined in production without permissive defaults. The fallback to local dev URLs if empty is convenient but could be unsafe in misconfigured production environments.

## 📁 Files Reviewed

* `backend/server.js`
* `backend/controllers/authController.js`
* `backend/routes/authRoutes.js`
* `backend/middlewares/rateLimiter.js`
* `frontend/src/services/api.js`
* `backend/package.json` & `frontend/package.json`

---

# 🔐 Báo cáo Kiểm tra Bảo mật (Tự động tạo)

## 🟢 Tóm tắt

* **Mức độ rủi ro tổng thể:** THẤP (LOW)
* **Các mối quan tâm chính:** Hệ thống triển khai chiến lược phòng thủ theo chiều sâu (defense-in-depth) mạnh mẽ. Các lỗ hổng cốt lõi như XSS và lạm dụng khôi phục dữ liệu đã được vô hiệu hóa về mặt cấu trúc. Một số quan ngại nhỏ bao gồm việc sử dụng thư viện đã lỗi thời, thiếu ràng buộc kiểu dữ liệu nghiêm ngặt cho mật khẩu và khả năng mở rộng của hệ thống giới hạn tốc độ (rate-limit).

## 🔴 Vấn đề Nghiêm trọng (Critical)

*Không phát hiện.*

## 🟠 Vấn đề Trung bình (Medium)

*Không phát hiện.*

## 🟡 Vấn đề Nhỏ (Minor)

1. **Thiếu kiểu dữ liệu chặt chẽ cho Mật khẩu trong Xác thực**
   * **Giải thích:** Trong `backend/controllers/authController.js`, `req.body.password` được truyền trực tiếp vào `bcrypt.compare`. Nếu kẻ tấn công truyền vào một object (ví dụ: `{ $gt: "" }`) thay vì một chuỗi (string), `bcrypt` có thể gặp lỗi crash hệ thống, dẫn đến lỗi unhandled rejection (lỗi 500). 
   * **Đường dẫn tệp:** `backend/controllers/authController.js`
   * **Cách khắc phục:** Ép kiểu rõ ràng sang dạng chuỗi: `const isMatch = await bcrypt.compare(String(password), user.password);`

2. **Các thư viện bảo mật đã lỗi thời**
   * **Giải thích:** Dự án sử dụng `xss-clean` (v0.1.4), một thư viện không còn được bảo trì và bị coi là lỗi thời. Mặc dù vẫn hiệu quả với các trường hợp cơ bản, nó có thể không bao phủ hết các kỹ thuật XSS hiện đại. Hệ thống hiện tại đã bổ sung an toàn bằng `sanitize-html`.
   * **Đường dẫn tệp:** `backend/package.json`
   * **Cách khắc phục:** Chuyển đổi hoàn toàn sang `sanitize-html` được cấu hình dưới dạng một middleware toàn cục (global middleware), hoặc áp dụng `dompurify` trong môi trường Node.

3. **Áp dụng CSRF không nhất quán**
   * **Giải thích:** Như đã ghi chú trong code, luồng `/api/auth/login` cố ý bỏ qua kiểm tra CSRF. Điều này gây ra một lỗ hổng Login-CSRF trên lý thuyết (nơi kẻ tấn công đăng nhập nạn nhân vào tài khoản của kẻ tấn công). 
   * **Đường dẫn tệp:** `backend/routes/authRoutes.js` 
   * **Cách khắc phục:** Buộc kiểm tra CSRF khi đăng nhập, hoặc chấp nhận rủi ro nếu Login-CSRF có tác động tối thiểu đến mô hình mối đe dọa của hệ thống này.

## 🛠 Khuyến nghị

* **Xác thực Kiểu dữ liệu Đầu vào:** Triển khai xác thực schema nghiêm ngặt (ví dụ: qua `Joi` hoặc `express-validator`) trên toàn bộ các tuyến (routes) xác thực, không chỉ giới hạn ở đăng ký và streak. Điều này ngăn chặn chủ động các vector chèn object NoSQL.
* **Bộ lưu trữ giới hạn tốc độ (Rate-Limit Store):** `express-rate-limit` đang được cấu hình sử dụng bộ nhớ (memory storage). Nếu mở rộng lên nhiều server (instances), hãy cấu hình để sử dụng thư viện `rate-limit-redis` đã được cài đặt sẵn nhằm ngăn người dùng lách giới hạn bằng cách truy cập các node cân bằng tải khác nhau.
* **Đánh giá Security Middleware:** Đảm bảo `CORS_ORIGINS` được định nghĩa nghiêm ngặt trong môi trường production không có các mặc định dễ dãi. Việc dùng URL local dev làm phương án dự phòng khi trống là tiện lợi nhưng có thể không an toàn nếu môi trường production cấu hình sai.

## 📁 Các tệp đã xem xét

* `backend/server.js`
* `backend/controllers/authController.js`
* `backend/routes/authRoutes.js`
* `backend/middlewares/rateLimiter.js`
* `frontend/src/services/api.js`
* `backend/package.json` & `frontend/package.json`

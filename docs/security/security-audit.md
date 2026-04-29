# Security Audit

- Audit date: 2026-04-29
- Scope: `backend`, `frontend`
- Method:
  - static code review FE/BE
  - route-controller-role flow review
  - auth/session/CSRF/CORS/rate-limit review
  - upload/export/attendance/streak/backup-restore review
  - dependency audit bằng `npm audit --omit=dev --json` cho cả FE và BE
- Config basis allowed to read:
  - `backend/.env.example`
  - `frontend/.env.example`
- Explicit exclusion:
  - không đọc `backend/.env`
  - không đọc `frontend/.env`
  - không đọc `*.env.production`
  - không đọc secret thật hay key thật

## 1. Kết luận nhanh

Mức bảo mật hiện tại của hệ thống: **Khá / Trung bình khá**.

Đánh giá tổng quan sau lần scan này:

- không thấy lỗ hổng `Critical` kiểu RCE, public file upload tùy ý, auth bypass không cần đăng nhập, hay lộ secret hardcode trong phạm vi đã đọc;
- `npm audit --omit=dev --json` hiện trả về `0 vulnerabilities` cho cả `backend` và `frontend` tại thời điểm scan;
- hệ thống đã có nhiều lớp nền tảng tốt:
  - `helmet`
  - `CORS` allowlist
  - CSRF check theo `Origin` + `X-Requested-With`
  - `httpOnly` refresh cookie
  - access token in-memory ở FE
  - rate limit
  - reCAPTCHA cho form nhạy cảm
  - sanitize input
  - upload ảnh có kiểm tra magic bytes + re-encode
- tuy nhiên vẫn còn một số rủi ro logic và hardening ở mức `Medium` cần xử lý, chủ yếu nằm ở:
  - lệch rule phân quyền giáo viên phụ so với nghiệp vụ đã chốt
  - cơ chế chống abuse/log IP đang tin vào `x-forwarded-for` theo cách có thể bị giả mạo
  - điểm danh lớp cho phép ghi đè dữ liệu lịch sử quá rộng, thiếu audit/versioning phù hợp

Điểm tham chiếu nội bộ: **7.6/10**.

## 2. Loại trừ theo mô tả hệ thống

Các điểm dưới đây không bị coi là lỗ hổng trong audit này vì bạn đã mô tả rõ đây là chủ đích nghiệp vụ.

### 2.1 Điểm danh dùng chung cho giáo viên chính và giáo viên phụ

Accepted business rule:

- 1 khóa học có 1 giáo viên chính
- tối đa 4 giáo viên phụ
- các giáo viên của khóa học được cùng xem lớp và thay nhau điểm danh
- dữ liệu điểm danh được đồng bộ giữa các giáo viên của cùng khóa

Kết luận:

- việc 5 giáo viên cùng có quyền xem danh sách lớp và điểm danh cho cùng khóa **không bị tính là broken access control**;
- audit chỉ xem đây là vấn đề nếu code cho phép vượt quá phạm vi 1 chính + 4 phụ, hoặc cho người ngoài khóa truy cập.

### 2.2 Streak cho phép check-in hộ

Accepted business rule:

- streak là mini game marketing
- có chủ đích nới lỏng để giữ chân user
- cho phép check-in hộ

Kết luận:

- audit không coi riêng việc “check-in hộ” là lỗi auth của hệ thống lõi;
- phần này vẫn được xem là khu vực `low-trust` về privacy và abuse, nhưng là **accepted risk** theo mô tả hiện tại.

### 2.3 Excel chủ yếu là export, không có upload Excel công khai

Accepted business rule:

- hệ thống chủ yếu xuất file Excel
- không có role public upload Excel lên server

Kết luận:

- audit không đưa nhóm rủi ro “malicious spreadsheet upload” vào findings chính;
- phần Excel được đánh giá chủ yếu theo hướng lộ dữ liệu khi export.

## 3. Điểm mạnh hiện có

### 3.1 Authentication và session

- FE không lưu access token vào `localStorage`; token đang giữ in-memory tại `frontend/src/services/api.js`.
- Refresh token dùng cookie `httpOnly`, `withCredentials: true`, có session conflict check.
- Có cơ chế single-session thực tế qua `activeSessionId`.

File tham chiếu:

- `frontend/src/services/api.js`
- `frontend/src/contexts/AuthContext.jsx`
- `backend/controllers/authController.js`
- `backend/middlewares/auth.js`

### 3.2 Bảo vệ request và trình duyệt

- Có `helmet` và CSP cơ bản trong `backend/server.js`.
- Có kiểm tra CSRF cho request thay đổi dữ liệu dựa trên `Origin` và header `X-Requested-With`.
- CORS dùng danh sách origin cho phép, không mở `*`.

File tham chiếu:

- `backend/server.js`
- `backend/middlewares/securityMiddleware.js`

### 3.3 Upload ảnh

- Chỉ cho phép ảnh `jpeg/png/webp`
- kiểm tra extension + MIME + magic bytes
- dùng `sharp` để re-encode, strip metadata, hạn chế pixel bomb
- giới hạn kích thước file và số part

File tham chiếu:

- `backend/middlewares/upload.js`

### 3.4 Dependency audit

Kết quả runtime dependency audit tại thời điểm scan:

- `backend`: `0 vulnerabilities`
- `frontend`: `0 vulnerabilities`

Lưu ý:

- đây là kết quả của `npm audit` trên dependency tree hiện có trong workspace ở ngày 2026-04-29;
- nó không thay thế cho code review logic nghiệp vụ.

## 4. Findings còn tồn tại

### F1. Medium - Rule “tối đa 4 giáo viên phụ” chưa được khóa đúng ở backend

- Mức độ: `Medium`
- Nhóm ảnh hưởng: access surface / privacy / policy drift
- File ảnh hưởng:
  - `backend/controllers/courseController.js`
  - `backend/models/Course.js`

Mô tả:

- nghiệp vụ bạn mô tả đã chốt rõ: 1 giáo viên chính và tối đa 4 giáo viên phụ;
- nhưng backend hiện cho phép tới `15` `additionalTeachers` trong `parseAdditionalTeachers`;
- model `Course` cũng chưa thấy giới hạn mảng giáo viên phụ bám theo rule 4.

Rủi ro:

- khi số giáo viên phụ vượt quá rule nghiệp vụ, phạm vi tài khoản được xem danh sách học sinh, note, điểm danh và export attendance cũng bị mở rộng theo;
- đây không phải lỗi ở ý tưởng “5 giáo viên cùng khóa được xem lớp”, mà là lỗi ở chỗ code đang cho phép **nhiều hơn 5 người** nếu dữ liệu bị cấu hình sai hoặc bị lạm dụng.

Hướng giải quyết:

- đổi hard limit backend từ `15` về `4`;
- thêm validate ở model/schema hoặc validator để chặn từ tầng dữ liệu;
- rà lại FE form tạo/sửa khóa học để đồng bộ cùng giới hạn;
- thêm test cho 3 case:
  - `0-4` giáo viên phụ được phép
  - `5+` giáo viên phụ bị từ chối
  - không cho trùng giữa giáo viên chính và giáo viên phụ

### F2. Medium - Logic chống abuse và audit IP đang tin vào `x-forwarded-for` theo cách có thể bị giả mạo

- Mức độ: `Medium`
- Nhóm ảnh hưởng: brute-force protection / audit integrity / IP blocking
- File ảnh hưởng:
  - `backend/middlewares/checkBlockedIP.js`
  - `backend/controllers/authController.js`
  - `backend/utils/logAdminAction.js`

Mô tả:

- một số chỗ đang lấy IP bằng cách đọc trực tiếp `req.headers['x-forwarded-for']`;
- cách này bỏ qua logic proxy trust chuẩn của Express ở `req.ip`;
- nếu header này bị giả mạo hoặc proxy chain không được chuẩn hóa đúng, attacker có thể:
  - làm sai log audit
  - né chặn IP
  - làm lệch thống kê login fail theo IP

Rủi ro:

- đây không phải auth bypass trực tiếp;
- nhưng nó làm yếu các lớp phòng thủ phụ thuộc vào IP, nhất là login abuse protection và điều tra incident sau này.

Hướng giải quyết:

- chuẩn hóa toàn bộ code sang dùng `req.ip` hoặc một helper thống nhất bám theo `trust proxy`;
- không đọc `x-forwarded-for` raw ở nhiều nơi;
- nếu cần lưu full chain proxy thì log riêng raw header, nhưng **không dùng raw header làm nguồn quyết định security**;
- thêm test hoặc tài liệu deploy cho môi trường reverse proxy thực tế.

### F3. Medium - Điểm danh lớp cho phép sửa/ghi đè lịch sử quá rộng, thiếu audit trail tương xứng

- Mức độ: `Medium`
- Nhóm ảnh hưởng: data integrity / insider misuse / forensic visibility
- File ảnh hưởng:
  - `backend/controllers/courseController.js`
  - `backend/models/Attendance.js`
  - `backend/routes/courseRoutes.js`

Mô tả:

- giáo viên thuộc khóa được phép `POST /api/courses/:id/attendance`;
- backend hiện upsert attendance theo `courseId + date` và ghi đè toàn bộ `records`;
- chưa thấy:
  - giới hạn chỉ cho ngày hiện tại hoặc phạm vi ngày hợp lệ theo nghiệp vụ
  - audit log ai sửa trước/sau
  - version history để truy vết lần ghi đè
  - khóa mềm để tránh sửa lịch sử sau khi buổi học đã chốt

Điểm cần lưu ý theo mô tả nghiệp vụ:

- việc nhiều giáo viên của cùng khóa cùng nhìn thấy điểm danh là hợp lệ;
- vấn đề ở đây là **một giáo viên hợp lệ có thể ghi đè attendance của ngày khác hoặc sửa lại lịch sử mà không có audit đủ mạnh**.

Rủi ro:

- dữ liệu điểm danh có thể bị sửa ngoài ý muốn hoặc bị lạm dụng nội bộ;
- sau sự cố sẽ khó xác định:
  - ai là người sửa sau cùng
  - bản ghi trước đó là gì
  - việc sửa có nằm trong khung thời gian hợp lệ hay không

Hướng giải quyết:

- validate chặt `date` theo format `YYYY-MM-DD`;
- quyết định rõ policy:
  - chỉ cho giáo viên sửa ngày hiện tại
  - hoặc cho phép sửa trong cửa sổ ngắn, ví dụ cùng ngày / hết ngày
  - các ngày cũ chỉ admin mới sửa
- ghi audit log cho mỗi lần save attendance:
  - actor
  - courseId
  - date
  - diff trước/sau
- nếu cần đồng bộ nhiều giáo viên, cân nhắc optimistic locking hoặc field `updatedAt/updatedBy` rõ hơn ở response để FE cảnh báo ghi đè.

### F4. Low - CSP vẫn còn `unsafe-inline`

- Mức độ: `Low`
- Nhóm ảnh hưởng: defense in depth
- File ảnh hưởng:
  - `backend/server.js`

Mô tả:

- CSP hiện có, nhưng `script-src` vẫn chứa `'unsafe-inline'`;
- điều này không tự tạo XSS mới, nhưng làm giảm sức phòng thủ nếu sau này xuất hiện sink XSS ở FE.

Hướng giải quyết:

- rà lại script inline thực sự cần thiết;
- nếu khả thi, chuyển sang nonce/hash-based CSP;
- ưu tiên xử lý sau các finding `Medium`.

### F5. Low - Frontend vẫn còn một vài chỗ mutation DOM bằng `innerHTML`

- Mức độ: `Low`
- Nhóm ảnh hưởng: frontend hardening / XSS hygiene
- File ảnh hưởng:
  - `frontend/src/pages/AdminLogin.jsx`
  - `frontend/src/pages/ForgotPassword.jsx`
  - `frontend/src/pages/ResetPassword.jsx`

Mô tả:

- các trang trên dùng `innerHTML` để render fallback logo khi ảnh lỗi;
- chuỗi hiện tại là hard-coded nên chưa tạo thành XSS thực tế ở trạng thái code hiện nay.

Rủi ro:

- đây là sink không nên giữ lâu trong code React;
- về sau nếu ai đó thay chuỗi hard-coded bằng dữ liệu động mà quên sanitize, nguy cơ XSS sẽ tăng lên ngay.

Hướng giải quyết:

- thay fallback này bằng state/JSX thuần;
- tránh mutation DOM thủ công trong component React.

## 5. Những điểm đã đúng theo trạng thái code hiện tại

Các điểm sau đã được kiểm tra lại và hiện **không còn là finding chính** trong bản audit này:

- payload danh sách học sinh cho `teacher` hiện đã bỏ `phone/email` ở backend:
  - `backend/controllers/registrationController.js`
- export attendance cho `teacher` đang mask số điện thoại:
  - `backend/controllers/courseController.js`
- external link mở tab mới ở các vị trí đã thấy đều có `rel="noopener noreferrer"`:
  - `frontend/src/components/CreatorPopup.jsx`
  - `frontend/src/layouts/Footer.jsx`
  - `frontend/src/pages/CourseStudentList.jsx`

## 6. Accepted risk cần giữ nguyên nhãn

### 6.1 Streak theo số điện thoại

Trạng thái:

- accepted risk theo mô tả nghiệp vụ marketing hiện tại

File liên quan:

- `backend/controllers/streakController.js`
- `frontend/src/services/streakService.js`
- `frontend/src/components/FlameButton.jsx`
- `frontend/src/utils/deviceId.js`

Khuyến nghị:

- nếu streak tiếp tục chỉ là mini game giữ chân user, có thể chấp nhận;
- nếu sau này gắn với phần thưởng có giá trị thật, cần nâng cấp sang xác minh mạnh hơn như OTP hoặc token ký server-side.

## 7. Thứ tự ưu tiên xử lý

1. Đóng `F1`: khóa đúng rule tối đa 4 giáo viên phụ ở backend và validator.
2. Đóng `F2`: chuẩn hóa toàn bộ lấy IP theo `req.ip`/proxy helper thống nhất.
3. Đóng `F3`: siết quyền sửa attendance theo ngày và thêm audit/versioning.
4. Đóng `F4` và `F5` để tăng hardening tổng thể.

## 8. Đánh giá cuối

So với mặt bằng web custom nội bộ, hệ thống của bạn hiện đang ở mức **khá** vì đã có đủ nhiều lớp bảo vệ nền tảng và không lộ ra lỗi `Critical` trong phạm vi scan lần này. Điểm yếu còn lại chủ yếu là ở tầng logic quyền và integrity hơn là lỗi thư viện hay lỗi cấu hình quá thô.

Nếu xử lý xong 3 finding `Medium` ở trên, mức an toàn thực tế của hệ thống sẽ tăng rõ nhất, đặc biệt với các vùng nhạy cảm đúng theo mô hình vận hành của bạn: lớp học, điểm danh, phân vai giáo viên và kiểm soát abuse ở login.

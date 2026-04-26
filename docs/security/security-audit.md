# Security Audit

- Audit date: 2026-04-26
- Auditor scope: `backend`, `frontend`, `docs`
- Constraint followed: did not open `.env`, `.env.production`, or secret key files. Only `backend/.env.example` and `frontend/.env.example` were used to infer deployment/security intent.

## 1. Executive summary

Hệ thống hiện có nền bảo mật cơ bản khá ổn cho một web nội bộ quy mô nhỏ:

- JWT access token trong memory, refresh token qua `httpOnly` cookie
- phân quyền `admin` / `teacher` / `marketing`
- CSP / Helmet / CORS / CSRF / rate-limit
- upload ảnh có kiểm tra magic number và re-encode
- backup/restore có mã hóa

Tuy vậy, lần scan này cho thấy 3 nhóm rủi ro đáng ưu tiên hơn phần còn lại:

1. luồng điểm danh khóa học đã cho giáo viên phụ truy cập đúng, nhưng cơ chế lưu hiện tại là `last-write-wins`, chưa đạt mức "đồng bộ an toàn" khi nhiều giáo viên cùng thao tác;
2. luồng restore đang có khả năng làm lộ `MONGO_URI` vào log và giữ lại database tạm chứa dữ liệu thật lâu hơn dự kiến;
3. một số API đang lộ dữ liệu hoặc trạng thái nhiều hơn mức cần thiết, nhất là forgot-password cho staff, danh sách học sinh cho teacher, và streak theo số điện thoại.

Đánh giá tổng thể:

- Mức phù hợp hiện tại: dùng nội bộ được, nhưng chưa nên xem là đã "hardened".
- Mức ưu tiên xử lý: `attendance integrity` và `restore hygiene` phải lên trước.

## 2. Context nghiệp vụ được kiểm tra

### Teacher / course / attendance

Code hiện tại đã bám đúng ý nghiệp vụ ở mức quyền truy cập:

- mỗi khóa có `teacher` chính và `additionalTeachers`
- tối đa 4 giáo viên phụ được chặn ở `backend/controllers/courseController.js:194-210`
- giáo viên chính và giáo viên phụ đều được quyền truy cập/điểm danh lớp qua `checkCourseAccess()` ở `backend/controllers/courseController.js:67-83`

Kết luận:

- yêu cầu "giáo viên phụ vẫn điểm danh được" đã được mở đúng quyền;
- nhưng yêu cầu "đồng bộ hóa để không bất tiện mượn tài khoản" mới chỉ đúng ở mức chia sẻ quyền, chưa đúng ở mức chống ghi đè/xung đột dữ liệu.

### Streak mini-game

Streak đang được thiết kế như một luồng riêng, không gắn với tài khoản admin/teacher/marketing.

Điều này phù hợp với ý anh/chị mô tả: đây là mini-game marketing, không phải luồng bảo mật lõi. Tuy nhiên chính vì vậy, nó phải được xem là "low assurance feature": không nên tin cậy streak như một danh tính thật hoặc một bằng chứng sở hữu số điện thoại.

## 3. Điểm mạnh đang có

Các kiểm soát sau đang được triển khai đúng hướng:

- `backend/server.js`: Helmet + CSP + HSTS + CORS allowlist
- `backend/middlewares/securityMiddleware.js`: CSRF theo `Origin` + `X-Requested-With`
- `backend/middlewares/auth.js`: JWT verify + session conflict theo `activeSessionId`
- `backend/middlewares/upload.js`: extension + MIME + magic number + `sharp` re-encode + strip metadata
- `backend/controllers/registrationController.js`: transaction cho đăng ký + capacity check + duplicate check
- `backend/services/backup.service.js` và `backend/services/restore.service.js`: backup mã hóa, restore có safety backup và chặn zip-slip

Đây là nền tốt. Vấn đề chính nằm ở integrity, privacy minimization, và operational hygiene.

## 4. Findings

### F1 - ~~High~~ Low (Accepted Risk) - Điểm danh khóa học bị ghi đè lẫn nhau, chưa có đồng bộ an toàn giữa giáo viên chính và giáo viên phụ

> **Reassessment (2026-04-26):** Downgraded từ High → Low (Accepted Risk) sau khi xác nhận workflow thực tế.

Evidence:

- `checkCourseAccess()` cho phép cả giáo viên chính và giáo viên phụ vào lớp: `backend/controllers/courseController.js:67-83`
- `saveAttendance()` kiểm tra `studentId` là ObjectId, `status` là `present/absent`, **và validate mọi studentId phải thuộc lớp đang thao tác** (đã fix): `backend/controllers/courseController.js:130-175`

Impact ban đầu:

- hai giáo viên mở cùng một buổi điểm danh rồi lưu lệch thời điểm sẽ ghi đè nhau;
- trạng thái hiện tại là "cùng truy cập được", chưa phải "cùng làm mà không mất dữ liệu".

Business context (accepted risk):

- **Workflow thực tế loại trừ xung đột**: trung tâm phân công rõ ràng ai hôm nay điểm danh — tại 1 thời điểm chỉ có 1 giáo viên điểm danh;
- sau khi lưu, các giáo viên khác cùng khóa thấy kết quả sau ~5 giây;
- trường hợp 2 giáo viên cùng bấm lưu cùng lúc gần như không xảy ra trong thực tế;
- `takenBy` đã track ai điểm danh gần nhất → đủ audit trail;
- `studentId` validation đã chặn inject ID không thuộc lớp;
- thêm optimistic locking sẽ tạo phức tạp không cần thiết cho quy mô nhỏ.

Conclusion:

- rủi ro nghiệp vụ **thấp** với quy trình hiện tại của trung tâm;
- nếu sau này mở rộng quy mô hoặc cho phép điểm danh đồng thời, cần xem xét lại.

### F2 - ~~High~~ Fixed - Restore có thể làm lộ `MONGO_URI` vào log và giữ lại database tạm chứa dữ liệu thật

> **Fixed (2026-04-26):** 3 sub-issues đã được sửa trong `backend/services/restore.service.js`.

Evidence (trước khi sửa):

- log mongorestore đang in nguyên command, bao gồm `--uri=${MONGO_URI}`: `backend/services/restore.service.js:190-191`
- tên database tạm dùng `Date.now()` mili-giây: `backend/services/restore.service.js:252-253`
- cron cleanup parse suffix rồi nhân `* 1000` → timestamp bị x1000, cron không bao giờ xóa được temp DB

Remediation applied:

1. **Mask URI trong log**: thay `args.join(' ')` bằng `safeArgs` với `--uri=<REDACTED>`
2. **Chuẩn hóa timestamp**: đổi `Date.now()` sang `Math.floor(Date.now() / 1000)` (giây) → khớp với `cron.js` và `cleanRestoreTmp.js` parser
3. **Drop temp DB ngay**: sau validate thành công, drop temp DB lập tức thay vì chờ cron dọn rác

Verification:

- `cron.js:146` nhân `* 1000` → đúng vì suffix giờ là giây
- `cleanRestoreTmp.js:57` nhân `* 1000` → đúng vì suffix giờ là giây
- Temp DB được xóa ngay, cron chỉ là safety net cho trường hợp drop thất bại

### F3 - Medium - Forgot password cho staff đang tiết lộ trạng thái tài khoản nhiều hơn cần thiết

Evidence:

- nhánh `staff` trả lỗi riêng khi username/email không khớp: `backend/controllers/authController.js:314-330`
- còn trả lỗi riêng khi staff chưa có email: `backend/controllers/authController.js:333-337`
- trong khi nhánh `admin` đã dùng generic success để tránh enumeration: `backend/controllers/authController.js:345-353`

Impact:

- ai biết format username nội bộ (`LC########`) có thể dò xem account nào tồn tại, account nào đã được gán email;
- đây không phải auth bypass trực tiếp, nhưng giúp thu hẹp mục tiêu cho brute-force social engineering hoặc spear-phishing nội bộ.

Recommendation:

- thống nhất trả một thông điệp chung cho cả `admin` và `staff`;
- vẫn log nội bộ nguyên nhân thật, nhưng không trả ra client;
- nếu cần hỗ trợ staff chưa có email, đưa hướng dẫn chung kiểu "nếu thông tin hợp lệ, hệ thống sẽ xử lý hoặc vui lòng liên hệ admin".

### F4 - Medium - Teacher đang xem được PII phụ huynh rộng hơn nhu cầu điểm danh tối thiểu

Evidence:

- API học sinh theo lớp trả luôn `parentName`, `phone`, `email`: `backend/controllers/registrationController.js:443-449`
- route teacher dùng chung màn hình đó: `frontend/src/App.jsx:96-99`
- màn hình teacher thực tế hiển thị cột phụ huynh và số điện thoại: `frontend/src/pages/CourseStudentList.jsx:803-842`

Impact:

- mọi giáo viên được gán vào lớp, kể cả giáo viên phụ, đều xem được dữ liệu liên hệ phụ huynh;
- nếu mục tiêu chính của route teacher là điểm danh, đây là overexposure so với nguyên tắc least privilege;
- rủi ro này tăng lên khi dùng nhiều giáo viên phụ để thay giáo viên chính.

Recommendation:

- tách payload teacher-facing và admin-facing;
- với teacher, mặc định chỉ trả `childName`, `childAge`, `isActive`, attendance state, và chỉ mở contact info khi có nhu cầu nghiệp vụ rõ;
- cân nhắc mask phone (`***`) cho giáo viên phụ nếu không cần liên lạc trực tiếp.

### F5 - Medium - Streak là identity-by-phone không xác thực chủ sở hữu, nên chỉ được xem là rủi ro kinh doanh chấp nhận được, không phải bảo mật mạnh

Evidence:

- route streak không dùng auth token riêng, chỉ rate-limit + validate input: `backend/routes/streakRoutes.js:19-57`
- API lấy streak theo số điện thoại trả cả `phone`, `name`, `streakCount`, `lastCheckin`, `reviveUsed`: `backend/controllers/streakController.js:58-65`, `169-195`
- check-in và revive cũng chỉ dựa vào `phone`: `backend/controllers/streakController.js:206-344`
- FE còn lưu `streak_phone` ở localStorage để dùng lại: `frontend/src/components/FlameButton.jsx:266-270`

Impact:

- ai biết số điện thoại đều có thể xem trạng thái streak và thao tác hộ;
- limit hiện tại giúp giảm spam nhưng không chứng minh quyền sở hữu số điện thoại;
- vì có lưu `name` và `phone`, đây là rủi ro riêng tư/marketing hơn là rủi ro chiếm quyền hệ thống.

Business conclusion:

- nếu chủ đích là "cho check chuỗi hộ của nhau" thì đây là accepted risk;
- nhưng streak phải tiếp tục bị cô lập hoàn toàn khỏi auth lõi, dữ liệu học viên, và mọi quyết định quan trọng.

Recommendation:

- giữ streak tách biệt với tài khoản nội bộ như hiện nay;
- không mở rộng streak sang reward thật, voucher, hay thao tác có giá trị nếu chưa thêm OTP/signed token;
- tối thiểu hóa dữ liệu trả về: có thể bỏ `name` khỏi `GET /streak/me` nếu không cần;
- nếu vẫn dùng phone cho marketing, cần xem đây là luồng PII và có chính sách retention/xóa dữ liệu rõ ràng.

### F6 - Low - Startup env validation chưa chặn thiếu một số secret quan trọng

Evidence:

- danh sách env bắt buộc hiện chưa gồm `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `COOKIE_SECRET`, `EMAIL_FROM`, `CORS_ORIGINS`: `backend/server.js:55-60`

Impact:

- app có thể khởi động trong trạng thái cấu hình sai hoặc nửa an toàn;
- lỗi sẽ phát nổ muộn ở runtime thay vì fail fast ngay từ lúc boot.

Recommendation:

- thêm các secret và biến bảo mật lõi vào `requiredEnvs`;
- fail startup ngay nếu thiếu secret xác thực hoặc cookie signing.

## 5. Kết luận riêng theo yêu cầu nghiệp vụ

### Attendance nhiều giáo viên phụ

Phần quyền đang đúng hướng:

- có 1 giáo viên chính;
- tối đa 4 giáo viên phụ;
- giáo viên phụ đã có thể điểm danh lớp.

Nhưng phần "đồng bộ hóa để không cần mượn tài khoản" hiện chưa hoàn tất về mặt an toàn dữ liệu. Nếu muốn dùng nghiêm túc trong vận hành hằng ngày, cần sửa F1 trước.

### Streak mini-game

Với mục tiêu marketing và mức quan trọng thấp, mô hình hiện tại có thể chấp nhận nếu:

- streak không ảnh hưởng tới auth lõi;
- không gắn với quyền lợi thật;
- chấp nhận rõ đây là tính năng low-trust;
- kiểm soát retention của `phone`, `name`, `email`.

Nếu sau này streak tăng giá trị kinh doanh, phải nâng cấp cơ chế xác thực ngay.

## 6. Priority fix order

1. ~~Sửa attendance save theo hướng chống conflict + validate `studentId` thuộc đúng lớp.~~ → `studentId` validation đã fix. Conflict accepted risk (workflow loại trừ).
2. ~~Sửa restore logging và cleanup temp restore DB.~~ → Fixed (2026-04-26).
3. Làm generic response cho forgot-password staff.
4. Giảm dữ liệu PII trả cho teacher.
5. Hardening streak theo mức độ giá trị kinh doanh thật.
6. Bổ sung startup env validation.

## 7. Final assessment

Đây không phải codebase "mất kiểm soát"; nền bảo mật đã có ý thức khá rõ. Vấn đề chính là vài điểm rủi ro còn nằm ở chỗ rất thực tế:

- integrity khi nhiều người cùng thao tác,
- dữ liệu dư thừa cho role không cần thiết,
- và hygiene của backup/restore.

Nếu xử lý xong F1 và F2 trước, mức an toàn thực tế của hệ thống nội bộ này sẽ tăng rõ rệt.

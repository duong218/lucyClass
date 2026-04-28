# Security Audit

- Audit date: 2026-04-29
- Scope: `backend`, `frontend`, `docs`
- Method: static code review FE/BE, route-controller-role flow review, config example review
- Basis used for config intent: `backend/.env.example`, `frontend/.env.example`
- Explicit exclusion: did not read `env.production`, real `.env`, or real secrets

## 1. Kết luận nhanh

Mức bảo mật hiện tại của hệ thống: **Trung bình khá**.

Đánh giá sau lần scan lại này:

- phần ẩn số điện thoại cho `teacher` ở giao diện và file export là **cải thiện đúng hướng**;
- tuy nhiên mức an toàn **chưa tăng tương ứng ở tầng API/backend**, vì payload cho `teacher` vẫn còn chứa dữ liệu nhạy cảm hơn mức cần thiết;
- không thấy dấu hiệu lỗi `Critical` kiểu takeover không cần auth, RCE, hay public upload nguy hiểm trong phạm vi review tĩnh này;
- vẫn còn 3 việc nên ưu tiên cao: giảm PII trả về cho `teacher`, kéo rule số lượng giáo viên phụ về đúng mô tả nghiệp vụ, và nâng `multer` khỏi 1.x.

Điểm tham chiếu nội bộ: **6.9/10**.

## 2. Phạm vi loại trừ theo mô tả hệ thống

Các điểm dưới đây **không tính là lỗ hổng** trong audit này vì đúng với mô hình nghiệp vụ bạn đã mô tả.

### 2.1 Điểm danh dùng chung giữa giáo viên chính và giáo viên phụ

Mô hình nghiệp vụ được chấp nhận:

- 1 khóa học có 1 giáo viên chính;
- tối đa 4 giáo viên phụ;
- các giáo viên thuộc cùng khóa được cùng xem lớp và đồng bộ điểm danh để thay nhau thao tác khi cần.

Kết luận:

- đây **không phải broken access control** nếu người dùng thực sự thuộc khóa học đó;
- audit không ghi lỗi chỉ vì giáo viên phụ được xem lớp hoặc điểm danh thay giáo viên chính.

Lưu ý:

- phần loại trừ này bám theo **mô tả nghiệp vụ mong muốn** của bạn;
- nếu code cho phép vượt quá giới hạn đó thì đó là một finding riêng về lệch rule, không phải bác bỏ mô hình nghiệp vụ.

### 2.2 Streak cho phép check-in hộ

Bạn đã xác nhận đây là mini game marketing, có chủ đích nới lỏng để giữ chân user.

Kết luận:

- audit **không coi đây là lỗi auth của hệ lõi**;
- nhưng vẫn ghi nhận đây là khu vực low-trust về privacy và abuse nếu sau này gắn với phần thưởng có giá trị.

### 2.3 Excel chủ yếu là export, không có upload công khai

Theo mô tả hiện tại:

- hệ thống chủ yếu xuất file;
- không có role public upload Excel vào server.

Kết luận:

- audit không đưa rủi ro malware từ upload Excel vào findings;
- phần Excel chỉ được xem theo góc độ lộ dữ liệu khi export.

## 3. Cải thiện đã ghi nhận từ lần scan trước

Các thay đổi tốt đã có:

- `teacher` không còn hiện số điện thoại phụ huynh mặc định ở danh sách học sinh trên FE:
  - `frontend/src/pages/CourseStudentList.jsx:558`
  - `frontend/src/pages/CourseStudentList.jsx:996`
- export danh sách học sinh phía FE đã mask `phone` cho `teacher`:
  - `frontend/src/pages/CourseStudentList.jsx:749`
- export điểm danh phía backend đã mask số điện thoại cho `teacher`:
  - `backend/controllers/courseController.js:523`
  - `backend/controllers/courseController.js:555`

Kết luận phần này:

- đây là **giảm rò rỉ ở tầng hiển thị/output**;
- nhưng chưa phải bản vá hoàn chỉnh vì dữ liệu gốc vẫn còn đi xuống client của `teacher`.

## 4. Findings còn tồn tại

### F1. Medium - API vẫn trả raw `phone` và `email` cho `teacher`

- Mức độ: `Medium`
- Nhóm ảnh hưởng: privacy / least privilege / data minimization
- File ảnh hưởng:
  - `backend/controllers/registrationController.js:448`
  - `frontend/src/pages/CourseStudentList.jsx:826`
  - `frontend/src/pages/CourseStudentList.jsx:1055`

Mô tả:

- API danh sách học sinh theo khóa vẫn `.select('childName childAge parentName phone email isActive courseId note transferHistory')`.
- FE của `teacher` đã ẩn cột `phone`, nhưng dữ liệu `phone` vẫn nằm trong payload client và còn được dùng cho tìm kiếm.
- Điều này nghĩa là người dùng role `teacher` vẫn có thể lấy `phone/email` qua DevTools, network tab, hoặc các luồng FE khác dùng lại state.

Đánh giá:

- thay đổi mới của bạn **đã giảm lộ lọt ở UI**, nhưng **chưa đóng lỗ hổng ở tầng dữ liệu**;
- đây vẫn là finding ưu tiên cao nhất vì liên quan trực tiếp đến PII phụ huynh.

Hướng xử lý:

- tách payload `admin` và payload `teacher`;
- với `teacher`, chỉ trả các trường thực sự cần cho điểm danh và quản lý lớp:
  - `childName`
  - `childAge`
  - `parentName` nếu thực sự cần
  - `isActive`
  - dữ liệu điểm danh/liên quan khóa học
- bỏ `phone` và `email` khỏi API teacher-facing;
- đồng thời bỏ logic tìm kiếm theo `s.phone` ở FE cho `teacher`.

### F2. Medium - Code đang cho tối đa 15 giáo viên phụ, lệch với rule nghiệp vụ tối đa 4

- Mức độ: `Medium`
- Nhóm ảnh hưởng: access surface / policy drift / privacy
- File ảnh hưởng:
  - `backend/controllers/courseController.js:222`
  - `backend/controllers/courseController.js:223`

Mô tả:

- mô tả hệ thống của bạn chốt rõ: 1 giáo viên chính và tối đa 4 giáo viên phụ;
- nhưng backend hiện cho phép tới `15` additional teachers.

Vì sao đây là vấn đề:

- nó làm tăng số tài khoản được truy cập dữ liệu lớp, học sinh và điểm danh vượt quá phạm vi nghiệp vụ đã chốt;
- với finding `F1` còn mở, bề mặt lộ PII thực tế cũng tăng theo số lượng giáo viên phụ được gán.

Hướng xử lý:

- kéo rule backend về đúng `4` additional teachers;
- rà lại FE form tạo/sửa khóa học để dùng cùng một giới hạn;
- nếu business đã đổi thật sự lên hơn 4 thì cần cập nhật lại tài liệu nghiệp vụ, ma trận quyền, và đánh giá privacy tương ứng.

### F3. Medium - Backend vẫn dùng `multer` 1.x đã có cảnh báo upstream

- Mức độ: `Medium`
- Nhóm ảnh hưởng: dependency risk / upload surface
- File ảnh hưởng:
  - `backend/package.json`
  - `backend/package-lock.json:3886`
  - `backend/routes/announcementRoutes.js`
  - `backend/routes/courseRoutes.js`
  - `backend/routes/feedbackRoutes.js`
  - `backend/routes/teacherRoutes.js`

Mô tả:

- dependency hiện tại là `multer: ^1.4.5-lts.1`;
- `package-lock` ghi rõ bản 1.x bị ảnh hưởng bởi nhiều lỗ hổng đã được vá trong 2.x.

Đánh giá:

- đây là technical security debt;
- các lớp filter MIME, size, re-encode ảnh đang giúp giảm rủi ro, nhưng không thay thế được việc nâng bản parser multipart gốc.

Hướng xử lý:

- ưu tiên nâng `multer` lên 2.x;
- test lại toàn bộ flow upload ảnh ở:
  - announcement
  - course
  - feedback
  - teacher

### F4. Low - Module streak vẫn là khu vực low-trust theo số điện thoại

- Mức độ: `Low`
- Nhóm ảnh hưởng: privacy / abuse surface
- File ảnh hưởng:
  - `backend/controllers/streakController.js`
  - `frontend/src/services/streakService.js`
  - `frontend/src/components/FlameButton.jsx`

Mô tả:

- streak vẫn vận hành theo `phone`;
- phía FE còn lưu dấu vết dùng cho streak ở client;
- ai biết số điện thoại vẫn có thể tác động hoặc dò trạng thái theo mô hình nới lỏng hiện tại.

Đánh giá:

- theo mô tả nghiệp vụ của bạn, đây là **accepted risk**;
- vẫn nên giữ nhãn low-trust và không mở rộng module này sang reward có giá trị thật nếu chưa thêm lớp xác thực mạnh hơn.

Hướng xử lý:

- nếu streak chỉ là mini game marketing thì có thể giữ nguyên;
- nếu sau này gắn voucher, quà, quyền lợi thật, cần thêm OTP hoặc cơ chế xác minh có chữ ký.

### F5. Low - CSP vẫn chứa `'unsafe-inline'`

- Mức độ: `Low`
- Nhóm ảnh hưởng: defense in depth
- File ảnh hưởng:
  - `backend/server.js:120`

Mô tả:

- CSP đã có, nhưng `script-src` vẫn cho phép `'unsafe-inline'`.

Đánh giá:

- mục này không tự tạo ra XSS mới;
- nhưng nó làm yếu đi lớp giảm thiểu thiệt hại nếu một sink XSS xuất hiện ở nơi khác.

Hướng xử lý:

- rà lại nhu cầu script inline hiện có;
- nếu khả thi, chuyển sang nonce/hash CSP để bỏ `'unsafe-inline'`.

### F6. Low - Một số trang React vẫn dùng `innerHTML` cho fallback logo

- Mức độ: `Low`
- Nhóm ảnh hưởng: frontend hardening
- File ảnh hưởng:
  - `frontend/src/pages/AdminLogin.jsx:124`
  - `frontend/src/pages/ForgotPassword.jsx:138`
  - `frontend/src/pages/ResetPassword.jsx:125`

Mô tả:

- các trang này vẫn chèn HTML trực tiếp bằng `innerHTML` khi ảnh logo lỗi.

Đánh giá:

- chuỗi hiện tại đang hard-coded nên chưa phải XSS thực tế;
- nhưng đây là sink không nên giữ trong code React vì dễ biến thành điểm tiêm XSS nếu sau này sửa bất cẩn.

Hướng xử lý:

- thay fallback này bằng JSX/state render bình thường;
- tránh mutation DOM thủ công bằng `innerHTML`.

## 5. Thứ tự ưu tiên xử lý

1. Đóng `F1` ở tầng API: bỏ `phone/email` khỏi payload của `teacher`.
2. Đóng `F2`: đưa giới hạn giáo viên phụ từ `15` về đúng `4` nếu business không đổi.
3. Đóng `F3`: nâng `multer` lên 2.x và test lại upload.
4. Siết `F5` và `F6` để tăng hardening frontend/backend.
5. Giữ `F4` ở trạng thái accepted risk nhưng không mở rộng quyền lợi cho streak nếu chưa tăng xác thực.

## 6. Đánh giá cuối

Phần ẩn số điện thoại cho `teacher` mà bạn vừa thêm là **một bước cải thiện tốt**, nhưng hiện mới chặn ở lớp hiển thị và export. Về bảo mật thực chất, hệ thống vẫn chưa đạt nguyên tắc least privilege cho role `teacher` vì API còn trả raw PII xuống client.

Nếu xử lý xong `F1`, `F2`, và `F3`, mức an toàn thực tế của hệ thống sẽ tăng rõ rệt và phù hợp hơn với mô hình vận hành dài hạn cho web custom có nhiều giáo viên cùng truy cập dữ liệu lớp.

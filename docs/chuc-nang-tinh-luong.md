# Đặc tả nghiệp vụ: Thời khóa biểu — Chấm công — Tính lương theo buổi

**Phiên bản:** 1.2  
**Phạm vi áp dụng:** Toàn bộ cơ sở, phòng học, khung giờ trong hệ thống  
**Nguyên tắc cốt lõi:** Tính lương theo **buổi dạy 90 phút**, không tính theo giờ thực tế
**Nguyên tắc thời gian:** Sử dụng thời gian thực của Việt Nam (GMT+7) để tính toán các mốc thời gian, sử dụng UTC cho lưu trữ dữ liệu (tránh sai sót khi đổi giờ hệ thống).
**Nguyên tắc linh hoạt:** Giáo viên có thể có `session_role` khác nhau ở từng buổi dạy, admin có thể sửa thủ công chấm công của nhân viên để phù hợp theo lịch được cho ngày cũ, hiện tại và ngày mới đều hoạt động.
**Nguyên tắc kiểm soát chặt chẽ:** Admin có quyền kiểm soát và điều chỉnh lương của giáo viên thông qua việc sửa đổi các thông tin liên quan đến chấm công, bao gồm cả việc điều chỉnh số học sinh trong khóa học.
**Lưu ý quan trọng:**
- Tất cả thay đổi lương trong quá khứ (ngày cũ) đều cần thông qua admin sửa trực tiếp, không thể tự động hóa hoàn toàn.
- Các quy tắc và cấu hình lương (như `session_role`, `salary_level`, `matchThresholdMinutes`, v.v.) chỉ có hiệu lực từ thời điểm thay đổi trở đi, trừ khi có can thiệp thủ công từ admin.

---

## 1. Tổng quan

Hệ thống kết nối 3 module hiện có — **Thời khóa biểu (TKB)**, **Chấm công**, **Quản lý khóa học** — để tự động tính lương giáo viên theo buổi dạy. Mỗi buổi dạy được xác định bởi ô TKB, tiền lương phụ thuộc vào vai trò giáo viên trong buổi đó và số học sinh đăng ký trong khóa học tương ứng.

---

## 2. Các khái niệm cần phân biệt

| Khái niệm | Mô tả |
|---|---|
| **Role hệ thống** | Quyền truy cập tính năng: `admin`, `teacher`, `mkt` — **giữ nguyên, không thay đổi** |
| **Vai trò trong buổi (`session_role`)** | Mức lương áp dụng cho buổi đó — có 6 loại, gắn vào từng ô TKB cụ thể |
| **Vị trí trong buổi (`is_main`)** | GV thứ nhất (bắt buộc) hoặc GV thứ hai (tuỳ chọn) — không liên quan đến mức lương |

**6 loại `session_role` thực tế:**

| session_role | Tên hiển thị | Mô tả |
|---|---|---|
| `full_time` | Full-time | Lương 100% — GV cơ hữu |
| `part_time` | Part-time | Lương 80% — GV bán thời gian |
| `thu_viec` | Thử việc | Lương 70% — GV đang thử việc |
| `teacher_assistant` | Teacher Assistant / Trợ giảng | Mức lương riêng, không theo số hs |
| `observe` | Observe / Dự giờ | Mức lương thấp nhất, không theo số hs |

> **Lưu ý:** 1 giáo viên có thể có `session_role` khác nhau ở từng buổi. Ví dụ: sáng dạy chính với vai trò `full_time`, chiều dự giờ lớp khác với vai trò `observe`.

---

## 3. Cấu hình hệ thống (làm 1 lần)

### 3.1 Bảng salary_config

Lưu mức tiền theo từng tổ hợp `session_role` × số học sinh. Chỉ admin mới được chỉnh sửa. Xem chi tiết nghiệp vụ chỉnh sửa tại **Mục 11**.

**Nguồn: Bảng lương thực tế của trung tâm Lucy Edutainment**

| session_role | 1 học sinh | 2 học sinh | 3 học sinh | 4–6 học sinh |
|---|---|---|---|---|
| `full_time` (100%) | 150.000 | 200.000 | 250.000 | 300.000 |
| `part_time` (80%) | 120.000 | 160.000 | 200.000 | 240.000 |
| `thu_viec` (70%) | 105.000 | 140.000 | 175.000 | 210.000 |

**Các vai trò không phụ thuộc số học sinh** (mức cố định mỗi buổi):

| session_role | full_time (100%) | part_time (80%) | thu_viec (70%) |
|---|---|---|---|
| `teacher_assistant` | 75.000 | 60.000 | 52.500 |
| `observe` | 50.000 | 40.000 | 35.000 |

> **Lưu ý thiết kế DB:** `teacher_assistant` và `observe` lưu `student_count = null`, tra lương theo `session_role` + `salary_level` (full_time/part_time/thu_viec) thay vì số hs.

### 3.2 Bảng salary_bonus — Thưởng đặc biệt

Tách riêng khỏi lương buổi, tính thủ công hoặc theo sự kiện:

| Loại thưởng | Mức thưởng | Ghi chú |
|---|---|---|
| Tuyển sinh thành công | 100.000 | Admin ghi nhận thủ công |
| Test đầu vào thành công | 50.000 | Admin ghi nhận thủ công |

> Thưởng **không liên quan đến TKB hay chấm công** — admin nhập trực tiếp vào bảng lương khi phát sinh.

### 3.2 Khóa học

Đã có sẵn trong hệ thống, bao gồm:
- 1 giáo viên chính
- Tối đa 15 giáo viên phụ
- Số học sinh đăng ký (dùng để tra `salary_config`)

---

## 4. Tạo ô TKB — Form popup (+)

Admin bấm dấu `(+)` trên hàng tương ứng trong bảng TKB (cơ sở → phòng → khung giờ) để tạo buổi dạy.

### 4.1 Cấu trúc form

| Dòng | Trường | Bắt buộc | Mô tả |
|---|---|---|---|
| 1 | Khóa học | ✅ | Chọn từ danh sách → hệ thống tự lấy số hs |
| 2 | Giáo viên thứ nhất | ✅ | Chọn từ danh sách GV thuộc khóa đó |
| 3 | Vai trò GV thứ nhất | ✅ | `full_time` / `part_time` / `thu_viec` / `teacher_assistant` / `observe` |
| 4 | Giáo viên thứ hai | ❌ | Tuỳ chọn — bấm "+ Thêm GV thứ hai" để hiện |
| 5 | Vai trò GV thứ hai | ❌ (bắt buộc nếu có GV 2) | Hiện cùng lúc khi thêm GV thứ hai |
| 6 | Số học sinh | — | Tự động từ khóa học, không nhập tay |
| 7 | Ghi chú | ❌ | Tối đa 1000 ký tự |
| 8 | Màu ô | ❌ | Chọn màu nổi bật cho ô TKB |

### 4.2 Quy tắc validation

- Không lưu được nếu thiếu khóa học, GV thứ nhất hoặc vai trò GV thứ nhất
- Nếu đã thêm GV thứ hai thì vai trò GV thứ hai cũng bắt buộc
- Không được chọn cùng 1 người cho cả GV thứ nhất và thứ hai → báo lỗi
- Có nút `✕` để xoá GV thứ hai nếu thêm nhầm

### 4.3 Dữ liệu lưu vào DB: bảng `session_teachers`

Mỗi ô TKB có thể có 1 hoặc 2 dòng trong `session_teachers`:

```
session_id | teacher_id | session_role | course_id | is_main
```

> Ô TKB áp dụng cho **mọi cơ sở, phòng, khung giờ** trong hệ thống — không có ngoại lệ.

---

## 5. Nguồn dữ liệu chấm công

Engine ghép ca xử lý **tất cả 4 nguồn** theo cùng 1 quy trình. Nguồn gốc được lưu vào trường `source` của bản ghi checkin:

| Giá trị `source` | Ý nghĩa | Hiển thị note trong bảng lương |
|---|---|---|
| `device` | GV tự bấm checkin/checkout trên thiết bị | Không hiện note |
| `auto_checkout` | Hệ thống tự checkout lúc 23:59 khi GV quên | Không hiện note |
| `auto_by_admin` | Hệ thống tự checkin khi admin xác nhận đổi GV | ⚠️ "Đổi GV đột xuất" |
| `manual_by_admin` | Admin sửa/thêm chấm công thủ công trong trang quản lý | 🔴 "Chấm công thủ công — xem xét trừ lương" |

---

## 6. Engine ghép ca

Chạy cuối ngày (hoặc khi admin yêu cầu). Xử lý **độc lập cho từng giáo viên**.

### 6.1 Thuật toán

```
Với mỗi giáo viên trong ngày:
  1. Lấy tất cả cặp (checkin, checkout) của GV đó trong ngày
  2. Lấy tất cả ô TKB có tên GV đó trong ngày
  3. Với mỗi ô TKB:
       Nếu [giờ bắt đầu ô TKB] nằm trong khoảng [checkin − 30 phút, checkout]
       → Ghi nhận 1 ca hợp lệ
       → Mỗi ô TKB chỉ được tính 1 lần dù bao nhiêu cặp checkin/checkout bao phủ
  4. Tra salary_config: session_role + student_count → tiền buổi
  5. Ghi vào bảng lương kèm source của checkin
```

### 6.2 Các trường hợp đặc biệt

#### Trường hợp A — Checkout muộn, không có ca tiếp theo
- **Ví dụ:** Checkin 7:55 → Checkout 10:30, ô TKB duy nhất là 8:00–9:30
- **Xử lý:** Checkout nằm ngoài mọi ô TKB → chỉ tính ca 8:00 đã checkin vào
- **Kết quả:** ✅ 1 ca

#### Trường hợp B — 2 ca liên tiếp, checkout 1 lần duy nhất
- **Ví dụ:** Checkin 7:55 → Checkout 11:15, TKB có 2 ô: 8:00–9:30 và 9:30–11:00
- **Xử lý:** Khoảng checkin–checkout bao phủ giờ bắt đầu của cả 2 ô (8:00 và 9:30)
- **Kết quả:** ✅ 2 ca

#### Trường hợp C — Checkout ca 1 rồi checkin lại ca 2
- **Ví dụ:** Cặp 1: 7:55 → 9:40 / Cặp 2: 9:40 → 11:10
- **Xử lý:** 2 cặp checkin/checkout riêng biệt, mỗi cặp ghép 1 ô TKB
- **Kết quả:** ✅ 2 ca

#### Trường hợp D — Checkin nhưng không khớp ô TKB nào
- **Ví dụ:** GV checkin nhưng không có lịch dạy hôm đó
- **Xử lý:** Tự động bỏ qua, không tính ca, không báo lỗi, không cần admin duyệt
- **Kết quả:** ❌ Không tính

#### Trường hợp E — Có ca TKB nhưng không checkin (quên hoặc đột xuất)
- **Xử lý:** Admin vào trang quản lý chấm công → sửa/thêm thủ công → `source = manual_by_admin`
- **Engine:** Chạy lại bình thường, tính ca như mọi trường hợp khác
- **Kết quả:** ✅ Tính ca + hiện note 🔴 "Chấm công thủ công — xem xét trừ lương"

#### Trường hợp F — Ô TKB có 2 GV, 1 người không checkin
- **Xử lý:** Engine chạy độc lập cho từng người. GV checkin đủ → tính bình thường. GV không checkin → rơi vào Trường hợp E
- **Kết quả:** ✅ GV có checkin tính ca bình thường / GV không checkin cần admin sửa thủ công

---

## 7. Đổi giáo viên đột xuất

### 7.1 Trường hợp GV cũ chưa checkin
- Admin đổi GV trong ô TKB → lưu thẳng, không cần xác nhận

### 7.2 Trường hợp GV cũ đã checkin
Admin bấm đổi GV → hệ thống hiện **popup xác nhận**:

> ⚠️ Giáo viên [A] đã checkin lúc [HH:MM] cho ca này.  
> Nếu xác nhận đổi sang [B]:  
> - Ca này sẽ **không tính lương cho [A]**  
> - Giáo viên [B] sẽ được **tự động checkin** ngay lúc này  
>
> Bạn có chắc muốn đổi không?

| Admin chọn | Hệ thống thực hiện |
|---|---|
| **Xác nhận** | Xoá ca GV A · Gắn GV B vào TKB · Tự động checkin GV B (`source = auto_by_admin`) · Auto checkout 23:59 đóng cặp cuối ngày |
| **Huỷ** | Giữ nguyên, vẫn tính ca cho GV A |

---

## 8. Bảng lương tổng hợp

### 8.1 Cấu trúc mỗi dòng

| Cột | Nội dung |
|---|---|
| Ngày | Ngày diễn ra buổi dạy |
| Cơ sở / Phòng | Lấy từ ô TKB |
| Khóa học | Tên khóa học |
| Số học sinh | Số hs đăng ký tại thời điểm tính (null nếu là teacher_assistant hoặc observe) |
| Vai trò | `full_time` / `part_time` / `thu_viec` / `teacher_assistant` / `observe` |
| Tiền buổi | Tra từ `salary_config` |
| Thưởng | Tuyển sinh / Test đầu vào (nếu có, nhập thủ công) |
| Ghi chú | Hiện note nếu `source` không phải `device` |

### 8.2 Màu sắc phân biệt

- **Không màu** — Chấm công bình thường (`device`, `auto_checkout`)
- **Màu vàng** ⚠️ — Đổi GV đột xuất (`auto_by_admin`)
- **Màu đỏ** 🔴 — Chấm công thủ công (`manual_by_admin`) → admin xem xét trừ lương

### 8.3 Xuất Excel
- Tổng số buổi theo từng loại vai trò
- Tổng tiền từng giáo viên trong tháng
- Giữ nguyên định dạng file Excel hiện tại, bổ sung thêm cột "Ghi chú"

---

## 9. Phạm vi áp dụng & tính mở rộng

- Toàn bộ logic hoạt động **đồng nhất** cho mọi cơ sở, phòng, khung giờ trong hệ thống
- Thêm cơ sở mới, phòng mới, giáo viên mới → không cần sửa logic
- Vai trò `teacher_assistant` và `observe` hiện đã có trong bảng lương, sẵn sàng dùng ngay
- Ngưỡng ghép ca ±30 phút so với giờ bắt đầu TKB — admin có thể cấu hình
- Thưởng tuyển sinh và test đầu vào tách riêng, không ảnh hưởng logic ghép ca

---

## 10. Tóm tắt các bảng DB cần thêm/sửa

| Bảng | Thao tác | Nội dung |
|---|---|---|
| `salary_config` | **Tạo mới** | session_role × student_count × salary_level → amount |
| `salary_config_logs` | **Tạo mới** | Lịch sử chỉnh sửa salary_config |
| `salary_bonus` | **Tạo mới** | Thưởng tuyển sinh / test đầu vào — nhập thủ công |
| `session_teachers` | **Tạo mới** | session_id, teacher_id, session_role, course_id, is_main |
| `StaffAttendance` (chấm công) | **Thêm cột** | Thêm trường `source` vào bản ghi checkin |
| `teachers` | **Không đổi** | Role hệ thống giữ nguyên |
| `courses` | **Không đổi** | Số hs đã có sẵn |

---

## 11. Quản lý bảng lương salary_config

### 11.1 Quyền truy cập
- Chỉ tài khoản có role `admin` mới được xem và chỉnh sửa
- `teacher` và `mkt` không có quyền truy cập trang này

### 11.2 Giao diện — Inline edit trực tiếp trên bảng

Hiển thị 2 bảng riêng biệt:

**Bảng 1 — Lương theo số học sinh** (3 vai trò × 4 mức hs = 12 ô):

```
                   | 1 học sinh | 2 học sinh | 3 học sinh | 4–6 học sinh
───────────────────|────────────|────────────|────────────|─────────────
full_time  (100%)  |   [150.000]|   [200.000]|   [250.000]|    [300.000]
part_time  (80%)   |   [120.000]|   [160.000]|   [200.000]|    [240.000]
thu_viec   (70%)   |   [105.000]|   [140.000]|   [175.000]|    [210.000]
```

**Bảng 2 — Lương cố định theo vai trò** (không phụ thuộc số hs):

```
                        | full_time | part_time | thu_viec
────────────────────────|───────────|───────────|─────────
teacher_assistant       |  [75.000] |  [60.000] | [52.500]
observe / dự giờ        |  [50.000] |  [40.000] | [35.000]
```

**Bảng 3 — Thưởng đặc biệt** (chỉ xem, không inline edit — nhập thủ công từng lần):

```
Tuyển sinh thành công : [100.000]
Test đầu vào thành công: [ 50.000]
```

**Cách chỉnh sửa:**
- Admin bấm vào ô bất kỳ → ô chuyển thành input số
- Bấm Enter hoặc click ra ngoài → lưu ngay, không cần nút Save
- Hiển thị định dạng tiền tệ (`150.000`) nhưng lưu DB dạng số nguyên (`150000`)
- Không cho phép nhập giá trị âm hoặc bằng 0 → báo lỗi inline

### 11.3 Lưu lịch sử chỉnh sửa

Mỗi lần admin sửa 1 ô, hệ thống tự động ghi vào bảng `salary_config_logs`:

```
id | session_role | student_count | old_amount | new_amount | updated_by | updated_at
```

**Hiển thị lịch sử:**
- Bên dưới bảng chính có phần **"Lịch sử chỉnh sửa"**
- Mỗi dòng log hiển thị: thời gian · tên admin · ô đã sửa · giá trị cũ → giá trị mới
- Ví dụ: `15/06/2025 09:32 — Admin Minh sửa [full_time × 3 hs]: 250.000 → 270.000`
- Hiển thị tối đa 50 dòng gần nhất, có thể xem thêm

### 11.4 Ảnh hưởng đến bảng lương

> **Quan trọng:** Thay đổi `salary_config` chỉ áp dụng cho các buổi dạy **từ thời điểm sửa trở đi**. Các buổi đã tính lương trước đó **không bị tính lại**.

Admin cần lưu ý điều này khi thay đổi mức lương giữa tháng — nên thực hiện vào đầu tháng hoặc đầu chu kỳ tính lương để tránh nhầm lẫn.
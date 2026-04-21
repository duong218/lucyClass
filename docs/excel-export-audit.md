# Báo cáo Kiểm toán Chức năng Xuất Excel (Excel Export Audit)

**Ngày**: 2026-04-21  
**Dự án**: `lucyClass-main`  
**Người thực hiện**: Antigravity AI Auditor

---

## 1. DANH SÁCH CÁC CHỨC NĂNG XUẤT EXCEL

Dựa trên việc quét codebase, dự án hiện có 3 chức năng xuất Excel chính:

| STT | Vị trí (file:line) | Loại | Mục đích | Ghi chú |
|-----|-------------------|------|----------|---------|
| 1 | `backend/controllers/registrationController.js:489-556` | API (POST) | Xuất danh sách đăng ký học | Dùng `xlsx` (buffer) |
| 2 | `backend/controllers/courseController.js:379-564` | API (GET) | Xuất bảng điểm danh theo ngày | Dùng `exceljs` (stream) |
| 3 | `backend/controllers/timetableController.js:314-412` | API (POST) | Xuất thời khóa biểu theo tuần | Dùng `xlsx` (buffer) |

---

## 2. THƯ VIỆN ĐANG ĐƯỢC SỬ DỤNG (Backend)

Phân tích `backend/package.json`:

| Thư viện | Phiên bản | Vị trí dùng | Mục đích sử dụng |
|----------|-----------|-------------|------------------|
| `exceljs` | `^4.4.0` | `courseController` | Tạo file điểm danh có styling phức tạp (màu sắc, border) |
| `xlsx` | `^0.18.5` | `registrationController`, `timetableController` | Tạo file Excel cơ bản từ JSON/AOA |
| `json2csv`| `^6.0.0-alpha.2`| Chưa thấy dùng | Có thể dùng cho các báo cáo dạng CSV đơn giản |

**Nhận xét**: Dự án đang dùng song song 2 thư viện Excel khác nhau (`exceljs` và `xlsx`), gây dư thừa dependency và không nhất quán về code style.

---

## 3. PHÂN TÍCH CÁCH THỨC XUẤT EXCEL HIỆN TẠI

### 3.1. Xuất danh sách Đăng ký (Registration)
- **Dữ liệu nguồn**: `Registration.find().populate('courseId')` -> Lấy toàn bộ bản ghi.
- **Phương pháp**: **Memory Buffer** (`xlsx.write(workbook, { type: 'buffer' })`).
- **Validation**: Không có validation dữ liệu đầu vào.
- **Giới hạn**: Không giới hạn số lượng bản ghi (nguy cơ treo server nếu data lớn).
- **Giao hàng**: Gửi buffer trực tiếp qua `res.send()`.

### 3.2. Xuất bảng Điểm danh (Attendance)
- **Dữ liệu nguồn**: `Registration` (học sinh active) + `Attendance` (bản ghi ngày cụ thể).
- **Phương pháp**: **Streaming** (`workbook.xlsx.write(res)`).
- **Validation**: Kiểm tra `mongoose.Types.ObjectId.isValid(id)`.
- **Giới hạn**: Chỉ xuất dữ liệu của 1 lớp trong 1 ngày.
- **Giao hàng**: Stream trực tiếp vào response object (Tốt cho hiệu năng).

### 3.3. Xuất Thời khóa biểu (Timetable)
- **Dữ liệu nguồn**: `TimetableRow` + `TimetableCell`.
- **Phương pháp**: **Memory Buffer** (`XLSX.write(wb, { type: 'buffer' })`).
- **Validation**: Yêu cầu `weekDate`.
- **Giới hạn**: Chỉ xuất theo tuần.
- **Giao hàng**: Gửi buffer qua `res.send()`.

---

## 4. ĐÁNH GIÁ RỦI RO BẢO MẬT & HIỆU NĂNG

| Tiêu chí | Hiện trạng | Mức độ | Giải thích |
|----------|-----------|---------------|-------------|
| **Formula Injection** | ❌ Chưa escape | 🔴 CAO | Các trường `parentName`, `childName`, `message` nếu chứa các ký tự `=`, `+`, `-`, `@` có thể thực thi lệnh khi mở file Excel. |
| **Memory Overflow** | ⚠️ Dùng buffer | 🟡 TRUNG BÌNH | Chức năng xuất Registration lấy TOÀN BỘ dữ liệu vào RAM trước khi gửi. Nếu có 100k+ bản ghi, server có thể bị OOM (Out of Memory). |
| **Path Traversal** | ✅ An toàn | 🟢 THẤP | Tên file được sanitize bằng regex hoặc cố định cấu trúc. |
| **Information Disclosure**| ✅ An toàn | 🟢 THẤP | Endpoint được bảo vệ bởi middleware `auth` và `isAdmin`. |
| **Rate Limiting** | ⚠️ Chưa tối ưu | 🟡 TRUNG BÌNH | Export Excel tốn tài nguyên CPU. Chưa có rate limit riêng (ví dụ: chỉ cho phép export 1 lần mỗi 30s). |

---

## 5. SO SÁNH CÁC THƯ VIỆN EXCEL

| Thư viện | Hiệu năng (10k rows) | Bảo mật | Memory usage | Streaming | Formula Escape | Styling |
|----------|----------------------|---------|--------------|-----------|----------------|---------|
| **exceljs** | Khá tốt | Trung bình | Thấp (khi stream) | ✅ Có | ❌ Không | ⭐⭐⭐⭐⭐ |
| **xlsx (SheetJS)** | Rất nhanh | Thấp | Cao (buffer) | ❌ Không (bản free) | ❌ Không | ⭐⭐ |
| **fast-excel** | Cực nhanh | Trung bình | Rất thấp | ✅ Có | ❌ Không | ⭐ |

---

## 6. ĐỀ XUẤT GIẢI PHÁP

### 6.1. Khuyến nghị chính: Thống nhất dùng `exceljs`
- **Lý do**: Hỗ trợ Streaming (tiết kiệm RAM), Styling tốt (giúp báo cáo chuyên nghiệp hơn), và đã có sẵn trong dự án.
- **Cách làm**: Chuyển đổi logic từ `xlsx` sang `exceljs` trong `registrationController` và `timetableController`.

### 6.2. Giải pháp bảo mật (CẦN LÀM NGAY)
- Viết một utility để escape các ký tự gây ra Formula Injection (thêm dấu nháy đơn `'` vào trước các giá trị bắt đầu bằng `=`, `+`, `-`, `@`).

---

## 7. HƯỚNG DẪN IMPLEMENTATION AN TOÀN

Dưới đây là mẫu `excelExportService.js` khuyến nghị sử dụng:

```javascript
const ExcelJS = require('exceljs');

/**
 * Escape Excel Formula Injection characters
 */
const escapeFormula = (value) => {
  if (typeof value !== 'string') return value;
  const formulaChars = ['=', '+', '-', '@'];
  if (formulaChars.includes(value.charAt(0))) {
    return `'${value}`;
  }
  return value;
};

/**
 * Export data to Excel using Streaming
 */
exports.exportWithStream = async (res, { filename, columns, data }) => {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true
  });

  const worksheet = workbook.addWorksheet('Data');

  // Define columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 20
  }));

  // Add rows with escape logic
  data.forEach(item => {
    const escapedItem = {};
    Object.keys(item).forEach(key => {
      escapedItem[key] = escapeFormula(item[key]);
    });
    worksheet.addRow(escapedItem).commit();
  });

  worksheet.commit();
  await workbook.commit();
};
```

### Nguyên tắc vàng:
1. **Luôn dùng Streaming** cho dataset không xác định kích thước (như danh sách học sinh).
2. **Escape Formula** cho tất cả các trường dữ liệu do người dùng nhập vào.
3. **Set Timeout**: Với các export lớn, cần set `req.setTimeout(0)` hoặc giới hạn dữ liệu (Max 10,000 dòng).
4. **Audit Log**: Luôn gọi `logAdminAction` khi có người thực hiện export dữ liệu nhạy cảm.

---
*Báo cáo được thực hiện bởi Antigravity AI Security Auditor.*

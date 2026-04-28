import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─── Màu chủ đạo khớp với giao diện Lucy Class ───────────────────────────
const C = {
  darkTeal:    '1C695C',   // sidebar chính
  midTeal:     '3FA48F',   // gradient phụ
  lightTeal:   'E8F5F3',   // nền nhạt
  headerText:  'FFFFFF',
  pinkSep:     'FFD6E0',   // dòng ngăn cách màu hồng
  oddRow:      'F0FAF8',
  evenRow:     'FFFFFF',
  activeBg:    'D4EDDA', activeText:  '155724',
  inactiveBg:  'F8D7DA', inactiveText:'721C24',
  transferBg:  'FFF3CD', transferText:'856404',
  border:      'B2DFDB',
  summaryBg:   'F0FAF8',
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const border = (color = C.border) => ({
  style: 'thin', color: { argb: 'FF' + color },
});
const allBorders = (color) => {
  const b = border(color);
  return { top: b, left: b, bottom: b, right: b };
};

const statusInfo = (s) => {
  if (!s.isActive) {
    // Kiểm tra có chuyển lớp không
    if (s.transferHistory && s.transferHistory.length > 0)
      return { label: 'Đã chuyển', bg: C.transferBg, text: C.transferText };
    return { label: 'Đã nghỉ', bg: C.inactiveBg, text: C.inactiveText };
  }
  return { label: 'Hoạt động', bg: C.activeBg, text: C.activeText };
};

const teacherNames = (course) => {
  const names = [];
  if (course.teacher?.name) names.push(course.teacher.name);
  if (Array.isArray(course.additionalTeachers)) {
    course.additionalTeachers.forEach(t => { if (t?.name) names.push(t.name + ' (phụ)'); });
  }
  return names.length ? names.join(', ') : '—';
};

const nowViString = () => {
  const now = new Date();
  return now.toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }) + '  —  ' + now.toLocaleTimeString('vi-VN');
};

const safeFileName = (str) => (str || '').replace(/[^a-zA-Z0-9_\-]/g, '_');

// ─── Vẽ 1 bảng lớp vào worksheet từ startRow, trả về row tiếp theo ────────
const drawCourseBlock = (ws, course, startRow) => {
  const students = course.students || [];
  let r = startRow;

  // ── Header lớp (teal đậm) ───────────────────────────────────────────────
  ws.mergeCells(`A${r}:I${r}`);
  const titleCell = ws.getCell(`A${r}`);
  titleCell.value = `📚  ${(course.name || 'Lớp học').toUpperCase()}`;
  titleCell.font = { bold: true, size: 13, color: { argb: 'FF' + C.headerText }, name: 'Arial' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.darkTeal } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(r).height = 28;
  r++;

  // ── Sub-header thông tin lớp ────────────────────────────────────────────
  ws.mergeCells(`A${r}:I${r}`);
  const infoCell = ws.getCell(`A${r}`);
  const activeCount = students.filter(s => s.isActive).length;
  infoCell.value = [
    `Giáo viên: ${teacherNames(course)}`,
    `Sĩ số hiện tại: ${activeCount}/${course.classSize || '—'}`,
    `Nhóm tuổi: ${course.ageGroup || '—'}`,
    `Trạng thái lớp: ${activeCount >= (course.classSize || 9999) ? 'Đã đầy' : 'Còn chỗ'}`,
  ].join('   |   ');
  infoCell.font = { italic: true, size: 9.5, color: { argb: 'FF' + C.headerText }, name: 'Arial' };
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.midTeal } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(r).height = 20;
  r++;

  // ── Tiêu đề cột ────────────────────────────────────────────────────────
  const headers = ['STT', 'Tên học sinh', 'Nhóm tuổi', 'Tên phụ huynh', 'Số điện thoại', 'Xếp hạng ⭐', 'Ghi chú', 'Lịch sử chuyển lớp', 'Trạng thái'];
  const hRow = ws.getRow(r);
  hRow.height = 22;
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D9B8A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = allBorders(C.border);
  });
  r++;

  // ── Dữ liệu học sinh ───────────────────────────────────────────────────
  if (students.length === 0) {
    ws.mergeCells(`A${r}:I${r}`);
    const emptyCell = ws.getCell(`A${r}`);
    emptyCell.value = 'Chưa có học sinh trong lớp này';
    emptyCell.font = { italic: true, color: { argb: 'FF888888' }, name: 'Arial', size: 10 };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(r).height = 20;
    r++;
  } else {
    students.forEach((s, idx) => {
      const dRow = ws.getRow(r);
      dRow.height = 20;
      const rowBg = idx % 2 === 0 ? C.oddRow : C.evenRow;
      const { label, bg: stBg, text: stText } = statusInfo(s);

      // Lịch sử chuyển lớp rút gọn
      let transferNote = '—';
      if (s.transferHistory && s.transferHistory.length > 0) {
        transferNote = `${s.transferHistory.length} lần`;
      }

      const values = [
        idx + 1,
        s.childName || '—',
        s.childAge || '—',
        s.parentName || '—',
        s.phone || '—',
        s.ranking ? `⭐ ${s.ranking}` : '—',
        s.note || '—',
        transferNote,
        label,
      ];

      values.forEach((val, i) => {
        const cell = dRow.getCell(i + 1);
        cell.value = val;
        cell.font = { size: 10, name: 'Arial' };
        cell.alignment = {
          vertical: 'middle',
          horizontal: i === 0 || i === 8 ? 'center' : 'left',
          wrapText: i === 6, // chỉ wrap cột ghi chú
        };
        if (i === 8) {
          // Cột trạng thái — màu riêng
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + stBg } };
          cell.font = { ...cell.font, bold: true, color: { argb: 'FF' + stText } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rowBg } };
        }
        cell.border = allBorders(C.border);
      });
      r++;
    });
  }

  // ── Tổng kết cuối bảng ─────────────────────────────────────────────────
  ws.mergeCells(`A${r}:H${r}`);
  const sumCell = ws.getCell(`A${r}`);
  const inactive = students.filter(s => !s.isActive).length;
  sumCell.value = `Tổng: ${students.length} học sinh   |   Hoạt động: ${activeCount}   |   Đã nghỉ/chuyển: ${inactive}`;
  sumCell.font = { bold: true, italic: true, size: 9, color: { argb: 'FF555555' }, name: 'Arial' };
  sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.summaryBg } };
  sumCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  // Cột I tổng kết
  const sumLastCell = ws.getCell(`I${r}`);
  sumLastCell.fill = sumCell.fill;
  sumLastCell.border = allBorders(C.border);
  ws.getRow(r).height = 18;
  r++;

  // ── Dòng ngăn cách màu hồng ────────────────────────────────────────────
  ws.mergeCells(`A${r}:I${r}`);
  ws.getCell(`A${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.pinkSep } };
  ws.getRow(r).height = 7;
  r++;

  // Dòng đệm trắng
  ws.getRow(r).height = 6;
  r++;

  return r;
};

// ─── Cấu hình cột chung ───────────────────────────────────────────────────
const setColumns = (ws) => {
  ws.columns = [
    { width: 5.5 },   // STT
    { width: 22 },    // Tên học sinh
    { width: 13 },    // Nhóm tuổi
    { width: 22 },    // Phụ huynh
    { width: 15 },    // SĐT
    { width: 13 },    // Xếp hạng
    { width: 28 },    // Ghi chú
    { width: 16 },    // Lịch sử chuyển
    { width: 13 },    // Trạng thái
  ];
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT TẤT CẢ KHÓA HỌC
// ─────────────────────────────────────────────────────────────────────────────
export const exportAllStudentsExcel = async (courses) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Lucy Class';
  wb.created = new Date();

  const ws = wb.addWorksheet('Danh sách học sinh', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ state: 'frozen', ySplit: 5 }],
  });
  setColumns(ws);

  // ── Tiêu đề chính ───────────────────────────────────────────────────────
  ws.mergeCells('A1:I1');
  const mainTitle = ws.getCell('A1');
  mainTitle.value = 'DANH SÁCH HỌC SINH TOÀN BỘ KHÓA HỌC — LUCY CLASS';
  mainTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
  mainTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.darkTeal } };
  mainTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 38;

  // ── Ngày xuất ───────────────────────────────────────────────────────────
  ws.mergeCells('A2:I2');
  const dateCell = ws.getCell('A2');
  dateCell.value = `Ngày xuất: ${nowViString()}`;
  dateCell.font = { italic: true, size: 10, color: { argb: 'FF444444' }, name: 'Arial' };
  dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.lightTeal } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  // ── Tổng quan ───────────────────────────────────────────────────────────
  ws.mergeCells('A3:I3');
  const totalStudents = courses.reduce((s, c) => s + (c.students?.length || 0), 0);
  const totalActive   = courses.reduce((s, c) => s + (c.students?.filter(st => st.isActive).length || 0), 0);
  const overviewCell  = ws.getCell('A3');
  overviewCell.value  = `Tổng số lớp: ${courses.length}   |   Tổng học sinh: ${totalStudents}   |   Đang hoạt động: ${totalActive}`;
  overviewCell.font   = { bold: true, size: 11, color: { argb: 'FF' + C.darkTeal }, name: 'Arial' };
  overviewCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
  overviewCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 22;

  // Padding
  ws.getRow(4).height = 8;
  ws.getRow(5).height = 8;

  // ── Vẽ từng lớp ─────────────────────────────────────────────────────────
  let currentRow = 6;
  for (const course of courses) {
    currentRow = drawCourseBlock(ws, course, currentRow);
  }

  // ── Xuất file ───────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
  saveAs(blob, `LucyClass_TatCaHocSinh_${dateStr}.xlsx`);
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT 1 KHÓA HỌC CỤ THỂ
// ─────────────────────────────────────────────────────────────────────────────
export const exportSingleCourseExcel = async (course) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Lucy Class';
  wb.created = new Date();

  const sheetName = (course.name || 'Lop').substring(0, 30); // Excel giới hạn 31 ký tự tên sheet
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });
  setColumns(ws);

  // ── Tiêu đề ─────────────────────────────────────────────────────────────
  ws.mergeCells('A1:I1');
  const mainTitle = ws.getCell('A1');
  mainTitle.value = `DANH SÁCH HỌC SINH — ${(course.name || '').toUpperCase()}`;
  mainTitle.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
  mainTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.darkTeal } };
  mainTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  // ── Ngày xuất ───────────────────────────────────────────────────────────
  ws.mergeCells('A2:I2');
  const dateCell = ws.getCell('A2');
  dateCell.value = `Ngày xuất: ${nowViString()}`;
  dateCell.font = { italic: true, size: 10, color: { argb: 'FF444444' }, name: 'Arial' };
  dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.lightTeal } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  ws.getRow(3).height = 8;

  // ── Vẽ bảng ─────────────────────────────────────────────────────────────
  drawCourseBlock(ws, course, 4);

  // ── Xuất file ───────────────────────────────────────────────────────────
  const buffer  = await wb.xlsx.writeBuffer();
  const blob    = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
  saveAs(blob, `LucyClass_${safeFileName(course.name)}_${dateStr}.xlsx`);
};

const StaffAttendance = require('../models/StaffAttendance');
const StaffAccount = require('../models/StaffAccount');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

/**
 * Helper: lấy ngày hiện tại theo VN timezone → string YYYY-MM-DD
 */
const getTodayVN = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};

const isValidDateString = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
const TOGGLE_MIN_INTERVAL_MS = 3000;
const MAX_LOGS_PER_DAY = 20; // tối đa 10 cặp checkin/checkout/ngày

const ensureAdmin = (req, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return false;
  }
  return true;
};

const ensureStaffRole = (req, res) => {
  if (!['teacher', 'marketing'].includes(req.user?.role)) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return false;
  }
  return true;
};

const formatTimeVN = (time) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(time));

const validateAlternatingLogs = (logs = []) => {
  if (!Array.isArray(logs)) return false;
  if (logs.length === 0) return false;
  if (logs[0]?.type !== 'checkin') return false;
  if (logs.length % 2 !== 0) return false;
  for (let i = 0; i < logs.length; i += 1) {
    const log = logs[i];
    if (!log || !['checkin', 'checkout'].includes(log.type) || !log.time) {
      return false;
    }
    if (i > 0 && logs[i - 1].type === log.type) {
      return false;
    }
  }
  return true;
};

const appendAutoCheckoutIfMissing = (normalizedLogs, date) => {
  if (!Array.isArray(normalizedLogs) || normalizedLogs.length === 0) {
    return { logs: normalizedLogs, autoAdded: false };
  }

  const lastLog = normalizedLogs[normalizedLogs.length - 1];
  if (normalizedLogs.length % 2 !== 0 && lastLog?.type === 'checkin' && isValidDateString(date)) {
    const endOfDay = new Date(`${date}T23:59:59+07:00`);
    if (!Number.isNaN(endOfDay.getTime()) && lastLog.time <= endOfDay) {
      return {
        logs: [...normalizedLogs, { type: 'checkout', time: endOfDay }],
        autoAdded: true
      };
    }
  }

  return { logs: normalizedLogs, autoAdded: false };
};

const normalizeAndValidateLogs = (logs, date) => {
  if (!Array.isArray(logs)) {
    return { valid: false, message: 'logs must be an array' };
  }

  const normalizedLogs = [...logs]
    .map((log) => ({ type: log?.type, time: new Date(log?.time) }))
    .sort((a, b) => a.time - b.time);

  const hasInvalidTime = normalizedLogs.some((log) => Number.isNaN(log.time.getTime()));
  if (hasInvalidTime) {
    return { valid: false, message: 'Log time không hợp lệ' };
  }

  const { logs: normalizedWithAutoCheckout, autoAdded } = appendAutoCheckoutIfMissing(normalizedLogs, date);

  if (!validateAlternatingLogs(normalizedWithAutoCheckout)) {
    return {
      valid: false,
      message: 'Logs không hợp lệ. Hành động phải luân phiên checkin/checkout.'
    };
  }

  return { valid: true, normalizedLogs: normalizedWithAutoCheckout, autoAddedCheckout: autoAdded };
};

// ──────────────────────────────────────────────────────────────
// POST /api/staff-attendance/toggle
// Toggle checkin ↔ checkout — dùng chung 1 endpoint
// ──────────────────────────────────────────────────────────────
exports.toggleAttendance = async (req, res, next) => {
  try {
    if (!ensureStaffRole(req, res)) return;
    const staffId = req.user.id;
    const today = getTodayVN();

    let record = await StaffAttendance.findOne({ staffId, date: today });

    if (!record) {
      // Chưa có record hôm nay → tạo mới với log checkin đầu tiên
      record = await StaffAttendance.create({
        staffId,
        date: today,
        logs: [{ type: 'checkin', time: new Date() }]
      });

      return res.status(201).json({
        success: true,
        message: 'Check-in thành công',
        data: record
      });
    }

    // Đã có record → kiểm tra action cuối
    const lastLog = record.logs[record.logs.length - 1];
    if (lastLog?.time && (Date.now() - new Date(lastLog.time).getTime()) < TOGGLE_MIN_INTERVAL_MS) {
      return res.status(429).json({ success: false, message: 'Thao tác quá nhanh, vui lòng thử lại' });
    }

    // Giới hạn số lần chấm công trong ngày
    if (record.logs.length >= MAX_LOGS_PER_DAY) {
      return res.status(400).json({
        success: false,
        message: `Số lần chấm công trong ngày đã đạt giới hạn (${MAX_LOGS_PER_DAY / 2} ca)`
      });
    }

    const nextAction = lastLog.type === 'checkin' ? 'checkout' : 'checkin';

    record.logs.push({ type: nextAction, time: new Date() });
    await record.save();

    return res.json({
      success: true,
      message: nextAction === 'checkin' ? 'Check-in thành công' : 'Check-out thành công',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/staff-attendance/today
// Lấy bản ghi chấm công hôm nay của user đang đăng nhập
// ──────────────────────────────────────────────────────────────
exports.getTodayAttendance = async (req, res, next) => {
  try {
    if (!ensureStaffRole(req, res)) return;
    const staffId = req.user.id;
    const today = getTodayVN();

    const record = await StaffAttendance.findOne({ staffId, date: today });

    return res.json({
      success: true,
      data: record || { staffId, date: today, logs: [] }
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/staff-attendance/history
// Lịch sử chấm công 30 ngày gần nhất
// ──────────────────────────────────────────────────────────────
exports.getAttendanceHistory = async (req, res, next) => {
  try {
    if (!ensureStaffRole(req, res)) return;
    const staffId = req.user.id;

    // Tính ngày 30 ngày trước theo VN timezone
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const past = new Date(vnNow);
    past.setDate(past.getDate() - 30);
    const fromDate = past.toISOString().slice(0, 10);

    const records = await StaffAttendance.find({
      staffId,
      date: { $gte: fromDate }
    }).sort({ date: -1 });

    return res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/staff-attendance/date/:date
// Admin: xem chấm công tất cả nhân viên theo ngày
// ──────────────────────────────────────────────────────────────
exports.getAttendanceByDate = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { date } = req.params;

    // Validate date format
    if (!isValidDateString(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format (YYYY-MM-DD)' });
    }

    // Lấy tất cả teacher/marketing active
    const allStaff = await StaffAccount.find({
      isActive: true,
      role: { $in: ['teacher', 'marketing'] }
    })
      .select('_id username displayName role')
      .lean();

    // Lấy records chấm công ngày đó
    const records = await StaffAttendance.find({ date }).lean();
    const recordMap = {};
    records.forEach(r => {
      recordMap[r.staffId.toString()] = r;
    });

    // Merge: mỗi staff + attendance data
    const result = allStaff.map(staff => {
      const attendance = recordMap[staff._id.toString()];
      return {
        staff: {
          _id: staff._id,
          username: staff.username,
          displayName: staff.displayName,
          role: staff.role
        },
        attendance: attendance || null
      };
    });

    return res.json({ success: true, data: result, date });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/staff-attendance/:id
// Admin: chỉnh sửa thủ công logs chấm công
// ──────────────────────────────────────────────────────────────
exports.updateAttendance = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { logs } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const record = await StaffAttendance.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const normalized = normalizeAndValidateLogs(logs, record.date);
    if (!normalized.valid) {
      return res.status(400).json({ success: false, message: normalized.message });
    }

    record.logs = normalized.normalizedLogs.map(l => ({
      type: l.type,
      time: l.time
    }));
    record.updatedBy = req.user?.id || null;
    record.updatedAt = new Date();
    await record.save();

    return res.json({
      success: true,
      message: normalized.autoAddedCheckout
        ? 'Cập nhật chấm công thành công. Hệ thống đã tự động thêm check-out lúc 23:59 do thiếu dữ liệu'
        : 'Cập nhật chấm công thành công',
      autoAddedCheckout: normalized.autoAddedCheckout,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/attendance/admin/upsert
// Admin: tạo mới/chỉnh sửa record theo staffId + date
// ──────────────────────────────────────────────────────────────
exports.upsertAttendanceByDate = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { staffId, date, logs } = req.body;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ success: false, message: 'Invalid staffId format' });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format (YYYY-MM-DD)' });
    }

    // Không cho phép tạo/sửa chấm công cho ngày tương lai
    if (date > getTodayVN()) {
      return res.status(400).json({ success: false, message: 'Không thể tạo chấm công cho ngày tương lai' });
    }

    const normalized = normalizeAndValidateLogs(logs, date);
    if (!normalized.valid) {
      return res.status(400).json({ success: false, message: normalized.message });
    }

    const staff = await StaffAccount.findOne({
      _id: staffId,
      isActive: true,
      role: { $in: ['teacher', 'marketing'] }
    }).select('_id');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff không tồn tại hoặc không hợp lệ' });
    }

    const updated = await StaffAttendance.findOneAndUpdate(
      { staffId, date },
      {
        staffId,
        date,
        logs: normalized.normalizedLogs,
        updatedBy: req.user?.id || null,
        updatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: normalized.autoAddedCheckout
        ? 'Cập nhật chấm công thành công. Hệ thống đã tự động thêm check-out lúc 23:59 do thiếu dữ liệu'
        : 'Cập nhật chấm công thành công',
      autoAddedCheckout: normalized.autoAddedCheckout,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/staff-attendance/export?from=YYYY-MM-DD&to=YYYY-MM-DD
// Admin: xuất file Excel chấm công nhân sự
// ──────────────────────────────────────────────────────────────
exports.exportAttendance = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { from, to } = req.query;
    if (!isValidDateString(from) || !isValidDateString(to)) {
      return res.status(400).json({ success: false, message: 'Invalid date format (YYYY-MM-DD)' });
    }
    if (from > to) {
      return res.status(400).json({ success: false, message: 'Khoảng ngày không hợp lệ' });
    }

    // Giới hạn tối đa 90 ngày để tránh export quá lớn
    const diffDays = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      return res.status(400).json({ success: false, message: 'Khoảng thời gian xuất tối đa là 90 ngày' });
    }

    const records = await StaffAttendance.find({
      date: { $gte: from, $lte: to }
    })
      .populate('staffId', 'displayName username role')
      .sort({ date: 1, staffId: 1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');
    const headers = ['Nhân viên', 'Vai trò', 'Ngày', 'Check-in', 'Check-out', 'Số ca'];
    sheet.addRow(headers);

    const headerRow = sheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F5E3B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    records.forEach((record, idx) => {
      const checkins = (record.logs || [])
        .filter((l) => l.type === 'checkin')
        .map((l) => formatTimeVN(l.time));
      const checkouts = (record.logs || [])
        .filter((l) => l.type === 'checkout')
        .map((l) => formatTimeVN(l.time));
      const sessions = Math.min(checkins.length, checkouts.length);

      const row = sheet.addRow([
        record.staffId?.displayName || record.staffId?.username || 'N/A',
        record.staffId?.role || 'N/A',
        record.date,
        checkins.join(', '),
        checkouts.join(', '),
        sessions
      ]);

      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F7' } };
        });
      }

      row.getCell(4).font = { color: { argb: 'FF1B8F3A' } };
      row.getCell(5).font = { color: { argb: 'FFC96A3D' } };
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      });
    });

    sheet.columns.forEach((column) => {
      let maxLength = 12;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value == null ? '' : String(cell.value);
        maxLength = Math.max(maxLength, value.length + 2);
      });
      column.width = Math.min(maxLength, 50);
    });

    const fileName = `staff_attendance_${from}_to_${to}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/attendance/export-month?year=YYYY&month=MM
// Admin: xuất Excel chấm công toàn bộ một tháng
// File có 2 sheet: nhóm theo nhân viên + nhóm theo ngày
// ──────────────────────────────────────────────────────────────
exports.exportAttendanceByMonth = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { year, month } = req.query;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    if (!year || !month || isNaN(y) || isNaN(m) || m < 1 || m > 12 || y < 2000 || y > 2100) {
      return res.status(400).json({ success: false, message: 'Tham số year/month không hợp lệ' });
    }

    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const records = await StaffAttendance.find({ date: { $gte: from, $lte: to } })
      .populate('staffId', 'displayName username role')
      .sort({ date: 1, staffId: 1 })
      .lean();

    // ── Group dữ liệu ─────────────────────────────────────────
    const byStaff = {};
    const byDate = {};

    records.forEach((rec) => {
      const sid = rec.staffId?._id?.toString() || 'unknown';
      const name = rec.staffId?.displayName || rec.staffId?.username || 'N/A';
      const role = rec.staffId?.role || 'N/A';
      const checkins = (rec.logs || []).filter(l => l.type === 'checkin').map(l => formatTimeVN(l.time));
      const checkouts = (rec.logs || []).filter(l => l.type === 'checkout').map(l => formatTimeVN(l.time));
      const sessions = Math.min(checkins.length, checkouts.length);
      const note = rec.updatedBy ? 'Đã chỉnh sửa' : '';

      if (!byStaff[sid]) byStaff[sid] = { name, role, days: [] };
      byStaff[sid].days.push({ date: rec.date, checkins, checkouts, sessions, note });

      if (!byDate[rec.date]) byDate[rec.date] = { date: rec.date, entries: [] };
      byDate[rec.date].entries.push({ name, role, checkins, checkouts, sessions, note });
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AttendanceSystem';

    const COLOR_HEADER_BG = '1F5E3B';
    const COLOR_GROUP_BG  = 'D9EAD3';
    const COLOR_ROW_ALT   = 'F4FAF6';
    const COLOR_CHECKIN   = '1B8F3A';
    const COLOR_CHECKOUT  = 'C96A3D';
    const COLOR_SUMMARY_BG = 'EAF4EC';

    const styleHeader = (row) => {
      row.height = 22;
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    };

    const styleGroup = (row, ncols, label) => {
      row.height = 20;
      row.getCell(1).value = label;
      for (let c = 1; c <= ncols; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GROUP_BG } };
        row.getCell(c).font = { bold: true, name: 'Arial', size: 10 };
      }
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    };

    const styleData = (row, alt) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        if (alt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ROW_ALT } };
      });
    };

    // ── Sheet 1: Theo nhân viên ───────────────────────────────
    const s1 = workbook.addWorksheet('Theo nhan vien', { views: [{ state: 'frozen', ySplit: 1 }] });
    s1.columns = [
      { width: 22 }, { width: 13 }, { width: 20 }, { width: 20 }, { width: 8 }, { width: 16 }
    ];
    styleHeader(s1.addRow(['Nhân viên', 'Ngày', 'Check-in', 'Check-out', 'Số ca', 'Ghi chú']));

    let alt1 = false;
    Object.values(byStaff).sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach((staff) => {
      styleGroup(s1.addRow([]), 6, `${staff.name}  (${staff.role})`);
      staff.days.sort((a, b) => a.date.localeCompare(b.date)).forEach((day) => {
        const row = s1.addRow(['', day.date, day.checkins.join('\n') || '—', day.checkouts.join('\n') || '—', day.sessions, day.note]);
        styleData(row, alt1);
        row.getCell(3).font = { color: { argb: COLOR_CHECKIN }, name: 'Arial', size: 10 };
        row.getCell(4).font = { color: { argb: COLOR_CHECKOUT }, name: 'Arial', size: 10 };
        alt1 = !alt1;
      });
      const totalSessions = staff.days.reduce((s, d) => s + d.sessions, 0);
      const sumRow = s1.addRow(['', `Tổng: ${staff.days.length} ngày`, '', '', totalSessions, '']);
      sumRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUMMARY_BG } };
        cell.font = { bold: true, italic: true, name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      s1.addRow([]);
    });

    // ── Sheet 2: Theo ngày ────────────────────────────────────
    const s2 = workbook.addWorksheet('Theo ngay', { views: [{ state: 'frozen', ySplit: 1 }] });
    s2.columns = [
      { width: 22 }, { width: 13 }, { width: 20 }, { width: 20 }, { width: 8 }, { width: 16 }
    ];
    styleHeader(s2.addRow(['Nhân viên', 'Vai trò', 'Check-in', 'Check-out', 'Số ca', 'Ghi chú']));

    let alt2 = false;
    Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).forEach((day) => {
      styleGroup(s2.addRow([]), 6, `${day.date}  —  ${day.entries.length} nhân viên`);
      day.entries.sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach((entry) => {
        const row = s2.addRow([entry.name, entry.role, entry.checkins.join('\n') || '—', entry.checkouts.join('\n') || '—', entry.sessions, entry.note]);
        styleData(row, alt2);
        row.getCell(3).font = { color: { argb: COLOR_CHECKIN }, name: 'Arial', size: 10 };
        row.getCell(4).font = { color: { argb: COLOR_CHECKOUT }, name: 'Arial', size: 10 };
        alt2 = !alt2;
      });
      s2.addRow([]);
    });

    const fileName = `cham_cong_thang_${String(m).padStart(2, '0')}_${y}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    next(error);
  }
};

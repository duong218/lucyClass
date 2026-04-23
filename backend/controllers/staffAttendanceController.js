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

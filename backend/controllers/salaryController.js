/**
 * salaryController.js
 * Toàn bộ nghiệp vụ: salary_config, engine ghép ca, bảng lương, thưởng
 */

const mongoose = require('mongoose');
const SalaryConfig    = require('../models/SalaryConfig');
const SalaryConfigLog = require('../models/SalaryConfigLog');
const SalaryBonus     = require('../models/SalaryBonus');
const SessionTeacher  = require('../models/SessionTeacher');
const TimetableCell   = require('../models/TimetableCell');
const TimetableRow    = require('../models/TimetableRow');
const StaffAttendance = require('../models/StaffAttendance');
const StaffAccount    = require('../models/StaffAccount');
const Course          = require('../models/Course');
const Registration    = require('../models/Registration');
const SalarySystemSettings = require('../models/SalarySystemSettings');
const ExcelJS         = require('exceljs');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

const getTodayVN = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
};

const formatDateVN = (dateInput) => new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date(dateInput));

/**
 * Legacy week normalization currently used by timetable APIs.
 * Keep this so salary matching stays compatible with cells already saved before the fix.
 */
const normalizeLegacyMondayUTC = (dateInput) => {
  const d = new Date(dateInput);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
};

const getDayOfWeekVN = (dateStr) => {
  const vnMidday = new Date(`${dateStr}T12:00:00+07:00`);
  const jsDay = vnMidday.getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
};

const getMondayDateVN = (dateStr) => {
  const dayOfWeek = getDayOfWeekVN(dateStr);
  const vnMidday = new Date(`${dateStr}T12:00:00+07:00`);
  vnMidday.setUTCDate(vnMidday.getUTCDate() - (dayOfWeek - 1));
  return formatDateVN(vnMidday);
};

const getWeekDateCandidatesForDate = (dateStr) => {
  const mondayDateVN = getMondayDateVN(dateStr);
  const canonicalWeekDate = new Date(`${mondayDateVN}T00:00:00.000Z`);
  const legacyWeekDate = normalizeLegacyMondayUTC(`${mondayDateVN}T00:00:00+07:00`);

  const unique = new Map();
  for (const weekDate of [canonicalWeekDate, legacyWeekDate]) {
    unique.set(weekDate.getTime(), weekDate);
  }
  return [...unique.values()];
};

/** "HH:mm" → phút từ nửa đêm */
const hhmm2min = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const systemSettingsToJSON = (s) => ({
  _id: s._id,
  matchThresholdMinutes: s.matchThresholdMinutes,
  sessionMinutes: s.sessionMinutes,
  partTimeMultiplier: s.partTimeMultiplier,
  probationMultiplier: s.probationMultiplier,
  defaultBonusTuyenSinh: s.defaultBonusTuyenSinh,
  defaultBonusTestDauVao: s.defaultBonusTestDauVao,
  seedFt1Hs: s.seedFt1Hs,
  seedFt2Hs: s.seedFt2Hs,
  seedFt3Hs: s.seedFt3Hs,
  seedFt46Hs: s.seedFt46Hs,
  seedTaFt: s.seedTaFt,
  seedObserveFt: s.seedObserveFt,
  updatedAt: s.updatedAt,
  createdAt: s.createdAt
});

/**
 * Sinh bảng salary_config mặc định từ SalarySystemSettings (full-time + hệ số).
 */
const buildDefaultConfigs = (system) => {
  const pt = system.partTimeMultiplier;
  const tv = system.probationMultiplier;
  const ft1 = system.seedFt1Hs;
  const ft2 = system.seedFt2Hs;
  const ft3 = system.seedFt3Hs;
  const ft4 = system.seedFt46Hs;
  const taFt = system.seedTaFt;
  const obFt = system.seedObserveFt;

  const ftRows = [
    { sessionRole: 'full_time', studentCount: 1, salaryLevel: null, amount: ft1 },
    { sessionRole: 'full_time', studentCount: 2, salaryLevel: null, amount: ft2 },
    { sessionRole: 'full_time', studentCount: 3, salaryLevel: null, amount: ft3 },
    { sessionRole: 'full_time', studentCount: 4, salaryLevel: null, amount: ft4 }
  ];
  const configs = [...ftRows];
  for (const row of ftRows) {
    configs.push({
      sessionRole: 'part_time',
      studentCount: row.studentCount,
      salaryLevel: null,
      amount: Math.round(row.amount * pt)
    });
    configs.push({
      sessionRole: 'thu_viec',
      studentCount: row.studentCount,
      salaryLevel: null,
      amount: Math.round(row.amount * tv)
    });
  }
  for (const { role, base } of [
    { role: 'teacher_assistant', base: taFt },
    { role: 'observe', base: obFt }
  ]) {
    configs.push({ sessionRole: role, studentCount: null, salaryLevel: 'full_time', amount: base });
    configs.push({ sessionRole: role, studentCount: null, salaryLevel: 'part_time', amount: Math.round(base * pt) });
    configs.push({ sessionRole: role, studentCount: null, salaryLevel: 'thu_viec', amount: Math.round(base * tv) });
  }
  return configs;
};

/** GET /api/salary/settings — cấu hình hệ thống (lưu DB, chỉnh trên trang admin) */
exports.getSalarySettings = async (req, res, next) => {
  try {
    const doc = await SalarySystemSettings.getSingleton();
    res.json({ success: true, data: systemSettingsToJSON(doc.toObject()) });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/salary/settings — cập nhật tham số hệ thống (admin)
 * Body: các trường tuỳ chọn — matchThresholdMinutes, sessionMinutes, …
 */
exports.updateSalarySettings = async (req, res, next) => {
  try {
    const doc = await SalarySystemSettings.getSingleton();
    const b = req.body || {};
    const errs = [];

    const takeInt = (key, min, max, label) => {
      if (b[key] === undefined || b[key] === null || b[key] === '') return;
      const n = parseInt(String(b[key]).replace(/\s/g, '').replace(/\./g, ''), 10);
      if (!Number.isFinite(n) || n < min || n > max) errs.push(`${label} (số nguyên ${min}–${max})`);
      else doc[key] = n;
    };

    const takeFloat = (key, min, max, label) => {
      if (b[key] === undefined || b[key] === null || b[key] === '') return;
      const n = Number(b[key]);
      if (!Number.isFinite(n) || n < min || n > max) errs.push(`${label} (${min}–${max})`);
      else doc[key] = n;
    };

    takeInt('matchThresholdMinutes', 1, 180, 'Ngưỡng ghép ca (phút)');
    takeInt('sessionMinutes', 30, 300, 'Độ dài buổi chuẩn (phút)');
    takeFloat('partTimeMultiplier', 0.01, 1, 'Hệ số part-time');
    takeFloat('probationMultiplier', 0.01, 1, 'Hệ số thử việc');
    takeInt('defaultBonusTuyenSinh', 0, 500_000_000, 'Thưởng tuyển sinh (VNĐ)');
    takeInt('defaultBonusTestDauVao', 0, 500_000_000, 'Thưởng test (VNĐ)');
    takeInt('seedFt1Hs', 1, 500_000_000, 'Seed full-time 1 HS');
    takeInt('seedFt2Hs', 1, 500_000_000, 'Seed full-time 2 HS');
    takeInt('seedFt3Hs', 1, 500_000_000, 'Seed full-time 3 HS');
    takeInt('seedFt46Hs', 1, 500_000_000, 'Seed full-time 4–6 HS');
    takeInt('seedTaFt', 1, 500_000_000, 'Seed trợ giảng (FT)');
    takeInt('seedObserveFt', 1, 500_000_000, 'Seed dự giờ (FT)');

    if (errs.length) {
      return res.status(400).json({ success: false, message: errs.join('; ') });
    }

    await doc.save();
    res.json({ success: true, data: systemSettingsToJSON(doc.toObject()), message: 'Đã lưu cấu hình hệ thống' });
  } catch (err) {
    next(err);
  }
};

/**
 * Tra bảng lương: sessionRole + studentCount → amount
 * teacher_assistant / observe: studentCount = null, cần salaryLevel
 */
const lookupSalary = async (sessionRole, studentCount, salaryLevel = null) => {
  let query = { sessionRole };

  if (['teacher_assistant', 'observe'].includes(sessionRole)) {
    query.studentCount = null;
    query.salaryLevel  = salaryLevel || 'full_time';
  } else {
    // Chuẩn hoá: >=4 hs → bucket 4
    const bucket = studentCount >= 4 ? 4 : studentCount;
    query.studentCount = bucket;
    query.salaryLevel  = null;
  }

  const config = await SalaryConfig.findOne(query).lean();
  return config ? config.amount : 0;
};

/**
 * Seed dữ liệu mặc định nếu SalaryConfig trống.
 * Gọi 1 lần khi khởi động hoặc qua API seed.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. SALARY CONFIG — CRUD
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/salary/config — Lấy toàn bộ bảng lương */
exports.getSalaryConfig = async (req, res, next) => {
  try {
    const configs = await SalaryConfig.find().lean();
    res.json({ success: true, data: configs });
  } catch (err) {
    next(err);
  }
};

/** POST /api/salary/config/seed — Seed dữ liệu mặc định (chỉ khi trống) */
exports.seedSalaryConfig = async (req, res, next) => {
  try {
    const count = await SalaryConfig.countDocuments();
    if (count > 0) {
      return res.json({ success: true, message: 'Đã có dữ liệu, bỏ qua seed', seeded: false });
    }
    const system = await SalarySystemSettings.getSingleton();
    const defaults = buildDefaultConfigs(system.toObject());
    await SalaryConfig.insertMany(defaults);
    res.status(201).json({ success: true, message: 'Seed thành công', seeded: true, count: defaults.length });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/salary/config/:id — Cập nhật 1 ô lương
 * Body: { amount }
 * Ghi log mỗi lần sửa.
 */
exports.updateSalaryConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'amount phải là số dương' });
    }

    const config = await SalaryConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cấu hình lương' });
    }

    const oldAmount = config.amount;
    config.amount = Number(amount);
    await config.save();

    // Ghi log
    await SalaryConfigLog.create({
      sessionRole:   config.sessionRole,
      studentCount:  config.studentCount,
      salaryLevel:   config.salaryLevel,
      oldAmount,
      newAmount:     config.amount,
      updatedBy:     req.user?.id || req.admin?.id,
      updatedByName: req.user?.username || req.admin?.username || 'Admin'
    });

    res.json({ success: true, data: config, message: 'Cập nhật thành công' });
  } catch (err) {
    next(err);
  }
};

/** GET /api/salary/config/logs — Lịch sử chỉnh sửa (50 gần nhất) */
exports.getSalaryConfigLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const logs = await SalaryConfigLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SESSION TEACHERS — CRUD trên ô TKB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/salary/session-teachers/:cellId
 * Lấy danh sách GV (tối đa 2) của 1 ô TKB
 */
exports.getSessionTeachers = async (req, res, next) => {
  try {
    const { cellId } = req.params;
    const teachers = await SessionTeacher.find({ sessionId: cellId })
      .populate('teacherId', 'displayName username role')
      .populate('courseId', 'name currentStudents')
      .sort({ isMain: -1 })
      .lean();

    res.json({ success: true, data: teachers });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/salary/session-teachers/:cellId
 * Lưu toàn bộ danh sách GV cho 1 ô TKB (upsert — xoá cũ, ghi mới)
 *
 * Body:
 * {
 *   teachers: [
 *     { teacherId, sessionRole, courseId, isMain: true },
 *     { teacherId, sessionRole, courseId, isMain: false }  // optional
 *   ]
 * }
 */
exports.upsertSessionTeachers = async (req, res, next) => {
  try {
    const { cellId } = req.params;
    const { teachers = [] } = req.body;

    // Validation
    if (!Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({ success: false, message: 'teachers phải là mảng có ít nhất 1 phần tử' });
    }
    if (teachers.length > 2) {
      return res.status(400).json({ success: false, message: 'Tối đa 2 giáo viên mỗi ô TKB' });
    }

    const mainTeachers = teachers.filter(t => t.isMain);
    if (mainTeachers.length !== 1) {
      return res.status(400).json({ success: false, message: 'Phải có đúng 1 giáo viên thứ nhất (isMain: true)' });
    }

    // Không được chọn cùng 1 người
    if (teachers.length === 2 && teachers[0].teacherId === teachers[1].teacherId) {
      return res.status(400).json({ success: false, message: 'Không được chọn cùng 1 giáo viên cho cả hai vị trí' });
    }

    const VALID_ROLES = ['full_time', 'part_time', 'thu_viec', 'teacher_assistant', 'observe'];
    const TIER_ROLES = ['teacher_assistant', 'observe'];
    for (const t of teachers) {
      if (!t.teacherId || !t.sessionRole) {
        return res.status(400).json({ success: false, message: 'teacherId và sessionRole là bắt buộc' });
      }
      if (!VALID_ROLES.includes(t.sessionRole)) {
        return res.status(400).json({ success: false, message: `sessionRole không hợp lệ: ${t.sessionRole}` });
      }
      if (TIER_ROLES.includes(t.sessionRole)) {
        const tier = t.payTier || 'full_time';
        if (!['full_time', 'part_time', 'thu_viec'].includes(tier)) {
          return res.status(400).json({ success: false, message: 'payTier phải là full_time, part_time hoặc thu_viec (trợ giảng / dự giờ)' });
        }
      }
    }

    // Kiểm tra cell tồn tại
    const cell = await TimetableCell.findById(cellId);
    if (!cell) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ô TKB' });
    }

    // Xoá dữ liệu cũ rồi ghi mới
    await SessionTeacher.deleteMany({ sessionId: cellId });

    const docs = teachers.map(t => ({
      sessionId:   cellId,
      teacherId:   t.teacherId,
      sessionRole: t.sessionRole,
      courseId:    t.courseId || null,
      isMain:      !!t.isMain,
      payTier:     TIER_ROLES.includes(t.sessionRole) ? (t.payTier || 'full_time') : null
    }));
    const saved = await SessionTeacher.insertMany(docs);

    res.json({ success: true, data: saved, message: 'Lưu thành công' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/salary/session-teachers/:cellId
 * Xoá toàn bộ GV khỏi 1 ô TKB
 */
exports.deleteSessionTeachers = async (req, res, next) => {
  try {
    const { cellId } = req.params;
    await SessionTeacher.deleteMany({ sessionId: cellId });
    res.json({ success: true, message: 'Đã xoá dữ liệu giáo viên khỏi ô TKB' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ĐỔI GIÁO VIÊN ĐỘT XUẤT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/salary/session-teachers/:cellId/change-teacher
 * Đổi GV trong ô TKB. Nếu GV cũ đã checkin → xoá ca + tự checkin GV mới.
 */
exports.changeTeacher = async (req, res, next) => {
  try {
    const { cellId } = req.params;
    const { oldTeacherId, newTeacherId, newSessionRole, courseId, isMain, forceReplace } = req.body;

    if (!newTeacherId || !newSessionRole) {
      return res.status(400).json({ success: false, message: 'newTeacherId và newSessionRole là bắt buộc' });
    }

    const cell = await TimetableCell.findById(cellId).lean();
    if (!cell) return res.status(404).json({ success: false, message: 'Không tìm thấy ô TKB' });

    const row = await TimetableRow.findById(cell.rowId).lean();
    if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy dòng TKB' });

    // Tính ngày thực tế của ô TKB theo VN timezone
    const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
    const monday = new Date(cell.weekDate);
    const targetDate = new Date(monday);
    targetDate.setUTCDate(monday.getUTCDate() + (cell.dayOfWeek - 1));
    const targetDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: VN_TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(targetDate);

    // Kiểm tra GV cũ đã checkin chưa
    let oldTeacherCheckedIn = false;
    if (oldTeacherId) {
      const oldRecord = await StaffAttendance.findOne({ staffId: oldTeacherId, date: targetDateStr }).lean();
      if (oldRecord && oldRecord.logs && oldRecord.logs.length > 0) {
        const lastLog = oldRecord.logs[oldRecord.logs.length - 1];
        if (lastLog.type === 'checkin') oldTeacherCheckedIn = true;
      }
    }

    // Nếu GV cũ đã checkin và chưa xác nhận → hỏi lại
    if (oldTeacherCheckedIn && !forceReplace) {
      const oldStaff = await StaffAccount.findById(oldTeacherId).select('displayName username').lean();
      const newStaff = await StaffAccount.findById(newTeacherId).select('displayName username').lean();
      const oldRecord = await StaffAttendance.findOne({ staffId: oldTeacherId, date: targetDateStr }).lean();
      const checkinLog = oldRecord?.logs?.find(l => l.type === 'checkin');
      const checkinTime = checkinLog
        ? new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(checkinLog.time))
        : '--:--';

      return res.status(200).json({
        success: true,
        requiresConfirmation: true,
        message: `Giáo viên ${oldStaff?.displayName || oldStaff?.username || 'cũ'} đã checkin lúc ${checkinTime} cho ca này. Xác nhận để đổi sang ${newStaff?.displayName || newStaff?.username || 'mới'}.`,
        checkinTime,
        oldTeacherName: oldStaff?.displayName || oldStaff?.username,
        newTeacherName: newStaff?.displayName || newStaff?.username,
        targetDateStr
      });
    }

    // ── Thực hiện đổi GV ─────────────────────────────────────────
    if (oldTeacherId) {
      await SessionTeacher.deleteOne({ sessionId: cellId, teacherId: oldTeacherId });
    }

    const tierRoles = ['teacher_assistant', 'observe'];
    const payTier = tierRoles.includes(newSessionRole) ? (req.body.payTier || 'full_time') : null;

    await SessionTeacher.findOneAndUpdate(
      { sessionId: cellId, teacherId: newTeacherId },
      { sessionId: cellId, teacherId: newTeacherId, sessionRole: newSessionRole, courseId: courseId || null, isMain: !!isMain, payTier },
      { upsert: true, new: true }
    );

    // Tự động checkin GV mới (source = auto_by_admin)
    const now = new Date();
    await StaffAttendance.findOneAndUpdate(
      { staffId: newTeacherId, date: targetDateStr },
      {
        $push: { logs: { type: 'checkin', time: now, source: 'auto_by_admin' } },
        $set: { source: 'auto_by_admin', adminEdited: true, updatedBy: req.user?.id || req.admin?.id }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Đổi giáo viên thành công. GV mới đã được tự động checkin.',
      autoCheckinTime: now.toISOString(),
      targetDateStr
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ENGINE GHÉP CA — Toàn bộ quy chuẩn về Asia/Ho_Chi_Minh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính toán ca hợp lệ cho 1 ngày, 1 giáo viên (theo đặc tả mục 6.1).
 */
const matchSessionsForTeacher = async (teacherId, dateStr, systemSettings = null) => {
  const _tag = `[SalaryEngine] teacher=${teacherId} date=${dateStr}`;

  // ── Bước 1: Lấy chấm công ──────────────────────────────────────
  const attendanceRecord = await StaffAttendance.findOne({
    staffId: teacherId,
    date: dateStr
  }).lean();

  if (!attendanceRecord || !attendanceRecord.logs || attendanceRecord.logs.length === 0) {
    console.log(`${_tag} ⛔ Không có attendance hoặc logs rỗng`);
    return [];
  }

  // Xây cặp checkin/checkout
  const sortedLogs = [...attendanceRecord.logs].sort((a, b) => new Date(a.time) - new Date(b.time));
  const pairs = [];
  for (let i = 0; i < sortedLogs.length - 1; i += 2) {
    const ci = sortedLogs[i];
    const co = sortedLogs[i + 1];
    if (ci?.type === 'checkin' && co?.type === 'checkout') {
      pairs.push({
        checkinTime: new Date(ci.time),
        checkoutTime: new Date(co.time),
        source: ci.source || co.source || 'device'
      });
    }
  }
  if (sortedLogs.length % 2 !== 0) {
    const last = sortedLogs[sortedLogs.length - 1];
    if (last.type === 'checkin') {
      pairs.push({
        checkinTime: new Date(last.time),
        checkoutTime: new Date(`${dateStr}T23:59:59+07:00`),
        source: last.source || 'device'
      });
    }
  }

  console.log(`${_tag} ✅ ${sortedLogs.length} logs → ${pairs.length} cặp`);
  for (const p of pairs) {
    console.log(`  pair: ${p.checkinTime.toISOString()} → ${p.checkoutTime.toISOString()} (src=${p.source})`);
  }
  if (pairs.length === 0) return [];

  // ── Bước 2: Tìm ô TKB của GV trong ngày ────────────────────────
  // Helper lấy thứ và weekDate
  const getDayOfWeekVN = (dateStr) => {
    const vnMidday = new Date(`${dateStr}T12:00:00+07:00`);
    const jsDay = vnMidday.getUTCDay();
    return jsDay === 0 ? 7 : jsDay;
  };
  const getMondayDateVN = (dateStr) => {
    const dayOfWeek = getDayOfWeekVN(dateStr);
    const vnMidday = new Date(`${dateStr}T12:00:00+07:00`);
    vnMidday.setUTCDate(vnMidday.getUTCDate() - (dayOfWeek - 1));
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(vnMidday);
  };
  const normalizeLegacyMondayUTC = (dateInput) => {
    const d = new Date(dateInput);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  };
  const getWeekDateCandidatesForDate = (dateStr) => {
    const mondayDateVN = getMondayDateVN(dateStr);
    const canonicalWeekDate = new Date(`${mondayDateVN}T00:00:00.000Z`);
    const legacyWeekDate = normalizeLegacyMondayUTC(`${mondayDateVN}T00:00:00+07:00`);
    const unique = new Map();
    for (const weekDate of [canonicalWeekDate, legacyWeekDate]) unique.set(weekDate.getTime(), weekDate);
    return [...unique.values()];
  };

  const dayOfWeek = getDayOfWeekVN(dateStr);
  const weekDateCandidates = getWeekDateCandidatesForDate(dateStr);
  console.log(`${_tag} 📅 dayOfWeek=${dayOfWeek} candidates=[${weekDateCandidates.map(d => d.toISOString())}]`);

  const sessionTeachers = await SessionTeacher.find({ teacherId }).lean();
  const sessionIds = sessionTeachers.map(st => st.sessionId);
  console.log(`${_tag} 👨‍🏫 ${sessionTeachers.length} SessionTeacher, ids=[${sessionIds}]`);
  if (sessionTeachers.length === 0) return [];

  const cells = await TimetableCell.find({
    _id: { $in: sessionIds },
    weekDate: { $in: weekDateCandidates },
    dayOfWeek
  }).lean();
  console.log(`${_tag} 📋 ${cells.length} TimetableCell khớp`);

  if (cells.length === 0) {
    const debugCells = await TimetableCell.find({ _id: { $in: sessionIds } }).select('weekDate dayOfWeek').lean();
    if (debugCells.length > 0) {
      console.log(`${_tag} ⚠️ Có ${debugCells.length} cell nhưng KHÔNG khớp filter:`);
      for (const c of debugCells) console.log(`    cell=${c._id} weekDate=${c.weekDate?.toISOString()} dayOfWeek=${c.dayOfWeek}`);
    }
    return [];
  }

  const stMap = {};
  for (const st of sessionTeachers) stMap[st.sessionId.toString()] = st;

  const rowIds = [...new Set(cells.map(c => c.rowId.toString()))];
  const rows = await TimetableRow.find({ _id: { $in: rowIds } }).lean();
  const rowMap = {};
  for (const r of rows) rowMap[r._id.toString()] = r;

  const allCourseIds = [...new Set(sessionTeachers.map(st => st.courseId).filter(Boolean).map(id => id.toString()))];
  const courses = allCourseIds.length ? await Course.find({ _id: { $in: allCourseIds } }).lean() : [];
  const oidList = allCourseIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
  const regAgg = oidList.length
    ? await Registration.aggregate([
        { $match: { courseId: { $in: oidList }, status: 'registered', isActive: true } },
        { $group: { _id: '$courseId', n: { $sum: 1 } } }
      ])
    : [];
  const regMap = {};
  for (const r of regAgg) regMap[r._id.toString()] = r.n;
  const courseMap = {};
  for (const c of courses) {
    const regN = regMap[c._id.toString()];
    courseMap[c._id.toString()] = { ...c, studentCount: (regN > 0 ? regN : (c.currentStudents || 0)) };
  }

  // ── Bước 3: Ghép ca ─────────────────────────────────────────────
  const sys = systemSettings || (await SalarySystemSettings.getSingleton());
  const THRESHOLD = sys.matchThresholdMinutes;
  const matchedCellIds = new Set();
  const results = [];

  // Helper tra lương
  const SalaryConfig = require('../models/SalaryConfig');
  const lookupSalary = async (sessionRole, studentCount, salaryLevel = null) => {
    let query = { sessionRole };
    if (['teacher_assistant', 'observe'].includes(sessionRole)) {
      query.studentCount = null;
      query.salaryLevel  = salaryLevel || 'full_time';
    } else {
      const bucket = studentCount >= 4 ? 4 : studentCount;
      query.studentCount = bucket;
      query.salaryLevel  = null;
    }
    const config = await SalaryConfig.findOne(query).lean();
    return config ? config.amount : 0;
  };

  for (const cell of cells) {
    if (matchedCellIds.has(cell._id.toString())) continue;
    const row = rowMap[cell.rowId.toString()];
    if (!row) continue;

    // Giờ bắt đầu ô TKB → VN timezone
    const sessionStart = new Date(`${dateStr}T${row.startTime}:00+07:00`);

    for (const pair of pairs) {
      const windowStart = new Date(pair.checkinTime.getTime() - THRESHOLD * 60 * 1000);
      const windowEnd = pair.checkoutTime;
      console.log(`${_tag} 🔍 cell=${cell._id} session=${sessionStart.toISOString()} window=[${windowStart.toISOString()} ~ ${windowEnd.toISOString()}]`);

      if (sessionStart >= windowStart && sessionStart <= windowEnd) {
        matchedCellIds.add(cell._id.toString());
        const st = stMap[cell._id.toString()];
        const course = st?.courseId ? courseMap[st.courseId.toString()] : null;
        if (st?.courseId && !course) {
          console.warn(`${_tag} ⚠️ courseId=${st.courseId} không tồn tại (có thể đã bị xóa) — tính lương với studentCount=0`);
        }
        let studentCount = course?.studentCount ?? course?.currentStudents ?? 0;
        if (!['teacher_assistant', 'observe'].includes(st.sessionRole) && studentCount < 1) studentCount = 1;
        const payTier = ['teacher_assistant', 'observe'].includes(st.sessionRole) ? (st.payTier || 'full_time') : null;
        const amount = await lookupSalary(st.sessionRole, studentCount, payTier);
        results.push({ cell, row, sessionTeacher: st, course, studentCount, amount, source: pair.source, matchedPair: pair });
        console.log(`${_tag} ✅ MATCH cell=${cell._id} amount=${amount}`);
        break;
      }
    }
  }

  console.log(`${_tag} 🏁 Kết quả: ${results.length} buổi hợp lệ`);
  return results;
};


/**
 * POST /api/salary/run-engine
 * Chạy engine ghép ca cho 1 ngày (hoặc hôm nay).
 * Body: { date: 'YYYY-MM-DD' }
 * Trả về danh sách ca hợp lệ (không lưu DB — report engine).
 */
exports.runEngine = async (req, res, next) => {
  try {
    const dateStr = req.body.date || getTodayVN();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ success: false, message: 'date phải là YYYY-MM-DD' });
    }

    // Lấy tất cả staff có chấm công ngày đó
    const attendanceRecords = await StaffAttendance.find({ date: dateStr })
      .select('staffId')
      .lean();

    const teacherIds = [...new Set(attendanceRecords.map(r => r.staffId.toString()))];

    const system = await SalarySystemSettings.getSingleton();
    const allResults = [];
    for (const teacherId of teacherIds) {
      const sessions = await matchSessionsForTeacher(teacherId, dateStr, system);
      if (sessions.length > 0) {
        // Lấy thông tin staff
        const staff = await StaffAccount.findById(teacherId)
          .select('displayName username role')
          .lean();

        allResults.push({
          teacher: staff,
          date: dateStr,
          sessions
        });
      }
    }

    res.json({ success: true, data: allResults, total: allResults.reduce((s, r) => s + r.sessions.length, 0) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/salary/unmatched-checkins?date=YYYY-MM-DD
 * Trả về danh sách GV (role=teacher) đã checkin nhưng không khớp ô TKB nào.
 * Dùng để cảnh báo admin trên Dashboard / Quản lý chấm công.
 */
exports.getUnmatchedCheckins = async (req, res, next) => {
  try {
    const dateStr = req.query.date || getTodayVN();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ success: false, message: 'date phải là YYYY-MM-DD' });
    }

    // Lấy tất cả staff có chấm công ngày đó
    const attendanceRecords = await StaffAttendance.find({ date: dateStr }).lean();
    if (attendanceRecords.length === 0) {
      return res.json({ success: true, data: [], count: 0 });
    }

    // Lọc chỉ teacher (marketing không cần khớp TKB)
    const staffIds = [...new Set(attendanceRecords.map(r => r.staffId.toString()))];
    const staffAccounts = await StaffAccount.find({
      _id: { $in: staffIds },
      role: 'teacher',
      isActive: true
    }).select('_id displayName username role').lean();

    const teacherMap = {};
    for (const s of staffAccounts) teacherMap[s._id.toString()] = s;

    const system = await SalarySystemSettings.getSingleton();
    const unmatched = [];

    for (const record of attendanceRecords) {
      const tid = record.staffId.toString();
      const teacher = teacherMap[tid];
      if (!teacher) continue; // skip marketing / inactive

      const sessions = await matchSessionsForTeacher(tid, dateStr, system);
      if (sessions.length === 0) {
        // Lấy thời gian checkin đầu tiên
        const firstCheckin = (record.logs || []).find(l => l.type === 'checkin');
        const checkinTime = firstCheckin
          ? new Intl.DateTimeFormat('vi-VN', {
              timeZone: VN_TIMEZONE,
              hour: '2-digit', minute: '2-digit', hour12: false
            }).format(new Date(firstCheckin.time))
          : '--:--';

        unmatched.push({
          teacher: {
            _id: teacher._id,
            displayName: teacher.displayName,
            username: teacher.username
          },
          date: dateStr,
          checkinTime,
          logCount: (record.logs || []).length
        });
      }
    }

    res.json({ success: true, data: unmatched, count: unmatched.length });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. BẢNG LƯƠNG TỔNG HỢP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/salary/report?teacherId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Trả về bảng lương tổng hợp theo khoảng thời gian.
 * Chạy engine cho từng ngày trong khoảng, tổng hợp theo GV.
 */
exports.getSalaryReport = async (req, res, next) => {
  try {
    const { teacherId, from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'from và to là bắt buộc (YYYY-MM-DD)' });
    }

    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate   = new Date(`${to}T00:00:00Z`);
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 100) {
      return res.status(400).json({ success: false, message: 'Khoảng thời gian tải báo cáo không được vượt quá 100 ngày' });
    }
    if (fromDate > toDate) {
      return res.status(400).json({ success: false, message: 'from phải <= to' });
    }

    // Sinh danh sách ngày trong khoảng
    const dates = [];
    for (let d = new Date(fromDate); d <= toDate; d.setUTCDate(d.getUTCDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
    }

    // Lọc attendance records trong khoảng
    const attendanceQuery = { date: { $gte: from, $lte: to } };
    if (teacherId) attendanceQuery.staffId = new mongoose.Types.ObjectId(teacherId);

    const attendanceRecords = await StaffAttendance.find(attendanceQuery).lean();
    const teacherIds = [...new Set(attendanceRecords.map(r => r.staffId.toString()))];

    // Load thưởng trong khoảng
    const bonusQuery = { date: { $gte: from, $lte: to } };
    if (teacherId) bonusQuery.teacherId = new mongoose.Types.ObjectId(teacherId);
    const bonuses = await SalaryBonus.find(bonusQuery)
      .populate('teacherId', 'displayName username')
      .lean();

    // Map thưởng theo teacherId
    const bonusMap = {};
    for (const b of bonuses) {
      const tid = b.teacherId?._id?.toString() || b.teacherId?.toString();
      if (!bonusMap[tid]) bonusMap[tid] = [];
      bonusMap[tid].push(b);
    }

    const report = [];
    const system = await SalarySystemSettings.getSingleton();

    for (const tid of teacherIds) {
      const staff = await StaffAccount.findById(tid).select('displayName username role').lean();

      const teacherSessions = [];
      for (const dateStr of dates) {
        const sessions = await matchSessionsForTeacher(tid, dateStr, system);
        for (const s of sessions) {
          teacherSessions.push({
            date:         dateStr,
            branch:       s.row.branch,
            roomName:     s.row.roomName,
            startTime:    s.row.startTime,
            endTime:      s.row.endTime,
            courseName:   s.course?.name || '—',
            studentCount: ['teacher_assistant', 'observe'].includes(s.sessionTeacher.sessionRole) ? null : s.studentCount,
            sessionRole:  s.sessionTeacher.sessionRole,
            payTier:      ['teacher_assistant', 'observe'].includes(s.sessionTeacher.sessionRole)
              ? (s.sessionTeacher.payTier || 'full_time')
              : null,
            amount:       s.amount,
            source:       s.source,
            note:         _sourceNote(s.source)
          });
        }
      }

      const teacherBonuses = bonusMap[tid] || [];
      const totalSalary = teacherSessions.reduce((sum, s) => sum + (s.amount || 0), 0);
      const totalBonus  = teacherBonuses.reduce((sum, b) => sum + (b.amount || 0), 0);

      report.push({
        teacher:       staff,
        sessions:      teacherSessions,
        bonuses:       teacherBonuses,
        totalSalary,
        totalBonus,
        grandTotal:    totalSalary + totalBonus
      });
    }

    // Nếu lọc 1 GV cụ thể nhưng không có chấm công
    if (teacherId && report.length === 0) {
      const staff = await StaffAccount.findById(teacherId).select('displayName username role').lean();
      const teacherBonuses = bonusMap[teacherId] || [];
      report.push({
        teacher:    staff,
        sessions:   [],
        bonuses:    teacherBonuses,
        totalSalary: 0,
        totalBonus:  teacherBonuses.reduce((s, b) => s + b.amount, 0),
        grandTotal:  teacherBonuses.reduce((s, b) => s + b.amount, 0)
      });
    }

    res.json({ success: true, data: report, from, to });
  } catch (err) {
    next(err);
  }
};

/** Helper: chuyển source → note hiển thị */
const _sourceNote = (source) => {
  switch (source) {
    case 'auto_by_admin':   return '⚠️ Đổi GV đột xuất';
    case 'manual_by_admin': return '🔴 Chấm công thủ công — xem xét trừ lương';
    case 'auto_checkout':   return '';
    case 'device':          return '';
    default:                return '';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. EXPORT EXCEL BẢNG LƯƠNG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/salary/export?from=YYYY-MM-DD&to=YYYY-MM-DD&teacherId=...
 * Xuất Excel bảng lương với 3 sheet:
 *   Sheet 1: Chi tiết từng buổi
 *   Sheet 2: Tổng hợp theo GV
 *   Sheet 3: Thưởng
 */
exports.exportSalaryExcel = async (req, res, next) => {
  try {
    const { from, to, teacherId } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'from và to là bắt buộc' });
    }

    // Tái sử dụng logic getSalaryReport
    const fakeReq = { query: { from, to, teacherId }, user: req.user, admin: req.admin };
    let reportData;
    await new Promise((resolve, reject) => {
      exports.getSalaryReport(fakeReq, {
        json: (data) => { reportData = data; resolve(); },
        status: () => ({ json: reject })
      }, reject);
    });

    const report = reportData?.data || [];

    const wb = new ExcelJS.Workbook();
    wb.creator = 'SalarySystem';

    const C = {
      header: 'FF1C695C',
      headerFg: 'FFFFFFFF',
      alt: 'FFF0FAF7',
      yellow: 'FFFFF3CD',
      red: 'FFFFEBEE',
      groupBg: 'FFD9EAD3',
      total: 'FFE8F5F3'
    };

    const addHeaderRow = (ws, headers) => {
      const row = ws.addRow(headers);
      row.height = 22;
      row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: C.headerFg }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.header } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } }
        };
      });
      return row;
    };

    // ── Sheet 1: Chi tiết buổi dạy ───────────────────────────────
    const s1 = wb.addWorksheet('Chi tiết buổi dạy', { views: [{ state: 'frozen', ySplit: 1 }] });
    s1.columns = [
      { width: 18 }, // Ngày
      { width: 16 }, // GV
      { width: 14 }, // Cơ sở
      { width: 12 }, // Phòng
      { width: 14 }, // Khóa học
      { width: 10 }, // Số HS
      { width: 16 }, // Vai trò
      { width: 14 }, // Tiền buổi
      { width: 28 }, // Ghi chú
    ];
    addHeaderRow(s1, ['Ngày', 'Giáo viên', 'Cơ sở', 'Phòng', 'Khóa học', 'Số HS', 'Vai trò', 'Tiền buổi', 'Ghi chú']);

    let s1Alt = false;
    for (const entry of report) {
      const teacherName = entry.teacher?.displayName || entry.teacher?.username || 'N/A';
      for (const s of entry.sessions) {
        const row = s1.addRow([
          s.date,
          teacherName,
          s.branch,
          s.roomName,
          s.courseName,
          s.studentCount ?? '—',
          s.sessionRole,
          s.amount,
          s.note
        ]);

        const bgColor = s.source === 'auto_by_admin'   ? C.yellow
                      : s.source === 'manual_by_admin' ? C.red
                      : s1Alt ? C.alt : 'FFFFFFFF';

        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { size: 10 };
        });

        // Cột tiền buổi → format số
        const amtCell = row.getCell(8);
        amtCell.numFmt = '#,##0';
        amtCell.alignment = { horizontal: 'right' };

        if (s.note) {
          const noteCell = row.getCell(9);
          noteCell.font = {
            bold: true, italic: true, size: 10,
            color: { argb: s.source === 'manual_by_admin' ? 'FFCC0000' : 'FF856404' }
          };
        }

        s1Alt = !s1Alt;
      }
    }

    // ── Sheet 2: Tổng hợp theo GV ────────────────────────────────
    const s2 = wb.addWorksheet('Tổng hợp', { views: [{ state: 'frozen', ySplit: 1 }] });
    s2.columns = [
      { width: 20 }, // GV
      { width: 12 }, // Vai trò
      { width: 10 }, // Số buổi ft
      { width: 10 }, // Số buổi pt
      { width: 10 }, // Số buổi tv
      { width: 10 }, // Số buổi ta
      { width: 10 }, // Số buổi obs
      { width: 16 }, // Tổng lương
      { width: 14 }, // Thưởng
      { width: 16 }, // Tổng cộng
    ];
    addHeaderRow(s2, [
      'Giáo viên', 'Vai trò hệ thống',
      'Buổi FT', 'Buổi PT', 'Buổi TV', 'Buổi TA', 'Buổi OBS',
      'Tổng lương', 'Thưởng', 'Tổng cộng'
    ]);

    for (const entry of report) {
      const name = entry.teacher?.displayName || entry.teacher?.username || 'N/A';
      const countByRole = { full_time: 0, part_time: 0, thu_viec: 0, teacher_assistant: 0, observe: 0 };
      for (const s of entry.sessions) {
        if (countByRole[s.sessionRole] !== undefined) countByRole[s.sessionRole]++;
      }

      const row = s2.addRow([
        name,
        entry.teacher?.role || '—',
        countByRole.full_time,
        countByRole.part_time,
        countByRole.thu_viec,
        countByRole.teacher_assistant,
        countByRole.observe,
        entry.totalSalary,
        entry.totalBonus,
        entry.grandTotal
      ]);

      row.eachCell(cell => {
        cell.font = { size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      [8, 9, 10].forEach(c => {
        row.getCell(c).numFmt = '#,##0';
        row.getCell(c).alignment = { horizontal: 'right' };
        row.getCell(c).font = { bold: true, size: 10, color: { argb: 'FF1C695C' } };
      });
    }

    // ── Sheet 3: Thưởng ──────────────────────────────────────────
    const s3 = wb.addWorksheet('Thưởng', { views: [{ state: 'frozen', ySplit: 1 }] });
    s3.columns = [
      { width: 12 }, // Ngày
      { width: 20 }, // GV
      { width: 18 }, // Loại thưởng
      { width: 14 }, // Số tiền
      { width: 30 }, // Ghi chú
    ];
    addHeaderRow(s3, ['Ngày', 'Giáo viên', 'Loại thưởng', 'Số tiền', 'Ghi chú']);

    let s3Alt = false;
    for (const entry of report) {
      for (const b of entry.bonuses) {
        const bonusName = b.bonusType === 'tuyen_sinh' ? 'Tuyển sinh'
          : b.bonusType === 'test_dau_vao' ? 'Test đầu vào'
          : 'Khác';

        const row = s3.addRow([
          b.date,
          entry.teacher?.displayName || entry.teacher?.username || 'N/A',
          bonusName,
          b.amount,
          b.note
        ]);

        row.eachCell(cell => {
          cell.font = { size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          if (s3Alt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.alt } };
        });
        row.getCell(4).numFmt = '#,##0';
        row.getCell(4).alignment = { horizontal: 'right' };
        s3Alt = !s3Alt;
      }
    }

    const safeFrom = from.replace(/-/g, '');
    const safeTo   = to.replace(/-/g, '');
    const fileName = `bang_luong_${safeFrom}_${safeTo}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    await wb.xlsx.write(res);
    return res.end();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. SALARY BONUS — Thưởng thủ công
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/salary/bonus?teacherId=...&from=...&to=... */
exports.getBonuses = async (req, res, next) => {
  try {
    const { teacherId, from, to } = req.query;
    const query = {};
    if (teacherId) query.teacherId = new mongoose.Types.ObjectId(teacherId);
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to)   query.date.$lte = to;
    }

    const bonuses = await SalaryBonus.find(query)
      .populate('teacherId', 'displayName username')
      .sort({ date: -1 })
      .lean();

    res.json({ success: true, data: bonuses });
  } catch (err) {
    next(err);
  }
};

/** POST /api/salary/bonus */
exports.createBonus = async (req, res, next) => {
  try {
    const { teacherId, bonusType, amount, date, note } = req.body;

    if (!teacherId || !bonusType || !amount || !date) {
      return res.status(400).json({ success: false, message: 'teacherId, bonusType, amount, date là bắt buộc' });
    }

    const VALID_TYPES = ['tuyen_sinh', 'test_dau_vao', 'khac'];
    if (!VALID_TYPES.includes(bonusType)) {
      return res.status(400).json({ success: false, message: 'bonusType không hợp lệ' });
    }

    const bonus = await SalaryBonus.create({
      teacherId,
      bonusType,
      amount: Number(amount),
      date,
      note: note || '',
      createdBy:     req.user?.id || req.admin?.id,
      createdByName: req.user?.username || req.admin?.username || 'Admin'
    });

    res.status(201).json({ success: true, data: bonus, message: 'Tạo thưởng thành công' });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/salary/bonus/:id */
exports.deleteBonus = async (req, res, next) => {
  try {
    const bonus = await SalaryBonus.findByIdAndDelete(req.params.id);
    if (!bonus) return res.status(404).json({ success: false, message: 'Không tìm thấy thưởng' });
    res.json({ success: true, message: 'Xoá thành công' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. HELPER API — lấy GV theo khóa học (dùng cho CellPopover)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/salary/course-teachers/:courseId
 * Trả về danh sách GV thuộc khóa học (main + sub teachers)
 */
exports.getCourseTeachers = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'courseId không hợp lệ' });
    }

    const course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } })
      .populate({
        path: 'teacher',
        select: 'name staffAccountId',
        match: { isDeleted: { $ne: true } }
      })
      .populate({
        path: 'additionalTeachers',
        select: 'name staffAccountId',
        match: { isDeleted: { $ne: true } }
      })
      .lean();

    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }

    const enrolled = await Registration.countDocuments({
      courseId: course._id,
      status: 'registered',
      isActive: true
    });
    const studentCount = enrolled > 0 ? enrolled : (course.currentStudents || 0);

    const teachers = [];
    if (course.teacher?.staffAccountId) {
      teachers.push({
        staffId: course.teacher.staffAccountId,
        displayName: course.teacher.name || 'GV chính',
        isMain: true
      });
    }
    for (const sub of course.additionalTeachers || []) {
      if (sub?.staffAccountId) {
        teachers.push({
          staffId: sub.staffAccountId,
          displayName: sub.name || 'GV phụ',
          isMain: false
        });
      }
    }

    res.json({
      success: true,
      data: {
        course: { _id: course._id, name: course.name, studentCount },
        teachers
      }
    });
  } catch (err) {
    next(err);
  }
};

const AuditLog = require('../models/AuditLog');
const LoginAttemptLog = require('../models/LoginAttemptLog');
const BlockedIP = require('../models/BlockedIP');
const logAdminAction = require('../utils/logAdminAction');

/**
 * Sanitize một cell CSV để chống Excel Formula Injection.
 */
function sanitizeCsvCell(value) {
  if (value == null) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/history
// ─────────────────────────────────────────────────────────────────────────────
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, action, startDate, endDate } = req.query;
    const query = {};

    if (action && typeof action === 'string') query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        const sDate = new Date(startDate);
        if (!isNaN(sDate.getTime())) query.createdAt.$gte = sDate;
      }
      if (endDate && typeof endDate === 'string') {
        const eDate = new Date(endDate);
        if (!isNaN(eDate.getTime())) query.createdAt.$lte = eDate;
      }
      if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: { logs, total, pages: Math.ceil(total / limit), currentPage: Number(page) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/history/stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, loginCount, createCount, updateCount, deleteCount] =
      await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: today } }),
        AuditLog.countDocuments({ action: 'LOGIN' }),
        AuditLog.countDocuments({ action: { $regex: /CREATE/i } }),
        AuditLog.countDocuments({ action: { $regex: /UPDATE/i } }),
        AuditLog.countDocuments({ action: { $regex: /DELETE/i } }),
      ]);

    res.json({
      success: true,
      data: { totalLogs, todayLogs, loginCount, createCount, updateCount, deleteCount },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/history/export
// ─────────────────────────────────────────────────────────────────────────────
exports.exportCSV = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });

    const headers = ['Thời gian', 'Quản trị viên', 'Thao tác', 'Loại đối tượng', 'Mô tả', 'Địa chỉ IP', 'Trạng thái'];
    const csvRows = [headers.map((h) => sanitizeCsvCell(h)).join(',')];

    for (const log of logs) {
      const row = [
        sanitizeCsvCell(new Date(log.createdAt).toLocaleString('vi-VN')),
        sanitizeCsvCell(log.adminName),
        sanitizeCsvCell(log.action),
        sanitizeCsvCell(log.targetType),
        sanitizeCsvCell(log.description),
        sanitizeCsvCell(log.ipAddress),
        sanitizeCsvCell(log.suspicious ? 'Khả nghi' : 'Bình thường'),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=admin_activity_history.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/history/security-alerts
// ─────────────────────────────────────────────────────────────────────────────
exports.getSecurityAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const allAlerts = await LoginAttemptLog.aggregate([
      { $match: { action: 'LOGIN_FAIL' } },
      {
        $group: {
          _id: '$ip',
          failCount: { $sum: 1 },
          lastAttempt: { $max: '$createdAt' },
          firstAttempt: { $min: '$createdAt' },
          usernames: { $addToSet: '$username' },
          userAgents: { $addToSet: '$userAgent' },
        },
      },
      { $sort: { failCount: -1, lastAttempt: -1 } },
    ]);

    const total = allAlerts.length;
    const paged = allAlerts.slice(skip, skip + Number(limit));

    const blockedIPs = await BlockedIP.find({});
    const blockedMap = {};
    for (const b of blockedIPs) blockedMap[b.ip] = b;

    const data = paged.map((item) => ({
      ip: item._id,
      failCount: item.failCount,
      lastAttempt: item.lastAttempt,
      firstAttempt: item.firstAttempt,
      usernames: item.usernames.filter(Boolean),
      userAgents: item.userAgents.filter(Boolean),
      isBlocked: !!blockedMap[item._id],
      blockedAt: blockedMap[item._id]?.createdAt || null,
      blockReason: blockedMap[item._id]?.reason || null,
    }));

    res.json({
      success: true,
      data: {
        alerts: data,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        totalBlocked: blockedIPs.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/history/security-stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getSecurityStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalFail, todayFail, totalBlocked, totalSuccess, totalResetReq] = await Promise.all([
      LoginAttemptLog.countDocuments({ action: 'LOGIN_FAIL' }),
      LoginAttemptLog.countDocuments({ action: 'LOGIN_FAIL', createdAt: { $gte: today } }),
      BlockedIP.countDocuments(),
      LoginAttemptLog.countDocuments({ action: 'LOGIN_SUCCESS' }),
      LoginAttemptLog.countDocuments({ action: 'RESET_PASSWORD_REQUEST' }),
    ]);

    res.json({
      success: true,
      data: { totalFail, todayFail, totalBlocked, totalSuccess, totalResetReq },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/history/login-activity   ← MỚI
// Lấy lịch sử toàn bộ login/reset-pass theo timeline, kèm cảnh báo IP nghi ngờ
// ─────────────────────────────────────────────────────────────────────────────
exports.getLoginActivity = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, ip, startDate, endDate } = req.query;
    const query = {};

    // Lọc theo loại action
    if (action && typeof action === 'string') {
      query.action = action;
    }

    // Lọc theo IP
    if (ip && typeof ip === 'string') {
      query.ip = ip.trim();
    }

    // Lọc theo khoảng thời gian
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const sDate = new Date(startDate);
        if (!isNaN(sDate.getTime())) query.createdAt.$gte = sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        if (!isNaN(eDate.getTime())) {
          // Lấy hết ngày endDate
          eDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = eDate;
        }
      }
      if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      LoginAttemptLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LoginAttemptLog.countDocuments(query),
    ]);

    // Gắn thêm flag isBlocked cho từng log
    const uniqueIPs = [...new Set(logs.map((l) => l.ip))];
    const blockedDocs = await BlockedIP.find({ ip: { $in: uniqueIPs } }).lean();
    const blockedMap = {};
    for (const b of blockedDocs) blockedMap[b.ip] = b;

    const enrichedLogs = logs.map((log) => ({
      ...log,
      isBlocked: !!blockedMap[log.ip],
      blockedAt: blockedMap[log.ip]?.createdAt || null,
      blockReason: blockedMap[log.ip]?.reason || null,
    }));

    // ── Tính IPs cần cảnh báo trong 24h gần nhất (fail >= 3) ──────────────────
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWarnings = await LoginAttemptLog.aggregate([
      {
        $match: {
          action: 'LOGIN_FAIL',
          createdAt: { $gte: since24h },
        },
      },
      {
        $group: {
          _id: '$ip',
          failCount: { $sum: 1 },
          lastAttempt: { $max: '$createdAt' },
          usernames: { $addToSet: '$username' },
        },
      },
      // Chỉ lấy những IP fail từ 3 lần trở lên (ngưỡng cảnh báo sớm)
      { $match: { failCount: { $gte: 3 } } },
      { $sort: { failCount: -1 } },
    ]);

    // Gắn isBlocked cho từng cảnh báo
    const warningIPs = recentWarnings.map((w) => w._id);
    const warningBlocked = await BlockedIP.find({ ip: { $in: warningIPs } }).lean();
    const warningBlockedMap = {};
    for (const b of warningBlocked) warningBlockedMap[b.ip] = b;

    const warnings = recentWarnings.map((w) => ({
      ip: w._id,
      failCount: w.failCount,
      lastAttempt: w.lastAttempt,
      usernames: w.usernames.filter(Boolean),
      isBlocked: !!warningBlockedMap[w._id],
      blockedAt: warningBlockedMap[w._id]?.createdAt || null,
    }));

    res.json({
      success: true,
      data: {
        logs: enrichedLogs,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        // Cảnh báo IP cần chú ý (fail >= 3 trong 24h, chưa bị chặn)
        warnings,
        warningCount: warnings.filter((w) => !w.isBlocked).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/history/block-ip
// ─────────────────────────────────────────────────────────────────────────────
exports.blockIP = async (req, res, next) => {
  try {
    const { ip, reason } = req.body;

    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ success: false, message: 'IP không hợp lệ' });
    }

    const finalReason = reason || 'Chặn thủ công bởi admin';

    const blocked = await BlockedIP.findOneAndUpdate(
      { ip },
      { ip, reason: finalReason, blockedBy: req.user?.id || null },
      { upsert: true, new: true }
    );

    await logAdminAction({
      adminId: req.user?.id,
      adminName: req.user?.username || req.user?.displayName || 'Admin',
      action: 'BLOCK_IP',
      targetType: 'ip',
      description: `Chặn IP ${ip} — Lý do: ${finalReason}`,
      req,
    });

    res.json({ success: true, message: `Đã chặn IP ${ip}`, data: blocked });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/history/block-ip/:ip
// ─────────────────────────────────────────────────────────────────────────────
exports.unblockIP = async (req, res, next) => {
  try {
    const ip = decodeURIComponent(req.params.ip);
    const result = await BlockedIP.findOneAndDelete({ ip });

    if (!result) {
      return res.status(404).json({ success: false, message: 'IP không có trong danh sách chặn' });
    }

    await logAdminAction({
      adminId: req.user?.id,
      adminName: req.user?.username || req.user?.displayName || 'Admin',
      action: 'UNBLOCK_IP',
      targetType: 'ip',
      description: `Bỏ chặn IP ${ip}`,
      req,
    });

    res.json({ success: true, message: `Đã bỏ chặn IP ${ip}` });
  } catch (error) {
    next(error);
  }
};
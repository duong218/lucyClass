const AuditLog = require('../models/AuditLog');

/**
 * Sanitize một cell CSV để chống Excel Formula Injection.
 * Nếu giá trị bắt đầu bằng =, +, -, @, Tab, CR thì Excel sẽ hiểu là công thức.
 * Fix: prefix bằng dấu ' (apostrophe) để Excel treat as plain text.
 */
function sanitizeCsvCell(value) {
  if (value == null) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  // Wrap trong double-quotes và escape dấu " bên trong
  return `"${str.replace(/"/g, '""')}"`;
}

// GET /api/admin/history
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, action, startDate, endDate } = req.query;
    const query = {};

    if (action && typeof action === 'string') {
      query.action = action;
    }
    
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
    const limitNum = Number(limit);

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/history/stats
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLogs,
      todayLogs,
      loginCount,
      createCount,
      updateCount,
      deleteCount
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.countDocuments({ action: 'LOGIN' }),
      AuditLog.countDocuments({ action: { $regex: /CREATE/i } }),
      AuditLog.countDocuments({ action: { $regex: /UPDATE/i } }),
      AuditLog.countDocuments({ action: { $regex: /DELETE/i } })
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        loginCount,
        createCount,
        updateCount,
        deleteCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/history/export
exports.exportCSV = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });

    const headers = ['Thời gian', 'Quản trị viên', 'Thao tác', 'Loại đối tượng', 'Mô tả', 'Địa chỉ IP', 'Trạng thái'];
    const csvRows = [headers.map(h => sanitizeCsvCell(h)).join(',')];

    for (const log of logs) {
      const row = [
        sanitizeCsvCell(new Date(log.createdAt).toLocaleString('vi-VN')),
        sanitizeCsvCell(log.adminName),
        sanitizeCsvCell(log.action),
        sanitizeCsvCell(log.targetType),
        sanitizeCsvCell(log.description), // field nguy hiểm nhất — chứa input từ user
        sanitizeCsvCell(log.ipAddress),
        sanitizeCsvCell(log.suspicious ? 'Khả nghi' : 'Bình thường'),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM để Excel mở đúng UTF-8 tiếng Việt

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=admin_activity_history.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

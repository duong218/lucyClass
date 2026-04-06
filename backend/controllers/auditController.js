const AuditLog = require('../models/AuditLog');
const { Parser } = require('json2csv');

// GET /api/admin/history
exports.getHistory = async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/history/stats
exports.getStats = async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/history/export
exports.exportCSV = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    
    // Simple manual CSV conversion if json2csv is not available, 
    // but I'll try to use a standard format.
    const fields = ['createdAt', 'adminName', 'action', 'targetType', 'description', 'ipAddress', 'suspicious'];
    const csvRows = [];
    
    // Header
    csvRows.push(fields.join(','));
    
    // Data
    for (const log of logs) {
      const row = fields.map(field => {
        let val = log[field];
        if (field === 'createdAt') val = new Date(val).toLocaleString();
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      });
      csvRows.push(row.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=admin_activity_history.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

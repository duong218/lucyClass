const AuditLog = require('../models/AuditLog');

/**
 * Logs an administrative action and checks for suspicious behavior
 */
const logAdminAction = async ({
  adminId,
  adminName,
  action,
  targetType,
  targetId,
  description,
  req
}) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    let suspicious = false;

    // Suspicious behavior detection: > 10 DELETE actions in 5 minutes
    if (action.includes('DELETE')) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const deleteCount = await AuditLog.countDocuments({
        adminId,
        action: { $regex: /DELETE/i },
        createdAt: { $gte: fiveMinutesAgo }
      });

      if (deleteCount >= 10) {
        suspicious = true;
      }
    }

    await AuditLog.create({
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      description,
      ipAddress,
      userAgent,
      suspicious
    });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};

module.exports = logAdminAction;

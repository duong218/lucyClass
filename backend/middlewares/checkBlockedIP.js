const BlockedIP = require('../models/BlockedIP');

/**
 * Middleware kiểm tra IP có bị chặn không.
 * Gắn VÀO TRƯỚC loginLimiter + exports.login trong authRoutes.js.
 *
 * Cũng gắn req.clientIP để authController dùng khi ghi log.
 */
const checkBlockedIP = async (req, res, next) => {
  try {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    req.clientIP = ip;

    const blocked = await BlockedIP.findOne({ ip });
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: `Địa chỉ IP của bạn đã bị chặn. Lý do: ${blocked.reason}`,
        blockedAt: blocked.createdAt,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkBlockedIP;

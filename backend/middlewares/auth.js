const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const StaffAccount = require('../models/StaffAccount');

/**
 * auth middleware — hỗ trợ cả Admin (role: 'admin') và StaffAccount (role: 'teacher' | 'marketing')
 *
 * Thay đổi so với bản cũ:
 * - Tìm user trong Admin trước, nếu không có thì tìm trong StaffAccount
 * - req.user.role sẽ là 'admin' | 'teacher' | 'marketing'
 */
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('[Auth Error] JWT_SECRET is not defined!');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;
    let isAdmin = false;

    // 1. Thử tìm trong Admin trước
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id)
        .select('_id username role activeSessionId')
        .lean();
      isAdmin = true;
    }

    // 2. Nếu không phải admin, tìm trong StaffAccount
    if (!user) {
      user = await StaffAccount.findById(decoded.id)
        .select('_id username role activeSessionId isActive')
        .lean();

      // Kiểm tra tài khoản có bị vô hiệu hoá không
      if (user && !user.isActive) {
        return res
          .status(403)
          .json({ message: 'Tài khoản đã bị vô hiệu hoá' });
      }
    }

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: User not found' });
    }

    // SESSION CONFLICT CHECK
    const cookieSessionId = req.cookies?.sessionId;
    if (
      cookieSessionId &&
      user.activeSessionId &&
      user.activeSessionId !== cookieSessionId
    ) {
      console.warn(
        `[Auth Middleware] SESSION_CONFLICT for ${user.username || decoded.username}`
      );
      return res.status(401).json({
        code: 'SESSION_CONFLICT',
        message: 'Tài khoản đã được đăng nhập từ thiết bị khác'
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[Auth Middleware] Success: ${user.username || decoded.username} (${user.role})`
      );
    }

    req.user = {
      ...decoded,
      id: String(user._id),
      username: user.username,
      role: user.role
    };
    req.admin = req.user; // backward compatibility
    next();
  } catch (error) {
    console.error(`[Auth Middleware] JWT Verify Error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res
      .status(401)
      .json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = auth;

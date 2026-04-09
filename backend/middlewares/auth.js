const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  // 🎯 Read accessToken from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
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

    const admin = await Admin.findById(decoded.id).select('_id username role activeSessionId').lean();
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    // 🎯 SESSION CONFLICT CHECK
    const cookieSessionId = req.cookies?.sessionId;
    if (cookieSessionId && admin.activeSessionId && admin.activeSessionId !== cookieSessionId) {
      console.warn(`[Auth Middleware] SESSION_CONFLICT for ${admin.username || decoded.username}`);
      return res.status(401).json({
        code: 'SESSION_CONFLICT',
        message: 'Tài khoản đã được đăng nhập từ thiết bị khác'
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth Middleware] Success: Valid token for user: ${admin.username || decoded.username}`);
    }

    req.user = {
      ...decoded,
      id: String(admin._id),
      username: admin.username,
      role: admin.role
    };
    req.admin = req.user; // Keep for backward compatibility
    next();
  } catch (error) {
    console.error(`[Auth Middleware] JWT Verify Error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = auth;

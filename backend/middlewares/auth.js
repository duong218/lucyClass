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
    
    // 🎯 SESSION CONFLICT CHECK
    const cookieSessionId = req.cookies?.sessionId;
    if (cookieSessionId) {
      const user = await Admin.findById(decoded.id).select('activeSessionId').lean();
      if (user && user.activeSessionId && user.activeSessionId !== cookieSessionId) {
        console.warn(`[Auth Middleware] SESSION_CONFLICT for ${decoded.username}`);
        return res.status(401).json({
          code: 'SESSION_CONFLICT',
          message: 'Tài khoản đã được đăng nhập từ thiết bị khác'
        });
      }
    }

    console.log(`[Auth Middleware] Success: Valid token for user: ${decoded.username}`);
    
    req.user = decoded;
    req.admin = decoded; // Keep for backward compatibility
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

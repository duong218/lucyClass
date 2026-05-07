const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const systemLogger = require('../utils/systemLogger');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Custom Rate Limit Handler
 * Returns a standardized JSON response for the frontend
 */
const rateLimitHandler = (req, res, next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);

  systemLogger.warn('Rate limit exceeded', {
    ip: req.ip,
    userId: req.user?.id || 'guest',
    url: req.originalUrl,
    retryAfter
  });

  res.status(429).json({
    status: 'error',
    type: 'RATE_LIMIT',
    message: 'RATE_LIMIT_EXCEEDED',
    retryAfter: retryAfter,
    translationKey: 'form.rateLimit'
  });
};

/**
 * 1. Global API Limiter
 * 200 requests / 5 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isProduction ? 200 : 10000,
  skip: (req) => req.user?.role === 'admin',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 2. Auth/Login Limiter
 * Strict protection for login attempts
 * PROD: 5 attempts / 10 mins
 * DEV: 100 attempts / 1 min
 */
const loginLimiter = rateLimit({
  windowMs: isProduction ? 10 * 60 * 1000 : 1 * 60 * 1000,
  max: isProduction ? 5 : 100,
  skipSuccessfulRequests: true,
  skip: (req) => req.user?.role === 'admin',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 3. Registration Limiter
 * Protection against form spam
 * PROD: 5 attempts / 1 hour
 * DEV: 10000 attempts / 1 minute
 */
const registerLimiter = rateLimit({
  windowMs: isProduction ? 60 * 60 * 1000 : 60 * 1000,
  max: isProduction ? 5 : 10000,
  skipSuccessfulRequests: false,
  skip: (req) => req.user?.role === 'admin',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 4. Stats dashboard Limiter
 * High limit for analytical dashboards
 */
const statsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  skip: (req) => req.user?.role === 'admin',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 5. Public Content Limiter
 * Browsing courses, teachers, etc.
 */
const publicLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  skip: (req) => req.user?.role === 'admin',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 6. Forgot Password Limiter
 * Protection against email spam
 * PROD: 3 attempts / 1 hour
 * DEV: 100 attempts / 1 hour
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 100,
  skip: (req) => req.user?.role === 'admin',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 7. Reset Password Limiter
 * Protection against token brute-force
 * PROD: 5 attempts / 30 mins
 * DEV: 1000 attempts / 1 hour
 */
const resetPasswordLimiter = rateLimit({
  windowMs: isProduction ? 30 * 60 * 1000 : 60 * 60 * 1000,
  max: isProduction ? 5 : 1000,
  skip: (req) => req.user?.role === 'admin',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 8. Streak Limiter
 * Protection for streak check-in/recover
 * PROD: 20 attempts / 5 mins
 * DEV: 10000 attempts / 1 min
 */
const streakLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isProduction ? 5 : 10000,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 9. Heavy Admin Operations Limiter
 * Backup & Restore — rất tốn CPU/RAM/Disk
 * PROD: 3 lần / 5 phút
 * DEV: không giới hạn thực tế
 */
const heavyOpLimiter = rateLimit({
  windowMs: isProduction ? 15 * 60 * 1000 : 5 * 60 * 1000,
  max: isProduction ? 5 : 1000,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 10. Toggle Attendance Limiter
 * Bảo vệ endpoint checkin/checkout khỏi spam
 * PROD: 20 lần / phút (tương đương 10 ca/phút — quá đủ dùng thực tế)
 * DEV: không giới hạn thực tế
 */
const toggleAttendanceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 30 : 10000,
  skip: (req) => !req.user, // đã có auth middleware trước, skip nếu chưa auth (sẽ bị chặn ở auth)
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 11. AI Proxy Limiter — POST /api/chat-config/ask
 * Endpoint public gọi Groq; cần siết riêng để tránh abuse đốt quota.
 * PROD: 10 request / phút / IP — đủ cho người dùng thật chat bình thường
 * DEV: không giới hạn thực tế
 */
const aiProxyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 10 : 10000,
  keyGenerator: (req) => ipKeyGenerator(req), // rate-limit theo IP, không phụ thuộc auth
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  statsLimiter,
  publicLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  streakLimiter,
  heavyOpLimiter,
  toggleAttendanceLimiter,
  aiProxyLimiter,
};
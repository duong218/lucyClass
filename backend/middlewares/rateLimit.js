const rateLimit = require('express-rate-limit');

// Moderate Global API Limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,                // 1 request per second average
  message: { success: false, message: 'Too many requests, please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Soft Stricter Limiter (10 req / 2 min) for Auth & Public Forms
const softLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 10,                 // 10 attempts
  message: { success: false, message: 'Too many attempts. Please wait 2 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, softLimiter };

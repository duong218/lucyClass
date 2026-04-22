const csrf = require('csurf');

const isProd = process.env.NODE_ENV === 'production';

// Common cookie configuration for the CSRF secret
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/'
};

const csrfMiddleware = csrf({ cookie: cookieOptions });

/**
 * 🎯 Custom CSRF Wrapper for Selective Protection
 * Requirement 2: Skip CSRF for login, logout, and refresh
 */
const csrfProtection = (req, res, next) => {
  // FIX #8: Đã xóa toàn bộ console.log debug — không leak request info ra stdout production

  const url = req.originalUrl ? req.originalUrl.split('?')[0] : '';
  
  const EXEMPT_PATHS = [
    '/api/auth/login',
    '/api/auth/logout', 
    '/api/auth/refresh-token',
    '/auth/login',
    '/auth/logout',
    '/auth/refresh-token'
  ];
  
  const isExempt = EXEMPT_PATHS.some(path => url === path || url.endsWith(path));

  // 1. Always run for GET requests to enable token generation
  if (req.method === 'GET') {
    return csrfMiddleware(req, res, next);
  }

  // 2. Explicitly skip validation for sensitive Auth routes
  if (isExempt) {
    return next();
  }

  // 3. Apply standard protection for all other data-changing requests
  csrfMiddleware(req, res, (err) => {
    if (err) {
      console.error(`[CSRF Error] ${err.message} at ${url}`);
    }
    next(err);
  });
};

module.exports = csrfProtection;

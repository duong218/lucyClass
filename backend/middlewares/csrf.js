const csrf = require('csurf');

const isProd = process.env.NODE_ENV === 'production';

// Common cookie configuration for the CSRF secret
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax', //chatgpt sửa 8:48 22/
  path: '/'
};

const csrfMiddleware = csrf({ cookie: cookieOptions });

/**
 * 🎯 Custom CSRF Wrapper for Selective Protection
 * Requirement 2: Skip CSRF for login, logout, and refresh
 */
const csrfProtection = (req, res, next) => {
  // BƯỚC 1: Thêm dòng log debug tạm thời để xác nhận req.path thực tế
  console.log('[CSRF Debug] req.path:', req.path);
  console.log('[CSRF Debug] req.url:', req.url);
  console.log('[CSRF Debug] req.originalUrl:', req.originalUrl);

  // BƯỚC 2: Viết lại logic exempt dùng req.originalUrl
  const url = req.originalUrl ? req.originalUrl.split('?')[0] : ''; // bỏ query string
  
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
    console.log(`[CSRF] Skipped for sensitive Auth route: ${url}`);
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

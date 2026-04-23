const systemLogger = require('../utils/systemLogger');

/**
 * 🛡️ Lightweight CSRF Protection via Origin & Custom Header
 * Phù hợp cho stateless JWT + cross-origin (Vercel/Render)
 */
const verifyCSRF = (req, res, next) => {
  // 1. WHITELIST LOCAL DEVELOPMENT
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // 2. Bỏ qua các request an toàn (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 3. Whitelist các route cụ thể (chỉ public form, KHÔNG bao gồm login)
  const url = req.originalUrl ? req.originalUrl.split('?')[0] : '';
  const WHITELIST_PATHS = [
    // '/api/auth/login' đã bị xóa — login phải chịu CSRF check
    // để phòng Login CSRF (attacker ép victim đăng nhập vào account của attacker)
    '/api/registrations',
    '/api/register'
  ];
  
  const isWhitelisted = WHITELIST_PATHS.some(path => url === path);
  if (isWhitelisted) {
    return next();
  }

  const origin = req.headers.origin;
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''));
  
  // 4. Kiểm tra Origin Header (Bắt buộc cho request thay đổi dữ liệu)
  // Dùng strict equality thay vì startsWith để tránh bypass kiểu
  // https://trusted.com.attacker.tld pass được startsWith('https://trusted.com')
  const normalizedOrigin = String(origin || '').trim().replace(/\/$/, '');
  if (!normalizedOrigin || !allowedOrigins.includes(normalizedOrigin)) {
    systemLogger.warn('CSRF: Blocked by Origin check', { origin: normalizedOrigin, url: req.originalUrl });
    return res.status(403).json({ 
      success: false, 
      message: 'Security Policy: Origin not allowed',
      status: 'error',
      type: 'CSRF'
    });
  }

  // 5. Kiểm tra Custom Header (Chỉ frontend của bạn mới gửi được header này khi cross-site)
  if (!req.headers['x-requested-with']) {
    systemLogger.warn('CSRF: Blocked by Missing Custom Header', { ip: req.ip, url: req.originalUrl });
    return res.status(403).json({ 
      success: false, 
      message: 'Security Policy: CSRF Token missing (X-Requested-With)',
      status: 'error',
      type: 'CSRF'
    });
  }

  next();
};

module.exports = { verifyCSRF };

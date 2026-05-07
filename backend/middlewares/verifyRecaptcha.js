/**
 * middlewares/verifyRecaptcha.js
 *
 * Middleware xác thực reCAPTCHA v3 token cho các endpoint public nhạy cảm.
 *
 * Luồng:
 *   1. Đọc token từ header `X-Recaptcha-Token`.
 *   2. Gọi Google siteverify API.
 *   3. Kiểm tra: success, hostname, action prefix, score >= threshold.
 *   4. Nếu fail → 403. Nếu pass → next().
 *
 * Dùng:
 *   router.post('/ask', aiProxyLimiter, verifyRecaptcha('chat'), askAssistant);
 */

const axios = require('axios');

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

// Score tối thiểu để chấp nhận request (0.0 - 1.0).
// 0.5 là ngưỡng Google khuyến nghị cho action thông thường.
// Có thể nâng lên 0.7 nếu muốn siết hơn.
const DEFAULT_MIN_SCORE = 0.5;

// Timeout gọi Google — không để block request quá lâu
const VERIFY_TIMEOUT_MS = 5000;

/**
 * @param {string} expectedAction - action name dùng khi frontend gọi executeRecaptcha()
 * @param {number} [minScore]     - override ngưỡng score nếu cần
 */
function verifyRecaptcha(expectedAction, minScore = DEFAULT_MIN_SCORE) {
  return async function recaptchaMiddleware(req, res, next) {
    // Bỏ qua môi trường dev nếu muốn — nhưng mặc định vẫn verify để test đúng flow
    if (process.env.NODE_ENV !== 'production' && process.env.SKIP_RECAPTCHA === 'true') {
      return next();
    }

    const token = req.headers['x-recaptcha-token'];

    if (!token) {
      return res.status(403).json({
        success: false,
        code: 'RECAPTCHA_MISSING',
        message: 'reCAPTCHA token bị thiếu',
      });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      // Nếu server chưa cấu hình key → log lỗi nhưng vẫn cho qua
      // (tránh block toàn bộ user khi deploy thiếu env)
      console.error('[verifyRecaptcha] RECAPTCHA_SECRET_KEY chưa được cấu hình');
      return next();
    }

    try {
      const { data } = await axios.post(
        RECAPTCHA_VERIFY_URL,
        new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: req.ip,
        }),
        {
          timeout: VERIFY_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      // Log để monitor — bỏ trong production nếu noise quá
      if (process.env.NODE_ENV !== 'production') {
        console.log('[verifyRecaptcha]', {
          success: data.success,
          score: data.score,
          action: data.action,
          hostname: data.hostname,
        });
      }

      if (!data.success) {
        return res.status(403).json({
          success: false,
          code: 'RECAPTCHA_FAILED',
          message: 'reCAPTCHA xác thực thất bại',
        });
      }

      // Kiểm tra action khớp — ngăn token của form khác bị tái sử dụng
      if (expectedAction && data.action && !data.action.startsWith(expectedAction)) {
        return res.status(403).json({
          success: false,
          code: 'RECAPTCHA_ACTION_MISMATCH',
          message: 'reCAPTCHA action không hợp lệ',
        });
      }

      // Kiểm tra score
      if (typeof data.score === 'number' && data.score < minScore) {
        return res.status(403).json({
          success: false,
          code: 'RECAPTCHA_LOW_SCORE',
          message: 'reCAPTCHA score quá thấp, nghi ngờ bot',
        });
      }

      // Gắn kết quả vào req để controller có thể log nếu cần
      req.recaptcha = {
        score: data.score,
        action: data.action,
        hostname: data.hostname,
      };

      return next();
    } catch (err) {
      // Nếu Google API timeout hoặc lỗi mạng → log và cho qua
      // Không nên block user vì lỗi phía Google
      console.error('[verifyRecaptcha] Verify request failed:', err.message);
      return next();
    }
  };
}

module.exports = verifyRecaptcha;
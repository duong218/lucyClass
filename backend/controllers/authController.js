const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const systemLogger = require('../utils/systemLogger');

// Helper to delay response
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const escapeStringRegexp = (string) => {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
};

// --- 🎯 FULL COOKIE AUTH CONFIG ---

/**
 * Robust cookie configuration
 * Local: secure: false, sameSite: 'lax'
 * Production: secure: true, sameSite: 'none' (required for cross-site)
 */
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    // 🔐 Session timeout 8 giờ (CHỈ production)
    maxAge: isProd ? 8 * 60 * 60 * 1000 : undefined,
    domain: isProd ? process.env.COOKIE_DOMAIN : undefined
  };
};

const generateTokens = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!jwtSecret || !refreshTokenSecret) {
    systemLogger.error('[Auth] JWT_SECRET or REFRESH_TOKEN_SECRET is not defined!');
  }

  const accessToken = jwt.sign(
    { id: user._id, username: user.username, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    refreshTokenSecret,
    { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password, captchaToken } = req.body;
  try {
    const safeUsername = String(username || '').trim();
    const user = await Admin.findOne({ username: safeUsername });
    if (!user) {
      console.warn(`[Login] Failed: User not found (${safeUsername})`);
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Check lockUntil
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingSeconds = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(423).json({ message: `Tài khoản đang bị khóa. Thử lại sau ${remainingSeconds}s` });
    }

    // Verify CAPTCHA
    const recaptchaRes = await axios.post('https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: captchaToken }),
      { timeout: 5000 });
    if (!recaptchaRes.data.success) {
      return res.status(400).json({ message: 'reCAPTCHA failed' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) user.lockUntil = Date.now() + 120000;
      await user.save();
      await delay(1000);
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const { accessToken, refreshToken } = generateTokens(user);

    // 🎯 Generate unique session ID for single-session enforcement
    const sessionId = crypto.randomBytes(32).toString('hex');
    user.activeSessionId = sessionId;

    // Save refreshToken for rotation/revocation
    if (!user.refreshTokens) user.refreshTokens = [];
    // Clear old refresh tokens (new login = new session, old tokens invalid)
    user.refreshTokens = [refreshToken];
    await user.save();

    const options = getCookieOptions();

    // 🎯 Set refreshToken in httpOnly cookie
    res.cookie('refreshToken', refreshToken, options);

    // 🎯 Set sessionId cookie (no maxAge = session cookie, expires when browser closes)
    res.cookie('sessionId', sessionId, {
      ...options
      // No maxAge: cookie will be deleted when browser is closed
    });

    console.log(`[Login] Success: ${user.username} (RefreshToken + SessionId cookies issued)`);

    // 🎯 Return accessToken in JSON
    res.status(200).json({
      success: true,
      accessToken,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    systemLogger.error('[Login] Error', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Hệ thống gặp sự cố' });
  }
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    console.warn('[Refresh] No refreshToken cookie found');
    return res.status(401).json({ message: 'No session found' });
  }

  try {
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshTokenSecret) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined');
    }

    const decoded = jwt.verify(token, refreshTokenSecret);
    const user = await Admin.findById(decoded.id).select('+activeSessionId');

    if (!user || (user.refreshTokens ? !user.refreshTokens.includes(token) : true)) {
      console.error(`[Refresh] Invalid/Reuse attempt: ${decoded.id}`);
      const options = getCookieOptions();
      res.clearCookie('refreshToken', options);
      res.clearCookie('sessionId', options);
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // 🎯 SESSION CONFLICT CHECK: validate sessionId from cookie matches DB
    const cookieSessionId = req.cookies?.sessionId;
    if (!cookieSessionId || cookieSessionId !== user.activeSessionId) {
      console.warn(`[Refresh] SESSION_CONFLICT for ${user.username}: cookie=${cookieSessionId ? 'present' : 'missing'}, db=${user.activeSessionId ? 'present' : 'missing'}`);
      const options = getCookieOptions();
      res.clearCookie('refreshToken', options);
      res.clearCookie('sessionId', options);
      return res.status(401).json({
        code: 'SESSION_CONFLICT',
        message: 'Tài khoản đã được đăng nhập từ thiết bị khác'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Rotate refreshToken
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    const options = getCookieOptions();

    res.cookie('refreshToken', newRefreshToken, options);

    // 🎯 Keep existing sessionId cookie alive (re-set as session cookie)
    res.cookie('sessionId', cookieSessionId, {
      ...options
      // No maxAge: remains a session cookie
    });

    console.log(`[Refresh] Success for ${user.username}`);
    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    systemLogger.error('[Refresh] Error', { message: error.message });
    const options = getCookieOptions();
    res.clearCookie('refreshToken', options);
    res.clearCookie('sessionId', options);
    res.status(401).json({ message: 'Session expired' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  try {
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.id) {
        // 🎯 Clear activeSessionId + remove refresh token on logout
        await Admin.findByIdAndUpdate(decoded.id, {
          $pull: { refreshTokens: token },
          $unset: { activeSessionId: 1 }
        });
        console.log(`[Logout] Success for user ID: ${decoded.id}`);
      }
    }
  } catch (err) {
    console.error('[Logout] Trace error:', err.message);
  }

  const options = getCookieOptions();
  res.clearCookie('refreshToken', options);
  res.clearCookie('sessionId', options);
  res.json({ message: 'Đã đăng xuất' });
};

// Password Recovery ...
exports.forgotPassword = async (req, res) => {
  try {
    const { email, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({ message: 'Captcha is required' });
    }

    const recaptchaRes = await axios.post('https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: recaptchaToken }),
      { timeout: 5000 });

    if (!recaptchaRes.data.success) {
      console.warn('[ForgotPassword] reCAPTCHA failed:', recaptchaRes.data['error-codes']);
      return res.status(400).json({ message: 'reCAPTCHA failed' });
    }

    const safeEmail = String(email || '').trim();
    const user = await Admin.findOne({ email: { $regex: new RegExp("^" + escapeStringRegexp(safeEmail) + "$", "i") } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
    await transporter.sendMail({ from: `"Lucy's Class" <${process.env.EMAIL_USER}>`, to: user.email, subject: 'Yêu cầu đặt lại mật khẩu', html: `<p>Nhấn vào <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">đây</a> để đặt lại mật khẩu.</p>` });
    res.json({ success: true, message: 'Link reset đã được gửi' });
  } catch (error) { 
    systemLogger.error('[ForgotPassword] Error', { message: error.message });
    res.status(500).json({ message: 'Lỗi gửi email' }); 
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body; const { token } = req.params;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await Admin.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Link không hợp lệ hoặc hết hạn' });
    user.password = password; user.resetPasswordToken = undefined; user.resetPasswordExpire = undefined; user.loginAttempts = 0; user.lockUntil = undefined;
    await user.save();
    res.json({ success: true, message: 'Thành công!' });
  } catch (error) { res.status(500).json({ message: 'Lỗi hệ thống' }); }
};

// GET /api/auth/check-session
exports.checkSession = (req, res) => {
  res.status(200).json({ success: true, message: 'Phiên đăng nhập hợp lệ' });
};

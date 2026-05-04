const Admin = require('../models/Admin');
const StaffAccount = require('../models/StaffAccount');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const crypto = require('crypto');
const { sendEmail, getHtmlTemplate } = require('../utils/emailService');
const systemLogger = require('../utils/systemLogger');
const LoginAttemptLog = require('../models/LoginAttemptLog');
const BlockedIP = require('../models/BlockedIP');

// ── Ngưỡng cảnh báo: bao nhiêu lần fail / IP thì auto-block ──────────────────
const FAIL_THRESHOLD = 5;      // bao nhiêu lần fail cùng IP trong cửa sổ thời gian
const FAIL_WINDOW_MS = 10 * 60 * 1000; // 10 phút

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeStringRegexp = (string) => {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
};

// ─── Hàm tiện ích lấy IP từ request ─────────────────────────────────────────
const getClientIP = (req) =>
  req.clientIP || // đã được middleware checkBlockedIP gắn sẵn
  req.ip ||
  req.socket?.remoteAddress ||
  'unknown';

// ─── Ghi log attempt vào DB ──────────────────────────────────────────────────
const recordAttempt = async (req, action, extra = {}) => {
  try {
    await LoginAttemptLog.create({
      ip: getClientIP(req),
      username: extra.username || null,
      action,
      userAgent: req.headers['user-agent'] || null,
      reason: extra.reason || null,
      userId: extra.userId || null,
    });
  } catch (err) {
    systemLogger.error('[LoginAttemptLog] Failed to write log', { message: err.message });
  }
};

// ─── Kiểm tra + auto-block IP nếu vượt ngưỡng fail ─────────────────────────
const checkAndAutoBlock = async (ip) => {
  const since = new Date(Date.now() - FAIL_WINDOW_MS);
  const failCount = await LoginAttemptLog.countDocuments({
    ip,
    action: 'LOGIN_FAIL',
    createdAt: { $gte: since },
  });

  if (failCount >= FAIL_THRESHOLD) {
    await BlockedIP.findOneAndUpdate(
      { ip },
      {
        ip,
        reason: `Tự động chặn: ${failCount} lần đăng nhập sai trong 10 phút`,
        blockedBy: null,
      },
      { upsert: true, new: true }
    );
    systemLogger.warn('[Security] Auto-blocked IP', { ip, failCount });
    return true;
  }
  return false;
};

// ─── Cookie config (không đổi) ────────────────────────────────────────────────
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: isProd ? 8 * 60 * 60 * 1000 : undefined,
    domain: isProd ? process.env.COOKIE_DOMAIN : undefined,
  };
};

// ─── Cookie config cho clearCookie — không có maxAge (Express v5 deprecated) ──
const getClearCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    domain: isProd ? process.env.COOKIE_DOMAIN : undefined,
  };
};

// ─── generateTokens ───────────────────────────────────────────────────────────
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

// ─── Helper: tìm user theo username trong cả 2 collection ────────────────────
const findUserByUsername = async (username) => {
  let user = await Admin.findOne({ username });
  if (user) return { user, isStaff: false };

  user = await StaffAccount.findOne({ username });
  if (user) return { user, isStaff: true };

  return { user: null, isStaff: false };
};

// ─── Helper: tìm Admin theo email ────────────────────────────────────────────
const findAdminByEmail = async (safeEmail) => {
  const regex = new RegExp('^' + escapeStringRegexp(safeEmail) + '$', 'i');
  const user = await Admin.findOne({ email: { $regex: regex } });
  return user || null;
};

// ─── Helper: tìm staff theo username + email ─────────────────────────────────
const findStaffByUsernameAndEmail = async (username, safeEmail) => {
  const regex = new RegExp('^' + escapeStringRegexp(safeEmail) + '$', 'i');
  const user = await StaffAccount.findOne({
    username,
    email: { $regex: regex },
    isActive: true,
  });
  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { username, password, captchaToken } = req.body;
  const ip = getClientIP(req);

  try {
    const safeUsername = String(username || '').trim();

    // Verify CAPTCHA trước
    if (!captchaToken) {
      return res.status(400).json({ message: 'Captcha is required' });
    }

    const recaptchaRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken
        },
        timeout: 5000
      }
    );
    
    if (!recaptchaRes.data.success || recaptchaRes.data.score < 0.7) {
      console.warn('[Login] reCAPTCHA failed or low score:', recaptchaRes.data);
      return res.status(400).json({ message: 'reCAPTCHA failed (Low Score)' });
    }

    const { user, isStaff } = await findUserByUsername(safeUsername);

    if (!user) {
      console.warn(`[Login] Failed: User not found (${safeUsername})`);
      await recordAttempt(req, 'LOGIN_FAIL', {
        username: safeUsername,
        reason: 'User not found',
      });
      await checkAndAutoBlock(ip);
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Check lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingSeconds = Math.ceil((user.lockUntil - Date.now()) / 1000);
      await recordAttempt(req, 'LOGIN_FAIL', {
        username: safeUsername,
        userId: user._id,
        reason: `Account locked (${remainingSeconds}s remaining)`,
      });
      await checkAndAutoBlock(ip);
      return res.status(423).json({
        message: `Tài khoản đang bị khóa. Thử lại sau ${remainingSeconds}s`,
      });
    }

    // Check active (chỉ staff)
    if (isStaff && !user.isActive) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hoá' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) user.lockUntil = Date.now() + 120000;
      await user.save();

      await recordAttempt(req, 'LOGIN_FAIL', {
        username: safeUsername,
        userId: user._id,
        reason: `Wrong password (attempt #${user.loginAttempts})`,
      });
      await checkAndAutoBlock(ip);

      await delay(1000);
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // ── Đăng nhập thành công ──────────────────────────────────────────────────
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const { accessToken, refreshToken } = generateTokens(user);
    const sessionId = crypto.randomBytes(32).toString('hex');
    user.activeSessionId = sessionId;
    if (!user.refreshTokens) user.refreshTokens = [];
    user.refreshTokens = [refreshToken];
    await user.save();

    await recordAttempt(req, 'LOGIN_SUCCESS', {
      username: safeUsername,
      userId: user._id,
    });

    const options = getCookieOptions();
    res.cookie('refreshToken', refreshToken, options);
    res.cookie('sessionId', sessionId, { ...options, httpOnly: true });

    console.log(`[Login] Success: ${user.username} (${user.role})`);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName || user.username,
      },
    });
  } catch (error) {
    systemLogger.error('[Login] Error', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Hệ thống gặp sự cố' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// ─────────────────────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    console.warn('[Refresh] No refreshToken cookie found');
    return res.status(401).json({ message: 'No session found' });
  }

  try {
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshTokenSecret) throw new Error('REFRESH_TOKEN_SECRET is not defined');

    const decoded = jwt.verify(token, refreshTokenSecret, { algorithms: ['HS256'] });

    let user =
      (await Admin.findById(decoded.id).select('+activeSessionId')) ||
      (await StaffAccount.findById(decoded.id).select('+activeSessionId'));

    if (!user || (user.refreshTokens ? !user.refreshTokens.includes(token) : true)) {
      console.error(`[Refresh] Invalid/Reuse attempt: ${decoded.id}`);
      const clearOptions = getClearCookieOptions();
      res.clearCookie('refreshToken', clearOptions);
      res.clearCookie('sessionId', clearOptions);
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    const cookieSessionId = req.cookies?.sessionId;
    if (!cookieSessionId || cookieSessionId !== user.activeSessionId) {
      console.warn(`[Refresh] SESSION_CONFLICT for ${user.username}`);
      const clearOptions = getClearCookieOptions();
      res.clearCookie('refreshToken', clearOptions);
      res.clearCookie('sessionId', clearOptions);
      return res.status(401).json({
        code: 'SESSION_CONFLICT',
        message: 'Tài khoản đã được đăng nhập từ thiết bị khác',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    const options = getCookieOptions();
    res.cookie('refreshToken', newRefreshToken, options);
    res.cookie('sessionId', cookieSessionId, { ...options, httpOnly: true });

    console.log(`[Refresh] Success for ${user.username} (${user.role})`);
    res.json({ success: true, accessToken });
  } catch (error) {
    systemLogger.error('[Refresh] Error', { message: error.message });
    const clearOptions = getClearCookieOptions();
    res.clearCookie('refreshToken', clearOptions);
    res.clearCookie('sessionId', clearOptions);
    res.status(401).json({ message: 'Session expired' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  try {
    if (token) {
      let decoded = null;
      try {
        decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] });
      } catch (verifyErr) {
        console.warn('[Logout] Invalid token, skipping DB cleanup:', verifyErr.message);
      }

      if (decoded?.id) {
        const updateFields = {
          $pull: { refreshTokens: token },
          $unset: { activeSessionId: 1 },
        };
        const adminRes = await Admin.findByIdAndUpdate(decoded.id, updateFields);
        if (!adminRes) {
          await StaffAccount.findByIdAndUpdate(decoded.id, updateFields);
        }
        console.log(`[Logout] Success for user ID: ${decoded.id}`);
      }
    }
  } catch (err) {
    console.error('[Logout] Trace error:', err.message);
  }
  const clearOptions = getClearCookieOptions();
  res.clearCookie('refreshToken', clearOptions);
  res.clearCookie('sessionId', clearOptions);
  res.json({ message: 'Đã đăng xuất' });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email, username, recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return res.status(400).json({ message: 'Captcha is required' });
    }
    const recaptchaRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        },
        timeout: 5000
      }
    );
    
    if (!recaptchaRes.data.success || recaptchaRes.data.score < 0.5) {
      console.warn('[ForgotPassword] reCAPTCHA failed or low score:', recaptchaRes.data);
      return res.status(400).json({ message: 'reCAPTCHA failed (Low Score)' });
    }

    const safeEmail = String(email || '').trim();
    const safeUsername = String(username || '').trim();
    const accountType = String(req.body.accountType || '').trim();

    if (accountType !== 'admin' && accountType !== 'staff') {
      return res.status(400).json({ message: 'Yêu cầu không hợp lệ' });
    }

    const GENERIC_SUCCESS = { success: true, message: 'Nếu thông tin hợp lệ, link reset đã được gửi' };

    let user = null;

    if (accountType === 'staff') {
      if (!safeUsername) return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập' });
      if (!safeEmail) return res.status(400).json({ message: 'Vui lòng nhập email' });

      user = await findStaffByUsernameAndEmail(safeUsername, safeEmail);
      if (!user) {
        console.warn(`[ForgotPassword] Staff not found: username=${safeUsername}, email=${safeEmail}`);
        return res.json(GENERIC_SUCCESS);
      }
      if (!user.email || user.email.trim() === '') {
        console.warn(`[ForgotPassword] Staff ${safeUsername} has no email`);
        return res.json(GENERIC_SUCCESS);
      }
    } else {
      if (!safeEmail) return res.status(400).json({ message: 'Vui lòng nhập email' });

      user = await findAdminByEmail(safeEmail);
      if (!user) {
        console.warn(`[ForgotPassword] Admin not found for email: ${safeEmail}`);
        return res.json(GENERIC_SUCCESS);
      }
    }

    // Ghi log reset password request
    await recordAttempt(req, 'RESET_PASSWORD_REQUEST', {
      username: user.username,
      userId: user._id,
    });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const htmlContent = `
      <p style="margin: 0; font-size: 18px;">Bạn yêu cầu đặt lại mật khẩu? 👋</p>
      <p style="margin: 15px 0;">Nhấn vào nút bên dưới để đặt lại mật khẩu tài khoản LucyClass của bạn:</p>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
        <tr>
          <td align="center">
            <a href="${resetUrl}" style="background-color: #4F9CF9; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">Đặt lại mật khẩu</a>
          </td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 14px; color: #888888;">Liên kết sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'LucyClass - Đặt lại mật khẩu',
      html: getHtmlTemplate(htmlContent),
      text: `Đặt lại mật khẩu tại: ${resetUrl}`,
    });

    res.json(GENERIC_SUCCESS);
  } catch (error) {
    systemLogger.error('[ForgotPassword] Error', { message: error.message });
    res.status(500).json({ message: 'Lỗi gửi email' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
    if (!password || !strongPassword.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const query = {
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    };

    let user = await Admin.findOne(query);
    if (!user) user = await StaffAccount.findOne(query);

    if (!user) {
      return res.status(400).json({ message: 'Link không hợp lệ hoặc hết hạn' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.refreshTokens = [];
    user.activeSessionId = undefined;
    await user.save();

    // Ghi log đặt lại thành công
    await recordAttempt(req, 'RESET_PASSWORD_SUCCESS', {
      username: user.username,
      userId: user._id,
    });

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// GET /api/auth/check-session
exports.checkSession = (req, res) => {
  res.status(200).json({ success: true, message: 'Phiên đăng nhập hợp lệ' });
};

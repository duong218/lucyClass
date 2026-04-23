// ─────────────────────────────────────────────────────────────
// PHONE / IP LIMITER (anti spam - Redis version)
// Redis client dùng chung với server.js (config/redis.js)
// Tự expire key — không cần cleanup thủ công
// ─────────────────────────────────────────────────────────────

const redisClient = require('../config/redis');

// ── Cấu hình từ env (có fallback mặc định) ──────────────────
const DIVERSITY_LIMIT = parseInt(process.env.PHONE_DIVERSITY_LIMIT) || 3;    // tối đa N số khác nhau / IP / ngày
const SPAM_COOLDOWN_MS = parseInt(process.env.PHONE_SPAM_COOLDOWN_MS) || 3000; // cooldown giữa 2 request cùng số (ms)
const IP_ACTION_LIMIT = parseInt(process.env.IP_ACTION_LIMIT) || 5;    // tối đa N lần đổi số / IP / ngày

// Helper: lấy ngày theo format YYYY-MM-DD
const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

// ─────────────────────────────────────────────────────────────
// 1. IP tạo quá nhiều số phone khác nhau trong 1 ngày
// ─────────────────────────────────────────────────────────────
exports.phoneDiversityLimiter = async (req, res, next) => {
  const ip = req.ip;
  const phone = req.body.phone;
  if (!phone) return next();

  try {
    const key = `diversity:${ip}:${getToday()}`;
    await redisClient.sAdd(key, phone);
    await redisClient.expire(key, 86400); // tự xóa sau 24h

    const count = await redisClient.sCard(key);
    if (count > DIVERSITY_LIMIT) {
      return res.status(429).json({
        success: false,
        message: 'Bạn đã nhập quá nhiều số điện thoại khác nhau hôm nay'
      });
    }
  } catch (_) {
    // Redis lỗi → cho qua, không block user
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// 2. 1 số phone spam request liên tục
// ─────────────────────────────────────────────────────────────
exports.phoneSpamLimiter = async (req, res, next) => {
  const phone = req.body.phone;
  if (!phone) return next();

  try {
    const key = `spam:${phone}`;
    const last = await redisClient.get(key);

    if (last && Date.now() - parseInt(last) < SPAM_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        message: 'Thao tác quá nhanh, vui lòng thử lại'
      });
    }

    await redisClient.set(key, Date.now(), { EX: 10 }); // tự xóa sau 10s
  } catch (_) {
    // Redis lỗi → cho qua
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// 3. 1 IP đổi số quá nhiều lần trong ngày
// ─────────────────────────────────────────────────────────────
exports.ipActionLimiter = async (req, res, next) => {
  const ip = req.ip;

  try {
    const key = `ipaction:${ip}:${getToday()}`;
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, 86400); // tự xóa sau 24h

    if (count > IP_ACTION_LIMIT) {
      return res.status(429).json({
        success: false,
        message: 'Bạn đã đổi số quá nhiều lần hôm nay'
      });
    }
  } catch (_) {
    // Redis lỗi → cho qua
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// PHONE / IP LIMITER (anti spam - lightweight version)
// ─────────────────────────────────────────────────────────────

// In-memory store (production lớn nên dùng Redis)
const phoneDiversityMap = new Map(); // IP → Set(phone)
const phoneSpamMap = new Map();      // phone → last request time
const ipActionMap = new Map();       // IP → count/day

// ── Cấu hình từ env (có fallback mặc định) ──────────────────
const DIVERSITY_LIMIT  = parseInt(process.env.PHONE_DIVERSITY_LIMIT)  || 3;    // tối đa N số khác nhau / IP / ngày
const SPAM_COOLDOWN_MS = parseInt(process.env.PHONE_SPAM_COOLDOWN_MS) || 3000; // cooldown giữa 2 request cùng số (ms)
const IP_ACTION_LIMIT  = parseInt(process.env.IP_ACTION_LIMIT)        || 5;    // tối đa N lần đổi số / IP / ngày

// Helper: lấy ngày theo format YYYY-MM-DD
const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

// ─────────────────────────────────────────────────────────────
// Cleanup định kỳ — xóa entry của ngày hôm qua khỏi cả 3 map
// Chạy mỗi 24h để tránh memory leak khi server chạy lâu ngày
// ─────────────────────────────────────────────────────────────
const startCleanup = () => {
  setInterval(() => {
    const today = getToday();

    // phoneDiversityMap và ipActionMap dùng key dạng `ip_YYYY-MM-DD`
    for (const key of phoneDiversityMap.keys()) {
      if (!key.endsWith(today)) phoneDiversityMap.delete(key);
    }
    for (const key of ipActionMap.keys()) {
      if (!key.endsWith(today)) ipActionMap.delete(key);
    }

    // phoneSpamMap dùng phone làm key, value là timestamp
    // Xóa entry không hoạt động quá 1 ngày
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [phone, ts] of phoneSpamMap.entries()) {
      if (ts < oneDayAgo) phoneSpamMap.delete(phone);
    }
  }, 24 * 60 * 60 * 1000); // chạy mỗi 24 giờ
};

startCleanup();

// ─────────────────────────────────────────────────────────────
// 1. IP tạo quá nhiều số phone khác nhau trong 1 ngày
// ─────────────────────────────────────────────────────────────
exports.phoneDiversityLimiter = (req, res, next) => {
  const ip = req.ip;
  const phone = req.body.phone;

  if (!phone) return next();

  const key = `${ip}_${getToday()}`;

  if (!phoneDiversityMap.has(key)) {
    phoneDiversityMap.set(key, new Set());
  }

  const phoneSet = phoneDiversityMap.get(key);
  phoneSet.add(phone);

  const LIMIT = DIVERSITY_LIMIT;

  if (phoneSet.size > LIMIT) {
    return res.status(429).json({
      success: false,
      message: 'Bạn đã nhập quá nhiều số điện thoại khác nhau hôm nay'
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// 2. 1 số phone spam request liên tục
// ─────────────────────────────────────────────────────────────
exports.phoneSpamLimiter = (req, res, next) => {
  const phone = req.body.phone;
  if (!phone) return next();

  const now = Date.now();
  const last = phoneSpamMap.get(phone) || 0;

  const COOLDOWN = SPAM_COOLDOWN_MS;

  if (now - last < COOLDOWN) {
    return res.status(429).json({
      success: false,
      message: 'Thao tác quá nhanh, vui lòng thử lại'
    });
  }

  phoneSpamMap.set(phone, now);
  next();
};

// ─────────────────────────────────────────────────────────────
// 3. 1 IP đổi số quá nhiều lần trong ngày
// ─────────────────────────────────────────────────────────────
exports.ipActionLimiter = (req, res, next) => {
  const ip = req.ip;
  const key = `${ip}_${getToday()}`;

  const count = ipActionMap.get(key) || 0;

  const LIMIT = IP_ACTION_LIMIT;

  if (count >= LIMIT) {
    return res.status(429).json({
      success: false,
      message: 'Bạn đã đổi số quá nhiều lần hôm nay'
    });
  }

  ipActionMap.set(key, count + 1);
  next();
};

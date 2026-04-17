// ─────────────────────────────────────────────────────────────
// PHONE / IP LIMITER (anti spam - lightweight version)
// ─────────────────────────────────────────────────────────────

// In-memory store (production lớn nên dùng Redis)
const phoneDiversityMap = new Map(); // IP → Set(phone)
const phoneSpamMap = new Map();      // phone → last request time
const ipActionMap = new Map();       // IP → count/day

// Helper: lấy ngày theo format YYYY-MM-DD
const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

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

  const LIMIT = 3; // tối đa 3 số khác nhau / ngày

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

  const COOLDOWN = 3000; // 3 giây

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

  const LIMIT = 5; // tối đa 5 lần đổi số / ngày

  if (count >= LIMIT) {
    return res.status(429).json({
      success: false,
      message: 'Bạn đã đổi số quá nhiều lần hôm nay'
    });
  }

  ipActionMap.set(key, count + 1);
  next();
};
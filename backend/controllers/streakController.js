const Streak = require('../models/Streak');

/**
 * Normalizes phone number:
 * - Convert +84 to 0
 * - Convert 9xxxxxxxx to 0xxxxxxxxx
 * - Keep only digits
 */
const normalizePhone = (phone = '') => {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('84')) {
    p = '0' + p.slice(2);
  } else if (p.length > 0 && !p.startsWith('0')) {
    p = '0' + p;
  }
  return p;
};

/**
 * Gets date in YYYY-MM-DD format with a given offset in days (Vietnam timezone)
 */
const getDateOffsetVN = (offsetDays = 0) => {
  const tz = process.env.STREAK_TZ || 'Asia/Ho_Chi_Minh';
  const now = new Date();
  
  // Convert current time to target timezone string
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // parts[0]=year, [2]=month, [4]=day
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day').value);
  
  const date = new Date(Date.UTC(year, month, day));
  date.setUTCDate(date.getUTCDate() + offsetDays);
  
  return date.toISOString().split('T')[0];
};

/**
 * Calculates difference in days between two YYYY-MM-DD strings
 */
const calculateDiffDays = (lastCheckinStr, todayStr) => {
  if (!lastCheckinStr) return 999;
  const last = new Date(lastCheckinStr + 'T00:00:00Z');
  const current = new Date(todayStr + 'T00:00:00Z');
  const diffTime = current - last;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const formatUser = (user) => ({
  phone: user.phone,
  name: user.name,
  email: user.email || '',
  streakCount: user.streakCount || 0,
  lastCheckin: user.lastCheckin || null,
  reviveUsed: user.reviveUsed || false
});

exports.startStreak = async (req, res) => {
  try {
    const { name, email } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Số điện thoại không hợp lệ'
      });
    }

    let user = await Streak.findOne({ phone });
    const today = getDateOffsetVN(0);

    if (!user) {
      user = await Streak.create({
        phone,
        name: name || 'User',
        email: email || '',
        streakCount: 0,
        lastCheckin: null,
        reviveUsed: false
      });
    }

    return res.json({
      success: true,
      data: formatUser(user),
      today
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error'
    });
  }
};

exports.getStreak = async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Thiếu số điện thoại'
      });
    }

    const user = await Streak.findOne({ phone });
    if (!user) {
      return res.json({ success: true, data: null });
    }

    const today = getDateOffsetVN(0);
    const diffDays = calculateDiffDays(user.lastCheckin, today);

    return res.json({
      success: true,
      data: formatUser(user),
      streakExpired: diffDays >= 4,
      diffDays,
      today
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error'
    });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { forceReset } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Thiếu số điện thoại'
      });
    }

    const user = await Streak.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Người dùng chưa đăng ký streak'
      });
    }

    const today = getDateOffsetVN(0);
    const diffDays = calculateDiffDays(user.lastCheckin, today);

    // CASE 1: Already checked today
    if (user.lastCheckin === today) {
      return res.json({
        success: true,
        data: formatUser(user),
        message: 'Bạn đã check-in hôm nay rồi'
      });
    }

    // CASE 2: Normal flow (checked yesterday)
    if (diffDays === 1) {
      user.streakCount += 1;
      user.reviveUsed = false; // Recharge revive
    } 
    // CASE 3: Need revive (missed 1-2 days)
    else if ((diffDays === 2 || diffDays === 3) && !forceReset) {
      return res.json({
        success: true,
        needRevive: true,
        missedDays: diffDays - 1,
        data: formatUser(user)
      });
    }
    // CASE 4: Expired or Forced reset
    else {
      user.streakCount = 1;
      user.reviveUsed = false;
    }

    user.lastCheckin = today;
    await user.save();

    return res.json({
      success: true,
      data: formatUser(user),
      message: diffDays >= 4 ? 'Chuỗi đã bị reset do không hoạt động quá lâu' : 'Check-in thành công'
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error'
    });
  }
};

exports.reviveStreak = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Thiếu số điện thoại'
      });
    }

    const user = await Streak.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Người dùng không tồn tại'
      });
    }

    const today = getDateOffsetVN(0);
    const diffDays = calculateDiffDays(user.lastCheckin, today);

    // VALIDATE: 2-3 days gap and revive not used
    if ((diffDays === 2 || diffDays === 3) && !user.reviveUsed) {
      user.streakCount += 1;
      user.lastCheckin = today;
      user.reviveUsed = true; // Mark as used
      await user.save();

      return res.json({
        success: true,
        data: formatUser(user),
        message: 'Cứu streak thành công!'
      });
    } else {
      return res.status(400).json({
        success: false,
        data: null,
        message: user.reviveUsed ? 'Bạn đã dùng lượt cứu streak cho chuỗi này rồi' : 'Không thuộc diện cứu streak'
      });
    }
  } catch (_error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error'
    });
  }
};

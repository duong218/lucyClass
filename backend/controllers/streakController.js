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
      data: formatUser(user)
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
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Không tìm thấy người dùng'
      });
    }

    return res.json({
      success: true,
      data: formatUser(user)
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
    const yesterday = getDateOffsetVN(-1);

    if (user.lastCheckin === today) {
      return res.json({
        success: true,
        data: formatUser(user),
        message: 'Bạn đã check-in hôm nay rồi'
      });
    }

    if (user.lastCheckin === yesterday) {
      user.streakCount += 1;
    } else {
      user.streakCount = 1;
      user.reviveUsed = false; // Reset revive status when streak is lost
    }

    user.lastCheckin = today;
    await user.save();

    return res.json({
      success: true,
      data: formatUser(user)
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

    if (user.reviveUsed) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Bạn đã dùng lượt cứu streak rồi'
      });
    }

    const today = getDateOffsetVN(0);
    const twoDaysAgo = getDateOffsetVN(-2);

    if (user.lastCheckin === twoDaysAgo) {
      user.streakCount += 1;
      user.lastCheckin = today;
      user.reviveUsed = true;
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
        message: 'Đã quá muộn để cứu streak'
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

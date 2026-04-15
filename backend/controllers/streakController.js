const jwt = require('jsonwebtoken');
const Streak = require('../models/Streak');

const getVNDate = (offset = 0) => {
  const vnNow = new Date().toLocaleString('en-US', {
    timeZone: process.env.STREAK_TZ || 'Asia/Ho_Chi_Minh'
  });

  const date = new Date(vnNow);
  date.setHours(0, 0, 0, 0);
  if (offset !== 0) {
    date.setDate(date.getDate() + offset);
  }

  return date.toISOString().slice(0, 10);
};

const normalizeName = (value = '') => value.trim().replace(/\s+/g, ' ');
const normalizeEmail = (value = '') => value.trim().toLowerCase();

const buildIdentityKey = (name, email) => {
  const baseName = normalizeName(name).toLowerCase();
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail ? `${baseName}|${normalizedEmail}` : baseName;
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email || '',
  streakCount: user.streakCount || 0,
  lastCheckin: user.lastCheckin || null
});

exports.startStreak = async (req, res) => {
  try {
    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email || '');
    const identityKey = buildIdentityKey(name, email);

    let user = await Streak.findOne({ identityKey });

    if (!user) {
      user = await Streak.create({
        identityKey,
        name,
        email,
        streakCount: 0,
        lastCheckin: null
      });
    } else {
      let changed = false;

      if (user.name !== name) {
        user.name = name;
        changed = true;
      }

      if (email && user.email !== email) {
        user.email = email;
        changed = true;
      }

      if (changed) {
        await user.save();
      }
    }

    const token = jwt.sign(
      { streakUserId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      data: formatUser(user)
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getStreak = async (req, res) => {
  try {
    const user = await Streak.findById(req.user.streakUserId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    return res.json({
      success: true,
      data: formatUser(user)
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const user = await Streak.findById(req.user.streakUserId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    const today = getVNDate();
    const yesterday = getVNDate(-1);

    if (user.lastCheckin === today) {
      return res.json({
        success: true,
        data: formatUser(user),
        message: 'Already checked in today'
      });
    }

    if (user.lastCheckin === yesterday) {
      user.streakCount += 1;
    } else {
      user.streakCount = 1;
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
      message: 'Server error'
    });
  }
};

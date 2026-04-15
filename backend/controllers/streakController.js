const Streak = require('../models/Streak');

const getVNDate = (offset = 0) => {
  const vn = new Date().toLocaleString('en-US', {
    timeZone: process.env.STREAK_TZ || 'Asia/Ho_Chi_Minh'
  });

  const date = new Date(vn);
  date.setHours(0, 0, 0, 0);
  if (offset !== 0) date.setDate(date.getDate() + offset);

  return date.toISOString().slice(0, 10);
};

const getDiffDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return null;

  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T00:00:00.000Z`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
};

const formatUser = (user) => {
  const today = getVNDate();
  const diffDays = getDiffDays(user.lastCheckin, today);

  const canRevive = diffDays === 1 && !user.reviveUsed;
  const lostStreak = diffDays > 1;

  return {
    phone: user.phone,
    name: user.name,
    email: user.email,
    streakCount: user.streakCount,
    lastCheckin: user.lastCheckin,
    canRevive,
    lostStreak
  };
};

// GET streak
exports.getStreak = async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await Streak.findOne({ phone });
    return res.json({
      success: true,
      data: user ? formatUser(user) : null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST check-in
exports.checkIn = async (req, res) => {
  try {
  const { phone, name, email } = req.body;

  const today = getVNDate();
  const yesterday = getVNDate(-1);

  let user = await Streak.findOne({ phone });

  // create new
  if (!user) {
    user = await Streak.create({
      phone,
      name,
      email: email ? email.toLowerCase() : '',
      streakCount: 1,
      lastCheckin: today
    });

    return res.json({ success: true, data: formatUser(user) });
  }

  // 🔒 email mismatch protection (soft auth)
  if (user.email && email && user.email !== email.toLowerCase()) {
    return res.status(403).json({
      success: false,
      message: 'Email does not match'
    });
  }

  // already check-in
  if (user.lastCheckin === today) {
    return res.json({ success: true, data: formatUser(user), message: 'Already checked in today' });
  }

  // streak logic
  if (user.lastCheckin === yesterday) {
    user.streakCount += 1;
  } else {
    user.streakCount = 1;
  }

  user.lastCheckin = today;

  // update info nếu có
  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();

  await user.save();

  return res.json({ success: true, data: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST revive streak
exports.reviveStreak = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await Streak.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const today = getVNDate();
    const yesterday = getVNDate(-1);

    if (user.lastCheckin !== yesterday || user.reviveUsed) {
      return res.status(400).json({
        success: false,
        message: 'Revive not available'
      });
    }

    user.reviveUsed = true;
    user.lastCheckin = today;
    user.streakCount += 1;

    await user.save();

    return res.json({
      success: true,
      data: formatUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// POST recover streak
exports.recoverStreak = async (req, res) => {
  try {
    const { phone, email } = req.body;

    const user = await Streak.findOne({ phone });

    if (!user) {
      return res.json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.email || user.email.toLowerCase() !== (email || '').toLowerCase()) {
      return res.json({
        success: false,
        message: 'Email does not match'
      });
    }

    return res.json({
      success: true,
      data: formatUser(user)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

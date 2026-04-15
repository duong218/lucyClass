const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  streakCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastCheckin: {
    type: String, // format YYYY-MM-DD
  },
  reviveUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: process.env.STREAK_COLLECTION || 'streaks'
});

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;

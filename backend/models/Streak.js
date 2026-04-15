const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    default: '',
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
  },
  // Legacy field kept to avoid schema issues, but no longer unique/required
  identityKey: {
    type: String,
    trim: true,
    index: true
  },
}, {
  timestamps: true,
  collection: process.env.STREAK_COLLECTION || 'streaks'
});

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;

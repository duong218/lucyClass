const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  identityKey: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
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
  // Legacy field kept to avoid schema/runtime issues with old data.
  phone: {
    type: String,
    trim: true
  },
  streakCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastCheckin: {
    type: String, // format YYYY-MM-DD
  },
}, {
  timestamps: true,
  collection: process.env.STREAK_COLLECTION || 'streaks'
});

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;

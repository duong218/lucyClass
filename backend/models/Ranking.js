const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  childName: {
    type: String,
    trim: true
  },
  courseName: {
    type: String,
    trim: true
  },
  stars: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  title: {
    type: String,
    trim: true,
    required: true,
    maxlength: 120
  },
  skill: {
    type: String,
    trim: true,
    required: true,
    maxlength: 120
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2100
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  strict: true
});

rankingSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });
rankingSchema.index({ year: 1, month: 1, stars: -1 });

module.exports = mongoose.model('Ranking', rankingSchema);

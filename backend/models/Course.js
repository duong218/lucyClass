const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  ageGroup: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  classSize: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  currentStudents: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  highlights: [{
    type: String,
    maxlength: 40
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  // Giáo viên phụ (tối đa 4 người)
  additionalTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  image: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);

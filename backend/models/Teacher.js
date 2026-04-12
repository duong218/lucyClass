const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  specialization: {
    type: String,
    required: true,
    maxlength: 100
  },
  experience: {
    type: Number,
    required: true,
    min: 1,
    max: 40
  },
  description: {
    type: String,
    default: '',
    maxlength: 50
  },
  feedback: {
    type: String,
    default: '',
    maxlength: 500,
    trim: true
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  avatar: {
    type: String,
    default: ''
  },
  avatarPublicId: {
    type: String,
    default: null
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

module.exports = mongoose.model('Teacher', teacherSchema);

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  parentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 32
  },
  childName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 32
  },
  childAge: {
    type: Number,
    required: true,
    min: 4,
    max: 16
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: true,
    maxlength: 200
  },
  photo: {
    type: String,
    default: ''
  },
  photoPublicId: {
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

module.exports = mongoose.model('Feedback', feedbackSchema);

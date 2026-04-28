const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  childName: {
    type: String,
    required: true,
    trim: true
  },
  childAge: {
    type: String,
    required: true,
    enum: ['preschool', 'primary', 'secondary', 'highschool', 'adult']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['not_contacted', 'contacted', 'registered'],
    default: 'not_contacted'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // ── Ghi chú / link sheet của admin ───────────────────────────────────────
  note: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  // ── Lịch sử chuyển lớp ────────────────────────────────────────────────────
  transferHistory: {
    type: [
      {
        fromCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        toCourseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        transferredAt: { type: Date, default: Date.now },
        transferredBy: { type: String, default: '' } // username của admin thực hiện
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

// Optimization: Faster lookups for duplicate checks and filtering
registrationSchema.index({ email: 1, phone: 1, courseId: 1 });
registrationSchema.index({ phone: 1, isActive: 1 });
registrationSchema.index({ courseId: 1, status: 1, isActive: 1 });

// Auto-delete old registrations after 1 year to keep DB lean
registrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('Registration', registrationSchema);
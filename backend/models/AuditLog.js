const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String, // LOGIN, LOGOUT, CREATE_TEACHER, UPDATE_TEACHER, DELETE_TEACHER, etc.
    required: true
  },
  targetType: {
    type: String, // teacher, course, feedback
    required: false
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  suspicious: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-delete logs after 180 days to save space on Atlas Free Tier
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

const mongoose = require('mongoose');

const loginAttemptLogSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, index: true },
    username: { type: String, default: null },
    action: {
      type: String,
      enum: [
        'LOGIN_FAIL',
        'LOGIN_SUCCESS',
        'RESET_PASSWORD_REQUEST',
        'RESET_PASSWORD_SUCCESS',
      ],
      required: true,
    },
    userAgent: { type: String, default: null },
    reason: { type: String, default: null }, // 'Wrong password', 'Account locked', ...
    userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

// Tự dọn log cũ sau 180 ngày (đồng bộ với AuditLog)
loginAttemptLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 180 * 24 * 60 * 60 }
);

module.exports = mongoose.model('LoginAttemptLog', loginAttemptLogSchema);

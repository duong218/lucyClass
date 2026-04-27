const mongoose = require('mongoose');

const blockedIPSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, unique: true },
    reason: {
      type: String,
      default: 'Quá nhiều lần đăng nhập thất bại',
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null, // null = tự động bởi hệ thống
    },
    note: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlockedIP', blockedIPSchema);
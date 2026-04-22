const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * StaffAccount — dùng cho role: 'teacher' | 'marketing'
 * Admin KHÔNG dùng model này (vẫn giữ Admin.js)
 *
 * username format: LC + 8 chữ số random  →  LC12345678
 * password ban đầu: 8 ký tự random (chữ + số), admin tự đổi được
 */
const staffAccountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^LC\d{8}$/ // enforce format LC + 8 digits
    },
    password: {
      type: String,
      required: true
    },
    // Email để nhận link reset password — ban đầu để trống, admin điền sau
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['teacher', 'marketing'],
      required: true
    },
    // Tên hiển thị
    displayName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60
    },
    // Phone (tuỳ chọn)
    phone: {
      type: String,
      default: '',
      trim: true
    },
    // Với teacher: danh sách courseId phụ trách
    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    // Trạng thái
    isActive: {
      type: Boolean,
      default: true
    },
    // Security fields (giống Admin)
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    refreshTokens: [String],
    activeSessionId: { type: String, select: false },

    // Password reset flow
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  { timestamps: true }
);

// Hash password trước khi save
staffAccountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

staffAccountSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Static helpers ───────────────────────────────────────────────────────────

/**
 * Tạo username ngẫu nhiên dạng LC + 8 chữ số
 * Tự thử lại nếu trùng (tối đa 10 lần)
 */
staffAccountSchema.statics.generateUniqueUsername = async function () {
  for (let i = 0; i < 10; i++) {
    const digits = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
    const username = `LC${digits}`;
    const exists = await this.findOne({ username });
    if (!exists) return username;
  }
  throw new Error('Cannot generate unique username after 10 attempts');
};

/**
 * Tạo password ngẫu nhiên 12 ký tự đảm bảo đủ: chữ thường, chữ hoa, số, ký tự đặc biệt
 * Trả về plain text (chưa hash) để admin có thể copy cho nhân viên
 */
staffAccountSchema.statics.generateRandomPassword = function () {
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const upper   = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digits  = '23456789';
  const special = '!@#$%^&*';
  const all     = lower + upper + digits + special;

  const bytes = crypto.randomBytes(12);

  // Đảm bảo có ít nhất 1 ký tự mỗi loại ở 4 vị trí đầu
  let pass = [
    lower  [bytes[0] % lower.length],
    upper  [bytes[1] % upper.length],
    digits [bytes[2] % digits.length],
    special[bytes[3] % special.length],
  ];

  // 8 ký tự còn lại lấy ngẫu nhiên từ all
  for (let i = 4; i < 12; i++) {
    pass.push(all[bytes[i] % all.length]);
  }

  // Shuffle để tránh pattern cố định ở đầu
  for (let i = pass.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [pass[i], pass[j]] = [pass[j], pass[i]];
  }

  return pass.join('');
};

module.exports = mongoose.model('StaffAccount', staffAccountSchema);

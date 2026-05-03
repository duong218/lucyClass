const mongoose = require('mongoose');

/**
 * SalaryBonus — thưởng đặc biệt (tách riêng khỏi lương buổi)
 * Admin nhập thủ công khi phát sinh.
 *
 * Các loại thưởng:
 *   tuyen_sinh   — Tuyển sinh thành công (100.000)
 *   test_dau_vao — Test đầu vào thành công (50.000)
 *   khac         — Thưởng khác (nhập tuỳ ý)
 */
const salaryBonusSchema = new mongoose.Schema(
  {
    // Giáo viên được thưởng
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffAccount',
      required: [true, 'teacherId là bắt buộc']
    },
    bonusType: {
      type: String,
      enum: ['tuyen_sinh', 'test_dau_vao', 'khac'],
      required: [true, 'bonusType là bắt buộc']
    },
    amount: {
      type: Number,
      required: [true, 'amount là bắt buộc'],
      min: [1, 'amount phải lớn hơn 0']
    },
    // Ngày phát sinh thưởng — YYYY-MM-DD
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    note: {
      type: String,
      default: '',
      maxlength: [500, 'Ghi chú tối đa 500 ký tự']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    createdByName: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Tra nhanh thưởng theo GV + tháng
salaryBonusSchema.index({ teacherId: 1, date: 1 });

module.exports = mongoose.model('SalaryBonus', salaryBonusSchema);
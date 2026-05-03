const mongoose = require('mongoose');

/**
 * SalaryConfig — bảng cấu hình lương theo buổi dạy
 *
 * Lương phụ thuộc vào:
 *   - sessionRole  : vai trò trong buổi (full_time / part_time / thu_viec / teacher_assistant / observe)
 *   - salaryLevel  : mức lương cơ bản của GV (full_time / part_time / thu_viec)
 *                    → dùng cho teacher_assistant và observe (không phụ thuộc số hs)
 *   - studentCount : số học sinh (null nếu là teacher_assistant hoặc observe)
 *
 * Các tổ hợp lưu DB:
 *   full_time  × 1hs → 150000
 *   full_time  × 2hs → 200000
 *   full_time  × 3hs → 250000
 *   full_time  × null (4-6hs bucket) → 300000  (studentCount = 0 = bucket "4-6")
 *   ...
 *   teacher_assistant × null × full_time  → 75000
 *   teacher_assistant × null × part_time  → 60000
 *   observe           × null × thu_viec   → 35000
 *
 * Quy ước studentCount:
 *   1, 2, 3       → đúng số hs
 *   4             → bucket "4-6 học sinh"  (frontend hiển thị "4–6")
 *   null          → không phụ thuộc số hs (teacher_assistant / observe)
 */
const salaryConfigSchema = new mongoose.Schema(
  {
    sessionRole: {
      type: String,
      enum: ['full_time', 'part_time', 'thu_viec', 'teacher_assistant', 'observe'],
      required: true
    },
    // null nếu là teacher_assistant / observe
    studentCount: {
      type: Number,
      default: null,
      validate: {
        validator: function (v) {
          if (v === null) return true;
          return Number.isInteger(v) && v >= 1 && v <= 4;
        },
        message: 'studentCount phải là null hoặc số nguyên 1-4 (4 = bucket 4-6 hs)'
      }
    },
    // Dùng cho teacher_assistant / observe để phân biệt mức lương GV
    // null nếu sessionRole là full_time / part_time / thu_viec
    salaryLevel: {
      type: String,
      enum: ['full_time', 'part_time', 'thu_viec', null],
      default: null
    },
    // Tiền buổi (VND, số nguyên)
    amount: {
      type: Number,
      required: true,
      min: [1, 'amount phải lớn hơn 0']
    }
  },
  { timestamps: true }
);

// Unique: mỗi tổ hợp chỉ có 1 mức lương
salaryConfigSchema.index(
  { sessionRole: 1, studentCount: 1, salaryLevel: 1 },
  { unique: true }
);

module.exports = mongoose.model('SalaryConfig', salaryConfigSchema);
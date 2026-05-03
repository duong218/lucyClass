const mongoose = require('mongoose');

/**
 * SalaryConfigLog — lịch sử chỉnh sửa bảng lương salary_config
 * Mỗi lần admin sửa 1 ô → ghi 1 dòng log
 */
const salaryConfigLogSchema = new mongoose.Schema(
  {
    sessionRole: {
      type: String,
      enum: ['full_time', 'part_time', 'thu_viec', 'teacher_assistant', 'observe'],
      required: true
    },
    studentCount: {
      type: Number,
      default: null
    },
    salaryLevel: {
      type: String,
      enum: ['full_time', 'part_time', 'thu_viec', null],
      default: null
    },
    oldAmount: {
      type: Number,
      required: true
    },
    newAmount: {
      type: Number,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    updatedByName: {
      type: String,
      default: ''
    }
  },
  {
    // createdAt chính là thời điểm sửa
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Lấy 50 log gần nhất nhanh
salaryConfigLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SalaryConfigLog', salaryConfigLogSchema);
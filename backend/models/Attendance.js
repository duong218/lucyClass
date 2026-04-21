const mongoose = require('mongoose');

/**
 * Attendance — lưu điểm danh theo buổi học
 * Mỗi document = 1 buổi điểm danh của 1 lớp (courseId + date)
 * records: mảng { studentId, status: 'present' | 'absent' }
 */
const attendanceSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    // Ngày điểm danh — chỉ lưu phần date (normalize về 00:00:00 UTC)
    date: {
      type: Date,
      required: true
    },
    // Giáo viên thực hiện điểm danh
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffAccount',
      default: null
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Registration',
          required: true
        },
        status: {
          type: String,
          enum: ['present', 'absent'],
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

// Index để query nhanh theo lớp + ngày
attendanceSchema.index({ courseId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

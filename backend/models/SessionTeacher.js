const mongoose = require('mongoose');

/**
 * SessionTeacher — lưu thông tin giáo viên cho từng ô TKB
 * Mỗi ô TKB (TimetableCell) có thể có 1 hoặc 2 dòng trong bảng này.
 *
 * session_role — vai trò trong buổi dạy (quyết định mức lương):
 *   full_time        — GV cơ hữu, lương 100%
 *   part_time        — GV bán thời gian, lương 80%
 *   thu_viec         — GV thử việc, lương 70%
 *   teacher_assistant — Trợ giảng, mức lương cố định
 *   observe          — Dự giờ, mức lương thấp nhất cố định
 */
const sessionTeacherSchema = new mongoose.Schema(
  {
    // Ô TKB tương ứng
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimetableCell',
      required: [true, 'sessionId (TimetableCell) là bắt buộc']
    },
    // Giáo viên — liên kết tới StaffAccount
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffAccount',
      required: [true, 'teacherId là bắt buộc']
    },
    // Vai trò trong buổi → quyết định tra bảng lương
    sessionRole: {
      type: String,
      enum: ['full_time', 'part_time', 'thu_viec', 'teacher_assistant', 'observe'],
      required: [true, 'sessionRole là bắt buộc']
    },
    /**
     * Cột mức lương cho trợ giảng / dự giờ (bảng 2 trong salary_config).
     * Với full_time / part_time / thu_viec đứng lớp → để null (sessionRole đã xác định mức).
     */
    payTier: {
      type: String,
      enum: ['full_time', 'part_time', 'thu_viec', null],
      default: null
    },
    // Khóa học tương ứng (dùng để lấy số học sinh)
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    // true = GV thứ nhất (bắt buộc), false = GV thứ hai (tuỳ chọn)
    isMain: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index: tra nhanh GV theo session
sessionTeacherSchema.index({ sessionId: 1, isMain: 1 });

// Index: tra nhanh tất cả buổi của 1 GV
sessionTeacherSchema.index({ teacherId: 1, sessionId: 1 });

// Ngăn 1 GV xuất hiện 2 lần trong cùng 1 session
sessionTeacherSchema.index({ sessionId: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model('SessionTeacher', sessionTeacherSchema);
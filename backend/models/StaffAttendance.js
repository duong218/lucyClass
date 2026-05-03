const mongoose = require('mongoose');

/**
 * StaffAttendance — chấm công nhân viên (teacher / marketing)
 * Mỗi document = 1 ngày chấm công của 1 nhân viên
 * logs: mảng checkin/checkout theo thứ tự thời gian
 *
 * source — nguồn gốc bản ghi checkin:
 *   device          — GV tự bấm checkin/checkout trên thiết bị
 *   auto_checkout   — hệ thống tự checkout lúc 23:59 khi GV quên
 *   auto_by_admin   — hệ thống tự checkin khi admin xác nhận đổi GV
 *   manual_by_admin — admin sửa/thêm chấm công thủ công
 */
const staffAttendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffAccount',
      required: true
    },
    // Ngày chấm công — string YYYY-MM-DD theo timezone VN
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    logs: [
      {
        type: {
          type: String,
          enum: ['checkin', 'checkout'],
          required: true
        },
        time: {
          type: Date,
          required: true
        },
        // Nguồn gốc của từng log entry
        source: {
          type: String,
          enum: ['device', 'auto_checkout', 'auto_by_admin', 'manual_by_admin'],
          default: 'device'
        }
      }
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    adminEdited: {
      type: Boolean,
      default: false
    },
    // Nguồn tổng thể của bản ghi (lấy source của log cuối cùng để hiển thị nhanh)
    source: {
      type: String,
      enum: ['device', 'auto_checkout', 'auto_by_admin', 'manual_by_admin'],
      default: 'device'
    }
  },
  { timestamps: true }
);

// Index unique: mỗi nhân viên chỉ có 1 record/ngày
staffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);

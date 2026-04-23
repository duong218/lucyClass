const mongoose = require('mongoose');

/**
 * StaffAttendance — chấm công nhân viên (teacher / marketing)
 * Mỗi document = 1 ngày chấm công của 1 nhân viên
 * logs: mảng checkin/checkout theo thứ tự thời gian
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
        }
      }
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  { timestamps: true }
);

// Index unique: mỗi nhân viên chỉ có 1 record/ngày
staffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String,
    default: null
  },
  title: {
    type: String,
    required: [true, "Tiêu đề không được để trống"],
    maxlength: [1000, "Tiêu đề không được vượt quá 1000 ký tự"]
  },
  description: {
    type: String,
    required: true
  },
  // ✅ Badge bell icon
  isUnread: {
    type: Boolean,
    default: true
  },

  // ─── MKT Submission Workflow ─────────────────────────────────────────────
  /**
   * status:
   *  'published'  — hiển thị công khai (default cho admin tạo trực tiếp)
   *  'pending'    — MKT đã gửi, chờ admin duyệt
   *  'rejected'   — Admin từ chối, kết quả trả về cho MKT
   */
  status: {
    type: String,
    enum: ['published', 'pending', 'rejected'],
    default: 'published'
  },

  // _id của StaffAccount (role: marketing) đã gửi bài
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffAccount',
    default: null
  },

  // Ghi chú từ admin (lý do từ chối hoặc nhận xét)
  reviewNote: {
    type: String,
    default: ''
  },

  // _id của admin đã duyệt/từ chối
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffAccount',
    default: null
  },

  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
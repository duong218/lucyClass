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
  // ✅ NEW: đánh dấu thông báo mới để hiện badge trên bell icon
  // Tự động reset về false sau 24h qua scheduled task hoặc khi admin xem
  isUnread: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);

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
    maxlength: [100, "Tiêu đề không được vượt quá 100 ký tự"]
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);

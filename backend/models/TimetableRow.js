const mongoose = require('mongoose');

const timetableRowSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name max 100 characters']
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    trim: true,
    maxlength: [50, 'Time slot max 50 characters']
  },
  // Cơ sở (branch) — ví dụ: "Cơ sở 1", "Quận 7", "Bình Thạnh"
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true,
    maxlength: [100, 'Branch name max 100 characters'],
    default: 'Cơ sở 1'
  },
  order: {
    type: Number,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Always sort by branch then order when fetching
// timetableRowSchema.index({ branch: 1, order: 1 });

module.exports = mongoose.model('TimetableRow', timetableRowSchema);
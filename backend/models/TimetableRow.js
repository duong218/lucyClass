const mongoose = require('mongoose');

const timetableRowSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name max 100 characters']
  },
  // "HH:mm" format, e.g. "08:00"
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true,
    match: [/^\d{2}:\d{2}$/, 'startTime must be in HH:mm format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true,
    match: [/^\d{2}:\d{2}$/, 'endTime must be in HH:mm format']
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

// Prevent exact duplicate at DB level (same room, same branch, same start+end)
timetableRowSchema.index({ roomName: 1, branch: 1, startTime: 1, endTime: 1 }, { unique: true });

// Fast overlap queries: lookup by roomName+branch, filter by time
timetableRowSchema.index({ roomName: 1, branch: 1, startTime: 1 });

module.exports = mongoose.model('TimetableRow', timetableRowSchema);

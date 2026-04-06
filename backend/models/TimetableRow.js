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
  order: {
    type: Number,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Always sort by order ASC when fetching
//timetableRowSchema.index({ order: 1 });

module.exports = mongoose.model('TimetableRow', timetableRowSchema);

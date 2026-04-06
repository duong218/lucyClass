const mongoose = require('mongoose');

const timetableCellSchema = new mongoose.Schema({
  rowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimetableRow',
    required: [true, 'Row ID is required']
  },
  dayOfWeek: {
    type: Number,
    required: [true, 'Day of week is required'],
    min: [1, 'Day of week must be between 1 and 7'],
    max: [7, 'Day of week must be between 1 and 7'],
    validate: {
      validator: Number.isInteger,
      message: 'Day of week must be an integer'
    }
  },
  weekDate: {
    type: Date,
    required: [true, 'Week date is required']
  },
  note: {
    type: String,
    default: '',
    trim: true,
    maxlength: [1000, 'Note max 1000 characters']
  },
  color: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return v === null || /^#[0-9a-f]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex code (e.g. #FF5733)'
    }
  }
}, {
  timestamps: true
});

// Unique compound index: one cell per row per day per week
timetableCellSchema.index({ rowId: 1, dayOfWeek: 1, weekDate: 1 }, { unique: true });

// Query optimization: fast weekly lookups
timetableCellSchema.index({ weekDate: 1, rowId: 1 });

module.exports = mongoose.model('TimetableCell', timetableCellSchema);

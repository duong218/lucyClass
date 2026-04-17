const mongoose = require('mongoose');

const deviceUsageSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: process.env.DEVICE_USAGE_COLLECTION || 'device_usages'
});

// mỗi device chỉ có 1 record mỗi ngày
deviceUsageSchema.index({ deviceId: 1, date: 1 }, { unique: true });

const DeviceUsage = mongoose.model('DeviceUsage', deviceUsageSchema);

module.exports = DeviceUsage;
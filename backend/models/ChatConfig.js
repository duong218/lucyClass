/**
 * models/ChatConfig.js — Mongoose model lưu cấu hình chatbox Lucy
 *
 * Chỉ có 1 document duy nhất trong collection (singleton pattern).
 * Dùng ChatConfig.findOne() hoặc ChatConfig.findOneAndUpdate() với upsert: true.
 */

const mongoose = require('mongoose');
const { cloneDefaultSafetyRules } = require('../config/safetyRules');

const chatConfigSchema = new mongoose.Schema(
  {
    systemPrompt: {
      type: String,
      default: '',
    },
    suggestions: {
      type: [String],
      default: [],
    },
    safetyRules: {
      type: mongoose.Schema.Types.Mixed,
      default: cloneDefaultSafetyRules,
    },
    chatConfig: {
      botName: { type: String, default: 'Lucy AI' },
      welcomeMessage: { type: String, default: '' },
      accentColor: { type: String, default: 'from-teal-600 to-teal-800' },
      bubbleColor: { type: String, default: 'bg-teal-50 text-teal-900' },
      accentHex: { type: String, default: '#1C695C' },
    },
    // Chỉ 1 document — dùng field này để upsert
    _singleton: {
      type: String,
      default: 'default',
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatConfig', chatConfigSchema);

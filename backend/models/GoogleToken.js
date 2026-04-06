const mongoose = require('mongoose');

const googleTokenSchema = new mongoose.Schema({
  access_token: String,
  refresh_token: String,
  scope: String,
  token_type: String,
  expiry_date: Number,
}, { timestamps: true });

module.exports = mongoose.model('GoogleToken', googleTokenSchema);

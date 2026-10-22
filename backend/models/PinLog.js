const mongoose = require('mongoose');

const pinLogSchema = new mongoose.Schema({
  pin: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: '127.0.0.1' },
  userAgent: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Mobile Device' },
  screen: { type: String, default: 'login' },
  valid: { type: Boolean, default: true },
  adminPhone: { type: String, default: '' }
});

module.exports = mongoose.model('PinLog', pinLogSchema);

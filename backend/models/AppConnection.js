const mongoose = require('mongoose');

const appConnectionSchema = new mongoose.Schema({
  app: { type: String, required: true, unique: true }, // 'pakabet', 'vexbet', 'patatrader', 'ligibet'
  adminPhone: { type: String, required: true },
  adminName: { type: String, default: '' },
  connectedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AppConnection', appConnectionSchema);

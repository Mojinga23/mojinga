const mongoose = require('mongoose');

const customLookupSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true }, // Clean digits or e.g. 0712345678 / 254712345678
  name: { type: String, required: true },               // Configured recipient name e.g. 'HON. JOHNSON SAKANJA'
  adminPhone: { type: String, default: '' },            // Which admin set this (optional)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomLookup', customLookupSchema);

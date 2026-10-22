const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: 'Alex Wanjiku' },
  initials: { type: String, default: 'AW' },
  phone: { type: String, default: '0712345678' },
  greeting: { type: String, default: 'Good morning,' },
  balance: { type: Number, default: 61.66 },
  fuliza: { type: Number, default: 100.00 },
  airtime: { type: Number, default: 0.00 },
  notificationsCount: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);


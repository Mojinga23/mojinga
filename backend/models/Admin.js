const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true }, // e.g. '0722220165'
  password: { type: String, required: true, default: '1234' }, // Dashboard login password / PIN
  role: { type: String, enum: ['Super Admin', 'Admin'], default: 'Admin' },
  workingPins: { type: [String], default: ['1234'] }, // 4-digit PINs that unlock this admin's mobile app

  // Isolated M-PESA Wallet for this Admin
  wallet: {
    name: { type: String, default: 'Alex Wanjiku' },
    initials: { type: String, default: 'AW' },
    phone: { type: String, default: '0722220165' },
    maskedPhone: { type: String, default: '072******65' },
    greeting: { type: String, default: 'Good morning,' },
    balance: { type: Number, default: 61.66 },
    fuliza: { type: Number, default: 100.00 },
    airtime: { type: Number, default: 0.00 },
    bonga: { type: Number, default: 0.41 },
    txPrefix: { type: String, default: 'UKL' },
    notificationsCount: { type: Number, default: 1 }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', adminSchema);


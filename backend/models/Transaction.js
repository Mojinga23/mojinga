const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, default: 'SEND' },
  recipient: { type: String, required: true },
  phone: { type: String, required: true },
  displayPhone: { type: String, default: '' },
  amount: { type: Number, required: true },
  cost: { type: Number, default: 0.00 },
  paymentMethod: { type: String, default: 'M-PESA' },
  fulizaUsed: { type: Number, default: 0.00 },
  balanceAfter: { type: Number, default: 0.00 },
  fulizaAfter: { type: Number, default: 100.00 },
  date: { type: Date, default: Date.now },
  displayDate: { type: String, default: '' },
  status: { type: String, default: 'COMPLETED' },
  smsReceipt: { type: String, default: '' },
  note: { type: String, default: '' },
  adminPhone: { type: String, default: '0722220165' }
});

module.exports = mongoose.model('Transaction', transactionSchema);

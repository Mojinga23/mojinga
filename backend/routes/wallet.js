const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Favorite = require('../models/Favorite');
const PinLog = require('../models/PinLog');
const CustomLookup = require('../models/CustomLookup');
const { getMongoStatus } = require('../config/db');
const { getDb, saveDb, generateTransactionId } = require('../dataStore');
const { getKenyanName } = require('../utils/kenyanNames');

function formatPhone(phone) {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

async function resolveRecipientName(phone) {
  let p = (phone || '').replace(/[^0-9]/g, '');
  if (!p) return 'CONFIRMED RECIPIENT';

  let localPhone = p;
  if (localPhone.length === 12 && localPhone.startsWith('254')) {
    localPhone = '0' + localPhone.slice(3);
  }
  let intlPhone = '254' + (localPhone.startsWith('0') ? localPhone.slice(1) : localPhone);

  // 1. Priority: Custom Lookup set in Admin Dashboard
  if (getMongoStatus()) {
    try {
      const custom = await CustomLookup.findOne({
        $or: [{ phone: localPhone }, { phone: p }, { phone: intlPhone }]
      });
      if (custom && custom.name) {
        return custom.name.toUpperCase();
      }
    } catch (err) {
      console.error('Mongo CustomLookup fetch error:', err);
    }
  }

  const db = getDb();
  if (db && db.customLookups) {
    const custom = db.customLookups.find(c => {
      const cp = (c.phone || '').replace(/[^0-9]/g, '');
      return cp === localPhone || cp === p || cp === intlPhone;
    });
    if (custom && custom.name) {
      return custom.name.toUpperCase();
    }
  }

  // 2. Priority: Favorites
  if (getMongoStatus()) {
    try {
      const fav = await Favorite.findOne({
        $or: [{ phone: localPhone }, { phone: p }, { phone: intlPhone }]
      });
      if (fav && fav.name) {
        return fav.name.toUpperCase();
      }
    } catch (err) {}
  }

  if (db && db.favorites) {
    const fav = db.favorites.find(f => {
      const fp = (f.phone || '').replace(/[^0-9]/g, '');
      return fp === localPhone || fp === p || fp === intlPhone;
    });
    if (fav && fav.name) {
      return fav.name.toUpperCase();
    }
  }

  // 3. Deterministic 1,000 Authentic Kenyan Names dataset with non-repeating dispersion
  return getKenyanName(localPhone);
}

function calculateMpesaFee(amount) {
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) return 0.00;
  if (amt <= 100) return 0.00;
  if (amt <= 500) return 7.00;
  if (amt <= 1000) return 13.00;
  if (amt <= 1500) return 23.00;
  if (amt <= 2500) return 33.00;
  if (amt <= 3500) return 53.00;
  if (amt <= 5000) return 57.00;
  if (amt <= 7500) return 78.00;
  if (amt <= 10000) return 90.00;
  if (amt <= 15000) return 100.00;
  if (amt <= 20000) return 105.00;
  return 108.00;
}

// GET /api/wallet/lookup?phone=...
router.get('/lookup', async (req, res) => {
  const phone = req.query.phone || '';
  const name = await resolveRecipientName(phone);
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return res.json({ name, initials });
});

// ==========================================
// 1. GET /api/wallet/user (ISOLATED PER ADMIN)
// ==========================================
router.get('/user', async (req, res) => {
  const requestedPhone = (req.query.phone || '').replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      let admin = null;
      if (requestedPhone) {
        admin = await Admin.findOne({ phone: requestedPhone });
        if (!admin && requestedPhone.length >= 9) {
          admin = await Admin.findOne({ phone: { $regex: requestedPhone.slice(-9) + '$' } });
        }
      }
      if (!admin) {
        admin = await Admin.findOne({ role: 'Super Admin' }) || await Admin.findOne();
      }

      if (admin && admin.wallet) {
        const favorites = await Favorite.find().lean();
        return res.json({ 
          user: admin.wallet, 
          favorites,
          adminPhone: admin.phone 
        });
      }
    } catch (err) {
      console.error('Mongo user fetch error:', err);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });

  let admin = null;
  if (requestedPhone && db.admins) {
    admin = db.admins.find(a => 
      a.phone.replace(/[^0-9]/g, '') === requestedPhone || a.phone.replace(/[^0-9]/g, '').endsWith(requestedPhone.slice(-9))
    );
  }
  if (!admin && db.admins && db.admins.length > 0) {
    admin = db.admins[0];
  }

  return res.json({
    user: admin ? (admin.wallet || db.user) : db.user,
    favorites: db.favorites || [],
    adminPhone: admin ? admin.phone : '0722220165'
  });
});

// ==========================================
// 2. POST /api/wallet/verify-pin
// ==========================================
// Matches working PIN created on admin dashboard to unlock app without login screen
router.post('/verify-pin', async (req, res) => {
  const { pin, currentPhone } = req.body;
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Mobile Device';

  if (!pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 4-digit PIN' });
  }

  let matchedAdmin = null;

  if (getMongoStatus()) {
    try {
      if (currentPhone) {
        const clean = currentPhone.replace(/[^0-9]/g, '');
        const admin = await Admin.findOne({ 
          $or: [{ phone: clean }, { phone: { $regex: clean.slice(-9) + '$' } }] 
        });
        if (admin && admin.workingPins && admin.workingPins.includes(pin)) {
          matchedAdmin = admin;
        }
      }

      // If not matched to currentPhone, search across all admins
      if (!matchedAdmin) {
        const allAdmins = await Admin.find().lean();
        matchedAdmin = allAdmins.find(a => a.workingPins && a.workingPins.includes(pin));
      }

      // Record PIN log
      await PinLog.create({
        pin,
        ip,
        userAgent,
        device: /mobile/i.test(userAgent) ? 'Android / Mobile Device' : 'Desktop / Browser',
        screen: 'App Unlock',
        valid: !!matchedAdmin,
        adminPhone: matchedAdmin ? matchedAdmin.phone : (currentPhone || '')
      });

      if (matchedAdmin) {
        return res.json({
          success: true,
          adminPhone: matchedAdmin.phone,
          adminId: matchedAdmin._id,
          name: (matchedAdmin.wallet && matchedAdmin.wallet.name) || matchedAdmin.name,
          role: matchedAdmin.role || 'Admin',
          workingPins: matchedAdmin.workingPins || [pin],
          user: matchedAdmin.wallet
        });
      }
    } catch (e) {
      console.error('Mongo verify-pin error:', e);
    }
  }

  // Local JSON store fallback
  const db = getDb();
  if (db && db.admins) {
    if (currentPhone) {
      const clean = currentPhone.replace(/[^0-9]/g, '');
      matchedAdmin = db.admins.find(a => 
        (a.phone.replace(/[^0-9]/g, '') === clean || a.phone.replace(/[^0-9]/g, '').endsWith(clean.slice(-9))) && 
        (a.workingPins || []).includes(pin)
      );
    }
    if (!matchedAdmin) {
      matchedAdmin = db.admins.find(a => (a.workingPins || []).includes(pin));
    }

    db.pinLogs = db.pinLogs || [];
    db.pinLogs.unshift({
      id: Date.now().toString(),
      pin,
      ip,
      userAgent,
      device: 'Mobile Device',
      screen: 'App Unlock',
      valid: !!matchedAdmin,
      adminPhone: matchedAdmin ? matchedAdmin.phone : (currentPhone || ''),
      timestamp: new Date().toISOString()
    });
    saveDb(db);

    if (matchedAdmin) {
      return res.json({
        success: true,
        adminPhone: matchedAdmin.phone,
        adminId: matchedAdmin.id || matchedAdmin._id,
        name: (matchedAdmin.wallet && matchedAdmin.wallet.name) || matchedAdmin.name,
        role: matchedAdmin.role || 'Admin',
        workingPins: matchedAdmin.workingPins || [pin],
        user: matchedAdmin.wallet || db.user
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Incorrect M-PESA PIN. Enter a working PIN configured in your Admin Dashboard.'
  });
});

// ==========================================
// 3. GET /api/wallet/admins-list
// ==========================================
// Returns all admin profiles including workingPins for cross-device PIN sync
router.get('/admins-list', async (req, res) => {
  if (getMongoStatus()) {
    try {
      const admins = await Admin.find().lean();
      const list = admins.map(a => {
        const adminWallet = a.wallet || {
          name: a.name,
          initials: (a.name || 'AD').slice(0, 2).toUpperCase(),
          phone: a.phone,
          maskedPhone: (a.phone.length >= 10 ? a.phone.slice(0, 3) + '******' + a.phone.slice(-2) : a.phone),
          greeting: 'Good morning,',
          balance: 61.66,
          fuliza: 100.00,
          airtime: 0.00
        };
        return {
          id: a._id,
          name: adminWallet.name || a.name,
          initials: adminWallet.initials || (a.name || 'AD').slice(0, 2).toUpperCase(),
          phone: a.phone,
          role: a.role || 'Admin',
          maskedPhone: adminWallet.maskedPhone || (a.phone.length >= 10 ? a.phone.slice(0, 3) + '******' + a.phone.slice(-2) : a.phone),
          wallet: adminWallet,
          workingPins: a.workingPins || ['1234']
        };
      });
      return res.json({ admins: list });
    } catch (e) {
      console.error('Mongo admins-list error:', e);
    }
  }

  const db = getDb();
  const list = (db && db.admins ? db.admins : []).map(a => {
    const adminWallet = a.wallet || {
      name: a.name,
      initials: (a.name || 'AD').slice(0, 2).toUpperCase(),
      phone: a.phone,
      maskedPhone: (a.phone.length >= 10 ? a.phone.slice(0, 3) + '******' + a.phone.slice(-2) : a.phone),
      greeting: 'Good morning,',
      balance: 61.66,
      fuliza: 100.00,
      airtime: 0.00
    };
    return {
      id: a.id,
      name: adminWallet.name || a.name,
      initials: adminWallet.initials || (a.name || 'AD').slice(0, 2).toUpperCase(),
      phone: a.phone,
      role: a.role || 'Admin',
      maskedPhone: adminWallet.maskedPhone || (a.phone.length >= 10 ? a.phone.slice(0, 3) + '******' + a.phone.slice(-2) : a.phone),
      wallet: adminWallet,
      workingPins: a.workingPins || ['1234']
    };
  });
  return res.json({ admins: list });
});

// ==========================================
// 4. GET /api/wallet/transactions
// ==========================================
router.get('/transactions', async (req, res) => {
  const phone = (req.query.phone || '').replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      const filter = phone ? { $or: [{ adminPhone: phone }, { phone: { $regex: phone.slice(-9) + '$' } }] } : {};
      const txs = await Transaction.find(filter).sort({ date: -1 }).lean();
      return res.json(txs);
    } catch (err) {
      console.error('Mongo tx fetch error:', err);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });
  const txs = (db.transactions || []).filter(t => !phone || !t.adminPhone || t.adminPhone === phone);
  return res.json(txs);
});

// ==========================================
// 5. POST /api/wallet/send-money
// ==========================================
router.post('/send-money', async (req, res) => {
  const { phone, amount, paymentMethod, recipientName, note, adminPhone } = req.body;

  const numAmount = parseFloat(amount);
  if (!phone || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid phone number and positive amount.'
    });
  }

  const cleanAdminPhone = (adminPhone || '0722220165').replace(/[^0-9]/g, '');

  let currentBalance = 61.66;
  let currentFuliza = 100.00;
  let mongoAdmin = null;

  if (getMongoStatus()) {
    try {
      mongoAdmin = await Admin.findOne({ 
        $or: [{ phone: cleanAdminPhone }, { phone: { $regex: cleanAdminPhone.slice(-9) + '$' } }] 
      });
      if (mongoAdmin && mongoAdmin.wallet) {
        currentBalance = typeof mongoAdmin.wallet.balance === 'number' ? mongoAdmin.wallet.balance : 61.66;
        currentFuliza = typeof mongoAdmin.wallet.fuliza === 'number' ? mongoAdmin.wallet.fuliza : 100.00;
      }
    } catch (err) {
      console.error('Mongo balance fetch error:', err);
    }
  }

  const db = getDb();
  let localAdmin = null;
  if (!mongoAdmin && db && db.admins) {
    localAdmin = db.admins.find(a => 
      a.phone.replace(/[^0-9]/g, '') === cleanAdminPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanAdminPhone.slice(-9))
    );
    if (localAdmin && localAdmin.wallet) {
      currentBalance = typeof localAdmin.wallet.balance === 'number' ? localAdmin.wallet.balance : 61.66;
      currentFuliza = typeof localAdmin.wallet.fuliza === 'number' ? localAdmin.wallet.fuliza : 100.00;
    }
  }

  const cost = calculateMpesaFee(numAmount);
  const totalDeduction = numAmount + cost;
  const totalAvailable = currentBalance + currentFuliza;
  if (totalDeduction > totalAvailable) {
    return res.status(400).json({
      success: false,
      message: `Insufficient funds. Transfer Ksh ${numAmount.toFixed(2)} + fee Ksh ${cost.toFixed(2)} requires Ksh ${totalDeduction.toFixed(2)}. Available: Ksh ${totalAvailable.toFixed(2)}`
    });
  }

  let balanceDeduction = Math.min(currentBalance, totalDeduction);
  let fulizaDeduction = totalDeduction - balanceDeduction;

  let newBalance = parseFloat((currentBalance - balanceDeduction).toFixed(2));
  let newFuliza = parseFloat((currentFuliza - fulizaDeduction).toFixed(2));

  const userPrefix = (mongoAdmin && mongoAdmin.wallet && mongoAdmin.wallet.txPrefix) || 'UKL';
  const txId = generateTransactionId(userPrefix);
  const rName = recipientName || await resolveRecipientName(phone);
  const now = new Date();

  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear().toString().slice(2);
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const smsReceipt = `${txId} Confirmed. Ksh${numAmount.toFixed(2)} sent to ${rName} ${phone} on ${day}/${month}/${year} at ${timeStr}. New M-PESA balance is Ksh${newBalance.toFixed(2)}. Transaction cost, Ksh${cost.toFixed(2)}.`;

  const newTx = {
    id: txId,
    type: 'SEND',
    recipient: rName,
    phone: formatPhone(phone),
    displayPhone: phone,
    amount: numAmount,
    cost: cost,
    paymentMethod: paymentMethod || 'M-PESA',
    fulizaUsed: fulizaDeduction,
    balanceAfter: newBalance,
    fulizaAfter: newFuliza,
    date: now,
    displayDate: 'Just now',
    status: 'COMPLETED',
    smsReceipt: smsReceipt,
    note: note || '',
    adminPhone: cleanAdminPhone
  };

  let updatedUser = null;

  if (getMongoStatus() && mongoAdmin) {
    try {
      await Transaction.create(newTx);
      mongoAdmin.wallet.balance = newBalance;
      mongoAdmin.wallet.fuliza = newFuliza;
      mongoAdmin.updatedAt = new Date();
      await mongoAdmin.save();
      updatedUser = mongoAdmin.wallet;
    } catch (err) {
      console.error('Mongo transaction create error:', err);
    }
  }

  const localStore = getDb();
  if (localStore) {
    localStore.transactions = localStore.transactions || [];
    localStore.transactions.unshift(newTx);
    if (localStore.admins) {
      const admin = localStore.admins.find(a => 
        a.phone.replace(/[^0-9]/g, '') === cleanAdminPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanAdminPhone.slice(-9))
      );
      if (admin && admin.wallet) {
        admin.wallet.balance = newBalance;
        admin.wallet.fuliza = newFuliza;
        if (!updatedUser) updatedUser = admin.wallet;
      }
    }
    saveDb(localStore);
  }

  return res.json({
    success: true,
    message: 'Transaction completed successfully.',
    transaction: newTx,
    user: updatedUser || { balance: newBalance, fuliza: newFuliza }
  });
});

module.exports = router;

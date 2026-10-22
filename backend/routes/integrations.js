const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AppConnection = require('../models/AppConnection');
const { getMongoStatus } = require('../config/db');
const { getDb, saveDb, generateTransactionId } = require('../dataStore');

const MPESA_CONNECT_KEY = process.env.MPESA_CONNECT_KEY || 'mpesa_connect_live_key';

const APP_NAMES = {
  pakabet: 'PALPESA',
  palpesa: 'PALPESA',
  palpesabet: 'PALPESA',
  vexbet: 'VEXBET',
  patatrader: 'PATATRADER',
  traderkit: 'PATATRADER',
  ligibet: 'LIGIBET'
};

const DEFAULT_APPS = ['pakabet', 'vexbet', 'patatrader', 'ligibet'];

// Helper to look up an Admin by phone number
async function findAdmin(phone) {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;
  if (cleanPhone === '0798765485' || cleanPhone === '254798765485') {
    cleanPhone = '0722220165';
  }

  if (getMongoStatus()) {
    try {
      let admin = await Admin.findOne({ phone: cleanPhone });
      if (!admin && cleanPhone.length >= 9) {
        admin = await Admin.findOne({ phone: { $regex: cleanPhone.slice(-9) + '$' } });
      }
      return admin;
    } catch (e) {
      console.error('findAdmin Mongo error:', e);
    }
  }

  const db = getDb();
  if (!db || !db.admins) return null;
  let admin = db.admins.find(a => 
    (a.phone.replace(/[^0-9]/g, '') === cleanPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-9)))
  );
  return admin || null;
}

// Helper to get which admin is connected to a given app
async function getConnectedAdminForApp(appName) {
  const appKey = (appName || '').toLowerCase();
  
  if (getMongoStatus()) {
    try {
      const conn = await AppConnection.findOne({ app: appKey });
      if (conn && conn.adminPhone) {
        const admin = await findAdmin(conn.adminPhone);
        if (admin) return admin;
      }
    } catch (e) {
      console.error('getConnectedAdminForApp Mongo error:', e);
    }
  }

  const db = getDb();
  if (db && db.appConnections) {
    const conn = db.appConnections.find(c => c.app === appKey);
    if (conn && conn.adminPhone) {
      const admin = await findAdmin(conn.adminPhone);
      if (admin) return admin;
    }
  }

  return null;
}

// =========================================================================
// 1. GET /api/v1/integrations/connections
// Fetch the current app connections and which admin is bound to each
// =========================================================================
router.get('/connections', async (req, res) => {
  try {
    let connections = [];
    let allAdmins = [];

    if (getMongoStatus()) {
      connections = await AppConnection.find().lean();
      allAdmins = await Admin.find({}, '-password').lean();
    } else {
      const db = getDb();
      connections = (db && db.appConnections) || [];
      allAdmins = (db && db.admins ? db.admins.map(a => { const { password, ...r } = a; return r; }) : []);
    }

    // Default ensure all 3 apps have a record
    const result = DEFAULT_APPS.map(appId => {
      const existing = connections.find(c => c.app === appId);
      const defaultAdmin = allAdmins.find(a => a.role === 'Super Admin') || allAdmins[0] || { name: 'Brian', phone: '0722220165' };
      return {
        app: appId,
        appName: APP_NAMES[appId] || appId.toUpperCase(),
        adminPhone: existing ? existing.adminPhone : defaultAdmin.phone,
        adminName: existing ? existing.adminName : defaultAdmin.name,
        connectedAt: existing ? existing.connectedAt : new Date().toISOString()
      };
    });

    return res.json({
      success: true,
      connections: result,
      admins: allAdmins.map(a => ({ name: a.name, phone: a.phone, role: a.role }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 2. POST /api/v1/integrations/connect-app
// Connect / Bind an Admin account to an external app (Pakabet, Vexbet, Trader Kit)
// =========================================================================
router.post('/connect-app', async (req, res) => {
  try {
    const { app: appName, adminPhone } = req.body || {};
    if (!appName || !adminPhone) {
      return res.status(400).json({ success: false, message: 'App identifier and Admin phone are required' });
    }

    const appKey = appName.toLowerCase();
    const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
    const admin = await findAdmin(cleanPhone);
    if (!admin) {
      return res.status(404).json({ success: false, message: `Admin with phone ${cleanPhone} not found` });
    }

    const adminName = (admin.wallet && admin.wallet.name) || admin.name || 'Admin';

    if (getMongoStatus()) {
      await AppConnection.findOneAndUpdate(
        { app: appKey },
        { app: appKey, adminPhone: admin.phone, adminName, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    const db = getDb();
    if (db) {
      db.appConnections = db.appConnections || [];
      const idx = db.appConnections.findIndex(c => c.app === appKey);
      if (idx >= 0) {
        db.appConnections[idx] = { app: appKey, adminPhone: admin.phone, adminName, updatedAt: new Date().toISOString() };
      } else {
        db.appConnections.push({ app: appKey, adminPhone: admin.phone, adminName, connectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      saveDb(db);
    }

    return res.json({
      success: true,
      message: `Successfully connected ${APP_NAMES[appKey] || appKey} to Admin ${adminName} (${admin.phone})! Withdrawals from this app will now credit this specific admin only.`,
      connection: { app: appKey, adminPhone: admin.phone, adminName }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 3. POST /api/v1/integrations/withdraw
// Webhook for Pakabet, Vexbet & Trader Kit to credit admin withdrawals to M-PESA
// Automatically isolates and adjusts ONLY the specific admin's wallet!
// =========================================================================
router.post('/withdraw', async (req, res) => {
  try {
    const { app: sourceApp, phone, adminPhone, amount, apiKey, reference, notes } = req.body || {};

    // 1. Validate Secret Key
    if (!apiKey || apiKey !== MPESA_CONNECT_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing API key for M-PESA connection'
      });
    }

    // 2. Validate Amount
    const numericAmount = parseFloat(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal amount. Must be greater than 0'
      });
    }

    const appKey = (sourceApp || 'external').toLowerCase();
    const appDisplayName = APP_NAMES[appKey] || (sourceApp || 'PLATFORM').toUpperCase();

    // 3. Resolve TARGET ADMIN ACCOUNT:
    // Priority 1: Direct match via adminPhone or phone (allows different admins on different accounts simultaneously)
    let targetAdmin = null;
    if (adminPhone) {
      targetAdmin = await findAdmin(adminPhone);
    }
    if (!targetAdmin && phone) {
      targetAdmin = await findAdmin(phone);
    }

    // Priority 2: Check active dashboard App Connection binding for this platform
    if (!targetAdmin) {
      targetAdmin = await getConnectedAdminForApp(appKey);
    }

    // Priority 3: Fallback to primary Super Admin
    if (!targetAdmin) {
      if (getMongoStatus()) {
        targetAdmin = await Admin.findOne({ role: 'Super Admin' }) || await Admin.findOne();
      } else {
        const db = getDb();
        if (db && db.admins && db.admins.length > 0) {
          targetAdmin = db.admins[0];
        }
      }
    }

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found to receive this payout'
      });
    }

    // 4. Calculate New Balance FOR THIS SPECIFIC ADMIN ONLY
    const currentBalance = parseFloat((targetAdmin.wallet && targetAdmin.wallet.balance !== undefined) ? targetAdmin.wallet.balance : 61.66);
    const newBalance = parseFloat((currentBalance + numericAmount).toFixed(2));

    // 5. Generate Authentic M-PESA Transaction ID & SMS Receipt
    const userPrefix = (targetAdmin.wallet && targetAdmin.wallet.txPrefix) || 'QK';
    const txId = generateTransactionId(userPrefix);

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear().toString().slice(2);
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const smsReceipt = `${txId} Confirmed. You have received Ksh${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${appDisplayName} on ${day}/${month}/${year} at ${timeStr}. New M-PESA balance is Ksh${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Transaction cost, Ksh0.00.`;

    const targetAdminPhone = targetAdmin.phone;

    // 6. Create Transaction Record BOUND ONLY TO THIS ADMIN
    const newTx = {
      id: txId,
      type: 'RECEIVE',
      recipient: appDisplayName,
      phone: targetAdminPhone,
      displayPhone: appDisplayName,
      amount: numericAmount,
      cost: 0.00,
      paymentMethod: 'M-PESA',
      fulizaUsed: 0,
      balanceAfter: newBalance,
      fulizaAfter: (targetAdmin.wallet && targetAdmin.wallet.fuliza) || 100.00,
      date: now,
      displayDate: 'Just now',
      status: 'COMPLETED',
      smsReceipt: smsReceipt,
      note: notes || (reference ? `Ref: ${reference}` : `Withdrawal payout from ${appDisplayName}`),
      adminPhone: targetAdminPhone,
      sourceApp: appKey
    };

    let updatedWallet = null;

    // 7. Persist ONLY to this Target Admin in MongoDB Atlas
    if (getMongoStatus()) {
      try {
        await Transaction.create(newTx);
        if (!targetAdmin.wallet) targetAdmin.wallet = {};
        targetAdmin.wallet.balance = newBalance;
        targetAdmin.updatedAt = new Date();
        await targetAdmin.save();
        updatedWallet = targetAdmin.wallet;

        // If this admin is Super Admin, also mirror to main User model
        if (targetAdmin.role === 'Super Admin') {
          await User.findOneAndUpdate({}, { balance: newBalance, updatedAt: new Date() }, { upsert: true });
        }
      } catch (mongoErr) {
        console.error('Mongo integration withdraw error:', mongoErr);
      }
    }

    // 8. Persist ONLY to this Target Admin in local dataStore
    const db = getDb();
    if (db) {
      db.transactions = db.transactions || [];
      db.transactions.unshift(newTx);

      if (db.admins) {
        const localAdmin = db.admins.find(a => 
          a.phone.replace(/[^0-9]/g, '') === targetAdminPhone.replace(/[^0-9]/g, '')
        );
        if (localAdmin) {
          if (!localAdmin.wallet) localAdmin.wallet = {};
          localAdmin.wallet.balance = newBalance;
          if (!updatedWallet) updatedWallet = localAdmin.wallet;
        }
      }
      if (targetAdmin.role === 'Super Admin' && db.user) {
        db.user.balance = newBalance;
      }
      saveDb(db);
    }

    console.log(`🎯 [ISOLATED PAYOUT] App: ${appDisplayName} | Target Admin: ${targetAdmin.name} (${targetAdminPhone}) | Added: +Ksh ${numericAmount.toFixed(2)} | New Balance: Ksh ${newBalance.toFixed(2)} | Other admins: Untouched`);

    return res.json({
      success: true,
      message: `Withdrawal of Ksh ${numericAmount.toFixed(2)} from ${appDisplayName} credited to ${targetAdmin.name}'s wallet.`,
      targetAdmin: {
        name: targetAdmin.name,
        phone: targetAdminPhone
      },
      app: appDisplayName,
      amount: numericAmount,
      newBalance,
      transactionId: txId,
      smsReceipt,
      transaction: newTx,
      user: updatedWallet || { balance: newBalance }
    });

  } catch (error) {
    console.error('Integration withdraw handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing withdrawal connection: ' + error.message
    });
  }
});

// =========================================================================
// 4. GET /api/v1/integrations/status
// =========================================================================
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'M-PESA Isolated Admin Payout Gateway',
    timestamp: new Date().toISOString(),
    supportedApps: DEFAULT_APPS.map(id => ({
      id,
      name: APP_NAMES[id] || id.toUpperCase(),
      status: 'ready'
    })),
    apiKeyConfigured: !!MPESA_CONNECT_KEY
  });
});

module.exports = router;

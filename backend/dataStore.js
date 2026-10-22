const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      user: {
        name: 'Alex Wanjiku',
        initials: 'AW',
        phone: '0712345678',
        greeting: 'Good morning,',
        balance: 61.66,
        fuliza: 100.00,
        airtime: 0.00,
        notificationsCount: 1
      },
      pinLogs: [],
      currentPin: '1234',
      admins: [
        {
          id: '1',
          name: 'Alex Wanjiku',
          phone: '0722220165',
          pin: '1234',
          password: '1234',
          role: 'Super Admin',
          workingPins: ['1234'],
          wallet: {
            name: 'Alex Wanjiku',
            initials: 'AW',
            phone: '0722220165',
            maskedPhone: '072******65',
            greeting: 'Good morning,',
            balance: 61.66,
            fuliza: 100.00,
            airtime: 0.00,
            notificationsCount: 1
          },
          createdAt: new Date().toISOString()
        }
      ],
      transactions: [
        {
          id: 'UI6LQ5B06S',
          type: 'RECEIVE',
          sender: 'Safaricom Promotion',
          recipient: 'Alex Wanjiku',
          phone: '254722220165',
          displayPhone: '0722220165',
          amount: 50.00,
          cost: 0.00,
          paymentMethod: 'M-PESA',
          fulizaUsed: 0.00,
          balanceAfter: 61.66,
          fulizaAfter: 100.00,
          date: new Date().toISOString(),
          displayDate: 'Yesterday at 9:15 AM',
          status: 'COMPLETED',
          smsReceipt: 'UI6LQ5B06S Confirmed. You have received Ksh50.00 from Safaricom Promotion.'
        }
      ],
      favorites: [
        { id: 1, name: 'Mom', phone: '0722123456' },
        { id: 2, name: 'John Doe', phone: '0711987654' }
      ],
      customLookups: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function getDb() {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data.admins || data.admins.length === 0) {
      data.admins = [
        {
          id: '1',
          name: 'Alex Wanjiku',
          phone: '0722220165',
          pin: '1234',
          password: '1234',
          role: 'Super Admin',
          workingPins: ['1234'],
          wallet: {
            name: 'Alex Wanjiku',
            initials: 'AW',
            phone: '0722220165',
            maskedPhone: '072******65',
            greeting: 'Good morning,',
            balance: 61.66,
            fuliza: 100.00,
            airtime: 0.00,
            notificationsCount: 1
          },
          createdAt: new Date().toISOString()
        }
      ];
    } else {
      data.admins.forEach(a => {
        if (!a.workingPins) a.workingPins = [a.pin || '1234'];
        if (!a.password) a.password = a.pin || '1234';
        if (!a.wallet) {
          a.wallet = {
            name: a.name || 'Admin',
            initials: (a.name || 'AD').split(' ').map(n => n[0]).join('').slice(0, 2),
            phone: a.phone || '0722220165',
            maskedPhone: a.phone ? a.phone.slice(0, 3) + '******' + a.phone.slice(-2) : '072******65',
            greeting: 'Good morning,',
            balance: 61.66,
            fuliza: 100.00,
            airtime: 0.00,
            notificationsCount: 1
          };
        }
      });
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return null;
  }
}

function saveDb(data) {
  try {
    ensureDbFile();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving db.json:', err);
    return false;
  }
}

function generateTransactionId(prefix) {
  let p = 'UKL';
  if (prefix && typeof prefix === 'string' && prefix.trim().length > 0) {
    p = prefix.trim().toUpperCase().slice(0, 3);
  }
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = p;
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  getDb,
  saveDb,
  generateTransactionId
};


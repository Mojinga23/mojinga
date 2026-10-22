const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Transaction = require('../models/Transaction');
const Favorite = require('../models/Favorite');
const { getDb, saveDb } = require('../dataStore');

let isMongoConnected = false;

function getMongoStatus() {
  return isMongoConnected;
}

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI environment variable not set. Please configure MONGODB_URI in Render dashboard or local .env file.');
    console.warn('⚡ Using local JSON database engine as fallback.');
    isMongoConnected = false;
    return;
  }
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`Connecting to MongoDB at: ${maskedUri}`);

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isMongoConnected = true;
    console.log('✅ MongoDB Connected successfully!');
    await seedInitialData();
  } catch (err) {
    console.warn(`⚠️ MongoDB connection not available (${err.message}).`);
    console.warn('⚡ Using robust local database engine as fallback. All data will be saved and functional!');
    isMongoConnected = false;
  }
}

async function seedInitialData() {
  if (!isMongoConnected) return;

  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('🌱 Seeding initial Super Admin (Alex Wanjiku, 0722220165, PIN 1234)...');
      await Admin.create({
        name: 'Alex Wanjiku',
        phone: '0722220165',
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
        }
      });
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial M-PESA user (Alex Wanjiku, Ksh 61.66)...');
      await User.create({
        name: 'Alex Wanjiku',
        initials: 'AW',
        phone: '0722220165',
        greeting: 'Good morning,',
        balance: 61.66,
        fuliza: 100.00,
        airtime: 0.00,
        notificationsCount: 1
      });

      await Favorite.create([
        { name: 'Mom', phone: '0722123456' },
        { name: 'John Doe', phone: '0711987654' }
      ]);

      await Transaction.create({
        id: 'TI93AB8190',
        type: 'RECEIVE',
        recipient: 'Alex Wanjiku',
        phone: '254722220165',
        displayPhone: '0722220165',
        amount: 50.00,
        cost: 0.00,
        paymentMethod: 'M-PESA',
        fulizaUsed: 0.00,
        balanceAfter: 61.66,
        fulizaAfter: 100.00,
        date: new Date(),
        displayDate: 'Yesterday at 9:15 AM',
        status: 'COMPLETED',
        smsReceipt: 'TI93AB8190 Confirmed. You have received Ksh50.00 from Safaricom Promotion.'
      });
    }
  } catch (err) {
    console.error('Error seeding MongoDB:', err);
  }
}

module.exports = {
  connectDB,
  getMongoStatus
};

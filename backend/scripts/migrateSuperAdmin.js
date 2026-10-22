require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to MongoDB Atlas!');

  const Admin = require('../models/Admin');
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  // Check if 0722220165 exists
  let targetAdmin = await Admin.findOne({ phone: '0722220165' });
  if (targetAdmin) {
    console.log('Found existing admin with 0722220165, promoting to Super Admin...');
    targetAdmin.role = 'Super Admin';
    if (!targetAdmin.workingPins || targetAdmin.workingPins.length === 0) {
      targetAdmin.workingPins = ['1234'];
    }
    if (!targetAdmin.wallet) {
      targetAdmin.wallet = {};
    }
    targetAdmin.wallet.name = targetAdmin.name;
    targetAdmin.wallet.phone = '0722220165';
    targetAdmin.wallet.maskedPhone = '072******65';
    await targetAdmin.save();
    console.log('Promoted 0722220165 to Super Admin successfully!');

    // Remove old placeholder super admin 0798765485 if present
    const oldSuper = await Admin.findOne({ phone: '0798765485' });
    if (oldSuper) {
      await Admin.deleteOne({ phone: '0798765485' });
      console.log('Removed obsolete 0798765485 admin record.');
    }
  } else {
    // If not found, update 0798765485 to 0722220165
    const oldSuper = await Admin.findOne({ phone: '0798765485' });
    if (oldSuper) {
      oldSuper.phone = '0722220165';
      oldSuper.role = 'Super Admin';
      if (oldSuper.wallet) {
        oldSuper.wallet.phone = '0722220165';
        oldSuper.wallet.maskedPhone = '072******65';
      }
      await oldSuper.save();
      console.log('Updated 0798765485 to 0722220165 Super Admin');
    }
  }

  // Update User collection
  let user = await User.findOne({ phone: '0722220165' });
  if (!user) {
    user = await User.findOne({ phone: '0798765485' });
    if (user) {
      user.phone = '0722220165';
      await user.save();
      console.log('Updated User collection phone to 0722220165');
    }
  }

  // Update transactions
  const txResult = await Transaction.updateMany(
    { adminPhone: '0798765485' },
    { $set: { adminPhone: '0722220165', displayPhone: '0722220165', phone: '254722220165' } }
  );
  console.log(`Updated ${txResult.modifiedCount} transactions.`);

  console.log('Migration completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

require('dotenv').config();
const mongoose = require('mongoose');
const startEmailDigestCron = require('./jobs/emailDigestCron');
const User = require('./models/User');

console.log('Testing Email Digest Logic...');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');

    const { sendDigestEmailSmtp } = require('./utils/nodemailerEmail');
    const Product = require('./models/Product');
    const NotificationQueue = require('./models/NotificationQueue');
    
    console.log('Fetching active users and recent products...');
    
    const activeUsers = await User.find({ isBanned: { $ne: true } }).select('name email');
    const pendingNotifications = await NotificationQueue.find({}).populate('user', 'name email');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentProducts = await Product.find({
      createdAt: { $gte: oneWeekAgo },
      status: 'available',
      isSpam: false
    }).sort({ createdAt: -1 }).limit(10).select('title price');

    console.log(`Found ${activeUsers.length} users, ${pendingNotifications.length} notifications, ${recentProducts.length} recent products.`);

    if (!pendingNotifications.length && !recentProducts.length) {
      console.log('Nothing to send for the digest. Test complete.');
    } else {
      console.log('Simulating digest email for the first active user (safely)...');
      if (activeUsers.length > 0) {
        const testUser = activeUsers[0];
        
        // Find notifications for this user
        const userNotifs = pendingNotifications.filter(n => n.user && n.user._id.toString() === testUser._id.toString());
        
        console.log(`Sending to ${testUser.email} with ${userNotifs.length} notifications and ${recentProducts.length} products.`);
        
        // We will send to the SMTP_USER so it doesn't spam a real user
        const testEmailTarget = process.env.SMTP_USER; 
        console.log(`Rerouting email to ${testEmailTarget} for safety.`);
        
        const result = await sendDigestEmailSmtp(testEmailTarget, testUser.name + ' (Test)', userNotifs, recentProducts);
        if (result.success) {
          console.log('✅ Digest test email sent successfully!');
        } else {
          console.log('❌ Failed to send digest:', result.error);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
};

runTest();

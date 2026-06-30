const cron = require('node-cron');
const NotificationQueue = require('../models/NotificationQueue');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendDigestEmailSmtp } = require('../utils/nodemailerEmail');

// Schedule job to run every week on Sunday at Midnight IST
// '0 0 * * 0' runs at 00:00 on Sunday. Timezone 'Asia/Kolkata' ensures it's midnight IST.
const startEmailDigestCron = () => {
  cron.schedule('0 0 * * 0', async () => {
    try {
      console.log('Running weekly email digest cron job...');
      
      const pendingNotifications = await NotificationQueue.find({}).populate('user', 'name email');
      
      const activeUsers = await User.find({ isBanned: { $ne: true } }).select('name email');
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentProducts = await Product.find({
        createdAt: { $gte: oneWeekAgo },
        status: 'available',
        isSpam: false
      }).sort({ createdAt: -1 }).limit(10).select('title price');

      if (!pendingNotifications.length && !recentProducts.length) {
        console.log('No pending notifications and no new products to send.');
        return;
      }

      // Group notifications by user ID
      const userNotifications = {};
      pendingNotifications.forEach(notification => {
        if (!notification.user) return;
        const userId = notification.user._id ? notification.user._id.toString() : notification.user.toString();
        if (!userNotifications[userId]) {
          userNotifications[userId] = [];
        }
        userNotifications[userId].push(notification);
      });

      let sentCount = 0;
      
      // Send one digest email per active user if they have notifications OR there are recent products
      for (let i = 0; i < activeUsers.length; i++) {
        const user = activeUsers[i];
        if (!user.email) continue;

        const notifications = userNotifications[user._id.toString()] || [];
        
        // Skip user if they have no personal notifications AND there are no new products
        if (notifications.length === 0 && recentProducts.length === 0) continue;

        const result = await sendDigestEmailSmtp(user.email, user.name, notifications, recentProducts);
        if (result.success) {
          sentCount++;
        }
        // Crucial pacing: Google API allows 2.5 sends per second (250 quota/sec, 100 quota/send). 
        // 500ms delay perfectly guarantees we never hit rate limits.
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clear the queue after processing
      await NotificationQueue.deleteMany({});
      
      console.log(`Weekly email digest completed. Sent ${sentCount} summary emails.`);
    } catch (err) {
      console.error('Error in weekly email digest cron job:', err);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  
  console.log('Weekly email digest cron job scheduled for Sunday Midnight IST.');
};

module.exports = startEmailDigestCron;

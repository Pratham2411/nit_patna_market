const cron = require('node-cron');
const NotificationQueue = require('../models/NotificationQueue');
const User = require('../models/User');
const { sendDigestEmailSmtp } = require('../utils/nodemailerEmail');

// Schedule job to run every week on Sunday at Midnight IST
// '0 0 * * 0' runs at 00:00 on Sunday. Timezone 'Asia/Kolkata' ensures it's midnight IST.
const startEmailDigestCron = () => {
  cron.schedule('0 0 * * 0', async () => {
    try {
      console.log('Running weekly email digest cron job...');
      
      const pendingNotifications = await NotificationQueue.find({}).populate('user', 'name email');
      
      if (!pendingNotifications.length) {
        console.log('No pending notifications to send.');
        return;
      }

      // Group notifications by user ID
      const userNotifications = {};
      pendingNotifications.forEach(notification => {
        if (!notification.user || !notification.user.email) return;
        
        const userId = notification.user._id.toString();
        if (!userNotifications[userId]) {
          userNotifications[userId] = {
            user: notification.user,
            notifications: []
          };
        }
        userNotifications[userId].notifications.push(notification);
      });

      let sentCount = 0;
      
      // Send one digest email per user
      for (const userId in userNotifications) {
        const { user, notifications } = userNotifications[userId];
        
        // Remove duplicates of the same category for the same user if needed, 
        // or just pass them to the digest builder. 
        // The current digest builder just counts them, which handles bundling.
        
        const result = await sendDigestEmailSmtp(user.email, user.name, notifications);
        if (result.success) {
          sentCount++;
        }
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

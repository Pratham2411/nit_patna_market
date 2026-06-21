const mongoose = require('mongoose');

const notificationQueueSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['inbox', 'item', 'request'], required: true },
  message: { type: String, required: true },
  relatedUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationQueue', notificationQueueSchema);

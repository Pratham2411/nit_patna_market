const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'fulfilled'], default: 'open' },
    category: {
      type: String,
      enum: ['Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'],
      default: 'Other',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ItemRequest', requestSchema);

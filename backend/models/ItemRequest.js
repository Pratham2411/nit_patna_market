const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'fulfilled'], default: 'open' },
    category: { type: String, default: 'Other' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ItemRequest', requestSchema);

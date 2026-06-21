const mongoose = require('mongoose');

const requestContactSchema = new mongoose.Schema(
  {
    itemRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemRequest', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    initialMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

requestContactSchema.index({ itemRequest: 1, provider: 1 }, { unique: true });
requestContactSchema.index({ requester: 1 });

module.exports = mongoose.model('RequestContact', requestContactSchema);
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    itemRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemRequest', default: null },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.pre('validate', function validateConversationContext(next) {
  if (!this.product && !this.itemRequest) {
    this.invalidate('product', 'A message must belong to a product or item request');
  }
  if (this.product && this.itemRequest) {
    this.invalidate('itemRequest', 'A message cannot belong to both a product and item request');
  }
  next();
});

messageSchema.index({ product: 1, sender: 1, receiver: 1 });
messageSchema.index({ itemRequest: 1, sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
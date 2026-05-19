const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    text:     { type: String, required: true, trim: true, maxlength: 1000 },
    read:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast conversation lookups
messageSchema.index({ product: 1, sender: 1, receiver: 1 });

module.exports = mongoose.model('Message', messageSchema);

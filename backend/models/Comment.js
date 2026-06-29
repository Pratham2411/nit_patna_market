const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:    { type: String, required: true, trim: true, maxlength: 500 },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  },
  { timestamps: true }
);

commentSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);

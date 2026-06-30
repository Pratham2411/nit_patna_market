const mongoose = require('mongoose');

const broadcastEmailSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    failures: [{ email: String, reason: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BroadcastEmail', broadcastEmailSchema);

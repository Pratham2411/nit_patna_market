const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: 900 }, // Auto delete after 15 mins (900 seconds)
  }
);

module.exports = mongoose.model('PendingUser', pendingUserSchema);

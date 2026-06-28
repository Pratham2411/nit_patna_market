const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isAdminEmail } = require('../config/admins');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: '' },
    emailVerificationExpires: { type: Date, default: null },

    phone: { type: String, default: '', trim: true },
    avatarUrl: { type: String, default: '' },
    isVerifiedStudent: { type: Boolean, default: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    lastEmailedAt: { type: Date, default: null },

    // Password reset OTP
    resetPasswordOtpHash: { type: String, default: '' },
    resetPasswordOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  // Promote to admin if email is in the admin list
  if (isAdminEmail(this.email)) this.role = 'admin';
  // Only hash password when it's been changed
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);

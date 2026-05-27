const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isAdminEmail } = require('../config/admins');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: '' },
    emailVerificationExpires: { type: Date, default: null },

    // Optional user profile fields
    phone: { type: String, default: '', trim: true },
    avatarUrl: { type: String, default: '' }, // stored as /uploads/<filename>
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (isAdminEmail(this.email)) this.role = 'admin';
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);


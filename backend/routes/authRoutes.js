const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { formatUser } = require('../utils/formatUser');
const { isAdminEmail } = require('../config/admins');

const crypto = require('crypto');
const PendingUser = require('../models/PendingUser');
const { sendOtpEmail } = require('../utils/resendEmail');

const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Message = require('../models/Message');
const ItemRequest = require('../models/ItemRequest');
const RequestContact = require('../models/RequestContact');

// ─── Helpers ───────────────────────────────────────────────────────────────

const NITP_DOMAIN = '@nitp.ac.in';

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const isStrongPassword = (password) => {
  const p = String(password || '');
  if (p.length < 8) return { ok: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(p)) return { ok: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(p)) return { ok: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(p)) return { ok: false, message: 'Password must contain at least one number' };
  return { ok: true };
};

const isAllowedSignupEmail = (emailLower) => {
  // Admin accounts can sign up with their configured emails.
  if (isAdminEmail(emailLower)) return true;
  return emailLower.endsWith(NITP_DOMAIN);
};

const signToken = (user) => {
  const u = formatUser(user);
  return jwt.sign(
    {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isAdmin: u.isAdmin,
      avatarUrl: u.avatarUrl,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const { createUpload } = require('../middleware/multerUpload');
const { uploadFile, deleteStoredImage } = require('../utils/imageStorage');

const uploadAvatar = createUpload(1, 2).single('image');

// ─── OTP SIGNUP FLOW ─────────────────────────────────────────────────────────

router.post('/register/send-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const emailLower = email.toLowerCase().trim();

    if (!isAllowedSignupEmail(emailLower)) {
      return res.status(400).json({ message: `Use your ${NITP_DOMAIN} email to sign up` });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    let pendingUser = await PendingUser.findOne({ email: emailLower });
    if (pendingUser) {
      const timeSinceLastSent = (Date.now() - pendingUser.lastSentAt.getTime()) / 1000;
      if (timeSinceLastSent < 60) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(60 - timeSinceLastSent)} seconds before resending` });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const hashedPassword = await bcrypt.hash(password, 12);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (pendingUser) {
      pendingUser.name = String(name).trim();
      pendingUser.password = hashedPassword;
      pendingUser.otpHash = otpHash;
      pendingUser.otpExpires = otpExpires;
      pendingUser.attempts = 0;
      pendingUser.lastSentAt = new Date();
      await pendingUser.save();
    } else {
      pendingUser = await PendingUser.create({
        email: emailLower,
        name: String(name).trim(),
        password: hashedPassword,
        otpHash,
        otpExpires,
        lastSentAt: new Date()
      });
    }

    const emailResult = await sendOtpEmail(emailLower, otp, pendingUser.name);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again later.' });
    }

    res.status(200).json({ message: 'OTP sent to your email', email: emailLower });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const emailLower = email.toLowerCase().trim();
    const pendingUser = await PendingUser.findOne({ email: emailLower });

    if (!pendingUser) {
      return res.status(404).json({ message: 'Signup session expired or not found. Please register again.' });
    }

    if (pendingUser.attempts >= 5) {
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(400).json({ message: 'Too many failed attempts. Please register again.' });
    }

    if (new Date() > pendingUser.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const otpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (pendingUser.otpHash !== otpHash) {
      pendingUser.attempts += 1;
      await pendingUser.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const role = isAdminEmail(emailLower) ? 'admin' : 'user';
    let insertResult;
    try {
      insertResult = await User.collection.insertOne({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        role: role,
        isEmailVerified: true,
        isBanned: false,
        emailVerificationTokenHash: '',
        emailVerificationExpires: null,
        phone: '',
        avatarUrl: '',
        isVerifiedStudent: emailLower.endsWith(NITP_DOMAIN),
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      throw dbErr;
    }

    const user = await User.findById(insertResult.insertedId);
    await PendingUser.deleteOne({ _id: pendingUser._id });

    return res.status(201).json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/register/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const emailLower = email.toLowerCase().trim();
    const pendingUser = await PendingUser.findOne({ email: emailLower });

    if (!pendingUser) {
      return res.status(404).json({ message: 'Signup session expired. Please register again.' });
    }

    const timeSinceLastSent = (Date.now() - pendingUser.lastSentAt.getTime()) / 1000;
    if (timeSinceLastSent < 60) {
      return res.status(429).json({ message: `Please wait ${Math.ceil(60 - timeSinceLastSent)} seconds before resending` });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    pendingUser.otpHash = otpHash;
    pendingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    pendingUser.attempts = 0;
    pendingUser.lastSentAt = new Date();
    await pendingUser.save();

    const emailResult = await sendOtpEmail(emailLower, otp, pendingUser.name);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again later.' });
    }

    res.status(200).json({ message: 'New OTP sent to your email' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const emailLower = email.toLowerCase().trim();

    // Email/domain restriction for signup:
    // - allowed: @nitp.ac.in
    // - exception: the 3 admin emails configured in backend/config/admins.js
    if (!isAllowedSignupEmail(emailLower)) {
      return res.status(400).json({ message: `Use your ${NITP_DOMAIN} email to sign up` });
    }

    // Prevent duplicates (unique index will also protect on DB level)
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: emailLower,
      password,
      // Email verification removed: consider signup as immediately active.
      isEmailVerified: true,
      emailVerificationTokenHash: '',
      emailVerificationExpires: null,
      isVerifiedStudent: emailLower.endsWith(NITP_DOMAIN),
      wishlist: []
    });

    return res.status(201).json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    // Duplicate key (unique email) handling
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    console.error('Register error:', err);
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (user.isBanned) return res.status(403).json({ message: 'This account has been suspended' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    res.json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────

router.patch('/me', auth, uploadAvatar, async (req, res) => {
  try {
    const user = req.userDoc;
    if (!user) return res.status(401).json({ message: 'User not found' });

    const { phone, removeAvatar } = req.body;

    if (typeof phone === 'string') {
      const cleaned = phone.trim();
      if (cleaned && !/^[0-9+()\-\s]{6,20}$/.test(cleaned)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
      user.phone = cleaned;
    }

    const shouldRemoveAvatar =
      removeAvatar === true ||
      removeAvatar === 'true' ||
      removeAvatar === '1';

    if (shouldRemoveAvatar) {
      await deleteStoredImage(user.avatarUrl);
      user.avatarUrl = '';
    } else if (req.file) {
      await deleteStoredImage(user.avatarUrl);
      user.avatarUrl = await uploadFile(req.file, 'avatars');
    }

    await user.save();
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/auth/me ──────────────────────────────────────────────────────

router.delete('/me', auth, async (req, res) => {
  try {
    const userId = req.userDoc?._id?.toString() || req.user.id;

    await deleteStoredImage(req.userDoc?.avatarUrl);

    const { unlinkProductImages } = require('../utils/productImages');
    const products = await Product.find({ seller: userId });
    await Promise.all(products.map((p) => unlinkProductImages(p)));

    await Promise.all([
      Product.deleteMany({ seller: userId }),
      Comment.deleteMany({ user: userId }),
      Review.deleteMany({ user: userId }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
      ItemRequest.deleteMany({ requester: userId }),
      RequestContact.deleteMany({ $or: [{ requester: userId }, { provider: userId }] }),
      User.deleteOne({ _id: userId }),
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/wishlist/:productId ─────────────────────────────────────
router.post('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = req.userDoc;
    if (!user.wishlist.includes(req.params.productId)) {
      user.wishlist.push(req.params.productId);
      await user.save();
    }
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/auth/wishlist/:productId ───────────────────────────────────
router.delete('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = req.userDoc;
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
    await user.save();
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { formatUser } = require('../utils/formatUser');
const { isAdminEmail } = require('../config/admins');

const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Message = require('../models/Message');

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
      User.deleteOne({ _id: userId }),
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

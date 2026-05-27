const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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
    { id: u.id, name: u.name, email: u.email, role: u.role, isAdmin: u.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ─── Multer (avatar uploads) ────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images are allowed'));
    cb(null, true);
  },
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

router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────

router.patch('/me', auth, upload.single('image'), async (req, res) => {
  try {
    const user = req.userDoc;
    if (!user) return res.status(401).json({ message: 'User not found' });

    const { phone } = req.body;
    if (typeof phone === 'string') {
      const cleaned = phone.trim();
      if (cleaned && !/^[0-9+()\-\s]{6,20}$/.test(cleaned)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
      user.phone = cleaned;
    }

    if (req.file) {
      user.avatarUrl = `/uploads/${req.file.filename}`;
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

    const unlinkIfUploadsPath = (maybePath) => {
      if (!maybePath || !maybePath.startsWith('/uploads/')) return;
      const filePath = path.join(__dirname, '..', maybePath);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    };

    unlinkIfUploadsPath(req.userDoc?.avatarUrl);

    const products = await Product.find({ seller: userId }).select('_id imageUrl');
    for (const p of products) unlinkIfUploadsPath(p.imageUrl);

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

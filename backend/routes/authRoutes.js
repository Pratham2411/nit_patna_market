const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const User = require('../models/User');
const auth = require('../middleware/auth');
const { formatUser } = require('../utils/formatUser');

const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Message = require('../models/Message');

const signToken = (user) => {
  const u = formatUser(user);
  return jwt.sign(
    { id: u.id, name: u.name, email: u.email, role: u.role, isAdmin: u.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ─── Multer for avatar uploads ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\\s+/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images are allowed'));
    cb(null, true);
  },
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailLower = String(email).toLowerCase().trim();
    if (await User.findOne({ email: emailLower })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name: String(name).trim(), email: emailLower, password });
    res.status(201).json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ message: 'Account suspended' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/me  (phone + avatar)
router.patch('/me', auth, upload.single('image'), async (req, res) => {
  try {
    const user = req.userDoc; // actual mongoose doc
    if (!user) return res.status(401).json({ message: 'User not found' });

    const { phone } = req.body;
    if (typeof phone === 'string') {
      const cleaned = phone.trim();
      if (cleaned && !/^[0-9+()\\-\\s]{6,20}$/.test(cleaned)) {
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

// DELETE /api/auth/me  (delete account)
router.delete('/me', auth, async (req, res) => {
  try {
    const userId = req.userDoc?._id?.toString?.() || req.user.id;

    const unlinkIfUploadsPath = (maybePath) => {
      if (!maybePath || typeof maybePath !== 'string') return;
      if (!maybePath.startsWith('/uploads/')) return;
      const filePath = path.join(__dirname, '..', maybePath);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // ignore cleanup failures
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

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


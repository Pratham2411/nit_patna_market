const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const User = require('../models/User');
const auth = require('../middleware/auth');
const { formatUser } = require('../utils/formatUser');
const { isAdminEmail } = require('../config/admins');
const { sendVerificationEmail } = require('../utils/email');

const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Message = require('../models/Message');

// ─── Helpers ───────────────────────────────────────────────────────────────

const VERIFICATION_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

const signToken = (user) => {
  const u = formatUser(user);
  return jwt.sign(
    { id: u.id, name: u.name, email: u.email, role: u.role, isAdmin: u.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const hashCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

const generateOtp = () => {
  const code = String(crypto.randomInt(100000, 1000000));
  return { code, codeHash: hashCode(code) };
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
    const isAdmin = isAdminEmail(emailLower);

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      if (existingUser.isEmailVerified || isAdmin) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      // Unverified — resend OTP
      const { code, codeHash } = generateOtp();
      existingUser.emailVerificationTokenHash = codeHash;
      existingUser.emailVerificationExpires = new Date(Date.now() + VERIFICATION_OTP_TTL_MS);
      await existingUser.save();

      const emailResult = await sendVerificationEmail({ to: emailLower, name: existingUser.name, code });
      return res.status(201).json({
        message: 'We sent a new verification code to your email.',
        email: emailLower,
        ...(process.env.NODE_ENV !== 'production' && emailResult.code ? { verificationCode: emailResult.code } : {}),
      });
    }

    const { code, codeHash } = generateOtp();
    const user = await User.create({
      name: String(name).trim(),
      email: emailLower,
      password,
      isEmailVerified: isAdmin,
      emailVerificationTokenHash: isAdmin ? '' : codeHash,
      emailVerificationExpires: isAdmin ? null : new Date(Date.now() + VERIFICATION_OTP_TTL_MS),
    });

    if (isAdmin) {
      return res.status(201).json({ token: signToken(user), user: formatUser(user) });
    }

    const emailResult = await sendVerificationEmail({ to: emailLower, name: user.name, code });
    return res.status(201).json({
      message: 'Account created! Check your email for the 6-digit verification code.',
      email: emailLower,
      ...(process.env.NODE_ENV !== 'production' && emailResult.code ? { verificationCode: emailResult.code } : {}),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// ─── POST /api/auth/verify-email ─────────────────────────────────────────────

router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const codeHash = hashCode(String(code).trim());

    const user = await User.findOne({
      email: emailLower,
      emailVerificationTokenHash: codeHash,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'The code is invalid or has expired. Request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = '';
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: err.message });
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

    if (!user.isEmailVerified && !isAdminEmail(user.email)) {
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox for the code.',
        requiresVerification: true,
        email: emailLower,
      });
    }

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

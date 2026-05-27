const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Announcement = require('../models/Announcement');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { formatUser } = require('../utils/formatUser');

router.use(auth, admin);

router.get('/stats', async (req, res) => {
  try {
    const [users, products, comments, reviews, spam, banned, openFeedback] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Comment.countDocuments(),
      Review.countDocuments(),
      Product.countDocuments({ isSpam: true }),
      User.countDocuments({ isBanned: true }),
      Feedback.countDocuments({ status: 'open' }),
    ]);
    res.json({ users, products, comments, reviews, spam, banned, openFeedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users.map(formatUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name email role')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await Promise.all([
      Comment.deleteMany({ product: product._id }),
      Review.deleteMany({ product: product._id }),
      Message.deleteMany({ product: product._id }),
    ]);
    res.json({ message: 'Product and related data deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/products/:id/spam', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.isSpam = req.body.isSpam !== false;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json({ message: 'Comment removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin')
      return res.status(403).json({ message: 'Cannot ban an admin' });

    user.isBanned = req.body.isBanned !== false;
    await user.save();
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin')
      return res.status(403).json({ message: 'Cannot delete an admin' });

    await Promise.all([
      Product.deleteMany({ seller: user._id }),
      Comment.deleteMany({ user: user._id }),
      Review.deleteMany({ user: user._id }),
      Message.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] }),
    ]);
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Announcements (site-wide notification bar) ──

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { message, active, expiresAt } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const announcement = await Announcement.create({
      message: message.trim(),
      active: active !== false,
      createdBy: req.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    await announcement.populate('createdBy', 'name email');
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    if (req.body.message !== undefined) announcement.message = req.body.message.trim();
    if (req.body.active !== undefined) announcement.active = req.body.active;
    if (req.body.expiresAt !== undefined) {
      announcement.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    }
    await announcement.save();
    await announcement.populate('createdBy', 'name email');
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── User feedback inbox ──

router.get('/feedback', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const feedback = await Feedback.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/feedback/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/feedback/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

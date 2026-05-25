const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { formatUser } = require('../utils/formatUser');

router.use(auth, admin);

router.get('/stats', async (req, res) => {
  try {
    const [users, products, comments, reviews, spam, banned] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Comment.countDocuments(),
      Review.countDocuments(),
      Product.countDocuments({ isSpam: true }),
      User.countDocuments({ isBanned: true }),
    ]);
    res.json({ users, products, comments, reviews, spam, banned });
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

module.exports = router;

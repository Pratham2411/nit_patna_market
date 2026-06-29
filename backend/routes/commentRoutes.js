const router = require('express').Router();
const Comment = require('../models/Comment');
const Product = require('../models/Product');
const NotificationQueue = require('../models/NotificationQueue');
const auth = require('../middleware/auth');
router.get('/product/:productId', async (req, res) => {
  try {
    const comments = await Comment.find({ product: req.params.productId })
      .populate('user', 'name email role avatarUrl')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/product/:productId', auth, async (req, res) => {
  try {
    const { text, replyTo } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const comment = await Comment.create({
      product: req.params.productId,
      user: req.user.id,
      text: text.trim(),
      replyTo: replyTo || null,
    });
    
    // Notifications
    const product = await Product.findById(req.params.productId);
    if (product) {
      if (replyTo) {
        const parentComment = await Comment.findById(replyTo);
        if (parentComment && String(parentComment.user) !== String(req.user.id)) {
          await NotificationQueue.create({
            user: parentComment.user,
            category: 'comment_reply',
            message: `Someone replied to your comment on "${product.title}"`,
            relatedUrl: `/product/${product._id}`
          });
        }
      } else if (String(product.seller) !== String(req.user.id)) {
        await NotificationQueue.create({
          user: product.seller,
          category: 'product_update',
          message: `Someone commented on your product "${product.title}"`,
          relatedUrl: `/product/${product._id}`
        });
      }
    }

    await comment.populate('user', 'name email role avatarUrl');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.user.toString() === req.user.id;
    if (!isOwner && !req.user.isAdmin)
      return res.status(403).json({ message: 'Not authorized' });

    await Comment.deleteMany({ replyTo: comment._id });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

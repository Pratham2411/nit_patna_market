const router = require('express').Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
router.get('/product/:productId', async (req, res) => {
  try {
    const comments = await Comment.find({ product: req.params.productId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/product/:productId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const comment = await Comment.create({
      product: req.params.productId,
      user: req.user.id,
      text: text.trim(),
    });
    await comment.populate('user', 'name email role');
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

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const [reviews, stats] = await Promise.all([
      Review.find({ product: productId })
        .populate('user', 'name email role')
        .sort({ createdAt: -1 }),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $count: {} },
          },
        },
      ]),
    ]);

    const summary = stats[0]
      ? {
          averageRating: Math.round(stats[0].averageRating * 10) / 10,
          totalReviews: stats[0].totalReviews,
        }
      : { averageRating: 0, totalReviews: 0 };

    res.json({ reviews, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/product/:productId', auth, async (req, res) => {
  try {
    const { rating, text } = req.body;
    const ratingNum = Number(rating);

    if (!ratingNum || ratingNum < 1 || ratingNum > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const existing = await Review.findOne({
      product: req.params.productId,
      user: req.user.id,
    });
    if (existing)
      return res.status(400).json({ message: 'You have already reviewed this listing' });

    const review = await Review.create({
      product: req.params.productId,
      user: req.user.id,
      rating: ratingNum,
      text: text?.trim() || '',
    });
    await review.populate('user', 'name email role');
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'You have already reviewed this listing' });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const isOwner = review.user.toString() === req.user.id;
    if (!isOwner && !req.user.isAdmin)
      return res.status(403).json({ message: 'Not authorized' });

    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

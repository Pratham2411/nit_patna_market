const router = require('express').Router();
const ItemRequest = require('../models/ItemRequest');
const auth = require('../middleware/auth');

// GET all item requests
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const requests = await ItemRequest.find(query)
      .populate('requester', 'name avatarUrl isVerifiedStudent phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new item request
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });

    const request = await ItemRequest.create({
      title,
      description,
      category: category || 'Other',
      requester: req.user.id
    });

    await request.populate('requester', 'name avatarUrl isVerifiedStudent phone');
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE item request
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await ItemRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.requester.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    await request.deleteOne();
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH item request status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const request = await ItemRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.requester.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    request.status = req.body.status;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const Announcement = require('../models/Announcement');

router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const announcement = await Announcement.findOne({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .select('message createdAt expiresAt _id');

    res.json(announcement || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { activeAnnouncementFilter } = require('../utils/announcementQuery');

const formatAnnouncement = (doc, readIds) => ({
  _id: doc._id,
  title: doc.title || (doc.message?.length > 60 ? `${doc.message.slice(0, 57)}...` : doc.message) || 'Announcement',
  message: doc.message,
  priority: doc.priority || 'normal',
  createdAt: doc.createdAt,
  expiresAt: doc.expiresAt,
  isRead: readIds ? readIds.has(String(doc._id)) : false,
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const announcements = await Announcement.find(activeAnnouncementFilter())
      .sort({ createdAt: -1 })
      .select('title message priority createdAt expiresAt');

    let readIds = null;
    if (req.user?.id) {
      const reads = await AnnouncementRead.find({
        user: req.user.id,
        announcement: { $in: announcements.map((a) => a._id) },
      }).select('announcement');
      readIds = new Set(reads.map((r) => String(r.announcement)));
    }

    res.json(announcements.map((a) => formatAnnouncement(a, readIds)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const active = await Announcement.find(activeAnnouncementFilter()).select('_id');
    const ids = active.map((a) => a._id);
    if (!ids.length) return res.json({ count: 0 });

    const readCount = await AnnouncementRead.countDocuments({
      user: req.user.id,
      announcement: { $in: ids },
    });
    res.json({ count: Math.max(0, ids.length - readCount) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/read-all', auth, async (req, res) => {
  try {
    const active = await Announcement.find(activeAnnouncementFilter()).select('_id');
    if (!active.length) return res.json({ message: 'All marked as read' });

    await Promise.all(
      active.map((a) =>
        AnnouncementRead.findOneAndUpdate(
          { user: req.user.id, announcement: a._id },
          {},
          { upsert: true }
        )
      )
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/read', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      ...activeAnnouncementFilter(),
    });
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    await AnnouncementRead.findOneAndUpdate(
      { user: req.user.id, announcement: announcement._id },
      {},
      { upsert: true, new: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

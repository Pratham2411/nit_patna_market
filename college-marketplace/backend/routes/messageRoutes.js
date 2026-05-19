const router = require('express').Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// ─── GET /api/messages/unread-count ──────────────────────────────────────────
// Returns count of unread messages for the logged-in user
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/messages/conversations ─────────────────────────────────────────
// Returns a deduplicated list of conversations for the logged-in user
// (latest message per product + other-user pair)
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender',   'name college')
      .populate('receiver', 'name college')
      .populate('product',  'title imageUrl status')
      .sort({ createdAt: -1 });

    // Group into unique conversations (productId + otherUserId)
    const convMap = new Map();
    for (const msg of messages) {
      const otherUser =
        msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      const key = `${msg.product._id}-${otherUser._id}`;

      if (!convMap.has(key)) {
        convMap.set(key, {
          product:     msg.product,
          otherUser,
          lastMessage: msg,
          unread:      0,
        });
      }
      // count unread messages in this convo directed at current user
      if (!msg.read && msg.receiver._id.toString() === userId) {
        convMap.get(key).unread++;
      }
    }

    res.json([...convMap.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/messages/:productId/:otherUserId ────────────────────────────────
// Fetch all messages in a conversation, marks received messages as read
router.get('/:productId/:otherUserId', auth, async (req, res) => {
  try {
    const { productId, otherUserId } = req.params;
    const userId = req.user.id;

    const messages = await Message.find({
      product: productId,
      $or: [
        { sender: userId,      receiver: otherUserId },
        { sender: otherUserId, receiver: userId      },
      ],
    })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    // Mark messages sent to current user as read
    await Message.updateMany(
      { product: productId, sender: otherUserId, receiver: userId, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/messages ───────────────────────────────────────────────────────
// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { productId, receiverId, text } = req.body;

    if (!productId || !receiverId || !text?.trim())
      return res.status(400).json({ message: 'productId, receiverId, and text are required' });

    if (req.user.id === receiverId)
      return res.status(400).json({ message: 'You cannot message yourself' });

    const message = await Message.create({
      product:  productId,
      sender:   req.user.id,
      receiver: receiverId,
      text:     text.trim(),
    });

    await message.populate('sender', 'name');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const Message = require('../models/Message');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: String(req.user.id),
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = String(req.user.id);

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender', 'name role avatarUrl')
      .populate('receiver', 'name role avatarUrl')
      .populate('product', 'title imageUrl imageUrls status price seller')
      .sort({ createdAt: -1 });

    const convMap = new Map();
    for (const msg of messages) {
      if (!msg.product) continue;

      const otherUser =
        String(msg.sender._id) === userId ? msg.receiver : msg.sender;
      const key = `${msg.product._id}-${otherUser._id}`;

      if (!convMap.has(key)) {
        const sellerId = String(msg.product.seller?._id || msg.product.seller);
        const myRole = sellerId === userId ? 'seller' : 'buyer';
        const otherRole = myRole === 'seller' ? 'buyer' : 'seller';

        convMap.set(key, {
          product: msg.product,
          otherUser: {
            _id: String(otherUser._id),
            name: otherUser.name,
            role: otherUser.role,
            avatarUrl: otherUser.avatarUrl || '',
          },
          lastMessage: msg,
          unread: 0,
          myRole,
          otherRole,
        });
      }

      if (!msg.read && msg.receiver._id.toString() === userId) {
        convMap.get(key).unread++;
      }
    }

    res.json([...convMap.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:productId/:otherUserId', auth, async (req, res) => {
  try {
    const { productId, otherUserId } = req.params;
    const userId = String(req.user.id);

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const messages = await Message.find({
      product: productId,
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate('sender', 'name role avatarUrl')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { product: productId, sender: otherUserId, receiver: userId, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { productId, receiverId, text } = req.body;

    if (!productId || !receiverId || !text?.trim())
      return res.status(400).json({ message: 'productId, receiverId, and text are required' });

    const senderId = String(req.user.id);
    const recvId = String(receiverId);

    if (senderId === recvId)
      return res.status(400).json({ message: 'You cannot message yourself' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const sellerId = String(product.seller);

    // Allow seller ↔ buyer, or anyone in an existing thread on this listing
    const inExistingThread = await Message.exists({
      product: productId,
      $or: [
        { sender: senderId, receiver: recvId },
        { sender: recvId, receiver: senderId },
      ],
    });

    const involvesSeller = senderId === sellerId || recvId === sellerId;
    if (!involvesSeller && !inExistingThread) {
      return res.status(400).json({ message: 'You can only message the seller of this listing' });
    }

    const message = await Message.create({
      product: productId,
      sender: senderId,
      receiver: recvId,
      text: text.trim(),
    });

    await message.populate('sender', 'name role avatarUrl');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

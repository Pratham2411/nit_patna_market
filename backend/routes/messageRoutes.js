const router = require('express').Router();
const Message = require('../models/Message');
const Product = require('../models/Product');
const ItemRequest = require('../models/ItemRequest');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { sendNewMessageEmail } = require('../utils/resendEmail');
const NotificationQueue = require('../models/NotificationQueue');

const userFields = 'name role avatarUrl';
const productFields = 'title imageUrl imageUrls status price seller';
const requestFields = 'title description category status requester';

const buildProductUrl = (productId) => `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${productId}`;

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
      .populate('sender', userFields)
      .populate('receiver', userFields)
      .populate('product', productFields)
      .populate({
        path: 'itemRequest',
        select: requestFields,
        populate: { path: 'requester', select: userFields },
      })
      .sort({ createdAt: -1 });

    const convMap = new Map();
    for (const msg of messages) {
      if (!msg.sender || !msg.receiver) continue;

      const otherUser = String(msg.sender._id) === userId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      if (msg.product) {
        const key = `product:${msg.product._id}:${otherUser._id}`;

        if (!convMap.has(key)) {
          const sellerId = String(msg.product.seller?._id || msg.product.seller);
          const myRole = sellerId === userId ? 'seller' : 'buyer';
          const otherRole = myRole === 'seller' ? 'buyer' : 'seller';

          convMap.set(key, {
            contextType: 'product',
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

        if (!msg.read && String(msg.receiver._id) === userId) {
          convMap.get(key).unread++;
        }
        continue;
      }

      if (msg.itemRequest) {
        const key = `request:${msg.itemRequest._id}:${otherUser._id}`;

        if (!convMap.has(key)) {
          const requesterId = String(msg.itemRequest.requester?._id || msg.itemRequest.requester);
          const myRole = requesterId === userId ? 'requester' : 'provider';
          const otherRole = myRole === 'requester' ? 'provider' : 'requester';

          convMap.set(key, {
            contextType: 'request',
            itemRequest: msg.itemRequest,
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

        if (!msg.read && String(msg.receiver._id) === userId) {
          convMap.get(key).unread++;
        }
      }
    }

    res.json([...convMap.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/request/:requestId/:otherUserId', auth, async (req, res) => {
  try {
    const { requestId, otherUserId } = req.params;
    const userId = String(req.user.id);

    const itemRequest = await ItemRequest.findById(requestId);
    if (!itemRequest) return res.status(404).json({ message: 'Request not found' });

    const messages = await Message.find({
      itemRequest: requestId,
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate('sender', userFields)
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { itemRequest: requestId, sender: otherUserId, receiver: userId, read: false },
      { read: true }
    );

    res.json(messages);
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
      .populate('sender', userFields)
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
    const { productId, itemRequestId, receiverId, text } = req.body;

    if ((!productId && !itemRequestId) || (productId && itemRequestId) || !receiverId || !text?.trim()) {
      return res.status(400).json({ message: 'One conversation context, receiverId, and text are required' });
    }

    const senderId = String(req.user.id);
    const recvId = String(receiverId);

    if (senderId === recvId) {
      return res.status(400).json({ message: 'You cannot message yourself' });
    }

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const sellerId = String(product.seller);
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

      await message.populate('sender', userFields);

      const receiver = await User.findById(recvId).select('email name');
      if (receiver) {
        await NotificationQueue.create({
          user: recvId,
          category: 'inbox',
          message: `New message from ${req.user.name || 'A user'} about ${product.title}`,
          relatedUrl: buildProductUrl(productId)
        });
      }

      return res.status(201).json(message);
    }

    const itemRequest = await ItemRequest.findById(itemRequestId);
    if (!itemRequest) return res.status(404).json({ message: 'Request not found' });

    const requesterId = String(itemRequest.requester);
    const inExistingThread = await Message.exists({
      itemRequest: itemRequestId,
      $or: [
        { sender: senderId, receiver: recvId },
        { sender: recvId, receiver: senderId },
      ],
    });

    if (senderId === requesterId && !inExistingThread) {
      return res.status(400).json({ message: 'Requesters can only reply to existing request conversations' });
    }

    if (senderId !== requesterId && recvId !== requesterId && !inExistingThread) {
      return res.status(400).json({ message: 'You can only message the requester for this item request' });
    }

    const message = await Message.create({
      itemRequest: itemRequestId,
      sender: senderId,
      receiver: recvId,
      text: text.trim(),
    });

    await message.populate('sender', userFields);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
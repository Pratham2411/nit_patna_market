const router = require('express').Router();
const ItemRequest = require('../models/ItemRequest');
const Message = require('../models/Message');
const RequestContact = require('../models/RequestContact');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { sendRequestOfferEmail } = require('../utils/resendEmail');
const NotificationQueue = require('../models/NotificationQueue');

const REQUEST_CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'];
const REQUEST_STATUSES = ['open', 'fulfilled'];
const REQUESTER_PUBLIC_FIELDS = 'name avatarUrl isVerifiedStudent phone';
const REQUESTER_CONTACT_FIELDS = `${REQUESTER_PUBLIC_FIELDS} email`;
const REQUEST_MESSAGE_TEXT = (requestTitle) => `Hi, I have "${requestTitle}". Let's discuss it here.`;
const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const getConversationUrl = (requestId, requesterId) => `/messages?request=${requestId}&user=${requesterId}`;
const getConversationFullUrl = (requestId, requesterId) => `${getFrontendUrl()}${getConversationUrl(requestId, requesterId)}`;

// GET all item requests
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status) {
      if (!REQUEST_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid request status' });
      }
      query.status = status;
    }
    if (category) {
      if (!REQUEST_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Invalid request category' });
      }
      query.category = category;
    }

    const requests = await ItemRequest.find(query)
      .populate('requester', req.user ? REQUESTER_CONTACT_FIELDS : REQUESTER_PUBLIC_FIELDS)
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new item request
router.post('/', auth, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const category = req.body.category || 'Other';

    if (!req.user.phone) {
      return res.status(400).json({ message: 'Please add a valid phone number in your profile before listing or requesting items.' });
    }

    if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });
    if (!REQUEST_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid request category' });
    }

    const request = await ItemRequest.create({
      title,
      description,
      category,
      requester: req.user.id
    });

    await request.populate('requester', REQUESTER_CONTACT_FIELDS);
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const request = await ItemRequest.findById(req.params.id)
      .populate('requester', req.user ? REQUESTER_CONTACT_FIELDS : REQUESTER_PUBLIC_FIELDS);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/contact', auth, async (req, res) => {
  try {
    const providerId = String(req.user.id);
    const request = await ItemRequest.findById(req.params.id).populate('requester', REQUESTER_CONTACT_FIELDS);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'open') return res.status(400).json({ message: 'This request is already fulfilled' });

    const requesterId = String(request.requester?._id || request.requester);
    if (providerId === requesterId) {
      return res.status(400).json({ message: 'You cannot contact yourself for your own request' });
    }

    const conversationUrl = getConversationUrl(request._id, requesterId);
    const existingContact = await RequestContact.findOne({ itemRequest: request._id, provider: providerId });
    if (existingContact) {
      return res.json({ alreadyContacted: true, conversationUrl, requesterId });
    }

    let contact;
    try {
      contact = await RequestContact.create({
        itemRequest: request._id,
        provider: providerId,
        requester: requesterId,
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.json({ alreadyContacted: true, conversationUrl, requesterId });
      }
      throw err;
    }

    let message;
    try {
      message = await Message.create({
        itemRequest: request._id,
        sender: providerId,
        receiver: requesterId,
        text: REQUEST_MESSAGE_TEXT(request.title),
      });
    } catch (err) {
      await RequestContact.deleteOne({ _id: contact._id });
      throw err;
    }

    contact.initialMessage = message._id;
    contact.notifiedAt = new Date();
    await contact.save();

    await NotificationQueue.create({
      user: requesterId,
      category: 'request',
      message: `${req.user.name} can help with your request: ${request.title}`,
      relatedUrl: getConversationUrl(request._id, providerId)
    });



    await message.populate('sender', 'name role avatarUrl');
    res.status(201).json({ alreadyContacted: false, conversationUrl, requesterId, message });
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

    await Promise.all([
      Message.deleteMany({ itemRequest: request._id }),
      RequestContact.deleteMany({ itemRequest: request._id }),
      request.deleteOne(),
    ]);
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH item request status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!REQUEST_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid request status' });
    }

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
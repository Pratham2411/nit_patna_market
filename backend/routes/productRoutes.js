const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

const placeholder = (title) =>
  `https://picsum.photos/seed/${encodeURIComponent(title || Date.now())}/600/400`;

const canManageProduct = (product, user) =>
  product.seller.toString() === user.id || user.isAdmin;

router.get('/my/listings', auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, status } = req.query;
    const query = { isSpam: false };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    query.status = status || 'available';

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .populate('seller', 'name role avatarUrl')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email role avatarUrl');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.isSpam) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    if (!title || !description || !price || !category)
      return res.status(400).json({ message: 'All fields are required' });

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : placeholder(title);

    const product = await Product.create({
      title, description, price: Number(price), category, imageUrl,
      seller: req.user.id,
    });
    await product.populate('seller', 'name role avatarUrl');
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!canManageProduct(product, req.user))
      return res.status(403).json({ message: 'Not authorized to edit this listing' });

    const { title, description, price, category } = req.body;
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (req.file) product.imageUrl = `/uploads/${req.file.filename}`;

    await product.save();
    await product.populate('seller', 'name role avatarUrl');
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    product.status = req.body.status === 'available' ? 'available' : 'sold';
    await product.save();
    await product.populate('seller', 'name email role avatarUrl');
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!canManageProduct(product, req.user))
      return res.status(403).json({ message: 'Not authorized to delete this listing' });

    if (product.imageUrl?.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', product.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await product.deleteOne();
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

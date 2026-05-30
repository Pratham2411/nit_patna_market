const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { createUpload } = require('../middleware/multerUpload');
const {
  MAX_PRODUCT_IMAGES,
  getProductImageList,
  formatProductImages,
  unlinkProductImages,
  parseKeepImages,
  saveUploadedFiles,
} = require('../utils/productImages');
const { deleteStoredImage } = require('../utils/imageStorage');

const uploadImages = createUpload(MAX_PRODUCT_IMAGES, 5).array('images', MAX_PRODUCT_IMAGES);

const canManageProduct = (product, user) =>
  product.seller.toString() === user.id || user.isAdmin;

const respondProduct = (res, product, status = 200) =>
  res.status(status).json(formatProductImages(product));

router.get('/my/listings', auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(products.map(formatProductImages));
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

    res.json(products.map(formatProductImages));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email role avatarUrl');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.isSpam) return res.status(404).json({ message: 'Product not found' });
    respondProduct(res, product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, uploadImages, async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    if (!title || !description || !price || !category)
      return res.status(400).json({ message: 'All fields are required' });

    const files = req.files || [];
    if (!files.length)
      return res.status(400).json({ message: 'At least one product photo is required' });

    if (files.length > MAX_PRODUCT_IMAGES)
      return res.status(400).json({ message: `Maximum ${MAX_PRODUCT_IMAGES} photos allowed` });

    const imageUrls = await saveUploadedFiles(files);

    const product = await Product.create({
      title,
      description,
      price: Number(price),
      category,
      imageUrls,
      seller: req.user.id,
    });
    await product.populate('seller', 'name role avatarUrl');
    respondProduct(res, product, 201);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, uploadImages, async (req, res) => {
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

    const previousImages = getProductImageList(product);
    const keepImages = parseKeepImages(req.body);
    const newImages = await saveUploadedFiles(req.files);
    const nextImages = [...keepImages, ...newImages];

    if (!nextImages.length)
      return res.status(400).json({ message: 'Keep at least one photo or upload a new one' });

    if (nextImages.length > MAX_PRODUCT_IMAGES)
      return res.status(400).json({ message: `Maximum ${MAX_PRODUCT_IMAGES} photos allowed` });

    const removed = previousImages.filter((url) => !nextImages.includes(url));
    await Promise.all(removed.map(deleteStoredImage));

    product.imageUrls = nextImages;
    await product.save();
    await product.populate('seller', 'name role avatarUrl');
    respondProduct(res, product);
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
    respondProduct(res, product);
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

    await unlinkProductImages(product);
    await product.deleteOne();
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

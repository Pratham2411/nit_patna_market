const {
  uploadFiles,
  deleteStoredImage,
  isValidStoredImageUrl,
} = require('./imageStorage');

const MAX_PRODUCT_IMAGES = 8;

const getProductImageList = (product) => {
  if (!product) return [];
  const urls = product.imageUrls;
  if (Array.isArray(urls) && urls.length > 0) {
    return urls.filter((u) => typeof u === 'string' && u.trim());
  }
  if (product.imageUrl && typeof product.imageUrl === 'string') {
    return [product.imageUrl];
  }
  return [];
};

const formatProductImages = (product) => {
  const doc = product?.toObject ? product.toObject() : { ...product };
  const imageUrls = getProductImageList(doc);
  return {
    ...doc,
    imageUrls,
    imageUrl: imageUrls[0] || '',
  };
};

const unlinkProductImage = (imageUrl) => deleteStoredImage(imageUrl);

const unlinkProductImages = (product) =>
  Promise.all(getProductImageList(product).map(deleteStoredImage));

const parseKeepImages = (body) => {
  const raw = body?.keepImages;
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidStoredImageUrl);
  } catch {
    return [];
  }
};

const saveUploadedFiles = (files) => uploadFiles(files, 'products');

module.exports = {
  MAX_PRODUCT_IMAGES,
  getProductImageList,
  formatProductImages,
  unlinkProductImage,
  unlinkProductImages,
  parseKeepImages,
  saveUploadedFiles,
};

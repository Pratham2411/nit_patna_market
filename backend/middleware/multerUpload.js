const multer = require('multer');

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

const memoryStorage = multer.memoryStorage();

const createUpload = (maxFiles, maxSizeMb = 5) =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: imageFilter,
  });

module.exports = { createUpload };

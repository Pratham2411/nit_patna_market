const cloudinary = require('cloudinary').v2;

const isCloudinaryEnabled = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

let configured = false;

const initCloudinary = () => {
  if (!isCloudinaryEnabled()) return false;
  if (configured) return true;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return true;
};

module.exports = { cloudinary, isCloudinaryEnabled, initCloudinary };

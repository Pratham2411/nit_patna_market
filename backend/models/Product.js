const mongoose = require('mongoose');

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'];

const productSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, required: true, enum: CATEGORIES },
    imageUrls:   { type: [String], default: [] },
    imageUrl:    { type: String, default: '' },
    seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:      { type: String, enum: ['available', 'sold'], default: 'available' },
    isSpam:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.pre('save', function syncPrimaryImage(next) {
  if (this.imageUrls?.length) {
    this.imageUrl = this.imageUrls[0];
  } else {
    this.imageUrl = '';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

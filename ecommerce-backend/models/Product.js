const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, default: null },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' }, // Added for subcategory
  nestedCategory: { type: String, default: '' }, // Added for nested category
  description: { type: String },
  offer: { type: String },
  sizes: [String],
  seller: { type: String },
  specifications: { type: Object, default: {} },
  warranty: { type: String },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  dealTag: { type: String },
  brand: { type: String },
  weight: { type: Number, default: null },
  weightUnit: { type: String, default: 'kg' },
  model: { type: String },
  image: { type: String, required: true },
  images: [String],
  variants: [
    {
      variantId: { type: String, required: true },
      mainImage: { type: String },
      additionalImages: [String],
      specifications: { type: Object, default: {} },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);




















/* const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, default: null },
  stock: { type: Number, required: true },
  category: { type: String, required: true }, // Now stores the full path, e.g., "Fashion/Men/Top Wear"
  description: { type: String },
  offer: { type: String },
  sizes: [String],
  seller: { type: String },
  specifications: { type: Object, default: {} },
  warranty: { type: String },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  dealTag: { type: String },
  brand: { type: String },
  weight: { type: Number, default: null },
  weightUnit: { type: String, default: 'kg' },
  model: { type: String },
  image: { type: String, required: true },
  images: [String],
  variants: [
    {
      variantId: { type: String, required: true },
      mainImage: { type: String },
      additionalImages: [String],
      specifications: { type: Object, default: {} },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Remove subcategory and nestedCategory fields
module.exports = mongoose.model('Product', productSchema); */




























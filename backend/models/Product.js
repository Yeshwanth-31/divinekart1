// backend/models/Product.js
const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  material: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  dimensions: {
    height: { type: Number, required: true },
    width: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  weight: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
  },
  imageUrl: {
    type: String,
    required: true,
  },
  directDelivery: {
    type: Boolean,
    default: false,
  },
  priceNotes: {
    type: String,
  },
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  variants: [variantSchema],
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

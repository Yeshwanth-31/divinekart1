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
    height: {
      value: { type: Number },
      unit: { type: String, enum: ['cm', 'inches', 'meters'], default: 'inches' }
    },
    width: {
      value: { type: Number },
      unit: { type: String, enum: ['cm', 'inches', 'meters'], default: 'inches' }
    },
    depth: {
      value: { type: Number },
      unit: { type: String, enum: ['cm', 'inches', 'meters'], default: 'inches' }
    }
  },
  weight: {
    value: { type: Number },
    unit: { type: String, default: 'kg' },
  },
  imageUrl: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  directDelivery: {
    type: Boolean,
    default: false,
  },
  priceNotes: {
    type: String,
  },
  customFields: [
    {
      label: { type: String },
      value: { type: String }
    }
  ],
  showInStore: {
    type: Boolean,
    default: true
  },
  productId: {
    type: String,
    required: true,
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  }],
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

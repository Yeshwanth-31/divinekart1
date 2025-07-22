const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');  // Assuming upload middleware handles Cloudinary upload
const Product = require('../models/Product');
const Category = require('../models/Category'); // Add this import
// const auth = require('../middleware/auth');
// const admin = require('../middleware/admin');

// Get all products (optionally filter by category name or id)
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.query.category) {
      // Try to match by ObjectId or by category name
      const cats = await Category.find({
        $or: [
          { _id: req.query.category },
          { name: req.query.category }
        ]
      });
      if (cats.length > 0) {
        query.category = { $in: cats.map(c => c._id) };
      } else {
        // No matching category, return empty
        return res.json([]);
      }
    }
    // --- SEARCH SUPPORT ---
    if (req.query.search) {
      const s = req.query.search.trim();
      // Case-insensitive partial match for name, material, or category name
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { 'variants.material': { $regex: s, $options: 'i' } },
      ];
      // For category name, need to join with Category collection, so handled below with populate+filter
    }
    // --- PAGINATION SUPPORT ---
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    let products = await Product.find(query)
      .populate('category')
      .skip(skip)
      .limit(limit);

    // If searching by category name, filter after populate
    if (req.query.search) {
      const s = req.query.search.trim().toLowerCase();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.variants || []).some(v => v.material && v.material.toLowerCase().includes(s)) ||
        (Array.isArray(p.category)
          ? p.category.some(cat => typeof cat === 'object' && cat && cat.name && cat.name.toLowerCase().includes(s))
          : (typeof p.category === 'object' && p.category && p.category.name && p.category.name.toLowerCase().includes(s))
        )
      );
    }

    // Optionally, send total count for frontend pagination
    // const total = await Product.countDocuments(query);

    // res.json({ products, total });
    // Option 2: To return just array (uncomment below and comment above if you want old behavior)
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product (no auth)
router.post('/', async (req, res) => {
  try {
    let { name, description, category, variants } = req.body;
    // category can be array or string
    if (!Array.isArray(category)) category = [category];
    // Validate all categories exist
    const cats = await Category.find({ _id: { $in: category } });
    if (cats.length !== category.length) return res.status(400).json({ message: 'Invalid category' });
    const catPrefix = cats[0].name.substring(0, 2).toUpperCase();
    const material = variants[0]?.material || '';
    const matPrefix = material.substring(0, 2).toUpperCase();
    const count = await Product.countDocuments({
      category: { $in: category },
      'variants.material': material
    });
    const itemNum = (count + 1).toString().padStart(3, '0');
    const mainProductId = `${catPrefix}${matPrefix}${itemNum}`;

    const variantIds = 'abcdefghijklmnopqrstuvwxyz';
    const variantsWithId = variants.map((v, idx) => ({
      ...v,
      productId: `${mainProductId}-${variantIds[idx] || idx + 1}`
    }));

    const product = new Product({
      name,
      productId: mainProductId,
      description,
      category,
      variants: variantsWithId
    });
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product (no auth)
router.put('/:id', async (req, res) => {
  try {
    let { name, description, category, variants } = req.body;
    if (!Array.isArray(category)) category = [category];
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Validate all categories exist
    const cats = await Category.find({ _id: { $in: category } });
    if (cats.length !== category.length) return res.status(400).json({ message: 'Invalid category' });

    let productId = product.productId;
    let catChanged = false;
    if (category && String(product.category[0]) !== String(category[0])) {
      catChanged = true;
    }
    if (catChanged || (variants && variants[0] && variants[0].material && variants[0].material !== product.variants[0].material)) {
      const catPrefix = cats[0].name.substring(0, 2).toUpperCase();
      const matPrefix = (variants[0].material || '').substring(0, 2).toUpperCase();
      const count = await Product.countDocuments({
        category: { $in: category },
        'variants.material': variants[0].material
      });
      const itemNum = (count + 1).toString().padStart(3, '0');
      productId = `${catPrefix}${matPrefix}${itemNum}`;
    }
    const variantIds = 'abcdefghijklmnopqrstuvwxyz';
    const variantsWithId = variants.map((v, idx) => ({
      ...v,
      productId: `${productId}-${variantIds[idx] || idx + 1}`
    }));

    product.name = name;
    product.description = description;
    product.category = category;
    product.variants = variantsWithId;
    product.productId = productId;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product (no auth)
router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    // Remove product from all carts (optional, if you want to allow deletion)
    // const Cart = require('../models/Cart');
    // await Cart.updateMany({}, { $pull: { items: { product: productId } } });

    // Delete the product and its variants (variants are embedded)
    const deleted = await Product.findByIdAndDelete(productId);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// Delete a variant from a product
router.delete('/:id/variant/:variantIdx', async (req, res) => {
  try {
    const { id, variantIdx } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const idx = parseInt(variantIdx, 10);
    if (isNaN(idx) || idx < 0 || idx >= product.variants.length) {
      return res.status(400).json({ message: 'Invalid variant index' });
    }
    if (product.variants.length === 1) {
      return res.status(400).json({ message: 'At least one variant is required.' });
    }
    product.variants.splice(idx, 1);
    await product.save();
    res.json({ message: 'Variant deleted', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId }).populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search products by name, material, or category (case-insensitive)
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) return res.json([]);
  const regex = new RegExp(q, 'i');
  try {
    const products = await Product.find({
      $or: [
        { name: regex },
        { 'variants.material': regex },
        { category: regex }
      ]
    }).populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
});

// Get related products by product id (same category, exclude self)
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Find other products in any of the same categories, exclude self
    const related = await Product.find({
      _id: { $ne: product._id },
      category: { $in: product.category.map(cat => cat._id || cat) }
    })
    .limit(12)
    .populate('category');

    res.json(related);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
});

// No changes needed for minicart functionality

module.exports = router;

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');  // Assuming upload middleware handles Cloudinary upload
const Product = require('../models/Product');

// ✅ GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST new product with image (Image uploaded to Cloudinary)
// routes/productroutes.js
router.post('/', async (req, res) => {
  try {
    const { name, category, material, price, description, image } = req.body;

    if (!name || !category || !material || !price || !description || !image) {
      return res.status(400).json({ error: 'All fields are required including image URL' });
    }

    const newProduct = new Product({
      name,
      category,
      material,
      price,
      description,
      imageUrl: image, // ⬅️ save image URL
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ error: 'Error saving product' });
  }
});


// ✅ UPDATE product
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching product' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
// const auth = require('../middleware/auth');
// const admin = require('../middleware/admin');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new category (no auth)
router.post('/', async (req, res) => {
  try {
    const { name, description, materials } = req.body;
    const category = new Category({
      name,
      description,
      materials
    });
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a category (no auth)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, materials } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name;
    category.description = description;
    category.materials = materials;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a category (no auth)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err); // Add logging for debugging
    res.status(500).json({ message: err.message || 'Failed to delete category' });
  }
});

// Get category by name (for frontend filter)
router.get('/name/:name', async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.params.name });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
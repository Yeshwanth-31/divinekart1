const Category = require('../models/Category');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const exists = await Category.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Category already exists' });
    const category = new Category({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category' });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};
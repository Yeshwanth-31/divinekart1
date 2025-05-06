const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories
router.get('/', categoryController.getCategories);
// Create a new category
router.post('/', categoryController.createCategory);
// Delete a category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router; 
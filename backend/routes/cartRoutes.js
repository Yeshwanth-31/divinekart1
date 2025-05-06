const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addToCart);
router.get('/', protect, getCart);
router.post('/remove', protect, removeFromCart);
router.post('/update', protect, updateQuantity);

module.exports = router;

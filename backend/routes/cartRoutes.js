const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity
} = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, addToCart);
router.get('/', authMiddleware, getCart);
router.post('/remove', authMiddleware, removeFromCart);
router.post('/update', authMiddleware, updateQuantity); // 👈 New route

module.exports = router;

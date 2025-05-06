const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const cartController = require('../controllers/cartController');

// Get all orders (admin only)
router.get('/', orderController.getAllOrders);

// Create a new order (user)
router.post('/', orderController.createOrder);

// Clear cart (admin only)
// router.post('/clear', cartController.clearCart);

module.exports = router;
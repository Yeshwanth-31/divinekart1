const Order = require('../models/Order');
const User = require('../models/User');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { name, address, items, totalAmount, paymentMethod, razorpayPaymentId } = req.body;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    // Parse address (assume string for now)
    const shippingAddress = { street: address };
    const order = new Order({
      user: userId,
      items: items.map(item => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      status: 'pending',
      shippingAddress: address,
      paymentMethod: paymentMethod || 'upi',
      paymentStatus: 'pending',
      razorpayPaymentId // store if provided
    });
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create order' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'email name')
      .populate('items.product', 'name price imageUrl');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};
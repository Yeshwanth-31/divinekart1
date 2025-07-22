const mongoose = require('mongoose');
const Cart = require('../models/Cart');

exports.addToCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity = 1 } = req.body;

  try {
    const prodObjectId = new mongoose.Types.ObjectId(productId);
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ productId: prodObjectId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(item =>
        item.productId.equals(prodObjectId)
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId: prodObjectId, quantity });
      }
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error('❌ Cart save error:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

exports.getCart = async (req, res) => {
  const userId = req.user._id;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

exports.removeFromCart = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => !item.productId.equals(productId));
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

exports.updateQuantity = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.find(item => item.productId.equals(productId));
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.quantity = quantity;
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    console.error("❌ Failed to update quantity:", err);
    res.status(500).json({ error: "Failed to update cart item quantity" });
  }
};
// No changes needed if protect middleware is used and working


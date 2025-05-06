const User = require('../models/User');
const Order = require('../models/Order');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user details
    const user = await User.findById(userId).select('-password');
    
    // Get order statistics
    const orders = await Order.find({ user: userId });
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    // Get recent orders
    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product', 'name image price');
    
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        location: user.location,
        joinedDate: user.createdAt,
      },
      stats: {
        totalOrders,
        totalSpent,
        pendingOrders,
        completedOrders,
      },
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, password, location } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    if (location !== undefined) {
      user.location = location;
    }
    if (password) {
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({ 
        success: false, 
        message: 'Location is required' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { location },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        name: user.name,
        email: user.email,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating location' 
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateLocation
}; 
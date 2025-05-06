const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, updateLocation } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/update-location', protect, updateLocation);

module.exports = router; 
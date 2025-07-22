const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// ...existing code...

router.post('/signup', async (req, res) => {
  const { email, name, password, address, city, state, zip, phone } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      name,
      password: hashedPassword,
      address,
      city,
      state,
      zip,
      phone
    });

    // ...existing code...
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ...existing code...

module.exports = router;
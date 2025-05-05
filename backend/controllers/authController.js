const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: 'User already exists' });
  
      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashed });
  
      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({
        token,
        user: { name: newUser.name, email: newUser.email, id: newUser._id }
      });
    } catch (err) {
      res.status(500).json({ error: 'Signup failed' });
    }
  };
  
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
        token,
        user: { name: user.name, email: user.email, id: user._id }
      });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

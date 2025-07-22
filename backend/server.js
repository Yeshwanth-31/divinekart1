const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Check for required environment variables
if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error('❌ Missing required environment variables. Check .env file.');
  process.exit(1);
}

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ Connection Error:', err.message);
  console.log('Please check your MongoDB credentials in .env file');
});

// ✅ Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Frontend origins
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('✅ Backend is working!');
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
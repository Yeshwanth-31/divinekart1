const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  mobile: { type: String },
  pincode: { type: String },
  doorNo: { type: String },
  street: { type: String },
  landmark: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: addressSchema }, // Change from String to addressSchema
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from "qrcode.react";
import './CartPage.css';
import { setCartItems } from '../redux/cartSlice';
import axios from 'axios';

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setName(parsed.name || '');
      setAddress(parsed.location || '');
    }
  }, []);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const handlePay = (e) => {
    e.preventDefault();
    setShowQR(true);
  };

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Create the order
      const orderRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          address,
          items: cartItems,
          totalAmount: totalPrice,
          paymentMethod: 'upi',
        }),
      });
      
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.message || 'Order failed');

      // 2. Clear the cart in the backend
      await axios.post('http://localhost:5000/api/cart/clear', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Clear the cart in Redux store
      dispatch(clearCart());
      
      setOrderPlaced(true);
      setShowQR(false);
      alert('Order placed successfully!');
      navigate('/');
    } catch (err) {
      console.error('❌ Order placement error:', err);
      setError(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !showQR) {
    return (
      <div className="checkout-container">
        <h2 className="checkout-title">Checkout</h2>
        <p>Your cart is empty.</p>
        <button className="checkout-btn" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Checkout</h2>
      {error && <div className="error-message">{error}</div>}
      <form className="checkout-form" onSubmit={handlePay}>
        <div className="checkout-fields">
          <div className="checkout-field">
            <label>Name:</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="checkout-field">
            <label>Address:</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={3} style={{resize:'vertical'}} />
          </div>
        </div>
        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {cartItems.map((item, idx) => (
            <div className="checkout-item" key={item._id + '-' + idx}>
              <span className="checkout-item-name"><strong>{item.name}</strong> x{item.quantity}</span>
              <span className="checkout-item-material">Material: {item.material}</span>
              <span className="checkout-item-price">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="checkout-total">Total: ₹{totalPrice.toFixed(2)}</div>
        </div>
        <button className="checkout-btn" type="submit" disabled={loading}>{loading ? 'Processing...' : 'Pay'}</button>
      </form>
      {showQR && (
        <div className="qr-modal-overlay">
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <h2>Scan to Pay</h2>
            <QRCodeCanvas value={`upi://pay?pa=8438936237@ptyes&pn=DivineKart&am=${totalPrice}&tn=Order%20Payment`} size={220} />
            <button className="checkout-btn" style={{marginTop: '18px'}} onClick={handlePlaceOrder} disabled={loading}>
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout; 
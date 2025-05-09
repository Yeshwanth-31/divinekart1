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
            <div className="checkout-item" key={item._id + '-' + idx} style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
              <img src={item.imageUrl} alt={item.name} style={{width:60,height:60,objectFit:'cover',borderRadius:8,background:'#f4e9db'}} />
              <div style={{flex:1}}>
                <div className="checkout-item-name"><strong>{item.name}</strong> x{item.quantity}</div>
                <div className="checkout-item-material">Material: {item.material}</div>
                <div>Dimensions: {item.dimensions ? `${item.dimensions.height} x ${item.dimensions.width} x ${item.dimensions.depth} cm` : '-'}</div>
                <div>Weight: {item.weight ? `${item.weight.value} ${item.weight.unit}` : '-'}</div>
                {item.directDelivery && <div style={{color:'#388e3c'}}><strong>Direct Delivery Available</strong></div>}
                {item.priceNotes && <div>Price Notes: {item.priceNotes}</div>}
                <div className="checkout-item-price">Price: ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</div>
              </div>
            </div>
          ))}
          <div className="checkout-total">Total: ₹{totalPrice.toFixed(2)}</div>
        </div>
        <button className="checkout-btn" type="submit" disabled={loading}>{loading ? 'Processing...' : 'Pay'}</button>
      </form>
      {showQR && (
        <div className="qr-modal-overlay">
          <div className="qr-modal" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 24px 24px 24px',
            background: '#fff',
            borderRadius: '18px',
            boxShadow: '0 4px 24px #b4884d22',
            minWidth: '340px',
            minHeight: '340px',
            position: 'relative',
            margin: '0 auto',
            maxWidth: '90vw',
          }}>
            <h2 style={{
              marginBottom: '18px',
              color: '#b4884d',
              fontSize: '2rem',
              textAlign: 'center',
            }}>Scan to Pay</h2>
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',width:'100%'}}>
              <QRCodeCanvas value={`upi://pay?pa=8438936237@ptyes&pn=DivineKart&am=${totalPrice}&tn=Order%20Payment`} size={220} />
            </div>
            <button className="checkout-btn" style={{
              marginTop: '24px',
              width: '80%',
              background: '#b4884d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 0',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s',
              alignSelf: 'center',
            }} onClick={handlePlaceOrder} disabled={loading}>
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout; 
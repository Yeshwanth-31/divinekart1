import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { QRCodeCanvas } from "qrcode.react";
import './CartPage.css';
import { setCartItems, clearCart } from '../redux/cartSlice';
import axios from 'axios';
import LoginPopup from '../components/LoginPopup';
import logoImg from '../assets/logo.png';
import { FaUserCircle } from 'react-icons/fa';

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [username, setUsername] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState({});
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Autofill user details from backend (prefer) or localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/users/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const user = res.data.user || {};
          setEmail(user.email || '');
          setName(user.name || '');
          setUsername(user.name || '');
          setUserData({
            email: user.email || '',
            name: user.name || '',
            phone: user.address?.mobile || '',
          });
          // Address fields
          const addr = user.address || {};
          setAddress(addr);
          setCity(addr.city || '');
          setStateVal(addr.state || '');
          setZip(addr.pincode || '');
          setPhone(addr.mobile || '');
        })
        .catch(() => {
          // fallback to localStorage if backend fails
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsed = JSON.parse(userData);
            setEmail(parsed.email || '');
            setName(parsed.name || '');
            setUsername(parsed.name || '');
            const addr = parsed.address || {};
            setAddress(addr);
            setCity(addr.city || '');
            setStateVal(addr.state || '');
            setZip(addr.pincode || '');
            setPhone(addr.mobile || '');
          }
        });
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
          email,
          name,
          address, // send as object
          items: cartItems,
          totalAmount: totalPrice,
          paymentMethod: 'upi',
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.message || 'Order failed');
      await axios.post('http://localhost:5000/api/cart/clear', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(clearCart());
      setOrderPlaced(true);
      setShowQR(false);
      alert('Order placed successfully!');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/payment/create-order',
        { amount: totalPrice },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const options = {
        key: response.data.key_id,
        amount: response.data.order.amount,
        currency: response.data.order.currency,
        name: "Divine Kart",
        description: `Order payment - ₹${totalPrice}`,
        order_id: response.data.order.id,
        handler: async function (paymentResponse) {
          await handlePlaceOrder(paymentResponse); // Pass payment details if needed
        },
        prefill: {
          name: name,
          email: userData.email,
          contact: userData.phone
        },
        notes: {
          address: [
            address?.doorNo,
            address?.street,
            address?.landmark,
            address?.city,
            address?.state,
            address?.pincode,
            address?.country
          ].filter(Boolean).join(', ')
        },
        theme: {
          color: "#b4884d"
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Error initiating payment.');
    }
  };

  // Helper to check login
  const isLoggedIn = () => !!localStorage.getItem('token');

  // Handle login success
  const handleLoginSuccess = () => {
    setShowLogin(false);
    setPendingCheckout(false);
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      setShowLogin(true);
      setPendingCheckout(true);
    }
  }, []);

  if (showLogin) {
    return (
      <LoginPopup
        onClose={() => navigate('/cart')}
        onLoginSuccess={handleLoginSuccess}
        redirectTo={location.pathname + location.search}
      />
    );
  }

  if (cartItems.length === 0 && !showQR) {
    return (
      <div className="checkout-bg">
        <h2 className="checkout-title">Checkout</h2>
        <p>Your cart is empty.</p>
        <button className="checkout-btn" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="checkout-bg" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#fcf6e8 0%,#f9ecd2 100%)',
      padding: '0',
      fontFamily: "'Poppins', sans-serif"
    }}>
      {/* Navbar same as HomePage */}
      <nav className="navbar navbar-sticky">
        <h1 className="logo" style={{display:'flex',alignItems:'center',gap:12,margin:0}}>
          <img
            src={logoImg}
            alt="Divine Kart Logo"
            style={{
              height: 70,
              width: 70,
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: 14,
              background: '#fff'
            }}
          />
          <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#b4884d', letterSpacing: 1 }}>Divine Kart</span>
        </h1>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" className="nav-link" style={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: '#5c3a1e',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}>Home</Link>
          <Link to="/cart" className="nav-link" style={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: '#5c3a1e',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}>Cart</Link>
          {/* Profile dropdown like HomePage */}
          <div
            className="profile-container"
            ref={profileRef}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ marginLeft: 8, position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {username && <span className="username-only">{username}</span>}
            <FaUserCircle size={28} className="profile-icon" />
            {dropdownOpen && (
              <div className="profile-dropdown">
                {!username && (
                  <span className="profile-option" onClick={() => {
                    setShowLogin(true);
                    setDropdownOpen(false);
                  }}>
                    Login
                  </span>
                )}
                {username && (
                  <>
                    <Link to="/profile" className="profile-option" onClick={() => setDropdownOpen(false)}>
                      Profile
                    </Link>
                    <span className="profile-option" onClick={() => {
                      localStorage.removeItem('user');
                      localStorage.removeItem('token');
                      setUsername('');
                      setDropdownOpen(false);
                      navigate('/');
                    }}>
                      Logout
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="navbar-spacer" style={{height:32}} />
      <h2 className="checkout-title" style={{
        fontSize:'2.2rem',
        color:'#b4884d',
        fontWeight:700,
        letterSpacing:1,
        textAlign:'center',
        marginBottom:36,
        marginTop:10,
        fontFamily:"'Playfair Display', serif"
      }}>Checkout</h2>
      {error && <div className="error-message">{error}</div>}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        minHeight: 'calc(100vh - 180px)',
        padding: '0 0 60px 0'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px #b4884d22',
          maxWidth: 1200,
          width: '100%',
          minHeight: 520,
          margin: '0 18px',
          padding: '0',
          overflow: 'hidden',
          gap: 40 // Add horizontal gap between form and summary
        }}>
          {/* Left: Details Form */}
          <form
            className="checkout-form"
            onSubmit={e => { e.preventDefault(); handleRazorpayPayment(); }}
            style={{
              flex: 2,
              padding: '48px 40px 38px 40px',
              background: '#fff',
              borderRight: '1.5px solid #f4e9db',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              minWidth: 340,
              maxWidth: 600
            }}
          >
            <h3 style={{fontSize:'1.35rem',color:'#b4884d',fontWeight:700,marginBottom:18}}>Shipping & Contact Details</h3>
            <div className="checkout-fields" style={{display:'flex',flexDirection:'column',gap:18}}>
              <div className="checkout-field" style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontWeight:600,color:'#b4884d'}}>Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{fontSize:'1.1rem',padding:'12px',borderRadius:8,border:'1px solid #e4c28b',background:'#fff'}}
                  required
                />
              </div>
              <div className="checkout-field" style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontWeight:600,color:'#b4884d'}}>Email Address:</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{fontSize:'1.1rem',padding:'12px',borderRadius:8,border:'1px solid #e4c28b',background:'#fff'}}
                  required
                />
              </div>
              <div className="checkout-field" style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontWeight:600,color:'#b4884d'}}>Mobile:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{fontSize:'1.1rem',padding:'12px',borderRadius:8,border:'1px solid #e4c28b',background:'#fff'}}
                  required
                />
              </div>
              <div className="checkout-field" style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontWeight:600,color:'#b4884d'}}>Address:</label>
                <textarea
                  value={
                    typeof address === 'string'
                      ? address
                      : address
                        ? [
                            address.doorNo,
                            address.street,
                            address.landmark,
                            address.city,
                            address.state,
                            address.pincode,
                            address.country
                          ].filter(Boolean).join(', ')
                        : ''
                  }
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                  style={{resize:'vertical',fontSize:'1.1rem',padding:'12px',borderRadius:8,border:'1px solid #e4c28b',background:'#fff',minHeight:80}}
                  required
                />
              </div>
            </div>
            <button
              className="checkout-btn"
              type="button"
              disabled={loading}
              style={{
                background:'#b4884d',
                color:'#fff',
                border:'none',
                borderRadius:8,
                padding:'14px 0',
                fontSize:'1.1rem',
                fontWeight:600,
                cursor:'pointer',
                marginTop:10,
                letterSpacing:1
              }}
              onClick={handleRazorpayPayment}
            >
              {loading ? 'Processing...' : 'Pay with Razorpay'}
            </button>
          </form>
          {/* Right: Order Summary */}
          <div className="checkout-summary" style={{
            flex: 1,
            background:'#fff',
            borderRadius:'18px',
            margin: '24px 24px 24px 0',
            padding:'38px 32px 38px 32px',
            minWidth:320,
            maxWidth:420,
            boxShadow:'0 2px 8px #b4884d11',
            display:'flex',
            flexDirection:'column',
            gap:18,
            height:'fit-content',
            alignItems: 'center'
          }}>
            <h3 style={{
              color:'#b4884d',
              fontSize:'1.35rem',
              fontWeight:700,
              marginBottom:18,
              fontFamily: "'Playfair Display', serif",
              textAlign: 'center'
            }}>Order Summary</h3>
            <div style={{
              marginBottom:24,
              fontWeight:600,
              fontSize:'1.08rem',
              color:'#a0763b',
              textAlign:'center'
            }}>
              {cartItems.length} Item{cartItems.length > 1 ? 's' : ''} in Cart
            </div>
            <div style={{width:'100%'}}>
              {cartItems.map((item, idx) => (
                <div key={item._id + '-' + idx} style={{
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'center',
                  marginBottom: idx !== cartItems.length - 1 ? 32 : 0,
                  width:'100%'
                }}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width:70,
                      height:70,
                      objectFit:'cover',
                      borderRadius:10,
                      background:'#f4e9db',
                      border:'1px solid #e4c28b',
                      marginBottom:14
                    }}
                  />
                  <div style={{
                    fontWeight:700,
                    fontSize:17,
                    color:'#5c3a1e',
                    marginBottom:6,
                    textAlign:'center',
                    lineHeight:1.3
                  }}>{item.name}</div>
                  <div style={{
                    fontSize:15,
                    color:'#888',
                    marginBottom:2,
                    textAlign:'center'
                  }}>Qty {item.quantity}</div>
                  <div style={{
                    fontSize:17,
                    color:'#b4884d',
                    fontWeight:600,
                    marginBottom:0,
                    textAlign:'center'
                  }}>₹{Number(item.price).toLocaleString()}</div>
                  {idx !== cartItems.length - 1 && (
                    <hr style={{
                      width:'70%',
                      border:'none',
                      borderTop:'1px solid #f4e9db',
                      margin:'22px auto 0 auto'
                    }}/>
                  )}
                </div>
              ))}
            </div>
            <div className="checkout-total" style={{
              fontWeight:700,
              color:'#a76d27',
              marginTop:18,
              fontSize:'1.13rem',
              textAlign:'right',
              width:'100%'
            }}>
              Total: ₹{totalPrice.toLocaleString()}
            </div>
            {showQR && (
              <div className="qr-modal-overlay" style={{
                position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000
              }}>
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
        </div>
      </div>
    </div>
  );
};

export default Checkout;
import React, { useEffect, useState, useRef } from "react";
import "./CartPage.css";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQuantity, setCartItems, setLoading, setError } from "../redux/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';

const Cart = () => {
  const { cartItems, loading, error } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState("");
  const [pincode, setPincode] = useState("");
  const [pinSuggestions, setPinSuggestions] = useState([]);
  const [loadingPin, setLoadingPin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState("");
  const profileRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUsername(parsed.name || '');
      setUserLocation(parsed.location || '');
    }
  }, []);

  useEffect(() => {
    if (pincode.length !== 6 || isNaN(pincode)) {
      setPinSuggestions([]);
      return;
    }
    setLoadingPin(true);
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(res => res.json())
      .then(data => {
        if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          setPinSuggestions(data[0].PostOffice.map(po => ({
            label: `${po.Name}, ${po.District}, ${po.State} (${po.Pincode})`,
            value: `${po.Name}, ${po.District}, ${po.State} (${po.Pincode})`
          })));
        } else {
          setPinSuggestions([]);
        }
        setLoadingPin(false);
      })
      .catch(() => {
        setPinSuggestions([]);
        setLoadingPin(false);
      });
  }, [pincode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUsername('');
    setDropdownOpen(false);
    navigate('/');
  };

  const handleSelectPinSuggestion = (suggestion) => {
    setPincode(suggestion.value);
    setUserLocation(suggestion.value);
    setShowLocationSearch(false);
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const handleQuantityChange = (id, quantity) => {
    if (quantity >= 1) {
      dispatch(updateQuantity({ id, quantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="error-message">{error}</div>
        <Link to="/" className="back-to-shop">← Back to Home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Top Navigation Bar (copied from HomePage) */}
      <nav className="navbar">
        <h1 className="logo" style={{display:'flex',alignItems:'center',gap:8}}>
          🛕 Divine Kart
        </h1>
        <div className="nav-links">
          <Link to="/" className="nav-link" style={{fontWeight:'bold'}}>Home</Link>
          <Link to="/review" className="nav-link">Review</Link>
          <div className="location-search-container">
            <button 
              className="location-search-btn"
              onClick={() => setShowLocationSearch(!showLocationSearch)}
            >
              <FaMapMarkerAlt /> {userLocation || 'Set Location'}
            </button>
            {showLocationSearch && (
              <div className="location-search-dropdown">
                <div className="location-search-input-container">
                  <FaSearch className="location-search-icon" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit pincode..."
                    className="location-search-input"
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <div>
                  {loadingPin && <div>Loading...</div>}
                  {pinSuggestions.map(suggestion => (
                    <div
                      key={suggestion.value}
                      className="suggestion-item"
                      onClick={() => handleSelectPinSuggestion(suggestion)}
                    >
                      {suggestion.label}
                    </div>
                  ))}
                  {!loadingPin && pincode.length === 6 && pinSuggestions.length === 0 && (
                    <div className="suggestion-item">No results found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="profile-container" ref={profileRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
            {username && <span className="username-only">{username}</span>}
            <FaUserCircle size={28} className="profile-icon" />
            {dropdownOpen && (
              <div className="profile-dropdown">
                {!username && (
                  <span className="profile-option" onClick={() => {
                    setDropdownOpen(false);
                  }}>
                    Login
                  </span>
                )}
                <Link to="/profile" className="profile-option" onClick={() => setDropdownOpen(false)}>
                  Profile
                </Link>
                {username && (
                  <>
                    <span className="profile-option" onClick={() => {/* setShowLocationInput(true); */}}>
                      Update Location
                    </span>
                    <span className="profile-option" onClick={handleLogout}>
                      Logout
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* End Top Navigation Bar */}
      <div className="cart-container">
        <h2 className="cart-title">🛒 Your Shopping Cart</h2>
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {cartItems.map((item, index) => (
                <div className="cart-item" key={`${item._id}-${index}`}>
                  <img src={item.imageUrl} alt={item.name} className="cart-img" />
                  <div className="cart-details">
                    <h3>{item.name}</h3>
                    <p><strong>Material:</strong> {item.material}</p>
                    <p><strong>Price:</strong> ₹{item.price}</p>
                    <p><strong>Dimensions:</strong> {item.dimensions ? `${item.dimensions.height} x ${item.dimensions.width} x ${item.dimensions.depth} cm` : '-'}</p>
                    <p><strong>Weight:</strong> {item.weight ? `${item.weight.value} ${item.weight.unit}` : '-'}</p>
                    {item.directDelivery && <p style={{color:'#388e3c'}}><strong>Direct Delivery Available</strong></p>}
                    {item.priceNotes && <p><strong>Price Notes:</strong> {item.priceNotes}</p>}
                    <div className="quantity-controls">
                      <button onClick={() => handleQuantityChange(item._id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>+</button>
                    </div>
                    <p><strong>Subtotal:</strong> ₹{item.price * item.quantity}</p>
                    <button className="remove-btn" onClick={() => handleRemoveItem(item._id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Total: ₹{totalPrice.toFixed(2)}</h3>
              <button className="checkout-btn" onClick={() => navigate('/checkout')}>
                Proceed to Pay
              </button>
            </div>
          </>
        )}
      </div>
      {showQR && (
        <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <h2>Scan to Pay</h2>
            <img src="/payment-qr.png" alt="Payment QR" className="qr-image" />
            <button className="close-qr-btn" onClick={() => setShowQR(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
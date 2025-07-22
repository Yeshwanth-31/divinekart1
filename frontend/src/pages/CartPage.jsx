import React, { useEffect, useState, useRef } from "react";
import "./CartPage.css";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQuantity } from "../redux/cartSlice";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';
import LoginPopup from '../components/LoginPopup';
import logoImg from '../assets/logo.png';

const Cart = () => {
  const { cartItems, loading, error } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState("");
  const [pincode, setPincode] = useState("");
  const [pinSuggestions, setPinSuggestions] = useState([]);
  const [loadingPin, setLoadingPin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUsername(parsed.name || '');
      setUserLocation(parsed.location || parsed.address || '');
      // Optionally: setCity(parsed.city), setState(parsed.state), etc.
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

  // Helper to check login
  const isLoggedIn = () => !!localStorage.getItem('token');

  // Handle login success
  const handleLoginSuccess = () => {
    setShowLogin(false);
    if (pendingCheckout) {
      setPendingCheckout(false);
      navigate('/checkout');
    }
    // No navigation if not pending checkout
  };

  // Remove handler for cart item
  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
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
      {showLogin && (
        <LoginPopup
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
          redirectTo={location.pathname + location.search}
        />
      )}
      <nav className="navbar navbar-sticky">
        <h1 className="logo" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: 0
        }}>
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
          <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#b4884d' }}>Divine Kart</span>
        </h1>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/cart" className="nav-link">Cart</Link>
          <div className="profile-container" ref={profileRef} onClick={() => setDropdownOpen(!dropdownOpen)} style={{ marginLeft: 8 }}>
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
                <Link to="/profile" className="profile-option" onClick={() => setDropdownOpen(false)}>
                  Profile
                </Link>
                {username && (
                  <>
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
      <div className="navbar-spacer" style={{ height: '32px' }} />
      {/* Cart Content */}
      <div className="cart-container cart-container-simple">
        {/* Cart Title */}
        <h2
          className="cart-title"
          style={{
            fontSize: '2.2rem',
            color: '#b4884d',
            fontWeight: 700,
            letterSpacing: 1,
            textAlign: 'center',
            marginBottom: 36,
            marginTop: 10,
            fontFamily: "'Playfair Display', serif"
          }}
        >
          CART
        </h2>
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            {/* Header Row */}
            <div className="cart-header-row">
              <div className="cart-header-col cart-header-product">PRODUCT</div>
              <div className="cart-header-col cart-header-qty">QUANTITY</div>
              <div className="cart-header-col cart-header-total">TOTAL</div>
              {/* <div className="cart-header-col cart-header-remove"></div> */}
            </div>
            <div className="cart-list cart-list-simple">
              {cartItems.map((item, index) => (
                <div className="cart-item cart-item-simple" key={`${item._id}-${index}`}>
                  {/* 1st column: image, name, price */}
                  <div className="cart-col cart-col-product">
                    <div className="cart-item-main">
                      <img src={item.imageUrl} alt={item.name} className="cart-img cart-img-simple" />
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-unitprice">Rs. {Number(item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      </div>
                    </div>
                  </div>
                  {/* 2nd column: quantity controls */}
                  <div className="cart-col cart-col-qty">
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => handleQuantityChange(item._id, item.quantity - 1)}>-</button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  {/* 3rd column: total price and remove */}
                  <div className="cart-col cart-col-total">
                    <div className="cart-item-price">Rs. {(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    <button
                      className="remove-btn"
                      title="Remove from cart"
                      onClick={() => handleRemoveItem(item._id)}
                    >
                      &times;
                    </button>
                  </div>
                  {/* <div className="cart-col cart-col-remove">
                    <button
                      className="remove-btn"
                      title="Remove from cart"
                      onClick={() => handleRemoveItem(item._id)}
                    >
                      &times;
                    </button>
                  </div> */}
                </div>
              ))}
            </div>
            <div className="cart-summary cart-summary-simple">
              <div className="cart-summary-row">
                <span className="cart-summary-label">Total</span>
                <span className="cart-summary-value">Rs. {totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <button
                className="checkout-btn"
                onClick={() => {
                  if (!isLoggedIn()) {
                    setShowLogin(true);
                    setPendingCheckout(true);
                    return;
                  }
                  navigate('/checkout');
                }}
              >
                Proceed to Pay
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Cart;
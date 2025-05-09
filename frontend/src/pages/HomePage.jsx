import React, { useState, useEffect, useRef } from 'react';
import './HomePage.css';
import axios from 'axios';
import LoginPopup from '../components/LoginPopup';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaMapMarkerAlt, FaSearch, FaBars } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import Select from 'react-select';

const countryOptions = [
  { value: 'India', label: 'India' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  // ...add more countries or use a dataset
];

const cityOptions = [
  { value: 'Tiruppur, Tamil Nadu, India', label: 'Tiruppur, Tamil Nadu, India' },
  { value: 'Chennai, Tamil Nadu, India', label: 'Chennai, Tamil Nadu, India' },
  { value: 'Mumbai, Maharashtra, India', label: 'Mumbai, Maharashtra, India' },
  // ...add more cities
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortOption, setSortOption] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pinSuggestions, setPinSuggestions] = useState([]);
  const [loadingPin, setLoadingPin] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState(['All']);

  const profileRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => {
        setProducts(res.data);
        console.log('Fetched products:', res.data);
        // Set price range based on products
        if (res.data.length > 0) {
          const prices = res.data.map(p => p.price);
          setMinPrice(Math.min(...prices));
          setMaxPrice(Math.max(...prices));
          setPriceRange([Math.min(...prices), Math.max(...prices)]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUsername(parsed.name || '');
      setUserLocation(parsed.location || '');
    }
  }, [navigate]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      const timer = setTimeout(() => setShowLogin(true), 20000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch city suggestions from ipgeolocation.io as user types
  useEffect(() => {
    if (address.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    fetch(`https://api.ipgeolocation.io/timezone?apiKey=d4c07f21e088477ca6f2d1cd2a737010&city=${address}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.timezones)) {
          setSuggestions(data.timezones.map(tz => ({
            label: `${tz.city}, ${tz.country_name}`,
            value: `${tz.city}, ${tz.country_name}`
          })));
        } else {
          setSuggestions([]);
        }
        setLoadingSuggestions(false);
      })
      .catch(() => {
        setSuggestions([]);
        setLoadingSuggestions(false);
      });
  }, [address]);

  // Fetch location info from pincode
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

  // Fetch categories from backend on load
  useEffect(() => {
    axios.get('http://localhost:5000/api/categories')
      .then(res => {
        setCategories(['All', ...res.data.map(cat => cat.name)]);
      })
      .catch(() => setCategories(['All']));
  }, []);

  // Filtering logic
  let filteredProducts = products;
  if (filter !== 'All') {
    filteredProducts = products.filter(
      (p) => {
        // category can be string or object
        if (typeof p.category === 'object' && p.category?.name) {
          return p.category.name === filter;
        }
        return p.category === filter;
      }
    );
  }

  // Sorting logic
  if (sortOption === 'priceLowHigh') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortOption === 'priceHighLow') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortOption === 'nameAZ') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === 'nameZA') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.name.localeCompare(a.name));
  }

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
      return;
    }
    dispatch(addToCart(product));
    try {
      await axios.post(
        'http://localhost:5000/api/cart/add',
        { productId: product._id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/cart');
    } catch (err) {
      console.error('❌ Error adding to MongoDB cart:', err.response?.data || err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUsername('');
    setDropdownOpen(false);
    navigate('/');
  };

  const handleLocationSubmit = async (location) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setShowLogin(true);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/users/update-location',
        { location },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const userData = JSON.parse(localStorage.getItem('user'));
        userData.location = location;
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUserLocation(location);
        setShowLocationInput(false);
      } else {
        console.error('❌ Failed to update location:', response.data.message);
      }
    } catch (err) {
      console.error('❌ Error updating location:', err.response?.data?.message || err.message);
    }
  };

  const handleSelectPinSuggestion = (suggestion) => {
    setPincode(suggestion.value);
    setUserLocation(suggestion.value);
    setShowLocationSearch(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="homepage-container">
      {showLogin && <LoginPopup onClose={() => setShowLogin(false)} />}
      <nav className="navbar">
        <h1 className="logo">🛕 Divine Kart</h1>
        <input
          type="text"
          placeholder="Search products..."
          className="search-bar"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="nav-links">
          <Link to="/review" className="nav-link">Review</Link>
          <Link to="/cart" className="nav-link">Cart</Link>
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
                    <span className="profile-option" onClick={() => setShowLocationInput(true)}>
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
      {username && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <span>Welcome, {username}!</span>
            {userLocation && (
              <span className="location-display">
                <FaMapMarkerAlt /> {userLocation}
              </span>
            )}
          </div>
        </div>
      )}
      {/* Category Tabs Below Navbar */}
      <div className="category-tabs" style={{display:'flex',gap:12,justifyContent:'center',margin:'18px 0'}}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-tab${filter === cat ? ' active-category' : ''}`}
            style={{
              padding:'10px 22px',
              borderRadius:8,
              border:'none',
              background: filter === cat ? '#b4884d' : '#fffaf3',
              color: filter === cat ? '#fff' : '#5c3a1e',
              fontWeight:'bold',
              cursor:'pointer',
              fontSize:'16px',
              boxShadow: filter === cat ? '0 2px 8px #b4884d33' : '0 1px 4px #b4884d11',
              transition:'all 0.2s',
            }}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {/* Sort Filter on Right */}
      <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',margin:'0 0 18px 0'}}>
        <div className="sort-filter" style={{background:'#fffaf3',borderRadius:6,padding:'6px 12px',boxShadow:'0 1px 4px #b4884d11',fontSize:15,display:'flex',alignItems:'center',gap:8}}>
          <span>Sort:</span>
          <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="sort-select" style={{marginLeft:6,padding:'4px 8px',border:'1px solid #e4c28b',borderRadius:4,background:'#fffdf8',color:'#5c3a1e',fontSize:15}}>
            <option value="">Default</option>
            <option value="priceLowHigh">Price: Low to High</option>
            <option value="priceHighLow">Price: High to Low</option>
            <option value="nameAZ">Name: A-Z</option>
            <option value="nameZA">Name: Z-A</option>
          </select>
        </div>
      </div>
      <h2 className="section-title">Featured Products</h2>
      <div className="catalogue">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            return (
              <div className="product-card" key={product._id}>
                <Link
                  to={`/product/${product._id}`}
                  className="product-link"
                  style={{ textDecoration: 'none' }}
                >
                  {product.variants?.[0]?.imageUrl ? (
                    <img src={product.variants[0].imageUrl} alt={product.name} className="product-image" />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <h3>{product.name}</h3>
                  <p><strong>Material:</strong> {product.variants?.[0]?.material || '-'}</p>
                  <p><strong>Price:</strong> ₹{product.variants?.[0]?.price || '-'}</p>
                  {product.variants?.[0]?.directDelivery && (
                    <p style={{color:'#388e3c'}}><strong>Direct Delivery Available</strong></p>
                  )}
                  {product.variants?.[0]?.priceNotes && (
                    <p><strong>Price Notes:</strong> {product.variants[0].priceNotes}</p>
                  )}
                </Link>
                <button 
                  className="add-to-cart-btn" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart({
                      _id: product._id + '-0',
                      productId: product._id,
                      name: product.name,
                      description: product.description,
                      category: product.category,
                      ...product.variants[0],
                      imageUrl: product.variants[0].imageUrl,
                      price: product.variants[0].price,
                      material: product.variants[0].material,
                    });
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: '#b4884d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '100%',
                    transition: 'background-color 0.3s'
                  }}
                >
                  Add to Cart
                </button>
              </div>
            );
          })
        ) : (
          <p style={{ padding: '20px' }}>No products found for selected filters.</p>
        )}
      </div>
      {showLocationInput && (
        <div className="location-modal-overlay" onClick={() => setShowLocationInput(false)}>
          <div className="location-modal" onClick={e => e.stopPropagation()}>
            <h3>Update Your Location</h3>
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
                  onClick={() => {
                    setPincode(suggestion.value);
                    setUserLocation(suggestion.value);
                    setShowLocationInput(false);
                  }}
                >
                  {suggestion.label}
                </div>
              ))}
              {!loadingPin && pincode.length === 6 && pinSuggestions.length === 0 && (
                <div className="suggestion-item">No results found</div>
              )}
            </div>
            <div className="location-modal-buttons">
              <button onClick={() => setShowLocationInput(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

import React, { useState, useEffect, useRef } from 'react';
import './HomePage.css';
import axios from 'axios';
import LoginPopup from '../components/LoginPopup';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';

const categories = [
  'All',
  'Deity Statues',
  'Puja Accessories',
  'Sacred Water Pots',
  'Decorative Arches',
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortOption, setSortOption] = useState('');

  const profileRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/products')
      .then((res) => {
        setProducts(res.data);
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
    }
  }, []);

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

  // Filtering logic
  let filteredProducts = products.filter((product) => {
    const matchesCategory = filter === 'All' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesCategory && matchesSearch && matchesPrice;
  });

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
          <Link to="/blog" className="nav-link">Blog</Link>
          <Link to="/cart" className="nav-link">Cart</Link>
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
                  <span className="profile-option" onClick={handleLogout}>
                    Logout
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      {username && <div className="welcome-banner">Welcome, {username}!</div>}
      <div className="filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={filter === cat ? 'active-filter' : ''}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
        <div className="sort-filter">
          <span>Sort: </span>
          <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="sort-select">
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
          filteredProducts.map((product) => (
            <div className="product-card" key={product._id}>
              <Link
                to={`/product/${product._id}`}
                state={{ product }}
                className="product-link"
                style={{ textDecoration: 'none' }}
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="product-image" />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <h3>{product.name}</h3>
                <p><strong>Material:</strong> {product.material}</p>
              </Link>
              <div className="product-card-actions">
                <button
                  className="add-to-cart-btn"
                  onClick={e => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                >
                  Add to Cart
                </button>
                <Link to={`/product/${product._id}`} state={{ product }} className="view-details-btn">
                  View Details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p style={{ padding: '20px' }}>No products found for selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;

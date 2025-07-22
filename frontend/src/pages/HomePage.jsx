import React, { useState, useEffect, useRef } from 'react';
import './HomePage.css';
import axios from 'axios';
import LoginPopup from '../components/LoginPopup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import Select from 'react-select';
import logoImg from '../assets/logo.png';
import customiseImg from '../assets/customise.jpg';
import customise1Img from '../assets/customise1.jpg';
import customise3Img from '../assets/customise3.jpg';
import customise4Img from '../assets/customise4.jpg';
import customise5Img from '../assets/customise5.jpg';
import customise6Img from '../assets/customise6.jpg';
import customise7Img from '../assets/customise7.jpg';
import customise8Img from '../assets/customise8.jpg';
import customise9Img from '../assets/customise9.jpg';
import MiniCart from '../components/MiniCart';

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

const carouselImages = [
  { src: customiseImg, alt: 'Customized Product 1' },
  { src: customise1Img, alt: 'Customized Product 2' },
  { src: customise3Img, alt: 'Customized Product 3' },
  { src: customise4Img, alt: 'Customized Product 4' },
  { src: customise5Img, alt: 'Customized Product 5' },
  { src: customise6Img, alt: 'Customized Product 6' },
  { src: customise7Img, alt: 'Customized Product 7' },
  { src: customise8Img, alt: 'Customized Product 8' },
  { src: customise9Img, alt: 'Customized Product 9' },
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
  const [sortDropdown, setSortDropdown] = useState('default');
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
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [popupImg, setPopupImg] = useState(null);
  const [categoryMaterials, setCategoryMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const carouselIntervalRef = useRef();
  const profileRef = useRef(null);
  const [allCategoryMaterials, setAllCategoryMaterials] = useState([]);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const location = useLocation();

  // Show 3 images at a time, sliding horizontally
  const getVisibleImages = () => {
    const len = carouselImages.length;
    // Always 3 images: prev, current, next
    return [
      carouselImages[(carouselIdx - 1 + len) % len],
      carouselImages[carouselIdx],
      carouselImages[(carouselIdx + 1) % len]
    ];
  };

  // --- Carousel sliding logic ---
  // Number of visible images (set to 3)
  const visibleCount = 3;
  // For smooth sliding, show all images in a row and shift the track
  const getCarouselTrackStyle = () => ({
    display: 'flex',
    transition: 'transform 0.6s cubic-bezier(.77,0,.18,1)',
    willChange: 'transform',
    transform: `translateX(-${carouselIdx * (100 / visibleCount)}%)`
  });

  // For infinite loop, duplicate images at both ends
  const extendedImages = [
    ...carouselImages.slice(-visibleCount),
    ...carouselImages,
    ...carouselImages.slice(0, visibleCount)
  ];
  const adjustedIdx = carouselIdx + visibleCount;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => {
        // FIX: Use res.data.products if backend returns { products, total }
        const arr = Array.isArray(res.data) ? res.data : res.data.products;
        setProducts(arr || []);
        console.log('Fetched products:', arr || res.data);
        // Set price range based on products
        if ((arr || []).length > 0) {
          const prices = (arr || []).map(p => p.price);
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
    // Only show auto-login popup if NOT logged in
    if (!localStorage.getItem('token')) {
      const timer = setTimeout(() => setShowLogin(true), 20000);
      return () => clearTimeout(timer);
    }
    // If logged in, ensure popup is not shown
    setShowLogin(false);
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
        // Aggregate all unique materials for "All" category
        const allMats = Array.from(
          new Set(res.data.flatMap(cat => cat.materials || []))
        );
        setAllCategoryMaterials(allMats);
      })
      .catch(() => {
        setCategories(['All']);
        setAllCategoryMaterials([]);
      });
  }, []);

  // Fetch materials for selected category (or all)
  useEffect(() => {
    if (filter !== 'All') {
      axios.get(`http://localhost:5000/api/categories/name/${encodeURIComponent(filter)}`)
        .then(res => setCategoryMaterials(res.data.materials || []))
        .catch(() => setCategoryMaterials([]));
    } else {
      setCategoryMaterials(allCategoryMaterials);
    }
    setSelectedMaterial('');
  }, [filter, allCategoryMaterials]);

  // Carousel auto-scroll logic
  useEffect(() => {
    carouselIntervalRef.current = setInterval(() => {
      setCarouselIdx(idx => (idx + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(carouselIntervalRef.current);
  }, [carouselIdx]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCarouselIdx(idx => (idx - 1 + carouselImages.length) % carouselImages.length);
  };
  const handleNext = (e) => {
    e.stopPropagation();
    setCarouselIdx(idx => (idx + 1) % carouselImages.length);
  };

  // Filtering logic
  let filteredProducts = products;
  if (filter !== 'All') {
    filteredProducts = products.filter((p) => {
      // Handle category as array (populated or not)
      if (Array.isArray(p.category)) {
        // Populated: array of objects with .name, or array of strings (ObjectIds)
        return p.category.some(cat =>
          (typeof cat === 'object' && cat !== null && cat.name === filter) ||
          (typeof cat === 'string' && cat === filter)
        );
      } else if (
        typeof p.category === 'object' &&
        p.category !== null &&
        p.category.name
      ) {
        return p.category.name === filter;
      } else if (typeof p.category === 'string') {
        return p.category === filter;
      }
      return false;
    });
  }
  // Filter by material (if selected)
  if (selectedMaterial) {
    filteredProducts = filteredProducts.filter(p =>
      (p.variants || []).some(v => v.material === selectedMaterial)
    );
  }

  // --- SEARCH FILTER: name, material, category, case-insensitive, live ---
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(p => {
      // Name match
      const nameMatch = p.name && p.name.toLowerCase().includes(s);
      // Material match (any variant)
      const materialMatch = (p.variants || []).some(
        v => v.material && v.material.toLowerCase().includes(s)
      );
      // Category match (array or string or object)
      let catMatch = false;
      if (Array.isArray(p.category)) {
        catMatch = p.category.some(cat =>
          (typeof cat === 'object' && cat !== null && cat.name && cat.name.toLowerCase().includes(s)) ||
          (typeof cat === 'string' && cat.toLowerCase().includes(s))
        );
      } else if (typeof p.category === 'object' && p.category !== null && p.category.name) {
        catMatch = p.category.name.toLowerCase().includes(s);
      } else if (typeof p.category === 'string') {
        catMatch = p.category.toLowerCase().includes(s);
      }
      return nameMatch || materialMatch || catMatch;
    });
  }

  // Sorting logic
  let sortedProducts = [...filteredProducts];
  if (sortDropdown === 'priceLowHigh') {
    sortedProducts.sort((a, b) => {
      const av = a.variants?.find(v => v.showInStore !== false);
      const bv = b.variants?.find(v => v.showInStore !== false);
      return (av?.price ?? 0) - (bv?.price ?? 0);
    });
  } else if (sortDropdown === 'priceHighLow') {
    sortedProducts.sort((a, b) => {
      const av = a.variants?.find(v => v.showInStore !== false);
      const bv = b.variants?.find(v => v.showInStore !== false);
      return (bv?.price ?? 0) - (av?.price ?? 0);
    });
  } else if (sortDropdown === 'new') {
    sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  // else 'default': do not sort, keep backend order

  // --- PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const productsPerRow = 4; // adjust if your grid columns change
  const rowsPerPage = 3;
  const productsPerPage = productsPerRow * rowsPerPage;

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [filter, selectedMaterial, search, sortDropdown, products]);

  // Helper to check login
  const isLoggedIn = () => !!localStorage.getItem('token');

  // Save pending action and product for after login
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingProduct, setPendingProduct] = useState(null);

  // Handle login success
  const handleLoginSuccess = () => {
    setShowLogin(false);
    if (pendingAction === 'addToCart' && pendingProduct) {
      doAddToCart(pendingProduct);
    }
    setPendingAction(null);
    setPendingProduct(null);
    // No navigation here; stay on same page
  };

  // Actual add to cart logic
  const doAddToCart = async (product) => {
    dispatch(addToCart(product));
    setMiniCartOpen(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/cart/add',
        { productId: product._id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('❌ Error adding to MongoDB cart:', err.response?.data || err.message);
    }
  };

  // Button handler
  const handleAddToCart = async (product) => {
    if (!isLoggedIn()) {
      setShowLogin(true);
      setPendingAction('addToCart');
      setPendingProduct(product);
      return;
    }
    doAddToCart(product);
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

  // --- PAGINATION BAR LOGIC ---
  function getPageNumbers(current, total) {
    const pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1,2,3,4,5,'...',total);
      } else if (current >= total - 3) {
        pages.push(1,'...',total-4,total-3,total-2,total-1,total);
      } else {
        pages.push(1,'...',current-1,current,current+1,'...',total);
      }
    }
    return pages;
  }

  // --- Add this useEffect to sync search state with URL param on mount ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('search');
    if (s) setSearch(s);
  }, []);

  // Add clear search handler
  const handleClearSearch = () => {
    setSearch('');
    const params = new URLSearchParams(window.location.search);
    params.delete('search');
    window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div className="homepage-container">
      {showLogin && (
        <LoginPopup
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
          redirectTo={location.pathname + location.search}
        />
      )}
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
          <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#b4884d' }}>Divine Kart</span>
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: 24,
            marginRight: 'auto',
            gap: 0,
            position: 'relative',
            width: 240,
            background: '#fffdf8',
            borderRadius: 6,
            border: '1px solid #e4c28b',
            height: 40,
            padding: 0
          }}
        >
          {/* Clear search "×" button inside the box, left side */}
          {search && (
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#b4884d',
                fontSize: 18,
                cursor: 'pointer',
                zIndex: 2,
                marginLeft: 8,
                marginRight: 0,
                padding: 0,
                height: 40,
                width: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Clear search"
              onClick={handleClearSearch}
              tabIndex={-1}
            >
              <FaTimes />
            </button>
          )}
          <input
            type="text"
            placeholder="Search products..."
            className="search-bar"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') {/* ...existing search logic... */} }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              height: 40,
              paddingLeft: search ? 4 : 12,
              paddingRight: 36 // match .search-bar CSS
            }}
          />
          {/* Search icon button on right */}
          <button
            className="search-icon-btn"
            aria-label="Search"
            onClick={() => {
              if (search.trim()) {
                // ...existing search logic...
                window.location.href = `/?search=${encodeURIComponent(search.trim())}`;
              }
            }}
            tabIndex={-1}
          >
            <FaSearch />
          </button>
        </div>
        <div className="nav-links" style={{display:'flex',alignItems:'center',gap:20}}>
          <Link to="/cart" className="nav-link" onClick={() => setMiniCartOpen(false)}>Cart</Link>
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
      {/* Carousel Section */}
      <div className="custom-carousel-section">
        <h2 className="custom-carousel-title">Our Customized Products</h2>
        <div className="custom-carousel carousel-multi" style={{overflow: 'hidden', position: 'relative'}}>
          <button className="carousel-arrow left" onClick={handlePrev} aria-label="Previous">
            <span style={{fontSize:'2.2rem',lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}>&#x2039;</span>
          </button>
          <div
            className="carousel-multi-track"
            style={{
              ...getCarouselTrackStyle(),
              width: `${(extendedImages.length / visibleCount) * 100}%`,
            }}
          >
            {extendedImages.map((img, idx) => (
              <img
                key={img.src + idx}
                src={img.src}
                alt={img.alt}
                className="carousel-multi-img"
                draggable={false}
                style={{
                  userSelect: 'none',
                  flex: `0 0 ${100 / extendedImages.length}%`,
                  maxWidth: '260px',
                  maxHeight: '260px',
                  width: '100%',
                  height: '90%',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  background: '#f4e9db',
                  boxShadow: '0 2px 12px #b4884d22',
                  border: '1.5px solid #f4e9db',
                  margin: '0 8px',
                  display: 'block',
                  cursor: 'pointer'
                }}
                onClick={() => setPopupImg(img.src)}
              />
            ))}
          </div>
          <button className="carousel-arrow right" onClick={handleNext} aria-label="Next">
            <span style={{fontSize:'2.2rem',lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}>&#x203A;</span>
          </button>
        </div>
        {/* Contact for custom product - moved inside carousel section */}
        <div style={{
          margin: '18px auto 0 auto',
          padding: '12px 18px',
          background: '#fff8e1',
          color: '#a76d27',
          fontWeight: 600,
          fontSize: '1.08rem',
          borderRadius: 10,
          boxShadow: '0 2px 8px #b4884d11',
          maxWidth: 420,
          textAlign: 'center',
          letterSpacing: 0.2
        }}>
          Contact for your custom product: <a href="tel:9677445424" style={{color:'#b4884d',textDecoration:'underline'}}>9677445424</a>
        </div>
        {/* Removed carousel-dots */}
      </div>
      {/* Popup for maximized carousel image */}
      {popupImg && (
        <div
          className="carousel-img-popup-overlay"
          onClick={() => setPopupImg(null)}
        >
          <div
            className="carousel-img-popup"
            onClick={e => e.stopPropagation()}
          >
            <img src={popupImg} alt="Maximized" />
          </div>
        </div>
      )}
      {/* Sidebar + Products grid */}
      <div className="homepage-main-flex">
        {/* Sidebar: Categories */}
        <aside className="homepage-categories-sidebar">
          <div className="homepage-categories-panel">
            <div className="homepage-categories-title">PRODUCT CATEGORIES</div>
            <ul className="homepage-categories-list">
              {categories.map(cat => (
                <li
                  key={cat}
                  className={`homepage-category-item${filter === cat ? ' active' : ''}`}
                  onClick={() => setFilter(cat)}
                >
                  {cat}
                </li>
              ))}
            </ul>
            {/* Material filter below categories */}
            {(categoryMaterials.length > 0) && (
              <div className="homepage-materials-panel">
                <div className="homepage-materials-title">MATERIALS</div>
                <ul className="homepage-materials-list">
                  <li
                    className={`homepage-material-item${selectedMaterial === '' ? ' active' : ''}`}
                    onClick={() => setSelectedMaterial('')}
                  >
                    All
                  </li>
                  {categoryMaterials.map(mat => (
                    <li
                      key={mat}
                      className={`homepage-material-item${selectedMaterial === mat ? ' active' : ''}`}
                      onClick={() => setSelectedMaterial(mat)}
                    >
                      {mat}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
        {/* Products grid */}
        <div style={{flex:1}}>
          {/* Category Title and Sort Dropdown */}
          <div className="products-header-row">
            <div className="products-category-title">
              {filter !== 'All' ? filter : 'All Products'}
            </div>
            <div className="products-sort-dropdown">
              <select
                className="sort-dropdown-select"
                value={sortDropdown}
                onChange={e => setSortDropdown(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="new">New Products</option>
                <option value="priceLowHigh">Price Low-High</option>
                <option value="priceHighLow">Price High-Low</option>
              </select>
            </div>
          </div>
          <div
            className="catalogue"
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              justifyItems: 'center',
              maxWidth: 1200,
              margin: '0 auto'
            }}
          >
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => {
                // Find the first variant that should be shown in store
                const displayVariant = product.variants?.find(v => v.showInStore !== false);
                if (!displayVariant) return null;
                return (
                  <div
                    key={product._id}
                    className="product-card-home"
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      padding: 0,
                      minHeight: 355,
                      maxWidth: 320,
                      width: '100%',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      cursor: 'pointer',
                      border: '1.5px solid #ffe1b6',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px #b4884d22'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {/* Image area */}
                    <div
                      style={{
                        width: '100%',
                        height: '180px',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        overflow: 'hidden',
                        padding: '8px 0',
                        boxSizing: 'border-box'
                      }}
                    >
                      {displayVariant.imageUrl ? (
                        <img
                          src={displayVariant.imageUrl}
                          alt={product.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            background: '#fff',
                            borderRadius: 8
                          }}
                        />
                      ) : (
                        <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#b4884d'}}>No Image</div>
                      )}
                    </div>
                    {/* Info area */}
                    <div
                      style={{
                        flex: 1,
                        padding: '14px 18px 10px 18px',
                        background: '#fff',
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start'
                      }}
                    >
                      <h3 style={{margin:'0 0 6px 0',fontSize:'1.18rem',color:'#b4884d',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{product.name}</h3>
                      <p style={{margin:'2px 0',fontSize:14}}><strong>Material:</strong> {displayVariant.material}</p>
                      <p style={{margin:'2px 0',fontSize:14}}><strong>Price:</strong> ₹{displayVariant.price}</p>
                      {/* Add to Cart button and other HomePage elements */}
                      <button
                        onClick={e => {
                          e.stopPropagation(); // Prevent card click navigation
                          handleAddToCart({
                            _id: product._id + '-0',
                            productId: product._id,
                            name: product.name,
                            description: product.description,
                            category: product.category,
                            ...displayVariant,
                            imageUrl: displayVariant.imageUrl,
                            price: displayVariant.price,
                            material: displayVariant.material,
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
                  </div>
                );
              })
            ) : (
              <p style={{ padding: '20px' }}>No products found for selected filters.</p>
            )}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:18,margin:'32px 0'}}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                  color: page === 1 ? '#b4884d77' : '#a76d27',
                  fontSize: 18,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  marginRight: 8,
                  padding: 0
                }}
              >&#60;</button>
              {getPageNumbers(page, totalPages).map((num, idx) =>
                num === '...' ? (
                  <span key={idx} style={{margin: '0 6px', color: '#b4884d', fontWeight: 600}}>...</span>
                ) : (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    disabled={num === page}
                    style={{
                      background: num === page ? '#a76d27' : 'none',
                      color: num === page ? '#fff' : '#a76d27',
                      border: 'none',
                      borderRadius: '50%',
                      width: 34,
                      height: 34,
                      fontWeight: num === page ? 700 : 600,
                      fontSize: 17,
                      margin: '0 2px',
                      cursor: num === page ? 'default' : 'pointer',
                      outline: 'none',
                      transition: 'background 0.18s'
                    }}
                  >{num}</button>
                )
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                  color: page === totalPages ? '#b4884d77' : '#a76d27',
                  fontSize: 18,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  marginLeft: 8,
                  padding: 0
                }}
              >NEXT</button>
            </div>
          )}
        </div>
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
      <MiniCart open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
    </div>
  );
};

export default HomePage;

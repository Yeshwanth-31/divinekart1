import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./ProductDetails.css";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { FaUserCircle, FaSearch, FaTimes } from 'react-icons/fa';
import logoImg from '../assets/logo.png';
import LoginPopup from '../components/LoginPopup';
import MiniCart from '../components/MiniCart'; // Add this import

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantityMap, setQuantityMap] = useState({}); // Store quantity per product-variant
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [miniCartOpen, setMiniCartOpen] = useState(false); // Add state for MiniCart
  const profileRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch product
  useEffect(() => {
    setLoading(true);
    axios.get(`/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
        if (res.data.variants && res.data.variants[0]?.imageUrl) {
          setMainImage(res.data.variants[0].imageUrl);
        }
      })
      .catch(() => {
        setError("Product not found");
        setLoading(false);
      });
  }, [id]);

  // User info for navbar
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUsername(parsed.name || '');
    }
  }, [navigate]);

  // Profile dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch related products
  useEffect(() => {
    if (!product?._id) return;
    axios.get(`/api/products/${product._id}/related`)
      .then(res => setRelatedProducts(res.data || []))
      .catch(() => setRelatedProducts([]));
  }, [product?._id]);

  // Prefill search from URL param if present
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

  // Helper to check login
  const isLoggedIn = () => !!localStorage.getItem('token');

  // Save pending action and run after login
  const [pendingAction, setPendingAction] = useState(null);

  // Handle login success
  const handleLoginSuccess = () => {
    setShowLogin(false);
    if (pendingAction === 'addToCart') {
      doAddToCart();
    } else if (pendingAction === 'buyNow') {
      doBuyNow();
    }
    setPendingAction(null);
    // No navigation here; stay on same page
  };

  const variants = (product?.variants || []).filter(v => v.showInStore !== false);
  const selectedVariant = variants[selectedVariantIdx] || {};
  const productKey = product?._id + '-' + selectedVariantIdx;

  // On product or variant change, reset quantity to 1 for new key
  useEffect(() => {
    if (!productKey) return;
    setQuantityMap(qm => ({
      ...qm,
      [productKey]: 1
    }));
  // eslint-disable-next-line
  }, [product?._id, selectedVariantIdx]);

  // Quantity for current product/variant
  const quantity = quantityMap[productKey] || 1;

  // Update quantity for current product/variant
  const setQuantityForCurrent = (val) => {
    setQuantityMap(qm => ({
      ...qm,
      [productKey]: Math.max(1, val)
    }));
  };

  // Actual add to cart logic
  const doAddToCart = () => {
    dispatch(addToCart({
      _id: product._id + '-' + selectedVariantIdx,
      productId: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      ...selectedVariant,
      imageUrl: selectedVariant.imageUrl,
      price: selectedVariant.price,
      material: selectedVariant.material,
      quantity,
    }));
    setMiniCartOpen(true); // Show MiniCart instead of navigating
  };

  // Actual buy now logic
  const doBuyNow = () => {
    dispatch(addToCart({
      _id: product._id + '-' + selectedVariantIdx,
      productId: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      ...selectedVariant,
      imageUrl: selectedVariant.imageUrl,
      price: selectedVariant.price,
      material: selectedVariant.material,
      quantity, // use quantity for current product/variant
    }));
    navigate("/checkout");
  };

  // Button handlers
  const handleAddToCart = () => {
    if (!isLoggedIn()) {
      setShowLogin(true);
      setPendingAction('addToCart');
      return;
    }
    doAddToCart();
  };

  const handleBuyNow = () => {
    if (!isLoggedIn()) {
      setShowLogin(true);
      setPendingAction('buyNow');
      return;
    }
    doBuyNow();
  };

  if (loading) return <div className="product-detail-container">Loading...</div>;
  if (error) return <div className="product-detail-container" style={{ color: 'red', fontWeight: 600, fontSize: 18 }}>{error}</div>;
  if (!product) return <div className="product-detail-container">Product not found.</div>;

  const images = variants.map(v => v.imageUrl).filter(Boolean);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUsername('');
    setDropdownOpen(false);
    navigate('/');
  };

  // Search handler (same as HomePage)
  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  // --- NAVBAR: Expanded like HomePage ---
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
          display:'flex',
          alignItems:'center',
          gap:12,
          margin:0
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
          <span style={{fontSize: '2.2rem', fontWeight: 'bold', color: '#b4884d'}}>Divine Kart</span>
        </h1>
        {/* Search bar with icon, like HomePage */}
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
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
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
            onClick={handleSearch}
            tabIndex={-1}
          >
            <FaSearch />
          </button>
        </div>
        <div className="nav-links" style={{display:'flex',alignItems:'center',gap:20}}>
          {/* <Link to="/review" className="nav-link">Review</Link> */}
          {/* Main Cart link: clicking this navigates to cart */}
          <Link to="/cart" className="nav-link" onClick={() => setMiniCartOpen(false)}>Cart</Link>
          <div className="profile-container" ref={profileRef} onClick={() => setDropdownOpen(!dropdownOpen)} style={{marginLeft:8}}>
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
      <div className="navbar-spacer" style={{height: '32px'}} /> {/* Reduced spacer */}
      <div className="product-details" style={{maxWidth:1320,margin:'0 auto',padding:'8px 0 40px 0'}}>
        {/* Back button below navbar, with gap */}
        <div style={{margin:'0 0 12px 0',paddingLeft:0,display:'flex',alignItems:'center',gap:18}}>
          <button
            onClick={() => navigate(-1)}
            style={{
              color:'#b4884d',
              fontWeight:'bold',
              fontSize:22,
              textDecoration:'none',
              display:'inline-block',
              background:'#fffaf3',
              padding:'8px 22px',
              borderRadius:'8px',
              boxShadow:'0 1px 4px #b4884d11',
              border:'none',
              cursor:'pointer',
              marginRight:0
            }}
            aria-label="Back"
          >
            ←
          </button>
        </div>
        {/* Product Display Card */}
        <div className="product-container product-details-card"
          style={{
            display:'flex',
            gap:0,
            background:'#fff',
            borderRadius:24,
            boxShadow:'0 4px 24px #b4884d13',
            minHeight:480,
            alignItems:'stretch',
            overflow:'visible',
            padding:0,
            width:'100%',
            maxWidth:1100
          }}>
          {/* Left: Images and thumbnails (sticky) */}
          <div
            className="product-image-sticky"
            style={{
              flex:'0 0 480px',
              maxWidth:480,
              minWidth:340,
              background:'#fff',
              borderTopLeftRadius:24,
              borderBottomLeftRadius:24,
              boxShadow:'0 2px 8px #b4884d11',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              position:'sticky',
              top:80, // below navbar
              zIndex:1,
              padding:'38px 18px 32px 18px',
              borderRight:'1px solid #f4e9db',
              height:'fit-content',
              alignSelf:'flex-start'
            }}
          >
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{display:'flex',flexDirection:'row',gap:12,marginBottom:18}}>
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`thumb-${idx}`}
                    style={{
                      width: 72, height: 72, objectFit: 'cover',
                      borderRadius: 12, border: mainImage === img ? '2px solid #b4884d' : '1px solid #eee',
                      cursor: 'pointer', boxShadow: mainImage === img ? '0 2px 8px #b4884d33' : 'none',
                      transition:'box-shadow 0.2s, border 0.2s'
                    }}
                    onClick={() => setMainImage(img)}
                  />
                ))}
              </div>
            )}
            {/* Main Image */}
            <div style={{width:'100%',display:'flex',justifyContent:'center',alignItems:'center',marginBottom:8}}>
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  style={{
                    width:390,
                    height:390,
                    objectFit:'contain',
                    background:'#f4e9db',
                    borderRadius:18,
                    boxShadow:'0 2px 16px #b4884d22',
                    border:'1.5px solid #f4e9db'
                  }}
                />
              ) : (
                <div className="no-image" style={{
                  width:390,height:390,display:'flex',alignItems:'center',justifyContent:'center',
                  background:'#f4e9db',borderRadius:'18px',fontSize:'1.1rem',color:'#b4884d',boxShadow:'0 2px 12px #b4884d22'
                }}>No Image</div>
              )}
            </div>
          </div>
          {/* Right: Info, description, quantity, buttons */}
          <div
            className="product-details-scroll"
            style={{
              flex:'1 1 0',
              maxWidth:700,
              display:'flex',
              flexDirection:'column',
              gap:18,
              background:'#fff',
              borderTopRightRadius:24,
              borderBottomRightRadius:24,
              boxShadow:'none',
              padding:'38px 38px 38px 38px',
              minHeight:390,
              overflowY:'auto'
            }}
          >
            <h2 style={{fontSize:'2.1rem',marginBottom:10,color:'#b4884d',fontWeight:700,letterSpacing:0.2}}>{product.name}</h2>
            <p style={{fontSize:'1.25rem',color:'#b4884d',fontWeight:700,margin:'0 0 12px 0'}}><span style={{color:'#a0763b'}}>Price:</span> ₹{selectedVariant.price}</p>
            {variants.length > 1 && (
              <div style={{margin:'10px 0 6px 0'}}>
                <label htmlFor="variant-select"><strong>Choose Material:</strong></label>
                <select id="variant-select" value={selectedVariantIdx} onChange={e => {
                  setSelectedVariantIdx(Number(e.target.value));
                  setMainImage(variants[Number(e.target.value)].imageUrl);
                }} style={{
                  marginLeft:8,
                  padding:'7px 14px',
                  borderRadius:7,
                  border:'1px solid #e4c28b',
                  background:'#fffdf8',
                  color:'#5c3a1e',
                  width:'65%',
                  fontSize:15
                }}>
                  {variants.map((v, idx) => (
                    <option key={idx} value={idx}>{v.material}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{margin:'4px 0',fontSize:16}}><strong>Material:</strong> {selectedVariant.material}</div>
            <div style={{margin:'4px 0',fontSize:16}}>
              <strong>Dimensions:</strong>{" "}
              {selectedVariant.dimensions && selectedVariant.dimensions.height && selectedVariant.dimensions.height.value
                ? <>
                    <span style={{marginRight:8}}><b>Height:</b> {selectedVariant.dimensions.height.value} {selectedVariant.dimensions.height.unit}</span>
                    <span style={{marginRight:8}}><b>Width:</b> {selectedVariant.dimensions.width.value} {selectedVariant.dimensions.width.unit}</span>
                    <span><b>Depth:</b> {selectedVariant.dimensions.depth.value} {selectedVariant.dimensions.depth.unit}</span>
                  </>
                : '-'}
            </div>
            <div style={{margin:'4px 0',fontSize:16}}><strong>Weight:</strong> {selectedVariant.weight ? `${selectedVariant.weight.value} ${selectedVariant.weight.unit}` : '-'}</div>
            {selectedVariant.directDelivery && <div style={{color:'#388e3c',margin:'4px 0',fontSize:15}}><strong>Direct Delivery Available</strong></div>}
            {selectedVariant.priceNotes && <div style={{margin:'4px 0',fontSize:15}}><strong>Price Notes:</strong> {selectedVariant.priceNotes}</div>}
            {selectedVariant.customFields && selectedVariant.customFields.length > 0 && (
              <div style={{margin:'4px 0',fontSize:15}}>
                <strong>Additional Info:</strong>
                <ul style={{margin:'4px 0 0 18px',padding:0}}>
                  {selectedVariant.customFields.map((field, idx) => (
                    <li key={idx}>{field.label}: {field.value}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Description moved here */}
            <div style={{
              width:'100%',
              background:'#fffaf3',
              borderRadius:12,
              padding:'18px 18px 18px 18px',
              boxShadow:'0 1px 6px #b4884d11',
              fontSize:'16px',
              margin:'18px 0 0 0',
              color:'#5c3a1e',
              lineHeight:1.7
            }}>
              <h3 style={{marginBottom:8,color:'#b4884d',fontSize:'1.08rem',fontWeight:700}}>Product Description</h3>
              <p style={{margin:0}}>{product.description}</p>
            </div>
            {/* Quantity Selector and Buttons below */}
            <div style={{marginTop:28,display:'flex',flexDirection:'column',alignItems:'flex-start',gap:18}}>
              <div className="quantity-row" style={{alignItems:'center'}}>
                <span style={{fontWeight:600,fontSize:16,marginRight:14}}>Quantity</span>
                {/* Updated quantity box for split look */}
                <div className="quantity-box-split">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="quantity-btn-split"
                    onClick={() => setQuantityForCurrent(quantity - 1)}
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    className="quantity-input-split"
                    onChange={e => setQuantityForCurrent(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="quantity-btn-split"
                    onClick={() => setQuantityForCurrent(quantity + 1)}
                  >+</button>
                </div>
                {/* Show total next to quantity box */}
                <span style={{
                  marginLeft: 18,
                  fontWeight: 600,
                  color: '#19c241',
                  fontSize: '1.13rem'
                }}>
                  Total: ₹{(Number(selectedVariant.price || 0) * quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
              <div style={{display:'flex',gap:18,width:'100%',marginTop:0}}>
                <button className="add-to-cart-btn" style={{
                  flex:1,
                  padding:'16px 0',
                  fontSize:'1.13rem',
                  fontWeight:700,
                  background:'#b4884d',
                  color:'#fff',
                  border:'none',
                  borderRadius:10,
                  cursor:'pointer',
                  boxShadow:'0 1px 4px #b4884d22',
                  transition:'background 0.2s',
                  letterSpacing:'1px'
                }} onClick={handleAddToCart}>
                  ADD TO CART
                </button>
                <button style={{
                  flex:1,
                  padding:'16px 0',
                  fontSize:'1.13rem',
                  fontWeight:700,
                  background:'#19c241',
                  color:'#fff',
                  border:'none',
                  borderRadius:10,
                  cursor:'pointer',
                  boxShadow:'0 1px 4px #b4884d22',
                  transition:'background 0.2s',
                  letterSpacing:'1px'
                }} onClick={handleBuyNow}>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Related Products Section moved below split box */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h3 style={{margin:'32px 0 16px 0',color:'#b4884d',fontWeight:700,fontSize:'1.25rem'}}>Related Products</h3>
            <div className="related-products-scroll">
              <div className="related-products-row">
                {relatedProducts.map(rp => {
                  const displayVariant = (rp.variants || []).find(v => v.showInStore !== false) || (rp.variants || [])[0] || {};
                  return (
                    <div
                      key={rp._id}
                      className="related-product-card"
                      onClick={() => navigate(`/product/${rp._id}`)}
                    >
                      <div className="related-product-img">
                        {displayVariant.imageUrl
                          ? <img src={displayVariant.imageUrl} alt={rp.name} />
                          : <div className="no-image" style={{background:'#f4e9db',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#b4884d'}}>No Image</div>
                        }
                      </div>
                      <div className="related-product-info">
                        <div className="related-product-title">{rp.name}</div>
                        <div className="related-product-material">{displayVariant.material}</div>
                        <div className="related-product-price">₹{displayVariant.price}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* MiniCart overlay */}
      <MiniCart open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
    </>
  );
};

export default ProductDetails;
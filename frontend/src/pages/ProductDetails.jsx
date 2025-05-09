import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./ProductDetails.css";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { FaUserCircle, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState("");
  const [pincode, setPincode] = useState("");
  const [pinSuggestions, setPinSuggestions] = useState([]);
  const [loadingPin, setLoadingPin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState("");
  const profileRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    setError("");
    axios
      .get(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Error fetching product details."
        );
        setLoading(false);
      });
  }, [id]);

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

  const handleAddToCart = () => {
    if (!product || !product.variants || !product.variants[selectedVariantIdx]) return;
    const variant = product.variants[selectedVariantIdx];
    dispatch(addToCart({
      _id: product._id + '-' + selectedVariantIdx,
      productId: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      ...variant,
      imageUrl: variant.imageUrl,
      price: variant.price,
      material: variant.material,
    }));
    navigate("/cart");
  };

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

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="product-detail-skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container" style={{ color: 'red', fontWeight: 600, fontSize: 18 }}>
        {error}
      </div>
    );
  }

  if (!product) {
    return <div className="product-detail-container">Product not found.</div>;
  }

  const variants = product.variants || [];
  const selectedVariant = variants[selectedVariantIdx] || {};

  return (
    <>
      {/* Top Navigation Bar (copied from HomePage) */}
      <nav className="navbar">
        <h1 className="logo" style={{display:'flex',alignItems:'center',gap:8}}>
          🛕 Divine Kart
        </h1>
        <input
          type="text"
          placeholder="Search products..."
          className="search-bar"
          style={{border:'1px solid #e4c28b'}}
          disabled
        />
        <div className="nav-links">
          <Link to="/" className="nav-link" style={{fontWeight:'bold'}}>Home</Link>
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
                    // setShowLogin(true); // If you have a login popup
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
      {/* Home Button */}
      <div style={{margin:'0 0 18px 0',paddingLeft:0,display:'flex',justifyContent:'flex-start'}}>
        <Link to="/" style={{color:'#b4884d',fontWeight:'bold',fontSize:16,textDecoration:'none',display:'inline-block',background:'#fffaf3',padding:'8px 22px',borderRadius:'8px',boxShadow:'0 1px 4px #b4884d11'}}>
          Home
        </Link>
      </div>
      <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',gap:56,width:'100%',padding:'0 0 40px 0'}}>
        {/* Left: Product Image and Description */}
        <div style={{flex:1,maxWidth:500,background:'#fff',borderRadius:16,boxShadow:'0 2px 12px #b4884d13',padding:'28px 28px 22px 28px',display:'flex',flexDirection:'column',alignItems:'center',minWidth:260}}>
          {selectedVariant.imageUrl ? (
            <img
              src={selectedVariant.imageUrl}
              alt={product.name}
              style={{width:260,height:260,objectFit:'contain',background:'#f4e9db',borderRadius:12,boxShadow:'0 1px 6px #b4884d22',marginBottom:22}}
            />
          ) : (
            <div className="no-image" style={{
              width:260,
              height:260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f4e9db',
              borderRadius: '12px',
              fontSize:'1.1rem',
              color:'#b4884d',
              boxShadow:'0 1px 6px #b4884d22',
              marginBottom:22
            }}>No Image</div>
          )}
          {/* Description section below image */}
          <div style={{width:'100%',background:'#fffaf3',borderRadius:10,padding:'18px 16px',boxShadow:'0 1px 4px #b4884d11',fontSize:'15px'}}>
            <h3 style={{marginBottom:8,color:'#b4884d',fontSize:'1.08rem'}}>Product Description</h3>
            <p><strong>Dimensions:</strong> {selectedVariant.dimensions ? `${selectedVariant.dimensions.height} x ${selectedVariant.dimensions.width} x ${selectedVariant.dimensions.depth} cm` : '-'}</p>
            <p><strong>Material:</strong> {selectedVariant.material}</p>
            <p><strong>Description:</strong> {product.description}</p>
          </div>
        </div>
        {/* Right: Product Info */}
        <div style={{flex:1,maxWidth:500,background:'#fff',borderRadius:16,boxShadow:'0 2px 12px #b4884d13',padding:'36px 36px 24px 36px',display:'flex',flexDirection:'column',alignItems:'center',minWidth:260}}>
          <h2 style={{fontSize:'1.45rem',marginBottom:12,color:'#b4884d',fontWeight:700}}>{product.name}</h2>
          <p style={{fontSize:'1.18rem',color:'#b4884d',fontWeight:600,margin:'10px 0'}}><strong>Price:</strong> ₹{selectedVariant.price}</p>
          {variants.length > 1 && (
            <div style={{margin:'14px 0',width:'100%'}}>
              <label htmlFor="variant-select"><strong>Choose Material:</strong></label>
              <select id="variant-select" value={selectedVariantIdx} onChange={e => setSelectedVariantIdx(Number(e.target.value))} style={{marginLeft:8,padding:'7px 14px',borderRadius:7,border:'1px solid #e4c28b',background:'#fffdf8',color:'#5c3a1e',width:'65%'}}>
                {variants.map((v, idx) => (
                  <option key={idx} value={idx}>{v.material}</option>
                ))}
              </select>
            </div>
          )}
          <p style={{margin:'10px 0'}}><strong>Material:</strong> {selectedVariant.material}</p>
          <button className="add-to-cart-btn" style={{marginTop:24,padding:'14px 0',fontSize:'1.08rem',fontWeight:600,background:'#b4884d',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',boxShadow:'0 1px 4px #b4884d22',width:'100%'}} onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
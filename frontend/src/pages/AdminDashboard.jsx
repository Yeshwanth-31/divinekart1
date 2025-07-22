import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import CategoryManagement from './CategoryManagement';
import AdminDashboardOrder from './AdminDashboardOrder';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editProductId, setEditProductId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null); // For info panel
  const navigate = useNavigate();
  const variantsScrollRef = useRef(null);

  useEffect(() => {
    if (activeMenu === 'products') fetchProducts();
    if (activeMenu === 'categories') fetchCategories();
    if (activeMenu === 'orders') fetchOrders();
  }, [activeMenu]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/products');
      // Accept both {products: [...]} and [...] as response
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (Array.isArray(response.data.products)) {
        setProducts(response.data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error('Delete error:', err.response?.data || err.message); // Add this for debugging
        setError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  // Sidebar menu items
  const menuItems = [
    { key: 'products', label: 'View Products' },
    { key: 'add-product', label: 'Add Product' },
    { key: 'categories', label: 'Manage Categories' },
    { key: 'orders', label: 'View Orders' },
  ];

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    // Category filter
    if (categoryFilter !== 'All') {
      // Handle category as array (populated or not)
      if (Array.isArray(product.category)) {
        // Populated: array of objects with .name, or array of strings (ObjectIds)
        const match = product.category.some(cat =>
          (typeof cat === 'object' && cat !== null && cat.name === categoryFilter) ||
          (typeof cat === 'string' && cat === categoryFilter)
        );
        if (!match) return false;
      } else if (
        typeof product.category === 'object' &&
        product.category !== null &&
        product.category.name
      ) {
        if (product.category.name !== categoryFilter) return false;
      } else if (typeof product.category === 'string') {
        if (product.category !== categoryFilter) return false;
      } else {
        return false;
      }
    }
    // Search filter
    if (!search) return true;
    const s = search.toLowerCase();
    // Match productId, category prefix, material prefix
    let catNames = [];
    if (Array.isArray(product.category)) {
      catNames = product.category
        .map(cat =>
          typeof cat === 'object' && cat !== null && cat.name
            ? cat.name.toLowerCase()
            : typeof cat === 'string'
              ? cat.toLowerCase()
              : ''
        );
    } else if (typeof product.category === 'object' && product.category !== null && product.category.name) {
      catNames = [product.category.name.toLowerCase()];
    } else if (typeof product.category === 'string') {
      catNames = [product.category.toLowerCase()];
    }
    const pid = product.productId?.toLowerCase() || '';
    const mat = product.variants?.[0]?.material?.toLowerCase() || '';
    return (
      pid.startsWith(s) ||
      catNames.some(cn => cn.substring(0, 2).startsWith(s)) ||
      mat.substring(0, 2).startsWith(s)
    );
  });

  // Render content based on active menu
  const renderContent = () => {
    if (editProductId) {
      // Render EditProduct in-place, and reset editProductId on cancel/success
      return (
        <EditProduct
          productId={editProductId}
          onCancel={() => setEditProductId(null)}
          onSuccess={() => {
            setEditProductId(null);
            fetchProducts();
          }}
        />
      );
    }
    if (activeMenu === 'products') {
      // Add a wrapper div for flex layout
      return (
        <div className={`products-section-flex${selectedProduct ? ' info-panel-open' : ''}`} style={{display:'flex',position:'relative'}}>
          <div
            className={`products-section products-section-main${selectedProduct ? ' shrink-for-info-panel' : ''}`}
            style={{
              flex: selectedProduct ? '0 0 calc(100% - 420px)' : '1 1 100%',
              maxWidth: selectedProduct ? 'calc(100% - 420px)' : '100%',
              transition: 'max-width 0.2s',
              minWidth: 0,
              overflow: 'visible'
            }}
          >
            <h2>Products</h2>
            {/* Category Breadcrumbs */}
            <div style={{display:'flex',gap:8,overflowX:'auto',marginBottom:16}}>
              <button
                style={{
                  padding:'8px 18px',borderRadius:8,border:'none',
                  background: categoryFilter === 'All' ? '#b4884d' : '#fffaf3',
                  color: categoryFilter === 'All' ? '#fff' : '#5c3a1e',
                  fontWeight:'bold',cursor:'pointer'
                }}
                onClick={() => setCategoryFilter('All')}
              >All</button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  style={{
                    padding:'8px 18px',borderRadius:8,border:'none',
                    background: categoryFilter === cat.name ? '#b4884d' : '#fffaf3',
                    color: categoryFilter === cat.name ? '#fff' : '#5c3a1e',
                    fontWeight:'bold',cursor:'pointer'
                  }}
                  onClick={() => setCategoryFilter(cat.name)}
                >{cat.name}</button>
              ))}
            </div>
            {/* Search Box */}
            <div style={{marginBottom:18}}>
              <input
                type="text"
                placeholder="Search by Product ID, Category, or Material (first 2 letters)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding:'10px 16px',borderRadius:8,border:'1px solid #e4c28b',
                  width:'320px',fontSize:'1rem',marginRight:8
                }}
              />
            </div>
            {loading ? (
              <div className="loading">Loading products...</div>
            ) : (
              <div
                className={`products-grid ${selectedProduct ? 'products-grid-3col' : 'products-grid-4col'}`}
                style={{
                  transition: 'grid-template-columns 0.2s',
                  marginRight: selectedProduct ? 0 : undefined
                }}
              >
                {filteredProducts.length === 0 ? (
                  <div style={{gridColumn: '1/-1', textAlign: 'center', color: '#b4884d', fontSize: '1.2rem', marginTop: 40}}>
                    No products found.
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const variant = Array.isArray(product.variants) && product.variants.length > 0
                      ? product.variants[0]
                      : { price: '-', stock: '-', imageUrl: '', material: '-' };
                    return (
                      <div
                        key={product._id}
                        className={`product-card${selectedProduct && selectedProduct._id === product._id ? ' selected' : ''}`}
                        onClick={() => setSelectedProduct(product)}
                        style={{
                          cursor: 'pointer',
                          border: selectedProduct && selectedProduct._id === product._id ? '2px solid #b4884d' : undefined,
                          height: 355,
                          padding: '0',
                          background: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                        }}
                      >
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
                          {variant.imageUrl ? (
                            <img
                              src={variant.imageUrl}
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
                            <div className="no-image" style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#b4884d'}}>No Image</div>
                          )}
                        </div>
                        <div
                          className="product-info"
                          style={{
                            flex: 1,
                            padding: '8px 14px 2px 14px',
                            background: '#fff',
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start'
                          }}
                        >
                          <h3 style={{marginBottom:4}}>{product.name}</h3>
                          <p style={{margin:'2px 0',fontSize:14}}><strong>Product ID:</strong> {product.productId}</p>
                          <p style={{margin:'2px 0',fontSize:14}}><strong>Price:</strong> ₹{variant.price}</p>
                          <p style={{margin:'2px 0',fontSize:14}}><strong>Stock:</strong> {variant.stock ?? '-'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          {/* Product Info Side Panel */}
          {selectedProduct && (
            <div className="product-info-panel">
              {/* Fixed Header */}
              <div className="info-panel-header">
                <button className="close-info-panel" onClick={() => setSelectedProduct(null)} title="Close">×</button>
                <h2 style={{marginTop:0}}>{selectedProduct.name}</h2>
                <p><strong>Product ID:</strong> {selectedProduct.productId}</p>
                <p><strong>Description:</strong> {selectedProduct.description}</p>
                <p><strong>Category:</strong> {
                  Array.isArray(selectedProduct.category)
                    ? selectedProduct.category.map(cat =>
                        typeof cat === 'object' && cat !== null && cat.name
                          ? cat.name
                          : typeof cat === 'string'
                            ? cat
                            : '-'
                      ).join(', ')
                    : (selectedProduct.category?.name || selectedProduct.category || '-')
                }</p>
              </div>
              {/* Scrollable Variants */}
              <div className="info-panel-variants-scroll" ref={variantsScrollRef}>
                <h4 style={{marginTop:0}}>Variants:</h4>
                <div className="variant-list">
                  {selectedProduct.variants.map((variant, idx) => (
                    <div key={idx} className="variant-info-panel">
                      <p><strong>Variant Product ID:</strong> {variant.productId}</p>
                      <p><strong>Material:</strong> {variant.material}</p>
                      <p><strong>Dimensions:</strong> 
                        {['height', 'width', 'depth'].map(dim =>
                          variant.dimensions?.[dim]?.value
                            ? ` ${dim.charAt(0).toUpperCase() + dim.slice(1)}: ${variant.dimensions[dim].value} ${variant.dimensions[dim].unit}`
                            : ''
                        ).join(',') || ' -'}
                      </p>
                      <p><strong>Weight:</strong> {variant.weight ? `${variant.weight.value} ${variant.weight.unit}` : '-'}</p>
                      <p><strong>Image:</strong></p>
                      {/* Custom Fields above image */}
                      {variant.customFields && variant.customFields.length > 0 && (
                        <div>
                          <strong>Custom Fields:</strong>
                          <ul>
                            {variant.customFields.map((field, fidx) => (
                              <li key={fidx}>{field.label}: {field.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {variant.imageUrl && (
                        <img src={variant.imageUrl} alt="Variant" style={{width:120,margin:'8px 0',borderRadius:8}} />
                      )}
                      <p><strong>Direct Delivery:</strong> {variant.directDelivery ? 'Yes' : 'No'}</p>
                      <p><strong>Price Notes:</strong> {variant.priceNotes || '-'}</p>
                      <p><strong>Price:</strong> ₹{variant.price}</p>
                      <p><strong>Stock:</strong> {variant.stock ?? '-'}</p>
                      <p><strong>Show in Store:</strong> {variant.showInStore ? 'Yes' : 'No'}</p>
                      <hr style={{margin:'12px 0'}} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeMenu === 'add-product') {
      return <AddProduct />;
    }
    if (activeMenu === 'categories') {
      return <CategoryManagement />;
    }
    if (activeMenu === 'orders') {
      return <AdminDashboardOrder />;
    }
    return null;
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
          <img
            src={logoImg}
            alt="Divine Kart Logo"
            style={{height: 40, width: 40, borderRadius: '50%', objectFit: 'cover', background: '#fff'}}
          />
          <h2 style={{margin:0}}>Admin Panel</h2>
        </div>
        <ul className="admin-menu">
          {menuItems.map(item => (
            <li
              key={item.key}
              className={`admin-menu-item${activeMenu === item.key ? ' active' : ''}`}
              onClick={() => {
                setActiveMenu(item.key);
                setEditProductId(null);
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </aside>
      <main className="admin-content">
        {error && <div className="error-message">{error}</div>}
        {/* Sticky Navbar */}
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;

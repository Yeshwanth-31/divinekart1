import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [tab, setTab] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    category: '',
    material: '',
    price: '',
    description: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    material: '',
    price: '',
    description: '',
    image: null, // New file to upload
    imagePreview: '', // Existing image URL
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
      console.log('Fetched products:', response.data);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (tab === 'categories') {
      axios.get('http://localhost:5000/api/categories')
        .then(res => setCategories(res.data))
        .catch(() => setCategories([]));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'orders') {
      setOrdersLoading(true);
      setOrdersError('');
      const token = localStorage.getItem('token');
      axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setOrders(res.data))
        .catch(() => setOrdersError('Failed to fetch orders'))
        .finally(() => setOrdersLoading(false));
    }
  }, [tab]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      setProduct({ ...product, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.name || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }
    if (!variants[0].imageUrl) {
      setError('Please upload an image for the first variant.');
      return;
    }

    // Validate all required variant fields
    const v = variants[0];
    if (
      !v.material ||
      !v.price ||
      !v.dimensions.height ||
      !v.dimensions.width ||
      !v.dimensions.depth ||
      !v.weight.value
    ) {
      setError('Please fill in all required fields for the main variant.');
      return;
    }

    // Convert all number fields to numbers
    const cleanVariants = variants.map(variant => ({
      ...variant,
      price: Number(variant.price),
      dimensions: {
        height: Number(variant.dimensions.height),
        width: Number(variant.dimensions.width),
        depth: Number(variant.dimensions.depth),
      },
      weight: {
        value: Number(variant.weight.value),
        unit: variant.weight.unit,
      },
      imageUrl: variant.imageUrl,
      directDelivery: !!variant.directDelivery,
      priceNotes: variant.priceNotes || '',
      material: variant.material,
    }));

    try {
      const payload = {
        name: product.name,
        category: product.category,
        description: product.description,
        variants: [
          {
            material: product.material,
            price: parseFloat(product.price),
            dimensions: {
              height: Number(product.height),
              width: Number(product.width),
              depth: Number(product.depth),
            },
            weight: {
              value: Number(product.weightValue),
              unit: product.weightUnit || 'kg',
            },
            imageUrl: imageUrl,
            directDelivery: !!product.directDelivery,
            priceNotes: product.priceNotes || '',
          }
        ]
      };
      await axios.put(`/api/products/${id}`, payload);
      setSuccess('Product updated successfully');
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        fetchProducts();
      } catch (err) {
        setError('Failed to delete product');
      }
    }
  };

  const handleEditClick = (product) => {
    setEditingProductId(product._id);
    setEditForm({
      name: product.name,
      category: product.category,
      material: product.material,
      price: product.price,
      description: product.description,
      image: null,
      imagePreview: product.image, // Store the current image URL
    });
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setEditForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      let updatedData = { ...editForm };

      if (editForm.image) {
        const formData = new FormData();
        formData.append('file', editForm.image);
        formData.append('upload_preset', 'divinekartpreset');

        const cloudRes = await axios.post(
          'https://api.cloudinary.com/v1_1/dtxmdveob/image/upload',
          formData
        );

        updatedData.image = cloudRes.data.secure_url;
      } else {
        updatedData.image = editForm.imagePreview;
      }

      delete updatedData.imagePreview;

      await axios.put(`http://localhost:5000/api/products/${editingProductId}`, updatedData);
      alert('Product updated!');
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update product.');
    }
  };

  const handleCategoryChange = (e) => {
    setProduct({ ...product, category: e.target.value });
    if (e.target.value === '__add_new__') {
      setShowAddCategory(true);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setProduct({ ...product, category: newCategory });
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    document.body.classList.add('modal-open');
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    document.body.classList.remove('modal-open');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <button onClick={() => navigate('/admin/add-product')} className="add-button">
            Add New Product
          </button>
          <button onClick={() => navigate('/admin/categories')} className="manage-button">
            Manage Categories
          </button>
          <button onClick={() => navigate('/admin/orders')} className="orders-button">
            View Orders
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="products-section">
        <h2>Products</h2>
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                {product.variants?.[0]?.imageUrl ? (
                  <img src={product.variants[0].imageUrl} alt={product.name} className="product-image" />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <p><strong>Material:</strong> {product.variants?.[0]?.material}</p>
                  <div className="product-actions">
                    <button
                      onClick={() => navigate(`/admin/edit-product/${product._id}`)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingProductId && (
        <form onSubmit={handleUpdate} className="edit-product-form">
          <div className="variants-section">
            <h3>Edit Product Variants</h3>
            {editForm.variants && editForm.variants.map((variant, index) => (
              <div key={index} className="variant-card">
                <h4>Variant {index + 1}</h4>
                {/* ...variant fields for editing... */}
              </div>
            ))}
            <button
              type="button"
              className="add-variant-btn"
              style={{marginTop:'12px',padding:'8px 18px',background:'#b4884d',color:'#fff',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}
              onClick={() => setEditForm(prev => ({
                ...prev,
                variants: [
                  ...(prev.variants || []),
                  {
                    material: '',
                    price: '',
                    dimensions: { height: '', width: '', depth: '' },
                    weight: { value: '', unit: 'kg' },
                    imageUrl: '',
                    directDelivery: false,
                    priceNotes: ''
                  }
                ]
              }))}
            >
              + Add Variant
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminDashboard;

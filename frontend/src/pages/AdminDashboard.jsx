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

  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err.message);
    }
  };

  useEffect(() => {
    if (tab === 'view') {
      fetchProducts();
    }
  }, [tab]);

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

    if (!product.image) {
      alert("Please upload an image first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', product.image);
      formData.append('upload_preset', 'divinekartpreset');

      const cloudRes = await axios.post(
        'https://api.cloudinary.com/v1_1/dtxmdveob/image/upload',
        formData
      );

      const imageUrl = cloudRes.data.secure_url;

      const payload = {
        ...product,
        price: parseFloat(product.price),
        image: imageUrl,
      };

      await axios.post('http://localhost:5000/api/products', payload);

      alert('Product added successfully!');
      setProduct({
        name: '',
        category: '',
        material: '',
        price: '',
        description: '',
        image: null,
      });
      setImagePreview(null);
    } catch (err) {
      console.error("Error adding product:", err.response?.data || err.message);
      alert('Error adding product.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        alert('Product deleted!');
        fetchProducts();
      } catch (err) {
        console.error("Error deleting product:", err.message);
        alert('Failed to delete product.');
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
    <div className="admin-dashboard-wrapper">
      <div className="admin-dashboard-container">
        <h2 className="admin-heading">Admin Dashboard</h2>

        {tab === null && (
          <div className="tab-buttons">
            <button onClick={() => setTab('add')}>➕ Add Product</button>
            <button onClick={() => setTab('view')}>👁️ View Products</button>
            <button onClick={() => setTab('categories')}>📂 Manage Categories</button>
            <button onClick={() => navigate('/admin/orders')}>📦 Order Details</button>
          </div>
        )}

        {tab === 'categories' && (
          <>
            <div className="tab-buttons">
              <button className="back-btn" onClick={() => setTab(null)}>← Back</button>
            </div>
            <div className="admin-card category-card">
              <h3>Categories</h3>
              <ul className="category-list">
                {categories.map((cat) => (
                  <li key={cat._id || cat.name}>
                    {cat.name || cat}
                    <button onClick={async () => {
                      if (cat._id) {
                        await axios.delete(`http://localhost:5000/api/categories/${cat._id}`);
                        setCategories(categories.filter((c) => c._id !== cat._id));
                      }
                    }}>🗑️</button>
                  </li>
                ))}
              </ul>
              <form className="add-category-form" onSubmit={async (e) => {
                e.preventDefault();
                const input = e.target.elements[0];
                const name = input.value.trim();
                if (!name) return;
                try {
                  const res = await axios.post('http://localhost:5000/api/categories', { name });
                  setCategories([...categories, res.data]);
                  input.value = '';
                } catch (err) {
                  alert('Category already exists or error occurred.');
                }
              }}>
                <input type="text" placeholder="New category" required />
                <button type="submit">Add Category</button>
              </form>
            </div>
          </>
        )}

        {tab === 'orders' && (
          <>
            <div className="tab-buttons">
              <button className="back-btn" onClick={() => setTab(null)}>← Back</button>
            </div>
            <div className="admin-card order-card">
              <h3>Order Details</h3>
              {ordersLoading ? (
                <div className="order-loading">Loading orders...</div>
              ) : ordersError ? (
                <div className="order-error">{ordersError}</div>
              ) : orders.length === 0 ? (
                <div className="order-empty">No orders found.</div>
              ) : (
                <div className="order-table-wrapper">
                  <table className="order-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>User</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, idx) => (
                        <tr key={order._id}>
                          <td>{order._id}</td>
                          <td>{order.user?.email || 'N/A'}<br/>{order.user?.name || ''}</td>
                          <td>
                            {order.items.map((item, i) => (
                              <div key={i}>
                                {item.product?.name || 'Product'} x{item.quantity}
                              </div>
                            ))}
                          </td>
                          <td>₹{order.totalAmount}</td>
                          <td>{order.status}</td>
                          <td>{new Date(order.createdAt).toLocaleString()}</td>
                          <td>
                            <button onClick={() => handleViewOrder(order)}>
                              View Order
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'add' && (
          <>
            <div className="tab-buttons">
              <button className="back-btn" onClick={() => setTab(null)}>← Back</button>
            </div>
            <div className="admin-card">
              <form className="admin-form" onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Name" value={product.name} onChange={handleChange} required />
                <select name="category" value={product.category} onChange={handleCategoryChange} required>
                  <option value="" disabled>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__">➕ Add New Category</option>
                </select>
                {showAddCategory && (
                  <div style={{display:'flex',gap:8,margin:'8px 0'}}>
                    <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category" required />
                    <button type="button" onClick={handleAddCategory}>Add</button>
                    <button type="button" onClick={()=>{setShowAddCategory(false);setNewCategory('')}}>Cancel</button>
                  </div>
                )}
                <input type="text" name="material" placeholder="Material" value={product.material} onChange={handleChange} required />
                <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleChange} required />
                <textarea name="description" placeholder="Description" value={product.description} onChange={handleChange} required />
                <input type="file" name="image" accept="image/*" onChange={handleChange} required />
                {imagePreview && <img src={imagePreview} alt="Preview" className="admin-img-preview" />}
                <button type="submit">Add Product</button>
              </form>
            </div>
          </>
        )}

        {tab === 'view' && (
          <>
            <div className="tab-buttons">
              <button className="back-btn" onClick={() => setTab(null)}>← Back</button>
            </div>
            <div className="product-list">
              {products.length === 0 ? (
                <p>No products available.</p>
              ) : (
                products.map((item) => (
                  <div className="product-item" key={item._id}>
                    <img src={item.imageUrl} alt={item.name} />
                    <h4>{item.name}</h4>
                    <p>{item.category} - {item.material}</p>
                    <p>₹{item.price}</p>
                    <button onClick={() => handleEditClick(item)}>Edit</button>
                    <button onClick={() => handleDelete(item._id)}>Delete</button>
                  </div>
                ))
              )}
            </div>

            {editingProductId && (
              <div className="edit-form">
                <h3>Edit Product</h3>
                <form onSubmit={handleUpdate}>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} required />
                  <select name="category" value={editForm.category} onChange={e => setEditForm(f => ({...f, category: e.target.value}))} required>
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input type="text" name="material" value={editForm.material} onChange={handleEditChange} required />
                  <input type="number" name="price" value={editForm.price} onChange={handleEditChange} required />
                  <textarea name="description" value={editForm.description} onChange={handleEditChange} required />
                  <input type="file" name="image" accept="image/*" onChange={handleEditChange} />
                  {editForm.imagePreview && !editForm.image && (
                    <img src={editForm.imagePreview} alt="Current" className="admin-img-preview" />
                  )}
                  <button type="submit">Update Product</button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
      {selectedOrder && (
        <div className="order-modal">
          <div className="order-modal-content">
            <h2>Order Summary</h2>
            <div className="order-details">
              <p><strong>User:</strong> {selectedOrder.user?.email} ({selectedOrder.user?.name})</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>
              <h3>Items:</h3>
              <ul>
                {selectedOrder.items.map((item, idx) => (
                  <li key={idx}>
                    {item.product?.name} x{item.quantity} - ₹{item.product?.price}
                    {item.product?.imageUrl && (
                      <img src={item.product.imageUrl} alt={item.product.name} style={{width: 40, height: 40, marginLeft: 8}} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <button className="close-btn" onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [tab, setTab] = useState(null);
  const [products, setProducts] = useState([]);
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

  return (
    <div className="admin-dashboard-wrapper">
      <div className="admin-dashboard-container">
        <h2 className="admin-heading">Admin Dashboard</h2>

        {tab === null && (
          <div className="tab-buttons">
            <button onClick={() => setTab('add')}>➕ Add Product</button>
            <button onClick={() => setTab('view')}>👁️ View Products</button>
          </div>
        )}

        {tab === 'add' && (
          <>
            <div className="tab-buttons">
              <button className="back-btn" onClick={() => setTab(null)}>← Back</button>
            </div>
            <div className="admin-card">
              <form className="admin-form" onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Name" value={product.name} onChange={handleChange} required />
                <input type="text" name="category" placeholder="Category" value={product.category} onChange={handleChange} required />
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
                  <input type="text" name="category" value={editForm.category} onChange={handleEditChange} required />
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
    </div>
  );
};

export default AdminDashboard;

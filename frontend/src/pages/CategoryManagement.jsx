import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    materials: []
  });
  const [newMaterial, setNewMaterial] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Failed to fetch categories');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMaterial = () => {
    if (newMaterial.trim() && !formData.materials.includes(newMaterial.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const handleRemoveMaterial = (material) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m !== material)
    }));
  };

  const handleEdit = (category) => {
    setEditingCategory(category._id);
    setFormData({
      name: category.name,
      description: category.description,
      materials: [...category.materials]
    });
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category deleted successfully');
        fetchCategories();
      } catch (err) {
        setError('Failed to delete category');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category updated successfully');
      } else {
        await axios.post('/api/categories', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category added successfully');
      }
      setEditingCategory(null);
      setFormData({ name: '', description: '', materials: [] });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-management-container">
      <div className="category-header">
        <h2>Category Management</h2>
        <button
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="category-content">
        <div className="category-list">
          <h3>Existing Categories</h3>
          {categories.map(category => (
            <div key={category._id} className="category-card">
              <div className="category-info">
                <h4>{category.name}</h4>
                <p>{category.description}</p>
                <div className="materials-list">
                  {category.materials.map(material => (
                    <span key={material} className="material-tag">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
              <div className="category-actions">
                <button
                  className="edit-button"
                  onClick={() => handleEdit(category)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(category._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="category-form">
          <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Materials</label>
              <div className="materials-input">
                <input
                  type="text"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  placeholder="Add a material"
                />
                <button
                  type="button"
                  className="add-material-button"
                  onClick={handleAddMaterial}
                >
                  Add
                </button>
              </div>
              <div className="materials-tags">
                {formData.materials.map(material => (
                  <span key={material} className="material-tag">
                    {material}
                    <button
                      type="button"
                      className="remove-material"
                      onClick={() => handleRemoveMaterial(material)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading
                  ? 'Saving...'
                  : editingCategory
                  ? 'Update Category'
                  : 'Add Category'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setEditingCategory(null);
                    setFormData({ name: '', description: '', materials: [] });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement; 
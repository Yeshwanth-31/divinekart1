import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [variants, setVariants] = useState([{
    material: '',
    price: '',
    dimensions: { height: '', width: '', depth: '' },
    weight: { value: '', unit: 'kg' },
    imageUrl: '',
    directDelivery: false,
    priceNotes: ''
  }]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });

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

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newVariants[index][parent][child] = value;
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
  };

  const handleImageUpload = async (e, variantIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'divinekartpreset');

    try {
      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dtxmdveob/image/upload',
        formData
      );
      handleVariantChange(variantIndex, 'imageUrl', response.data.secure_url);
    } catch (err) {
      setError('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate all required fields for every variant
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (
        !v.material ||
        v.price === '' ||
        v.dimensions.height === '' ||
        v.dimensions.width === '' ||
        v.dimensions.depth === '' ||
        v.weight.value === '' ||
        !v.imageUrl
      ) {
        setError(`Please fill in all required fields for variant ${i + 1}.`);
        setLoading(false);
        return;
      }
    }

    if (!variants[0].imageUrl) {
      setError('Please upload an image for the first variant.');
      setLoading(false);
      return;
    }

    try {
      const productData = {
        ...formData,
        variants
      };

      await axios.post('/api/products', productData);
      setSuccess('Product added successfully');
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <h2>Add New Product</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
    <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>
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
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={e => {
              handleInputChange(e);
              setSelectedCategory(e.target.value);
            }}
            required
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="variants-section">
          <h3>Product Variants</h3>
          {variants.map((variant, index) => (
            <div key={index} className="variant-card">
              <h4>Variant {index + 1}</h4>
              
              <div className="form-group">
                <label>Material</label>
                <select
                  value={variant.material}
                  onChange={e => handleVariantChange(index, 'material', e.target.value)}
                  required
                >
                  <option value="">Select Material</option>
                  {selectedCategory && categories
                    .find(cat => cat._id === selectedCategory)
                    ?.materials.map(material => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={e => handleVariantChange(index, 'price', e.target.value)}
                  required
                />
              </div>

              <div className="dimensions-group">
                <label>Dimensions (cm)</label>
                <div className="dimensions-inputs">
                  <input
                    type="number"
                    placeholder="Height"
                    value={variant.dimensions.height}
                    onChange={e => handleVariantChange(index, 'dimensions.height', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={variant.dimensions.width}
                    onChange={e => handleVariantChange(index, 'dimensions.width', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Depth"
                    value={variant.dimensions.depth}
                    onChange={e => handleVariantChange(index, 'dimensions.depth', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Weight</label>
                <div className="weight-input">
                  <input
                    type="number"
                    value={variant.weight.value}
                    onChange={e => handleVariantChange(index, 'weight.value', e.target.value)}
                    required
                  />
                  <select
                    value={variant.weight.unit}
                    onChange={e => handleVariantChange(index, 'weight.unit', e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Image {index === 0 && <span style={{color:'red'}}>*</span>}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageUpload(e, index)}
                  required={index === 0}
                />
                {variant.imageUrl && (
                  <img
                    src={variant.imageUrl}
                    alt="Preview"
                    className="image-preview"
                  />
                )}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={variant.directDelivery}
                    onChange={e => handleVariantChange(index, 'directDelivery', e.target.checked)}
                  />
                  Direct Delivery Available
                </label>
              </div>

              <div className="form-group">
                <label>Price Notes (Optional)</label>
                <textarea
                  value={variant.priceNotes}
                  onChange={e => handleVariantChange(index, 'priceNotes', e.target.value)}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="add-variant-btn"
            style={{marginTop:'12px',padding:'8px 18px',background:'#b4884d',color:'#fff',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}
            onClick={() => setVariants([...variants, {
              material: '',
              price: '',
              dimensions: { height: '', width: '', depth: '' },
              weight: { value: '', unit: 'kg' },
              imageUrl: '',
              directDelivery: false,
              priceNotes: ''
            }])}
          >
            + Add Variant
          </button>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/admin')}
          >
            Cancel
          </button>
        </div>
    </form>
    </div>
  );
};

export default AddProduct;

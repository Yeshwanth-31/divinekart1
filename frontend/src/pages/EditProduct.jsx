import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    variants: [{
      name: '',
      price: '',
      image: null,
      imageUrl: '',
      material: '',
      dimensions: {
        height: '',
        width: '',
        depth: '',
      },
      weight: {
        value: '',
        unit: '',
      },
      directDelivery: false,
      priceNotes: '',
    }]
  });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product data
        const productRes = await axios.get(`/api/products/${id}`);
        const product = productRes.data;
        
        // Fetch categories
        const categoriesRes = await axios.get('/api/categories');
        setCategories(categoriesRes.data);

        // Set form data
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          category: product.category || '',
          variants: product.variants?.length > 0 ? product.variants.map(variant => ({
            name: variant.name || '',
            price: variant.price || '',
            image: null,
            imageUrl: variant.imageUrl || '',
            material: variant.material || '',
            dimensions: {
              height: variant.dimensions?.height || '',
              width: variant.dimensions?.width || '',
              depth: variant.dimensions?.depth || '',
            },
            weight: {
              value: variant.weight?.value || '',
              unit: variant.weight?.unit || '',
            },
            directDelivery: !!variant.directDelivery,
            priceNotes: variant.priceNotes || '',
          })) : [{
            name: '',
            price: '',
            image: null,
            imageUrl: '',
            material: '',
            dimensions: {
              height: '',
              width: '',
              depth: '',
            },
            weight: {
              value: '',
              unit: '',
            },
            directDelivery: false,
            priceNotes: '',
          }]
        });

        // Set image preview if exists
        if (product.variants?.[0]?.imageUrl) {
          setImagePreview(product.variants[0].imageUrl);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to fetch product data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const handleImageChange = async (e, variantIndex) => {
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

      // Update variant with new image URL
      handleVariantChange(variantIndex, 'imageUrl', response.data.secure_url);
      
      // Update preview if it's the first variant
      if (variantIndex === 0) {
        setImagePreview(response.data.secure_url);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
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
    if (!formData.variants[0].imageUrl) {
      setError('Please upload an image for the first variant.');
      return;
    }
    // Validate all required variant fields
    const v = formData.variants[0];
    if (
      !v.material ||
      v.price === '' ||
      v.dimensions.height === '' ||
      v.dimensions.width === '' ||
      v.dimensions.depth === '' ||
      v.weight.value === ''
    ) {
      setError('Please fill in all required fields for the main variant.');
      return;
    }

    // Convert all number fields to numbers
    const cleanVariants = formData.variants.map(variant => ({
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
      const productData = {
        ...formData,
        variants: cleanVariants
      };
      await axios.put(`/api/products/${id}`, productData);
      setSuccess('Product updated successfully');
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-product-container">
      <h2>Edit Product</h2>
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="edit-product-form">
        <div className="form-group">
          <label>Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Price *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="variants-section">
          <h3>Product Variants</h3>
          {formData.variants.map((variant, index) => (
            <div key={index} className="variant-form">
              <h4>Variant {index + 1}</h4>
              
              <div className="form-group">
                <label>Variant Name {index === 0 && '*'}</label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  required={index === 0}
                  placeholder={index === 0 ? 'Main Variant (Required)' : 'Optional Variant'}
                />
              </div>

              <div className="form-group">
                <label>Variant Price {index === 0 && '*'}</label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                  required={index === 0}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Material {index === 0 && '*'}</label>
                <input
                  type="text"
                  value={variant.material}
                  onChange={(e) => handleVariantChange(index, 'material', e.target.value)}
                  required={index === 0}
                  placeholder={index === 0 ? 'Main Material (Required)' : 'Optional Material'}
                />
              </div>

              <div className="form-group">
                <label>{index === 0 ? 'Product Image *' : 'Variant Image'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, index)}
                />
                {(variant.imageUrl) && (
                  <div className="image-preview">
                    <img 
                      src={variant.imageUrl} 
                      alt="Preview" 
                      style={{ maxWidth: '200px' }} 
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="add-variant-btn"
            style={{marginTop:'12px',padding:'8px 18px',background:'#b4884d',color:'#fff',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}
            onClick={() => setFormData(prev => ({
              ...prev,
              variants: [
                ...prev.variants,
                {
                  name: '',
                  price: '',
                  image: null,
                  imageUrl: '',
                  material: '',
                  dimensions: { height: '', width: '', depth: '' },
                  weight: { value: '', unit: '' },
                  directDelivery: false,
                  priceNotes: ''
                }
              ]
            }))}
          >
            + Add Variant
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            Update Product
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/admin')} 
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct; 
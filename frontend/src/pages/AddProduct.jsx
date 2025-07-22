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
    dimensions: {
      height: { value: '', unit: 'inches' },
      width: { value: '', unit: 'inches' },
      depth: { value: '', unit: 'inches' }
    },
    weight: { value: '', unit: 'kg' },
    imageUrl: '',
    directDelivery: false,
    priceNotes: '',
    customFields: [],
    showInStore: true // <-- new field
  }]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: []
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
    const { name, value, options } = e.target;
    if (name === 'category') {
      // Multi-select
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setFormData(prev => ({
        ...prev,
        category: selected
      }));
      setSelectedCategory(selected[0] || '');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    if (field.startsWith('dimensions.')) {
      const [, dim, subfield] = field.split('.');
      newVariants[index].dimensions[dim][subfield] = value;
    } else if (field.startsWith('weight.')) {
      const [, subfield] = field.split('.');
      newVariants[index].weight[subfield] = value;
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

  const handleCustomFieldChange = (variantIdx, fieldIdx, key, value) => {
    setVariants(prev => {
      const updated = [...prev];
      updated[variantIdx].customFields[fieldIdx][key] = value;
      return updated;
    });
  };

  const handleAddCustomField = (variantIdx) => {
    setVariants(prev => {
      const updated = [...prev];
      updated[variantIdx].customFields = [
        ...(updated[variantIdx].customFields || []),
        { label: '', value: '' }
      ];
      return updated;
    });
  };

  const handleRemoveCustomField = (variantIdx, fieldIdx) => {
    setVariants(prev => {
      const updated = [...prev];
      updated[variantIdx].customFields = updated[variantIdx].customFields.filter((_, i) => i !== fieldIdx);
      return updated;
    });
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
        variants: variants.map(v => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock) || 0,
          weight: {
            value: v.weight.value !== '' ? Number(v.weight.value) : undefined,
            unit: v.weight.unit
          },
          dimensions: {
            height: { value: v.dimensions.height.value !== '' ? Number(v.dimensions.height.value) : undefined, unit: v.dimensions.height.unit },
            width: { value: v.dimensions.width.value !== '' ? Number(v.dimensions.width.value) : undefined, unit: v.dimensions.width.unit },
            depth: { value: v.dimensions.depth.value !== '' ? Number(v.dimensions.depth.value) : undefined, unit: v.dimensions.depth.unit }
          },
          customFields: v.customFields || [],
          showInStore: v.showInStore !== false // default to true if undefined
        }))
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', minHeight: 40 }}>
            {categories.map(category => (
              <label key={category._id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  name="category"
                  value={category._id}
                  checked={formData.category.includes(category._id)}
                  onChange={e => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      category: checked
                        ? [...prev.category, category._id]
                        : prev.category.filter(id => id !== category._id)
                    }));
                    // Optionally update selectedCategory for material dropdown
                    if (checked && !selectedCategory) setSelectedCategory(category._id);
                    if (!checked && selectedCategory === category._id) setSelectedCategory(prev => (prev === category._id ? (formData.category.find(id => id !== category._id) || '') : prev));
                  }}
                  style={{ marginRight: 4 }}
                />
                {category.name}
              </label>
            ))}
          </div>
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

              <div className="dimensions-group">
                <label>Dimensions (Optional)</label>
                <div className="dimensions-inputs" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', minHeight: '70px' }}>
                  {['height', 'width', 'depth'].map(dim => (
                    <div key={dim} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '110px' }}>
                      <span style={{ fontSize: '13px', marginBottom: '2px' }}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="any"
                          placeholder={dim.charAt(0).toUpperCase() + dim.slice(1)}
                          value={variant.dimensions[dim].value}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || !isNaN(val)) {
                              handleVariantChange(index, `dimensions.${dim}.value`, val);
                            }
                          }}
                          style={{ width: '70px', marginRight: '2px' }}
                          min="0"
                        />
                        <select
                          value={variant.dimensions[dim].unit}
                          onChange={e => handleVariantChange(index, `dimensions.${dim}.unit`, e.target.value)}
                          style={{ width: '60px' }}
                        >
                          <option value="cm">cm</option>
                          <option value="inches">inches</option>
                          <option value="meters">meters</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group weight-group">
                <label>Weight (Optional)</label>
                <div className="weight-input" style={{ maxWidth: '120px' }}>
                  <input
                    type="number"
                    step="any"
                    value={variant.weight.value}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || !isNaN(val)) {
                        handleVariantChange(index, 'weight.value', val);
                      }
                    }}
                    style={{ width: '60px' }}
                    min="0"
                  />
                  <select
                    value={variant.weight.unit}
                    onChange={e => handleVariantChange(index, 'weight.unit', e.target.value)}
                    style={{ width: '50px' }}
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

              {/* Custom Fields Section */}
              <div className="form-group">
                <label>Custom Fields (Optional)</label>
                {(variant.customFields || []).map((field, fieldIdx) => (
                  <div key={fieldIdx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Field Label"
                      value={field.label}
                      onChange={e => handleCustomFieldChange(index, fieldIdx, 'label', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Field Value"
                      value={field.value}
                      onChange={e => handleCustomFieldChange(index, fieldIdx, 'value', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="remove-variant-btn"
                      style={{ padding: '0 10px', marginTop: 0, marginLeft: 0, height: 36 }}
                      onClick={() => handleRemoveCustomField(index, fieldIdx)}
                      title="Remove Field"
                    >✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-variant-btn"
                  style={{ marginTop: 4, padding: '4px 12px', fontSize: 14 }}
                  onClick={() => handleAddCustomField(index)}
                >
                  + Add Field
                </button>
              </div>

              <div className="form-group price-group">
                <label>Price</label>
                <input
                  type="text"
                  value={variant.price}
                  onChange={e => handleVariantChange(index, 'price', e.target.value)}
                  required
                  className="price-input"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  style={{ width: '120px' }}
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  value={variant.stock || ''}
                  onChange={e => handleVariantChange(index, 'stock', e.target.value)}
                  required
                  style={{ width: '120px' }}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={variant.showInStore}
                    onChange={e => handleVariantChange(index, 'showInStore', e.target.checked)}
                  />
                  Show this variant in customer store
                </label>
              </div>

              {index > 0 && (
                <button
                  type="button"
                  className="remove-variant-btn"
                  onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                >
                  Remove Variant
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-variant-btn"
            style={{marginTop:'12px',padding:'8px 18px',background:'#b4884d',color:'#fff',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}
            onClick={() => setVariants([...variants, {
              material: '',
              price: '',
              dimensions: { height: { value: '', unit: 'inches' }, width: { value: '', unit: 'inches' }, depth: { value: '', unit: 'inches' } },
              weight: { value: '', unit: 'kg' },
              imageUrl: '',
              directDelivery: false,
              priceNotes: '',
              customFields: [],
              showInStore: true
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

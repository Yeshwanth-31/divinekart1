import React, { useState } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Upload image to Cloudinary
      const formData = new FormData();
      formData.append('file', image);
      formData.append('upload_preset', 'divinekartpreset');

      const cloudRes = await axios.post(
        'https://api.cloudinary.com/v1_1/dtxmdveob/image/upload', // Replace <your_cloud_name> with 'divinekart'
        formData
      );

      const imageUrl = cloudRes.data.secure_url;

      // 2. Send product data to backend
      const res = await axios.post('http://localhost:5000/api/products', {
        name,
        description,
        category,
        material,
        price,
        image: imageUrl, // match backend schema
      });

      alert('✅ Product added successfully!');
      console.log('Product added:', res.data);
      navigate('/');
    } catch (err) {
      console.error('❌ Upload failed:', err.response?.data || err.message);
      alert('Failed to add product');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" required />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
      <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required />
      <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Material" required />
      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" required />
      <input type="file" onChange={(e) => setImage(e.target.files[0])} accept="image/*" required />
      <button type="submit">Add Product</button>
    </form>
  );
};

export default AddProduct;

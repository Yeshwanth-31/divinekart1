import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductDetails.css";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    setError("");
    axios
      .get(`http://localhost:5000/api/products/${id}`)
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

  const handleAddToCart = () => {
    dispatch(addToCart(product));
    navigate("/cart");
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

  return (
    <div className="product-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="product-image-section">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-detail-image"
          />
        ) : (
          <div className="no-image" style={{
            height: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f4e9db',
            borderRadius: '16px'
          }}>No Image</div>
        )}
      </div>
      <div className="product-info-section">
        <h2>{product.name}</h2>
        <p className="product-price">₹{product.price}</p>
        <p><strong>Category:</strong> {product.category}</p>
        <p><strong>Material:</strong> {product.material}</p>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
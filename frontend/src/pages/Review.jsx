import React, { useState } from 'react';
import './Review.css';
import '../index.css';

// Mock data for demonstration
const initialReviews = [
  {
    id: 1,
    user: 'Alice',
    product: 'Handcrafted Vase',
    rating: 5,
    text: 'Absolutely beautiful! The quality is amazing and delivery was quick.',
    date: '2024-05-01',
  },
  {
    id: 2,
    user: 'Bob',
    product: 'Bamboo Basket',
    rating: 4,
    text: 'Very sturdy and looks great in my kitchen.',
    date: '2024-05-03',
  },
  {
    id: 3,
    user: 'Priya',
    product: 'Terracotta Pot',
    rating: 5,
    text: 'Loved the craftsmanship. Will order again!',
    date: '2024-05-05',
  },
];

const productOptions = [
  'Handcrafted Vase',
  'Bamboo Basket',
  'Terracotta Pot',
  'Wooden Plate',
];

const Review = () => {
  const [reviews, setReviews] = useState(initialReviews);
  const [form, setForm] = useState({
    user: '',
    product: '',
    rating: 5,
    text: '',
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle rating change for create form
  const handleRatingChange = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  // Handle rating change for edit form
  const handleEditRatingChange = (rating) => {
    setEditForm((prev) => ({ ...prev, rating }));
  };

  // Create or update review
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.user || !form.product || !form.text) {
      setError('Please fill in all fields.');
      return;
    }
    if (editId) {
      // Update
      setReviews(reviews.map(r =>
        r.id === editId ? { ...editForm, id: editId, date: r.date } : r
      ));
      setEditId(null);
      setEditForm({});
      setSuccess('Review updated!');
    } else {
      // Create
      const newReview = {
        ...form,
        id: reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
        date: new Date().toISOString().slice(0, 10),
      };
      setReviews([newReview, ...reviews]);
      setForm({ user: '', product: '', rating: 5, text: '' });
      setSuccess('Review submitted!');
    }
    setTimeout(() => setSuccess(''), 2000);
  };

  // Start editing a review
  const handleEdit = (review) => {
    setEditId(review.id);
    setEditForm({ ...review });
    setError('');
    setSuccess('');
  };

  // Handle edit form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Save edited review
  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editForm.user || !editForm.product || !editForm.text) {
      setError('Please fill in all fields.');
      return;
    }
    setReviews(reviews.map(r =>
      r.id === editId ? { ...editForm, id: editId, date: r.date } : r
    ));
    setEditId(null);
    setEditForm({});
    setSuccess('Review updated!');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditId(null);
    setEditForm({});
    setError('');
  };

  // Delete a review
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  return (
    <div className="category-management-wrapper">
      <div className="category-management-content">
        <div className="category-panel">
          <div className="section-title">Existing Categories</div>
          <div className="categories-list">
            {reviews.map((review) => (
              <div key={review.id} className="category-card">
                <div>{review.user}</div>
                <div>{review.product}</div>
                <div className="category-material">{review.rating}</div>
                <div className="category-actions">
                  <button className="edit-btn" onClick={() => handleEdit(review)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(review.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="category-panel">
          <div className="section-title">Add New Category</div>
          <form className="add-edit-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="user"
                placeholder="Your Name"
                value={form.user}
                onChange={handleChange}
                required
              />
              <select
                name="product"
                value={form.product}
                onChange={handleChange}
                required
              >
                <option value="">Select Product</option>
                {productOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="star-rating-input">
                {[1,2,3,4,5].map((star) => (
                  <span
                    key={star}
                    className={star <= form.rating ? 'star filled' : 'star'}
                    onClick={() => handleRatingChange(star)}
                    role="button"
                    tabIndex={0}
                  >&#9733;</span>
                ))}
              </div>
            </div>
            <textarea
              name="text"
              placeholder="Write your review..."
              value={form.text}
              onChange={handleChange}
              required
            />
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <div className="form-actions">
              <button className="add-btn">Add Review</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Review;
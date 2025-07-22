import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaUser, FaShoppingCart, FaCheckCircle, FaClock, FaRupeeSign, FaEdit, FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', password: '', location: '' });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pinSuggestions, setPinSuggestions] = useState([]);
  const [loadingPin, setLoadingPin] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view your profile.');
          setLoading(false);
          return;
        }
        const response = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
        if (response.data && response.data.user && response.data.user.address) {
          setAddress(formatAddress(response.data.user.address));
        }
      } catch (err) {
        setError('Failed to load profile. Please make sure you are logged in and the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (pincode.length !== 6 || isNaN(pincode)) {
      setPinSuggestions([]);
      return;
    }
    setLoadingPin(true);
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(res => res.json())
      .then(data => {
        if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          setPinSuggestions(data[0].PostOffice.map(po => ({
            label: `${po.Name}, ${po.District}, ${po.State} (${po.Pincode})`,
            value: `${po.Name}, ${po.District}, ${po.State} (${po.Pincode})`
          })));
        } else {
          setPinSuggestions([]);
        }
        setLoadingPin(false);
      })
      .catch(() => {
        setPinSuggestions([]);
        setLoadingPin(false);
      });
  }, [pincode]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    // Compose address string from object fields
    return [
      addr.name,
      addr.doorNo,
      addr.street,
      addr.area,
      addr.city,
      addr.state,
      addr.pincode,
      addr.country,
      addr.mobile
    ].filter(Boolean).join(', ');
  };

  const handleSelectPinSuggestion = (suggestion) => {
    setPincode(suggestion.value);
    setAddress(suggestion.value);
    setPinSuggestions([]);
  };

  const openEditModal = () => {
    setEditData({
      name: profile.user.name,
      email: profile.user.email,
      password: '',
      location: address || ''
    });
    setEditError('');
    setEditSuccess('');
    setShowEdit(true);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/profile',
        { name: editData.name, email: editData.email, password: editData.password, address: editData.location },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditSuccess('Profile updated successfully!');
      setProfile((prev) => ({
        ...prev,
        user: { ...prev.user, name: editData.name, email: editData.email, address: editData.location }
      }));
      localStorage.setItem(
        'user',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('user')), name: editData.name, email: editData.email, address: editData.location })
      );
      setShowEdit(false);
    } catch (err) {
      setEditError('Failed to update profile.');
    }
  };

  const handleAddressSave = async () => {
    setEditError('');
    setEditSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/profile',
        { address: address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditSuccess('Address updated successfully!');
      setProfile((prev) => ({
        ...prev,
        user: { ...prev.user, address: address }
      }));
      localStorage.setItem(
        'user',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('user')), address: address })
      );
      setShowAddressModal(false);
    } catch (err) {
      setEditError('Failed to update address.');
    }
  };

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return null;

  return (
    <div className="profile-page">
      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </div>
      <div className="profile-tab-content">
        {activeTab === 'profile' && (
          <div className="profile-main-cards">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <FaUser size={32} className="profile-avatar-icon" />
                <span className="profile-card-name">{profile.user.name}</span>
                <button className="profile-edit-btn" onClick={openEditModal} title="Edit Profile">
                  <FaEdit />
                </button>
              </div>
              <div className="profile-card-info">
                <div className="profile-card-label">Email</div>
                <div className="profile-card-value">{profile.user.email}</div>
              </div>
            </div>
            {/* Address Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-label">Addresses</span>
                <button className="profile-edit-btn" onClick={() => setShowAddressModal(true)} title="Edit Address">
                  <FaEdit />
                </button>
              </div>
              <div className="profile-card-info">
                <div className="profile-card-label" style={{fontWeight:400, color:'#888'}}>Default address</div>
                <div className="profile-card-value" style={{whiteSpace:'pre-line'}}>
                  {address || 'No address set'}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="profile-orders-tab">
            <div className="no-orders-yet">No orders yet</div>
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <label>
                Name:
                <input type="text" name="name" value={editData.name} onChange={handleEditChange} required />
              </label>
              <label>
                Email:
                <input type="email" name="email" value={editData.email} onChange={handleEditChange} required />
              </label>
              <label>
                New Password:
                <input type="password" name="password" value={editData.password} onChange={handleEditChange} placeholder="Leave blank to keep current" />
              </label>
              <label>
                Address:
                <input type="text" name="location" value={editData.location} readOnly style={{background:'#f9f9f9', cursor:'pointer'}} onClick={()=>setShowAddressModal(true)} placeholder="Click to set address" />
                <button type="button" className="edit-btn" style={{marginTop:8}} onClick={()=>setShowAddressModal(true)}>Edit Address</button>
              </label>
              {editError && <div className="edit-error">{editError}</div>}
              {editSuccess && <div className="edit-success">{editSuccess}</div>}
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={() => setShowEdit(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Address</h2>
            <input
              type="text"
              placeholder="Enter address..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{width:'100%',marginBottom:12}}
            />
            <div className="modal-actions">
              <button className="save-btn" onClick={() => setShowAddressModal(false)}>Save</button>
              <button className="cancel-btn" onClick={() => setShowAddressModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

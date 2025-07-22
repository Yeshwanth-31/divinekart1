import React, { useState } from 'react';
import axios from 'axios';

const CompleteProfile = () => {
  const [form, setForm] = useState({
    mobile: '',
    pincode: '',
    doorNo: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India'
  });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePincodeChange = async (e) => {
    const pincode = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setForm(f => ({ ...f, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          setForm(f => ({
            ...f,
            city: po.District,
            state: po.State,
            country: 'India'
          }));
          setSuggestions(data[0].PostOffice.map(po => ({
            label: `${po.Name}, ${po.District}, ${po.State} (${po.Pincode})`,
            value: po.Pincode
          })));
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectSuggestion = (s) => {
    setForm(f => ({
      ...f,
      city: s.label.split(',')[1]?.trim() || '',
      state: s.label.split(',')[2]?.split('(')[0]?.trim() || '',
      pincode: s.value
    }));
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', {
        address: form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local user
      const user = JSON.parse(localStorage.getItem('user'));
      user.address = form;
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess('Address updated!');
      setTimeout(() => window.location.href = '/', 1200);
    } catch (err) {
      setError('Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete-profile-container" style={{maxWidth:420,margin:'40px auto',padding:24,background:'#fff',borderRadius:12,boxShadow:'0 2px 16px #b4884d22'}}>
      <h2 style={{marginBottom:18}}>Complete Your Address</h2>
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom:12}}>
          <label>Mobile Number</label>
          <input type="text" name="mobile" value={form.mobile} onChange={handleChange} required maxLength={15} style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Pincode</label>
          <input type="text" name="pincode" value={form.pincode} onChange={handlePincodeChange} required maxLength={6} style={{width:'100%'}} />
          {suggestions.length > 0 && (
            <div style={{background:'#f9f9f9',border:'1px solid #eee',borderRadius:6,marginTop:4}}>
              {suggestions.map(s => (
                <div key={s.value} style={{padding:6,cursor:'pointer'}} onClick={() => handleSelectSuggestion(s)}>
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{marginBottom:12}}>
          <label>Door/Flat/House No.</label>
          <input type="text" name="doorNo" value={form.doorNo} onChange={handleChange} required style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Street/Area</label>
          <input type="text" name="street" value={form.street} onChange={handleChange} required style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Landmark (optional)</label>
          <input type="text" name="landmark" value={form.landmark} onChange={handleChange} style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>City</label>
          <input type="text" name="city" value={form.city} onChange={handleChange} required style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>State</label>
          <input type="text" name="state" value={form.state} onChange={handleChange} required style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Country</label>
          <input type="text" name="country" value={form.country} onChange={handleChange} required style={{width:'100%'}} />
        </div>
        {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
        {success && <div style={{color:'green',marginBottom:8}}>{success}</div>}
        <button type="submit" style={{width:'100%',padding:'10px 0',background:'#b4884d',color:'#fff',border:'none',borderRadius:6,fontWeight:'bold',fontSize:'1.1rem'}} disabled={loading}>
          {loading ? 'Saving...' : 'Update Address'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;

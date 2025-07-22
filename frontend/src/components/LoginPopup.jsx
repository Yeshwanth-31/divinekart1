import React, { useState, useEffect } from 'react';
import './LoginPopup.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPopup = ({ onClose, onLoginSuccess, redirectTo }) => {
  const [activeTab, setActiveTab] = useState('user');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAdminLogin = () => {
    if (email === 'admin' && pass === 'admin') {
      alert('Admin logged in!');
      localStorage.setItem('isAdmin', true);
      onClose();
      if (onLoginSuccess) onLoginSuccess();
      navigate('/admin');
    } else {
      alert('Invalid Admin credentials');
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password: pass,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('Login successful!');
      onClose();
      if (onLoginSuccess) onLoginSuccess(redirectTo);
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  const handleUserSignup = async () => {
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/signup', {
        name,
        email,
        password: pass,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('Signup successful!');
      setIsSignup(false);
      // Redirect to complete profile if address missing
      if (!data.user.address || !data.user.address.pincode) {
        navigate('/complete-profile');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="login-popup-overlay">
      <div className="login-popup">
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="login-tabs">
          <button className={activeTab === 'user' ? 'active' : ''} onClick={() => setActiveTab('user')}>User</button>
          <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}>Admin</button>
        </div>

        {activeTab === 'admin' && (
          <div>
            <h2>🔐 Admin Login</h2>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="login-input" />
            <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} className="login-input" />
            <button className="login-submit" onClick={handleAdminLogin}>Login</button>
          </div>
        )}

        {activeTab === 'user' && (
          <div>
            <h2>{isSignup ? '👤 Sign Up' : '👤 Login'}</h2>
            {isSignup && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-input"
              />
            )}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="login-input" />
            <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} className="login-input" />
            <button className="login-submit" onClick={isSignup ? handleUserSignup : handleUserLogin}>
              {isSignup ? 'Sign Up' : 'Login'}
            </button>
            <p className="toggle-auth" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Already have an account? Login' : 'New user? Sign up'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPopup;

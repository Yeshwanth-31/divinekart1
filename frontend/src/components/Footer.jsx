import React from 'react';
import './Footer.css';
import storeLogo from '../assets/storelogo.png';

const Footer = () => (
  <footer style={{
    background: '#181818',
    color: '#fff',
    padding: '48px 0 0 0',
    fontFamily: "'Poppins', sans-serif",
    marginTop: 60,
    position: 'relative'
  }}>
    <div style={{
      maxWidth: 1400,
      margin: '0 auto',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 32,
      padding: '0 32px'
    }}>
      {/* Contact */}
      <div style={{minWidth: 260, flex: 1}}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 16}}>
          <img
            src={storeLogo}
            alt="Mariappan & Bro's Pooja Stores Logo"
            style={{width: 40, height: 40, marginRight: 8}}
          />
          <span style={{
            color: '#b76b1c',
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            letterSpacing: 1.5,
            fontSize: 18
          }}>Mariappan &amp; Bro's Pooja Stores</span>
        </div>
        <h3 style={{
          borderBottom: '2px solid #fff',
          display: 'inline-block',
          marginBottom: 16,
          color: '#b76b1c',
          fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
          letterSpacing: 1.5,
          fontSize: 16
        }}>GET IN TOUCH</h3>
        <div style={{marginBottom: 10, fontSize: 15}}>
          <div style={{marginBottom: 8}}>
            <span role="img" aria-label="address">🏠</span> 275/137, Old Pet, Krishnagiri, Tamil Nadu 635001
          </div>
          <div style={{marginBottom: 8}}>
            <span role="img" aria-label="phone" style={{color:'#ff5e5e'}}>📞</span>
            <a href="tel:9677445424" style={{color:'#fff', textDecoration:'underline', marginLeft: 6}}>9677445424</a>
          </div>
          <div>
            <span role="img" aria-label="mail" style={{color:'#bfa76a'}}>✉️</span>
            <a href="mailto:mariappanpoojastores@gmail.com" style={{color:'#fff', textDecoration:'underline', marginLeft: 6}}>mariappanpoojastores@gmail.com</a>
          </div>
        </div>
      </div>
      {/* Social & Recaptcha */}
      <div style={{minWidth: 220, flex: 1}}>
        <h3 style={{
          borderBottom: '2px solid #fff',
          display: 'inline-block',
          marginBottom: 16,
          color: '#b76b1c',
          fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
          letterSpacing: 1.5,
          fontSize: 16
        }}>CONNECT</h3>
        <div style={{marginBottom: 16}}>
          <a href="https://www.facebook.com/share/1EiWeJDPY5/" target="_blank" rel="noopener noreferrer" style={{marginRight:12}}>
            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" alt="Facebook" style={{width:32,height:32,filter:'invert(1)'}} />
          </a>
        </div>
        <div style={{fontSize:13, color:'#bbb', marginBottom:8}}>
          <span>This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" style={{color:'#4daaff'}}>Privacy Policy</a> and <a href="https://policies.google.com/terms" style={{color:'#4daaff'}}>Terms of Service</a> apply.</span>
        </div>
      </div>
    </div>
    {/* Bottom bar */}
    <div style={{
      borderTop: '1px solid #333',
      marginTop: 32,
      padding: '18px 0 0 0',
      textAlign: 'center',
      color: '#bbb',
      fontSize: 15,
      background: '#181818'
    }}>
      <div>
        Copyright © {new Date().getFullYear()} Mariappan &amp; Bro&apos;s Pooja Stores. All Rights Reserved.
      </div>
      <div style={{marginTop: 8, marginBottom: 0}}>
        {/* Razorpay logo only */}
        <img src="https://cdn.razorpay.com/logo.svg" alt="Razorpay" style={{height:32, verticalAlign:'middle', background:'#fff', borderRadius:6, padding:'2px 8px'}} />
      </div>
    </div>
  </footer>
);

export default Footer;

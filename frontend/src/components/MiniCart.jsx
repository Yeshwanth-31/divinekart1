import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity } from '../redux/cartSlice';
import { useNavigate } from 'react-router-dom';

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M6.5 8V15M10 8V15M13.5 8V15M3 5.5H17M8.5 3.5H11.5C12.0523 3.5 12.5 3.94772 12.5 4.5V5.5H7.5V4.5C7.5 3.94772 7.94772 3.5 8.5 3.5ZM16 5.5V16.5C16 17.0523 15.5523 17.5 15 17.5H5C4.44772 17.5 4 17.0523 4 16.5V5.5" stroke="#b4884d" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MiniCart = ({ open, onClose }) => {
  const { cartItems } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <div
      className={`minicart-overlay${open ? ' open' : ''}`}
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
        background: open ? 'rgba(0,0,0,0.18)' : 'transparent',
        zIndex: 2000, display: open ? 'block' : 'none'
      }}
    >
      <div
        className="minicart-panel"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, width: 370, height: '100%',
          background: '#fff', boxShadow: '-2px 0 18px #b4884d22', zIndex: 2100,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(.77,0,.18,1)'
        }}
      >
        <div style={{padding:'18px 22px 10px 22px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:700,fontSize:20,color:'#b4884d'}}>MY CART</span>
          <button onClick={onClose} style={{fontSize:22,background:'none',border:'none',color:'#b4884d',cursor:'pointer'}}>×</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'0 0 0 0',background:'#f9f9f9'}}>
          {cartItems.length === 0 ? (
            <div style={{padding:'32px 0',color:'#b4884d',textAlign:'center'}}>Your cart is empty.</div>
          ) : (
            cartItems.map(item => (
              <div key={item._id} style={{
                display:'flex',alignItems:'center',borderBottom:'1px solid #f4e9db',
                padding:'18px 18px',background:'#fff',marginBottom:8
              }}>
                <img src={item.imageUrl} alt={item.name} style={{width:60,height:60,objectFit:'cover',borderRadius:8,background:'#f4e9db',marginRight:14}} />
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{fontWeight:600,fontSize:15,marginBottom:2,whiteSpace:'normal',lineHeight:'1.2'}}>{item.name}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {/* Counter */}
                    <button
                      style={{
                        width:28,height:28,border:'1px solid #e4c28b',background:'#fff',color:'#b4884d',
                        borderRadius:6,fontWeight:700,fontSize:18,cursor:'pointer',lineHeight:1
                      }}
                      onClick={() => dispatch(updateQuantity({ id: item._id, quantity: Math.max(1, item.quantity - 1) }))}
                    >−</button>
                    <span style={{minWidth:24,textAlign:'center',fontSize:15,fontWeight:600}}>{item.quantity}</span>
                    <button
                      style={{
                        width:28,height:28,border:'1px solid #e4c28b',background:'#fff',color:'#b4884d',
                        borderRadius:6,fontWeight:700,fontSize:18,cursor:'pointer',lineHeight:1
                      }}
                      onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                    >+</button>
                  </div>
                  <div style={{fontSize:15,color:'#b4884d',marginTop:4}}>
                    {item.quantity} × ₹{Number(item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
                </div>
                <button
                  onClick={() => dispatch(removeFromCart(item._id))}
                  style={{
                    background:'none',border:'none',marginLeft:8,cursor:'pointer',padding:0,display:'flex',alignItems:'center'
                  }}
                  title="Remove"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
        {/* Sticky bottom subtotal and buttons */}
        <div style={{
          padding:'18px 22px 18px 22px',borderTop:'1px solid #eee',
          background:'#fff',boxShadow:'0 -2px 8px #b4884d11',
          position:'sticky',bottom:0
        }}>
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:17,marginBottom:12}}>
            <span>SUBTOTAL:</span>
            <span>₹{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <button
            style={{
              width:'100%',padding:'10px 0',background:'#b4884d',color:'#fff',border:'none',borderRadius:6,
              fontWeight:600,fontSize:'1rem',marginBottom:8,cursor:'pointer',letterSpacing:0.5
            }}
            onClick={() => { onClose(); navigate('/cart'); }}
          >
            VIEW CART
          </button>
          <button
            style={{
              width:'100%',padding:'10px 0',background:'#ff6a1a',color:'#fff',border:'none',borderRadius:6,
              fontWeight:600,fontSize:'1rem',cursor:'pointer',letterSpacing:0.5
            }}
            onClick={() => { onClose(); navigate('/checkout'); }}
          >
            CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniCart;

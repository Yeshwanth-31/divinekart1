import React, { useEffect, useState } from "react";
import "./CartPage.css";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQuantity, setCartItems } from "../redux/cartSlice";
import { Link } from "react-router-dom";
import axios from "axios";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const [showQR, setShowQR] = useState(false);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const backendItems = response.data?.items || [];

        const formattedItems = backendItems.map(item => ({
          _id: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          imageUrl: item.productId.imageUrl,
          description: item.productId.description,
          quantity: item.quantity,
          material: item.productId.material,
          category: item.productId.category,
          brand: item.productId.brand,
        }));

        dispatch(setCartItems(formattedItems));
      } catch (err) {
        console.error("❌ Failed to fetch cart:", err.message);
      }
    };

    fetchCart();
  }, [dispatch]);

  const handleQuantityChange = async (id, quantity) => {
    if (quantity >= 1) {
      dispatch(updateQuantity({ id, quantity }));

      try {
        const token = localStorage.getItem("token");
        await axios.post("http://localhost:5000/api/cart/update", {
          productId: id,
          quantity,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("❌ Failed to update quantity in DB:", err.message);
      }
    }
  };

  const handleRemoveItem = async (productId) => {
    dispatch(removeFromCart(productId));
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/cart/remove", { productId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("❌ Error removing item from DB:", err.message);
    }
  };

  return (
    <>
      <div className="cart-container">
        <h2 className="cart-title">🛒 Your Shopping Cart</h2>
        <div className="back-home-wrapper">
          <Link to="/" className="back-to-shop">← Back to Home</Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {cartItems.map((item, index) => (
                <div className="cart-item" key={`${item._id}-${index}`}>
                  <img src={item.imageUrl} alt={item.name} className="cart-img" />
                  <div className="cart-details">
                    <h3>{item.name}</h3>
                    {Object.entries(item).map(([key, value]) =>
                      key !== 'description' && key !== '_id' && key !== 'name' && key !== 'imageUrl' && key !== 'quantity' && key !== 'price'
                        ? <p key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}</p>
                        : null
                    )}
                    <p><strong>Price:</strong> ₹{item.price}</p>
                    <div className="quantity-controls">
                      <button onClick={() => handleQuantityChange(item._id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>+</button>
                    </div>
                    <p><strong>Subtotal:</strong> ₹{item.price * item.quantity}</p>
                    <button className="remove-btn" onClick={() => handleRemoveItem(item._id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Total: ₹{totalPrice.toFixed(2)}</h3>
              <button className="checkout-btn" onClick={() => setShowQR(true)}>
                Proceed to Pay
              </button>
            </div>
          </>
        )}
      </div>
      {showQR && (
        <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <h2>Scan to Pay</h2>
            <img src="/payment-qr.png" alt="Payment QR" className="qr-image" />
            <button className="close-qr-btn" onClick={() => setShowQR(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboardOrder.css';

const AdminDashboardOrder = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setOrders(res.data))
      .catch(() => alert('Failed to fetch orders'));
  }, []);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    document.body.classList.add('modal-open');
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    document.body.classList.remove('modal-open');
  };

  const handleDeliveryToggle = (orderId) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId
          ? { ...order, delivered: !order.delivered }
          : order
      )
    );
    // You can make an axios.put call here to update delivery in backend
    // Example:
    // axios.put(`http://localhost:5000/api/orders/${orderId}/deliver`, { delivered: true }, { headers: { Authorization: `Bearer ${token}` } })
  };

  return (
    <div>
      <h2 className="dashboard-title">Order Management Works!</h2>
      <table className="admin-order-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Address</th>
            <th>Details</th>
            <th>Qty</th>
            <th>Email</th>
            <th>Payment Status</th>
            <th>Delivered</th>
            <th>Order Status</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.user?.name || 'N/A'}</td>
              <td>{order.shippingAddress?.street || 'N/A'}</td>
              <td>
                {order.items.map((item, i) => (
                  <div key={i}>{item.product?.name || 'Product'}</div>
                ))}
              </td>
              <td>
                {order.items.map((item, i) => (
                  <div key={i}>{item.quantity}</div>
                ))}
              </td>
              <td>{order.user?.email || 'N/A'}</td>
              <td>{order.paymentStatus}</td>
              <td>
                <input
                  type="checkbox"
                  checked={order.delivered || order.status === 'delivered'}
                  onChange={() => handleDeliveryToggle(order._id)}
                />
              </td>
              <td>{order.status}</td>
              <td>
                <button className="view-btn" onClick={() => handleViewOrder(order)}>
                  View Order
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div className="order-modal">
          <div className="order-modal-content">
            <h2>Order Summary</h2>
            <div className="order-details">
              <p><strong>User:</strong> {selectedOrder.user?.email} ({selectedOrder.user?.name})</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>
              <h3>Items:</h3>
              <ul>
                {selectedOrder.items.map((item, idx) => (
                  <li key={idx}>
                    {item.product?.name} x{item.quantity} - ₹{item.product?.price}
                    {item.product?.imageUrl && (
                      <img src={item.product.imageUrl} alt={item.product.name} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <button className="close-btn" onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardOrder;

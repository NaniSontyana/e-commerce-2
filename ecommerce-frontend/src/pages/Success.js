import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Success.css';

function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState('');

  const BACKEND_URL = 'https://backend-ps76.onrender.com';

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const sessionId = new URLSearchParams(location.search).get('session_id');
      if (!sessionId) {
        setError('No session ID provided');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view order details');
          navigate('/login');
          return;
        }

        const response = await axios.get(`${BACKEND_URL}/api/orders/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Order Details Response:', response.data);
        response.data.items.forEach((item, index) => {
          console.log(`Item ${index} Image URL:`, item.image);
        });

        setOrderDetails(response.data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      }
    };

    fetchOrderDetails();
  }, [location, navigate]);

  const handleReturn = () => {
    navigate('/products');
  };

  const handleOrders = () => {
    navigate('/orders');
  };

  return (
    <div className="success-wrapper">
      <div className="success-container">
        <h1 className="success-title">Order Confirmed!</h1>
        {error ? (
          <p className="error-message">{error}</p> 
        ) : orderDetails ? (
          <>
            <p className="success-message">Thank you for your purchase! Your order has been successfully placed.</p>
            <div className="order-details">
              <h3>Order ID: {orderDetails.orderId}</h3>
              <h4>Items:</h4>
              <ul className="order-items-list">
                {orderDetails.items.map((item, index) => (
                  <li key={index} className="order-item">
                    <img
                      src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                      alt={item.name}
                      onError={(e) => {
                        console.error(`Image failed to load for ${item.name}:`, item.image);
                        e.target.src = 'https://placehold.co/50x50';
                        e.target.classList.add('error-image');
                      }}
                      className="order-item-image"
                    />
                    <span className="order-item-details">
                      {item.name} - Size: {item.size || 'N/A'} - Quantity: {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="order-info">
                <p><strong>Shipping Address:</strong> {orderDetails.shippingAddress.fullName}, {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.postalCode}, {orderDetails.shippingAddress.country}</p>
                <p><strong>Phone:</strong> {orderDetails.shippingAddress.phoneNumber}</p>
                <p><strong>Total:</strong> ₹{orderDetails.total.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> {orderDetails.payment}</p>
                <p><strong>Status:</strong> {orderDetails.status}</p>
                <p><strong>Order Date:</strong> {new Date(orderDetails.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </>
        ) : (
          <p>Loading order details...</p>
        )}
        <div className="button-group">
          <button className="return-btn1" onClick={handleReturn}>
            Back to Products
          </button>
          <button className="return-btn1" onClick={handleOrders}>
            Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default Success;










































/* import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Success.css';

function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState('');

  // Backend base URL for images
  const BACKEND_URL = 'https://backend-ps76.onrender.com';

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const sessionId = new URLSearchParams(location.search).get('session_id');
      if (!sessionId) {
        setError('No session ID provided');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view order details');
          navigate('/login');
          return;
        }

        const response = await axios.get(`${BACKEND_URL}/api/orders/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Log the response and image URLs for debugging
        console.log('Order Details Response:', response.data);
        response.data.items.forEach((item, index) => {
          console.log(`Item ${index} Image URL:`, item.image);
        });

        setOrderDetails(response.data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      }
    };

    fetchOrderDetails();
  }, [location, navigate]);

  const handleReturn = () => {
    navigate('/products');
  };

  const handleOrders = () => {
    navigate('/orders');
  };

  return (
    <div className="success-wrapper">
      <div className="success-container">
        <h1 className="success-title">Order Confirmed!</h1>
        {error ? (
          <p className="error-message">{error}</p>
        ) : orderDetails ? (
          <>
            <p className="success-message">Thank you for your purchase! Your order has been successfully placed.</p>
            <div className="order-details">
              <h3>Order ID: {orderDetails.orderId}</h3>
              <h4>Items:</h4>
              <ul className="order-items-list">
                {orderDetails.items.map((item, index) => (
                  <li key={index} className="order-item">
                    <img
                      src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                      alt={item.name}
                      onError={(e) => {
                        console.error(`Image failed to load for ${item.name}:`, item.image);
                        e.target.src = 'https://placehold.co/50x50';
                        e.target.classList.add('error-image');
                      }}
                      className="order-item-image"
                    />
                    <span className="order-item-details">
                      {item.name} - Quantity: {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="order-info">
                <p><strong>Shipping Address:</strong> {orderDetails.shippingAddress.fullName}, {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.postalCode}, {orderDetails.shippingAddress.country}</p>
                <p><strong>Phone:</strong> {orderDetails.shippingAddress.phoneNumber}</p>
                <p><strong>Total:</strong> ₹{orderDetails.total.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> {orderDetails.payment}</p>
                <p><strong>Status:</strong> {orderDetails.status}</p>
                <p><strong>Order Date:</strong> {new Date(orderDetails.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </>
        ) : (
          <p>Loading order details...</p>
        )}
        <div className="button-group">
          <button className="return-btn1" onClick={handleReturn}>
            Back to Products
          </button>
          <button className="return-btn1" onClick={handleOrders}>
            Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default Success; */














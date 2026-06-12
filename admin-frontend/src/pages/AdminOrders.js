import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useDebounce from '../hooks/useDebounce'; // Ensure this path is correct
import '../styles/AdminOrders.css';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce search term with 500ms delay

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please re-login.');
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `https://backend-ps76.onrender.com/api/orders/admin?page=${page}&limit=10&status=${statusFilter}&sortBy=${sortBy}&order=${sortOrder}&search=${debouncedSearchTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(response.data.orders);
      setFilteredOrders(response.data.orders);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalOrders(response.data.totalOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleViewDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please re-login.');
        return;
      }
      const response = await axios.get(
        `https://backend-ps76.onrender.com/api/orders/admin/details/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedOrder(response.data);
      setModalOpen(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Failed to fetch order details');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please re-login.');
        return;
      }
      await axios.put(
        `https://backend-ps76.onrender.com/api/orders/admin/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      setFilteredOrders(filteredOrders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, statusFilter, sortBy, sortOrder, debouncedSearchTerm]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
      <div className="header-section">
        <h1 className="admin-title">Order Management Hub</h1>
        <button onClick={handleBackToDashboard} className="dashboard-btn">
          Back to Dashboard
        </button>
      </div>
      <div className="control-panel">
        <div className="search-group">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by Order ID or User Email"
            className="search-input"
            aria-label="Search orders"
          />
        </div>
        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="custom-select"
            aria-label="Filter by status"
          >
            <option value="">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="custom-select"
            aria-label="Sort by field"
          >
            <option value="createdAt">Date</option>
            <option value="total">Total</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
            className="custom-select"
            aria-label="Sort order"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
      <div className="orders-grid">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>Order #{order._id.slice(-6)}</h3>
                <span className="order-total">₹{order.total.toFixed(2)}</span>
              </div>
              <div className="order-details">
                <p><strong>User Email:</strong> {order.userId?.email || 'N/A'}</p>
                <p><strong>Status:</strong>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="status-dropdown"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </p>
              </div>
              <button
                onClick={() => handleViewDetails(order._id)}
                className="details-btn"
                aria-label={`View details for order ${order._id}`}
              >
                View Details
              </button>
            </div>
          ))
        ) : (
          <div className="no-orders-card">
            <p>No orders found.</p>
          </div>
        )}
      </div>
      <div className="pagination-panel">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="nav-btn"
        >
          <span className="arrow">←</span> Previous
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages} (Total: {totalOrders})
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="nav-btn"
        >
          Next <span className="arrow">→</span>
        </button>
      </div>
      {modalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Order Details</h2>
            <button
              className="close-btn"
              onClick={() => setModalOpen(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Order ID:</strong> {selectedOrder._id}
              </div>
              <div className="detail-item">
                <strong>User Email:</strong> {selectedOrder.userId?.email || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Total:</strong> ₹{selectedOrder.total.toFixed(2)}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {selectedOrder.status}
              </div>
              <div className="detail-item">
                <strong>Items:</strong>
                <ul>
                  {selectedOrder.items.map((item, index) => (
                    <li key={index}>
                      {item.name} - Qty: {item.quantity} - ₹{item.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="detail-item">
                <strong>Shipping Address:</strong>
                <p>
                  {selectedOrder.shippingAddress?.address || 'N/A'},{' '}
                  {selectedOrder.shippingAddress?.city || 'N/A'},{' '}
                  {selectedOrder.shippingAddress?.postalCode || 'N/A'},{' '}
                  {selectedOrder.shippingAddress?.country || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;

















































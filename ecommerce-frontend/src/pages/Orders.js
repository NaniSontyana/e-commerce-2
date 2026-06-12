import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderItem from './OrderItem';
import { toast } from 'react-toastify';
import '../styles/Orders.css';

function Orders() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const [wishlistMessages, setWishlistMessages] = useState({});
  const [reviewData, setReviewData] = useState({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localReviews, setLocalReviews] = useState(() => {
    const storedReviews = localStorage.getItem('localReviews');
    return storedReviews ? JSON.parse(storedReviews) : {};
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched orders:', res.data);
      const validOrders = res.data.filter(order => order.userId === user._id);
      setOrders(validOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load orders');
      }
      setLoading(false);
    }
  }, [user, logout, navigate]);

  const fetchReviews = useCallback(async () => {
    try {
      const storedReviews = localStorage.getItem('localReviews');
      if (storedReviews && Object.keys(JSON.parse(storedReviews)).length > 0) {
        const parsedReviews = JSON.parse(storedReviews);
        setLocalReviews(parsedReviews);
        console.log('Reviews loaded from localStorage:', parsedReviews);
        return;
      }

      const token = localStorage.getItem('token');
      const newReviews = {};
      for (const order of orders) {
        for (const item of order.items) {
          const productId = item.productId;
          if (!productId) continue;
          const key = `${order._id}_${productId}`;
          try {
            const res = await axios.get(
              `https://backend-ps76.onrender.com/api/reviews/order/${order._id}/product/${productId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data && res.data.rating) {
              newReviews[key] = res.data;
            }
          } catch (err) {
            if (err.response?.status !== 404) {
              console.error(`Error fetching review for order ${order._id}, product ${productId}:`, err);
            }
          }
        }
      }
      setLocalReviews(newReviews);
      localStorage.setItem('localReviews', JSON.stringify(newReviews));
      console.log('Reviews fetched and stored in localStorage:', newReviews);
    } catch (err) {
      console.error('Error fetching reviews in Orders:', err);
      setLocalReviews({});
      localStorage.removeItem('localReviews');
    }
  }, [orders]);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(res.data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err.response?.data?.message || 'Failed to fetch wishlist.');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      if (orders.length === 0) {
        fetchOrders();
        fetchWishlist();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, navigate, fetchOrders, orders.length]);

  useEffect(() => {
    if (orders.length > 0) {
      fetchReviews();
    }
  }, [orders, fetchReviews]);

  useEffect(() => {
    localStorage.setItem('localReviews', JSON.stringify(localReviews));
  }, [localReviews]);

  const handleAddToWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'https://backend-ps76.onrender.com/api/wishlist',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist([...wishlist, res.data.item]);
      setWishlistMessages((prev) => ({
        ...prev,
        [productId]: 'Added to wishlist!',
      }));
      toast.success('Added to wishlist!');
      setTimeout(() => {
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: '',
        }));
      }, 3000);
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add to wishlist.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const wishlistItem = wishlist.find((item) => item.productId?._id?.toString() === productId);
      if (wishlistItem) {
        await axios.delete(`https://backend-ps76.onrender.com/api/wishlist/${wishlistItem._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlist(wishlist.filter((item) => item._id !== wishlistItem._id));
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: 'Removed from wishlist!',
        }));
        toast.success('Removed from wishlist!');
        setTimeout(() => {
          setWishlistMessages((prev) => ({
            ...prev,
            [productId]: '',
          }));
        }, 3000);
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove from wishlist.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.items.some((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const orderDate = new Date(order.createdAt);
    const matchesYear =
      filterYear === 'All' || orderDate.getFullYear().toString() === filterYear;
    const matchesStatus =
      filterStatus === 'All' || order.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesYear && matchesStatus;
  });

  const years = ['All', ...new Set(orders.map((order) => new Date(order.createdAt).getFullYear()))];
  const statuses = ['All', 'Delivered', 'Processing', 'Shipped', 'Cancelled'];

  const handleReviewSubmit = async (orderId, productId, isEdit = false) => {
    const key = `${orderId}_${productId}`;
    const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

    if (data.rating < 1 || data.rating > 5) {
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Please select a rating between 1 and 5.' } });
      return;
    }

    if (!data.comment.trim()) {
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Please enter a review comment.' } });
      return;
    }

    const newReview = {
      orderId,
      productId,
      rating: data.rating,
      comment: data.comment,
      userId: user._id,
      createdAt: new Date().toISOString(),
    };
    setLocalReviews((prev) => ({ ...prev, [key]: newReview }));
    setReviewData({
      ...reviewData,
      [key]: {
        rating: 0,
        comment: '',
        message: isEdit ? 'Review updated successfully!' : 'Review submitted successfully!',
        error: '',
        loading: false,
        showForm: false,
      },
    });

    try {
      const token = localStorage.getItem('token');
      const method = isEdit ? 'put' : 'post';
      const url = isEdit
        ? `https://backend-ps76.onrender.com/api/reviews/${localReviews[key]._id}`
        : `https://backend-ps76.onrender.com/api/reviews/${orderId}/${productId}`;
      const res = await axios[method](
        url,
        { rating: data.rating, comment: data.comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLocalReviews((prev) => ({ ...prev, [key]: res.data.review }));
    } catch (err) {
      console.error('Error submitting review:', err);
      let errorMessage = 'Failed to submit review.';
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'You can only review delivered products you have purchased.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.message || 'Invalid request. Please try again.';
        } else {
          errorMessage = err.response.data.message || 'Failed to submit review.';
        }
      }
      const updatedReviews = { ...localReviews };
      delete updatedReviews[key];
      setLocalReviews(updatedReviews);
      setReviewData({
        ...reviewData,
        [key]: {
          ...data,
          loading: false,
          error: errorMessage,
          message: '',
        },
      });
    }
  };

  const handleDeleteReview = async (orderId, productId) => {
    const key = `${orderId}_${productId}`;
    const reviewToDelete = localReviews[key];
    if (!reviewToDelete) return;

    const updatedReviews = { ...localReviews };
    delete updatedReviews[key];
    setLocalReviews(updatedReviews);
    setReviewData((prev) => ({
      ...prev,
      [key]: { rating: 0, comment: '', message: 'Review deleted successfully!', error: '', loading: false, showForm: false },
    }));

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://backend-ps76.onrender.com/api/reviews/${reviewToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error deleting review:', err);
      setLocalReviews((prev) => ({ ...prev, [key]: reviewToDelete }));
      setReviewData((prev) => ({
        ...prev,
        [key]: { ...prev[key], error: err.response?.data?.message || 'Failed to delete review.', message: '' },
      }));
    }
  };

  const handleExportOrders = () => {
    const orderText = filteredOrders
      .map((order) => `Order #${order._id.slice(-6)} - ${new Date(order.createdAt).toLocaleDateString()} - ₹${order.total.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([orderText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_history.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    setError('Order history exported successfully!');
    toast.success('Order history exported successfully!');
  };

  if (authLoading || loading) {
    return (
      <div className="orders-container">
        <h1 className="orders-title">Your Orders</h1>
        <div className="orders-content">
          <div className="orders-list">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="order-card skeleton">
                <div className="order-item">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-text skeleton-name"></div>
                  <div className="skeleton-text skeleton-status"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="orders-container">
      <h1 className="orders-title">Your Orders</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="orders-content">
        <button className="filters-toggle-btn" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
          {isFiltersOpen ? 'Close Filters' : 'Filters'}
        </button>

        <aside className={`orders-filters ${isFiltersOpen ? 'open' : ''}`}>
          <div className="filters-header">
            <h2 className="filters-title">Filters</h2>
            <button className="filters-close-btn" onClick={() => setIsFiltersOpen(false)}>
              ✕
            </button>
          </div>
          <div className="filter-section">
            <h3 className="filter-heading">ORDER STATUS</h3>
            <div className="filter-options">
              {statuses.map((status) => (
                <label key={status} className="filter-option">
                  <input
                    type="radio"
                    name="filter-status"
                    value={status}
                    checked={filterStatus === status}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <h3 className="filter-heading">ORDER TIME</h3>
            <div className="filter-options">
              {years.map((year) => (
                <label key={year} className="filter-option">
                  <input
                    type="radio"
                    name="filter-year"
                    value={year}
                    checked={filterYear === year}
                    onChange={(e) => setFilterYear(e.target.value)}
                  />
                  {year}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="orders-list">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search your orders here..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="export-btn" onClick={handleExportOrders}>
              Export History
            </button>
          </div>

          {filteredOrders.length > 0 ? (
            <div className="orders-scroll-container">
              {filteredOrders.map((order) => (
                <div key={order._id} className="order-card">
                  {order.items.map((item, index) => (
                    <OrderItem
                      key={index}
                      order={order}
                      item={item}
                      index={index}
                      reviewData={reviewData}
                      setReviewData={setReviewData}
                      reviews={localReviews}
                      handleReviewSubmit={handleReviewSubmit}
                      handleDeleteReview={handleDeleteReview}
                      wishlist={wishlist}
                      handleAddToWishlist={handleAddToWishlist}
                      handleRemoveFromWishlist={handleRemoveFromWishlist}
                      wishlistMessages={wishlistMessages}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-orders">
              <div className="no-orders-content">
                <p>No orders found.</p>
                <button className="shop-now-btn" onClick={() => navigate('/products')}>
                  Shop Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;


/* //main
 import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import OrderItem from './OrderItem';
import { toast } from 'react-toastify';
import '../styles/Orders.css';

function Orders() {
  const { addToCart } = useCart();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const [wishlistMessages, setWishlistMessages] = useState({});
  const [reviewData, setReviewData] = useState({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localReviews, setLocalReviews] = useState(() => {
    // Load reviews from localStorage on initial render
    const storedReviews = localStorage.getItem('localReviews');
    return storedReviews ? JSON.parse(storedReviews) : {};
  });

  // Memoized fetchOrders to prevent unnecessary re-fetches
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched orders:', res.data);
      const validOrders = res.data.filter(order => order.userId === user._id);
      setOrders(validOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load orders');
      }
      setLoading(false);
    }
  }, [user, logout, navigate]);

  // Fetch reviews for all orders
  const fetchReviews = useCallback(async () => {
    try {
      // Check if reviews are already in localStorage
      const storedReviews = localStorage.getItem('localReviews');
      if (storedReviews && Object.keys(JSON.parse(storedReviews)).length > 0) {
        const parsedReviews = JSON.parse(storedReviews);
        setLocalReviews(parsedReviews);
        console.log('Reviews loaded from localStorage:', parsedReviews);
        return;
      }

      const token = localStorage.getItem('token');
      const newReviews = {};
      for (const order of orders) {
        for (const item of order.items) {
          const productId = item.productId;
          if (!productId) continue;
          const key = `${order._id}_${productId}`;
          try {
            const res = await axios.get(
              `https://backend-ps76.onrender.com/api/reviews/order/${order._id}/product/${productId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data && res.data.rating) {
              newReviews[key] = res.data;
            }
          } catch (err) {
            if (err.response?.status !== 404) {
              console.error(`Error fetching review for order ${order._id}, product ${productId}:`, err);
            }
          }
        }
      }
      setLocalReviews(newReviews);
      localStorage.setItem('localReviews', JSON.stringify(newReviews)); // Store in localStorage
      console.log('Reviews fetched and stored in localStorage:', newReviews);
    } catch (err) {
      console.error('Error fetching reviews in Orders:', err);
      setLocalReviews({});
      caretaker: localStorage.removeItem('localReviews');
    }
  }, [orders]);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(res.data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err.response?.data?.message || 'Failed to fetch wishlist.');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      if (orders.length === 0) {
        fetchOrders();
        fetchWishlist();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, navigate, fetchOrders, orders.length]);

  useEffect(() => {
    if (orders.length > 0) {
      fetchReviews();
    }
  }, [orders, fetchReviews]);

  // Update localStorage whenever localReviews changes
  useEffect(() => {
    localStorage.setItem('localReviews', JSON.stringify(localReviews));
  }, [localReviews]);

  const handleAddToWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'https://backend-ps76.onrender.com/api/wishlist',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist([...wishlist, res.data.item]);
      setWishlistMessages((prev) => ({
        ...prev,
        [productId]: 'Added to wishlist!',
      }));
      toast.success('Added to wishlist!');
      setTimeout(() => {
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: '',
        }));
      }, 3000);
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add to wishlist.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const wishlistItem = wishlist.find((item) => item.productId?._id?.toString() === productId);
      if (wishlistItem) {
        await axios.delete(`https://backend-ps76.onrender.com/api/wishlist/${wishlistItem._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlist(wishlist.filter((item) => item._id !== wishlistItem._id));
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: 'Removed from wishlist!',
        }));
        toast.success('Removed from wishlist!');
        setTimeout(() => {
          setWishlistMessages((prev) => ({
            ...prev,
            [productId]: '',
          }));
        }, 3000);
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove from wishlist.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.items.some((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const orderDate = new Date(order.createdAt);
    const matchesYear =
      filterYear === 'All' || orderDate.getFullYear().toString() === filterYear;
    const matchesStatus =
      filterStatus === 'All' || order.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesYear && matchesStatus;
  });

  const years = ['All', ...new Set(orders.map((order) => new Date(order.createdAt).getFullYear()))];
  const statuses = ['All', 'Delivered', 'Processing', 'Shipped', 'Cancelled'];

  const handleReorder = async (order) => {
    try {
      const items = order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      await addToCart(items, true);
      navigate('/cart');
    } catch (err) {
      console.error('Error reordering:', err);
      setError(err.response?.data?.message || 'Failed to reorder. Please try again.');
    }
  };

  const handleReviewSubmit = async (orderId, productId, isEdit = false) => {
    const key = `${orderId}_${productId}`;
    const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

    if (data.rating < 1 || data.rating > 5) {
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Please select a rating between 1 and 5.' } });
      return;
    }

    if (!data.comment.trim()) {
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Please enter a review comment.' } });
      return;
    }

    // Optimistically update the UI
    const newReview = {
      orderId,
      productId,
      rating: data.rating,
      comment: data.comment,
      userId: user._id,
      createdAt: new Date().toISOString(),
    };
    setLocalReviews((prev) => ({ ...prev, [key]: newReview }));
    setReviewData({
      ...reviewData,
      [key]: {
        rating: 0,
        comment: '',
        message: isEdit ? 'Review updated successfully!' : 'Review submitted successfully!',
        error: '',
        loading: false,
        showForm: false,
      },
    });

    // Sync with backend
    try {
      const token = localStorage.getItem('token');
      const method = isEdit ? 'put' : 'post';
      const url = isEdit
        ? `https://backend-ps76.onrender.com/api/reviews/${localReviews[key]._id}`
        : `https://backend-ps76.onrender.com/api/reviews/${orderId}/${productId}`;
      const res = await axios[method](
        url,
        { rating: data.rating, comment: data.comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local reviews with the actual response
      setLocalReviews((prev) => ({ ...prev, [key]: res.data.review }));
    } catch (err) {
      console.error('Error submitting review:', err);
      let errorMessage = 'Failed to submit review.';
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'You can only review delivered products you have purchased.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.message || 'Invalid request. Please try again.';
        } else {
          errorMessage = err.response.data.message || 'Failed to submit review.';
        }
      }
      const updatedReviews = { ...localReviews };
      delete updatedReviews[key];
      setLocalReviews(updatedReviews);
      setReviewData({
        ...reviewData,
        [key]: {
          ...data,
          loading: false,
          error: errorMessage,
          message: '',
        },
      });
    }
  };

  const handleDeleteReview = async (orderId, productId) => {
    const key = `${orderId}_${productId}`;
    const reviewToDelete = localReviews[key];
    if (!reviewToDelete) return;

    // Optimistically update the UI
    const updatedReviews = { ...localReviews };
    delete updatedReviews[key];
    setLocalReviews(updatedReviews);
    setReviewData((prev) => ({
      ...prev,
      [key]: { rating: 0, comment: '', message: 'Review deleted successfully!', error: '', loading: false, showForm: false },
    }));

    // Sync with backend
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://backend-ps76.onrender.com/api/reviews/${reviewToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error deleting review:', err);
      setLocalReviews((prev) => ({ ...prev, [key]: reviewToDelete }));
      setReviewData((prev) => ({
        ...prev,
        [key]: { ...prev[key], error: err.response?.data?.message || 'Failed to delete review.', message: '' },
      }));
    }
  };

  const handleExportOrders = () => {
    const orderText = filteredOrders
      .map((order) => `Order #${order._id.slice(-6)} - ${new Date(order.createdAt).toLocaleDateString()} - ₹${order.total.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([orderText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_history.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    setError('Order history exported successfully!');
    toast.success('Order history exported successfully!');
  };

  if (authLoading || loading) {
    return (
      <div className="orders-container">
        <h1 className="orders-title">Your Orders</h1>
        <div className="orders-content">
          <div className="orders-list">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="order-card skeleton">
                <div className="order-item">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-text skeleton-name"></div>
                  <div className="skeleton-text skeleton-status"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="orders-container">
      <h1 className="orders-title">Your Orders</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="orders-content">
        <button className="filters-toggle-btn" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
          {isFiltersOpen ? 'Close Filters' : 'Filters'}
        </button>

        <aside className={`orders-filters ${isFiltersOpen ? 'open' : ''}`}>
          <div className="filters-header">
            <h2 className="filters-title">Filters</h2>
            <button className="filters-close-btn" onClick={() => setIsFiltersOpen(false)}>
              ✕
            </button>
          </div>
          <div className="filter-section">
            <h3 className="filter-heading">ORDER STATUS</h3>
            <div className="filter-options">
              {statuses.map((status) => (
                <label key={status} className="filter-option">
                  <input
                    type="radio"
                    name="filter-status"
                    value={status}
                    checked={filterStatus === status}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <h3 className="filter-heading">ORDER TIME</h3>
            <div className="filter-options">
              {years.map((year) => (
                <label key={year} className="filter-option">
                  <input
                    type="radio"
                    name="filter-year"
                    value={year}
                    checked={filterYear === year}
                    onChange={(e) => setFilterYear(e.target.value)}
                  />
                  {year}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="orders-list">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search your orders here..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="export-btn" onClick={handleExportOrders}>
              Export History
            </button>
          </div>

          {filteredOrders.length > 0 ? (
            <div className="orders-scroll-container">
              {filteredOrders.map((order) => (
                <div key={order._id} className="order-card">
                  {order.items.map((item, index) => (
                    <OrderItem
                      key={index}
                      order={order}
                      item={item}
                      index={index}
                      reviewData={reviewData}
                      setReviewData={setReviewData}
                      reviews={localReviews}
                      handleReviewSubmit={handleReviewSubmit}
                      handleDeleteReview={handleDeleteReview}
                      wishlist={wishlist}
                      handleAddToWishlist={handleAddToWishlist}
                      handleRemoveFromWishlist={handleRemoveFromWishlist}
                      wishlistMessages={wishlistMessages}
                      handleReorder={handleReorder}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-orders">
              <div className="no-orders-content">
                <p>No orders found.</p>
                <button className="shop-now-btn" onClick={() => navigate('/products')}>
                  Shop Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;  */

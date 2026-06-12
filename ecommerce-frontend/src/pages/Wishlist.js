import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Wishlist.css';
import WishlistItem from '../components/WishlistItem';

function Wishlist() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPrice, setFilterPrice] = useState('All');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      fetchWishlist();
    }
  }, [user, authLoading, navigate]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched wishlist:', res.data); // Debug the wishlist data
      setWishlist(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load wishlist');
      }
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://backend-ps76.onrender.com/api/wishlist/${wishlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(wishlist.filter((item) => item._id !== wishlistId));
      toast.success('Removed from wishlist!');
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error(err.response?.data?.message || 'Failed to remove from wishlist.');
    }
  };

  const handleClearWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist([]);
      toast.success('Wishlist cleared!');
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      toast.error(err.response?.data?.message || 'Failed to clear wishlist.');
    }
  };

  const handleShareWishlist = () => {
    const shareUrl = `${window.location.origin}/wishlist/${user._id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Wishlist link copied to clipboard!');
  };

  const filteredWishlist = wishlist.filter((item) => {
    if (!item.productId) return false;
    const matchesSearch = item.productId.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.productId.category === filterCategory;
    const matchesPrice =
      filterPrice === 'All' ||
      (filterPrice === '0-500' && item.productId.price <= 500) ||
      (filterPrice === '500-1000' && item.productId.price > 500 && item.productId.price <= 1000) ||
      (filterPrice === '1000+' && item.productId.price > 1000);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const categories = ['All', ...new Set(wishlist.map((item) => item.productId?.category).filter(Boolean))];
  const priceRanges = ['All', '0-500', '500-1000', '1000+'];

  if (authLoading || loading) {
    return (
      <div className="wishlist-container">
        <h1 className="wishlist-title">Your Wishlist</h1>
        <div className="wishlist-grid">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="wishlist-card skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-text skeleton-name"></div>
              <div className="skeleton-text skeleton-price"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="wishlist-container my-5 py-5">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="wishlist-title">Your Wishlist</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="wishlist-controls">
        <button className="refresh-wishlist-btn" onClick={fetchWishlist}>
          Refresh Wishlist
        </button>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={filterPrice}
          onChange={(e) => setFilterPrice(e.target.value)}
          className="filter-select"
        >
          {priceRanges.map((range) => (
            <option key={range} value={range}>
              {range === 'All' ? 'All Prices' : `₹${range}`}
            </option>
          ))}
        </select>
        <button className="share-wishlist-btn" onClick={handleShareWishlist}>
          Share Wishlist
        </button>
        {wishlist.length > 0 && (
          <button className="clear-wishlist-btn" onClick={handleClearWishlist}>
            Clear Wishlist
          </button>
        )}
      </div>
      {filteredWishlist.length > 0 ? (
        <div className="wishlist-grid">
          {filteredWishlist.map((item) => (
            <WishlistItem
              key={item._id}
              item={item}
              handleRemoveFromWishlist={handleRemoveFromWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="no-wishlist">
          <p>Your wishlist is empty.</p>
          <button className="shop-now-btn" onClick={() => navigate('/products')}>
            Shop Now
          </button>
        </div>
      )}
    </div>
  );
}

export default Wishlist;
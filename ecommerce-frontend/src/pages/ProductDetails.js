import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ProductDetails.css';

function ProductDetails() {
  const { id } = useParams();
  const { products, loading, error: productsError } = useProducts();
  const { addToCart } = useCart();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [isCompareAdded, setIsCompareAdded] = useState(false);
  const [zoomLensPosition, setZoomLensPosition] = useState({ x: 0, y: 0 });
  const [zoomResultPosition, setZoomResultPosition] = useState({ x: 0, y: 0 });
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  const product = products.find((p) => p._id === id);

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const cities = [
    { name: 'Mumbai', available: true },
    { name: 'Delhi', available: true },
    { name: 'Bangalore', available: false },
    { name: 'Chennai', available: true },
    { name: 'Hyderabad', available: false },
    { name: 'Kolkata', available: true },
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (product) {
      setStockCount(product.stock || 0);
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
      if (isValidObjectId(id)) {
        fetchReviews();
      } else {
        setReviewsError('Invalid product ID. Unable to load reviews.');
        setReviews([]);
        setAverageRating(0);
        setReviewsLoading(false);
      }
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      if (!recentlyViewed.includes(product._id)) {
        recentlyViewed.push(product._id);
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed.slice(-5)));
      }
      fetchWishlist();
      checkIfInCompare();
    }
  }, [product, id, user, authLoading, navigate]);

  const fetchWishlist = async () => {
    if (!user || !user._id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const isProductInWishlist = res.data.some((item) => item.productId?._id === id);
      setIsInWishlist(isProductInWishlist);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load wishlist status.');
      }
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError('');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/reviews/product/${id}`);
      if (!Array.isArray(res.data)) {
        setReviews([]);
        setAverageRating(0);
        setRatingBreakdown({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setReviewsLoading(false);
        setReviewsError(res.data.message || 'Failed to load reviews. Please try again.');
        return;
      }
      setReviews(res.data);
      calculateAverageRating(res.data);
      calculateRatingBreakdown(res.data);
      setReviewsLoading(false);
    } catch (err) {
      setReviewsError(err.response?.data?.message || 'Failed to load reviews. Please try again later.');
      setReviews([]);
      setAverageRating(0);
      setRatingBreakdown({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      setReviewsLoading(false);
    }
  };

  const calculateAverageRating = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      setAverageRating(0);
      return;
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avg = totalRating / reviews.length;
    setAverageRating(avg.toFixed(1));
  };

  const calculateRatingBreakdown = (reviews) => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
    });
    setRatingBreakdown(breakdown);
  };

  const handleAddToCart = async () => {
    if (stockCount <= 0) {
      toast.error('Product is out of stock.');
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size.');
      return;
    }
    setIsAddingToCart(true);
    try {
      const variantId = selectedVariant ? selectedVariant.variantId : null;
      await addToCart(product, selectedSize, variantId);
      setStockCount((prev) => prev - 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.message || 'Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (stockCount <= 0) {
      toast.error('Product is out of stock.');
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size.');
      return;
    }
    setIsBuyingNow(true);
    try {
      const variantId = selectedVariant ? selectedVariant.variantId : null;
      await addToCart(product, selectedSize, variantId);
      setStockCount((prev) => prev - 1);
      navigate('/checkout');
    } catch (error) {
      toast.error(error.message || 'Failed to add to cart. Please try again.');
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
  };

  const handleThumbnailHover = (index) => {
    if (window.innerWidth >= 768) {
      setCurrentImageIndex(index);
    }
  };

  const handleMouseMove = (e) => {
    if (window.innerWidth < 992) return;
    const mainImage = e.currentTarget;
    const rect = mainImage.getBoundingClientRect();
    const lensSize = 100;
    let x = e.clientX - rect.left - lensSize / 2;
    let y = e.clientY - rect.top - lensSize / 2;

    const maxX = rect.width - lensSize;
    const maxY = rect.height - lensSize;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    setZoomLensPosition({ x, y });

    const zoomResultSize = rect.width;
    const zoomFactor = 2;
    const backgroundX = (x / rect.width) * 100 * zoomFactor;
    const backgroundY = (y / rect.height) * 100 * zoomFactor;

    setZoomResultPosition({ x: backgroundX, y: backgroundY });
    setIsZoomVisible(true);
  };

  const handleMouseLeave = () => {
    setIsZoomVisible(false);
  };

  const handleVariantChange = (variant) => {
    if (selectedVariant === variant) {
      setSelectedVariant(null);
    } else {
      setSelectedVariant(variant);
    }
    setCurrentImageIndex(0);
  };

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    console.log(`Notification requested for ${email} when ${product.name} is back in stock.`);
    setIsNotifyModalOpen(false);
    setEmail('');
    toast.success('You will be notified when this product is back in stock!');
  };

  const handleWishlistToggle = async () => {
    if (!user || !user._id) {
      toast.error('Please log in to add items to your wishlist.');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isInWishlist) {
        const wishlistItem = await axios.get(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const itemToRemove = wishlistItem.data.find((item) => item.productId?._id === id);
        if (itemToRemove) {
          await axios.delete(`https://backend-ps76.onrender.com/api/wishlist/${itemToRemove._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsInWishlist(false);
          toast.success('Removed from wishlist!');
        }
      } else {
        await axios.post(
          'https://backend-ps76.onrender.com/api/wishlist',
          { userId: user._id, productId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsInWishlist(true);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update wishlist.');
      }
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out this amazing product: ${product.name}!`;
    if (navigator.share) {
      navigator.share({ title: product.name, text, url }).catch((err) => {
        console.error('Error sharing:', err);
        setIsShareModalOpen(true);
      });
    } else {
      setIsShareModalOpen(true);
    }
  };

  const shareProduct = async (platform) => {
    const url = window.location.href;
    const text = `Check out this amazing product: ${product.name}!`;
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!', { position: 'top-right', autoClose: 2000 });
        } catch (err) {
          console.error('Failed to copy link:', err);
          toast.error('Failed to copy link.', { position: 'top-right', autoClose: 2000 });
        }
        setIsShareModalOpen(false);
        return;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
    setIsShareModalOpen(false);
  };

  const handleAvailabilityCheck = (e) => {
    e.preventDefault();
    if (!selectedCity) {
      toast.error('Please select a city.', { position: 'top-right', autoClose: 2000 });
      return;
    }
    const cityData = cities.find((city) => city.name === selectedCity);
    if (cityData) {
      setAvailabilityInfo({
        city: selectedCity,
        available: cityData.available,
        estimatedDelivery: cityData.available ? '3-5 days' : null,
      });
      toast[cityData.available ? 'success' : 'error'](
        `Delivery ${cityData.available ? 'available' : 'not available'} in ${selectedCity}.`,
        { position: 'top-right', autoClose: 2000 }
      );
    }
  };

  const checkIfInCompare = () => {
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    setIsCompareAdded(compareList.includes(product._id));
  };

  const handleCompareToggle = () => {
    let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (isCompareAdded) {
      compareList = compareList.filter((pid) => pid !== product._id);
      setIsCompareAdded(false);
      toast.success('Removed from comparison list!', { position: 'top-right', autoClose: 2000 });
    } else if (compareList.length < 4) {
      compareList.push(product._id);
      setIsCompareAdded(true);
      toast.success('Added to comparison list!', { position: 'top-right', autoClose: 2000 });
    } else {
      toast.error('You can compare up to 4 products only.', { position: 'top-right', autoClose: 2000 });
    }
    localStorage.setItem('compareList', JSON.stringify(compareList));
  };

  const renderStars = (rating) => {
    const filledStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);
    return (
      <div className="star-rating">
        {[...Array(filledStars)].map((_, i) => <span key={`filled-${i}`} className="star filled">★</span>)}
        {halfStar && <span className="star half-filled">★</span>}
        {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="star">★</span>)}
      </div>
    );
  };

  const renderSpecValue = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    }
    return value || 'N/A';
  };

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Product...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="error-container">
        <h3>Error Loading Product</h3>
        <p>{productsError}</p>
        <button className="btn-back" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-container">
        <p>Product Not Found: {id}</p>
        <button className="btn-back" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  // Filter out the first "variant" which represents the main product
  const actualVariants = product.variants && product.variants.length > 1 ? product.variants.slice(1) : [];

  const imageList = selectedVariant && selectedVariant.mainImage
    ? [selectedVariant.mainImage, ...(selectedVariant.additionalImages || [])]
    : product.images && product.images.length > 0
      ? [product.image || 'https://placehold.co/400?text=No+Image', ...product.images]
      : [product.image || 'https://placehold.co/400?text=No+Image'];

  const stockStatus = stockCount > 5 ? 'In Stock' : stockCount > 0 ? 'Low Stock' : 'Out of Stock';
  
  // Get related products by matching exact category first, then falling back to subcategory/main category
  const otherProductsForRelated = products.filter((p) => p._id !== product._id);
  const exactCategoryMatches = otherProductsForRelated.filter((p) => p.category === product.category);
  const subCategoryMatches = otherProductsForRelated.filter(
    (p) =>
      p.mainCategory === product.mainCategory &&
      p.subcategory === product.subcategory &&
      p.subcategory !== '' &&
      p.category !== product.category
  );
  const mainCategoryMatches = otherProductsForRelated.filter(
    (p) =>
      p.mainCategory === product.mainCategory &&
      (p.subcategory !== product.subcategory || p.subcategory === '') &&
      p.category !== product.category
  );
  const relatedProducts = [...exactCategoryMatches, ...subCategoryMatches, ...mainCategoryMatches].slice(0, 4);

  const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    .filter((pid) => pid !== id)
    .map((pid) => products.find((p) => p._id === pid))
    .filter(Boolean)
    .slice(0, 4);
  const originalPrice = product.discountedPrice
    ? product.price
    : product.offer
      ? product.price / (1 - parseFloat(product.offer) / 100)
      : null;

  return (
    <div className="product-details-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="product-details-wrapper">
        <div className="back-to-products">
          <button className="btn-back-to-products" onClick={() => navigate('/products')}>
            ← Back to Products
          </button>
        </div>

        <div className="product-main">
          <div className="image-section">
            <div className="image-gallery">
              <div className="thumbnails">
                {imageList.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => handleImageChange(index)}
                    onMouseEnter={() => handleThumbnailHover(index)}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Failed to load thumbnail image ${index + 1}: ${img}`);
                        e.target.src = 'https://placehold.co/100?text=No+Image';
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="main-image-wrapper">
                <div
                  className="main-image"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={imageList[currentImageIndex]}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      console.error(`Failed to load main image: ${imageList[currentImageIndex]}`);
                      e.target.src = 'https://placehold.co/400?text=No+Image';
                    }}
                    style={{ objectFit: 'contain' }}
                  />
                  {product.dealTag && (
                    <div className="deal-badge">
                      {product.dealTag}
                    </div>
                  )}
                  {isZoomVisible && (
                    <>
                      <div
                        className="zoom-lens"
                        style={{
                          left: `${zoomLensPosition.x}px`,
                          top: `${zoomLensPosition.y}px`,
                        }}
                      />
                      <div
                        className="zoom-result"
                        style={{
                          backgroundImage: `url(${imageList[currentImageIndex]})`,
                          backgroundPosition: `${zoomResultPosition.x}% ${zoomResultPosition.y}%`,
                          backgroundSize: '200%',
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="action-buttons-container">
              <div className="action-buttons">
                {stockCount > 0 ? (
                  <>
                    <button className="action-btn add-to-cart" onClick={handleAddToCart} disabled={isAddingToCart}>
                      {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button className="action-btn buy-now" onClick={handleBuyNow} disabled={isBuyingNow}>
                      {isBuyingNow ? 'Processing...' : 'Buy Now'}
                    </button>
                  </>
                ) : (
                  <button className="action-btn notify" onClick={() => setIsNotifyModalOpen(true)}>
                    Notify Me
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="product-info">
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>
              <button
                className={`wishlist-icon ${isInWishlist ? 'in-wishlist' : ''}`}
                onClick={handleWishlistToggle}
                title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={isInWishlist ? '#d32f2f' : 'none'}
                  stroke={isInWishlist ? '#d32f2f' : '#212121'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
            <div className="product-rating">
              <span className="rating-badge">
                {averageRating} ★
                <span className="rating-text">({reviews.length} Reviews)</span>
              </span>
            </div>
            <div className="price-section">
              <span className="product-price">₹{Number(product.discountedPrice || product.price).toFixed(2)}</span>
              {originalPrice && <span className="original-price">₹{Number(originalPrice).toFixed(2)}</span>}
              {product.offer && <span className="discount">{product.offer}</span>}
            </div>
            <p className={`stock-status ${stockStatus.toLowerCase().replace(' ', '-')}`}>
              {stockStatus} {stockCount > 0 && `(${stockCount} left)`}
            </p>
            {actualVariants.length > 0 && (
              <div className="variant-selector">
                <label>Variant: </label>
                <div className="variant-options">
                  {actualVariants.map((variant, index) => {
                    const variantImage = variant.mainImage || 'https://placehold.co/40?text=No+Image';
                    const variantLabel = variant.color || `Option ${index + 1}`;
                    return (
                      <div
                        key={index}
                        className={`variant-image-option ${selectedVariant === variant ? 'selected' : ''}`}
                        onClick={() => handleVariantChange(variant)}
                      >
                        <img
                          src={variantImage}
                          alt={`Main Image for Variant ${variantLabel}`}
                          onError={(e) => {
                            console.error(`Failed to load main image for ${variantLabel}: ${variantImage}`);
                            e.target.src = 'https://placehold.co/40?text=No+Image';
                          }}
                        />
                        <span className="variant-label">{variantLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {product.sizes && product.sizes.length > 0 && (
              <div className="size-selector">
                <label>Size: </label>
                <div className="size-options">
                  {product.sizes.map((size, index) => (
                    <button
                      key={index}
                      className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="availability-check">
              <form onSubmit={handleAvailabilityCheck}>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                  <option value="">Select City</option>
                  {cities.map((city, index) => <option key={index} value={city.name}>{city.name}</option>)}
                </select>
                <button type="submit" className="btn-check-availability">Check</button>
              </form>
              {availabilityInfo && (
                <p className={`availability-info ${availabilityInfo.available ? '' : 'error'}`}>
                  {availabilityInfo.available
                    ? `Available in ${availabilityInfo.city} (${availabilityInfo.estimatedDelivery})`
                    : `Not available in ${availabilityInfo.city}`}
                </p>
              )}
            </div>
            <div className="compare-section">
              <button className={`btn-compare ${isCompareAdded ? 'added' : ''}`} onClick={handleCompareToggle}>
                {isCompareAdded ? 'Remove Compare' : 'Add Compare'}
              </button>
              <button className="share-btn" onClick={handleShare} title="Share">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share
              </button>
              {isCompareAdded && (
                <button className="btn-view-compare" onClick={() => navigate('/compare')}>
                  View Compare
                </button>
              )}
            </div>
          </div>

          <div className="product-details-section">
            <h2>Product Details</h2>
            <div className="details-content">
              <div className="details-row">
                <span className="details-label">Description:</span>
                <span className="details-value">{product.description || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Seller:</span>
                <span className="details-value">{product.seller || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Warranty:</span>
                <span className="details-value">{product.warranty || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Brand:</span>
                <span className="details-value">{product.brand || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Weight:</span>
                <span className="details-value">
                  {product.weight ? `${product.weight} ${product.weightUnit}` : 'N/A'}
                </span>
              </div>
              <div className="details-row">
                <span className="details-label">Model:</span>
                <span className="details-value">{product.model || 'N/A'}</span>
              </div>
              {product.specifications && typeof product.specifications === 'object' && (
                <div className="specifications-row">
                  <span className="specifications-label">Specifications:</span>
                  <ul className="specifications-list">
                    {Object.entries(product.specifications).map(([key, value], index) => {
                      if (typeof value === 'string' && value.includes(',')) {
                        const values = value.split(',').map((v) => v.trim());
                        return (
                          <li key={index} className="spec-item">
                            <strong>{key}:</strong>
                            <ul className="spec-sub-list">
                              {values.map((val, subIndex) => (
                                <li key={subIndex}>{val}</li>
                              ))}
                            </ul>
                          </li>
                        );
                      }
                      return (
                        <li key={index} className="spec-item">
                          <strong>{key}:</strong> {renderSpecValue(value)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <h2>Ratings & Reviews</h2>
          {reviewsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading Reviews...</p>
            </div>
          ) : reviewsError ? (
            <p className="error-text">{reviewsError}</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet.</p>
          ) : (
            <>
              <div className="rating-summary">
                <div className="average-rating">
                  <span>{averageRating}</span>
                  {renderStars(averageRating)}
                  <p>{reviews.length} Reviews</p>
                </div>
                <div className="rating-breakdown">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="rating-bar">
                      <span>{star}★</span>
                      <div className="bar-container">
                        <div
                          className="bar-filled"
                          style={{ width: `${(ratingBreakdown[star] / reviews.length) * 100 || 0}%` }}
                        ></div>
                      </div>
                      <span>{ratingBreakdown[star]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="reviews-list">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <span>{review.userId?.name || 'Anonymous'}</span>
                      <span>{renderStars(review.rating)}</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>{review.comment || 'No comment'}</p>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <button className="view-all-reviews" onClick={() => navigate(`/product/${id}/reviews`)}>
                    View All
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2>Related Products</h2>
            <div className="related-products-grid">
              {relatedProducts.map((p) => (
                <div key={p._id} className="related-product-card">
                  <div className="related-product-image">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Failed to load related product image for ${p.name}: ${p.image}`);
                        e.target.src = 'https://placehold.co/150?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="related-product-info">
                    <h3>{p.name}</h3>
                    <p>₹{p.discountedPrice || p.price}</p>
                    <button className="btn-quick" onClick={() => navigate(`/product/${p._id}`)}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentlyViewed.length > 0 && (
          <div className="recently-viewed-section">
            <h2>Recently Viewed</h2>
            <div className="recently-viewed-grid">
              {recentlyViewed.map((p) => (
                <div key={p._id} className="recently-viewed-card">
                  <div className="recently-viewed-image">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Failed to load recently viewed image for ${p.name}: ${p.image}`);
                        e.target.src = 'https://placehold.co/150?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="recently-viewed-info">
                    <h3>{p.name}</h3>
                    <p>₹{p.discountedPrice || p.price}</p>
                    <button className="btn-quick" onClick={() => navigate(`/product/${p._id}`)}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isNotifyModalOpen && (
        <div className="notify-modal">
          <div className="notify-modal-content">
            <h3>Notify Me</h3>
            <form onSubmit={handleNotifySubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <button type="submit" className="btn-submit-notify">
                Submit
              </button>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsNotifyModalOpen(false)}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}

      {isShareModalOpen && (
        <div className="share-modal">
          <div className="share-modal-content">
            <h3>Share</h3>
            <div className="share-options">
              <button className="share-option whatsapp" onClick={() => shareProduct('whatsapp')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.1 3.9C17.8 1.6 14.5.5 11.2.5 5.2.5.5 5.2.5 11.2c0 1.9.5 3.7 1.4 5.3L.5 23l6.6-1.7c1.5.8 3.2 1.3 5 1.3 6 0 10.7-4.7 10.7-10.7 0-3.3-1.1-6.6-3.4-8.9zM11.2 20.5c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.9 1 1-3.8-.2-.3c-.8-1.3-1.2-2.8-1.2-4.3 0-5 4.1-9 9-9s9 4.1 9 9-4.1 9-9 9zm5.5-5.5c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.2-.8.9-.9 1.1-.1.2-.2.2-.4.1s-.9-.4-1.7-.8c-.6-.3-1.1-.7-1.5-1.1-.4-.4-.6-.8-.8-1.3-.1-.5 0-.9.2-1 .1-.1.3-.3.4-.5.1-.2.1-.4.1-.6 0-.2-.1-.4-.3-.5-.2-.1-1.7-.8-2-1-.3-.2-.5-.3-.7-.5-.2-.2-.3-.4-.2-.6s.3-.5.5-.7c.2-.2.4-.3.7-.3h.5c.2 0 .5.1.7.3.2.2.7.7.9.9.2.2.3.3.4.5.1.2.1.4.1.6 0 .2-.1.4-.2.6-.1.2-.3.4-.5.6-.2.2-.4.4-.6.6-.2.2-.3.4-.2.6.1.2.5.9 1.1 1.5.7.7 1.4 1 1.7 1.1.2.1.4.1.6 0 .2-.1.7-.3 1-.6.3-.3.5-.3.7-.2.2.1.7.5.9.7.2.2.3.4.2.6-.1.2-.3.5-.6.6z"></path>
                </svg>
                WhatsApp
              </button>
              <button className="share-option telegram" onClick={() => shareProduct('telegram')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"></path>
                </svg>
                Telegram
              </button>
              <button className="share-option twitter" onClick={() => shareProduct('twitter')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
                Twitter
              </button>
              <button className="share-option facebook" onClick={() => shareProduct('facebook')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                Facebook
              </button>
              <button className="share-option copy-link" onClick={() => shareProduct('copy')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                Copy
              </button>
            </div>
            <button className="btn-close-modal" onClick={() => setIsShareModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;

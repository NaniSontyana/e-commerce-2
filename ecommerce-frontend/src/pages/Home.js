import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../styles/Home.css';

function Home() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Admin-defined categories
  const categories = [
    { name: 'Fashion', image: 'https://img.freepik.com/premium-photo/pair-shoes-are-table-with-hat-table_874904-102811.jpg' },
    { name: 'Electronics', image: 'https://img.freepik.com/premium-photo/household-appliances-shopping-cart-black-background-ecommerce-online-shopping-concept-3d_505080-2555.jpg' },
    { name: 'Furniture', image: 'https://img.freepik.com/premium-photo/hotel-furniture-white-background_996135-44810.jpg' },
    { name: 'Mobiles', image: 'https://img.freepik.com/premium-photo/high-angle-view-mobile-phone-table_1048944-19477214.jpg' },
    { name: 'Appliances', image: 'https://img.freepik.com/free-photo/overhead-view-office-stationeries-laptop-white-background_23-2148042099.jpg' },
    { name: 'Beauty', image: 'https://img.freepik.com/premium-photo/digital-tablet-with-woman-s-accessories-white-wooden-table-background-top-view_392895-210870.jpg' },
    { name: 'Home', image: 'https://img.freepik.com/free-photo/elevated-view-stethoscope-stitched-heart-shape-wireless-keyboard-succulent-plant-yellow-backdrop_23-2148214051.jpg' },
    { name: 'Toys & Baby', image: 'https://img.freepik.com/free-photo/cute-plush-toys-arrangement_23-2150312316.jpg' },
    { name: 'Sports', image: 'https://img.freepik.com/premium-photo/high-angle-view-eyeglasses-table_1048944-14435092.jpg' },
  ];

  // State for derived product lists and UI controls
  const [dealTimer, setDealTimer] = useState(3600); // 1 hour in seconds
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPageCategory, setCurrentPageCategory] = useState(1);
  const productsPerPage = 4;

  // Memoized derived product lists
  const derivedProducts = useMemo(() => {
    if (!products || products.length === 0) return {};

    // Sort by creation date for new products
    const getNewProducts = () => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const newProducts = getNewProducts().slice(0, 5);

    // Featured Products
    const allFeatured = [...newProducts, ...products.filter((p) => p.featured)].slice(0, 3);
    const shuffledFeatured = allFeatured.sort(() => 0.5 - Math.random());
    const featuredProducts = shuffledFeatured.length >= 3 ? shuffledFeatured.slice(0, 3) : allFeatured;

    // Trending Products (by price)
    const sortedByPrice = [...products].sort((a, b) => Number(b.price) - Number(a.price));
    const trendingProducts = sortedByPrice.slice(0, 4);

    // Suggested Items
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const suggestedItems = shuffled.slice(0, 4);

    // Top Selling Smartphones
    const smartphones = products
      .filter((product) => product.category.toLowerCase().includes('mobiles'))
      .sort((a, b) => Number(b.price) - Number(a.price));
    const topSellingSmartphones = smartphones.slice(0, 3);

    // Recommended Items
    const recommended = [...products].sort(() => 0.5 - Math.random());
    const recommendedItems = recommended.slice(0, 4);

    // You May Like Items
    const youMayLikeItems = [...products].sort(() => 0.5 - Math.random()).slice(0, 4);

    // Recently Viewed
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    const recentlyViewed = products.filter((product) => viewed.includes(product._id)).slice(0, 10);

    // Best Sellers
    const bestSellers = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

    return {
      featuredProducts,
      trendingProducts,
      suggestedItems,
      topSellingSmartphones,
      recommendedItems,
      youMayLikeItems,
      recentlyViewed,
      bestSellers,
    };
  }, [products]);

  // Filter products for "Shop by Category"
  const [filteredCategoryProducts, setFilteredCategoryProducts] = useState([]);
  useEffect(() => {
    if (selectedCategory) {
      const filtered = products.filter((product) =>
        product.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      setFilteredCategoryProducts(filtered);
      setCurrentPageCategory(1);
    } else {
      setFilteredCategoryProducts([]);
    }
  }, [selectedCategory, products]);

  // Pagination
  const indexOfLastCategoryProduct = currentPageCategory * productsPerPage;
  const indexOfFirstCategoryProduct = indexOfLastCategoryProduct - productsPerPage;
  const currentCategoryProducts = filteredCategoryProducts.slice(
    indexOfFirstCategoryProduct,
    indexOfLastCategoryProduct
  );
  const totalCategoryPages = Math.ceil(filteredCategoryProducts.length / productsPerPage);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDealTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Back to Top visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || productsLoading) {
    return (
      <div className="container-loading my-5 text-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="container-loading my-5 text-center">
        <h3>Error loading products</h3>
        <p>{productsError}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h3>No products available</h3>
        <p>Please check back later.</p>
      </div>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="home-wrapper">
      {/* Hero Section with Carousel */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="hero-section">
        <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-indicators">
            {derivedProducts.featuredProducts.map((_, index) => (
              <button
                key={index}
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to={index}
                className={index === 0 ? 'active' : ''}
                aria-current={index === 0 ? 'true' : 'false'}
                aria-label={`Slide ${index + 1}`}
              ></button>
            ))}
          </div>
          <div className="carousel-inner">
            {derivedProducts.featuredProducts.map((product, index) => (
              <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={product._id}>
                <img
                  src={product.image || 'https://placehold.co/1200x400?text=Featured+Product'}
                  className="d-block w-100 carousel-image"
                  alt={product.name}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/1200x400?text=Featured+Product';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Promotional Banner */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="promo-banner">
        <div className="promo-content">
          <h2>Plan Your Next Adventure</h2>
          <p>Discover Amazing Deals with E-Shop!</p>
          <button
            className="btn btn-light"
            onClick={() => navigate(user ? '/products' : '/signup')}
          >
            Explore Now
          </button>
        </div>
      </motion.section>

      {/* Category Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="category-section">
        <div className="container">
          <h2>Shop by Category</h2>
          <div className="category-container">
            {categories.map((category) => (
              <div
                className={`category-card ${selectedCategory === category.name ? 'active' : ''}`}
                key={category.name}
                onClick={() => setSelectedCategory((prev) => (prev === category.name ? null : category.name))}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="category-image"
                  onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=Category'; }}
                />
                <p>{category.name}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Filtered Products by Category */}
      {selectedCategory && filteredCategoryProducts.length > 0 && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="filtered-category-products-section">
          <div className="container">
            <h2>{selectedCategory} Products</h2>
            <div className="product-box">
              <div className="product-list">
                {currentCategoryProducts.map((product) => (
                  <div
                    className="product-item"
                    key={product._id}
                    onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                  >
                    <img
                      src={product.image || 'https://placehold.co/100x100?text=Product'}
                      alt={product.name}
                      onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                    />
                    <div className="product-details">
                      <h5>{product.name}</h5>
                      <p className="price">₹{Number(product.price).toFixed(2)}</p>
                      {product.variants && product.variants.length > 0 && (
                        <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                      )}
                      <p className="discount">{product.offer || '10% OFF'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pagination">
              <button
                onClick={() => setCurrentPageCategory((prev) => Math.max(prev - 1, 1))}
                disabled={currentPageCategory === 1}
              >
                Previous
              </button>
              <span>Page {currentPageCategory} of {totalCategoryPages}</span>
              <button
                onClick={() => setCurrentPageCategory((prev) => Math.min(prev + 1, totalCategoryPages))}
                disabled={currentPageCategory === totalCategoryPages}
              >
                Next
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* Suggested Items Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="suggested-items-section">
        <div className="container">
          <h2>Suggested Items</h2>
          <div className="product-box">
            <div className="product-list">
              {derivedProducts.suggestedItems.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    {product.variants && product.variants.length > 0 && (
                      <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                    )}
                    <p className="discount">{product.offer || '10% OFF'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Suggested for You Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="suggested-for-you-section">
        <div className="container">
          <h2>Suggested for You</h2>
          <div className="product-box">
            <div className="product-list">
              {derivedProducts.trendingProducts.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    {product.variants && product.variants.length > 0 && (
                      <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                    )}
                    <p className="discount">{product.offer || '10% OFF'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Top Selling Smartphones Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="top-selling-section">
        <div className="container">
          <h2>Top Selling Smartphones</h2>
          <p className="subtitle">Explore the best deals on smartphones</p>
          <div className="product-box">
            <div className="product-list">
              {derivedProducts.topSellingSmartphones.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    {product.variants && product.variants.length > 0 && (
                      <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                    )}
                    <p className="discount">{product.offer || '10% OFF'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Featured Deals Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="featured-deals-section">
        <div className="container">
          <h2>Featured Deals</h2>
          <p className="deal-timer">Time Left: {formatTime(dealTimer)}</p>
          <div className="product-box">
            <div className="product-list">
              {derivedProducts.recommendedItems.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    {product.variants && product.variants.length > 0 && (
                      <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                    )}
                    <p className="discount">{product.offer || '10% OFF'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Top Categories Banner Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="top-categories-section">
        <div className="container">
          <h2>Top Categories</h2>
          <div className="category-banner-container">
            {categories.map((category) => (
              <div
                className="category-banner-item"
                key={category.name}
                onClick={() => navigate(user ? `/products?category=${category.name}` : '/login')}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=Category'; }}
                />
                <div className="category-overlay">
                  <h3>{category.name}</h3>
                  <button className="btn btn-light">Shop Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Filtered Products by Top Category */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="filtered-top-category-products-section">
        <div className="container">
          <h2>Top Category Products</h2>
          <div className="product-box">
            <div className="product-list">
              {derivedProducts.youMayLikeItems.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    {product.variants && product.variants.length > 0 && (
                      <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                    )}
                    <p className="discount">{product.offer || '10% OFF'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Best Sellers Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="best-sellers-section">
        <div className="container">
          <h2>Best Sellers</h2>
          <div className="product-box">
            <div className="product-list">
              {derivedProducts.bestSellers.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    {product.variants && product.variants.length > 0 && (
                      <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                    )}
                    <p className="discount">{product.offer || '10% OFF'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Customer Reviews Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="customer-reviews-section">
        <div className="container">
          <h2>Customer Reviews</h2>
          <div className="reviews-container">
            {Array(3)
              .fill()
              .map((_, index) => (
                <div className="review-item" key={index}>
                  <p>"Great product and fast delivery!"</p>
                  <p className="reviewer">John Doe</p>
                </div>
              ))}
          </div>
        </div>
      </motion.section>

      {/* Recently Viewed Products Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="recently-viewed-section">
        <div className="container">
          <h2>Recently Viewed</h2>
          <div className="recently-viewed-container">
            {derivedProducts.recentlyViewed.map((product) => (
              <div
                className="product-item"
                key={product._id}
                onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
              >
                <img
                  src={product.image || 'https://placehold.co/100x100?text=Product'}
                  alt={product.name}
                  onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                />
                <div className="product-details">
                  <h5>{product.name}</h5>
                  <p className="price">₹{Number(product.price).toFixed(2)}</p>
                  {product.variants && product.variants.length > 0 && (
                    <p className="color-variant">Color: {product.variants.map((v) => v.color).join(', ')}</p>
                  )}
                  <p className="discount">{product.offer || '10% OFF'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}></button>
      )}
    </div>
  );
}

export default Home;
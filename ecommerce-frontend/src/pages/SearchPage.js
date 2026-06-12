import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import '../styles/SearchPage.css';

function SearchPage() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [newlyAddedProducts, setNewlyAddedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Category hierarchy with images for main categories
  const categoryHierarchy = {
    Fashion: {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
      Men: [
        'Top Wear', 'Bottom Wear', 'Casual Shoes', 'Watches', 'Ethnic', 'Sports Shoes',
        'Luggage', 'Trimmers', 'Essentials', 'Men Grooming'
      ],
      Women: ['Dresses', 'Top Wear', 'Footwear', 'Jewelry', 'Handbags', 'Accessories'],
      Beauty: ['Skincare', 'Makeup', 'Haircare', 'Fragrances']
    },
    Gadgets: {
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
      Accessories: ['Phone Cases', 'Chargers', 'Headphones'],
      SmartDevices: ['Smartwatches', 'Speakers', 'Cameras']
    },
    Electronics: {
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
      Audio: ['Headphones', 'Speakers', 'Earphones'],
      Computing: ['Laptops', 'Desktops', 'Monitors']
    },
    Home: {
      image: 'https://img.freepik.com/premium-photo/directly-shot-shopping-cart-laptop_1048944-25258203.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid&w=740',
      Decor: ['Wall Art', 'Rugs', 'Lighting'],
      Kitchen: ['Appliances', 'Utensils', 'Cookware']
    },
    Mobiles: {
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',

          Smartphones: ['iPhone', 'Samsung', 'Xiaomi', 'OnePlus', 'Google Pixel','Realme','Redmi'],
    FeaturePhones: ['Nokia', 'JioPhone'],
    Tablets: ['iPad', 'Samsung Galaxy Tab', 'Lenovo Tab'],
    Accessories: ['Chargers', 'Earphones', 'Cases', 'Screen Protectors','Power Banks'],

    },
    Appliances: {
      image: 'https://img.freepik.com/free-vector/household-appliances-realistic-composition_1284-65307.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid&w=740',
      Small: ['Microwave', 'Toaster', 'Blender'],
      Large: ['Refrigerator', 'Washing Machine', 'Air Conditioner']
    },
    Furniture: {
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
      Living: ['Sofas', 'Tables', 'Chairs'],
      Bedroom: ['Beds', 'Wardrobes', 'Mattresses']
    }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const storedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(storedSearches);
  }, []);

  // Enhanced search functionality with compound query support
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Split the search query into tokens (e.g., "men shirts" → ["men", "shirts"])
    const queryTokens = searchQuery.toLowerCase().split(/\s+/).filter(token => token.length > 0);

    const filteredProducts = products.filter((product) => {
      // Combine all searchable fields into a single string for matching
      const productName = product.name?.toLowerCase() || '';
      const category = product.category?.toLowerCase() || '';

      // Flatten the category hierarchy into searchable strings
      let hierarchyStrings = [];
      Object.entries(categoryHierarchy).forEach(([mainCategory, subcategories]) => {
        hierarchyStrings.push(mainCategory.toLowerCase());
        Object.entries(subcategories).forEach(([subcategory, nestedCategories]) => {
          if (typeof subcategory === 'string') {
            hierarchyStrings.push(subcategory.toLowerCase());
            if (Array.isArray(nestedCategories)) {
              nestedCategories.forEach(nested => {
                hierarchyStrings.push(nested.toLowerCase());
              });
            }
          }
        });
      });

      const searchableText = [productName, category, ...hierarchyStrings].join(' ');

      // Check if all query tokens match somewhere in the searchable text
      return queryTokens.every(token => searchableText.includes(token));
    });

    setSearchResults(filteredProducts);

    // Update recent searches
    if (searchQuery) {
      const updatedSearches = [
        searchQuery,
        ...recentSearches.filter((item) => item !== searchQuery)
      ].slice(0, 5); // Keep only the last 5 searches
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
    setCurrentPage(1);
  }, [searchQuery, products, recentSearches]);

  // Newly Added Products (e.g., added within the last 7 days)
  useEffect(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newProducts = products
      .filter((product) => {
        const createdAt = product.createdAt ? new Date(product.createdAt) : new Date(); // Fallback to now if createdAt is missing
        return createdAt >= sevenDaysAgo;
      })
      .slice(0, 4); // Limit to 4 products
    setNewlyAddedProducts(newProducts);
  }, [products]);

  // Popular Products (simulated using stock or a random metric)
  useEffect(() => {
    const popular = products
      .sort((a, b) => (b.stock || 0) - (a.stock || 0)) // Sort by stock (higher stock = more popular)
      .slice(0, 4); // Limit to 4 products
    setPopularProducts(popular);
  }, [products]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = searchResults.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(searchResults.length / productsPerPage);

  if (productsLoading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="container my-5 text-center">
        <h3>Error loading products</h3>
        <p>{productsError}</p>
      </div>
    );
  }

  return (
    <div className="search-page-wrapper">
      <div className="search-page-container">
        {/* Search Bar */}
        <div className="search-page-header">
          <div className="search-bar">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search for Products, Brands and More"
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="recent-searches-section">
            <div className="recent-searches-header">
              <h3>Recent Searches</h3>
              <button onClick={handleClearRecentSearches} className="clear-recent-btn">
                Clear All
              </button>
            </div>
            <div className="recent-searches-list">
              {recentSearches.map((query, index) => (
                <div
                  key={index}
                  className="recent-search-item"
                  onClick={() => handleRecentSearchClick(query)}
                >
                  <i className="fas fa-search recent-search-icon"></i>
                  {query}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="search-results-section">
            <h3>Search Results for "{searchQuery}"</h3>
            {searchResults.length > 0 ? (
              <>
                <div className="product-list">
                  {currentProducts.map((product) => (
                    <div
                      key={product._id}
                      className="product-item"
                      onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                    >
                      <img
                        src={product.image || 'https://placehold.co/100x100?text=Product'}
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/100x100?text=Product';
                        }}
                      />
                      <div className="product-details">
                        <h5>{product.name}</h5>
                        <p className="price">₹{Number(product.price).toFixed(2)}</p>
                        <p className="discount">{product.offer || '10% OFF'}</p>
                        {product.stock !== undefined && (
                          <p className={`stock-info ${product.stock <= 5 ? 'low-stock' : ''}`}>
                            {product.stock <= 5 ? `Hurry! Only ${product.stock} left!` : `In Stock: ${product.stock}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="no-results">
                <p>No products found for "{searchQuery}". Try a different search term.</p>
              </div>
            )}
          </div>
        )}

        {/* Newly Added Products */}
        {!searchQuery && newlyAddedProducts.length > 0 && (
          <div className="newly-added-section">
            <h3>Newly Added Products</h3>
            <div className="product-list">
              {newlyAddedProducts.map((product) => (
                <div
                  key={product._id}
                  className="product-item"
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/100x100?text=Product';
                    }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    <p className="discount">{product.offer || '10% OFF'}</p>
                    {product.stock !== undefined && (
                      <p className={`stock-info ${product.stock <= 5 ? 'low-stock' : ''}`}>
                        {product.stock <= 5 ? `Hurry! Only ${product.stock} left!` : `In Stock: ${product.stock}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Products */}
        {!searchQuery && popularProducts.length > 0 && (
          <div className="popular-products-section">
            <h3>Popular Products</h3>
            <div className="product-list">
              {popularProducts.map((product) => (
                <div
                  key={product._id}
                  className="product-item"
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                >
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=Product'}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/100x100?text=Product';
                    }}
                  />
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="price">₹{Number(product.price).toFixed(2)}</p>
                    <p className="discount">{product.offer || '10% OFF'}</p>
                    {product.stock !== undefined && (
                      <p className={`stock-info ${product.stock <= 5 ? 'low-stock' : ''}`}>
                        {product.stock <= 5 ? `Hurry! Only ${product.stock} left!` : `In Stock: ${product.stock}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discover More Categories */}
        {!searchQuery && (
          <div className="discover-categories-section">
            <h3>Discover More Categories</h3>
            <div className="category-list">
              {Object.entries(categoryHierarchy).map(([mainCategory, categoryData]) => (
                <div key={mainCategory} className="category-group">
                  <div
                    className="category-item main-category"
                    onClick={() => navigate(`/products?category=${encodeURIComponent(mainCategory)}`)}
                  >
                    <img
                      src={categoryData.image || `https://placehold.co/100x100?text=${mainCategory}`}
                      alt={mainCategory}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=Category';
                      }}
                    />
                    <span>{mainCategory}</span>
                  </div>
                  <div className="subcategory-list">
                    {Object.entries(categoryData).filter(([key]) => key !== 'image').map(([subcategory, nestedCategories]) => (
                      <div key={subcategory} className="subcategory-item">
                        <div
                          className="subcategory-name"
                          onClick={() => navigate(`/products?category=${encodeURIComponent(`${mainCategory}/${subcategory}`)}`)}
                        >
                          {subcategory}
                        </div>
                        <div className="nested-category-list">
                          {nestedCategories.map((nestedCategory) => (
                            <div
                              key={nestedCategory}
                              className="nested-category-item"
                              onClick={() => navigate(`/products?category=${encodeURIComponent(`${mainCategory}/${subcategory}/${nestedCategory}`)}`)}
                            >
                              {nestedCategory}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;












































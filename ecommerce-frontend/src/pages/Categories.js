import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { motion } from 'framer-motion';
import '../styles/Categories.css';

function Categories() {
  const { user } = useAuth();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedNestedCategory, setSelectedNestedCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const navigate = useNavigate();

  // Define category hierarchy with image field for each main category
  const categoryHierarchy = {
    Fashion: {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      Men: [
        'Top Wear', 'Bottom Wear', 'Casual Shoes', 'Watches', 'Ethnic', 'Sports Shoes',
        'Luggage', 'Trimmers', 'Essentials', 'Men Grooming'
      ],
      Women: ['Dresses', 'Top Wear', 'Footwear', 'Jewelry', 'Handbags', 'Accessories'],
      Beauty: ['Skincare', 'Makeup', 'Haircare', 'Fragrances']
    },
    Gadgets: {
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      Accessories: ['Phone Cases', 'Chargers', 'Headphones'],
      SmartDevices: ['Smartwatches', 'Speakers', 'Cameras']
    },
    Electronics: {
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      Audio: ['Headphones', 'Speakers', 'Earphones'],
      Computing: ['Laptops', 'Desktops', 'Monitors']
    },
    Home: {
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      Decor: ['Wall Art', 'Rugs', 'Lighting'],
      Kitchen: ['Appliances', 'Utensils', 'Cookware']
    },
    Mobiles: {
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
       Smartphones: ['iPhone', 'Samsung', 'Xiaomi', 'OnePlus', 'Google Pixel','Realme','Redmi'],
      FeaturePhones: ['Nokia', 'JioPhone'],
      Tablets: ['iPad', 'Samsung Galaxy Tab', 'Lenovo Tab'],
      Accessories: ['Chargers', 'Earphones', 'Cases', 'Screen Protectors','Power Banks'],
    },
    Appliances: {
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      Small: ['Microwave', 'Toaster', 'Blender'],
      Large: ['Refrigerator', 'Washing Machine', 'Air Conditioner']
    },
    Furniture: {
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      Living: ['Sofas', 'Tables', 'Chairs'],
      Bedroom: ['Beds', 'Wardrobes', 'Mattresses']
    }
  };

  const mainCategories = Object.keys(categoryHierarchy);

  // Filter products based on selected category, subcategory, nested category, and search query
  useEffect(() => {
    let filtered = products;

    // Construct the category path based on selected levels
    let categoryPath = '';
    if (selectedCategory) {
      categoryPath = selectedCategory;
      if (selectedSubcategory) {
        categoryPath += `/${selectedSubcategory}`;
        if (selectedNestedCategory) {
          categoryPath += `/${selectedNestedCategory}`;
        }
      }
    }

    // Filter products based on the category path
    if (categoryPath) {
      filtered = filtered.filter((product) =>
        product.category.toLowerCase().startsWith(categoryPath.toLowerCase())
      );
    }

    // Apply search query filter if present
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, selectedNestedCategory, searchQuery, products]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const relatedProducts = products.slice(0, 4);
  const topPicks = products.slice(4, 8);
  const bestDeals = products.slice(8, 12);
  const recentlyViewed = products.slice(12, 16);

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

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="categories-wrapper">
      <div className="categories-container">
        {/* Left Sidebar: Categories */}
        <motion.aside initial="hidden" animate="visible" variants={fadeIn} className="category-sidebar">
          <h2>Categories</h2>
          <div className="category-list">
            <div
              className={`category-item ${!selectedCategory && !selectedSubcategory && !selectedNestedCategory ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSelectedNestedCategory(null);
              }}
            >
              <img
                src="https://www.advisoryexcellence.com/wp-content/uploads/2021/12/E-COMMERCE-PHOTO.jpg"
                alt="All Categories"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/50x50?text=All';
                }}
              />
              <span>All Categories</span>
            </div>
            {mainCategories.map((category) => (
              <div
                key={category}
                className={`category-item ${selectedCategory === category && !selectedSubcategory && !selectedNestedCategory ? 'active' : ''}`}
                onClick={() => {
                  if (selectedCategory === category) {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setSelectedNestedCategory(null);
                  } else {
                    setSelectedCategory(category);
                    setSelectedSubcategory(null);
                    setSelectedNestedCategory(null);
                  }
                }}
              >
                <img
                  src={categoryHierarchy[category].image}
                  alt={category}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/50x50?text=Category';
                  }}
                />
                <span>{category}</span>
              </div>
            ))}
          </div>
        </motion.aside>

        {/* Right Content: Subcategories, Nested Categories, and Products */}
        <div className="categories-content">
          {/* Header: Search */}
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="categories-header">
            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search within this category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          {/* Display Subcategories when a main category is selected */}
          {selectedCategory && !selectedSubcategory && !selectedNestedCategory && (
            <motion.section initial="hidden" animate="visible" variants={fadeIn} className="subcategory-section">
              <h2>{selectedCategory} Subcategories</h2>
              <div className="category-button-list">
                {Object.keys(categoryHierarchy[selectedCategory]).filter(key => key !== 'image').map((subcategory) => (
                  <button
                    key={subcategory}
                    className={`category-button ${selectedSubcategory === subcategory ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedSubcategory === subcategory) {
                        setSelectedSubcategory(null);
                      } else {
                        setSelectedSubcategory(subcategory);
                        setSelectedNestedCategory(null);
                      }
                    }}
                  >
                    {subcategory}
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Display Nested Categories when a subcategory is selected */}
          {selectedSubcategory && !selectedNestedCategory && (
            <motion.section initial="hidden" animate="visible" variants={fadeIn} className="nested-category-section">
              <h2>{selectedSubcategory} Categories</h2>
              <div className="category-button-list">
                {categoryHierarchy[selectedCategory][selectedSubcategory].map((nestedCategory) => (
                  <button
                    key={nestedCategory}
                    className={`category-button ${selectedNestedCategory === nestedCategory ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedNestedCategory === nestedCategory) {
                        setSelectedNestedCategory(null);
                      } else {
                        setSelectedNestedCategory(nestedCategory);
                      }
                    }}
                  >
                    {nestedCategory}
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Display Filtered Products when any category level is selected */}
          {(selectedCategory || selectedSubcategory || selectedNestedCategory) && (
            <motion.section initial="hidden" animate="visible" variants={fadeIn} className="filtered-products-section">
              <h2>
                {selectedNestedCategory || selectedSubcategory || selectedCategory} Products
              </h2>
              {filteredProducts.length === 0 ? (
                <div className="no-products">
                  <p>No products found in this category.</p>
                </div>
              ) : (
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
              )}
            </motion.section>
          )}

          {/* No Products Message when no category is selected but search yields no results */}
          {!selectedCategory && !selectedSubcategory && !selectedNestedCategory && filteredProducts.length === 0 && searchQuery.trim() && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="no-products">
              <p>No products found. Try a different search term.</p>
            </motion.div>
          )}

          {/* Related Products, Top Picks, Best Deals, Recently Viewed */}
          {!selectedCategory && !selectedSubcategory && !selectedNestedCategory && filteredProducts.length > 0 && (
            <>
              <motion.section initial="hidden" animate="visible" variants={fadeIn} className="related-products-section">
                <h2>Related Products</h2>
                <div className="product-list">
                  {relatedProducts.map((product) => (
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
              </motion.section>

              <motion.section initial="hidden" animate="visible" variants={fadeIn} className="top-picks-section">
                <h2>Top Picks</h2>
                <div className="product-list">
                  {topPicks.map((product) => (
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
              </motion.section>

              <motion.section initial="hidden" animate="visible" variants={fadeIn} className="best-deals-section">
                <h2>Best Deals</h2>
                <div className="product-list">
                  {bestDeals.map((product) => (
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
              </motion.section>

              <motion.section initial="hidden" animate="visible" variants={fadeIn} className="recently-viewed-section">
                <h2>Recently Viewed</h2>
                <div className="product-list">
                  {recentlyViewed.map((product) => (
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
              </motion.section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Categories;




































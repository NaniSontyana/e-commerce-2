import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import logoBlue from "../assets/logo-blue.png";
import logoWhite from "../assets/logo-white.png";
import "../styles/Navbar.css";

function Navigation() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { products } = useProducts();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [openSubcategory, setOpenSubcategory] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  const isHomeRoute = location.pathname === "/";
  const isBlueBackgroundRoute =
    ["/products", "/orders"].includes(location.pathname) ||
    location.pathname.startsWith("/product/");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 576);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    const filteredProducts = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filteredProducts.slice(0, 5));
  }, [searchQuery, products]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".mini-sidebar") &&
        !event.target.closest(".mini-nav-link")
      ) {
        setIsSidebarOpen(false);
        setActiveCategory(null);
        setOpenSubcategory(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClick = () => {
    navigate("/search", { state: { searchQuery } });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchResultClick = (productId) => {
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/product/${productId}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleBottomNavClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryHierarchy = {
    Fashion: {
      Men: [
        "Top Wear",
        "Bottom Wear",
        "Casual Shoes",
        "Watches",
        "Ethnic",
        "Sports Shoes",
        "Luggage",
        "Trimmers",
        "Essentials",
        "Men Grooming",
      ],
      Women: [
        "Dresses",
        "Top Wear",
        "Footwear",
        "Jewelry",
        "Handbags",
        "Accessories",
      ],
      Beauty: ["Skincare", "Makeup", "Haircare", "Fragrances"],
    },
    Gadgets: {
      Accessories: ["Phone Cases", "Chargers", "Headphones"],
      SmartDevices: ["Smartwatches", "Speakers", "Cameras"],
    },

    Electronics: {
      Audio: ["Headphones", "Speakers", "Earphones"],
      Computing: ["Laptops", "Desktops", "Monitors"],
    },
    Home: {
      Decor: ["Wall Art", "Rugs", "Lighting"],
      Kitchen: ["Appliances", "Utensils", "Cookware"],
    },
    Mobiles: {
      Smartphones: [
        "iPhone",
        "Samsung",
        "Xiaomi",
        "OnePlus",
        "Google Pixel",
        "Realme",
        "Redmi",
      ],
      FeaturePhones: ["Nokia", "JioPhone"],
      Tablets: ["iPad", "Samsung Galaxy Tab", "Lenovo Tab"],
      Accessories: [
        "Chargers",
        "Earphones",
        "Cases",
        "Screen Protectors",
        "Power Banks",
      ],
    },
    Appliances: {
      Small: ["Microwave", "Toaster", "Blender"],
      Large: ["Refrigerator", "Washing Machine", "Air Conditioner"],
    },
    Furniture: {
      Living: ["Sofas", "Tables", "Chairs"],
      Bedroom: ["Beds", "Wardrobes", "Mattresses"],
    },
  };

  const mainCategories = Object.keys(categoryHierarchy);

  const toggleSidebar = (category) => {
    if (activeCategory === category && isSidebarOpen) {
      setIsSidebarOpen(false);
      setActiveCategory(null);
      setOpenSubcategory(null);
    } else {
      setActiveCategory(category);
      setIsSidebarOpen(true);
      setOpenSubcategory(null);
    }
  };

  const toggleSubcategory = (subcategory) => {
    if (openSubcategory === subcategory) {
      setOpenSubcategory(null);
    } else {
      setOpenSubcategory(subcategory);
    }
  };

  const handleAllCategories = () => {
    if (activeCategory === "All Categories" && isSidebarOpen) {
      setIsSidebarOpen(false);
      setActiveCategory(null);
      setOpenSubcategory(null);
    } else {
      setActiveCategory("All Categories");
      setIsSidebarOpen(true);
      setOpenSubcategory(null);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setActiveCategory(null);
    setOpenSubcategory(null);
  };

  return (
    <>
      <nav
        className={`flipkart-navbar fixed-top ${
          isHomeRoute ? "navbar-white" : "navbar-blue"
        }`}
      >
        <div className="navbar-container">
          <Link className="navbar-brand" to="/">
            <img
              src={isHomeRoute ? logoBlue : logoWhite}
              alt="E-Shop"
              className="navbar-logo"
            />
          </Link>

          <div className="search-container1">
            <div className="search-bar1">
              <input
                type="text"
                placeholder="Search for Products, Brands and More"
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={handleSearchClick}
                className="search-input1"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(product._id)}
                  >
                    <img
                      src={
                        product.image ||
                        "https://placehold.co/40x40?text=Product"
                      }
                      alt={product.name}
                      className="search-result-image"
                    />
                    <span>{product.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isMobile && (
            <ul className="nav-links">
              {user ? (
                <li className="nav-item account-dropdown">
                  <div className="nav-link account-info">
                    <span>{user.username || user.email || "Chinnu"}</span>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      Profile
                    </Link>
                    <hr></hr>
                    <Link to="/wishlist" className="dropdown-item">
                      Wishlist
                    </Link>
                    <hr></hr>
                    <Link to="/orders" className="dropdown-item">
                      Orders
                    </Link>
                    <hr></hr>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/signup" className="nav-link">
                      Signup
                    </Link>
                  </li>
                </>
              )}
              <li className="nav-item">
                <Link to="/cart" className="nav-link cart-link">
                  <i className="fas fa-shopping-cart"></i>
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="cart-count">{cartCount}</span>
                  )}
                </Link>
              </li>
            </ul>
          )}
        </div>
      </nav>

      {!isMobile && (
        <div className="mini-navbar">
          <ul className="mini-nav-links">
            <li className="mini-nav-item">
              <div
                className={`mini-nav-link ${
                  activeCategory === "All Categories" ? "active" : ""
                }`}
                onClick={handleAllCategories}
              >
                All Categories
              </div>
            </li>
            {mainCategories.map((category) => (
              <li key={category} className="mini-nav-item">
                <div
                  className={`mini-nav-link ${
                    activeCategory === category ? "active" : ""
                  }`}
                  onClick={() => toggleSidebar(category)}
                >
                  {category}
                </div>
              </li>
            ))}
          </ul>

          {isSidebarOpen && activeCategory && (
            <div className={`mini-sidebar ${isSidebarOpen ? "open" : ""}`}>
              <div className="mini-sidebar-header">
                <h3 className="mini-sidebar-title">{activeCategory}</h3>
                <button className="mini-sidebar-close" onClick={closeSidebar}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="mini-sidebar-content">
                {activeCategory === "All Categories" ? (
                  <ul className="mini-sidebar-list">
                    {mainCategories.map((category) => (
                      <li key={category} className="mini-sidebar-item">
                        <div
                          className={`mini-sidebar-subcategory ${
                            openSubcategory === category ? "active" : ""
                          }`}
                          onClick={() => toggleSubcategory(category)}
                        >
                          <span className="mini-sidebar-subcategory-label">
                            {category}
                          </span>
                          <i
                            className={`fas fa-chevron-${
                              openSubcategory === category ? "up" : "down"
                            } mini-sidebar-icon`}
                          ></i>
                        </div>
                        {openSubcategory === category && (
                          <ul className="mini-sidebar-nested">
                            {Object.keys(categoryHierarchy[category]).map(
                              (subcategory) => (
                                <li key={subcategory}>
                                  <Link
                                    to={`/products?category=${encodeURIComponent(
                                      `${category}/${subcategory}`
                                    )}`}
                                    className="mini-sidebar-nested-item"
                                    onClick={() => {
                                      setIsSidebarOpen(false);
                                      setActiveCategory(null);
                                      setOpenSubcategory(null);
                                    }}
                                  >
                                    {subcategory}
                                  </Link>
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="mini-sidebar-list">
                    {Object.keys(categoryHierarchy[activeCategory]).map(
                      (subcategory) => (
                        <li key={subcategory} className="mini-sidebar-item">
                          <div
                            className={`mini-sidebar-subcategory ${
                              openSubcategory === subcategory ? "active" : ""
                            }`}
                            onClick={() => toggleSubcategory(subcategory)}
                          >
                            <span className="mini-sidebar-subcategory-label">
                              {subcategory}
                            </span>
                            <i
                              className={`fas fa-chevron-${
                                openSubcategory === subcategory ? "up" : "down"
                              } mini-sidebar-icon`}
                            ></i>
                          </div>
                          {openSubcategory === subcategory && (
                            <ul className="mini-sidebar-nested">
                              {categoryHierarchy[activeCategory][
                                subcategory
                              ].map((nestedCategory) => (
                                <li key={nestedCategory}>
                                  <Link
                                    to={`/products?category=${encodeURIComponent(
                                      `${activeCategory}/${subcategory}/${nestedCategory}`
                                    )}`}
                                    className="mini-sidebar-nested-item"
                                    onClick={() => {
                                      setIsSidebarOpen(false);
                                      setActiveCategory(null);
                                      setOpenSubcategory(null);
                                    }}
                                  >
                                    {nestedCategory}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isMobile && (
        <div className="bottom-nav fixed-bottom">
          <Link
            to="/"
            className={`bottom-nav-item ${
              location.pathname === "/" ? "active" : ""
            }`}
            onClick={() => handleBottomNavClick("/")}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link
            to="/categories"
            className={`bottom-nav-item ${
              location.pathname === "/categories" ? "active" : ""
            }`}
            onClick={() => handleBottomNavClick("/categories")}
          >
            <i className="fas fa-th"></i>
            <span>Categories</span>
          </Link>
          <Link
            to="/profile"
            className={`bottom-nav-item ${
              location.pathname === "/profile" ? "active" : ""
            }`}
            onClick={() => handleBottomNavClick("/profile")}
          >
            <i className="fas fa-user"></i>
            <span>Account</span>
          </Link>
          <Link
            to="/cart"
            className={`bottom-nav-item ${
              location.pathname === "/cart" ? "active" : ""
            }`}
            onClick={() => handleBottomNavClick("/cart")}
          >
            <i className="fas fa-shopping-cart"></i>
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bottom-nav-count">{cartCount}</span>
            )}
          </Link>
        </div>
      )}
    </>
  );
}

export default Navigation;

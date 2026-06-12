// ecommerce-frontend/src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { CartProvider } from "./context/CartContext";
import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import ProductDetails from "./pages/ProductDetails";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Success from "./pages/Success"; // New component
import Failure from "./pages/Failure"; // New component
import { ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS
import Wishlist from "./pages/Wishlist.js";
import Compare from "./pages/compare.js";
import Categories from "./pages/Categories.js";
import OrderDetails from "./pages/OrderDetails";
import Footer from "./pages/Footer.js";
import AboutUs from "./pages/AboutUs.js";
import ContactUs from "./pages/ContactUs.js";
import Returns from "./pages/Returns.js";
import FAQ from "./pages/FAQ.js";
import Support from "./pages/Support.js";
import Terms from "./pages/Terms.js";
import SearchPage from "./pages/SearchPage.js";

// Optional: Simple Error Boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container my-5 text-center">
          <h3>Something went wrong</h3>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <ErrorBoundary>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
              <NavBar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/products" element={<Products />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/success" element={<Success />} />
                <Route path="/failure" element={<Failure />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/order/:orderId" element={<OrderDetails />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/support" element={<Support />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="*" element={<div>Page Not Found</div>} />
              </Routes>
              <Footer />
            </ErrorBoundary>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

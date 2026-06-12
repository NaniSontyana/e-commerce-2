// src/components/Footer.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  const [openSection, setOpenSection] = useState(null); // State to manage accordion on mobile

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Company Info */}
        <div className="footer-section company-info">
          <h3 className="footer-title">EasyCart</h3>
          <p className="footer-description">
            Shop the best products from across the platform.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section quick-links">
          <h3 className="footer-title" onClick={() => toggleSection('quick-links')}>
            Quick Links
            <span className={`accordion-icon ${openSection === 'quick-links' ? 'open' : ''}`}>
              ▼
            </span>
          </h3>
          <ul className={`footer-links ${openSection === 'quick-links' ? 'open' : ''}`}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div className="footer-section customer-service">
          <h3 className="footer-title" onClick={() => toggleSection('customer-service')}>
            Customer Service
            <span className={`accordion-icon ${openSection === 'customer-service' ? 'open' : ''}`}>
              ▼
            </span>
          </h3>
          <ul className={`footer-links ${openSection === 'customer-service' ? 'open' : ''}`}>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/returns">Returns</Link></li>
            <li><Link to="/support">Support</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Social Media */}
        <div className="footer-section social-media">
          <h3 className="footer-title" onClick={() => toggleSection('social-media')}>
            Follow Us
            <span className={`accordion-icon ${openSection === 'social-media' ? 'open' : ''}`}>
              ▼
            </span>
          </h3>
          <div className={`social-icons ${openSection === 'social-media' ? 'open' : ''}`}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>

        {/* Newsletter Signup (New Feature) */}
        <div className="footer-section newsletter">
          <h3 className="footer-title" onClick={() => toggleSection('newsletter')}>
            Newsletter
            <span className={`accordion-icon ${openSection === 'newsletter' ? 'open' : ''}`}>
              ▼
            </span>
          </h3>
          <div className={`newsletter-form ${openSection === 'newsletter' ? 'open' : ''}`}>
            <p className="newsletter-description">Stay updated with our latest offers!</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-btn">Subscribe</button>
            </form>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>© {currentYear} EasyCart. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
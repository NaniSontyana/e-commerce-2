// src/pages/ContactUs.js
import { useState } from 'react';
import '../styles/ContactUs.css';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' }); // Clear error on change
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('');
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Simulate API call by saving to localStorage (replace with actual backend API)
    const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    messages.push({ ...formData, timestamp: new Date().toISOString() });
    localStorage.setItem('contactMessages', JSON.stringify(messages));

    setTimeout(() => {
      setSuccess('Your message has been sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="contactus-container">
      <div className="contactus-scrollable">
        <div className="contactus-content">
          <h1 className="contactus-title">Contact Us</h1>
          <div className="contactus-card">
            <div className="contactus-form-section">
              <h2>Send Us a Message</h2>
              {success && <div className="success-message">{success}</div>}
              <form className="contactus-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label htmlFor="name" className="input-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input-field"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="email" className="input-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input-field"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="subject" className="input-label">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="input-field"
                    placeholder="Enter the subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                  {errors.subject && <span className="error-text">{errors.subject}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="message" className="input-label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    className="input-field textarea"
                    placeholder="Enter your message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                  {errors.message && <span className="error-text">{errors.message}</span>}
                </div>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
            <div className="contactus-info-section">
              <h2>Contact Information</h2>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@cosmiccommerce.com">support@cosmiccommerce.com</a>
              </p>
              <p>
                <strong>Phone:</strong>{' '}
                <a href="tel:+15551234567">+1 (555) 123-4567</a>
              </p>
              <p><strong>Address:</strong> 123 Galactic Avenue, Star City, Universe</p>
              <h3>Find Us</h3>
              <div className="map-container">
                <iframe
                title='frame'
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153167!3d-37.81627977975159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d1f2a4d1b0c!2sVictoria%20State%20Library!5e0!3m2!1sen!2sau!4v1696923456789!5m2!1sen!2sau"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;
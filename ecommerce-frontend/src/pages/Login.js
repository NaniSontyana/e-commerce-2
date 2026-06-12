import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/login.jpg'
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Reset all errors
    setErrors({
      email: '',
      password: '',
      general: '',
    });
    setIsSubmitting(true);

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Please enter your email' }));
      setIsSubmitting(false);
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      setIsSubmitting(false);
      return;
    }

    // Client-side password validation
    if (!password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Please enter your password' }));
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Login submit error:', {
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });

      // Determine the type of error based on the response message
      const errorMessage = err.response?.data?.message?.toLowerCase() || 'failed to login';
      let emailError = '';
      let passwordError = '';
      let generalError = '';

      // Prioritize email error over password error to avoid showing both
      if (errorMessage.includes('user not found') || errorMessage.includes('invalid email')) {
        emailError = 'Email is incorrect';
      } else if (errorMessage.includes('password') || errorMessage.includes('incorrect')) {
        passwordError = 'Password is incorrect';
      } else {
        generalError = err.response?.data?.message || 'Failed to log in. Please try again.';
      }

      setErrors((prev) => ({
        ...prev,
        email: emailError,
        password: passwordError,
        general: generalError,
      }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-layout">
        <div className="login-image-section">
          <img
            src={logo}
            alt="Login Illustration"
            className="login-image"
            onError={(e) => {
              e.target.src = 'https://placehold.co/600x800?text=Image+Not+Found';
            }}
          />
        </div>
        <div className="login-form-section">
          <div className="login-scrollable">
            <div className="login-content">
              <h1 className="login-title">Log In to Your Account</h1>
              <div className="login-card">
                <form className="login-form" onSubmit={handleSubmit}>
                  <div className="input-group">
                    <label htmlFor="email" className="input-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      ref={emailRef}
                      className="input-field"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {errors.email && (
                      <div className="error-message">
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="input-group">
                    <label htmlFor="password" className="input-label">Password</label>
                    <input
                      type="password"
                      id="password"
                      className="input-field"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {errors.password && (
                      <div className="error-message">
                        <span>{errors.password}</span>
                      </div>
                    )}
                  </div>
                  {errors.general && (
                    <div className="error-message">
                      <span>{errors.general}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="login-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Logging In...' : 'Log In'}
                  </button>
                </form>
                <p className="signup-link">
                  New to the platform? <a href="/signup">Sign up here</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;





























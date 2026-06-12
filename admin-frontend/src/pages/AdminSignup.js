// admin-frontend/src/pages/AdminSignup.js
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminSignup.css';

function AdminSignup() {
  const [username, setUsername] = useState(''); // Changed from name to username
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic client-side validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const res = await axios.post('https://backend-ps76.onrender.com/api/admin/register', { username, email, password });
      localStorage.setItem('token', res.data.token); // Store the token
      navigate('/dashboard'); // Redirect to dashboard
    } catch (err) {
      console.error('Admin Signup Error:', err); 
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>Admin Signup</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username" // Changed placeholder to Username
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign Up</button>
          <p className="login-link">
            Already have an account? <Link to="/login">Login</Link> {/* Updated path to /admin/login */}
          </p>
        </form>
      </div>
    </div>
  );
}

export default AdminSignup;
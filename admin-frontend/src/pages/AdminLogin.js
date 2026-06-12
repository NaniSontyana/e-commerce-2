
 // admin-frontend/src/pages/AdminLogin.js
 import { useState } from 'react';
 import { useNavigate,Link } from 'react-router-dom';
 import axios from 'axios';
 import '../styles/AdminLogin.css';
 
 function AdminLogin() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const navigate = useNavigate();
 
   const handleLogin = async (e) => {
     e.preventDefault(); 
     console.log('Login Attempt:', { email, password }); // Debug input
     try {
       const res = await axios.post('https://backend-ps76.onrender.com/api/admin/login', { email, password });
       console.log('Login Response:', res.data); // Debug response
       if (!res.data.token) {
         throw new Error('No token received from server');
       }
       localStorage.setItem('token', res.data.token);
       console.log('Stored Token:', localStorage.getItem('token')); // Debug stored token
       navigate('/dashboard');
     } catch (err) {
       console.error('Login Error:', err.response?.data || err.message);
       setError(err.response?.data?.message || err.message || 'Login failed');
     }
   };
 
   return (
     <div className="login-container">
       <div className="login-card">
         <h1>Admin Login</h1>
         {error && <p className="error">{error}</p>}
         <form onSubmit={handleLogin}>
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
           <button type="submit">Login</button>
          <p className="login-link">
            did not have account? <Link to="/signup">Signup</Link> {/* Updated path to /admin/login */}
          </p>
         </form>
       </div>
     </div>
   );
 }
 
 export default AdminLogin; 

import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, username) => {
    try {
      setLoading(true);
      console.log('Sending signup request with:', { email, password, username });
      const res = await axios.post('https://e-commerce-2-gbm9.onrender.com/api/auth/register', { email, password, username });
      console.log('Signup response:', res.data);
      const { token } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const profileRes = await axios.get('https://e-commerce-2-gbm9.onrender.com/api/users/profile');
      console.log('Profile response:', profileRes.data);
      const fetchedUser = profileRes.data;
      if (!fetchedUser || !fetchedUser.id) {
        throw new Error('Invalid user data received');
      }
      const avatarUrl = fetchedUser.avatar
        ? fetchedUser.avatar.startsWith('http')
          ? fetchedUser.avatar
          : `https://e-commerce-2-gbm9.onrender.com${fetchedUser.avatar}`
        : '';
      setUser({ ...fetchedUser, _id: fetchedUser.id, avatar: avatarUrl });
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      setLoading(false);
      throw new Error(err.response?.data?.message || 'Signup failed');
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email, password });
      const res = await axios.post('https://e-commerce-2-gbm9.onrender.com/api/auth/login', { email, password });
      console.log('Login response:', res.data);
      const { token } = res.data;
      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const profileRes = await axios.get('https://e-commerce-2-gbm9.onrender.com/api/users/profile');
      console.log('Profile response:', profileRes.data);
      const fetchedUser = profileRes.data;
      if (!fetchedUser || !fetchedUser.id) {
        throw new Error('Invalid user data received');
      }
      const avatarUrl = fetchedUser.avatar
        ? fetchedUser.avatar.startsWith('http')
          ? fetchedUser.avatar
          : `https://e-commerce-2-gbm9.onrender.com${fetchedUser.avatar}`
        : '';
      setUser({ ...fetchedUser, _id: fetchedUser.id, avatar: avatarUrl });
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setLoading(false);
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    return new Promise((resolve) => {
      console.log('Logging out user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
      resolve();
    });
  };

  const updateUser = (updatedUser) => {
    console.log('Updating user with:', updatedUser);
    setUser((prevUser) => {
      const avatarUrl = updatedUser.avatar
        ? updatedUser.avatar.startsWith('http')
          ? updatedUser.avatar
          : `https://e-commerce-2-gbm9.onrender.com${updatedUser.avatar}`
        : prevUser?.avatar || '';
      return { ...prevUser, ...updatedUser, avatar: avatarUrl };
    });
  };

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const fetchUser = async () => {
        try {
          const res = await axios.get('https://e-commerce-2-gbm9.onrender.com/api/users/profile');
          console.log('Fetch user response:', res.data);
          const fetchedUser = res.data;
          if (!fetchedUser || !fetchedUser.id) {
            console.error('User data not found or invalid:', res.data);
            throw new Error('User profile not found');
          }
          const avatarUrl = fetchedUser.avatar
            ? fetchedUser.avatar.startsWith('http')
              ? fetchedUser.avatar
              : `https://e-commerce-2-gbm9.onrender.com${fetchedUser.avatar}`
            : '';
          setUser({ ...fetchedUser, _id: fetchedUser.id, avatar: avatarUrl });
        } catch (err) {
          console.error('Fetch user error:', err.response?.data || err.message);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 

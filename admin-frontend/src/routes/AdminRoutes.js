
  // admin-frontend/src/routes/AdminRoutes.js
import { Routes, Route } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import AdminSignup from '../pages/AdminSignup'; // Added signup
import Dashboard from '../pages/Dashboard';
import ProductManagement from '../pages/ProductManagement';
import AdminOrders from '../pages/AdminOrders';

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/signup" element={<AdminSignup />} /> 
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<ProductManagement />} />
      <Route path="/" element={<Dashboard />} /> 
      <Route path="/admin/orders" element={<AdminOrders />} />
    </Routes>
  );
}

export default AdminRoutes; 
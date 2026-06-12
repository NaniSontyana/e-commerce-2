import { Link, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h3>Admin Panel</h3>
        <ul>
          <li>
            <Link to="/dashboard" onClick={() => toggleSidebar()}>
              <span className="icon">🏠</span>
              <span className="text">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/products" onClick={() => toggleSidebar()}>
              <span className="icon">📦</span>
              <span className="text">Products</span>
            </Link>
          </li>
          <li>
            <Link to="/signup" onClick={() => toggleSidebar()}>
              <span className="icon">✍️</span>
              <span className="text">Signup</span>
            </Link>
          </li>
          <li>
            <Link to="/login" onClick={() => toggleSidebar()}>
              <span className="icon">🔑</span>
              <span className="text">Login</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/orders" onClick={() => toggleSidebar()}>
              <span className="icon">🛒</span>
              <span className="text">Orders</span>
            </Link>
          </li>
          {isLoggedIn && (
            <li>
              <button onClick={handleLogout}>
                <span className="icon">🚪</span>
                <span className="text">Logout</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;





























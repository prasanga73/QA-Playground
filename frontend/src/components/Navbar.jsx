import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { showSuccess } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    showSuccess('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="nav-container">
        <NavLink to="/products" className="nav-brand" data-testid="nav-brand">
          <svg className="brand-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="brand-text">QA Playground</span>
        </NavLink>

        <div className="nav-links">
          <NavLink
            to="/products"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            data-testid="nav-products"
          >
            Products
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) => (isActive ? 'nav-link cart-link active' : 'nav-link cart-link')}
            data-testid="nav-cart"
          >
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="cart-badge" data-testid="cart-badge">
                {cartCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            data-testid="nav-orders"
          >
            Orders
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            data-testid="nav-profile"
          >
            Profile
          </NavLink>

          <a
            href="/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            data-testid="nav-docs"
          >
            Docs
          </a>
        </div>

        <div className="nav-user-actions">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            data-testid="theme-toggle"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <span className="nav-user-badge" data-testid="nav-user-badge">
            <span className="user-role-tag">{user?.role}</span>
            <span className="user-email-text">{user?.email}</span>
          </span>

          <button
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm"
            data-testid="nav-logout"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

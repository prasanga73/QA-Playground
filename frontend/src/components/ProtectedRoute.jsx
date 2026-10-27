import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen" data-testid="loading-spinner">
        <div className="spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Signed in but not an admin: say so explicitly rather than redirecting silently,
  // so the 403 case is visible and assertable in tests.
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="state-container empty-state" data-testid="admin-forbidden">
          <div className="empty-icon-wrapper">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="empty-title">Admin access required</h2>
          <p className="empty-desc">
            Your account role is <strong>{user?.role || 'unknown'}</strong>. Sign in as an admin to manage products.
          </p>
          <Link to="/products" className="btn btn-primary" data-testid="admin-forbidden-back">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

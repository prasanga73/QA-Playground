import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="not-found-container" data-testid="not-found-page">
      <div className="not-found-card">
        <div className="not-found-code" data-testid="not-found-status">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The page or route you requested does not exist or may have been moved.
        </p>
        <Link to="/products" className="btn btn-primary btn-lg" data-testid="not-found-home-btn">
          Back to Products
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

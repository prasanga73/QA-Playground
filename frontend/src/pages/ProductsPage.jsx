import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';

export const ProductsPage = () => {
  const { refreshCart, getCartQuantity, setCartCount, setCartItems } = useCart();
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Per-product quantities for adding to cart
  const [quantities, setQuantities] = useState({});

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'];

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle filter changes resetting page
  const handleCategoryChange = (val) => {
    setCategory(val);
    setCurrentPage(1);
  };

  const handleMinPriceChange = (val) => {
    setMinPrice(val);
    setCurrentPage(1);
  };

  const handleMaxPriceChange = (val) => {
    setMaxPrice(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    const [newSort, newOrder] = val.split('-');
    setSort(newSort);
    setOrder(newOrder);
    setCurrentPage(1);
  };

  // Fetch products with AbortController to cancel stale requests
  useEffect(() => {
    const controller = new AbortController();
    let isSubscribed = true;

    const runFetch = async () => {
      setIsFetching(true);
      try {
        const params = {
          page: currentPage,
          limit: 12,
          sort,
          order,
        };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (category) params.category = category;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const response = await api.get('/products', {
          params,
          signal: controller.signal,
        });

        if (isSubscribed && response.data.success) {
          setProducts(response.data.products || []);
          setPagination(response.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          // Stale request cancelled; ignore
          return;
        }
        if (isSubscribed) {
          showError(err.response?.data?.message || 'Failed to fetch products');
        }
      } finally {
        if (isSubscribed) {
          setIsFetching(false);
          setInitialLoading(false);
        }
      }
    };

    runFetch();

    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [debouncedSearch, category, minPrice, maxPrice, sort, order, currentPage, showError]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleQuantityChange = (productId, val) => {
    const parsed = parseInt(val, 10);
    setQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) || parsed < 1 ? 1 : parsed,
    }));
  };

  const handleAddToCart = async (product) => {
    const inCart = getCartQuantity(product.id);
    const availableStock = Math.max(0, product.stock - inCart);
    const qty = quantities[product.id] || 1;
    if (qty > availableStock) {
      showError(`Cannot add ${qty} items. Only ${availableStock} in stock.`);
      return;
    }

    // Optimistically update CartContext immediately so stock and badge update instantly
    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => Number(i.productId) === Number(product.id));
      if (existing) {
        return prevItems.map((i) =>
          Number(i.productId) === Number(product.id)
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [
        ...prevItems,
        {
          id: `temp-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          imageUrl: product.imageUrl,
          stock: product.stock,
          category: product.category,
        },
      ];
    });
    setCartCount((prev) => prev + qty);
    showSuccess(`Added ${qty} × "${product.name}" to cart!`);

    try {
      const response = await api.post('/cart/items', {
        productId: product.id,
        quantity: qty,
      });
      if (!response.data.success) {
        showError(response.data.message || 'Failed to add item to cart');
        await refreshCart();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add item to cart';
      showError(errorMsg);
      await refreshCart();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('id');
    setOrder('asc');
    setCurrentPage(1);
  };

  return (
    <div className="page-container" data-testid="products-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Catalog & Products</h1>
          <p className="page-subtitle">
            Explore 50 test products with search, pagination, category filtering, and sorting
          </p>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <section className="filter-card" data-testid="filter-bar">
        <div className="filter-row">
          <div className="filter-item search-filter">
            <label htmlFor="search" className="filter-label">Search</label>
            <div className="search-input-wrapper">
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title or description..."
                className="form-input"
                data-testid="search-input"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="category" className="filter-label">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select"
              data-testid="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item price-range-group">
            <label className="filter-label">Price Range ($)</label>
            <div className="price-inputs">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                placeholder="Min"
                min="0"
                step="0.01"
                className="form-input price-input"
                data-testid="min-price-filter"
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                placeholder="Max"
                min="0"
                step="0.01"
                className="form-input price-input"
                data-testid="max-price-filter"
              />
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="sort" className="filter-label">Sort By</label>
            <select
              id="sort"
              value={`${sort}-${order}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="form-select"
              data-testid="sort-select"
            >
              <option value="id-asc">Default (ID: Low to High)</option>
              <option value="id-desc">ID (High to Low)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="stock-asc">Stock (Low to High)</option>
              <option value="stock-desc">Stock (High to Low)</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-outline-secondary"
              data-testid="filter-reset-btn"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Persistent progress bar slot to completely eliminate layout shifts */}
      <div className={`fetch-indicator ${isFetching && !initialLoading ? 'is-active' : ''}`} aria-hidden="true">
        {isFetching && !initialLoading && <div className="fetch-progress-bar" />}
      </div>

      {/* Product Content Area */}
      {initialLoading ? (
        <div className="state-container" data-testid="products-loading">
          <div className="spinner"></div>
          <p className="state-text">Loading catalog products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="state-container empty-state" data-testid="products-empty">
          <div className="empty-icon-wrapper">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h2 className="empty-title">No products found</h2>
          <p className="empty-desc">Try adjusting your search criteria, price range, or category filter.</p>
          <button
            onClick={handleResetFilters}
            className="btn btn-primary"
            data-testid="empty-reset-btn"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="catalog-meta">
            <span className="results-count" data-testid="results-count">
              Showing {products.length} of {pagination.total} products
            </span>
            <span className="page-indicator">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>

          <div
            className={`product-grid ${isFetching ? 'grid-refreshing' : ''}`}
            data-testid="product-grid"
            data-loading={isFetching ? 'true' : 'false'}
          >
            {products.map((product) => {
              const inCart = getCartQuantity(product.id);
              const availableStock = Math.max(0, product.stock - inCart);
              const qty = quantities[product.id] || 1;
              const isOutOfStock = availableStock <= 0;
              const imageUrl = product.imageUrl || product.image_url || '/images/placeholder.svg';

              return (
                <div
                  key={product.id}
                  className="product-card"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="product-image-container">
                    <ProductImage
                      src={imageUrl}
                      alt={product.name}
                      testId={`product-image-${product.id}`}
                    />
                    <span className="category-tag">
                      {product.category}
                    </span>
                  </div>

                  <div className="product-body">
                    <h3 className="product-name" title={product.name}>
                      {product.name}
                    </h3>
                    <p className="product-desc" title={product.description}>
                      {product.description}
                    </p>

                    <div className="product-price-stock-row">
                      <div className="product-price">
                        ${Number(product.price).toFixed(2)}
                      </div>
                      <div className="stock-info-group">
                        <div className={`stock-badge ${isOutOfStock ? 'stock-out' : availableStock < 10 ? 'stock-low' : 'stock-ok'}`}>
                          {isOutOfStock ? 'Out of Stock' : `${availableStock} in stock`}
                        </div>
                        {inCart > 0 && (
                          <span className="in-cart-indicator" data-testid={`in-cart-${product.id}`}>
                            {inCart} in cart
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="product-actions">
                      <div className="qty-control">
                        <label htmlFor={`qty-${product.id}`} className="sr-only">Quantity</label>
                        <input
                          id={`qty-${product.id}`}
                          type="number"
                          min="1"
                          max={availableStock || 1}
                          value={isOutOfStock ? 0 : Math.min(qty, availableStock || 1)}
                          disabled={isOutOfStock}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="qty-input"
                          data-testid={`product-qty-${product.id}`}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        className={`btn ${isOutOfStock ? 'btn-disabled' : 'btn-primary'} btn-cart`}
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination-wrapper" data-testid="pagination">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-outline-secondary pagination-btn"
                data-testid="pagination-prev"
              >
                Previous
              </button>

              <div className="pagination-pages">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`pagination-num ${pageNum === pagination.page ? 'active' : ''}`}
                    data-testid={`pagination-page-${pageNum}`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-outline-secondary pagination-btn"
                data-testid="pagination-next"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;

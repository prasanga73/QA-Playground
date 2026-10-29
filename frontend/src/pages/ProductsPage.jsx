import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PAGE_SIZE = 12;
const categories = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'];

// Filters live in the URL (?search=&category=&minPrice=&maxPrice=&sort=&order=&page=)
// so a filtered view survives reloads, works with Back/Forward, and can be shared.
const DEFAULT_PARAMS = { sort: 'id', order: 'asc', page: '1' };

// Text filters keep a local draft so typing stays responsive (URL updates are applied in a
// transition, which would otherwise drop fast keystrokes), then commit to the URL after a pause.
const useUrlDraft = (urlValue, commit, delay = 300) => {
  const [draft, setDraft] = useState(urlValue);
  const [seenUrlValue, setSeenUrlValue] = useState(urlValue);
  // Adopt URL changes made elsewhere (Back/Forward, reset, shared links)
  if (seenUrlValue !== urlValue) {
    setSeenUrlValue(urlValue);
    setDraft(urlValue);
  }
  useEffect(() => {
    if (draft === urlValue) return undefined;
    const timer = setTimeout(() => commit(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, urlValue, commit, delay]);
  return [draft, setDraft];
};

const clampQuantity = (value, max) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, Math.max(1, max));
};

export const ProductsPage = () => {
  const { refreshCart, getCartQuantity, setCartCount, setCartItems } = useCart();
  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  useDocumentTitle('Products');

  const debouncedSearch = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || DEFAULT_PARAMS.sort;
  const order = searchParams.get('order') || DEFAULT_PARAMS.order;
  const currentPage = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const [products, setProducts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // Per-product quantity drafts (raw input text while editing)
  const [quantities, setQuantities] = useState({});

  // Empty values and defaults are dropped to keep URLs short. Filter changes go back to page 1.
  // Builds from the live URL so back-to-back commits (e.g. two debounced inputs) don't overwrite each other.
  const updateParams = useCallback((updates, { resetPage = true, replace = true } = {}) => {
    setSearchParams(() => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => {
        const str = value === null || value === undefined ? '' : String(value);
        if (str === '' || DEFAULT_PARAMS[key] === str) next.delete(key);
        else next.set(key, str);
      });
      if (resetPage && !('page' in updates)) next.delete('page');
      return next;
    }, { replace });
  }, [setSearchParams]);

  const commitSearch = useCallback((value) => updateParams({ search: value }), [updateParams]);
  const commitMinPrice = useCallback((value) => updateParams({ minPrice: value }), [updateParams]);
  const commitMaxPrice = useCallback((value) => updateParams({ maxPrice: value }), [updateParams]);
  const [search, setSearch] = useUrlDraft(debouncedSearch, commitSearch);
  const [minPriceDraft, setMinPriceDraft] = useUrlDraft(minPrice, commitMinPrice);
  const [maxPriceDraft, setMaxPriceDraft] = useUrlDraft(maxPrice, commitMaxPrice);

  const priceRangeInvalid = minPriceDraft !== '' && maxPriceDraft !== '' && Number(minPriceDraft) > Number(maxPriceDraft);

  const handleSortChange = (val) => {
    const [newSort, newOrder] = val.split('-');
    updateParams({ sort: newSort, order: newOrder });
  };

  // Fetch products with AbortController to cancel stale requests
  useEffect(() => {
    const controller = new AbortController();
    let isSubscribed = true;
    let redirected = false;

    const runFetch = async () => {
      setIsFetching(true);
      try {
        const params = {
          page: currentPage,
          limit: PAGE_SIZE,
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
          const nextPagination = response.data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
          // A stale ?page= beyond the last page (e.g. from a shared link): jump to the last page
          if (nextPagination.total > 0 && currentPage > nextPagination.totalPages) {
            redirected = true;
            updateParams({ page: nextPagination.totalPages }, { resetPage: false });
            return;
          }
          setProducts(response.data.products || []);
          setPagination(nextPagination);
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
        if (isSubscribed && !redirected) {
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
  }, [debouncedSearch, category, minPrice, maxPrice, sort, order, currentPage, showError, updateParams]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // Page changes get their own history entry so Back returns to the previous page
      updateParams({ page: newPage }, { resetPage: false, replace: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = async (product) => {
    const inCart = getCartQuantity(product.id);
    const availableStock = Math.max(0, product.stock - inCart);
    // Use exactly what the input shows (it is clamped to the available stock)
    const qty = clampQuantity(quantities[product.id] ?? 1, availableStock);
    if (qty > availableStock) {
      showError(`Cannot add ${qty} items. Only ${availableStock} in stock.`);
      return;
    }
    setQuantities((prev) => ({ ...prev, [product.id]: qty }));

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
    setMinPriceDraft('');
    setMaxPriceDraft('');
    setSearchParams({}, { replace: true });
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
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title or description..."
                className="form-input"
                data-testid="search-input"
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="category" className="filter-label">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => updateParams({ category: e.target.value })}
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

          <div className="filter-item price-range-group" role="group" aria-labelledby="price-range-label">
            <span id="price-range-label" className="filter-label">Price Range ($)</span>
            <div className="price-inputs">
              <input
                type="number"
                value={minPriceDraft}
                onChange={(e) => setMinPriceDraft(e.target.value)}
                placeholder="Min"
                aria-label="Minimum price"
                min="0"
                step="0.01"
                className={`form-input price-input ${priceRangeInvalid ? 'input-error' : ''}`}
                data-testid="min-price-filter"
              />
              <span className="price-separator" aria-hidden="true">–</span>
              <input
                type="number"
                value={maxPriceDraft}
                onChange={(e) => setMaxPriceDraft(e.target.value)}
                placeholder="Max"
                aria-label="Maximum price"
                min="0"
                step="0.01"
                className={`form-input price-input ${priceRangeInvalid ? 'input-error' : ''}`}
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
        {priceRangeInvalid && (
          <p className="filter-hint" role="alert" data-testid="price-range-error">
            Minimum price is greater than maximum price, so no products can match.
          </p>
        )}
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
            <span className="results-count" data-testid="results-count" aria-live="polite">
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
              // Drafts are strings while typing; settled numbers are re-clamped as stock changes
              const qtyDraft = quantities[product.id] ?? 1;
              const qtyValue = typeof qtyDraft === 'number' ? Math.min(qtyDraft, Math.max(1, availableStock)) : qtyDraft;
              const isOutOfStock = availableStock <= 0;
              const imageUrl = product.imageUrl || '/images/placeholder.svg';

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
                          inputMode="numeric"
                          value={isOutOfStock ? 0 : qtyValue}
                          disabled={isOutOfStock}
                          onChange={(e) => setQuantities((prev) => ({ ...prev, [product.id]: e.target.value }))}
                          onBlur={(e) => setQuantities((prev) => ({ ...prev, [product.id]: clampQuantity(e.target.value, availableStock) }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isOutOfStock) handleAddToCart(product);
                          }}
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
            <nav className="pagination-wrapper" data-testid="pagination" aria-label="Product pages">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-outline-secondary pagination-btn"
                data-testid="pagination-prev"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
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
                    aria-current={pageNum === pagination.page ? 'page' : undefined}
                    aria-label={`Page ${pageNum}`}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;

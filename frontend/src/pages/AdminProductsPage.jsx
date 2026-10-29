import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDateTime } from '../utils/format';

const PAGE_SIZE = 10;
const categories = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'];

// Mirrors the limits enforced by POST /api/products/upload-image
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ACCEPTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  imageUrl: '',
};

// Mirrors the server rules in backend/src/utils/validators.js so the admin sees
// the same message inline instead of waiting for a 422.
const validateForm = (form) => {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (form.price === '') {
    errors.price = 'Price is required';
  } else if (Number.isNaN(Number(form.price))) {
    errors.price = 'Price must be a number';
  } else if (Number(form.price) <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  if (form.stock !== '') {
    if (!Number.isInteger(Number(form.stock))) {
      errors.stock = 'Stock must be an integer';
    } else if (Number(form.stock) < 0) {
      errors.stock = 'Stock must be 0 or greater';
    }
  }

  if (!form.category) {
    errors.category = 'Category is required';
  } else if (!categories.includes(form.category)) {
    errors.category = `Category must be one of: ${categories.join(', ')}`;
  }

  const imageUrl = form.imageUrl.trim();
  if (imageUrl) {
    if (imageUrl.length > 255) {
      errors.imageUrl = 'imageUrl must be at most 255 characters';
    } else if (!imageUrl.startsWith('/images/') && !/^https?:\/\//i.test(imageUrl)) {
      errors.imageUrl = 'imageUrl must be a relative /images/... path or an http(s) URL';
    }
  }

  return errors;
};

export const AdminProductsPage = () => {
  const { showSuccess, showError } = useToast();
  useDocumentTitle('Manage Products');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // Search keeps a local draft so typing stays responsive, then commits after a pause
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  // Newest first by default so a product created here shows up at the top
  const [sortValue, setSortValue] = useState('id-desc');

  // Create/edit form: `editing` is null (closed), 'new', or the product being edited
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formApiError, setFormApiError] = useState('');
  const [saving, setSaving] = useState(false);

  // Image upload (an alternative to pasting a URL; both write to form.imageUrl)
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const formTriggerRef = useRef(null);
  const deleteTriggerRef = useRef(null);
  const firstFieldRef = useRef(null);
  const dismissDeleteBtnRef = useRef(null);
  const savingRef = useRef(false);
  const deletingRef = useRef(false);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    deletingRef.current = deleting;
  }, [deleting]);

  useEffect(() => {
    if (searchDraft === search) return undefined;
    const timer = setTimeout(() => {
      setSearch(searchDraft);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft, search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const [sort, order] = sortValue.split('-');
    try {
      const params = { page, limit: PAGE_SIZE, sort, order };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;

      const response = await api.get('/products', { params });
      if (response.data.success) {
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || { page, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortValue, showError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetUploadState = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const closeForm = useCallback(() => {
    if (savingRef.current) return;
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormApiError('');
    resetUploadState();
  }, [resetUploadState]);

  const handleOpenCreate = (e) => {
    formTriggerRef.current = e.currentTarget;
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormApiError('');
    resetUploadState();
    setEditing('new');
  };

  const handleOpenEdit = (e, product) => {
    formTriggerRef.current = e.currentTarget;
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price === null || product.price === undefined ? '' : String(product.price),
      stock: product.stock === null || product.stock === undefined ? '' : String(product.stock),
      category: product.category || '',
      imageUrl: product.imageUrl || '',
    });
    setFormErrors({});
    setFormApiError('');
    resetUploadState();
    setEditing(product);
  };

  // Dialog behaviour: focus the first field, close on Escape, lock page scroll, restore focus
  useEffect(() => {
    if (!editing) return undefined;
    const trigger = formTriggerRef.current;
    firstFieldRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !savingRef.current) closeForm();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [editing, closeForm]);

  useEffect(() => {
    if (!productToDelete) return undefined;
    const trigger = deleteTriggerRef.current;
    dismissDeleteBtnRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !deletingRef.current) setProductToDelete(null);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [productToDelete]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormApiError('');

    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: form.stock === '' ? 0 : Number(form.stock),
      category: form.category,
      imageUrl: form.imageUrl.trim(),
    };

    const isNew = editing === 'new';

    setSaving(true);
    try {
      const response = isNew
        ? await api.post('/products', payload)
        : await api.put(`/products/${editing.id}`, payload);

      if (response.data.success) {
        showSuccess(
          isNew
            ? `Product "${response.data.product.name}" created successfully`
            : `Product #${editing.id} updated successfully`
        );
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormErrors({});
        resetUploadState();
        // A new product lands on page 1 under the default newest-first sort
        if (isNew && page !== 1) setPage(1);
        else await fetchProducts();
      }
    } catch (err) {
      const data = err.response?.data;
      const message = Array.isArray(data?.details) && data.details.length > 0
        ? data.details.join(', ')
        : data?.message || 'Failed to save product';
      setFormApiError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check locally first so the obvious rejections don't need a round trip
    if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) {
      const message = `Unsupported image type "${file.type || 'unknown'}". Use JPG, PNG, WebP, or GIF.`;
      setFormErrors((prev) => ({ ...prev, imageUrl: message }));
      resetUploadState();
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      const message = `Image is ${formatBytes(file.size)}. Maximum size is ${formatBytes(MAX_UPLOAD_BYTES)}.`;
      setFormErrors((prev) => ({ ...prev, imageUrl: message }));
      resetUploadState();
      return;
    }

    setFormErrors((prev) => ({ ...prev, imageUrl: '' }));
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // axios strips the default JSON Content-Type for FormData so the
      // browser can set multipart/form-data with its own boundary
      const response = await api.post('/products/upload-image', formData, {
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total));
        },
      });

      if (response.data.success) {
        setForm((prev) => ({ ...prev, imageUrl: response.data.imageUrl }));
        setUploadedFileName(file.name);
        showSuccess(`Image uploaded (${formatBytes(response.data.size)})`);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload image';
      setFormErrors((prev) => ({ ...prev, imageUrl: message }));
      showError(message);
      setUploadedFileName('');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Allows re-picking the same file after a failure
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenDelete = (e, product) => {
    deleteTriggerRef.current = e.currentTarget;
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/products/${productToDelete.id}`);
      showSuccess(`Product #${productToDelete.id} deleted successfully`);
      setProductToDelete(null);
      // Stepping back avoids landing on a page that no longer exists
      if (products.length === 1 && page > 1) setPage((current) => current - 1);
      else await fetchProducts();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchDraft('');
    setSearch('');
    setCategory('');
    setSortValue('id-desc');
    setPage(1);
  };

  const isNew = editing === 'new';
  const previewUrl = form.imageUrl.trim() || '/images/placeholder.svg';

  return (
    <div className="page-container" data-testid="admin-products-page">
      <header className="page-header admin-page-header">
        <div>
          <h1 className="page-title">Manage Products</h1>
          <p className="page-subtitle">
            Admin-only catalog management: create, edit, and delete products
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn btn-primary"
          data-testid="admin-add-product-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </button>
      </header>

      <section className="filter-card" data-testid="admin-filter-bar">
        <div className="filter-row">
          <div className="filter-item search-filter">
            <label htmlFor="admin-search" className="filter-label">Search</label>
            <div className="search-input-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="admin-search"
                type="text"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search products by name or description..."
                className="form-input"
                data-testid="admin-product-search"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="admin-category" className="filter-label">Category</label>
            <select
              id="admin-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="form-select"
              data-testid="admin-category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="admin-sort" className="filter-label">Sort By</label>
            <select
              id="admin-sort"
              value={sortValue}
              onChange={(e) => {
                setSortValue(e.target.value);
                setPage(1);
              }}
              className="form-select"
              data-testid="admin-sort-select"
            >
              <option value="id-desc">Newest First (ID: High to Low)</option>
              <option value="id-asc">Oldest First (ID: Low to High)</option>
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
              data-testid="admin-filter-reset-btn"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="state-container" data-testid="admin-products-loading">
          <div className="spinner"></div>
          <p className="state-text">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="state-container empty-state" data-testid="admin-products-empty">
          <div className="empty-icon-wrapper">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h2 className="empty-title">No products found</h2>
          <p className="empty-desc">Adjust the search or category filter, or create a new product.</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            data-testid="admin-empty-add-btn"
          >
            Add Product
          </button>
        </div>
      ) : (
        <>
          <div className="catalog-meta">
            <span className="results-count" data-testid="admin-results-count" aria-live="polite">
              Showing {products.length} of {pagination.total} products
            </span>
            <span className="page-indicator">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>

          <div className="orders-table-wrapper">
            <div className="table-responsive">
              <table className="app-table admin-products-table" data-testid="admin-products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Stock</th>
                    <th>Last Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const imageUrl = product.imageUrl || '/images/placeholder.svg';

                    return (
                      <tr key={product.id} data-testid={`admin-product-row-${product.id}`}>
                        <td className="font-semibold text-primary">#{product.id}</td>
                        <td>
                          <div className="admin-thumbnail">
                            <ProductImage
                              src={imageUrl}
                              alt={product.name}
                              testId={`admin-product-image-${product.id}`}
                            />
                          </div>
                        </td>
                        <td className="admin-name-cell">
                          <span className="font-semibold" data-testid={`admin-product-name-${product.id}`}>
                            {product.name}
                          </span>
                          {product.description && (
                            <span className="admin-product-desc" title={product.description}>
                              {product.description}
                            </span>
                          )}
                        </td>
                        <td data-testid={`admin-product-category-${product.id}`}>{product.category}</td>
                        <td className="text-right font-semibold" data-testid={`admin-product-price-${product.id}`}>
                          ${Number(product.price).toFixed(2)}
                        </td>
                        <td className="text-right" data-testid={`admin-product-stock-${product.id}`}>
                          <span className={`stock-badge ${product.stock <= 0 ? 'stock-out' : product.stock < 10 ? 'stock-low' : 'stock-ok'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td>{formatDateTime(product.updated_at || product.created_at)}</td>
                        <td className="text-right">
                          <div className="order-actions-cell">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(e, product)}
                              className="btn btn-outline-secondary btn-sm"
                              data-testid={`admin-edit-product-${product.id}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenDelete(e, product)}
                              className="btn btn-outline-danger btn-sm"
                              data-testid={`admin-delete-product-${product.id}`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <nav className="pagination-wrapper" data-testid="admin-pagination" aria-label="Product pages">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="btn btn-outline-secondary pagination-btn"
                data-testid="admin-pagination-prev"
              >
                Previous
              </button>
              <span className="pagination-status" aria-live="polite">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} products)
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page >= pagination.totalPages}
                className="btn btn-outline-secondary pagination-btn"
                data-testid="admin-pagination-next"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      {/* Create / Edit Product Dialog */}
      {editing && (
        <div
          className="modal-backdrop"
          data-testid="admin-product-modal"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div
            className="modal-card modal-card-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-modal-title"
          >
            <div className="modal-header">
              <h3 className="modal-title" id="admin-product-modal-title">
                {isNew ? 'Add New Product' : `Edit Product #${editing.id}`}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={closeForm}
                data-testid="admin-product-modal-close"
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body admin-form-body">
                {formApiError && (
                  <div className="alert alert-danger" data-testid="admin-form-error">
                    <svg className="alert-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{formApiError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="admin-form-name" className="form-label">Product Name *</label>
                  <input
                    id="admin-form-name"
                    ref={firstFieldRef}
                    type="text"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    data-testid="admin-form-name"
                  />
                  {formErrors.name && (
                    <span className="field-error-message" data-testid="admin-form-name-error">
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="admin-form-description" className="form-label">Description</label>
                  <textarea
                    id="admin-form-description"
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="Short product description shown on the catalog card"
                    data-testid="admin-form-description"
                  />
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label htmlFor="admin-form-price" className="form-label">Price ($) *</label>
                    <input
                      id="admin-form-price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setField('price', e.target.value)}
                      className={`form-input ${formErrors.price ? 'input-error' : ''}`}
                      placeholder="0.00"
                      data-testid="admin-form-price"
                    />
                    {formErrors.price && (
                      <span className="field-error-message" data-testid="admin-form-price-error">
                        {formErrors.price}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-form-stock" className="form-label">Stock</label>
                    <input
                      id="admin-form-stock"
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(e) => setField('stock', e.target.value)}
                      className={`form-input ${formErrors.stock ? 'input-error' : ''}`}
                      placeholder="0"
                      data-testid="admin-form-stock"
                    />
                    {formErrors.stock ? (
                      <span className="field-error-message" data-testid="admin-form-stock-error">
                        {formErrors.stock}
                      </span>
                    ) : (
                      <span className="field-hint-text">Defaults to 0 when left empty</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-form-category" className="form-label">Category *</label>
                  <select
                    id="admin-form-category"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    className={`form-select ${formErrors.category ? 'input-error' : ''}`}
                    data-testid="admin-form-category"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <span className="field-error-message" data-testid="admin-form-category-error">
                      {formErrors.category}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <span className="form-label">Product Image</span>
                  <div className="admin-image-field">
                    <div className="admin-image-preview">
                      <ProductImage
                        src={previewUrl}
                        alt="Product image preview"
                        testId="admin-form-image-preview"
                        loading="eager"
                      />
                    </div>

                    <div className="admin-image-input">
                      {/* Two ways to set the same field: upload a file, or paste a URL */}
                      <div className="admin-upload-row">
                        <input
                          ref={fileInputRef}
                          id="admin-form-image-file"
                          type="file"
                          accept={ACCEPTED_UPLOAD_TYPES.join(',')}
                          onChange={handleFileSelected}
                          disabled={uploading || saving}
                          className="sr-only"
                          data-testid="admin-form-image-file"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading || saving}
                          className="btn btn-outline-secondary btn-sm"
                          data-testid="admin-form-image-upload-btn"
                        >
                          {uploading ? (
                            <span className="btn-loading">
                              <span className="spinner-sm"></span> Uploading...
                            </span>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              Upload Image
                            </>
                          )}
                        </button>
                        {form.imageUrl && !uploading && (
                          <button
                            type="button"
                            onClick={() => {
                              setField('imageUrl', '');
                              resetUploadState();
                            }}
                            disabled={saving}
                            className="btn btn-ghost btn-sm"
                            data-testid="admin-form-image-clear-btn"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {uploading && (
                        <div
                          className="admin-upload-progress"
                          data-testid="admin-form-image-upload-progress"
                          role="progressbar"
                          aria-valuenow={uploadProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Image upload progress"
                        >
                          <div className="admin-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}

                      {uploadedFileName && !uploading && (
                        <span className="admin-upload-filename" data-testid="admin-form-image-uploaded-name">
                          Uploaded: {uploadedFileName}
                        </span>
                      )}

                      <label htmlFor="admin-form-image-url" className="admin-url-label">
                        …or paste an image URL
                      </label>
                      <input
                        id="admin-form-image-url"
                        type="text"
                        value={form.imageUrl}
                        onChange={(e) => {
                          setField('imageUrl', e.target.value);
                          setUploadedFileName('');
                        }}
                        className={`form-input ${formErrors.imageUrl ? 'input-error' : ''}`}
                        placeholder="/images/products/p-001.jpg or https://..."
                        data-testid="admin-form-image-url"
                      />
                      {formErrors.imageUrl ? (
                        <span className="field-error-message" data-testid="admin-form-image-url-error">
                          {formErrors.imageUrl}
                        </span>
                      ) : (
                        <span className="field-hint-text">
                          JPG, PNG, WebP, or GIF up to 2 MB — or a <code>/images/...</code> path or http(s) URL.
                          Falls back to the placeholder when empty.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeForm}
                  disabled={saving}
                  data-testid="admin-form-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  data-testid="admin-form-submit"
                >
                  {saving ? (
                    <span className="btn-loading">
                      <span className="spinner-sm"></span> Saving...
                    </span>
                  ) : isNew ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div
          className="modal-backdrop"
          data-testid="admin-delete-modal"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deletingRef.current) setProductToDelete(null);
          }}
        >
          <div
            className="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-delete-modal-title"
            aria-describedby="admin-delete-modal-desc"
          >
            <div className="modal-header">
              <h3 className="modal-title" id="admin-delete-modal-title">Confirm Product Deletion</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !deleting && setProductToDelete(null)}
                data-testid="admin-delete-modal-close"
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body" id="admin-delete-modal-desc">
              <p>
                Are you sure you want to delete{' '}
                <strong>#{productToDelete.id} — {productToDelete.name}</strong>?
              </p>
              <p className="modal-note">
                The product is removed from the catalog immediately. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
                ref={dismissDeleteBtnRef}
                data-testid="admin-delete-cancel-btn"
              >
                Nevermind
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
                data-testid="admin-confirm-delete-btn"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;

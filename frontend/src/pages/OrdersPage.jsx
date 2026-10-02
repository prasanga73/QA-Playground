import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';

export const OrdersPage = () => {
  const { showSuccess, showError } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  // Modal confirm cancel state
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders', { params: { page, limit: 20 } });
      if (response.data.success) {
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  }, [page, showError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);

    // Fetch order details if not cached yet
    if (!orderDetails[orderId]) {
      setLoadingDetails((prev) => ({ ...prev, [orderId]: true }));
      try {
        const response = await api.get(`/orders/${orderId}`);
        if (response.data.success) {
          setOrderDetails((prev) => ({
            ...prev,
            [orderId]: response.data.order,
          }));
        }
      } catch (err) {
        showError(err.response?.data?.message || `Failed to fetch details for order #${orderId}`);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const handleOpenCancelDialog = (e, order) => {
    e.stopPropagation();
    setOrderToCancel(order);
  };

  const handleCloseCancelDialog = () => {
    setOrderToCancel(null);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    setCancelling(true);
    try {
      const response = await api.patch(`/orders/${orderToCancel.id}/cancel`);
      if (response.data.success) {
        showSuccess(`Order #${orderToCancel.id} was successfully cancelled`);
        // Update local order state
        setOrders((prev) =>
          prev.map((o) => (o.id === orderToCancel.id ? { ...o, status: 'cancelled' } : o))
        );
        // Also update cached details if opened
        if (orderDetails[orderToCancel.id]) {
          setOrderDetails((prev) => ({
            ...prev,
            [orderToCancel.id]: {
              ...prev[orderToCancel.id],
              status: 'cancelled',
            },
          }));
        }
        setOrderToCancel(null);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-status-pending';
      case 'confirmed': return 'badge-status-confirmed';
      case 'shipped': return 'badge-status-shipped';
      case 'delivered': return 'badge-status-delivered';
      case 'cancelled': return 'badge-status-cancelled';
      default: return 'badge-status-default';
    }
  };

  const isCancellable = (status) => {
    return status === 'pending' || status === 'confirmed';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="page-container" data-testid="orders-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Order History</h1>
          <p className="page-subtitle">Track, inspect details, and manage your orders</p>
        </div>
      </header>

      {loading ? (
        <div className="state-container" data-testid="orders-loading">
          <div className="spinner"></div>
          <p className="state-text">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="state-container empty-state" data-testid="orders-empty">
          <div className="empty-icon-wrapper">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h2 className="empty-title">No orders placed yet</h2>
          <p className="empty-desc">When you purchase items from the catalog, your orders will appear here.</p>
          <Link to="/products" className="btn btn-primary btn-lg" data-testid="orders-empty-shop-btn">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="orders-table-wrapper">
            <div className="table-responsive">
              <table className="app-table orders-table" data-testid="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date Placed</th>
                  <th>Items Count</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const details = orderDetails[order.id];
                  const isLoadingDet = loadingDetails[order.id];

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`clickable-row ${isExpanded ? 'row-expanded' : ''}`}
                        onClick={() => toggleOrderDetails(order.id)}
                        data-testid={`order-row-${order.id}`}
                      >
                        <td className="font-semibold text-primary" data-testid={`order-id-${order.id}`}>
                          #{order.id}
                        </td>
                        <td data-testid={`order-date-${order.id}`}>
                          {formatDate(order.created_at)}
                        </td>
                        <td data-testid={`order-items-count-${order.id}`}>
                          {order.itemCount ?? details?.items?.length ?? '—'} items
                        </td>
                        <td className="font-semibold" data-testid={`order-total-${order.id}`}>
                          ${Number(order.total).toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(order.status)}`}
                            data-testid={`order-status-${order.id}`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="order-actions-cell">
                            {isCancellable(order.status) && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenCancelDialog(e, order)}
                                className="btn btn-outline-danger btn-sm"
                                data-testid={`cancel-order-${order.id}`}
                              >
                                Cancel Order
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleOrderDetails(order.id)}
                              className="btn btn-ghost btn-sm"
                              data-testid={`expand-order-${order.id}`}
                              aria-label="Expand order details"
                            >
                              {isExpanded ? 'Hide' : 'Details'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Details Row */}
                      {isExpanded && (
                        <tr className="details-expanded-row" data-testid={`order-details-${order.id}`}>
                          <td colSpan="6" className="details-expanded-cell">
                            <div className="inline-order-details">
                              <h3 className="details-heading">
                                Order #{order.id} Breakdown & Line Items
                              </h3>

                              {isLoadingDet ? (
                                <div className="details-loading">
                                  <div className="spinner-sm"></div>
                                  <span>Loading order items...</span>
                                </div>
                              ) : details?.items && details.items.length > 0 ? (
                                <div className="details-table-wrapper">
                                  <table className="details-subtable">
                                    <thead>
                                      <tr>
                                        <th>Product</th>
                                        <th>Unit Price</th>
                                        <th>Quantity</th>
                                        <th>Line Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {details.items.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                          <td className="order-product-cell">
                                            <div className="order-item-media">
                                              <ProductImage
                                                src={item.imageUrl || item.image_url || '/images/placeholder.svg'}
                                                alt={item.product_name}
                                                testId={`order-item-image-${item.id || idx}`}
                                                className="order-thumbnail"
                                              />
                                              <span>{item.product_name}</span>
                                            </div>
                                          </td>
                                          <td>${Number(item.product_price).toFixed(2)}</td>
                                          <td>{item.quantity}</td>
                                          <td className="font-semibold">
                                            ${(item.product_price * item.quantity).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="details-none">No line item records found for this order.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
          {pagination.totalPages > 1 && (
            <div className="pagination-wrapper" data-testid="orders-pagination">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="btn btn-outline-secondary pagination-btn"
                data-testid="orders-pagination-prev"
              >
                Previous
              </button>
              <span aria-live="polite">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page >= pagination.totalPages}
                className="btn btn-outline-secondary pagination-btn"
                data-testid="orders-pagination-next"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog for Cancellation */}
      {orderToCancel && (
        <div className="modal-backdrop" data-testid="confirm-cancel-modal">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Order Cancellation</h3>
              <button
                type="button"
                className="modal-close"
                onClick={handleCloseCancelDialog}
                data-testid="cancel-modal-close-btn"
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to cancel <strong>Order #{orderToCancel.id}</strong> (Total: $
                {Number(orderToCancel.total).toFixed(2)})?
              </p>
              <p className="modal-note">
                Once cancelled, all items will be returned to inventory stock. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCloseCancelDialog}
                disabled={cancelling}
              >
                Nevermind
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                data-testid="confirm-cancel-btn"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

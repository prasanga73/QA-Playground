import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';

export const CartPage = () => {
  const { refreshCart, setCartCount, setCartItems } = useCart();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Pending debounce timers per item
  const updateTimersRef = useRef({});

  // Only show full loading spinner on initial mount before cart is loaded
  const fetchCart = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const response = await api.get('/cart');
      if (response.data.success) {
        setCart(response.data.cart);
        const items = response.data.cart?.items || [];
        setCartItems(items);
        setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load shopping cart');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [showError, setCartItems, setCartCount]);

  useEffect(() => {
    fetchCart(true);
    return () => {
      // Clear all active debounce timers on unmount
      Object.values(updateTimersRef.current).forEach((t) => clearTimeout(t));
      updateTimersRef.current = {};
    };
  }, [fetchCart]);

  // Handle quantity increment/decrement with completely smooth instant optimistic UI update
  const handleUpdateQuantity = (itemId, targetQty, itemName, stock) => {
    if (targetQty <= 0) {
      handleRemoveItem(itemId, itemName);
      return;
    }

    if (stock && targetQty > stock) {
      showError(`Cannot add more. Only ${stock} items available in stock.`);
      return;
    }

    // Immediately update local cart and context (badge) without any text changes or button disables
    setCart((prevCart) => {
      if (!prevCart) return prevCart;
      const updatedItems = (prevCart.items || []).map((item) => {
        if (item.id === itemId) {
          const lineTotal = Math.round(item.price * targetQty * 100) / 100;
          return { ...item, quantity: targetQty, lineTotal };
        }
        return item;
      });
      const newTotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const newCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      setCartCount(newCount);
      setCartItems(updatedItems);

      return {
        ...prevCart,
        items: updatedItems,
        total: Math.round(newTotal * 100) / 100,
        itemCount: updatedItems.length,
      };
    });

    // Debounce the backend sync by 250ms so rapid clicks (+ + +) are butter smooth
    if (updateTimersRef.current[itemId]) {
      clearTimeout(updateTimersRef.current[itemId]);
    }

    updateTimersRef.current[itemId] = setTimeout(async () => {
      delete updateTimersRef.current[itemId];
      try {
        const response = await api.put(`/cart/items/${itemId}`, { quantity: targetQty });
        if (!response.data.success) {
          showError(response.data.message || 'Failed to update quantity');
          fetchCart();
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to update quantity');
        fetchCart();
      }
    }, 250);
  };

  // Handle removing a line item with instant optimistic UI update
  const handleRemoveItem = async (itemId, itemName) => {
    // Clear any pending debounce update for this item
    if (updateTimersRef.current[itemId]) {
      clearTimeout(updateTimersRef.current[itemId]);
      delete updateTimersRef.current[itemId];
    }

    // Optimistically remove item from UI immediately
    setCart((prevCart) => {
      if (!prevCart) return prevCart;
      const updatedItems = (prevCart.items || []).filter((item) => item.id !== itemId);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const newCount = updatedItems.reduce((s, i) => s + i.quantity, 0);

      setCartCount(newCount);
      setCartItems(updatedItems);

      return {
        ...prevCart,
        items: updatedItems,
        total: Math.round(newTotal * 100) / 100,
        itemCount: updatedItems.length,
      };
    });

    try {
      const response = await api.delete(`/cart/items/${itemId}`);
      if (response.data.success) {
        showSuccess(`Removed "${itemName}" from cart`);
      } else {
        showError(response.data.message || 'Failed to remove item');
        fetchCart();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to remove item');
      fetchCart();
    }
  };

  // Flush any pending debounce timers before checkout
  const flushPendingUpdates = async () => {
    const promises = Object.entries(updateTimersRef.current).map(([id, timer]) => {
      clearTimeout(timer);
      delete updateTimersRef.current[id];
      const item = cart?.items?.find((i) => String(i.id) === String(id));
      if (item) {
        return api.put(`/cart/items/${id}`, { quantity: item.quantity }).catch(() => {});
      }
      return Promise.resolve();
    });
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart?.items || cart.items.length === 0) {
      showError('Cannot place an order with an empty cart');
      return;
    }

    setPlacingOrder(true);
    try {
      await flushPendingUpdates();
      const response = await api.post('/orders');
      if (response.data.success) {
        showSuccess('Order placed successfully! Redirecting to orders...');
        await refreshCart();
        navigate('/orders');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  return (
    <div className="page-container" data-testid="cart-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">Review items before placing your order</p>
        </div>
      </header>

      {loading && !cart ? (
        <div className="state-container" data-testid="cart-loading">
          <div className="spinner"></div>
          <p className="state-text">Loading cart items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="state-container empty-state" data-testid="cart-empty">
          <div className="empty-icon-wrapper">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-desc">You haven't added any products to your cart yet.</p>
          <Link
            to="/products"
            className="btn btn-primary btn-lg"
            data-testid="cart-empty-shop-btn"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-main">
            <div className="table-responsive">
              <table className="app-table cart-table" data-testid="cart-table">
                <colgroup>
                  <col className="cart-col-product" style={{ width: '38%' }} />
                  <col className="cart-col-price" style={{ width: '15%' }} />
                  <col className="cart-col-qty" style={{ width: '18%' }} />
                  <col className="cart-col-total" style={{ width: '15%' }} />
                  <col className="cart-col-action" style={{ width: '14%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th className="text-center">Quantity</th>
                    <th>Total</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isAtMaxStock = item.stock && item.quantity >= item.stock;

                    return (
                      <tr key={item.id} data-testid={`cart-item-${item.id}`}>
                        <td className="cart-product-cell">
                          <div className="cart-product-media">
                            <ProductImage
                              src={item.imageUrl || '/images/placeholder.svg'}
                              alt={item.name}
                              testId={`cart-item-image-${item.id}`}
                              className="cart-thumbnail"
                            />
                            <div className="cart-item-info">
                              <span className="cart-item-name" data-testid={`cart-item-name-${item.id}`}>
                                {item.name}
                              </span>
                              <span className="cart-item-category">{item.category}</span>
                              {item.stock && (
                                <span className="cart-item-stock-hint">
                                  {item.stock} in warehouse
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td data-testid={`cart-item-price-${item.id}`}>
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <div className="cart-qty-stepper" data-testid={`cart-qty-stepper-${item.id}`}>
                            <button
                              type="button"
                              className="cart-qty-btn cart-qty-minus"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.name, item.stock)}
                              data-testid={`cart-qty-minus-${item.id}`}
                              aria-label="Decrease quantity"
                              title={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>

                            <span className="cart-qty-badge" data-testid={`cart-item-qty-${item.id}`}>
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              className="cart-qty-btn cart-qty-plus"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.name, item.stock)}
                              disabled={isAtMaxStock}
                              data-testid={`cart-qty-plus-${item.id}`}
                              aria-label="Increase quantity"
                              title={isAtMaxStock ? `Max warehouse stock reached (${item.stock})` : 'Increase quantity'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="font-semibold" data-testid={`cart-item-total-${item.id}`}>
                          ${Number(item.lineTotal).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id, item.name)}
                            className="btn btn-outline-danger btn-sm"
                            data-testid={`cart-remove-btn-${item.id}`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cart-sidebar">
            <div className="summary-card" data-testid="order-summary-card">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-row">
                <span className="summary-label">Items ({items.length})</span>
                <span className="summary-value" data-testid="cart-subtotal">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Shipping</span>
                <span className="summary-value text-success">FREE</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total-row">
                <span className="total-label">Total</span>
                <span className="total-value" data-testid="cart-total">
                  ${total.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder || items.length === 0}
                className="btn btn-primary btn-block btn-lg place-order-btn"
                data-testid="place-order-btn"
              >
                {placingOrder ? (
                  <span className="btn-loading">
                    <span className="spinner-sm"></span> Placing Order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>

              <Link
                to="/products"
                className="btn btn-outline-secondary btn-block mt-3"
                data-testid="continue-shopping-btn"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;

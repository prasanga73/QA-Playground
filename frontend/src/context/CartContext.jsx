import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);

  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      setCartItems([]);
      return;
    }
    try {
      const response = await api.get('/cart');
      if (response.data.success && response.data.cart) {
        const items = response.data.cart.items || [];
        setCartItems(items);
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      }
    } catch {
      // Ignore cart fetch errors on initial load
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const getCartQuantity = useCallback((productId) => {
    const item = cartItems.find((i) => Number(i.productId) === Number(productId));
    return item ? item.quantity : 0;
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cartItems,
        setCartCount,
        setCartItems,
        refreshCart: fetchCartCount,
        getCartQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

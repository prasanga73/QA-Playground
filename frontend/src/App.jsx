import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// 5 shopper pages + an admin-only page + the API reference + 404
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import AdminProductsPage from './pages/AdminProductsPage';
import ApiDocsPage from './pages/ApiDocsPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <div className="app-layout" data-testid="app-root">
                <Navbar />
                <main className="main-content">
                <Routes>
                  {/* Default redirect to products */}
                  <Route path="/" element={<Navigate to="/products" replace />} />

                  {/* 1. /login (public) */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* 2. /products (protected) */}
                  <Route
                    path="/products"
                    element={
                      <ProtectedRoute>
                        <ProductsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 3. /cart (protected) */}
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <CartPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 4. /orders (protected) */}
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrdersPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 5. /profile (protected) */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 6. /admin/products (protected, admin only) */}
                  <Route
                    path="/admin/products"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminProductsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 7. /apis-docs (public: the written API reference needs no session) */}
                  <Route path="/apis-docs" element={<ApiDocsPage />} />

                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
}

export default App;

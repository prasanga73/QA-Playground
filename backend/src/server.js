require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initializeDatabase, getDb } = require('./database');
const { seed } = require('./seed');
const { authenticate, requireAdmin } = require('./middleware/auth');
const { successResponse, errorResponse } = require('./utils/responses');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Strip trailing slash from CORS_ORIGIN in case env var was set with one
const rawOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigin = rawOrigin.replace(/\/+$/, '');

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server) or same origin/localhost/configured origin
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (
      normalizedOrigin === allowedOrigin ||
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('127.0.0.1') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    // For QA testing platform, allow requests matching origin
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Static file serving for images
app.use('/images', express.static(path.resolve(__dirname, '../public/images')));

// Initialize database
initializeDatabase();

// Seed database if empty
const db = getDb();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('📦 Database is empty. Running seed...');
  seed();
}

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  return successResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth routes (supported with /api/auth and /auth alias)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Cart routes
app.use('/api/cart', cartRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Admin: Reset DB
app.post('/api/admin/reset-db', authenticate, requireAdmin, (req, res) => {
  try {
    seed();
    return successResponse(res, { message: 'Database reset to seed data successfully' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to reset database', 'RESET_ERROR');
  }
});

// Swagger (lazy-loaded, set up in phase 5)
try {
  const swaggerSetup = require('./swagger');
  swaggerSetup(app);
} catch (e) {
  // Swagger not configured yet
}

// 404 handler
app.use((req, res) => {
  return errorResponse(res, 404, `Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  return errorResponse(res, 500, 'Internal server error', 'INTERNAL_ERROR');
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 QA Playground API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api-docs (after Phase 5)\n`);
});

module.exports = app;

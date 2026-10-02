const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { errorResponse } = require('../utils/responses');

/**
 * Middleware: Authenticate JWT access token
 * Sets req.user = { id, email, role }
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return errorResponse(res, 401, 'Access token is required', 'MISSING_TOKEN');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return errorResponse(res, 401, 'Invalid authorization header format. Use: Bearer <token>', 'INVALID_TOKEN_FORMAT');
  }

  const token = parts[1];

  // Check if token is blacklisted
  const db = getDb();
  const blacklisted = db.prepare('SELECT id FROM blacklisted_tokens WHERE token = ?').get(token);
  if (blacklisted) {
    return errorResponse(res, 401, 'Token has been revoked', 'TOKEN_REVOKED');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Access token has expired', 'TOKEN_EXPIRED');
    }
    return errorResponse(res, 401, 'Invalid access token', 'INVALID_TOKEN');
  }
}

/**
 * Middleware: Require admin role
 * Must be used after authenticate
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return errorResponse(res, 403, 'Admin access required', 'FORBIDDEN');
  }
  next();
}

/**
 * Middleware: Require owner or admin
 * Checks req.params.id against req.user.id
 */
function requireOwnerOrAdmin(req, res, next) {
  const targetId = parseInt(req.params.id, 10);
  if (req.user.role !== 'admin' && req.user.id !== targetId) {
    return errorResponse(res, 403, 'Access denied. You can only access your own data.', 'FORBIDDEN');
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireOwnerOrAdmin };

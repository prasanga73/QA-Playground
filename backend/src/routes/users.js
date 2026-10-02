const express = require('express');
const { getDb } = require('../database');
const { authenticate, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const { validateEmail, validateRequired } = require('../utils/validators');
const { errorResponse, successResponse } = require('../utils/responses');

const router = express.Router();

/**
 * GET /api/users (admin only)
 */
router.get('/', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id').all();
  return successResponse(res, { users });
});

/**
 * GET /api/users/:id (owner or admin)
 */
router.get('/:id', authenticate, requireOwnerOrAdmin, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
  }

  return successResponse(res, { user });
});

/**
 * PUT /api/users/:id (owner or admin)
 */
router.put('/:id', authenticate, requireOwnerOrAdmin, (req, res) => {
  const db = getDb();
  const userId = parseInt(req.params.id, 10);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!user) {
    return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
  }

  const { name, email } = req.body;

  // At least one field to update
  if (!name && !email) {
    return errorResponse(res, 422, 'At least one field (name or email) is required', 'VALIDATION_ERROR');
  }

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return errorResponse(res, 422, 'Name must be at least 2 characters', 'VALIDATION_ERROR');
    }
  }

  // Validate email if provided
  if (email !== undefined) {
    const emailError = validateEmail(email);
    if (emailError) {
      return errorResponse(res, 422, emailError, 'VALIDATION_ERROR');
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim().toLowerCase(), userId);
    if (existing) {
      return errorResponse(res, 409, 'Email already in use', 'DUPLICATE_EMAIL');
    }
  }

  const updatedName = name ? name.trim() : user.name;
  const updatedEmail = email ? email.trim().toLowerCase() : user.email;

  db.prepare('UPDATE users SET name = ?, email = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(updatedName, updatedEmail, userId);

  const updatedUser = db.prepare('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?').get(userId);

  return successResponse(res, { message: 'User updated successfully', user: updatedUser });
});

/**
 * DELETE /api/users/:id (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const userId = parseInt(req.params.id, 10);
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);

  if (!user) {
    return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
  }

  // Prevent admin from deleting themselves
  if (userId === req.user.id) {
    return errorResponse(res, 400, 'Cannot delete your own account', 'SELF_DELETE');
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);

  return res.status(204).send();
});

module.exports = router;

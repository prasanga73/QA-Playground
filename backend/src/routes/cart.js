const express = require('express');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');
const { validateQuantity } = require('../utils/validators');
const { errorResponse, successResponse } = require('../utils/responses');

const router = express.Router();

/**
 * Get or create cart for user
 */
function getOrCreateCart(db, userId) {
  let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
  if (!cart) {
    const result = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
    cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(result.lastInsertRowid);
  }
  return cart;
}

/**
 * GET /api/cart (current user's cart)
 */
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const cart = getOrCreateCart(db, req.user.id);

  const items = db.prepare(`
    SELECT ci.id, ci.product_id, ci.quantity, ci.created_at,
           p.name, p.price, p.stock, p.category, p.image_url
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = ?
    ORDER BY ci.created_at ASC
  `).all(cart.id);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return successResponse(res, {
    cart: {
      id: cart.id,
      items: items.map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        lineTotal: Math.round(item.price * item.quantity * 100) / 100,
        stock: item.stock,
        category: item.category,
        imageUrl: item.image_url,
      })),
      itemCount: items.length,
      total: Math.round(total * 100) / 100,
    },
  });
});

/**
 * POST /api/cart/items (add item to cart)
 */
router.post('/items', authenticate, (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return errorResponse(res, 422, 'productId is required', 'VALIDATION_ERROR');
  }

  const qty = parseInt(quantity, 10);
  const qtyError = validateQuantity(qty);
  if (qtyError) {
    return errorResponse(res, 422, qtyError, 'VALIDATION_ERROR');
  }

  const db = getDb();

  // Check product exists and has stock
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return errorResponse(res, 404, 'Product not found', 'NOT_FOUND');
  }

  if (product.stock < qty) {
    return errorResponse(res, 400, `Insufficient stock. Available: ${product.stock}`, 'INSUFFICIENT_STOCK');
  }

  const cart = getOrCreateCart(db, req.user.id);

  // Check if item already in cart
  const existingItem = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cart.id, productId);

  if (existingItem) {
    const newQty = existingItem.quantity + qty;
    if (product.stock < newQty) {
      return errorResponse(res, 400, `Insufficient stock. Available: ${product.stock}, in cart: ${existingItem.quantity}`, 'INSUFFICIENT_STOCK');
    }
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existingItem.id);

    return successResponse(res, {
      message: 'Cart item quantity updated',
      item: {
        id: existingItem.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: newQty,
        lineTotal: Math.round(product.price * newQty * 100) / 100,
        imageUrl: product.image_url || '/images/placeholder.svg',
      },
    });
  }

  const result = db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(cart.id, productId, qty);

  return successResponse(res, {
    message: 'Item added to cart',
    item: {
      id: result.lastInsertRowid,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      lineTotal: Math.round(product.price * qty * 100) / 100,
      imageUrl: product.image_url || '/images/placeholder.svg',
    },
  }, 201);
});

/**
 * PUT /api/cart/items/:itemId (update item quantity)
 */
router.put('/items/:itemId', authenticate, (req, res) => {
  const { quantity } = req.body;
  const parsedQty = parseInt(quantity, 10);

  if (isNaN(parsedQty)) {
    return errorResponse(res, 422, 'Quantity must be an integer', 'VALIDATION_ERROR');
  }

  const db = getDb();
  const cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);
  if (!cart) {
    return errorResponse(res, 404, 'Cart not found', 'NOT_FOUND');
  }

  const item = db.prepare(`
    SELECT ci.*, p.name, p.price, p.stock, p.image_url
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.id = ? AND ci.cart_id = ?
  `).get(req.params.itemId, cart.id);

  if (!item) {
    return errorResponse(res, 404, 'Cart item not found', 'NOT_FOUND');
  }

  if (parsedQty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
    return successResponse(res, {
      message: 'Item removed from cart',
      deleted: true,
      itemId: item.id,
    });
  }

  if (item.stock < parsedQty) {
    return errorResponse(res, 400, `Insufficient stock. Available: ${item.stock}`, 'INSUFFICIENT_STOCK');
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(parsedQty, item.id);

  return successResponse(res, {
    message: 'Cart item quantity updated',
    item: {
      id: item.id,
      productId: item.product_id,
      name: item.name,
      price: item.price,
      quantity: parsedQty,
      lineTotal: Math.round(item.price * parsedQty * 100) / 100,
      imageUrl: item.image_url || '/images/placeholder.svg',
    },
  });
});

router.patch('/items/:itemId', authenticate, (req, res) => {
  return router.handle({ ...req, method: 'PUT' }, res);
});

/**
 * DELETE /api/cart/items/:itemId (remove item from cart)
 */
router.delete('/items/:itemId', authenticate, (req, res) => {
  const db = getDb();
  const cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);

  if (!cart) {
    return errorResponse(res, 404, 'Cart not found', 'NOT_FOUND');
  }

  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?').get(req.params.itemId, cart.id);

  if (!item) {
    return errorResponse(res, 404, 'Cart item not found', 'NOT_FOUND');
  }

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.itemId);

  return successResponse(res, { message: 'Item removed from cart' });
});

/**
 * DELETE /api/cart (clear cart)
 */
router.delete('/', authenticate, (req, res) => {
  const db = getDb();
  const cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);

  if (!cart) {
    return errorResponse(res, 404, 'Cart not found', 'NOT_FOUND');
  }

  db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

  return successResponse(res, { message: 'Cart cleared' });
});

module.exports = router;

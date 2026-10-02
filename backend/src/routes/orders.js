const express = require('express');
const { getDb } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { errorResponse, successResponse } = require('../utils/responses');

const router = express.Router();

/**
 * POST /api/orders (create order from cart)
 */
router.post('/', authenticate, (req, res) => {
  const db = getDb();
  const cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);

  if (!cart) {
    return errorResponse(res, 400, 'Cart is empty', 'EMPTY_CART');
  }

  const cartItems = db.prepare(`
    SELECT ci.*, p.name as product_name, p.price as product_price, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = ?
  `).all(cart.id);

  if (cartItems.length === 0) {
    return errorResponse(res, 400, 'Cart is empty', 'EMPTY_CART');
  }

  // Check stock for all items
  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      return errorResponse(res, 400, `Insufficient stock for "${item.product_name}". Available: ${item.stock}`, 'INSUFFICIENT_STOCK');
    }
  }

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  // Use a transaction
  const createOrder = db.transaction(() => {
    // Create order
    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)'
    ).run(req.user.id, Math.round(total * 100) / 100, 'pending');

    const orderId = orderResult.lastInsertRowid;

    // Create order items and update stock
    const insertOrderItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES (?, ?, ?, ?, ?)'
    );
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      insertOrderItem.run(orderId, item.product_id, item.product_name, item.product_price, item.quantity);
      updateStock.run(item.quantity, item.product_id);
    }

    // Clear cart
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

    return orderId;
  });

  const getOrderItems = (orderId) => {
    const items = db.prepare(`
      SELECT oi.*, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);
    return items.map(item => ({
      ...item,
      imageUrl: item.image_url || '/images/placeholder.svg',
    }));
  };

  const orderId = createOrder();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = getOrderItems(orderId);

  return successResponse(res, {
    message: 'Order placed successfully',
    order: {
      ...order,
      items: orderItems,
    },
  }, 201);
});

/**
 * GET /api/orders (own orders; admin sees all)
 */
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let total;
  let orders;
  if (req.user.role === 'admin') {
    total = db.prepare('SELECT COUNT(*) as total FROM orders').get().total;
    orders = db.prepare(`
      SELECT o.*, COUNT(oi.id) as itemCount
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ? OFFSET ?
    `).all(limitNum, offset);
  } else {
    total = db.prepare('SELECT COUNT(*) as total FROM orders WHERE user_id = ?').get(req.user.id).total;
    orders = db.prepare(`
      SELECT o.*, COUNT(oi.id) as itemCount
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, limitNum, offset);
  }

  return successResponse(res, {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) {
    return errorResponse(res, 404, 'Order not found', 'NOT_FOUND');
  }

  // Only owner or admin can see the order
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return errorResponse(res, 403, 'Access denied', 'FORBIDDEN');
  }

  const items = db.prepare(`
    SELECT oi.*, p.image_url
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(order.id).map(item => ({
    ...item,
    imageUrl: item.image_url || '/images/placeholder.svg',
  }));

  return successResponse(res, {
    order: {
      ...order,
      items,
    },
  });
});

/**
 * PATCH /api/orders/:id/cancel
 */
router.patch('/:id/cancel', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) {
    return errorResponse(res, 404, 'Order not found', 'NOT_FOUND');
  }

  // Only owner or admin can cancel
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return errorResponse(res, 403, 'Access denied', 'FORBIDDEN');
  }

  // Can only cancel pending or confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    return errorResponse(res, 400, `Cannot cancel order with status: ${order.status}`, 'INVALID_STATUS');
  }

  // Restore stock
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

  const cancelOrder = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('cancelled', order.id);

    const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of orderItems) {
      updateStock.run(item.quantity, item.product_id);
    }
  });

  cancelOrder();

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

  return successResponse(res, {
    message: 'Order cancelled successfully',
    order: updatedOrder,
  });
});

module.exports = router;

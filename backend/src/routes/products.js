const express = require('express');
const { getDb } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateRequired, validatePrice, validateStock, validateImageUrl } = require('../utils/validators');
const { errorResponse, successResponse } = require('../utils/responses');

const router = express.Router();

function formatProduct(p) {
  if (!p) return p;
  const imageUrl = p.imageUrl || p.image_url || '/images/placeholder.svg';
  return {
    ...p,
    imageUrl,
    image_url: imageUrl,
  };
}

/**
 * GET /api/products (public; pagination, search, sort, filter by price/category)
 */
router.get('/', (req, res) => {
  const db = getDb();
  const {
    page = 1,
    limit = 12,
    search,
    category,
    minPrice,
    maxPrice,
    sort = 'id',
    order = 'asc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (pageNum - 1) * limitNum;

  let whereClause = 'WHERE 1=1';
  const params = [];

  // Search by name or description
  if (search) {
    whereClause += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Filter by category
  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  // Filter by price range
  if (minPrice) {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) {
      whereClause += ' AND price >= ?';
      params.push(min);
    }
  }
  if (maxPrice) {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) {
      whereClause += ' AND price <= ?';
      params.push(max);
    }
  }

  // Sorting
  const allowedSorts = ['id', 'name', 'price', 'category', 'stock', 'created_at'];
  const sortField = allowedSorts.includes(sort) ? sort : 'id';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  // Count total
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM products ${whereClause}`);
  const { total } = countStmt.get(...params);

  // Get products
  const productsStmt = db.prepare(
    `SELECT * FROM products ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`
  );
  const rawProducts = productsStmt.all(...params, limitNum, offset);
  const products = rawProducts.map(formatProduct);

  return successResponse(res, {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/products/:id (public)
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

  if (!product) {
    return errorResponse(res, 404, 'Product not found', 'NOT_FOUND');
  }

  return successResponse(res, { product: formatProduct(product) });
});

/**
 * POST /api/products (admin)
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, description, price, stock, category, imageUrl } = req.body;

  const requiredErrors = validateRequired(['name', 'price', 'category'], req.body);
  if (requiredErrors.length > 0) {
    return errorResponse(res, 422, 'Validation failed', 'VALIDATION_ERROR', requiredErrors);
  }

  const priceError = validatePrice(price);
  if (priceError) {
    return errorResponse(res, 422, priceError, 'VALIDATION_ERROR');
  }

  const stockError = validateStock(stock);
  if (stockError) {
    return errorResponse(res, 422, stockError, 'VALIDATION_ERROR');
  }

  const validCategories = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'];
  if (!validCategories.includes(category)) {
    return errorResponse(res, 422, `Category must be one of: ${validCategories.join(', ')}`, 'VALIDATION_ERROR');
  }

  if (imageUrl !== undefined && imageUrl !== null && imageUrl !== '') {
    const imgError = validateImageUrl(imageUrl);
    if (imgError) {
      return errorResponse(res, 422, imgError, 'VALIDATION_ERROR');
    }
  }

  const finalImageUrl = (imageUrl && imageUrl.trim()) ? imageUrl.trim() : '/images/placeholder.svg';

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name.trim(), (description || '').trim(), price, stock || 0, category, finalImageUrl);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

  return successResponse(res, { message: 'Product created successfully', product: formatProduct(product) }, 201);
});

/**
 * PUT /api/products/:id (admin)
 */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

  if (!product) {
    return errorResponse(res, 404, 'Product not found', 'NOT_FOUND');
  }

  const { name, description, price, stock, category, imageUrl } = req.body;

  if (price !== undefined) {
    const priceError = validatePrice(price);
    if (priceError) {
      return errorResponse(res, 422, priceError, 'VALIDATION_ERROR');
    }
  }

  if (stock !== undefined) {
    const stockError = validateStock(stock);
    if (stockError) {
      return errorResponse(res, 422, stockError, 'VALIDATION_ERROR');
    }
  }

  if (category !== undefined) {
    const validCategories = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'];
    if (!validCategories.includes(category)) {
      return errorResponse(res, 422, `Category must be one of: ${validCategories.join(', ')}`, 'VALIDATION_ERROR');
    }
  }

  if (imageUrl !== undefined && imageUrl !== null && imageUrl !== '') {
    const imgError = validateImageUrl(imageUrl);
    if (imgError) {
      return errorResponse(res, 422, imgError, 'VALIDATION_ERROR');
    }
  }

  const updatedName = name !== undefined ? name.trim() : product.name;
  const updatedDesc = description !== undefined ? description.trim() : product.description;
  const updatedPrice = price !== undefined ? price : product.price;
  const updatedStock = stock !== undefined ? stock : product.stock;
  const updatedCategory = category !== undefined ? category : product.category;
  const updatedImageUrl = imageUrl !== undefined ? ((imageUrl && imageUrl.trim()) ? imageUrl.trim() : '/images/placeholder.svg') : (product.image_url || '/images/placeholder.svg');

  db.prepare(
    'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(updatedName, updatedDesc, updatedPrice, updatedStock, updatedCategory, updatedImageUrl, req.params.id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

  return successResponse(res, { message: 'Product updated successfully', product: formatProduct(updated) });
});

/**
 * DELETE /api/products/:id (admin)
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);

  if (!product) {
    return errorResponse(res, 404, 'Product not found', 'NOT_FOUND');
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

  return res.status(204).send();
});

module.exports = router;

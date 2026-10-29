const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getDb } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateRequired, validatePrice, validateStock, validateImageUrl } = require('../utils/validators');
const { errorResponse, successResponse } = require('../utils/responses');

const router = express.Router();

// Admin image uploads land here, kept separate from the seeded catalog images.
// Served by the existing /images static mount, so the stored URL is /images/uploads/<file>.
const UPLOAD_DIR = path.resolve(__dirname, '../../public/images/uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

// SVG is deliberately excluded: it can carry script, and these files are served
// from the API origin. Extensions come from this map, never from the client filename.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// A client-supplied Content-Type is not trusted; the bytes have to agree with it.
function sniffImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString('latin1');
    if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = ALLOWED_TYPES[file.mimetype];
      cb(null, `u-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      // Recorded so the handler can explain *why* nothing was saved
      req.rejectedMimeType = file.mimetype;
      return cb(null, false);
    }
    return cb(null, true);
  },
}).single('image');

// Rows carry the image_url column; responses expose it once, as imageUrl.
function formatProduct(p) {
  if (!p) return p;
  const { image_url: column, imageUrl: camel, ...rest } = p;
  return {
    ...rest,
    imageUrl: camel || column || '/images/placeholder.svg',
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
 * POST /api/products/upload-image (admin)
 * Multipart upload, field name "image". Returns the URL to store on a product.
 */
router.post('/upload-image', authenticate, requireAdmin, (req, res) => {
  uploadImage(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 413, 'Image must be at most 2 MB', 'FILE_TOO_LARGE');
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return errorResponse(res, 422, 'Upload exactly one file in the "image" field', 'VALIDATION_ERROR');
      }
      return errorResponse(res, 400, 'Image upload failed', 'UPLOAD_ERROR');
    }

    const allowed = Object.keys(ALLOWED_TYPES).join(', ');

    if (!req.file) {
      if (req.rejectedMimeType) {
        return errorResponse(
          res,
          422,
          `Unsupported image type "${req.rejectedMimeType}". Allowed types: ${allowed}`,
          'VALIDATION_ERROR'
        );
      }
      return errorResponse(res, 422, 'An image file is required in the "image" field', 'VALIDATION_ERROR');
    }

    // The declared type has to match the actual bytes, or the file is discarded
    let actualType = null;
    try {
      const fd = fs.openSync(req.file.path, 'r');
      const header = Buffer.alloc(12);
      fs.readSync(fd, header, 0, 12, 0);
      fs.closeSync(fd);
      actualType = sniffImageType(header);
    } catch (readErr) {
      actualType = null;
    }

    if (actualType !== req.file.mimetype) {
      fs.unlink(req.file.path, () => {});
      return errorResponse(
        res,
        422,
        `File content is not a valid ${req.file.mimetype} image. Allowed types: ${allowed}`,
        'VALIDATION_ERROR'
      );
    }

    return successResponse(
      res,
      {
        message: 'Image uploaded successfully',
        imageUrl: `/images/uploads/${req.file.filename}`,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      201
    );
  });
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

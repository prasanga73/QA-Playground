const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const openapiSpecification = {
  openapi: '3.0.3',
  info: {
    title: 'QA Playground REST API',
    version: '1.0.0',
    description: 'REST API for practicing manual, API, automation, and performance testing.',
  },
  servers: [
    { url: '/', description: 'Current Server' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Admin User' },
          email: { type: 'string', example: 'admin@test.com' },
          role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
          created_at: { type: 'string', example: '2026-10-28 09:15:00' },
          updated_at: { type: 'string', example: '2026-10-28 09:15:00' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Wireless Bluetooth Headphones' },
          description: { type: 'string', example: 'Premium noise-cancelling over-ear headphones' },
          price: { type: 'number', example: 79.99 },
          stock: { type: 'integer', example: 150 },
          category: { type: 'string', example: 'Electronics' },
          image_url: { type: 'string', example: '/images/products/p-001.jpg' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          productId: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Wireless Bluetooth Headphones' },
          price: { type: 'number', example: 79.99 },
          quantity: { type: 'integer', example: 2 },
          lineTotal: { type: 'number', example: 159.98 },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 2 },
          total: { type: 'number', example: 159.98 },
          status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], example: 'pending' },
          created_at: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_name: { type: 'string' },
                product_price: { type: 'number' },
                quantity: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'System', description: 'Health check and database reset' },
    { name: 'Auth', description: 'Registration, login, token refresh, logout' },
    { name: 'Users', description: 'User listing and profile management' },
    { name: 'Products', description: 'Catalog browsing and admin product management' },
    { name: 'Cart', description: 'Per-user shopping cart' },
    { name: 'Orders', description: 'Order placement, history, and cancellation' },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Public liveness probe. No authentication required.',
        tags: ['System'],
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time', example: '2026-10-28T09:15:00.000Z' },
                    uptime: { type: 'number', example: 1284.51 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login and get JWT token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@test.com', description: 'Email or username' },
                  password: { type: 'string', example: 'Admin@123', description: 'Account password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    accessToken: { type: 'string', description: 'JWT Bearer token' },
                    tokenType: { type: 'string', example: 'Bearer' },
                    expiresIn: { type: 'string', example: '15m' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Admin User' },
                        email: { type: 'string', example: 'admin@test.com' },
                        role: { type: 'string', example: 'admin' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
          422: { description: 'Validation failed' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@test.com' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    accessToken: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          409: { description: 'Email already registered' },
          422: { description: 'Validation error' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        summary: 'Exchange a refresh token for a new token pair',
        description: 'Rotates the refresh token: the one supplied is blacklisted and a new pair is returned.',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'New token pair issued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    tokenType: { type: 'string', example: 'Bearer' },
                    expiresIn: { type: 'string', example: '15m' },
                  },
                },
              },
            },
          },
          401: { description: 'Refresh token invalid, expired, revoked, or user no longer exists' },
          422: { description: 'Refresh token is required' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Log out and revoke tokens',
        description: 'Blacklists the access token used for the call, and the refresh token too when one is supplied in the body.',
        security: [{ bearerAuth: [] }],
        tags: ['Auth'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', description: 'Optional. Revoked alongside the access token when given.' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logout successful' },
                  },
                },
              },
            },
          },
          401: { description: 'Missing, invalid, or already revoked token' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get the authenticated user',
        security: [{ bearerAuth: [] }],
        tags: ['Auth'],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'List all users (Admin only)',
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        responses: {
          200: {
            description: 'All users, ordered by ID',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Admin access required' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get a user by ID (owner or admin)',
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'You can only access your own data' },
          404: { description: 'User not found' },
        },
      },
      put: {
        summary: 'Update a user (owner or admin)',
        description: 'At least one of name or email must be supplied. Role cannot be changed through this endpoint.',
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'At least 2 characters', example: 'Jane Tester' },
                  email: { type: 'string', description: 'Stored lowercased; must be unique', example: 'jane@test.com' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User updated successfully' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'You can only access your own data' },
          404: { description: 'User not found' },
          409: { description: 'Email already in use' },
          422: { description: 'No fields supplied, name too short, or invalid email' },
        },
      },
      delete: {
        summary: 'Delete a user (Admin only)',
        description: 'An admin cannot delete their own account.',
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          204: { description: 'Deleted' },
          400: { description: 'Cannot delete your own account' },
          401: { description: 'Unauthorized' },
          403: { description: 'Admin access required' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/products': {
      get: {
        summary: 'List products with pagination, search, sort & filter',
        tags: ['Products'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: 'id' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
        ],
        responses: {
          200: {
            description: 'Paginated product list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a product (Admin only)',
        security: [{ bearerAuth: [] }],
        tags: ['Products'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'price', 'category'],
                properties: {
                  name: { type: 'string', example: 'Wireless Keyboard' },
                  description: { type: 'string', example: 'Ergonomic wireless keyboard' },
                  price: { type: 'number', example: 149.99 },
                  stock: { type: 'integer', example: 45 },
                  category: {
                    type: 'string',
                    enum: ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'],
                    example: 'Electronics',
                  },
                  imageUrl: {
                    type: 'string',
                    description: 'Relative /images/... path or http(s) URL, max 255 chars. Defaults to the placeholder when omitted. Upload a file via POST /api/products/upload-image to obtain one.',
                    example: '/images/products/p-001.jpg',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Product created' },
          401: { description: 'Unauthorized' },
          403: { description: 'Admin access required' },
          422: { description: 'Validation failed' },
        },
      },
    },
    '/api/products/upload-image': {
      post: {
        summary: 'Upload a product image (Admin only)',
        description:
          'Multipart upload. Accepts JPG, PNG, WebP, or GIF up to 2 MB; the declared content type must match the actual file bytes. '
          + 'Returns the URL to send as `imageUrl` when creating or updating a product.',
        security: [{ bearerAuth: [] }],
        tags: ['Products'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary', description: 'Image file (jpg, png, webp, or gif), max 2 MB' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Image uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Image uploaded successfully' },
                    imageUrl: { type: 'string', example: '/images/uploads/u-1764280000000-a1b2c3d4e5f6.png' },
                    filename: { type: 'string', example: 'u-1764280000000-a1b2c3d4e5f6.png' },
                    mimeType: { type: 'string', example: 'image/png' },
                    size: { type: 'integer', example: 48213 },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin access required' },
          413: { description: 'Image exceeds the 2 MB limit' },
          422: { description: 'No file supplied, unsupported type, or content does not match the declared type' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        summary: 'Get product by ID',
        tags: ['Products'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Product details' },
          404: { description: 'Product not found' },
        },
      },
      put: {
        summary: 'Update product (Admin only)',
        security: [{ bearerAuth: [] }],
        tags: ['Products'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'integer' },
                  category: {
                    type: 'string',
                    enum: ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'],
                  },
                  imageUrl: {
                    type: 'string',
                    description: 'Relative /images/... path or http(s) URL, max 255 chars. An empty string resets it to the placeholder.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product updated' },
          401: { description: 'Unauthorized' },
          403: { description: 'Admin access required' },
          404: { description: 'Product not found' },
          422: { description: 'Validation failed' },
        },
      },
      delete: {
        summary: 'Delete product (Admin only)',
        security: [{ bearerAuth: [] }],
        tags: ['Products'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Unauthorized' },
          403: { description: 'Admin access required' },
          404: { description: 'Not found' },
        },
      },
    },
    '/api/cart': {
      get: {
        summary: 'Get current user cart',
        security: [{ bearerAuth: [] }],
        tags: ['Cart'],
        responses: {
          200: {
            description: 'Cart with items and totals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    cart: {
                      type: 'object',
                      properties: {
                        items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
                        itemCount: { type: 'integer' },
                        total: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Clear the cart',
        description: 'Removes every item from the current user\'s cart but keeps the cart itself.',
        security: [{ bearerAuth: [] }],
        tags: ['Cart'],
        responses: {
          200: {
            description: 'Cart cleared',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Cart cleared' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Cart not found' },
        },
      },
    },
    '/api/cart/items': {
      post: {
        summary: 'Add item to cart',
        security: [{ bearerAuth: [] }],
        tags: ['Cart'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'integer', example: 1 },
                  quantity: { type: 'integer', example: 2, default: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Item added to cart' },
          400: { description: 'Insufficient stock' },
          401: { description: 'Unauthorized' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/api/cart/items/{itemId}': {
      put: {
        summary: 'Update cart item quantity',
        security: [{ bearerAuth: [] }],
        tags: ['Cart'],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: {
                    type: 'integer',
                    description: 'A value of 0 or less removes the item from the cart instead of updating it.',
                    example: 3,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Quantity updated, or item removed when quantity <= 0' },
          400: { description: 'Insufficient stock' },
          401: { description: 'Unauthorized' },
          404: { description: 'Cart or cart item not found' },
          422: { description: 'Quantity must be an integer' },
        },
      },
      patch: {
        summary: 'Update cart item quantity (alias of PUT)',
        description: 'Behaves identically to PUT on this path.',
        security: [{ bearerAuth: [] }],
        tags: ['Cart'],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: {
                    type: 'integer',
                    description: 'A value of 0 or less removes the item from the cart instead of updating it.',
                    example: 3,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Quantity updated, or item removed when quantity <= 0' },
          400: { description: 'Insufficient stock' },
          401: { description: 'Unauthorized' },
          404: { description: 'Cart or cart item not found' },
          422: { description: 'Quantity must be an integer' },
        },
      },
      delete: {
        summary: 'Remove item from cart',
        security: [{ bearerAuth: [] }],
        tags: ['Cart'],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Item removed' },
          401: { description: 'Unauthorized' },
          404: { description: 'Item not found' },
        },
      },
    },
    '/api/orders': {
      post: {
        summary: 'Place order from cart',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        responses: {
          201: { description: 'Order placed' },
          400: { description: 'Cart is empty or insufficient stock' },
          401: { description: 'Unauthorized' },
        },
      },
      get: {
        summary: 'Get orders (own for users, all for admin)',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated list of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        summary: 'Get order by ID',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Order details' },
          401: { description: 'Unauthorized' },
          403: { description: 'Access denied' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/api/orders/{id}/cancel': {
      patch: {
        summary: 'Cancel an order (pending/confirmed only)',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Order cancelled' },
          400: { description: 'Cannot cancel with current status' },
          401: { description: 'Unauthorized' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/api/admin/reset-db': {
      post: {
        summary: 'Reset the database to seed data (Admin only)',
        description: 'Re-runs the seed script: restores the 50 catalog products and the seed users, and discards all carts and orders.',
        security: [{ bearerAuth: [] }],
        tags: ['System'],
        responses: {
          200: {
            description: 'Database reset',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Database reset to seed data successfully' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Admin access required' },
          500: { description: 'Failed to reset database' },
        },
      },
    },
  },
};

// Same bolt mark as the frontend favicon, so the docs tab is recognizable
const docsFavicon = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0F766E"/>' +
  '<path d="M17.5 5 8 18h7l-1 9 10-13h-7l.5-9z" fill="#fff"/></svg>'
);

// "Sign in as" reuses the markup and classes of Swagger's own "Servers" picker, so it looks
// native in light and dark mode and keeps a fixed width whatever the auth state.
const docsCss = `
  .swagger-ui .topbar { display: none; }
  html.dark-mode body { background: #1c2022; }

  .swagger-ui .scheme-container .schemes .auth-wrapper { align-items: flex-end; gap: 20px; }
  .swagger-ui .qa-auth .servers > label { margin-right: 0; }
  .swagger-ui .qa-auth select { min-width: 230px; }
  .swagger-ui .qa-auth select:disabled { opacity: 0.6; cursor: wait; }

  /* Hide the static response docs once a live response is shown, to keep results readable */
  .responses-inner .live-responses-table ~ h4,
  .responses-inner .live-responses-table ~ table.responses-table {
    display: none !important;
  }
`;

/**
 * Runs in the browser on /api-docs (inlined via Function#toString).
 * - Applies the app's light/dark theme, passed in as ?theme= by the frontend Docs link.
 * - Adds a "Sign in as" picker beside Swagger's Authorize button that fetches a JWT for a
 *   seeded account, and stays in sync with Swagger's own auth state (Authorize dialog,
 *   persisted auth).
 * Note: swagger-ui-express inlines this with String#replace, so avoid "$" followed by
 * an apostrophe, backtick or ampersand anywhere in this function.
 */
function docsClientScript() {
  const THEME_KEY = 'qa-docs-theme';
  const SCHEME_NAME = 'bearerAuth';
  const PRESETS = {
    admin: { email: 'admin@test.com', password: 'Admin@123' },
    user: { email: 'user@test.com', password: 'User@123' },
  };

  let theme = null;
  try {
    const requested = new URLSearchParams(window.location.search).get('theme');
    if (requested === 'dark' || requested === 'light') {
      theme = requested;
      localStorage.setItem(THEME_KEY, theme);
    } else {
      theme = localStorage.getItem(THEME_KEY);
    }
  } catch (e) {
    // Storage unavailable: fall back to Swagger's OS-preference default
  }

  // Swagger's (hidden) dark-mode toggle applies the OS preference on mount, so this runs again later
  const applyTheme = () => {
    if (theme) document.documentElement.classList.toggle('dark-mode', theme === 'dark');
  };
  applyTheme();

  const decodeJwt = (token) => {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (e) {
      return null;
    }
  };

  const init = (ui) => {
    const group = document.createElement('div');
    group.id = 'qa-quick-auth';
    group.className = 'qa-auth';
    group.innerHTML = `
      <span class="servers-title">Sign in as</span>
      <div class="servers">
        <label for="qa-auth-select">
          <select id="qa-auth-select">
            <option value="">Not signed in</option>
            <option value="admin">Admin (admin@test.com)</option>
            <option value="user">User (user@test.com)</option>
            <option value="custom" disabled hidden>Custom token</option>
          </select>
        </label>
      </div>`;
    const select = group.querySelector('select');

    const currentToken = () => {
      try {
        const auth = ui.authSelectors.authorized().toJS();
        return (auth[SCHEME_NAME] && auth[SCHEME_NAME].value) || null;
      } catch (e) {
        return null;
      }
    };

    // Reflect Swagger's auth state, whichever way it was set
    const render = () => {
      if (select.disabled) return; // sign-in in flight; keep the user's choice showing
      const token = currentToken();
      const claims = token ? decodeJwt(token) || {} : null;
      const preset = claims && Object.keys(PRESETS).find((key) => PRESETS[key].email === claims.email);
      select.value = token ? preset || 'custom' : '';
      const expiresAt = claims && claims.exp ? new Date(claims.exp * 1000) : null;
      select.title = expiresAt
        ? `Token expires at ${expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Fetch a token for a seeded test account';
    };

    select.addEventListener('change', async () => {
      select.classList.remove('invalid');
      const preset = PRESETS[select.value];
      if (!preset) {
        ui.authActions.logoutWithPersistOption([SCHEME_NAME]);
        return;
      }
      select.disabled = true;
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preset),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.accessToken) throw new Error(data.message || `HTTP ${response.status}`);
        ui.authActions.authorizeWithPersistOption({
          [SCHEME_NAME]: { name: SCHEME_NAME, schema: { type: 'http', scheme: 'bearer' }, value: data.accessToken },
        });
      } catch (err) {
        // Swagger's own invalid-field style (red border + shake)
        select.classList.add('invalid');
        console.warn('Quick sign-in failed:', err.message);
      } finally {
        select.disabled = false;
        render();
      }
    });

    // Swagger may re-render its layout; put the picker back whenever it gets detached
    const mount = () => {
      if (group.isConnected) return;
      const authWrapper = document.querySelector('.swagger-ui .scheme-container .auth-wrapper');
      if (authWrapper) authWrapper.prepend(group);
    };
    mount();
    new MutationObserver(mount).observe(document.getElementById('swagger-ui'), { childList: true, subtree: true });

    render();
    ui.getStore().subscribe(render);
  };

  const started = Date.now();
  const waitForUi = setInterval(() => {
    const ready = window.ui && document.querySelector('.swagger-ui .information-container');
    if (ready) {
      clearInterval(waitForUi);
      applyTheme();
      init(window.ui);
    } else if (Date.now() - started > 15000) {
      clearInterval(waitForUi);
    }
  }, 100);
}

function setupSwagger(app) {
  // Export openapi.json
  try {
    const jsonStr = JSON.stringify(openapiSpecification, null, 2);
    const backendPath = path.resolve(__dirname, '../openapi.json');
    const rootPath = path.resolve(__dirname, '../../openapi.json');
    if (!fs.existsSync(backendPath) || fs.readFileSync(backendPath, 'utf8') !== jsonStr) {
      fs.writeFileSync(backendPath, jsonStr);
    }
    if (!fs.existsSync(rootPath) || fs.readFileSync(rootPath, 'utf8') !== jsonStr) {
      fs.writeFileSync(rootPath, jsonStr);
    }
  } catch (err) {
    console.warn('Could not export openapi.json:', err.message);
  }

  app.get('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openapiSpecification);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiSpecification, {
      customSiteTitle: 'QA Playground API Docs',
      customfavIcon: docsFavicon,
      customCss: docsCss,
      // Serialized into an inline <script>; must stay self-contained (no Node scope)
      customJsStr: `(${docsClientScript.toString()})();`,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
      },
    })
  );

  console.log('📖 Swagger UI initialized at /api-docs');
}

module.exports = setupSwagger;

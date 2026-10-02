const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const openapiSpecification = {
  openapi: '3.0.3',
  info: {
    title: 'QA Playground REST API',
    version: '1.0.0',
    description: `REST API designed for practicing manual, API, automation, and performance testing. Includes comprehensive error handling, JWT auth with refresh tokens, role-based access control, cart, products, and order management.

### 🔐 Quick Start & Authentication Guide

To test protected API endpoints, you need a JWT Bearer Token.

#### 1. Default Credentials for Testing
| Role | Email | Password |
|---|---|---|
| **Admin** | \`admin@test.com\` | \`Admin@123\` |
| **User** | \`user@test.com\` | \`User@123\` |

#### 2. How to Obtain & Apply Your JWT Bearer Token
1. **Login**: Expand **Auth** → \`POST /api/auth/login\` below.
2. **Execute**: Click **Try it out**, enter your credentials (e.g. \`admin@test.com\` / \`Admin@123\`), and click **Execute**.
3. **Copy Token**: Copy the \`accessToken\` string from the response JSON.
4. **Authorize**: Click the green **Authorize 🔓** button at the top-right of this page.
5. **Paste & Save**: Paste your token into the **Value** field and click **Authorize**. All subsequent requests will now automatically include your Bearer token!`,
    contact: {
      name: 'QA Playground Team',
      email: 'support@qaplayground.local',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment (Auto/Relative)',
    },
    {
      url: 'http://localhost:3001',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token obtained from /api/auth/login or /api/auth/register',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errorCode: { type: 'string', example: 'VALIDATION_ERROR' },
          details: {
            type: 'array',
            items: { type: 'string' },
            example: ['email is required'],
          },
        },
        required: ['success', 'message', 'errorCode'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Admin User' },
          email: { type: 'string', example: 'admin@test.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'admin' },
          created_at: { type: 'string', example: '2026-10-02 04:08:24' },
          updated_at: { type: 'string', example: '2026-10-02 04:08:24' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Wireless Bluetooth Headphones' },
          description: { type: 'string', example: 'Premium noise-cancelling over-ear headphones' },
          price: { type: 'number', format: 'float', example: 79.99 },
          stock: { type: 'integer', example: 150 },
          category: { type: 'string', example: 'Electronics' },
          imageUrl: { type: 'string', example: '/images/products/p-001.jpg' },
          image_url: { type: 'string', example: '/images/products/p-001.jpg' },
          created_at: { type: 'string', example: '2026-10-02 04:08:24' },
          updated_at: { type: 'string', example: '2026-10-02 04:08:24' },
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
          stock: { type: 'integer', example: 150 },
          category: { type: 'string', example: 'Electronics' },
          imageUrl: { type: 'string', example: '/images/products/p-001.jpg' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' },
          },
          itemCount: { type: 'integer', example: 2 },
          total: { type: 'number', example: 159.98 },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          order_id: { type: 'integer', example: 1 },
          product_id: { type: 'integer', example: 1 },
          product_name: { type: 'string', example: 'Wireless Bluetooth Headphones' },
          product_price: { type: 'number', example: 79.99 },
          quantity: { type: 'integer', example: 2 },
          imageUrl: { type: 'string', example: '/images/products/p-001.jpg' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 2 },
          total: { type: 'number', example: 159.98 },
          status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], example: 'pending' },
          created_at: { type: 'string', example: '2026-10-02 04:09:01' },
          updated_at: { type: 'string', example: '2026-10-02 04:09:01' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' },
          },
        },
      },
    },
  },
  paths: {
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
                  email: { type: 'string', format: 'email', example: 'john@test.com' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Registration successful' },
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    tokenType: { type: 'string', example: 'Bearer' },
                    expiresIn: { type: 'string', example: '15m' },
                  },
                },
              },
            },
          },
          409: {
            description: 'Email already registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          422: {
            description: 'Validation error (bad format or missing fields)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate user and return JWT Bearer token',
        description: 'Login with either email or username (admin@test.com / user@test.com or shorthand admin / user) and password to get a JWT accessToken.',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  email: { type: 'string', example: 'admin@test.com', description: 'User email or username' },
                  username: { type: 'string', example: 'admin', description: 'Alternative to email' },
                  password: { type: 'string', example: 'Admin@123', description: 'Account password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful - returns JWT token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    accessToken: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiJ9.demo_token',
                      description: 'JWT Bearer token for authorization'
                    },
                    token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiJ9.demo_token',
                      description: 'Alias for accessToken'
                    },
                    tokenType: { type: 'string', example: 'Bearer' },
                    expiresIn: { type: 'string', example: '15m' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          422: {
            description: 'Validation failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout and blacklist JWT tokens',
        security: [{ bearerAuth: [] }],
        tags: ['Auth'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
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
          401: {
            description: 'Missing or invalid token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        tags: ['Auth'],
        responses: {
          200: {
            description: 'User profile returned',
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
          401: {
            description: 'Missing or expired token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/products': {
      get: {
        summary: 'List products (Public; pagination, search, sort, filter)',
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
            description: 'Paginated list of products',
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
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 12 },
                        total: { type: 'integer', example: 50 },
                        totalPages: { type: 'integer', example: 5 },
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
        summary: 'Create a new product (Admin only)',
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
                  name: { type: 'string', example: 'Wireless Ergonomic Keyboard' },
                  description: { type: 'string', example: 'Split mechanical ergonomic keyboard.' },
                  price: { type: 'number', example: 149.99 },
                  stock: { type: 'integer', example: 45 },
                  category: { type: 'string', enum: ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'], example: 'Electronics' },
                  imageUrl: { type: 'string', description: 'Relative /images/... path or http(s) URL (optional, defaults to /images/placeholder.svg)', example: '/images/products/p-001.jpg' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Product created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Product created successfully' },
                    product: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin access required' },
          422: { description: 'Validation failed' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        summary: 'Get product by ID (Public)',
        tags: ['Products'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Product details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    product: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          404: { description: 'Product not found' },
        },
      },
      put: {
        summary: 'Update product by ID (Admin only)',
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
                  category: { type: 'string' },
                  imageUrl: { type: 'string', description: 'Relative /images/... path or http(s) URL' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Product updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Product updated successfully' },
                    product: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin access required' },
          404: { description: 'Product not found' },
          422: { description: 'Validation failed' },
        },
      },
      delete: {
        summary: 'Delete product by ID (Admin only)',
        security: [{ bearerAuth: [] }],
        tags: ['Products'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          204: { description: 'Product deleted successfully (no content)' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Admin access required' },
          404: { description: 'Product not found' },
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
            description: 'Cart object with items, line totals, and total amount',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    cart: { $ref: '#/components/schemas/Cart' },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/cart/items': {
      post: {
        summary: 'Add item to current cart',
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
          201: {
            description: 'Item added to cart',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Item added to cart' },
                    item: { $ref: '#/components/schemas/CartItem' },
                  },
                },
              },
            },
          },
          400: { description: 'Insufficient stock' },
          401: { description: 'Missing or invalid token' },
          404: { description: 'Product not found' },
          422: { description: 'Validation failed' },
        },
      },
    },
    '/api/cart/items/{itemId}': {
      delete: {
        summary: 'Remove item from cart by itemId',
        security: [{ bearerAuth: [] }],
        tags: ['Cart'],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Item removed from cart',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Item removed from cart' },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          404: { description: 'Cart or Cart item not found' },
        },
      },
    },
    '/api/orders': {
      post: {
        summary: 'Create order from current user cart',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        responses: {
          201: {
            description: 'Order placed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Order placed successfully' },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          400: { description: 'Cart is empty or insufficient product stock' },
          401: { description: 'Missing or invalid token' },
        },
      },
      get: {
        summary: 'Get orders (Own orders for regular users; all orders for admin)',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        responses: {
          200: {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    orders: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        summary: 'Get order details by order ID (Owner or Admin)',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Order details with line items',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Access denied' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/api/orders/{id}/cancel': {
      patch: {
        summary: 'Cancel an order (Owner or Admin, only pending or confirmed)',
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Order cancelled and stock restored',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Order cancelled successfully' },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          400: { description: 'Cannot cancel order with current status' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Access denied' },
          404: { description: 'Order not found' },
        },
      },
    },
  },
};

function setupSwagger(app) {
  // Save openapi.json to backend and root if not identical
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
    console.warn('Could not export openapi.json to disk:', err.message);
  }

  // Serve openapi.json directly
  app.get('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openapiSpecification);
  });

const customCss = `
    .swagger-ui .topbar { display: none; }
    .qa-auth-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 20px auto 24px auto;
      max-width: 1460px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px rgba(59, 130, 246, 0.2);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .qa-auth-banner h3 {
      margin: 0 0 10px 0;
      color: #38bdf8;
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qa-auth-presets {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .qa-preset-btn {
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #475569;
      padding: 7px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    .qa-preset-btn:hover {
      background: #0284c7;
      color: #ffffff;
      border-color: #38bdf8;
      transform: translateY(-1px);
    }
    .qa-auth-form {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      align-items: flex-end;
    }
    .qa-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 220px;
    }
    .qa-field label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .qa-field input {
      background: #090d16;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 10px 14px;
      color: #f8fafc;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .qa-field input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    .qa-submit-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      height: 42px;
      white-space: nowrap;
    }
    .qa-submit-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .qa-token-box {
      margin-top: 16px;
      background: #090d16;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 14px;
    }
    .qa-token-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.875rem;
    }
    .qa-token-input {
      width: 100%;
      background: #1e293b;
      border: 1px solid #475569;
      color: #38bdf8;
      font-family: monospace;
      font-size: 0.82rem;
      padding: 8px 12px;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .qa-copy-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 5px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      transition: background 0.2s;
    }
    .qa-copy-btn:hover {
      background: #059669;
    }
  `;

  const customJsStr = `
    function injectQuickAuth() {
      var wrapper = document.querySelector("#swagger-ui");
      if (!wrapper || document.getElementById("qa-quick-auth")) return;

      var banner = document.createElement("div");
      banner.id = "qa-quick-auth";
      banner.className = "qa-auth-banner";
      banner.innerHTML = "<div class='qa-inner'>" +
        "<h3>⚡ Quick JWT Authentication & Token Generator</h3>" +
        "<p style='margin: 0 0 14px 0; color: #94a3b8; font-size: 0.9rem;'>" +
          "Generate a JWT Bearer token instantly for testing protected endpoints. Click 1-Click Fill or enter credentials to automatically authorize Swagger UI." +
        "</p>" +
        "<div class='qa-auth-presets'>" +
          "<span style='color:#cbd5e1; font-size:0.875rem; font-weight:600;'>1-Click Quick Fill:</span>" +
          "<button type='button' class='qa-preset-btn' id='qa-btn-admin'>👑 Admin (admin@test.com)</button>" +
          "<button type='button' class='qa-preset-btn' id='qa-btn-user'>👤 User (user@test.com)</button>" +
        "</div>" +
        "<form class='qa-auth-form' id='qa-login-form'>" +
          "<div class='qa-field'>" +
            "<label>Email or Username</label>" +
            "<input type='text' id='qa-input-user' value='admin@test.com' placeholder='admin@test.com' required />" +
          "</div>" +
          "<div class='qa-field'>" +
            "<label>Password</label>" +
            "<input type='password' id='qa-input-pass' value='Admin@123' placeholder='Password' required />" +
          "</div>" +
          "<button type='submit' class='qa-submit-btn' id='qa-btn-submit'>🔑 Generate Token & Authorize</button>" +
        "</form>" +
        "<div id='qa-token-container' class='qa-token-box' style='display:none;'>" +
          "<div class='qa-token-header'>" +
            "<span id='qa-token-status' style='color:#34d399; font-weight:600;'>✅ Token Generated & Swagger UI Authorized!</span>" +
            "<button type='button' class='qa-copy-btn' id='qa-btn-copy'>📋 Copy Token</button>" +
          "</div>" +
          "<input type='text' readonly id='qa-token-val' class='qa-token-input' />" +
        "</div>" +
      "</div>";

      wrapper.insertBefore(banner, wrapper.firstChild);

      function doLogin(emailOrUser, password) {
        var statusEl = document.getElementById("qa-token-status");
        var tokenBox = document.getElementById("qa-token-container");
        var tokenInput = document.getElementById("qa-token-val");
        var submitBtn = document.getElementById("qa-btn-submit");

        submitBtn.textContent = "Authenticating...";
        submitBtn.disabled = true;

        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailOrUser, username: emailOrUser, password: password })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          submitBtn.textContent = "🔑 Generate Token & Authorize";
          submitBtn.disabled = false;

          var token = data.accessToken || data.token || data.jwt;
          if (token) {
            tokenBox.style.display = "block";
            tokenInput.value = token;
            var role = (data.user && data.user.role) ? data.user.role.toUpperCase() : "USER";
            var email = (data.user && data.user.email) ? data.user.email : emailOrUser;
            statusEl.textContent = "✅ Authorized as [" + role + "] " + email + " — Swagger UI is now AUTHORIZED (🔒)";
            statusEl.style.color = "#34d399";

            if (window.ui) {
              try {
                window.ui.authActions.authorize({
                  bearerAuth: {
                    name: "bearerAuth",
                    schema: { type: "http", in: "header", scheme: "bearer", bearerFormat: "JWT" },
                    value: token
                  }
                });
                if (window.ui.preauthorizeApiKey) {
                  window.ui.preauthorizeApiKey("bearerAuth", token);
                }
              } catch (err) {
                console.warn("Swagger authorization error:", err);
              }
            }
          } else {
            tokenBox.style.display = "block";
            statusEl.textContent = "❌ Login failed: " + (data.message || "Invalid credentials");
            statusEl.style.color = "#f87171";
            tokenInput.value = JSON.stringify(data);
          }
        })
        .catch(function(err) {
          submitBtn.textContent = "🔑 Generate Token & Authorize";
          submitBtn.disabled = false;
          tokenBox.style.display = "block";
          statusEl.textContent = "❌ Request failed: " + err.message;
          statusEl.style.color = "#f87171";
        });
      }

      document.getElementById("qa-btn-admin").addEventListener("click", function() {
        document.getElementById("qa-input-user").value = "admin@test.com";
        document.getElementById("qa-input-pass").value = "Admin@123";
        doLogin("admin@test.com", "Admin@123");
      });

      document.getElementById("qa-btn-user").addEventListener("click", function() {
        document.getElementById("qa-input-user").value = "user@test.com";
        document.getElementById("qa-input-pass").value = "User@123";
        doLogin("user@test.com", "User@123");
      });

      document.getElementById("qa-login-form").addEventListener("submit", function(e) {
        e.preventDefault();
        var u = document.getElementById("qa-input-user").value.trim();
        var p = document.getElementById("qa-input-pass").value;
        doLogin(u, p);
      });

      document.getElementById("qa-btn-copy").addEventListener("click", function() {
        var val = document.getElementById("qa-token-val");
        val.select();
        navigator.clipboard.writeText(val.value).then(function() {
          var btn = document.getElementById("qa-btn-copy");
          btn.textContent = "✅ Copied!";
          setTimeout(function() { btn.textContent = "📋 Copy Token"; }, 2000);
        });
      });
    }

    var authPoll = setInterval(function() {
      if (document.querySelector("#swagger-ui") && window.ui) {
        clearInterval(authPoll);
        injectQuickAuth();
      }
    }, 150);
  `;

  // Serve Swagger UI at /api-docs
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpecification, {
      customSiteTitle: "QA Playground API Documentation",
      customCss: customCss,
      customJsStr: customJsStr,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
      },
    })
  );

  console.log('📖 Swagger UI initialized at /api-docs');
}

module.exports = setupSwagger;

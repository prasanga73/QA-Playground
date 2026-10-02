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
  paths: {
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
                  category: { type: 'string', example: 'Electronics' },
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
                  category: { type: 'string' },
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
  },
};

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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .qa-auth-banner h3 { margin: 0 0 10px 0; color: #38bdf8; font-size: 1.25rem; font-weight: 700; }
    .qa-auth-presets { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 16px; }
    .qa-preset-btn {
      background: #1e293b; color: #e2e8f0; border: 1px solid #475569;
      padding: 7px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    .qa-preset-btn:hover { background: #0284c7; color: #fff; border-color: #38bdf8; transform: translateY(-1px); }
    .qa-auth-form { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
    .qa-field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 220px; }
    .qa-field label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .qa-field input {
      background: #090d16; border: 1px solid #475569; border-radius: 6px;
      padding: 10px 14px; color: #f8fafc; font-size: 0.95rem; outline: none; transition: border-color 0.2s;
    }
    .qa-field input:focus { border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
    .qa-submit-btn {
      background: #2563eb; color: white; border: none; padding: 10px 22px; border-radius: 6px;
      font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; height: 42px; white-space: nowrap;
    }
    .qa-submit-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
    .qa-token-box { margin-top: 16px; background: #090d16; border: 1px solid #334155; border-radius: 8px; padding: 14px; }
    .qa-token-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem; }
    .qa-token-input {
      width: 100%; background: #1e293b; border: 1px solid #475569; color: #38bdf8;
      font-family: monospace; font-size: 0.82rem; padding: 8px 12px; border-radius: 4px; box-sizing: border-box;
    }
    .qa-copy-btn {
      background: #10b981; color: white; border: none; padding: 5px 14px; border-radius: 4px;
      cursor: pointer; font-weight: 600; font-size: 0.82rem;
    }
    .qa-copy-btn:hover { background: #059669; }
    /* Response Section Polish: Hide redundant static documentation table when live server response is displayed */
    .responses-inner .live-responses-table ~ h4,
    .responses-inner .live-responses-table ~ table.responses-table {
      display: none !important;
    }
  `;

  const customJsStr = `
    function injectQuickAuth() {
      var wrapper = document.querySelector("#swagger-ui");
      if (!wrapper || document.getElementById("qa-quick-auth")) return;
      var banner = document.createElement("div");
      banner.id = "qa-quick-auth";
      banner.className = "qa-auth-banner";
      banner.innerHTML =
        "<h3>⚡ Quick JWT Authentication</h3>" +
        "<div class='qa-auth-presets'>" +
          "<span style='color:#cbd5e1; font-size:0.875rem; font-weight:600;'>Quick Fill:</span>" +
          "<button type='button' class='qa-preset-btn' id='qa-btn-admin'>👑 Admin (admin@test.com / Admin@123)</button>" +
          "<button type='button' class='qa-preset-btn' id='qa-btn-user'>👤 User (user@test.com / User@123)</button>" +
        "</div>" +
        "<form class='qa-auth-form' id='qa-login-form'>" +
          "<div class='qa-field'><label>Email</label>" +
            "<input type='text' id='qa-input-user' value='admin@test.com' placeholder='admin@test.com' required />" +
          "</div>" +
          "<div class='qa-field'><label>Password</label>" +
            "<input type='password' id='qa-input-pass' value='Admin@123' placeholder='Password' required />" +
          "</div>" +
          "<button type='submit' class='qa-submit-btn' id='qa-btn-submit'>🔑 Get Token & Authorize</button>" +
        "</form>" +
        "<div id='qa-token-container' class='qa-token-box' style='display:none;'>" +
          "<div class='qa-token-header'>" +
            "<span id='qa-token-status' style='color:#34d399; font-weight:600;'></span>" +
            "<button type='button' class='qa-copy-btn' id='qa-btn-copy'>📋 Copy</button>" +
          "</div>" +
          "<input type='text' readonly id='qa-token-val' class='qa-token-input' />" +
        "</div>";
      wrapper.insertBefore(banner, wrapper.firstChild);

      function doLogin(email, password) {
        var statusEl = document.getElementById("qa-token-status");
        var tokenBox = document.getElementById("qa-token-container");
        var tokenInput = document.getElementById("qa-token-val");
        var submitBtn = document.getElementById("qa-btn-submit");
        submitBtn.textContent = "Authenticating...";
        submitBtn.disabled = true;
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password: password })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          submitBtn.textContent = "🔑 Get Token & Authorize";
          submitBtn.disabled = false;
          var token = data.accessToken || data.token;
          if (token) {
            tokenBox.style.display = "block";
            tokenInput.value = token;
            var role = (data.user && data.user.role) ? data.user.role.toUpperCase() : "USER";
            statusEl.textContent = "✅ Authorized as " + role + " — all requests now include Bearer token";
            statusEl.style.color = "#34d399";
            if (window.ui) {
              try {
                window.ui.authActions.authorize({
                  bearerAuth: { name: "bearerAuth", schema: { type: "http", scheme: "bearer" }, value: token }
                });
              } catch(e) {}
            }
          } else {
            tokenBox.style.display = "block";
            statusEl.textContent = "❌ " + (data.message || "Login failed");
            statusEl.style.color = "#f87171";
            tokenInput.value = JSON.stringify(data);
          }
        })
        .catch(function(err) {
          submitBtn.textContent = "🔑 Get Token & Authorize";
          submitBtn.disabled = false;
          tokenBox.style.display = "block";
          statusEl.textContent = "❌ " + err.message;
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
        doLogin(document.getElementById("qa-input-user").value.trim(), document.getElementById("qa-input-pass").value);
      });
      document.getElementById("qa-btn-copy").addEventListener("click", function() {
        var val = document.getElementById("qa-token-val");
        val.select();
        navigator.clipboard.writeText(val.value).then(function() {
          var btn = document.getElementById("qa-btn-copy");
          btn.textContent = "✅ Copied!";
          setTimeout(function() { btn.textContent = "📋 Copy"; }, 2000);
        });
      });
    }
    var authPoll = setInterval(function() {
      if (document.querySelector("#swagger-ui") && window.ui) { clearInterval(authPoll); injectQuickAuth(); }
    }, 150);
  `;

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiSpecification, {
      customSiteTitle: 'QA Playground API Docs',
      customCss: customCss,
      customJsStr: customJsStr,
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

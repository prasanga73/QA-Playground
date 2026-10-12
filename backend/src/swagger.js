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

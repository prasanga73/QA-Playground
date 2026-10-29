/**
 * Reference data for the /apis-docs page, mirroring backend/src/routes/*.
 *
 *   endpoint { id, method, altMethods?, path, title, summary, auth, bodyFormat?,
 *              note?, params[], body[], responses[], errors[] }
 *   param    { name, in?, type, req, desc }
 *   field    { name, type, desc }   // dotted names are nested fields
 */

export const AUTH_LEVELS = {
  public: { label: 'No token', tone: 'public' },
  user: { label: 'Any token', tone: 'user' },
  owner: { label: 'Owner or admin', tone: 'owner' },
  admin: { label: 'Admin only', tone: 'admin' },
};

const CATEGORIES = 'Electronics, Clothing, Books, Home & Kitchen, Sports';
const STATUSES = 'pending, confirmed, shipped, delivered, cancelled';

const USER_FIELDS = (p = 'user') => [
  { name: `${p}.id`, type: 'integer', desc: 'Primary key.' },
  { name: `${p}.name`, type: 'string', desc: 'Display name.' },
  { name: `${p}.email`, type: 'string', desc: 'Unique, lower-cased.' },
  { name: `${p}.role`, type: '"user" | "admin"', desc: 'Role used for authorization.' },
  { name: `${p}.created_at`, type: 'string', desc: 'UTC "YYYY-MM-DD HH:MM:SS".' },
  { name: `${p}.updated_at`, type: 'string', desc: 'UTC "YYYY-MM-DD HH:MM:SS".' },
];

const TOKEN_FIELDS = [
  { name: 'accessToken', type: 'string', desc: 'JWT for the Authorization header.' },
  { name: 'refreshToken', type: 'string', desc: 'Only accepted by /auth/refresh.' },
  { name: 'tokenType', type: 'string', desc: 'Always "Bearer".' },
  { name: 'expiresIn', type: 'string', desc: 'Lifetime as a duration, e.g. "15m".' },
];

const PRODUCT_FIELDS = (p = 'product') => [
  { name: `${p}.id`, type: 'integer', desc: 'Primary key.' },
  { name: `${p}.name`, type: 'string', desc: 'Product title.' },
  { name: `${p}.description`, type: 'string', desc: 'Empty string when none was given.' },
  { name: `${p}.price`, type: 'number', desc: 'Unit price, always > 0.' },
  { name: `${p}.stock`, type: 'integer', desc: 'Units available.' },
  { name: `${p}.category`, type: 'string', desc: `One of: ${CATEGORIES}.` },
  { name: `${p}.image_url`, type: 'string', desc: 'Stored column.' },
  { name: `${p}.imageUrl`, type: 'string', desc: 'Same value, placeholder when null.' },
  { name: `${p}.created_at`, type: 'string', desc: 'UTC timestamp.' },
  { name: `${p}.updated_at`, type: 'string', desc: 'UTC timestamp.' },
];

const PAGINATION_FIELDS = (def) => [
  { name: 'pagination.page', type: 'integer', desc: 'Page served after clamping.' },
  { name: 'pagination.limit', type: 'integer', desc: `Page size used (default ${def}, max 100).` },
  { name: 'pagination.total', type: 'integer', desc: 'Total matching rows.' },
  { name: 'pagination.totalPages', type: 'integer', desc: 'ceil(total / limit).' },
];

const CART_ITEM_FIELDS = (p) => [
  { name: `${p}.id`, type: 'integer', desc: 'Cart-item id — the :itemId for update/delete.' },
  { name: `${p}.productId`, type: 'integer', desc: 'Product on this line.' },
  { name: `${p}.name`, type: 'string', desc: 'Product name.' },
  { name: `${p}.price`, type: 'number', desc: 'Current unit price.' },
  { name: `${p}.quantity`, type: 'integer', desc: 'Units on the line.' },
  { name: `${p}.lineTotal`, type: 'number', desc: 'price × quantity, 2 decimals.' },
  { name: `${p}.imageUrl`, type: 'string', desc: 'Product image or placeholder.' },
];

const ORDER_FIELDS = (p = 'order') => [
  { name: `${p}.id`, type: 'integer', desc: 'Order id.' },
  { name: `${p}.user_id`, type: 'integer', desc: 'Owner of the order.' },
  { name: `${p}.total`, type: 'number', desc: 'Frozen at checkout, 2 decimals.' },
  { name: `${p}.status`, type: 'string', desc: `One of: ${STATUSES}.` },
  { name: `${p}.created_at`, type: 'string', desc: 'UTC timestamp.' },
  { name: `${p}.updated_at`, type: 'string', desc: 'UTC timestamp.' },
];

const ORDER_ITEM_FIELDS = [
  { name: 'order.items[].id', type: 'integer', desc: 'Line id.' },
  { name: 'order.items[].order_id', type: 'integer', desc: 'Parent order.' },
  { name: 'order.items[].product_id', type: 'integer', desc: 'Product the line came from.' },
  { name: 'order.items[].product_name', type: 'string', desc: 'Name captured at purchase time.' },
  { name: 'order.items[].product_price', type: 'number', desc: 'Price captured at purchase time.' },
  { name: 'order.items[].quantity', type: 'integer', desc: 'Units ordered.' },
  { name: 'order.items[].image_url', type: 'string | null', desc: 'Null if the product is gone.' },
  { name: 'order.items[].imageUrl', type: 'string', desc: 'image_url or the placeholder.' },
];

export const API_GROUPS = [
  {
    id: 'system',
    name: 'System',
    endpoints: [
      {
        id: 'system-health',
        method: 'GET',
        path: '/api/health',
        title: 'Health check',
        summary: 'Liveness probe; touches no database.',
        auth: 'public',
        params: [],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "status": "ok",
  "timestamp": "2026-10-29T12:40:08.512Z",
  "uptime": 3821.44
}`,
            fields: [
              { name: 'status', type: 'string', desc: 'Always "ok".' },
              { name: 'timestamp', type: 'string', desc: 'Server time, ISO-8601.' },
              { name: 'uptime', type: 'number', desc: 'Seconds since process start.' },
            ],
          },
        ],
        errors: [],
      },
      {
        id: 'system-reset',
        method: 'POST',
        path: '/api/admin/reset-db',
        title: 'Reset database',
        summary: 'Wipes every table and reloads seed data; ids restart at 1.',
        auth: 'admin',
        params: [],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "message": "Database reset to seed data successfully"
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Database reset to seed data successfully".' }] },
        ],
        errors: [{ status: 500, code: 'RESET_ERROR', when: 'The seed script failed.' }],
      },
      {
        id: 'system-images',
        method: 'GET',
        path: '/images/:file',
        title: 'Static images',
        summary: 'Serves catalog images and admin uploads. Not JSON.',
        auth: 'public',
        params: [{ name: 'file', in: 'path', type: 'string', req: true, desc: 'e.g. placeholder.svg or uploads/u-….jpg.' }],
        body: [],
        responses: [{
            status: 200,
            example: `(binary image data)`,
            fields: [] }],
        errors: [{ status: 404, code: 'ROUTE_NOT_FOUND', when: 'No such file.' }],
      },
    ],
  },
  {
    id: 'auth',
    name: 'Authentication',
    endpoints: [
      {
        id: 'auth-register',
        method: 'POST',
        path: '/api/auth/register',
        title: 'Register',
        summary: 'Creates a user-role account and returns a token pair.',
        auth: 'public',
        params: [],
        body: [
          { name: 'name', type: 'string', req: true, desc: 'At least 2 characters after trimming.' },
          { name: 'email', type: 'string', req: true, desc: 'Valid format, not already registered.' },
          { name: 'password', type: 'string', req: true, desc: 'Min 6 chars with an uppercase, a lowercase, a digit and one of @ $ ! % * ? & #.' },
        ],
        responses: [
          {
            status: 201,
            example: `{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 23,
    "name": "Grace Hopper",
    "email": "grace.hopper@test.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}`,
            fields: [
              { name: 'message', type: 'string', desc: '"Registration successful".' },
              ...USER_FIELDS().slice(0, 4),
              ...TOKEN_FIELDS,
            ],
          },
        ],
        errors: [
          { status: 422, code: 'VALIDATION_ERROR', when: 'A field is missing or fails its rule.' },
          { status: 409, code: 'DUPLICATE_EMAIL', when: 'Email already registered.' },
        ],
      },
      {
        id: 'auth-login',
        method: 'POST',
        path: '/api/auth/login',
        title: 'Login',
        summary: 'Exchanges credentials for a token pair.',
        auth: 'public',
        note: 'Send email or username — one of the two is required. Both accept an email or an account name, case-insensitively.',
        params: [],
        body: [
          { name: 'password', type: 'string', req: true, desc: 'Checked against the stored hash.' },
          { name: 'email', type: 'string', req: false, desc: 'Email or account name.' },
          { name: 'username', type: 'string', req: false, desc: 'Alternative to email.' },
        ],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@test.com",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}`,
            fields: [
              { name: 'message', type: 'string', desc: '"Login successful".' },
              ...USER_FIELDS().slice(0, 4),
              ...TOKEN_FIELDS,
            ],
          },
        ],
        errors: [
          { status: 422, code: 'VALIDATION_ERROR', when: 'Identifier or password missing.' },
          { status: 401, code: 'INVALID_CREDENTIALS', when: 'Unknown account or wrong password.' },
        ],
      },
      {
        id: 'auth-refresh',
        method: 'POST',
        path: '/api/auth/refresh',
        title: 'Refresh tokens',
        summary: 'Issues a new token pair from a refresh token.',
        auth: 'public',
        note: 'Single use: the submitted token is revoked, so store the new one.',
        params: [],
        body: [{ name: 'refreshToken', type: 'string', req: true, desc: 'A refresh JWT, not expired or revoked.' }],
        responses: [{
            status: 200,
            example: `{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}`,
            fields: TOKEN_FIELDS }],
        errors: [
          { status: 422, code: 'VALIDATION_ERROR', when: 'refreshToken missing.' },
          { status: 401, code: 'TOKEN_REVOKED / TOKEN_EXPIRED / INVALID_TOKEN', when: 'Already used, expired, or not a refresh token.' },
          { status: 401, code: 'USER_NOT_FOUND', when: 'The account no longer exists.' },
        ],
      },
      {
        id: 'auth-logout',
        method: 'POST',
        path: '/api/auth/logout',
        title: 'Logout',
        summary: 'Revokes the access token used for the call.',
        auth: 'user',
        params: [],
        body: [{ name: 'refreshToken', type: 'string', req: false, desc: 'Revoked too if sent.' }],
        responses: [{
            status: 200,
            example: `{
  "success": true,
  "message": "Logout successful"
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Logout successful".' }] }],
        errors: [],
      },
      {
        id: 'auth-me',
        method: 'GET',
        path: '/api/auth/me',
        title: 'Current user',
        summary: 'Returns the account behind the token.',
        auth: 'user',
        params: [],
        body: [],
        responses: [{
            status: 200,
            example: `{
  "success": true,
  "user": {
    "id": 2,
    "name": "Test User",
    "email": "user@test.com",
    "role": "user",
    "created_at": "2026-10-20 08:14:02",
    "updated_at": "2026-10-20 08:14:02"
  }
}`,
            fields: USER_FIELDS() }],
        errors: [{ status: 404, code: 'NOT_FOUND', when: 'Account deleted or database reset.' }],
      },
    ],
  },
  {
    id: 'users',
    name: 'Users',
    endpoints: [
      {
        id: 'users-list',
        method: 'GET',
        path: '/api/users',
        title: 'List users',
        summary: 'Every account, ordered by id. Not paginated.',
        auth: 'admin',
        params: [],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@test.com",
      "role": "admin",
      "created_at": "2026-10-20 08:14:02",
      "updated_at": "2026-10-20 08:14:02"
    }
  ]
}`,
            fields: [{ name: 'users', type: 'object[]', desc: 'All accounts.' }, ...USER_FIELDS('users[]')] },
        ],
        errors: [],
      },
      {
        id: 'users-get',
        method: 'GET',
        path: '/api/users/:id',
        title: 'Get user',
        summary: 'One account. A non-admin may only request its own id.',
        auth: 'owner',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'User id.' }],
        body: [],
        responses: [{
            status: 200,
            example: `{
  "success": true,
  "user": {
    "id": 2,
    "name": "Test User",
    "email": "user@test.com",
    "role": "user",
    "created_at": "2026-10-20 08:14:02",
    "updated_at": "2026-10-20 08:14:02"
  }
}`,
            fields: USER_FIELDS() }],
        errors: [{ status: 404, code: 'NOT_FOUND', when: 'No user with that id.' }],
      },
      {
        id: 'users-update',
        method: 'PUT',
        path: '/api/users/:id',
        title: 'Update user',
        summary: 'Updates name and/or email.',
        auth: 'owner',
        note: 'Partial update: send at least one of name or email; the other keeps its value.',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'User id to update.' }],
        body: [
          { name: 'name', type: 'string', req: false, desc: 'Min 2 characters.' },
          { name: 'email', type: 'string', req: false, desc: 'Valid and unique.' },
        ],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "name": "Test User Renamed",
    "email": "test.user@test.com",
    "role": "user",
    "created_at": "2026-10-20 08:14:02",
    "updated_at": "2026-10-29 11:42:17"
  }
}`,
            fields: [{ name: 'message', type: 'string', desc: '"User updated successfully".' }, ...USER_FIELDS()] },
        ],
        errors: [
          { status: 422, code: 'VALIDATION_ERROR', when: 'Neither field sent, or a value fails its rule.' },
          { status: 409, code: 'DUPLICATE_EMAIL', when: 'Another account holds that email.' },
          { status: 404, code: 'NOT_FOUND', when: 'No user with that id.' },
        ],
      },
      {
        id: 'users-delete',
        method: 'DELETE',
        path: '/api/users/:id',
        title: 'Delete user',
        summary: 'Hard-deletes an account, with its cart and orders.',
        auth: 'admin',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'User id to delete.' }],
        body: [],
        responses: [{
            status: 204,
            example: `(empty body)`,
            fields: [] }],
        errors: [
          { status: 400, code: 'SELF_DELETE', when: 'The id is the calling admin\'s own id.' },
          { status: 404, code: 'NOT_FOUND', when: 'No user with that id.' },
        ],
      },
    ],
  },
  {
    id: 'products',
    name: 'Products',
    endpoints: [
      {
        id: 'products-list',
        method: 'GET',
        path: '/api/products',
        title: 'List products',
        summary: 'Paginated catalog with search, filters and sorting.',
        auth: 'public',
        params: [
          { name: 'page', in: 'query', type: 'integer', req: false, desc: 'Default 1.' },
          { name: 'limit', in: 'query', type: 'integer', req: false, desc: 'Default 12, max 100.' },
          { name: 'search', in: 'query', type: 'string', req: false, desc: 'Matches name or description.' },
          { name: 'category', in: 'query', type: 'string', req: false, desc: CATEGORIES + '.' },
          { name: 'minPrice', in: 'query', type: 'number', req: false, desc: 'Inclusive lower bound.' },
          { name: 'maxPrice', in: 'query', type: 'number', req: false, desc: 'Inclusive upper bound.' },
          { name: 'sort', in: 'query', type: 'string', req: false, desc: 'id, name, price, category, stock, created_at.' },
          { name: 'order', in: 'query', type: 'string', req: false, desc: 'asc (default) or desc.' },
        ],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Wireless Bluetooth Headphones",
      "description": "Premium noise-cancelling over-ear headphones.",
      "price": 249.99,
      "stock": 42,
      "category": "Electronics",
      "image_url": "/images/products/p-001.svg",
      "imageUrl": "/images/products/p-001.svg",
      "created_at": "2026-10-20 08:14:02",
      "updated_at": "2026-10-20 08:14:02"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}`,
            fields: [
              { name: 'products', type: 'object[]', desc: 'The matching page.' },
              ...PRODUCT_FIELDS('products[]'),
              { name: 'pagination', type: 'object', desc: 'Paging metadata.' },
              ...PAGINATION_FIELDS(12),
            ],
          },
        ],
        errors: [],
      },
      {
        id: 'products-get',
        method: 'GET',
        path: '/api/products/:id',
        title: 'Get product',
        summary: 'One product by id.',
        auth: 'public',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'Product id.' }],
        body: [],
        responses: [{
            status: 200,
            example: `{
  "success": true,
  "product": {
    "id": 1,
    "name": "Wireless Bluetooth Headphones",
    "description": "Premium noise-cancelling over-ear headphones.",
    "price": 249.99,
    "stock": 42,
    "category": "Electronics",
    "image_url": "/images/products/p-001.svg",
    "imageUrl": "/images/products/p-001.svg",
    "created_at": "2026-10-20 08:14:02",
    "updated_at": "2026-10-20 08:14:02"
  }
}`,
            fields: PRODUCT_FIELDS() }],
        errors: [{ status: 404, code: 'NOT_FOUND', when: 'No product with that id.' }],
      },
      {
        id: 'products-create',
        method: 'POST',
        path: '/api/products',
        title: 'Create product',
        summary: 'Adds a catalog entry.',
        auth: 'admin',
        params: [],
        body: [
          { name: 'name', type: 'string', req: true, desc: 'Product title, trimmed.' },
          { name: 'price', type: 'number', req: true, desc: 'JSON number greater than 0.' },
          { name: 'category', type: 'string', req: true, desc: `One of: ${CATEGORIES}.` },
          { name: 'description', type: 'string', req: false, desc: 'Defaults to empty.' },
          { name: 'stock', type: 'integer', req: false, desc: 'Integer ≥ 0, default 0.' },
          { name: 'imageUrl', type: 'string', req: false, desc: '/images/… path or http(s) URL.' },
        ],
        responses: [
          {
            status: 201,
            example: `{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": 51,
    "name": "Mechanical Keyboard",
    "description": "Hot-swappable 75% board.",
    "price": 129.5,
    "stock": 25,
    "category": "Electronics",
    "image_url": "/images/uploads/u-1761730001234-9f2c1a7b45de.jpg",
    "imageUrl": "/images/uploads/u-1761730001234-9f2c1a7b45de.jpg",
    "created_at": "2026-10-29 11:50:04",
    "updated_at": "2026-10-29 11:50:04"
  }
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Product created successfully".' }, ...PRODUCT_FIELDS()] },
        ],
        errors: [{ status: 422, code: 'VALIDATION_ERROR', when: 'A required field is missing or a value fails its rule.' }],
      },
      {
        id: 'products-update',
        method: 'PUT',
        path: '/api/products/:id',
        title: 'Update product',
        summary: 'Partial update; omitted fields keep their value.',
        auth: 'admin',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'Product id to update.' }],
        body: [
          { name: 'name', type: 'string', req: false, desc: 'Must be a string.' },
          { name: 'description', type: 'string', req: false, desc: 'Must be a string.' },
          { name: 'price', type: 'number', req: false, desc: 'Greater than 0.' },
          { name: 'stock', type: 'integer', req: false, desc: 'Integer ≥ 0, absolute.' },
          { name: 'category', type: 'string', req: false, desc: 'One of the five categories.' },
          { name: 'imageUrl', type: 'string', req: false, desc: 'Path, URL, or "" to reset.' },
        ],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "id": 51,
    "name": "Mechanical Keyboard",
    "description": "Hot-swappable 75% board.",
    "price": 119.99,
    "stock": 40,
    "category": "Electronics",
    "image_url": "/images/uploads/u-1761730001234-9f2c1a7b45de.jpg",
    "imageUrl": "/images/uploads/u-1761730001234-9f2c1a7b45de.jpg",
    "created_at": "2026-10-29 11:50:04",
    "updated_at": "2026-10-29 12:03:51"
  }
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Product updated successfully".' }, ...PRODUCT_FIELDS()] },
        ],
        errors: [
          { status: 404, code: 'NOT_FOUND', when: 'No product with that id.' },
          { status: 422, code: 'VALIDATION_ERROR', when: 'A supplied field fails its rule.' },
        ],
      },
      {
        id: 'products-delete',
        method: 'DELETE',
        path: '/api/products/:id',
        title: 'Delete product',
        summary: 'Removes a catalog entry.',
        auth: 'admin',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'Product id to delete.' }],
        body: [],
        responses: [{
            status: 204,
            example: `(empty body)`,
            fields: [] }],
        errors: [
          { status: 404, code: 'NOT_FOUND', when: 'No product with that id.' },
          { status: 500, code: 'INTERNAL_ERROR', when: 'The product appears in an existing order.' },
        ],
      },
      {
        id: 'products-upload-image',
        method: 'POST',
        path: '/api/products/upload-image',
        title: 'Upload product image',
        summary: 'Stores an image and returns the URL for a product\'s imageUrl.',
        auth: 'admin',
        bodyFormat: 'multipart/form-data',
        note: 'One file in a field named "image". Its bytes must match the declared type.',
        params: [],
        body: [
          { name: 'image', type: 'file', req: true, desc: 'Max 2 MB; image/jpeg, image/png, image/webp or image/gif (no SVG).' },
        ],
        responses: [
          {
            status: 201,
            example: `{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "/images/uploads/u-1761730001234-9f2c1a7b45de.jpg",
  "filename": "u-1761730001234-9f2c1a7b45de.jpg",
  "mimeType": "image/jpeg",
  "size": 184213
}`,
            fields: [
              { name: 'message', type: 'string', desc: '"Image uploaded successfully".' },
              { name: 'imageUrl', type: 'string', desc: 'URL to store on a product.' },
              { name: 'filename', type: 'string', desc: 'Generated file name.' },
              { name: 'mimeType', type: 'string', desc: 'Verified MIME type.' },
              { name: 'size', type: 'integer', desc: 'Stored size in bytes.' },
            ],
          },
        ],
        errors: [
          { status: 413, code: 'FILE_TOO_LARGE', when: 'File over 2 MB.' },
          { status: 422, code: 'VALIDATION_ERROR', when: 'No file, wrong field, unsupported type, or content mismatch.' },
          { status: 400, code: 'UPLOAD_ERROR', when: 'The multipart body could not be parsed.' },
        ],
      },
    ],
  },
  {
    id: 'cart',
    name: 'Cart',
    endpoints: [
      {
        id: 'cart-get',
        method: 'GET',
        path: '/api/cart',
        title: 'Get cart',
        summary: 'The caller\'s cart, created on first call.',
        auth: 'user',
        params: [],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "cart": {
    "id": 3,
    "items": [
      {
        "id": 12,
        "productId": 1,
        "name": "Wireless Bluetooth Headphones",
        "price": 249.99,
        "quantity": 2,
        "lineTotal": 499.98,
        "stock": 42,
        "category": "Electronics",
        "imageUrl": "/images/products/p-001.svg"
      }
    ],
    "itemCount": 1,
    "total": 499.98
  }
}`,
            fields: [
              { name: 'cart.id', type: 'integer', desc: 'Cart id.' },
              { name: 'cart.items', type: 'object[]', desc: 'One entry per distinct product.' },
              ...CART_ITEM_FIELDS('cart.items[]'),
              { name: 'cart.items[].stock', type: 'integer', desc: 'Current stock of the product.' },
              { name: 'cart.items[].category', type: 'string', desc: 'Product category.' },
              { name: 'cart.itemCount', type: 'integer', desc: 'Number of lines, not units.' },
              { name: 'cart.total', type: 'number', desc: 'Sum of lineTotals, 2 decimals.' },
            ],
          },
        ],
        errors: [],
      },
      {
        id: 'cart-add-item',
        method: 'POST',
        path: '/api/cart/items',
        title: 'Add cart item',
        summary: 'Adds a product, or increases the quantity if already on a line.',
        auth: 'user',
        note: 'quantity is relative. 201 means a new line, 200 means an existing line was incremented.',
        params: [],
        body: [
          { name: 'productId', type: 'integer', req: true, desc: 'Must reference an existing product.' },
          { name: 'quantity', type: 'integer', req: false, desc: 'Default 1, minimum 1.' },
        ],
        responses: [
          {
            status: 201,
            example: `{
  "success": true,
  "message": "Item added to cart",
  "item": {
    "id": 12,
    "productId": 1,
    "name": "Wireless Bluetooth Headphones",
    "price": 249.99,
    "quantity": 2,
    "lineTotal": 499.98,
    "imageUrl": "/images/products/p-001.svg"
  }
}`,
            fields: [
              { name: 'message', type: 'string', desc: '"Item added to cart".' },
              { name: 'item', type: 'object', desc: 'The line (no stock/category here).' },
              ...CART_ITEM_FIELDS('item'),
            ],
          },
          {
            status: 200,
            example: `{
  "success": true,
  "message": "Cart item quantity updated",
  "item": {
    "id": 12,
    "productId": 1,
    "name": "Wireless Bluetooth Headphones",
    "price": 249.99,
    "quantity": 4,
    "lineTotal": 999.96,
    "imageUrl": "/images/products/p-001.svg"
  }
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Cart item quantity updated" — same item shape, combined quantity.' }],
          },
        ],
        errors: [
          { status: 422, code: 'VALIDATION_ERROR', when: 'productId missing, or quantity not an integer ≥ 1.' },
          { status: 404, code: 'NOT_FOUND', when: 'The product does not exist.' },
          { status: 400, code: 'INSUFFICIENT_STOCK', when: 'Resulting quantity exceeds stock.' },
        ],
      },
      {
        id: 'cart-update-item',
        method: 'PUT',
        altMethods: ['PATCH'],
        path: '/api/cart/items/:itemId',
        title: 'Set cart item quantity',
        summary: 'Sets an absolute quantity. PUT and PATCH behave identically.',
        auth: 'user',
        note: ':itemId is the cart-item id, not the product id. A quantity of 0 or less removes the line.',
        params: [{ name: 'itemId', in: 'path', type: 'integer', req: true, desc: 'Cart-item id from cart.items[].id.' }],
        body: [{ name: 'quantity', type: 'integer', req: true, desc: 'New absolute quantity; must fit in stock.' }],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "message": "Cart item quantity updated",
  "item": {
    "id": 12,
    "productId": 1,
    "name": "Wireless Bluetooth Headphones",
    "price": 249.99,
    "quantity": 3,
    "lineTotal": 749.97,
    "imageUrl": "/images/products/p-001.svg"
  }
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Cart item quantity updated".' }, ...CART_ITEM_FIELDS('item')],
          },
          {
            status: 200,
            example: `{
  "success": true,
  "message": "Item removed from cart",
  "deleted": true,
  "itemId": 12
}`,
            fields: [
              { name: 'message', type: 'string', desc: '"Item removed from cart" (quantity was ≤ 0).' },
              { name: 'deleted', type: 'boolean', desc: 'true — tells the two 200s apart.' },
              { name: 'itemId', type: 'integer', desc: 'The removed cart-item id.' },
            ],
          },
        ],
        errors: [
          { status: 422, code: 'VALIDATION_ERROR', when: 'quantity missing or not a number.' },
          { status: 404, code: 'NOT_FOUND', when: 'No cart, or line not in the caller\'s cart.' },
          { status: 400, code: 'INSUFFICIENT_STOCK', when: 'Quantity exceeds stock.' },
        ],
      },
      {
        id: 'cart-delete-item',
        method: 'DELETE',
        path: '/api/cart/items/:itemId',
        title: 'Remove cart item',
        summary: 'Deletes one line. Returns a 200 envelope, not 204.',
        auth: 'user',
        params: [{ name: 'itemId', in: 'path', type: 'integer', req: true, desc: 'Cart-item id to remove.' }],
        body: [],
        responses: [{
            status: 200,
            example: `{
  "success": true,
  "message": "Item removed from cart"
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Item removed from cart".' }] }],
        errors: [{ status: 404, code: 'NOT_FOUND', when: 'No cart, or line not in the caller\'s cart.' }],
      },
      {
        id: 'cart-clear',
        method: 'DELETE',
        path: '/api/cart',
        title: 'Clear cart',
        summary: 'Removes every line, keeping the cart.',
        auth: 'user',
        params: [],
        body: [],
        responses: [{
            status: 200,
            example: `{
  "success": true,
  "message": "Cart cleared"
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Cart cleared".' }] }],
        errors: [{ status: 404, code: 'NOT_FOUND', when: 'The caller never had a cart created.' }],
      },
    ],
  },
  {
    id: 'orders',
    name: 'Orders',
    endpoints: [
      {
        id: 'orders-create',
        method: 'POST',
        path: '/api/orders',
        title: 'Place order',
        summary: 'Turns the caller\'s cart into a pending order, decrements stock and clears the cart.',
        auth: 'user',
        params: [],
        body: [],
        responses: [
          {
            status: 201,
            example: `{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "id": 7,
    "user_id": 2,
    "total": 499.98,
    "status": "pending",
    "created_at": "2026-10-29 12:20:11",
    "updated_at": "2026-10-29 12:20:11",
    "items": [
      {
        "id": 9,
        "order_id": 7,
        "product_id": 1,
        "product_name": "Wireless Bluetooth Headphones",
        "product_price": 249.99,
        "quantity": 2,
        "image_url": "/images/products/p-001.svg",
        "imageUrl": "/images/products/p-001.svg"
      }
    ]
  }
}`,
            fields: [
              { name: 'message', type: 'string', desc: '"Order placed successfully".' },
              ...ORDER_FIELDS(),
              { name: 'order.items', type: 'object[]', desc: 'The order lines.' },
              ...ORDER_ITEM_FIELDS,
            ],
          },
        ],
        errors: [
          { status: 400, code: 'EMPTY_CART', when: 'The cart has no lines.' },
          { status: 400, code: 'INSUFFICIENT_STOCK', when: 'Stock dropped below a line\'s quantity.' },
        ],
      },
      {
        id: 'orders-list',
        method: 'GET',
        path: '/api/orders',
        title: 'List orders',
        summary: 'Paginated history, newest first. Own orders, or all for an admin.',
        auth: 'user',
        params: [
          { name: 'page', in: 'query', type: 'integer', req: false, desc: 'Default 1.' },
          { name: 'limit', in: 'query', type: 'integer', req: false, desc: 'Default 20, max 100.' },
        ],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "orders": [
    {
      "id": 7,
      "user_id": 2,
      "total": 499.98,
      "status": "pending",
      "created_at": "2026-10-29 12:20:11",
      "updated_at": "2026-10-29 12:20:11",
      "itemCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}`,
            fields: [
              { name: 'orders', type: 'object[]', desc: 'Orders in scope; line items not included.' },
              ...ORDER_FIELDS('orders[]'),
              { name: 'orders[].itemCount', type: 'integer', desc: 'Number of lines on the order.' },
              { name: 'pagination', type: 'object', desc: 'Paging metadata.' },
              ...PAGINATION_FIELDS(20),
            ],
          },
        ],
        errors: [],
      },
      {
        id: 'orders-get',
        method: 'GET',
        path: '/api/orders/:id',
        title: 'Get order',
        summary: 'One order including its line items.',
        auth: 'owner',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'Order id.' }],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "order": {
    "id": 7,
    "user_id": 2,
    "total": 499.98,
    "status": "pending",
    "created_at": "2026-10-29 12:20:11",
    "updated_at": "2026-10-29 12:20:11",
    "items": [
      {
        "id": 9,
        "order_id": 7,
        "product_id": 1,
        "product_name": "Wireless Bluetooth Headphones",
        "product_price": 249.99,
        "quantity": 2,
        "image_url": "/images/products/p-001.svg",
        "imageUrl": "/images/products/p-001.svg"
      }
    ]
  }
}`,
            fields: [...ORDER_FIELDS(), { name: 'order.items', type: 'object[]', desc: 'The order lines.' }, ...ORDER_ITEM_FIELDS] },
        ],
        errors: [{ status: 404, code: 'NOT_FOUND', when: 'No order with that id.' }],
      },
      {
        id: 'orders-cancel',
        method: 'PATCH',
        path: '/api/orders/:id/cancel',
        title: 'Cancel order',
        summary: 'Cancels an order and restores its stock.',
        auth: 'owner',
        params: [{ name: 'id', in: 'path', type: 'integer', req: true, desc: 'Order id to cancel.' }],
        body: [],
        responses: [
          {
            status: 200,
            example: `{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "id": 7,
    "user_id": 2,
    "total": 499.98,
    "status": "cancelled",
    "created_at": "2026-10-29 12:20:11",
    "updated_at": "2026-10-29 12:31:40"
  }
}`,
            fields: [{ name: 'message', type: 'string', desc: '"Order cancelled successfully".' }, ...ORDER_FIELDS()] },
        ],
        errors: [
          { status: 404, code: 'NOT_FOUND', when: 'No order with that id.' },
          { status: 400, code: 'INVALID_STATUS', when: 'Order is not pending or confirmed.' },
        ],
      },
    ],
  },
];

export const ALL_ENDPOINTS = API_GROUPS.flatMap((group) =>
  group.endpoints.map((endpoint) => ({ ...endpoint, groupName: group.name }))
);

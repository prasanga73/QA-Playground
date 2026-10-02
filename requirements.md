# QA Playground: Requirements Specification & Test Cases

## 1. System Overview
**QA Playground** is a dedicated full-stack e-commerce testing platform engineered for practicing manual, API, automation, and performance testing. It features a Node.js/Express SQLite backend REST API and a React (Vite) single-page application built exclusively with plain CSS.

---

## 2. Functional Requirements (FR)

### Authentication & Authorization
- **FR-01 (User Registration):** The system shall allow new users to register via `POST /api/auth/register` requiring a valid name (≥ 2 characters), valid email address, and strong password (≥ 6 characters, containing uppercase, lowercase, number, and special character). Duplicate emails shall be rejected with HTTP 409.
- **FR-02 (User Login):** The system shall authenticate users via `POST /api/auth/login` and issue a JWT access token (15-minute expiry) and a JWT refresh token (7-day expiry).
- **FR-03 (Token Refresh):** The system shall provide `POST /api/auth/refresh` allowing clients to exchange a valid refresh token for a new access token and rotated refresh token.
- **FR-04 (User Logout):** The system shall invalidate both the active access token and refresh token upon calling `POST /api/auth/logout`, storing revoked tokens in a blacklist table.
- **FR-05 (Current Identity):** The system shall return the authenticated user's profile upon calling `GET /api/auth/me`.
- **FR-06 (Role-Based Access Control):** The system shall enforce two user roles (`user`, `admin`). Unauthenticated requests shall return HTTP 401; unauthorized role actions shall return HTTP 403.

### User Management
- **FR-07 (List Users):** Only administrators shall be allowed to retrieve all user accounts via `GET /api/users`.
- **FR-08 (Inspect User):** Users shall only access their own user profile via `GET /api/users/:id`; administrators may access any user profile.
- **FR-09 (Update Profile):** Users may update their name and email via `PUT /api/users/:id` with format and duplicate email validation.
- **FR-10 (Delete User):** Administrators may delete user accounts via `DELETE /api/users/:id`. Deleting one's own admin account shall return HTTP 400.

### Products & Catalog
- **FR-11 (Product Listing):** The system shall publicly expose `GET /api/products` supporting pagination (`page`, `limit`), case-insensitive search (`search`), category filtering (`category`), price range filters (`minPrice`, `maxPrice`), and field sorting (`sort`, `order`).
- **FR-12 (Product Details):** The system shall publicly expose `GET /api/products/:id` returning product details or HTTP 404 if missing.
- **FR-13 (Admin Product Management):** Administrators shall be able to create (`POST /api/products`), update (`PUT /api/products/:id`), and delete (`DELETE /api/products/:id`) products. Validation ensures `price > 0`, `stock >= 0`, and category belongs to the 5 valid categories.

### Cart Management
- **FR-14 (View Cart):** Authenticated users shall retrieve their current active cart items, item counts, line totals, and overall total via `GET /api/cart`.
- **FR-15 (Add to Cart):** Authenticated users shall add items or increment quantity via `POST /api/cart/items`. The system shall reject requests exceeding current warehouse inventory with HTTP 400.
- **FR-16 (Remove Cart Item):** Authenticated users shall remove individual cart items via `DELETE /api/cart/items/:itemId`.

### Orders & Checkout
- **FR-17 (Create Order):** Authenticated users shall convert their active cart items into an order via `POST /api/orders`. The transaction shall verify stock, deduct inventory, record line items, and clear the user's cart.
- **FR-18 (List Orders):** Authenticated users shall list their personal orders via `GET /api/orders`; administrators shall see all orders across all users.
- **FR-19 (Order Details):** Authenticated users shall view detailed order breakdown via `GET /api/orders/:id`.
- **FR-20 (Cancel Order):** Authenticated users may cancel their own orders in `pending` or `confirmed` status via `PATCH /api/orders/:id/cancel`. The cancellation transaction shall restore item stock to product inventory.

### System Utilities
- **FR-21 (Health Check):** The system shall provide `GET /api/health` returning system uptime and timestamp without requiring authentication.
- **FR-22 (Database Seed Reset):** Administrators shall be able to reset the database to clean seed state via `POST /api/admin/reset-db`.

---

## 3. Non-Functional Requirements (NFR)

- **NFR-01 (API Response Times):** 95% of read API requests (`GET /api/products`, `GET /api/cart`) shall respond within 150ms under normal load.
- **NFR-02 (Data Consistency):** Cart checkout and order cancellation operations must execute in atomic SQLite database transactions to prevent inventory race conditions.
- **NFR-03 (Standardized Error Schema):** All API errors shall adhere to `{ success: false, message: string, errorCode: string, details?: any[] }`.
- **NFR-04 (Token Expiration Security):** Access tokens shall strictly expire after 15 minutes; revoked tokens shall not be accepted even before their expiration timestamp.
- **NFR-05 (UI Automation Compatibility):** All interactive frontend elements (inputs, buttons, rows, tabs, badges, toasts, and dialogs) must have unambiguous, permanent `data-testid` attributes.
- **NFR-06 (No External UI Dependencies):** The frontend application must be written purely with React, React Router, Axios, and Vanilla CSS without Tailwind, Bootstrap, or component libraries.
- **NFR-07 (Predictable Seed Baseline):** Seeding must reproducibly populate exactly 2 primary test accounts, 20 additional test users, and 50 products across 5 categories.
- **NFR-08 (Client-Side Token Resilience):** The frontend HTTP client shall automatically intercept 401 Unauthorized errors and attempt a silent token refresh once before clearing credentials.
- **NFR-09 (Responsive Viewports):** The UI shall render cleanly and responsively across desktop (1280px+), tablet (768px), and mobile (375px) viewports.
- **NFR-10 (Documentation & OpenAPI Compliance):** The API must fully specify all schemas and endpoints conforming to OpenAPI 3.0 specification at `/api-docs` and `/openapi.json`.

---

## 4. API Test Cases (30 Test Cases)

| Test ID | Category | Endpoint | Method | Test Description & Preconditions | Payload / Params | Expected Status | Expected Response & Assertions |
|---|---|---|---|---|---|---|---|
| **API-01** | Positive | `/api/health` | GET | System health check responds ok | None | 200 OK | `success: true`, `status: 'ok'` |
| **API-02** | Positive | `/api/auth/register` | POST | Register valid new user | Valid name, email, strong password | 201 Created | `accessToken`, `refreshToken`, `tokenType: 'Bearer'` |
| **API-03** | Negative | `/api/auth/register` | POST | Duplicate email registration rejected | Existing user email (`user@test.com`) | 409 Conflict | `errorCode: 'DUPLICATE_EMAIL'` |
| **API-04** | Negative | `/api/auth/register` | POST | Weak password rejected during registration | `password: '123'` | 422 Unprocessable | `errorCode: 'VALIDATION_ERROR'`, contains message |
| **API-05** | Positive | `/api/auth/login` | POST | Valid user credential login | `{"email":"user@test.com","password":"User@123"}` | 200 OK | `accessToken`, `user.role: 'user'` |
| **API-06** | Positive | `/api/auth/login` | POST | Valid admin credential login | `{"email":"admin@test.com","password":"Admin@123"}` | 200 OK | `accessToken`, `user.role: 'admin'` |
| **API-07** | Negative | `/api/auth/login` | POST | Invalid password rejected | Valid email, incorrect password | 401 Unauthorized | `errorCode: 'INVALID_CREDENTIALS'` |
| **API-08** | Boundary | `/api/auth/login` | POST | Missing email field in login payload | `{"password":"User@123"}` | 422 Unprocessable | `errorCode: 'VALIDATION_ERROR'` |
| **API-09** | Positive | `/api/auth/refresh` | POST | Refresh token exchange returns new tokens | Valid active `refreshToken` | 200 OK | New `accessToken`, rotated `refreshToken` |
| **API-10** | Negative | `/api/auth/refresh` | POST | Expired or bogus refresh token rejected | `{"refreshToken":"invalid-token-string"}` | 401 Unauthorized | `errorCode: 'INVALID_TOKEN'` |
| **API-11** | Positive | `/api/auth/me` | GET | Authenticated user profile retrieval | Header: `Authorization: Bearer <userToken>` | 200 OK | `user.email: 'user@test.com'` |
| **API-12** | Negative | `/api/auth/me` | GET | Missing Authorization header rejected | None | 401 Unauthorized | `errorCode: 'MISSING_TOKEN'` |
| **API-13** | Positive | `/api/auth/logout` | POST | Logout invalidates bearer token | Header: `Authorization: Bearer <token>` | 200 OK | `message: 'Logout successful'` |
| **API-14** | Negative | `/api/auth/me` | GET | Calling /me with blacklisted token fails | Header: `Authorization: Bearer <blacklistedToken>` | 401 Unauthorized | `errorCode: 'TOKEN_REVOKED'` |
| **API-15** | Positive | `/api/users` | GET | Admin retrieves all user records | Header: `Authorization: Bearer <adminToken>` | 200 OK | `users` array with 22+ user objects |
| **API-16** | RBAC | `/api/users` | GET | Regular user forbidden from listing users | Header: `Authorization: Bearer <userToken>` | 403 Forbidden | `errorCode: 'FORBIDDEN'` |
| **API-17** | Positive | `/api/users/:id` | PUT | User updates their own name | `{"name":"Updated User Name"}` | 200 OK | `user.name: 'Updated User Name'` |
| **API-18** | RBAC | `/api/users/:id` | PUT | User forbidden from modifying another user | User ID 2 attempts modifying User ID 1 | 403 Forbidden | `errorCode: 'FORBIDDEN'` |
| **API-19** | Boundary | `/api/users/:id` | DELETE | Admin attempts self-deletion | Admin calls DELETE on their own admin ID | 400 Bad Request | `errorCode: 'SELF_DELETE'` |
| **API-20** | Positive | `/api/products` | GET | Public list products with pagination | `?page=1&limit=5` | 200 OK | `products.length: 5`, `pagination.total: 50` |
| **API-21** | Positive | `/api/products` | GET | Filter products by category and sort | `?category=Electronics&sort=price&order=asc` | 200 OK | Only 'Electronics' products sorted ascending |
| **API-22** | Positive | `/api/products/:id` | GET | Public get product by valid ID | `/api/products/1` | 200 OK | Product details returned |
| **API-23** | Negative | `/api/products/:id` | GET | Non-existent product ID returns 404 | `/api/products/999999` | 404 Not Found | `errorCode: 'NOT_FOUND'` |
| **API-24** | RBAC | `/api/products` | POST | Regular user forbidden from creating product | `{"name":"Item","price":10,"category":"Books"}` | 403 Forbidden | `errorCode: 'FORBIDDEN'` |
| **API-25** | Positive | `/api/cart` | GET | User retrieves empty or active cart | Header: `Authorization: Bearer <userToken>` | 200 OK | `cart.items`, `cart.total` |
| **API-26** | Positive | `/api/cart/items` | POST | Add product with quantity to cart | `{"productId":1,"quantity":2}` | 201 Created | Item added, quantity = 2 |
| **API-27** | Boundary | `/api/cart/items` | POST | Add quantity exceeding stock rejected | `{"productId":1,"quantity":99999}` | 400 Bad Request | `errorCode: 'INSUFFICIENT_STOCK'` |
| **API-28** | Positive | `/api/orders` | POST | Checkout converts active cart to order | Header: `Authorization: Bearer <userToken>` | 201 Created | Order created, status: 'pending', stock deducted |
| **API-29** | Negative | `/api/orders` | POST | Checkout with empty cart rejected | Header: `Authorization: Bearer <userToken>` | 400 Bad Request | `errorCode: 'EMPTY_CART'` |
| **API-30** | Positive | `/api/orders/:id/cancel` | PATCH | Cancel pending order and restore stock | Header: `Authorization: Bearer <userToken>` | 200 OK | `order.status: 'cancelled'`, product stock restored |
| **API-31** | Positive | `/images/products/p-001.svg` | GET | Static image serving endpoint | None | 200 OK | SVG image content delivered with image/svg+xml |
| **API-32** | Positive | `/api/products` | POST | Create product with valid relative imageUrl | Header: Admin Bearer<br>`{"name":"Item","price":10,"category":"Books","imageUrl":"/images/products/p-001.svg"}` | 201 Created | `product.imageUrl: '/images/products/p-001.svg'` |
| **API-33** | Positive | `/api/products` | POST | Create product with valid http(s) URL | Header: Admin Bearer<br>`{"name":"Item","price":10,"category":"Books","imageUrl":"https://example.com/item.png"}` | 201 Created | `product.imageUrl: 'https://example.com/item.png'` |
| **API-34** | Negative | `/api/products` | POST | Create product with invalid imageUrl format | Header: Admin Bearer<br>`{"name":"Item","price":10,"category":"Books","imageUrl":"invalid-path"}` | 422 Unprocessable | `errorCode: 'VALIDATION_ERROR'` |
| **API-35** | Boundary | `/api/products` | POST | Create product without imageUrl defaults to placeholder | Header: Admin Bearer<br>`{"name":"Item","price":10,"category":"Books"}` | 201 Created | `product.imageUrl: '/images/placeholder.svg'` |

---

## 5. UI Test Cases (36 Test Cases)

| Test ID | Page | Type | Test Description & Objective | Steps to Execute | Expected UI Behavior | data-testid Elements Tested |
|---|---|---|---|---|---|---|
| **UI-01** | `/login` | Positive | Successful login with valid credentials | 1. Enter `user@test.com`<br>2. Enter `User@123`<br>3. Click Sign In | Redirects to `/products`, shows success toast, navbar renders | `login-email`, `login-password`, `login-submit`, `toast-success`, `navbar` |
| **UI-02** | `/login` | Validation | Empty credentials inline validation | 1. Leave fields empty<br>2. Click Sign In | Inline error messages displayed below inputs, no API call | `login-email-error`, `login-password-error` |
| **UI-03** | `/login` | Validation | Invalid email format inline validation | 1. Enter `invalid-email`<br>2. Click Sign In | Error: "Invalid email format" below email input | `login-email-error` |
| **UI-04** | `/login` | Negative | Wrong password displays error banner | 1. Enter `user@test.com`<br>2. Enter `WrongPass!`<br>3. Click Sign In | Red error banner displayed with server error message | `login-error` |
| **UI-05** | `/login` | Feature | Toggle password visibility button | 1. Type password<br>2. Click eye toggle | Input type switches between `password` and `text` | `login-password`, `login-password-toggle` |
| **UI-06** | `/login` | Helper | Quick seed credentials button auto-fills | 1. Click "Admin" seed chip | Form inputs populated with `admin@test.com` and `Admin@123` | `fill-admin-creds`, `login-email`, `login-password` |
| **UI-07** | `/login` | Auth | Authenticated user visiting /login redirected | 1. Login<br>2. Navigate to `/login` | Instantly redirects back to `/products` | `login-card`, `products-page` |
| **UI-08** | Route | Security | Unauthenticated access to /products redirected | 1. Clear tokens<br>2. Navigate to `/products` | Instantly redirected to `/login` | `login-card` |
| **UI-09** | `/products` | Positive | Initial catalog render displays products | 1. Log in<br>2. View products page | Grid of 12 product cards displayed with prices, stock, categories | `product-grid`, `product-card-1`, `results-count` |
| **UI-10** | `/products` | Search | Search filter filters products by name | 1. Type "Headphones" in search box | Product grid updates dynamically showing matching items | `search-input`, `product-card-1` |
| **UI-11** | `/products` | Filter | Category dropdown filter | 1. Select "Books" in category select | Only books displayed in grid with category badges | `category-filter`, `product-grid` |
| **UI-12** | `/products` | Filter | Price range filter (min/max) | 1. Set Min: 20, Max: 50 | Only products priced between $20 and $50 displayed | `min-price-filter`, `max-price-filter` |
| **UI-13** | `/products` | Sorting | Sort dropdown (Price: Low to High) | 1. Select "Price (Low to High)" | Products re-ordered with lowest price first | `sort-select` |
| **UI-14** | `/products` | Boundary | Filter produces no results (empty state) | 1. Type non-matching search `xyzxyz123` | Empty state box displayed with "Clear All Filters" button | `products-empty`, `empty-reset-btn` |
| **UI-15** | `/products` | Pagination | Next/Prev pagination navigation | 1. Click "Next →"<br>2. Click page number "3" | Page 2 and 3 load corresponding catalog subsets | `pagination-next`, `pagination-prev`, `pagination-page-3` |
| **UI-16** | `/products` | Positive | Add product to cart with custom quantity | 1. Change quantity input to `2`<br>2. Click "Add to Cart" | Success toast displayed, navbar cart badge increments | `product-qty-1`, `add-to-cart-1`, `toast-success`, `cart-badge` |
| **UI-17** | `/products` | Boundary | Out-of-stock product card disabled | 1. Locate product with stock = 0 | Card button displays "Sold Out" and is disabled | `product-card-1`, `add-to-cart-1` |
| **UI-18** | `/cart` | Positive | Cart displays added items and totals | 1. Navigate to `/cart` | Table lists items, unit prices, line totals, and order summary | `cart-table`, `cart-subtotal`, `cart-total` |
| **UI-19** | `/cart` | Positive | Remove item from cart updates totals | 1. Click "Remove" button on row | Item removed from table, subtotal and badge recalculated | `cart-remove-btn-1`, `toast-success`, `cart-total` |
| **UI-20** | `/cart` | Boundary | Empty cart displays empty-state container | 1. Remove all items or start fresh | Empty cart icon, text, and "Browse Products" button shown | `cart-empty`, `cart-empty-shop-btn` |
| **UI-21** | `/cart` | Positive | "Place Order" button checkout flow | 1. With items in cart, click "Place Order" | Order placed, redirect to `/orders`, cart emptied | `place-order-btn`, `toast-success`, `orders-page` |
| **UI-22** | `/orders` | Positive | Order history table displays placed order | 1. View `/orders` | Table shows order ID, date, item count, total, and status badge | `orders-table`, `order-row-1`, `order-status-1` |
| **UI-23** | `/orders` | Feature | Inline order expansion reveals item breakdown | 1. Click order row or "Details" button | Subtable expands inline showing item names, prices, quantities | `order-row-1`, `order-details-1`, `expand-order-1` |
| **UI-24** | `/orders` | Feature | Cancel button opens confirmation modal | 1. Click "Cancel Order" on pending order | Modal opens with confirmation text and action buttons | `cancel-order-1`, `confirm-cancel-modal` |
| **UI-25** | `/orders` | Positive | Confirm cancellation cancels order | 1. Click "Yes, Cancel Order" in modal | Status badge changes to CANCELLED, toast confirms cancellation | `confirm-cancel-btn`, `order-status-1`, `toast-success` |
| **UI-26** | `/profile` | Positive | Profile loads authenticated user details | 1. Navigate to `/profile` | Shows user name, email, and uppercase role badge | `profile-name`, `profile-email`, `profile-role` |
| **UI-27** | `/profile` | Positive | Edit name and email and save changes | 1. Edit Name field<br>2. Click "Save Changes" | Success toast displayed, header user badge updates | `profile-name`, `profile-save`, `toast-success` |
| **UI-28** | `/profile` | Validation | Invalid email on profile displays inline error | 1. Enter invalid email<br>2. Click Save Changes | Error displayed: "Invalid email format", no update | `profile-email-error` |
| **UI-29** | Shared | Auth | Logout button logs out user | 1. Click "Logout" in navbar or profile | Clears tokens from storage, redirects to `/login` | `nav-logout`, `profile-logout`, `login-card` |
| **UI-30** | Fallback | Navigation | Invalid route displays 404 page | 1. Navigate to `/unknown-path` | 404 graphic displayed with "Back to Products" button | `not-found-page`, `not-found-status`, `not-found-home-btn` |
| **UI-31** | `/products` | Feature | Product card renders image with dedicated testid | 1. View catalog | Each product card contains image element with `product-image-${id}` | `product-image-1`, `product-card-1` |
| **UI-32** | Global | Theme | Theme toggle button toggles light/dark mode | 1. Click theme toggle button in navbar | `data-theme` attribute switches between `dark` and `light` | `theme-toggle` |
| **UI-33** | Global | Theme | Theme preference persists across browser reload | 1. Switch to dark<br>2. Reload page | `data-theme="dark"` preserved from `localStorage['qa-theme']` | `theme-toggle` |
| **UI-34** | `/products` | Performance | Search debounces and retains grid without flicker | 1. Type rapidly in search box | Debounce triggers fetch after 300ms; `product-grid[data-loading="true"]` shows progress bar without clearing grid | `search-input`, `product-grid` |
| **UI-35** | `/cart` | Feature | Cart table renders product thumbnail image | 1. Add item<br>2. View `/cart` | Item row renders thumbnail image with `cart-item-image-${id}` | `cart-item-image-1` |
| **UI-36** | `/orders` | Feature | Order details subtable renders product thumbnail | 1. Expand order row | Line item row displays product image with `order-item-image-${id}` | `order-item-image-0` |

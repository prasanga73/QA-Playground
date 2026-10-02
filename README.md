# QA Playground: E-Commerce Testing Platform

**QA Playground** is an e-commerce web application engineered specifically for practicing **manual testing**, **API testing**, **performance/load testing**, and **UI test automation**.

The application consists of a Node.js/Express SQLite REST backend and a modern React (Vite) single-page application built exclusively with plain CSS.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm**: v9 or higher
- Optional: **Docker** & **Docker Compose**

### Running with npm (Recommended)
From the root directory:

```bash
# 1. Install all dependencies (root, backend, frontend)
npm run install:all

# 2. Run both backend and frontend concurrently
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:3001](http://localhost:3001)
- **Static Product Images:** [http://localhost:3001/images/products/p-001.svg](http://localhost:3001/images/products/p-001.svg)
- **Interactive Swagger UI:** [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **OpenAPI 3.0 Specification:** [http://localhost:3001/openapi.json](http://localhost:3001/openapi.json)

### Running with Docker Compose
```bash
docker-compose up --build
```

---

## 2. Seed Accounts & Credentials

The SQLite database is auto-seeded on first launch. You can also re-seed at any time by running `npm run seed` in `backend` or calling `POST /api/admin/reset-db` with the admin token.

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@test.com` | `Admin@123` | Full access: View all users, delete users, create/update/delete products, view all orders, reset database |
| **Standard User** | `user@test.com` | `User@123` | Personal access: Catalog browsing, cart management, checkout, own order management & cancellation, profile edit |

### 20 Additional Users for Performance Testing
Located in [backend/data/users.csv](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/backend/data/users.csv):
- Password for all 20 accounts: `Test@123`
- Emails: `alice.johnson@test.com`, `bob.smith@test.com`, `charlie.brown@test.com`, ..., `tina.turner@test.com`

---

## 3. Technology Stack & Design Architecture

### Backend
- **Runtime:** Node.js + Express
- **Database:** SQLite3 via `better-sqlite3` (WAL mode enabled, foreign keys enforced)
- **Static Image Hosting:** Express static hosting `/images` serving `/backend/public/images/`
- **Product Images:** 50 unique category-themed SVG images generated locally (offline-resilient) and `/images/placeholder.svg` fallback
- **Security:** `bcryptjs` password hashing, `jsonwebtoken` JWT access (15m) + refresh (7d) tokens, token blacklisting table for logout
- **Documentation:** `swagger-ui-express` & `openapi.json`
- **Config:** `.env` file configuration

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router v7 (`react-router-dom`)
- **HTTP Client:** `axios` with automated 401 refresh token interceptors and `AbortController` cancellation for stale in-flight requests
- **Design System:** Restrained, professional dashboard aesthetic inspired by Linear and Stripe
  - Single accent: Deep Teal (`#0F766E`)
  - Light mode surface (`#ECEEF2`, `#FFFFFF`), Dark mode surface (`#0F1115`, `#161920`)
  - Zero glassmorphism, zero neon gradients, zero emojis (crisp SVG iconography)
  - Dark/Light theme toggle with OS preference sync, `localStorage` persistence (`qa-theme`), and inline anti-FOUC script
- **Search Flicker Prevention:** 300ms input debouncing, stable React keys (`product.id`), grid state preservation during refetch, and subtle progress indicator with `data-loading` attributes
- **Strict Compliance:** No UI libraries or CSS frameworks (no Tailwind, Bootstrap, MUI, etc.)

---

## 4. Application Pages & Architecture

The frontend contains **exactly 5 pages** plus a 404 fallback:

1. **/login (Public):**
   - Email and password inputs with show/hide password toggle.
   - Inline field validation (empty, email format) and server 401 error banner.
   - Quick one-click seed credentials chips for fast QA testing.
   - Theme toggle button in header.
   - Auto-redirects to `/products` if already authenticated.

2. **/products (Protected):**
   - Catalog grid rendering 50 seeded products across 5 categories (`Electronics`, `Clothing`, `Books`, `Home & Kitchen`, `Sports`).
   - Each product card renders a dedicated product image (`data-testid="product-image-${id}"`) with skeleton loading and fallback error handling.
   - Dynamic 300ms debounced search box with abortable requests.
   - Category dropdown filter, min/max price range inputs, sorting dropdown, and pagination.
   - Per-card quantity selection and "Add to Cart" button with inventory checks.
   - Instant success/error toast notifications and empty state handling.

3. **/cart (Protected):**
   - Active cart items table displaying product thumbnail image (`data-testid="cart-item-image-${id}"`), title, unit price, quantity, line total, and "Remove" button.
   - Live order summary card with item count, subtotal, and total.
   - "Place Order" button that submits order and redirects to `/orders`.
   - Empty cart state with "Browse Products" action button.

4. **/orders (Protected):**
   - Order history table displaying Order ID, Date Placed, Items Count, Total Amount, and Status Badge (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
   - Inline row expansion fetching line items detail breakdown via `GET /api/orders/:id`, including product thumbnails.
   - "Cancel Order" button for cancellable orders (`pending`, `confirmed`) triggering a confirmation modal that restores stock upon confirmation.

5. **/profile (Protected):**
   - Displays authenticated user profile: Full Name, Email, and uppercase Role badge.
   - Editable Name and Email fields with validation and "Save Changes" (`PUT /api/users/:id`).
   - Logout button that revokes tokens and navigates to `/login`.

6. *** (404 Fallback):**
   - Clean 404 error page with action button linking back to `/products`.

---

## 5. Automation Testing (`data-testid` Reference)

Every interactive element includes stable, deterministic `data-testid` identifiers for Cypress, Playwright, or Selenium automation:

### Theme & Global Elements
| Element | `data-testid` | Description |
|---|---|---|
| Theme Toggle | `theme-toggle` | Toggles light and dark modes |
| Root Container | `app-root` | Top-level application layout |

### Authentication Elements
| Element | `data-testid` | Description |
|---|---|---|
| Email Input | `login-email` | Login email input |
| Password Input | `login-password` | Login password input |
| Password Toggle | `login-password-toggle` | Eye toggle button |
| Submit Button | `login-submit` | Form submission button |
| Error Banner | `login-error` | 401 error message container |
| Email Error | `login-email-error` | Inline email validation error |
| Password Error | `login-password-error` | Inline password validation error |
| Admin Quick Fill | `fill-admin-creds` | Quick seed credentials button |
| User Quick Fill | `fill-user-creds` | Quick seed credentials button |

### Navigation & Toast Elements
| Element | `data-testid` | Description |
|---|---|---|
| Navbar | `navbar` | Main navigation header |
| Products Link | `nav-products` | Navlink to `/products` |
| Cart Link | `nav-cart` | Navlink to `/cart` |
| Cart Badge | `cart-badge` | Dynamic item count badge |
| Orders Link | `nav-orders` | Navlink to `/orders` |
| Profile Link | `nav-profile` | Navlink to `/profile` |
| Logout Button | `nav-logout` | Header logout button |
| Success Toast | `toast-success` | Success notification bubble |
| Error Toast | `toast-error` | Error notification bubble |

### Product Page Elements
| Element | `data-testid` | Description |
|---|---|---|
| Search Input | `search-input` | Product title/desc search box |
| Category Dropdown | `category-filter` | Category filter select |
| Min Price Input | `min-price-filter` | Minimum price filter |
| Max Price Input | `max-price-filter` | Maximum price filter |
| Sort Dropdown | `sort-select` | Sort field & direction selector |
| Filter Reset | `filter-reset-btn` | Reset filters button |
| Product Grid | `product-grid` | Product grid container (`data-loading="true" / "false"`) |
| Product Card | `product-card-{id}` | Card container for product ID |
| Product Image | `product-image-{id}` | Product thumbnail/image element |
| Quantity Input | `product-qty-{id}` | Quantity input for product ID |
| Add to Cart Button | `add-to-cart-{id}` | Submit button to add to cart |
| Pagination Bar | `pagination` | Pagination container |
| Next Page Button | `pagination-next` | Next page control |
| Prev Page Button | `pagination-prev` | Previous page control |
| Page Number Button | `pagination-page-{num}` | Specific page number button |

### Cart & Orders Elements
| Element | `data-testid` | Description |
|---|---|---|
| Cart Table | `cart-table` | Shopping cart table |
| Cart Row | `cart-item-{id}` | Table row for cart item |
| Cart Item Image | `cart-item-image-{id}` | Product image thumbnail in cart row |
| Remove Item Button | `cart-remove-btn-{id}` | Remove item from cart button |
| Cart Subtotal | `cart-subtotal` | Summary subtotal amount |
| Cart Total | `cart-total` | Summary total amount |
| Place Order Button | `place-order-btn` | Order checkout button |
| Orders Table | `orders-table` | Orders history table |
| Order Row | `order-row-{id}` | Table row for order ID |
| Order Item Image | `order-item-image-{id}` | Product image thumbnail in order breakdown |
| Order Status Badge | `order-status-{id}` | Status pill badge |
| Order Details Container | `order-details-{id}` | Expanded line items subtable |
| Cancel Order Button | `cancel-order-{id}` | Cancel button on order row |
| Confirm Cancel Modal | `confirm-cancel-modal` | Confirmation dialog container |
| Confirm Cancel Button | `confirm-cancel-btn` | Action button in modal |

### Profile Elements
| Element | `data-testid` | Description |
|---|---|---|
| Name Input | `profile-name` | Full name input |
| Email Input | `profile-email` | Email address input |
| Role Badge | `profile-role` | User role badge (USER / ADMIN) |
| Save Button | `profile-save` | Save changes button |
| Profile Logout | `profile-logout` | Logout button on profile |

---

## 6. Deliverables Overview

1. **Source Code**: Full implementation in [backend/](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/backend) and [frontend/](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/frontend).
2. **OpenAPI Specification**: [openapi.json](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/openapi.json).
3. **Postman Collection & Environment**:
   - [qa-playground.postman_collection.json](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/qa-playground.postman_collection.json)
   - [qa-playground.postman_environment.json](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/qa-playground.postman_environment.json)
4. **JMeter Test Plan**:
   - [qa-playground-loadtest.jmx](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/qa-playground-loadtest.jmx)
5. **Requirements & Test Cases**:
   - [requirements.md](file:///home/ethereal/Downloads/QA%20TechAxis/QA%20Practice%20Website/requirements.md) containing numbered FRs, NFRs, 35 API test cases, and 36 UI test cases.

---

## 7. Assumptions & Design Decisions

- **Product Images:** 50 distinct category-themed SVG images are generated in `backend/public/images/products/` and statically hosted at `/images`. All image assets reside locally to eliminate offline and flaky test failures.
- **Theme Support:** Clean CSS variables handle theme switching. A theme toggle button with `data-testid="theme-toggle"` toggles between light (`#ECEEF2`) and dark (`#0F1115`) modes with persistence in `localStorage['qa-theme']`.
- **Search Optimization:** Search keystrokes are debounced by 300ms, in-flight obsolete requests are aborted via `AbortController`, and the product grid maintains previous items during refetches with a discreet progress indicator.
- **Token Storage:** In accordance with standard SPA testing practices, JWT access and refresh tokens are stored in `localStorage` and managed by an Axios interceptor that retries on 401 with `/api/auth/refresh`.
- **Database Engine:** SQLite in WAL (Write-Ahead Logging) mode is used with explicit foreign key support. No external database server installation is required.
- **Order Cancellation Window:** Orders with statuses `pending` or `confirmed` can be cancelled by the owner or admin. When cancelled, inventory stock is automatically refunded back to the products table.

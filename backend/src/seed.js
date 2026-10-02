require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initializeDatabase, getDb, closeDb } = require('./database');

function seed() {
  console.log('Seeding database...');

  const db = initializeDatabase();

  // Clear all tables
  db.exec(`
    DELETE FROM blacklisted_tokens;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM carts;
    DELETE FROM products;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  // ----- USERS -----
  const hashedAdmin = bcrypt.hashSync('Admin@123', 10);
  const hashedUser = bcrypt.hashSync('User@123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
  `);

  // Seed accounts
  insertUser.run('Admin User', 'admin@test.com', hashedAdmin, 'admin');
  insertUser.run('Test User', 'user@test.com', hashedUser, 'user');

  // 20 additional users
  const additionalUsers = [
    { name: 'Alice Johnson', email: 'alice.johnson@test.com' },
    { name: 'Bob Smith', email: 'bob.smith@test.com' },
    { name: 'Charlie Brown', email: 'charlie.brown@test.com' },
    { name: 'Diana Prince', email: 'diana.prince@test.com' },
    { name: 'Edward Norton', email: 'edward.norton@test.com' },
    { name: 'Fiona Apple', email: 'fiona.apple@test.com' },
    { name: 'George Lucas', email: 'george.lucas@test.com' },
    { name: 'Hannah Montana', email: 'hannah.montana@test.com' },
    { name: 'Ivan Petrov', email: 'ivan.petrov@test.com' },
    { name: 'Julia Roberts', email: 'julia.roberts@test.com' },
    { name: 'Kevin Hart', email: 'kevin.hart@test.com' },
    { name: 'Laura Palmer', email: 'laura.palmer@test.com' },
    { name: 'Mike Tyson', email: 'mike.tyson@test.com' },
    { name: 'Nancy Drew', email: 'nancy.drew@test.com' },
    { name: 'Oscar Wilde', email: 'oscar.wilde@test.com' },
    { name: 'Patricia Arquette', email: 'patricia.arquette@test.com' },
    { name: 'Quinn Hughes', email: 'quinn.hughes@test.com' },
    { name: 'Rachel Green', email: 'rachel.green@test.com' },
    { name: 'Samuel Jackson', email: 'samuel.jackson@test.com' },
    { name: 'Tina Turner', email: 'tina.turner@test.com' },
  ];

  const defaultPassword = bcrypt.hashSync('Test@123', 10);
  for (const user of additionalUsers) {
    insertUser.run(user.name, user.email, defaultPassword, 'user');
  }

  // ----- PRODUCTS (50 products, 5 categories) -----
  const products = [
    // Electronics (10)
    { name: 'Wireless Bluetooth Headphones', description: 'Premium noise-cancelling over-ear headphones with 30-hour battery life and Hi-Res Audio support.', price: 9.99, stock: 150, category: 'Electronics', image_url: '/images/products/p-001.jpg' },
    { name: 'USB-C Fast Charger 65W', description: 'GaN technology fast charger compatible with laptops, tablets, and smartphones. Dual USB-C ports.', price: 4.99, stock: 200, category: 'Electronics', image_url: '/images/products/p-002.jpg' },
    { name: 'Mechanical Gaming Keyboard', description: 'RGB backlit mechanical keyboard with Cherry MX Blue switches, N-key rollover, and aluminum frame.', price: 9.99, stock: 75, category: 'Electronics', image_url: '/images/products/p-003.jpg' },
    { name: 'Portable SSD 1TB', description: 'External solid state drive with USB 3.2 Gen 2 interface, read speeds up to 1050 MB/s.', price: 8.99, stock: 120, category: 'Electronics', image_url: '/images/products/p-004.jpg' },
    { name: '4K Webcam with Microphone', description: 'Ultra HD webcam with auto-focus, built-in dual microphones, and adjustable field of view.', price: 7.99, stock: 90, category: 'Electronics', image_url: '/images/products/p-005.jpg' },
    { name: 'Smart Fitness Watch', description: 'Fitness tracker with heart rate monitor, GPS, sleep tracking, and 7-day battery life. Water resistant.', price: 9.49, stock: 60, category: 'Electronics', image_url: '/images/products/p-006.jpg' },
    { name: 'Wireless Mouse Ergonomic', description: 'Ergonomic vertical wireless mouse with adjustable DPI, silent clicks, and rechargeable battery.', price: 3.99, stock: 300, category: 'Electronics', image_url: '/images/products/p-007.jpg' },
    { name: 'Portable Bluetooth Speaker', description: 'Waterproof portable speaker with 360-degree sound, 12-hour battery, and built-in microphone.', price: 5.99, stock: 180, category: 'Electronics', image_url: '/images/products/p-008.jpg' },
    { name: '27-inch Monitor 4K', description: 'IPS 4K UHD monitor with HDR400, 99% sRGB color accuracy, USB-C connectivity, and adjustable stand.', price: 9.99, stock: 40, category: 'Electronics', image_url: '/images/products/p-009.jpg' },
    { name: 'Noise Cancelling Earbuds', description: 'True wireless earbuds with active noise cancellation, transparency mode, and wireless charging case.', price: 8.49, stock: 100, category: 'Electronics', image_url: '/images/products/p-010.jpg' },

    // Clothing (10)
    { name: 'Classic Fit Cotton T-Shirt', description: 'Soft 100% organic cotton crew neck t-shirt. Pre-shrunk, breathable, and available in multiple colors.', price: 3.99, stock: 500, category: 'Clothing', image_url: '/images/products/p-011.jpg' },
    { name: 'Slim Fit Denim Jeans', description: 'Premium stretch denim jeans with modern slim fit, five-pocket design, and reinforced stitching.', price: 6.99, stock: 250, category: 'Clothing', image_url: '/images/products/p-012.jpg' },
    { name: 'Waterproof Winter Jacket', description: 'Insulated waterproof jacket with detachable hood, multiple pockets, and reflective detailing.', price: 9.99, stock: 80, category: 'Clothing', image_url: '/images/products/p-013.jpg' },
    { name: 'Running Sneakers', description: 'Lightweight mesh running shoes with cushioned midsole, breathable upper, and non-slip rubber outsole.', price: 7.99, stock: 150, category: 'Clothing', image_url: '/images/products/p-014.jpg' },
    { name: 'Wool Blend Sweater', description: 'Soft merino wool blend crewneck sweater. Ribbed cuffs and hem, perfect for layering.', price: 6.49, stock: 120, category: 'Clothing', image_url: '/images/products/p-015.jpg' },
    { name: 'Leather Belt', description: 'Genuine leather belt with brushed nickel buckle. 35mm width, fits waist sizes 28-42.', price: 3.49, stock: 200, category: 'Clothing', image_url: '/images/products/p-016.jpg' },
    { name: 'Cotton Hoodie', description: 'Heavyweight fleece-lined hoodie with kangaroo pocket, drawstring hood, and ribbed cuffs.', price: 5.99, stock: 180, category: 'Clothing', image_url: '/images/products/p-017.jpg' },
    { name: 'Formal Dress Shirt', description: 'Wrinkle-free cotton blend dress shirt with spread collar, barrel cuffs, and tailored fit.', price: 5.49, stock: 160, category: 'Clothing', image_url: '/images/products/p-018.jpg' },
    { name: 'Sports Shorts', description: 'Quick-dry athletic shorts with elastic waistband, zippered pocket, and built-in liner.', price: 3.99, stock: 220, category: 'Clothing', image_url: '/images/products/p-019.jpg' },
    { name: 'Polarized Sunglasses', description: 'UV400 polarized sunglasses with lightweight frame, scratch-resistant lenses, and hard case included.', price: 4.49, stock: 140, category: 'Clothing', image_url: '/images/products/p-020.jpg' },

    // Books (10)
    { name: 'Clean Code: Software Craftsmanship', description: 'A handbook of agile software craftsmanship by Robert C. Martin. Essential reading for developers.', price: 4.99, stock: 300, category: 'Books', image_url: '/images/products/p-021.jpg' },
    { name: 'The Pragmatic Programmer', description: 'Classic guide to software development examining core processes. 20th Anniversary Edition.', price: 5.99, stock: 250, category: 'Books', image_url: '/images/products/p-022.jpg' },
    { name: 'Design Patterns in JavaScript', description: 'Comprehensive guide to implementing classic design patterns in modern JavaScript applications.', price: 4.49, stock: 180, category: 'Books', image_url: '/images/products/p-023.jpg' },
    { name: 'Introduction to Algorithms', description: 'The definitive textbook on algorithms covering sorting, searching, graph algorithms, and more.', price: 8.99, stock: 100, category: 'Books', image_url: '/images/products/p-024.jpg' },
    { name: 'You Don\'t Know JS Yet', description: 'Deep dive into the core mechanisms of JavaScript. Covers scope, closures, objects, and prototypes.', price: 3.49, stock: 400, category: 'Books', image_url: '/images/products/p-025.jpg' },
    { name: 'Testing JavaScript Applications', description: 'Practical guide to testing strategies, frameworks, and best practices for JavaScript apps.', price: 4.99, stock: 200, category: 'Books', image_url: '/images/products/p-026.jpg' },
    { name: 'System Design Interview', description: 'Step-by-step framework for system design interviews. Covers scalability, caching, and databases.', price: 5.49, stock: 280, category: 'Books', image_url: '/images/products/p-027.jpg' },
    { name: 'Refactoring: Improving Design', description: 'Martin Fowler\'s classic guide to improving code structure and design through refactoring techniques.', price: 6.49, stock: 150, category: 'Books', image_url: '/images/products/p-028.jpg' },
    { name: 'Learning SQL', description: 'Comprehensive introduction to SQL covering queries, joins, subqueries, and database administration.', price: 3.99, stock: 320, category: 'Books', image_url: '/images/products/p-029.jpg' },
    { name: 'The Art of Unit Testing', description: 'Best practices for writing maintainable, readable, and trustworthy unit tests. Third edition.', price: 5.49, stock: 170, category: 'Books', image_url: '/images/products/p-030.jpg' },

    // Home & Kitchen (10)
    { name: 'Stainless Steel Water Bottle', description: 'Double-wall vacuum insulated water bottle. Keeps drinks cold 24h or hot 12h. BPA-free, 32oz capacity.', price: 3.99, stock: 350, category: 'Home & Kitchen', image_url: '/images/products/p-031.jpg' },
    { name: 'Non-Stick Frying Pan Set', description: 'Set of 3 non-stick frying pans (8", 10", 12") with heat-resistant handles and even heat distribution.', price: 6.99, stock: 120, category: 'Home & Kitchen', image_url: '/images/products/p-032.jpg' },
    { name: 'Automatic Coffee Maker', description: '12-cup programmable drip coffee maker with built-in grinder, thermal carafe, and auto-shutoff.', price: 9.49, stock: 85, category: 'Home & Kitchen', image_url: '/images/products/p-033.jpg' },
    { name: 'Bamboo Cutting Board Set', description: 'Set of 3 organic bamboo cutting boards in different sizes. Juice grooves, easy-grip handles.', price: 3.49, stock: 200, category: 'Home & Kitchen', image_url: '/images/products/p-034.jpg' },
    { name: 'LED Desk Lamp', description: 'Adjustable LED desk lamp with 5 color temperatures, touch dimmer, USB charging port, and timer.', price: 4.99, stock: 160, category: 'Home & Kitchen', image_url: '/images/products/p-035.jpg' },
    { name: 'Kitchen Scale Digital', description: 'Precision digital kitchen scale with tare function, LCD display, and capacity up to 11 lbs / 5 kg.', price: 2.49, stock: 280, category: 'Home & Kitchen', image_url: '/images/products/p-036.jpg' },
    { name: 'Ceramic Knife Set', description: 'Ultra-sharp ceramic knife set (3", 4", 5", 6") with sheaths. Rust-proof and easy to clean.', price: 4.49, stock: 140, category: 'Home & Kitchen', image_url: '/images/products/p-037.jpg' },
    { name: 'Air Purifier HEPA Filter', description: 'Room air purifier with true HEPA H13 filter, covers up to 300 sq ft, whisper-quiet operation.', price: 9.99, stock: 70, category: 'Home & Kitchen', image_url: '/images/products/p-038.jpg' },
    { name: 'Electric Kettle 1.7L', description: 'Stainless steel electric kettle with temperature control, auto shut-off, and boil-dry protection.', price: 4.99, stock: 190, category: 'Home & Kitchen', image_url: '/images/products/p-039.jpg' },
    { name: 'Scented Candle Gift Set', description: 'Set of 4 natural soy wax scented candles. Lavender, vanilla, cinnamon, and eucalyptus. 30h burn each.', price: 2.99, stock: 250, category: 'Home & Kitchen', image_url: '/images/products/p-040.jpg' },

    // Sports (10)
    { name: 'Yoga Mat Premium', description: 'Extra thick 6mm eco-friendly TPE yoga mat with alignment lines, non-slip texture, and carrying strap.', price: 4.49, stock: 200, category: 'Sports', image_url: '/images/products/p-041.jpg' },
    { name: 'Adjustable Dumbbell Set', description: 'Pair of adjustable dumbbells (5-52.5 lbs each) with quick-change weight mechanism and storage tray.', price: 9.99, stock: 35, category: 'Sports', image_url: '/images/products/p-042.jpg' },
    { name: 'Resistance Bands Set', description: 'Set of 5 resistance bands (light to extra heavy) with handles, door anchor, and ankle straps.', price: 2.99, stock: 300, category: 'Sports', image_url: '/images/products/p-043.jpg' },
    { name: 'Jump Rope Speed', description: 'Adjustable speed jump rope with ball bearings, anti-slip handles, and steel wire cable.', price: 1.99, stock: 400, category: 'Sports', image_url: '/images/products/p-044.jpg' },
    { name: 'Foam Roller 18-inch', description: 'High-density foam roller for deep tissue massage, muscle recovery, and physical therapy.', price: 2.99, stock: 250, category: 'Sports', image_url: '/images/products/p-045.jpg' },
    { name: 'Sports Water Bottle 32oz', description: 'Leak-proof sports water bottle with time marker, motivational quotes, and fruit infuser insert.', price: 2.49, stock: 350, category: 'Sports', image_url: '/images/products/p-046.jpg' },
    { name: 'Cycling Gloves', description: 'Padded cycling gloves with breathable mesh, silicone grip, and pull-off tabs. Half-finger design.', price: 2.99, stock: 180, category: 'Sports', image_url: '/images/products/p-047.jpg' },
    { name: 'Basketball Size 7', description: 'Official size and weight indoor/outdoor basketball with deep channel design and composite leather.', price: 3.99, stock: 120, category: 'Sports', image_url: '/images/products/p-048.jpg' },
    { name: 'Tennis Racket Pro', description: 'Lightweight graphite tennis racket with vibration dampening, pre-strung, and protective cover included.', price: 7.99, stock: 90, category: 'Sports', image_url: '/images/products/p-049.jpg' },
    { name: 'Swimming Goggles', description: 'Anti-fog UV protection swim goggles with adjustable nose bridge, silicone seal, and wide-angle lens.', price: 2.49, stock: 220, category: 'Sports', image_url: '/images/products/p-050.jpg' },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const product of products) {
    insertProduct.run(product.name, product.description, product.price, product.stock, product.category, product.image_url);
  }

  console.log(`Seeded ${2 + additionalUsers.length} users`);
  console.log(`Seeded ${products.length} products`);
  console.log('Database seeding complete.');
}

// Run if called directly
if (require.main === module) {
  seed();
  closeDb();
}

module.exports = { seed };

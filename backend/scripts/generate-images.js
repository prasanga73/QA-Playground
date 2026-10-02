#!/usr/bin/env node
/**
 * Generates 50 SVG product images in backend/public/images/products/
 * Each image has a category-specific tint, a simple icon, and the product name.
 * Run: node scripts/generate-images.js
 */
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../public/images/products');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const categoryThemes = {
  Electronics: { bg: '#EFF6FF', accent: '#3B82F6', dark: '#1E40AF', icon: 'M368,220 L432,220 L432,300 L368,300 Z M380,240 L420,240 M380,260 L410,260 M380,280 L415,280 M354,310 L446,310 L446,330 L354,330 Z' },
  Clothing:    { bg: '#FDF2F8', accent: '#EC4899', dark: '#BE185D', icon: 'M370,220 L400,200 L430,220 L430,310 L370,310 Z M370,220 L350,240 L350,280 L370,260 M430,220 L450,240 L450,280 L430,260 M388,220 L388,250 Q400,265 412,250 L412,220' },
  Books:       { bg: '#FFFBEB', accent: '#F59E0B', dark: '#B45309', icon: 'M370,210 L370,310 L430,310 L430,210 Z M370,210 Q400,230 430,210 M375,220 L425,220 M375,240 L425,240 M375,260 L415,260 M375,280 L420,280' },
  'Home & Kitchen': { bg: '#ECFDF5', accent: '#10B981', dark: '#047857', icon: 'M360,280 L400,230 L440,280 Z M370,280 L370,320 L430,320 L430,280 M390,280 L390,320 M410,280 L410,320 M355,280 L445,280' },
  Sports:      { bg: '#F5F3FF', accent: '#8B5CF6', dark: '#6D28D9', icon: 'M400,220 A40,40 0 1,1 400,300 A40,40 0 1,1 400,220 Z M400,230 A30,30 0 1,1 400,290 A30,30 0 1,1 400,230 Z M370,260 L430,260 M400,220 L400,300' },
};

const products = [
  { name: 'Wireless Bluetooth Headphones', category: 'Electronics' },
  { name: 'USB-C Fast Charger 65W', category: 'Electronics' },
  { name: 'Mechanical Gaming Keyboard', category: 'Electronics' },
  { name: 'Portable SSD 1TB', category: 'Electronics' },
  { name: '4K Webcam with Microphone', category: 'Electronics' },
  { name: 'Smart Fitness Watch', category: 'Electronics' },
  { name: 'Wireless Mouse Ergonomic', category: 'Electronics' },
  { name: 'Portable Bluetooth Speaker', category: 'Electronics' },
  { name: '27-inch Monitor 4K', category: 'Electronics' },
  { name: 'Noise Cancelling Earbuds', category: 'Electronics' },
  { name: 'Classic Fit Cotton T-Shirt', category: 'Clothing' },
  { name: 'Slim Fit Denim Jeans', category: 'Clothing' },
  { name: 'Waterproof Winter Jacket', category: 'Clothing' },
  { name: 'Running Sneakers', category: 'Clothing' },
  { name: 'Wool Blend Sweater', category: 'Clothing' },
  { name: 'Leather Belt', category: 'Clothing' },
  { name: 'Cotton Hoodie', category: 'Clothing' },
  { name: 'Formal Dress Shirt', category: 'Clothing' },
  { name: 'Sports Shorts', category: 'Clothing' },
  { name: 'Polarized Sunglasses', category: 'Clothing' },
  { name: 'Clean Code: Software Craftsmanship', category: 'Books' },
  { name: 'The Pragmatic Programmer', category: 'Books' },
  { name: 'Design Patterns in JavaScript', category: 'Books' },
  { name: 'Introduction to Algorithms', category: 'Books' },
  { name: "You Don't Know JS Yet", category: 'Books' },
  { name: 'Testing JavaScript Applications', category: 'Books' },
  { name: 'System Design Interview', category: 'Books' },
  { name: 'Refactoring: Improving Design', category: 'Books' },
  { name: 'Learning SQL', category: 'Books' },
  { name: 'The Art of Unit Testing', category: 'Books' },
  { name: 'Stainless Steel Water Bottle', category: 'Home & Kitchen' },
  { name: 'Non-Stick Frying Pan Set', category: 'Home & Kitchen' },
  { name: 'Automatic Coffee Maker', category: 'Home & Kitchen' },
  { name: 'Bamboo Cutting Board Set', category: 'Home & Kitchen' },
  { name: 'LED Desk Lamp', category: 'Home & Kitchen' },
  { name: 'Kitchen Scale Digital', category: 'Home & Kitchen' },
  { name: 'Ceramic Knife Set', category: 'Home & Kitchen' },
  { name: 'Air Purifier HEPA Filter', category: 'Home & Kitchen' },
  { name: 'Electric Kettle 1.7L', category: 'Home & Kitchen' },
  { name: 'Scented Candle Gift Set', category: 'Home & Kitchen' },
  { name: 'Yoga Mat Premium', category: 'Sports' },
  { name: 'Adjustable Dumbbell Set', category: 'Sports' },
  { name: 'Resistance Bands Set', category: 'Sports' },
  { name: 'Jump Rope Speed', category: 'Sports' },
  { name: 'Foam Roller 18-inch', category: 'Sports' },
  { name: 'Sports Water Bottle 32oz', category: 'Sports' },
  { name: 'Cycling Gloves', category: 'Sports' },
  { name: 'Basketball Size 7', category: 'Sports' },
  { name: 'Tennis Racket Pro', category: 'Sports' },
  { name: 'Swimming Goggles', category: 'Sports' },
];

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const theme = categoryThemes[p.category];
  const num = String(i + 1).padStart(3, '0');
  const nameLines = wrapText(p.name, 28);
  const nameY = 360;

  const nameTextElements = nameLines.map((line, li) =>
    `<text x="400" y="${nameY + li * 28}" text-anchor="middle" fill="${theme.dark}" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="600">${escapeXml(line)}</text>`
  ).join('\n  ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${theme.bg}"/>
  <rect x="280" y="80" width="240" height="240" rx="16" fill="white" stroke="${theme.accent}" stroke-width="1.5" opacity="0.9"/>
  <g fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7">
    <path d="${theme.icon}"/>
  </g>
  ${nameTextElements}
  <text x="400" y="${nameY + nameLines.length * 28 + 8}" text-anchor="middle" fill="${theme.accent}" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="500" letter-spacing="0.05em" text-transform="uppercase">${escapeXml(p.category)}</text>
  <text x="400" y="570" text-anchor="middle" fill="#9CA3AF" font-family="system-ui,sans-serif" font-size="11">P-${num}</text>
</svg>`;

  fs.writeFileSync(path.join(outDir, `p-${num}.svg`), svg);
}

console.log(`Generated ${products.length} product images in ${outDir}`);

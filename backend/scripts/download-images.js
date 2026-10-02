#!/usr/bin/env node
/**
 * Downloads 50 high-quality real product photos from Unsplash
 * and saves them to backend/public/images/products/p-001.jpg ... p-050.jpg
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.resolve(__dirname, '../public/images/products');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const photoIds = [
  // Electronics (1-10)
  'photo-1505740420928-5e560c06d30e', // 1: Wireless Bluetooth Headphones
  'photo-1583863788434-e58a36330cf0', // 2: USB-C Fast Charger 65W
  'photo-1587829741301-dc798b83add3', // 3: Mechanical Gaming Keyboard
  'photo-1597872200969-2b65d56bd16b', // 4: Portable SSD 1TB
  'photo-1588508065123-287b28e013da', // 5: 4K Webcam with Microphone
  'photo-1523275335684-37898b6baf30', // 6: Smart Fitness Watch
  'photo-1527864550417-7fd91fc51a46', // 7: Wireless Mouse Ergonomic
  'photo-1608043152269-423dbba4e7e1', // 8: Portable Bluetooth Speaker
  'photo-1527443224154-c4a3942d3acf', // 9: 27-inch Monitor 4K
  'photo-1590658268037-6bf12165a8df', // 10: Noise Cancelling Earbuds

  // Clothing (11-20)
  'photo-1521572267360-ee0c2909d518', // 11: Classic Fit Cotton T-Shirt
  'photo-1542272604-780c96856592', // 12: Slim Fit Denim Jeans
  'photo-1548883354-7622d03aca27', // 13: Waterproof Winter Jacket
  'photo-1542291026-7eec264c27ff', // 14: Running Sneakers
  'photo-1576566588028-4147f3842f27', // 15: Wool Blend Sweater
  'photo-1624222247344-550fb60583dc', // 16: Leather Belt
  'photo-1556905055-8f358a7a47b2', // 17: Cotton Hoodie
  'photo-1602810318383-e386cc2a3ccf', // 18: Formal Dress Shirt
  'photo-1591195853828-11db59a44f6b', // 19: Sports Shorts
  'photo-1511499767150-a48a237f0083', // 20: Polarized Sunglasses

  // Books (21-30)
  'photo-1532012164546-f432f2e3edd4', // 21: Clean Code
  'photo-1544716278-ca5e3f4abd8c', // 22: The Pragmatic Programmer
  'photo-1512820790803-83ca734da794', // 23: Design Patterns
  'photo-1589829085413-56de8ae18c73', // 24: Introduction to Algorithms
  'photo-1497633762265-9d179a990aa6', // 25: You Don't Know JS Yet
  'photo-1516979187457-637abb4f9353', // 26: Testing JavaScript Applications
  'photo-1457369804613-52c61a468e7d', // 27: System Design Interview
  'photo-1495446815901-a7297e633e8d', // 28: Refactoring
  'photo-1463320726281-696a485928c7', // 29: Learning SQL
  'photo-1524995997946-a1c2e315a42f', // 30: The Art of Unit Testing

  // Home & Kitchen (31-40)
  'photo-1602143407151-7111542de6e8', // 31: Stainless Steel Water Bottle
  'photo-1584269600464-37b1b58a9fe7', // 32: Non-Stick Frying Pan Set
  'photo-1517668808822-9ebb02f2a0e6', // 33: Automatic Coffee Maker
  'photo-1594998893017-36147cbcae05', // 34: Bamboo Cutting Board Set
  'photo-1507473885765-e6ed057f782c', // 35: LED Desk Lamp
  'photo-1584905066893-7d5c142ba4e1', // 36: Kitchen Scale Digital
  'photo-1593618998160-e34014e67546', // 37: Ceramic Knife Set
  'photo-1585771724684-38269d6639fd', // 38: Air Purifier HEPA Filter
  'photo-1585672840545-2f883f3e13d9', // 39: Electric Kettle 1.7L
  'photo-1603006905003-be475563bc59', // 40: Scented Candle Gift Set

  // Sports (41-50)
  'photo-1601925260368-ae2f83cf8b7f', // 41: Yoga Mat Premium
  'photo-1583454110551-21f2fa2afe61', // 42: Adjustable Dumbbell Set
  'photo-1598289431512-b97b0917affc', // 43: Resistance Bands Set
  'photo-1614088448378-0cb93a620241', // 44: Jump Rope Speed
  'photo-1518611012118-696072aa579a', // 45: Foam Roller 18-inch
  'photo-1550572017-edd951aa8f72', // 46: Sports Water Bottle 32oz
  'photo-1559348349-86f1f65817fe', // 47: Cycling Gloves
  'photo-1519766304817-4f37bda74a29', // 48: Basketball Size 7
  'photo-1617083934555-563d76378e9f', // 49: Tennis Racket Pro
  'photo-1530549387789-4c1017266635', // 50: Swimming Goggles
];

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Status ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`Starting download of ${photoIds.length} images from Unsplash...`);
  let successCount = 0;

  for (let i = 0; i < photoIds.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    const destJpg = path.join(outDir, `p-${num}.jpg`);
    const id = photoIds[i];
    const url = `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`;

    try {
      await downloadImage(url, destJpg);
      console.log(`[${i + 1}/${photoIds.length}] Downloaded p-${num}.jpg`);
      successCount++;
    } catch (err) {
      console.warn(`[${i + 1}/${photoIds.length}] Warning: Failed to download p-${num}.jpg: ${err.message}`);
    }
  }

  console.log(`\nSuccessfully downloaded ${successCount}/${photoIds.length} images to ${outDir}`);
}

main().catch(console.error);

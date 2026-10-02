const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password: min 6 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;

function validateEmail(email) {
  if (!email) return 'Email is required';
  if (typeof email !== 'string') return 'Email must be a string';
  if (!emailRegex.test(email.trim())) return 'Invalid email format';
  return null;
}

function validatePassword(password) {
  if (!password) return 'Password is required';
  if (typeof password !== 'string') return 'Password must be a string';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!passwordRegex.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character';
  }
  return null;
}

function validateRequired(fields, body) {
  const errors = [];
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required`);
    }
  }
  return errors;
}

function validatePrice(price) {
  if (price === undefined || price === null) return 'Price is required';
  if (typeof price !== 'number' || isNaN(price)) return 'Price must be a number';
  if (price <= 0) return 'Price must be greater than 0';
  return null;
}

function validateQuantity(quantity) {
  if (quantity === undefined || quantity === null) return 'Quantity is required';
  if (!Number.isInteger(quantity)) return 'Quantity must be an integer';
  if (quantity < 1) return 'Quantity must be at least 1';
  return null;
}

function validateStock(stock) {
  if (stock === undefined || stock === null) return null; // optional
  if (!Number.isInteger(stock)) return 'Stock must be an integer';
  if (stock < 0) return 'Stock must be 0 or greater';
  return null;
}

function validateImageUrl(imageUrl) {
  if (imageUrl === undefined || imageUrl === null || imageUrl === '') return null; // optional
  if (typeof imageUrl !== 'string') return 'imageUrl must be a string';
  if (imageUrl.length > 255) return 'imageUrl must be at most 255 characters';
  const isRelative = imageUrl.startsWith('/images/');
  const isHttp = /^https?:\/\//i.test(imageUrl);
  if (!isRelative && !isHttp) {
    return 'imageUrl must be a relative /images/... path or an http(s) URL';
  }
  return null;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRequired,
  validatePrice,
  validateQuantity,
  validateStock,
  validateImageUrl,
};

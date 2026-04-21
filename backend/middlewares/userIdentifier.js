const jwt = require('jsonwebtoken');

/**
 * userIdentifier Middleware
 * Decodes the JWT token from cookies OR Authorization header to identify the user role
 * WITHOUT blocking the request if the token is missing or invalid.
 * This allows rate limiters to skip admins while still limiting guests.
 *
 * Priority: cookie (accessToken) → Bearer header (Authorization)
 */
const userIdentifier = (req, res, next) => {
  // 1. Ưu tiên cookie trước (flow thông thường)
  let token = req.cookies?.accessToken;

  // 2. Fallback sang Authorization header nếu không có cookie
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Ignore verification errors for identification purposes
      // The actual 'auth' middleware will handle invalid tokens for protected routes
    }
  }

  next();
};

module.exports = userIdentifier;

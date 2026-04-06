const jwt = require('jsonwebtoken');

/**
 * userIdentifier Middleware
 * Decodes the JWT token from cookies to identify the user role
 * WITHOUT blocking the request if the token is missing or invalid.
 * This allows rate limiters to skip admins while still limiting guests.
 */
const userIdentifier = (req, res, next) => {
  const token = req.cookies.accessToken;

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

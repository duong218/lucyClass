const jwt = require('jsonwebtoken');

const streakAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.streakUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token payload'
      });
    }

    req.user = {
      streakUserId: decoded.streakUserId
    };

    return next();
  } catch (_err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token'
    });
  }
};

module.exports = streakAuth;

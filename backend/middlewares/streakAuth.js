const jwt = require('jsonwebtoken');

const streakAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🎯 CHỈ cần phone
    if (!decoded.phone) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    req.user = {
      phone: decoded.phone
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token'
    });
  }
};

module.exports = streakAuth;

const authorizeRoles = (...roles) => {
  const normalizedRoles = roles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const userRole = String(req.user.role || '').toLowerCase();
    if (!userRole || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    return next();
  };
};

module.exports = authorizeRoles;

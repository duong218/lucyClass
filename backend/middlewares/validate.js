const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Standardized error response
  return res.status(400).json({
    success: false,
    message: errors.array()[0].msg, // Return the first error message
    errors: errors.array()
  });
};

module.exports = validate;

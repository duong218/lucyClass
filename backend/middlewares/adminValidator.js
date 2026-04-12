const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
  });
};

const courseValidationRules = [
  body('name').trim().notEmpty().withMessage('Course name is required').isLength({ max: 100 }),
  body('ageGroup').trim().notEmpty().withMessage('Age Group is required'),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
  body('classSize').trim().notEmpty().withMessage('Class Size is required'),
  body('description').optional().trim(),
  body('teacher').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid teacher ID'),
];

const teacherValidationRules = [
  body('name').trim().notEmpty().withMessage('Teacher name is required').isLength({ max: 40 }),
  body('specialization').trim().notEmpty().withMessage('Specialization is required').isLength({ max: 100 }),
  body('experience').trim().notEmpty().withMessage('Experience is required').isInt({ min: 1, max: 40 }).withMessage('Experience must be 1-40 years'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Short description max 50 characters'),
  body('feedback').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Feedback max 500 characters'),
  body('rating').optional({ checkFalsy: true }).trim().isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer from 1 to 5'),
];

module.exports = {
  courseValidationRules,
  teacherValidationRules,
  validate
};

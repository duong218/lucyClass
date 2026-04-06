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
  body('name').trim().notEmpty().withMessage('Teacher name is required').isLength({ max: 50 }).escape(),
  body('specialization').trim().notEmpty().withMessage('Specialization is required').isLength({ max: 100 }).escape(),
  body('experience').trim().notEmpty().withMessage('Experience description is required').isLength({ max: 500 }).escape(),
];

module.exports = {
  courseValidationRules,
  teacherValidationRules,
  validate
};

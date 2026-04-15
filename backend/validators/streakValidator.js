const { body } = require('express-validator');

const startValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 80 })
    .withMessage('Name too long'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Invalid email')
];

const checkinValidation = [];

module.exports = {
  startValidation,
  checkinValidation
};

const { body, param } = require('express-validator');

const checkinValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^[0-9]{9,11}$/)
    .withMessage('Phone must be 9-11 digits'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name too long'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Invalid email')
];

const getStreakValidation = [
  param('phone')
    .trim()
    .matches(/^[0-9]{9,11}$/)
    .withMessage('Invalid phone')
];

const recoverValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^[0-9]{9,11}$/)
    .withMessage('Phone must be 9-11 digits'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
];

const reviveValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^[0-9]{9,11}$/)
    .withMessage('Phone must be 9-11 digits')
];

module.exports = {
  checkinValidation,
  getStreakValidation,
  recoverValidation,
  reviveValidation
};

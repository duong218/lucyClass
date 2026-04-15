const { body } = require('express-validator');

const minPhone = parseInt(process.env.STREAK_MIN_PHONE) || 9;
const maxPhone = parseInt(process.env.STREAK_MAX_PHONE) || 15;

const phoneValidation = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Số điện thoại là bắt buộc')
  .matches(/^\d+$/)
  .withMessage('Số điện thoại chỉ được chứa chữ số')
  .isLength({ min: minPhone, max: maxPhone })
  .withMessage(`Số điện thoại phải từ ${minPhone} đến ${maxPhone} ký tự`);

const streakValidation = [
  phoneValidation,
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên là bắt buộc')
    .isLength({ max: 80 })
    .withMessage('Tên quá dài'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
];

const checkinValidation = [
  phoneValidation
];

const reviveValidation = [
  phoneValidation
];

module.exports = {
  streakValidation,
  checkinValidation,
  reviveValidation
};

const { body } = require('express-validator');

const minPhone = parseInt(process.env.STREAK_MIN_PHONE) || 9;
const maxPhone = parseInt(process.env.STREAK_MAX_PHONE) || 15;

const phoneValidation = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Số điện thoại là bắt buộc')
  .matches(/^0(3|5|7|8|9)[0-9]{8}$/)
  .withMessage('Số điện thoại không hợp lệ (phải có 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09)');

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

const { body } = require('express-validator');

const registrationValidationRules = [
  body('parentName')
    .trim()
    .notEmpty()
    .withMessage('Tên phụ huynh là bắt buộc')
    .isLength({ max: 50 })
    .withMessage('Tên phụ huynh không được quá 50 ký tự'),
    
  body('childName')
    .trim()
    .notEmpty()
    .withMessage('Tên học sinh là bắt buộc')
    .isLength({ max: 50 })
    .withMessage('Tên học sinh không được quá 50 ký tự'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .matches(/^[0-9]{9,11}$/)
    .withMessage('Số điện thoại phải từ 9 đến 11 chữ số'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ'),

  body('courseId')
    .notEmpty()
    .withMessage('Vui lòng chọn khóa học')
    .isMongoId()
    .withMessage('Mã khóa học không hợp lệ')
];

module.exports = {
  registrationValidationRules
};

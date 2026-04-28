// registrationRoutes.js

const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const catchAsync = require('../utils/catchAsync');
const { validateCooldown } = require('../middlewares/validateRegistration'); // dùng 1 file duy nhất
const { registerLimiter } = require('../middlewares/rateLimiter');

router.get('/', auth, isAdmin, catchAsync(registrationController.getAll));
router.post('/export-excel', auth, isAdmin, catchAsync(registrationController.exportExcel));
router.get('/:id', auth, isAdmin, catchAsync(registrationController.getById));

// ✅ Bỏ registrationValidationRules + validate vì validateCooldown đã xử lý hết
router.post('/', registerLimiter, validateCooldown, catchAsync(registrationController.create));

router.get('/:id/students', auth, isAdmin, catchAsync(registrationController.getStudentsByCourse));
router.put('/:id', auth, isAdmin, catchAsync(registrationController.update));
router.put('/:id/remove', auth, isAdmin, catchAsync(registrationController.removeStudent));
router.delete('/:id', auth, isAdmin, catchAsync(registrationController.remove));

// ✅ Route ghi chú: cho phép cả admin và teacher truy cập
// Teacher chỉ được sửa note học sinh thuộc lớp mình phụ trách (kiểm tra trong controller)
router.put('/:id/note', auth, catchAsync(registrationController.updateNote));

module.exports = router;
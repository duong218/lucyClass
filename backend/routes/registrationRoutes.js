const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const catchAsync = require('../utils/catchAsync');
const { registrationValidationRules } = require('../validators/registrationValidator');
const validate = require('../middlewares/validate');
const csrfProtection = require('../middlewares/csrf');

// ✅ FIX: Import validateCooldown middleware
const { validateCooldown } = require('../middlewares/validateRegistration');
const { registerLimiter } = require('../middlewares/rateLimiter');

router.get('/', auth, isAdmin, catchAsync(registrationController.getAll));
router.post('/export-excel', auth, isAdmin, csrfProtection, catchAsync(registrationController.exportExcel));
router.get('/:id', auth, isAdmin, catchAsync(registrationController.getById));

// Validation -> Controller
// Both public and admin registration creation should be protected by CSRF
// ✅ FIX: Nhúng thẳng registerLimiter và validateCooldown vào Pipeline của router POST để kích hoạt Rate limit IP
router.post('/', registerLimiter, csrfProtection, validateCooldown, registrationValidationRules, validate, catchAsync(registrationController.create));
router.get('/:id/students', auth, isAdmin, catchAsync(registrationController.getStudentsByCourse));

router.put('/:id', auth, isAdmin, csrfProtection, catchAsync(registrationController.update));
router.put('/:id/remove', auth, isAdmin, csrfProtection, catchAsync(registrationController.removeStudent));
router.delete('/:id', auth, isAdmin, csrfProtection, catchAsync(registrationController.remove));

module.exports = router;

const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { teacherValidationRules, validate } = require('../middlewares/adminValidator');
const csrfProtection = require('../middlewares/csrf');

const catchAsync = require('../utils/catchAsync');

router.get('/', catchAsync(teacherController.getAll));
router.get('/:id', catchAsync(teacherController.getById));
router.post('/', auth, isAdmin, csrfProtection, upload.single('avatar'), validateMagicNumber, teacherValidationRules, validate, catchAsync(teacherController.create));
router.put('/:id', auth, isAdmin, csrfProtection, upload.single('avatar'), validateMagicNumber, teacherValidationRules, validate, catchAsync(teacherController.update));
router.delete('/:id', auth, isAdmin, csrfProtection, catchAsync(teacherController.remove));

module.exports = router;

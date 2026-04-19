const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const registrationController = require('../controllers/registrationController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { courseValidationRules, validate } = require('../middlewares/adminValidator');
const csrfProtection = require('../middlewares/csrf');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

const catchAsync = require('../utils/catchAsync');

router.get('/', cacheMiddleware(1), catchAsync(courseController.getAll));
router.get('/:id/students', auth, isAdmin, catchAsync(registrationController.getStudentsByCourse));
router.get('/:id', cacheMiddleware(1), catchAsync(courseController.getById));
router.post('/', auth, isAdmin, csrfProtection, upload.single('image'), validateMagicNumber, courseValidationRules, validate, catchAsync(courseController.create));
router.put('/:id', auth, isAdmin, csrfProtection, upload.single('image'), validateMagicNumber, courseValidationRules, validate, catchAsync(courseController.update));
router.delete('/:id', auth, isAdmin, csrfProtection, catchAsync(courseController.remove));

module.exports = router;

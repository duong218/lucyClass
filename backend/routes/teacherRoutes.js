const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { teacherValidationRules, validate } = require('../middlewares/adminValidator');
const { apiLimiter } = require('../middlewares/rateLimiter');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

const catchAsync = require('../utils/catchAsync');

router.get('/', cacheMiddleware(300), catchAsync(teacherController.getAll));
router.get('/:id', cacheMiddleware(300), catchAsync(teacherController.getById));
router.post('/', apiLimiter, auth, isAdmin, upload.single('avatar'), validateMagicNumber, teacherValidationRules, validate, catchAsync(teacherController.create));
router.put('/:id', apiLimiter, auth, isAdmin, upload.single('avatar'), validateMagicNumber, teacherValidationRules, validate, catchAsync(teacherController.update));
router.delete('/:id', apiLimiter, auth, isAdmin, catchAsync(teacherController.remove));

module.exports = router;

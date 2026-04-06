const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const csrfProtection = require('../middlewares/csrf');

const catchAsync = require('../utils/catchAsync');

router.get('/', catchAsync(feedbackController.getAll));
router.get('/:id', catchAsync(feedbackController.getById));
router.post('/', auth, isAdmin, csrfProtection, upload.single('photo'), validateMagicNumber, catchAsync(feedbackController.create));
router.put('/:id', auth, isAdmin, csrfProtection, upload.single('photo'), validateMagicNumber, catchAsync(feedbackController.update));
router.delete('/:id', auth, isAdmin, csrfProtection, catchAsync(feedbackController.remove));

module.exports = router;

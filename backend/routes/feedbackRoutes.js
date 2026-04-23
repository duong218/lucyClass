const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

const catchAsync = require('../utils/catchAsync');

router.get('/', cacheMiddleware(300), catchAsync(feedbackController.getAll));
router.get('/:id', cacheMiddleware(300), catchAsync(feedbackController.getById));
router.post('/', auth, isAdmin, upload.single('photo'), validateMagicNumber, catchAsync(feedbackController.create));
router.put('/:id', auth, isAdmin, upload.single('photo'), validateMagicNumber, catchAsync(feedbackController.update));
router.delete('/:id', auth, isAdmin, catchAsync(feedbackController.remove));

module.exports = router;

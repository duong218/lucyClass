const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

const catchAsync = require('../utils/catchAsync');

router.get('/', cacheMiddleware(60), catchAsync(announcementController.getAll));
router.post('/', auth, isAdmin, upload.single('image'), validateMagicNumber, catchAsync(announcementController.create));
router.put('/:id', auth, isAdmin, upload.single('image'), validateMagicNumber, catchAsync(announcementController.update));
router.delete('/:id', auth, isAdmin, catchAsync(announcementController.remove));

module.exports = router;

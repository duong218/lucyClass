const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const catchAsync = require('../utils/catchAsync');

// ─── Public ────────────────────────────────────────────────────────────────
router.get('/', cacheMiddleware(60), catchAsync(announcementController.getAll));

// ✅ NEW: không cache — dùng cho bell icon polling (admin/staff)
// Đặt trước /:id để Express không nhầm "latest" thành một ObjectId
router.get('/latest', auth, catchAsync(announcementController.getLatest));

// ✅ NEW: đánh dấu đã xem khi admin mở dropdown
router.patch('/mark-seen', auth, catchAsync(announcementController.markSeen));

// ─── Admin only ─────────────────────────────────────────────────────────────
router.post('/', auth, isAdmin, upload.single('image'), validateMagicNumber, catchAsync(announcementController.create));
router.put('/:id', auth, isAdmin, upload.single('image'), validateMagicNumber, catchAsync(announcementController.update));
router.delete('/:id', auth, isAdmin, catchAsync(announcementController.remove));

module.exports = router;

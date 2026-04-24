const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const catchAsync = require('../utils/catchAsync');

// ─── Public ─────────────────────────────────────────────────────────────────
// Chỉ trả về status: published (controller đã filter)
router.get('/', cacheMiddleware(60), catchAsync(announcementController.getAll));

// ─── Auth required (admin + staff) ──────────────────────────────────────────
// Đặt trước /:id để Express không nhầm sang ObjectId lookup
router.get('/latest',     auth, catchAsync(announcementController.getLatest));
router.patch('/mark-seen', auth, catchAsync(announcementController.markSeen));

// ─── Admin: xem danh sách pending ───────────────────────────────────────────
router.get('/pending', auth, isAdmin, catchAsync(announcementController.getPending));

// ─── Marketing: xem lịch sử submission của mình ─────────────────────────────
router.get('/my', auth, catchAsync(announcementController.getMySubmissions));

// ─── Admin: duyệt hoặc từ chối ──────────────────────────────────────────────
router.patch('/:id/review', auth, isAdmin, catchAsync(announcementController.reviewAnnouncement));

// ─── Marketing: gửi bài chờ duyệt ───────────────────────────────────────────
router.post(
  '/submit',
  auth,
  authorizeRoles('marketing'),
  upload.single('image'),
  validateMagicNumber,
  catchAsync(announcementController.submitByMkt)
);

// ─── Admin: CRUD trực tiếp ───────────────────────────────────────────────────
router.post('/',    auth, isAdmin, upload.single('image'), validateMagicNumber, catchAsync(announcementController.create));
router.put('/:id',  auth, isAdmin, upload.single('image'), validateMagicNumber, catchAsync(announcementController.update));
router.delete('/:id', auth, isAdmin, catchAsync(announcementController.remove));

module.exports = router;
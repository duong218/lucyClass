const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const registrationController = require('../controllers/registrationController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { upload, validateMagicNumber } = require('../middlewares/upload');
const { courseValidationRules, validate } = require('../middlewares/adminValidator');
const csrfProtection = require('../middlewares/csrf');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const catchAsync = require('../utils/catchAsync');

// ── Public / cached ────────────────────────────────────────────────────────
router.get('/', cacheMiddleware(300), catchAsync(courseController.getAll));
router.get('/:id', cacheMiddleware(300), catchAsync(courseController.getById));

// ── Xem danh sách học sinh theo lớp (admin + teacher đều dùng) ────────────
router.get(
  '/:id/students',
  auth,
  authorizeRoles('admin', 'teacher'),
  catchAsync(registrationController.getStudentsByCourse)
);

// ── Export Excel điểm danh (teacher + admin) ────────────────────────────
router.get(
  '/:id/attendance/export-excel',
  auth,
  authorizeRoles('admin', 'teacher'),
  catchAsync(courseController.exportAttendanceExcel)
);

// ── Điểm danh (teacher + admin) ───────────────────────────────────────────
router.get(
  '/:id/attendance',
  auth,
  authorizeRoles('admin', 'teacher'),
  catchAsync(courseController.getAttendance)
);

router.post(
  '/:id/attendance',
  auth,
  authorizeRoles('admin', 'teacher'),
  csrfProtection,
  catchAsync(courseController.saveAttendance)
);

// ── Chuyển lớp học viên (admin only) ──────────────────────────────────────
// ⚠️  PHẢI đặt TRƯỚC router.put('/:id') — nếu không Express sẽ hiểu
//     "students" là một courseId và gọi nhầm courseController.update
router.put(
  '/students/:id/transfer',
  auth, isAdmin, csrfProtection,
  catchAsync(registrationController.transferStudent)
);

// ── Admin only ─────────────────────────────────────────────────────────────
router.post(
  '/',
  auth, isAdmin, csrfProtection,
  upload.single('image'), validateMagicNumber,
  courseValidationRules, validate,
  catchAsync(courseController.create)
);
router.put(
  '/:id',
  auth, isAdmin, csrfProtection,
  upload.single('image'), validateMagicNumber,
  courseValidationRules, validate,
  catchAsync(courseController.update)
);
router.delete(
  '/:id',
  auth, isAdmin, csrfProtection,
  catchAsync(courseController.remove)
);

module.exports = router;

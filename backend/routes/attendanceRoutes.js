const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const catchAsync = require('../utils/catchAsync');
const { toggleAttendanceLimiter } = require('../middlewares/rateLimiter');

router.post(
  '/toggle',
  auth,
  authorizeRoles('teacher', 'marketing'),
  toggleAttendanceLimiter,
  catchAsync(attendanceController.toggleAttendance)
);

router.get(
  '/today',
  auth,
  authorizeRoles('teacher', 'marketing'),
  catchAsync(attendanceController.getTodayAttendance)
);

router.get(
  '/history',
  auth,
  authorizeRoles('teacher', 'marketing'),
  catchAsync(attendanceController.getAttendanceHistory)
);

router.get(
  '/date/:date',
  auth,
  authorizeRoles('admin'),
  catchAsync(attendanceController.getAttendanceByDate)
);

router.get(
  '/export',
  auth,
  authorizeRoles('admin'),
  catchAsync(attendanceController.exportAttendance)
);

router.get(
  '/export-month',
  auth,
  authorizeRoles('admin'),
  catchAsync(attendanceController.exportAttendanceByMonth)
);

router.put(
  '/:id',
  auth,
  authorizeRoles('admin'),
  catchAsync(attendanceController.updateAttendance)
);

router.post(
  '/admin/upsert',
  auth,
  authorizeRoles('admin'),
  catchAsync(attendanceController.upsertAttendanceByDate)
);

module.exports = router;

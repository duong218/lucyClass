const express = require('express');
const router  = express.Router();
const c = require('../controllers/salaryController');
const auth          = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const catchAsync    = require('../utils/catchAsync');

// Tất cả routes đều yêu cầu đăng nhập
router.use(auth);

// ─── Salary Config (chỉ admin) ───────────────────────────────────────────────
router.get(  '/config',        authorizeRoles('admin'), catchAsync(c.getSalaryConfig));
router.post( '/config/seed',   authorizeRoles('admin'), catchAsync(c.seedSalaryConfig));
router.put(  '/config/:id',    authorizeRoles('admin'), catchAsync(c.updateSalaryConfig));
router.get(  '/config/logs',   authorizeRoles('admin'), catchAsync(c.getSalaryConfigLogs));
router.get(  '/settings',      authorizeRoles('admin'), catchAsync(c.getSalarySettings));
router.put(  '/settings',      authorizeRoles('admin'), catchAsync(c.updateSalarySettings));

// ─── Session Teachers ────────────────────────────────────────────────────────
// Đọc: admin + teacher (teacher cần xem lịch của mình)
router.get(    '/session-teachers/:cellId',         authorizeRoles('admin', 'teacher'), catchAsync(c.getSessionTeachers));
// Ghi: chỉ admin
router.put(    '/session-teachers/:cellId',         authorizeRoles('admin'), catchAsync(c.upsertSessionTeachers));
router.delete( '/session-teachers/:cellId',         authorizeRoles('admin'), catchAsync(c.deleteSessionTeachers));
router.post(   '/session-teachers/:cellId/change-teacher', authorizeRoles('admin'), catchAsync(c.changeTeacher));

// ─── Engine ghép ca ─────────────────────────────────────────────────────────
router.post('/run-engine', authorizeRoles('admin'), catchAsync(c.runEngine));

// ─── Salary Report ───────────────────────────────────────────────────────────
router.get('/report', authorizeRoles('admin'), catchAsync(c.getSalaryReport));
router.get('/export', authorizeRoles('admin'), catchAsync(c.exportSalaryExcel));

// ─── Bonus ────────────────────────────────────────────────────────────────────
router.get(    '/bonus',     authorizeRoles('admin'), catchAsync(c.getBonuses));
router.post(   '/bonus',     authorizeRoles('admin'), catchAsync(c.createBonus));
router.delete( '/bonus/:id', authorizeRoles('admin'), catchAsync(c.deleteBonus));

// ─── Helper: GV theo khóa học (admin gọi khi mở CellPopover) ─────────────────
router.get('/course-teachers/:courseId', authorizeRoles('admin'), catchAsync(c.getCourseTeachers));

module.exports = router;
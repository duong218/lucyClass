const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const authorizeRoles = require('../middlewares/authorizeRoles');
const csrfProtection = require('../middlewares/csrf');
const catchAsync = require('../utils/catchAsync');

// ── Admin-only routes ─────────────────────────────────────────────────────────
// Quản lý tài khoản staff (chỉ admin được truy cập)

router.get('/', auth, isAdmin, catchAsync(staffController.getAll));
router.get('/:id', auth, isAdmin, catchAsync(staffController.getById));
router.post('/', auth, isAdmin, csrfProtection, catchAsync(staffController.create));
router.put('/:id', auth, isAdmin, csrfProtection, catchAsync(staffController.update));
router.put('/:id/reset-password', auth, isAdmin, csrfProtection, catchAsync(staffController.resetPasswordByAdmin));
router.delete('/:id', auth, isAdmin, csrfProtection, catchAsync(staffController.remove));
router.delete('/:id/permanent', auth, isAdmin, csrfProtection, catchAsync(staffController.permanentDelete));

// ── Staff-only route ──────────────────────────────────────────────────────────
// Xem thông tin cá nhân (teacher và marketing tự xem)
// Route này mount ở /api/me/profile — xem staffDashboardRoutes.js

module.exports = router;

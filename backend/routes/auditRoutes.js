const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const catchAsync = require('../utils/catchAsync');

// ── Lịch sử thao tác admin ────────────────────────────────────────────────────
router.get('/', auth, isAdmin, catchAsync(auditController.getHistory));
router.get('/stats', auth, isAdmin, catchAsync(auditController.getStats));
router.post('/export', auth, isAdmin, catchAsync(auditController.exportCSV));

// ── Hoạt động đăng nhập / reset mật khẩu (MỚI) ───────────────────────────────
router.get('/login-activity', auth, isAdmin, catchAsync(auditController.getLoginActivity));

// ── Cảnh báo bảo mật ──────────────────────────────────────────────────────────
router.get('/security-alerts', auth, isAdmin, catchAsync(auditController.getSecurityAlerts));
router.get('/security-stats', auth, isAdmin, catchAsync(auditController.getSecurityStats));
router.post('/block-ip', auth, isAdmin, catchAsync(auditController.blockIP));
router.delete('/block-ip/:ip', auth, isAdmin, catchAsync(auditController.unblockIP));

module.exports = router;
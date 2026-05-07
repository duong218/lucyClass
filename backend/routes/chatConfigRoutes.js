const express = require('express');

const router = express.Router();
const { publicLimiter, aiProxyLimiter } = require('../middlewares/rateLimiter');
const {
  getConfig,
  getAdminConfig,
  updateConfig,
  askAssistant,
} = require('../controllers/chatConfigController');
const protect = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const verifyRecaptcha = require('../middlewares/verifyRecaptcha');

router.get('/', getConfig);
router.get('/admin', protect, authorizeRoles('admin'), getAdminConfig);

// POST /api/chat-config/ask
// Lớp bảo vệ theo thứ tự:
//   1. aiProxyLimiter  — chặn flood theo IP (10 req/phút)
//   2. verifyRecaptcha — xác thực token v3 từ frontend, lọc bot tự động
router.post('/ask', aiProxyLimiter, verifyRecaptcha('chat'), askAssistant);

router.put('/', protect, authorizeRoles('admin'), updateConfig);

module.exports = router;
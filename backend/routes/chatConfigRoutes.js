const express = require('express');

const router = express.Router();
const { publicLimiter } = require('../middlewares/rateLimiter');
const {
  getConfig,
  getAdminConfig,
  updateConfig,
  askAssistant,
} = require('../controllers/chatConfigController');
const protect = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');

router.get('/', getConfig);
router.get('/admin', protect, authorizeRoles('admin'), getAdminConfig);
router.post('/ask', publicLimiter, askAssistant);
router.put('/', protect, authorizeRoles('admin'), updateConfig);

module.exports = router;

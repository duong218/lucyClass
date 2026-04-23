/**
 * syncRoutes.js
 *
 * Trong server.js thêm:
 *   const syncRoutes = require('./routes/syncRoutes');
 *   app.use('/api/sync', syncRoutes);
 */

const express = require('express');
const router = express.Router();
const { syncRankings, deepClean } = require('../controllers/syncController');
const authenticate = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

// POST /api/sync/rankings     → dọn ranking orphan + cũ (nhanh)
router.post('/rankings', authenticate, isAdmin, syncRankings);

// POST /api/sync/deep-clean   → deep clean toàn bộ (chậm hơn)
router.post('/deep-clean', authenticate, isAdmin, deepClean);

module.exports = router;
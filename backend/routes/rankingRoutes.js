const express = require('express');
const rankingController = require('../controllers/rankingController');
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

const router = express.Router();

// verifyCSRF đã được apply globally trong server.js
router.post('/',
  auth,
  authorizeRoles('admin'),
  rankingController.createOrUpdateRanking);
router.get('/top', cacheMiddleware(300), rankingController.getTopRankings);

module.exports = router;
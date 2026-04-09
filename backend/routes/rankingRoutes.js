const express = require('express');
const rankingController = require('../controllers/rankingController');
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { verifyCSRF } = require('../middlewares/securityMiddleware');

const router = express.Router();
const csrfForRankingPost = process.env.NODE_ENV === 'production'
  ? verifyCSRF
  : (req, res, next) => next();

router.post('/', 
  auth,
  authorizeRoles('teacher', 'admin'),
  csrfForRankingPost,
  rankingController.createOrUpdateRanking);
router.get('/top', rankingController.getTopRankings);

module.exports = router;

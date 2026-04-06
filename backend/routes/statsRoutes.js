const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const catchAsync = require('../utils/catchAsync');

router.get('/', auth, isAdmin, catchAsync(statsController.getStats));
router.get('/dashboard', auth, isAdmin, catchAsync(statsController.getDashboardData));

module.exports = router;

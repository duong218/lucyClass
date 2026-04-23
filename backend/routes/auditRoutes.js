const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const catchAsync = require('../utils/catchAsync');

router.get('/', auth, isAdmin, catchAsync(auditController.getHistory));
router.get('/stats', auth, isAdmin, catchAsync(auditController.getStats));
router.post('/export', auth, isAdmin, catchAsync(auditController.exportCSV));

module.exports = router;

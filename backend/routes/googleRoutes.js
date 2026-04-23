const express = require('express');
const router = express.Router();
const googleController = require('../controllers/google.controller');
const restoreController = require('../controllers/restore.controller');
const auth = require('../middlewares/auth'); // Middleware chuẩn từ app
const isAdmin = require('../middlewares/isAdmin');
const { heavyOpLimiter } = require('../middlewares/rateLimiter');

router.use((req, res, next) => {
  console.log("Incoming request:", req.originalUrl);
  next();
});

const catchAsync = require('../utils/catchAsync');


//router.get('/auth', auth, isAdmin, googleController.redirectToGoogle);
router.get('/auth', auth, isAdmin, googleController.redirectToGoogle);
router.get('/callback', googleController.handleGoogleCallback);
router.post('/backup', auth, isAdmin, heavyOpLimiter, catchAsync(googleController.backupToDrive));

// Restore routes
router.get('/backups', auth, isAdmin, catchAsync(restoreController.listBackups));
router.post('/restore', auth, isAdmin, heavyOpLimiter, catchAsync(restoreController.restoreBackup));

module.exports = router;

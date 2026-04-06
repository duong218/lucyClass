const express = require('express');
const router = express.Router();
const googleController = require('../controllers/google.controller');
const restoreController = require('../controllers/restore.controller');
const auth = require('../middlewares/auth'); // Middleware chuẩn từ app
const isAdmin = require('../middlewares/isAdmin');

router.use((req, res, next) => {
  console.log("Incoming request:", req.originalUrl);
  next();
});

const catchAsync = require('../utils/catchAsync');

const csrfProtection = require('../middlewares/csrf');

//router.get('/auth', auth, isAdmin, googleController.redirectToGoogle);
router.get('/auth', auth, isAdmin, googleController.redirectToGoogle);
router.get('/callback', googleController.handleGoogleCallback);
router.post('/backup', auth, isAdmin, csrfProtection, catchAsync(googleController.backupToDrive));

// Restore routes
router.get('/backups', auth, isAdmin, catchAsync(restoreController.listBackups));
router.post('/restore', auth, isAdmin, csrfProtection, catchAsync(restoreController.restoreBackup));

module.exports = router;

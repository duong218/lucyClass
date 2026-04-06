const express = require('express');
const router = express.Router();
const restoreController = require('../controllers/restore.controller');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const csrfProtection = require('../middlewares/csrf');

// All restore routes require admin auth
router.use(auth, isAdmin);

/**
 * @route GET /api/restore/progress
 * @desc Get the progress of the current restore process
 */
router.get('/progress', restoreController.getRestoreProgress);

/**
 * @route POST /api/restore/execute
 * @desc Manually trigger a restore (if needed, though Dashboard uses googleRoutes)
 * Note: Dashboard currently uses /api/auth/google/restore, but we could migrate it here.
 */
// router.post('/execute', csrfProtection, restoreController.restoreBackup);

module.exports = router;

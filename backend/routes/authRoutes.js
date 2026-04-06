const auth = require('../middlewares/auth');
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const csrfProtection = require('../middlewares/csrf');
const { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } = require('../middlewares/rateLimiter');

const catchAsync = require('../utils/catchAsync');

router.get('/me', auth, (req, res) => {
  console.log(`[/api/auth/me] Returning user data for: ${req.user.username}`);
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role, email: req.user.email } });
});

// Auth POST routes - CSRF is intentionally SKIPPED here to prevent session recovery blocks
router.post('/login', loginLimiter, catchAsync(authController.login));
router.post('/logout', auth, catchAsync(authController.logout));
router.post('/refresh-token', catchAsync(authController.refreshToken));

// Sensitive data-changing routes - CSRF REQUIRED
router.post('/forgot-password', forgotPasswordLimiter, csrfProtection, catchAsync(authController.forgotPassword));
router.post('/reset-password/:token', resetPasswordLimiter, csrfProtection, catchAsync(authController.resetPassword));

// Check session conflict (proactive polling)
router.get('/check-session', auth, authController.checkSession);

module.exports = router;

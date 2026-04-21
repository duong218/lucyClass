const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const catchAsync = require('../utils/catchAsync');

// GET /api/me/profile — teacher hoặc marketing xem thông tin cá nhân
router.get(
  '/profile',
    auth,
    authorizeRoles('teacher', 'marketing'),
    catchAsync(staffController.getMyProfile)
);

module.exports = router;
const express = require('express');

const controller = require('../controllers/streakController');
const validate = require('../middlewares/validate');
const { streakLimiter } = require('../middlewares/rateLimiter');
const streakAuth = require('../middlewares/streakAuth');
const {
  startValidation,
  checkinValidation
} = require('../validators/streakValidator');

const router = express.Router();

router.post(
  '/start',
  streakLimiter,
  startValidation,
  validate,
  controller.startStreak
);

router.get(
  '/me',
  streakAuth,
  streakLimiter,
  controller.getStreak
);

router.post(
  '/checkin',
  streakAuth,
  streakLimiter,
  checkinValidation,
  validate,
  controller.checkIn
);

module.exports = router;

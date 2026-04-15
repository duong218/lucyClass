const express = require('express');

const controller = require('../controllers/streakController');
const validate = require('../middlewares/validate');
const { streakLimiter } = require('../middlewares/rateLimiter');
const {
  streakValidation,
  checkinValidation,
  reviveValidation
} = require('../validators/streakValidator');

const router = express.Router();

router.post(
  '/start',
  streakLimiter,
  streakValidation,
  validate,
  controller.startStreak
);

router.get(
  '/me',
  streakLimiter,
  controller.getStreak
);

router.post(
  '/checkin',
  streakLimiter,
  checkinValidation,
  validate,
  controller.checkIn
);

router.post(
  '/revive',
  streakLimiter,
  reviveValidation,
  validate,
  controller.reviveStreak
);

module.exports = router;

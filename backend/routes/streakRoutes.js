const express = require('express');
const router = express.Router();

const controller = require('../controllers/streakController');
const validate = require('../middlewares/validate');

const {
  checkinValidation,
  getStreakValidation,
  recoverValidation,
  reviveValidation
} = require('../validators/streakValidator');

const { streakLimiter } = require('../middlewares/rateLimiter');

router.post(
  '/checkin',
  streakLimiter,
  checkinValidation,
  validate,
  controller.checkIn
);

router.post(
  '/recover',
  streakLimiter,
  recoverValidation,
  validate,
  controller.recoverStreak
);

router.post(
  '/revive',
  streakLimiter,
  reviveValidation,
  validate,
  controller.reviveStreak
);

router.get(
  '/:phone',
  streakLimiter,
  getStreakValidation,
  validate,
  controller.getStreak
);

module.exports = router;

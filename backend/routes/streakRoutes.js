const express = require('express');

const controller = require('../controllers/streakController');
const validate = require('../middlewares/validate');
const { streakLimiter } = require('../middlewares/rateLimiter');
const {
  phoneDiversityLimiter,
  phoneSpamLimiter,
  ipActionLimiter
} = require('../middlewares/phoneLimiter');
const {
  streakValidation,
  checkinValidation,
  reviveValidation
} = require('../validators/streakValidator');

const router = express.Router();

router.post(
  '/start',
  streakLimiter,
  ipActionLimiter,
  phoneDiversityLimiter,
  phoneSpamLimiter,
  streakValidation,
  validate,
  controller.startStreak
);

router.get(
  '/me',
  streakLimiter,
  controller.getStreak
);

router.get(
  '/leaderboard',
  streakLimiter,
  controller.getLeaderboard
);

router.post(
  '/checkin',
  streakLimiter,
  phoneSpamLimiter,
  checkinValidation,
  validate,
  controller.checkIn
);

router.post(
  '/revive',
  streakLimiter,
  phoneSpamLimiter,
  reviveValidation,
  validate,
  controller.reviveStreak
);

router.get(
  '/leaderboard-weekly',
  streakLimiter,
  controller.getWeeklyLeaderboard
);

module.exports = router;

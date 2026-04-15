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
const streakAuth = require('../middlewares/streakAuth');

router.post(
  '/checkin',
  streakAuth,
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
  streakAuth,
  streakLimiter,
  reviveValidation,
  validate,
  controller.reviveStreak
);

router.get(
  '/me',
  streakAuth,
  streakLimiter,
  controller.getStreak
);

router.post('/login', controller.loginStreak);

module.exports = router;

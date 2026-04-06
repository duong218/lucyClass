const Log = require('../models/Log');

/**
 * Helper to log admin actions
 * @param {Object} req - Express request object
 * @param {string} action - Action name (e.g. LOGIN, CREATE_COURSE)
 * @param {Object} metadata - Optional additional data
 */
const logAction = async (req, action, metadata = {}) => {
  try {
    await Log.create({
      action,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata
    });
  } catch (error) {
    console.error('Logging failed:', error.message);
  }
};

module.exports = { logAction };

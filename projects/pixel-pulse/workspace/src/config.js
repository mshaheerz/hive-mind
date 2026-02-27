/**
 * @fileoverview Centralised configuration and constants for the Pixel Pulse service.
 * All environment variables are loaded via dotenv and exposed as immutable constants.
 */

require('dotenv').config();

/**
 * Application level constants.
 * @type {Object}
 */
const CONFIG = Object.freeze({
  /** Port the Express server listens on */
  PORT: parseInt(process.env.PORT, 10) || 3000,

  /** MongoDB connection URI */
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pixel-pulse',

  /** Directory where screenshots and baselines are stored */
  STORAGE_PATH: process.env.STORAGE_PATH || 'storage',

  /** Email settings for alerting */
  EMAIL_FROM: process.env.EMAIL_FROM || 'pixel-pulse@example.com',
  EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST || '',
  EMAIL_SMTP_PORT: parseInt(process.env.EMAIL_SMTP_PORT, 10) || 587,
  EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER || '',
  EMAIL_SMTP_PASS: process.env.EMAIL_SMTP_PASS || '',
  /** Threshold (percentage) above which a diff is considered a regression */
  DIFF_THRESHOLD: parseFloat(process.env.DIFF_THRESHOLD) || 0.1
});

module.exports = CONFIG;

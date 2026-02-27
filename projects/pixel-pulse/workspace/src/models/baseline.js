/**
 * @fileoverview Mongoose schema for baseline screenshots.
 * A baseline is a reference image against which future captures are compared.
 */

const mongoose = require('mongoose');

const BaselineSchema = new mongoose.Schema(
  {
    /** Human readable name (e.g., "homepage‑desktop") */
    name: { type: String, required: true, unique: true },

    /** Relative path inside the storage folder */
    imagePath: { type: String, required: true },

    /** Creation timestamp */
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'baselines' }
);

module.exports = mongoose.model('Baseline', BaselineSchema);

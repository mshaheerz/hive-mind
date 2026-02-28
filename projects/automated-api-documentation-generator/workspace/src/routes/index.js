/**
 * @swagger/index.js - Sample API endpoint documentation
 */
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Returns the list of users
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get('/', (req, res) => {
  res.json({ message: 'API Documentation Example' });
});

module.exports = router;

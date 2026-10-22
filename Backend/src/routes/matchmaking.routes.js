const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { joinQueue, leaveQueue } = require('../controllers/matchmaking.controller');
const { runMatchmaking } = require('../services/matchmaking.service');

// Both routes require the user to be authenticated
router.post('/join', requireAuth, joinQueue);
router.post('/leave', requireAuth, leaveQueue);

// Admin/Test route to trigger the engine manually
router.post('/run', async (req, res) => {
  try {
    const result = await runMatchmaking();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Engine failed' });
  }
});
module.exports = router;
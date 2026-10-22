const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { startBattle, resetBattleTimer } = require('../controllers/battle.controller');

// POST /api/battles/start - Team starts a challenge
router.post('/start', requireAuth, startBattle);

// POST /api/battles/reset-timer - Reset battle countdown timer to 8 hours
router.post('/reset-timer', requireAuth, resetBattleTimer);

module.exports = router;
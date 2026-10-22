const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { startBattle } = require('../controllers/battle.controller');

// POST /api/battles/start - Team starts a challenge
router.post('/start', requireAuth, startBattle);

module.exports = router;
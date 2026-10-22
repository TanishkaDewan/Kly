const express = require('express');
const router = express.Router();
const { getTeamLeaderboard, getPlayerLeaderboard } = require('../controllers/leaderboard.controller');

// GET /api/leaderboard/teams - Top 100 teams
router.get('/teams', getTeamLeaderboard);

// GET /api/leaderboard/players - Top 100 players
router.get('/players', getPlayerLeaderboard);

module.exports = router;
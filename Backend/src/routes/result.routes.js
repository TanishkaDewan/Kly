const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { getTeamResults } = require('../controllers/result.controller');

// GET /api/results/teams/:teamId - Get battle history and results for a team
router.get('/teams/:teamId', requireAuth, getTeamResults);

module.exports = router;
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { getCurrentTeam, acceptTeam, rejectTeam } = require('../controllers/team.controller');

// All team actions require the user to be authenticated
router.get('/current', requireAuth, getCurrentTeam);
router.post('/:id/accept', requireAuth, acceptTeam);
router.post('/:id/reject', requireAuth, rejectTeam);

module.exports = router;
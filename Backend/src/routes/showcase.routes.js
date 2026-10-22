const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { optInToShowcase, getPublicShowcase } = require('../controllers/showcase.controller');

// GET /api/showcase - Public route (anyone can view the showcase)
router.get('/', getPublicShowcase);

// POST /api/showcase/opt-in - Protected route (team members only)
router.post('/opt-in', requireAuth, optInToShowcase);

module.exports = router;
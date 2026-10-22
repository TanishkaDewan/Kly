const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { submitChallenge } = require('../controllers/submission.controller');

// POST /api/submissions - Submit a completed challenge
router.post('/', requireAuth, submitChallenge);

module.exports = router;
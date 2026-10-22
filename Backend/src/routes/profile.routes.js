const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { getMyProfile, upsertMyProfile, getAllSkills } = require('../controllers/profile.controller');

// Public catalog endpoint for available skills
router.get('/skills', getAllSkills);

// Protected user profile endpoints (requires the user to be logged in)
router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, upsertMyProfile);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getAllChallenges, getChallengeBySlug } = require('../controllers/challenge.controller');

// GET /api/challenges - Fetch the list of all challenges
router.get('/', getAllChallenges);

// GET /api/challenges/:slug - Fetch a single challenge by its slug
router.get('/:slug', getChallengeBySlug);

module.exports = router;
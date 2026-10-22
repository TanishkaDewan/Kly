const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { triggerEvaluation } = require('../controllers/evaluation.controller');

// POST /api/evaluations/run - Trigger the grading orchestration
router.post('/run', requireAuth, triggerEvaluation);

module.exports = router;
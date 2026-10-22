const { runEvaluation } = require('../services/evaluation.service');

/**
 * POST /api/evaluations/run
 * Triggers the AI evaluation and scoring process for a specific submission.
 * (In a production environment, this should be protected by an Admin middleware)
 */
const triggerEvaluation = async (req, res) => {
  try {
    const { submission_id } = req.body;

    if (!submission_id) {
      return res.status(400).json({ error: 'BadRequest', message: 'submission_id is required.' });
    }

    console.log(`[Evaluation Controller] Starting evaluation for submission: ${submission_id}`);
    
    // Call our orchestration service
    const result = await runEvaluation(submission_id);

    return res.status(200).json({
      message: 'Evaluation completed successfully!',
      data: result
    });

  } catch (err) {
    console.error('[TriggerEvaluation Error]:', err.message);
    return res.status(500).json({ 
      error: 'InternalServerError', 
      message: err.message || 'Failed to run evaluation.' 
    });
  }
};

module.exports = {
  triggerEvaluation
};
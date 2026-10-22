const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/results/teams/:teamId
 * Fetches the battle results, AI evaluation status, and XP for a specific team.
 */
const getTeamResults = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({ error: 'BadRequest', message: 'teamId is required.' });
    }

    // Fetch the team's submissions along with battle details, full AI evaluation, and contribution analysis
    const { data: results, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        id, 
        repo_url, 
        status, 
        team_xp_awarded,
        submitted_at,
        battles (
          id,
          challenges ( id, title, difficulty )
        ),
        evaluations (
          id,
          total_score,
          feedback_summary,
          strengths,
          weaknesses,
          recommendations,
          raw_ai_response,
          evaluation_scores (
            dimension,
            raw_score,
            weight,
            weighted_score,
            status
          ),
          contribution_analysis (
            profile_id,
            github_username,
            estimated_percentage,
            summary,
            signals
          )
        )
      `)
      .eq('team_id', teamId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    // Format results to provide backward compatibility with frontend expectations
    const formattedResults = (results || []).map((sub) => {
      const evalData = Array.isArray(sub.evaluations) ? sub.evaluations[0] : sub.evaluations;
      const contributions = evalData?.contribution_analysis || [];

      const formattedScores = (evalData?.evaluation_scores || []).map((score) => {
        const raw = score.raw_score;
        // If raw_score is stored on 0-5 scale, normalize to 0-100 for presentation
        const normalized = typeof raw === 'number' && raw <= 5.0
          ? Math.round((raw / 5.0) * 100 * 10) / 10
          : raw;
        return {
          ...score,
          dimension_score: score.dimension_score ?? normalized
        };
      });

      const formattedEval = evalData ? {
        ...evalData,
        evaluation_scores: formattedScores
      } : null;

      return {
        ...sub,
        github_url: sub.repo_url, // Backward compatibility alias
        evaluation: formattedEval,
        contributions,
        // Legacy alias for frontend components expecting submission_contributions format
        submission_contributions: contributions.map((c) => ({
          profile_id: c.profile_id,
          contribution_percentage: c.estimated_percentage,
          individual_xp_awarded: c.signals?.individual_xp_awarded || 0,
          profiles: { github_username: c.github_username }
        }))
      };
    });

    return res.status(200).json({
      message: 'Team results fetched successfully',
      results: formattedResults
    });

  } catch (err) {
    console.error('[GetTeamResults Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch team results.' });
  }
};

module.exports = {
  getTeamResults
};
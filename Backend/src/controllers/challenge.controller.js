const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/challenges
 * Fetch all available challenges for the lobby
 */
const getAllChallenges = async (req, res) => {
  try {
    const { data: challenges, error } = await supabaseAdmin
      .from('challenges')
      .select('id, title, slug, description, difficulty, category, time_limit_minutes, start_time, end_time')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(challenges);
  } catch (err) {
    console.error('[GetAllChallenges Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch challenges.' });
  }
};

/**
 * GET /api/challenges/:slug
 * Fetch a specific challenge by its slug (for the challenge details page)
 */
const getChallengeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data: challenge, error } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Supabase code for "no rows returned"
        return res.status(404).json({ error: 'NotFound', message: 'Challenge not found.' });
      }
      throw error;
    }

    return res.status(200).json(challenge);
  } catch (err) {
    console.error('[GetChallengeBySlug Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch challenge details.' });
  }
};

module.exports = {
  getAllChallenges,
  getChallengeBySlug
};
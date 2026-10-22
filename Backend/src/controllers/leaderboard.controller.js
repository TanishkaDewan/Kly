const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/leaderboard/teams
 * Fetches the global team leaderboard
 */
const getTeamLeaderboard = async (req, res) => {
  try {
    const { data: teams, error } = await supabaseAdmin
      .from('teams')
      .select('id, name, total_xp')
      .order('total_xp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.status(200).json(teams);
  } catch (err) {
    console.error('[Team Leaderboard Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch team leaderboard.' });
  }
};

/**
 * GET /api/leaderboard/players
 * Fetches the global individual player leaderboard
 */
const getPlayerLeaderboard = async (req, res) => {
  try {
    // Primary query uses canonical user_stats joined with profile info
    const { data: statsData, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select(`
        xp,
        rating,
        battles_won,
        battles_played,
        profiles (
          id,
          full_name,
          username,
          github_username,
          avatar_url
        )
      `)
      .order('xp', { ascending: false })
      .limit(100);

    if (statsError) throw statsError;

    const formatted = (statsData || []).map((s) => ({
      id: s.profiles?.id,
      full_name: s.profiles?.full_name,
      username: s.profiles?.username,
      github_username: s.profiles?.github_username,
      avatar_url: s.profiles?.avatar_url,
      total_xp: s.xp,
      xp: s.xp,
      rating: s.rating,
      battles_won: s.battles_won,
      battles_played: s.battles_played
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('[Player Leaderboard Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch player leaderboard.' });
  }
};

module.exports = {
  getTeamLeaderboard,
  getPlayerLeaderboard
};
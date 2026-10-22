const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/matchmaking/join
 * Player enters the matchmaking queue with their primary skill category
 */
const joinQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skill_category } = req.body; // e.g., 'FRONTEND', 'BACKEND', 'AI_ML'

    if (!skill_category) {
      return res.status(400).json({ error: 'BadRequest', message: 'skill_category is required to join matchmaking.' });
    }

    // Insert or update the player in the queue
    const { error: queueError } = await supabaseAdmin
      .from('matchmaking_queue')
      .upsert({
        profile_id: userId,
        skill_category,
        entered_at: new Date().toISOString()
      }, { onConflict: 'profile_id' });

    if (queueError) throw queueError;

    return res.status(200).json({ 
      message: 'Successfully joined the matchmaking queue.', 
      status: 'QUEUED' 
    });
  } catch (err) {
    console.error('[JoinQueue Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to join queue.' });
  }
};

/**
 * POST /api/matchmaking/leave
 * Player leaves the matchmaking queue
 */
const leaveQueue = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error: deleteError } = await supabaseAdmin
      .from('matchmaking_queue')
      .delete()
      .eq('profile_id', userId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ message: 'Successfully left the matchmaking queue.' });
  } catch (err) {
    console.error('[LeaveQueue Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to leave queue.' });
  }
};

module.exports = {
  joinQueue,
  leaveQueue
};
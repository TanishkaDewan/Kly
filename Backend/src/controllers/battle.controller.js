const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/battles/start
 * A confirmed team starts a challenge. This creates a battle record and starts the countdown.
 */
const startBattle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challenge_id } = req.body;

    if (!challenge_id) {
      return res.status(400).json({ error: 'BadRequest', message: 'challenge_id is required to start a battle.' });
    }

    // 1. Check if user is in an existing CONFIRMED team, or auto-create one
    const { data: membership } = await supabaseAdmin
      .from('team_members')
      .select('team_id, teams(status)')
      .eq('profile_id', userId)
      .maybeSingle();

    let teamId;
    if (membership && membership.teams?.status === 'CONFIRMED') {
      teamId = membership.team_id;
      // Update team's challenge to the selected one
      await supabaseAdmin.from('teams').update({ challenge_id }).eq('id', teamId);
    } else {
      // Auto-create a confirmed team for this engineer so they can jump right into the arena
      const userName = req.user.profile?.username || (req.user.email ? req.user.email.split('@')[0] : 'Engineer');
      const { data: newTeam, error: teamCreateErr } = await supabaseAdmin
        .from('teams')
        .insert([{
          name: `${userName}'s Squad`,
          status: 'CONFIRMED',
          challenge_id
        }])
        .select()
        .single();

      if (teamCreateErr) throw teamCreateErr;
      teamId = newTeam.id;

      await supabaseAdmin.from('team_members').upsert({
        team_id: teamId,
        profile_id: userId,
        role_in_team: 'CHALLENGER',
        consent_status: 'ACCEPTED',
        responded_at: new Date().toISOString()
      }, { onConflict: 'team_id,profile_id' });
    }

    // 2. Fetch the challenge details to get the time limit (default 480m / 8hrs)
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('id, title, time_limit_minutes, description, requirements, constraints')
      .eq('id', challenge_id)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ error: 'NotFound', message: 'Challenge not found.' });
    }

    // 3. Calculate the exact deadline: 480 mins (8 hours)
    const timeLimitMinutes = Number(challenge.time_limit_minutes) || 480;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + timeLimitMinutes * 60000);

    // 4. Create the active Battle record with required team association and countdown timestamps
    const battlePayload = {
      team_id: teamId,
      challenge_id: challenge_id,
      status: 'IN_PROGRESS',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    };

    const { data: battle, error: battleError } = await supabaseAdmin
      .from('battles')
      .insert([battlePayload])
      .select()
      .single();

    if (battleError) {
      // If database schema is missing required columns, report clear error rather than headless fallback
      if (battleError.message && (battleError.message.includes('team_id') || battleError.message.includes('start_time'))) {
        console.error('[StartBattle Error] Missing battle columns in database schema:', battleError.message);
        return res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'Battle creation is unavailable: the battles table is missing required columns (team_id, start_time, end_time). Database schema migration required.'
        });
      }
      throw battleError;
    }

    return res.status(200).json({ 
      message: 'Battle started successfully! The clock is ticking.', 
      battle 
    });

  } catch (err) {
    console.error('[StartBattle Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to start battle.' });
  }
};

/**
 * POST /api/battles/reset-timer
 * Resets the countdown timer for an active battle to 8 hours (or specified duration)
 */
const resetBattleTimer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { battle_id, hours = 8 } = req.body;

    let targetBattleId = battle_id;

    // If battle_id is not supplied, locate the active battle for the caller's team
    if (!targetBattleId) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('team_id')
        .eq('profile_id', userId)
        .maybeSingle();

      if (membership?.team_id) {
        const { data: activeBattle } = await supabaseAdmin
          .from('battles')
          .select('id')
          .eq('team_id', membership.team_id)
          .eq('status', 'IN_PROGRESS')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        targetBattleId = activeBattle?.id;
      }
    }

    const now = new Date();
    const durationMinutes = Number(hours) * 60;
    const endTime = new Date(now.getTime() + durationMinutes * 60000);

    let query = supabaseAdmin
      .from('battles')
      .update({
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: 'IN_PROGRESS'
      });

    if (targetBattleId) {
      query = query.eq('id', targetBattleId);
    } else {
      query = query.eq('status', 'IN_PROGRESS');
    }

    const { data: updatedBattles, error: updateErr } = await query.select();
    if (updateErr) throw updateErr;

    return res.status(200).json({
      message: `Countdown timer successfully reset to ${hours} hours.`,
      battle: updatedBattles?.[0] || null,
      secondsRemaining: durationMinutes * 60,
      end_time: endTime.toISOString()
    });
  } catch (err) {
    console.error('[ResetBattleTimer Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to reset battle timer.' });
  }
};

module.exports = {
  startBattle,
  resetBattleTimer
};
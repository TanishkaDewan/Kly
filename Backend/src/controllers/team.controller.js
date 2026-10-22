const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/teams/current
 * Fetch the user's current team (whether PROPOSED or CONFIRMED) and see teammate statuses,
 * along with the active battle and countdown timestamp if confirmed.
 */
const getCurrentTeam = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find which team the user belongs to right now (most recent active membership)
    const { data: myMemberships, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('team_id, consent_status, teams(*)')
      .eq('profile_id', userId)
      .in('teams.status', ['PROPOSED', 'CONFIRMED', 'ACTIVE']);

    if (membershipError && membershipError.code !== 'PGRST116') throw membershipError;

    const myMembership = myMemberships && myMemberships.length > 0
      ? myMemberships[myMemberships.length - 1]
      : null;

    if (!myMembership || !myMembership.teams) {
      return res.status(200).json({ hasTeam: false, message: 'You are not currently in an active team.' });
    }

    const teamId = myMembership.team_id;

    // 2. Fetch all members of this team so the frontend can display them
    const { data: allMembers, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select('profile_id, role_in_team, consent_status, profiles(username, full_name, avatar_url, experience_level, github_username)')
      .eq('team_id', teamId);

    if (membersError) throw membersError;

    // 3. Fetch active battle & challenge associated with this team
    const { data: activeBattles } = await supabaseAdmin
      .from('battles')
      .select('*, challenges(*)')
      .eq('team_id', teamId)
      .in('status', ['IN_PROGRESS', 'ACTIVE', 'SUBMITTED'])
      .order('created_at', { ascending: false })
      .limit(1);

    const activeBattle = activeBattles && activeBattles.length > 0 ? activeBattles[0] : null;

    let challenge = activeBattle?.challenges || null;
    if (!challenge && myMembership.teams?.challenge_id) {
      const { data: teamChal } = await supabaseAdmin
        .from('challenges')
        .select('*')
        .eq('id', myMembership.teams.challenge_id)
        .single();
      challenge = teamChal || null;
    }

    return res.status(200).json({
      hasTeam: true,
      team: myMembership.teams,
      myStatus: myMembership.consent_status,
      members: allMembers,
      activeBattle,
      challenge
    });
  } catch (err) {
    console.error('[GetCurrentTeam Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch team.' });
  }
};

/**
 * POST /api/teams/:id/accept
 * Player accepts the proposed team.
 * If all members accept, locks team in as CONFIRMED and starts the battle countdown.
 */
const acceptTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = req.params.id;

    // 1. Update this user's consent to ACCEPTED
    await supabaseAdmin
      .from('team_members')
      .update({ consent_status: 'ACCEPTED', responded_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .eq('profile_id', userId);

    // 2. Check if EVERYONE in the team has now accepted
    const { data: members } = await supabaseAdmin
      .from('team_members')
      .select('consent_status')
      .eq('team_id', teamId);

    const allAccepted = members && members.length > 0 && members.every(m => m.consent_status === 'ACCEPTED');

    // 3. If everyone accepted, lock the team in as CONFIRMED and start the countdown!
    if (allAccepted) {
      const { data: updatedTeam } = await supabaseAdmin
        .from('teams')
        .update({ status: 'CONFIRMED' })
        .eq('id', teamId)
        .select()
        .single();

      // Check if an active battle already exists
      const { data: existingBattle } = await supabaseAdmin
        .from('battles')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      let createdBattle = existingBattle;

      if (!existingBattle) {
        let challengeId = updatedTeam?.challenge_id;
        if (!challengeId) {
          const { data: firstChal } = await supabaseAdmin
            .from('challenges')
            .select('id, time_limit_minutes')
            .limit(1)
            .single();
          challengeId = firstChal?.id;
        }

        if (challengeId) {
          const { data: chalInfo } = await supabaseAdmin
            .from('challenges')
            .select('time_limit_minutes')
            .eq('id', challengeId)
            .single();

          const limitMin = chalInfo?.time_limit_minutes || 60;
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + limitMin * 60000);

          const { data: newBattle } = await supabaseAdmin
            .from('battles')
            .insert([{
              team_id: teamId,
              challenge_id: challengeId,
              status: 'IN_PROGRESS',
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString()
            }])
            .select()
            .single();

          createdBattle = newBattle;
        }
      }

      return res.status(200).json({ 
        message: 'All members accepted! Team is CONFIRMED and battle countdown has begun.', 
        teamStatus: 'CONFIRMED',
        team: updatedTeam,
        battle: createdBattle
      });
    }

    return res.status(200).json({ message: 'You accepted. Waiting for teammates...', teamStatus: 'PROPOSED' });
  } catch (err) {
    console.error('[AcceptTeam Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to accept team.' });
  }
};

/**
 * POST /api/teams/:id/reject
 * Player rejects the team. The team is destroyed, and other players go back to the queue.
 */
const rejectTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = req.params.id;

    // 1. Mark team as REJECTED
    await supabaseAdmin
      .from('teams')
      .update({ status: 'REJECTED' })
      .eq('id', teamId);

    await supabaseAdmin
      .from('team_members')
      .update({ consent_status: 'REJECTED', responded_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .eq('profile_id', userId);

    // 2. Find the OTHER innocent teammates
    const { data: otherMembers } = await supabaseAdmin
      .from('team_members')
      .select('profile_id, role_in_team')
      .eq('team_id', teamId)
      .neq('profile_id', userId); // Not the guy who rejected

    // 3. Put the other teammates back into the matchmaking queue automatically
    if (otherMembers && otherMembers.length > 0) {
      const queuePayload = otherMembers.map(m => ({
        profile_id: m.profile_id,
        skill_category: m.role_in_team,
        entered_at: new Date().toISOString()
      }));
      
      await supabaseAdmin.from('matchmaking_queue').upsert(queuePayload, { onConflict: 'profile_id' });
    }

    return res.status(200).json({ message: 'You rejected the team. You are no longer in a team.' });
  } catch (err) {
    console.error('[RejectTeam Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to reject team.' });
  }
};

module.exports = {
  getCurrentTeam,
  acceptTeam,
  rejectTeam
};
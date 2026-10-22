const { supabaseAdmin } = require('../config/supabase');

/**
 * Core algorithm to form teams from the matchmaking queue.
 * Forms teams of 3 players (e.g., FRONTEND, BACKEND, AI_ML / FULLSTACK).
 */
const runMatchmaking = async (targetTeamSize = 3) => {
  try {
    console.log(`[Matchmaking Engine] Scanning queue for teams of ${targetTeamSize}...`);

    // 1. Fetch everyone in the queue, ordered by who waited longest
    const { data: queue, error: queueError } = await supabaseAdmin
      .from('matchmaking_queue')
      .select('*')
      .order('entered_at', { ascending: true });

    if (queueError) throw queueError;

    if (!queue || queue.length < targetTeamSize) {
      console.log(`[Matchmaking Engine] Not enough players (${queue?.length || 0}/${targetTeamSize}) to form a team yet.`);
      return { 
        success: false, 
        queuedCount: queue?.length || 0,
        requiredCount: targetTeamSize,
        message: `Waiting for more players (${queue?.length || 0}/${targetTeamSize} in queue).` 
      };
    }

    const proposedTeams = [];
    let remainingQueue = [...queue];

    // Form teams as long as we have at least targetTeamSize players
    while (remainingQueue.length >= targetTeamSize) {
      // 2. Select Player 1 (the one waiting the longest)
      const selectedPlayers = [remainingQueue[0]];
      remainingQueue.splice(0, 1);

      // Select Player 2 and Player 3, prioritizing diverse skill categories
      while (selectedPlayers.length < targetTeamSize && remainingQueue.length > 0) {
        const usedSkills = new Set(selectedPlayers.map(p => p.skill_category));
        
        // Find player with a skill category not yet on this team
        let nextIdx = remainingQueue.findIndex(p => !usedSkills.has(p.skill_category));
        if (nextIdx === -1) {
          nextIdx = 0; // Fallback to whoever is next in line
        }

        selectedPlayers.push(remainingQueue[nextIdx]);
        remainingQueue.splice(nextIdx, 1);
      }

      if (selectedPlayers.length < targetTeamSize) {
        break;
      }

      // 3. Assign an active challenge (Problem Statement)
      const { data: challenges } = await supabaseAdmin
        .from('challenges')
        .select('id, title')
        .limit(5);

      const challengeId = challenges && challenges.length > 0
        ? challenges[Math.floor(Math.random() * challenges.length)].id
        : null;

      // 4. Create a PROPOSED Team
      const teamNames = [
        'Klyro Titans', 'Cyber Phantoms', 'Apex Devs', 'Neural Syndicate',
        'Quantum Collective', 'Byte Raiders', 'Binary Vanguard', 'Matrix Guild'
      ];
      const randomName = teamNames[Math.floor(Math.random() * teamNames.length)] + `-${Math.floor(Math.random() * 900) + 100}`;

      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .insert([{ 
          name: randomName, 
          status: 'PROPOSED',
          challenge_id: challengeId 
        }])
        .select()
        .single();

      if (teamError) throw teamError;

      // 5. Add all 3 players to the team with status 'PENDING'
      const teamMembers = selectedPlayers.map(player => ({
        team_id: team.id,
        profile_id: player.profile_id,
        role_in_team: player.skill_category,
        consent_status: 'PENDING'
      }));

      const { error: membersError } = await supabaseAdmin
        .from('team_members')
        .insert(teamMembers);

      if (membersError) throw membersError;

      // 6. Remove selected players from the matchmaking queue
      const playerIds = selectedPlayers.map(p => p.profile_id);
      const { error: deleteError } = await supabaseAdmin
        .from('matchmaking_queue')
        .delete()
        .in('profile_id', playerIds);

      if (deleteError) throw deleteError;

      console.log(`[Matchmaking Engine] Successfully formed ${team.name} with ${selectedPlayers.length} members.`);
      proposedTeams.push({
        team,
        memberCount: selectedPlayers.length,
        playerIds
      });
    }

    return {
      success: true,
      teamsCreated: proposedTeams.length,
      teams: proposedTeams,
      remainingInQueue: remainingQueue.length,
      message: `Formed ${proposedTeams.length} team(s) of ${targetTeamSize} players.`
    };

  } catch (err) {
    console.error('[Matchmaking Engine Error]:', err.message);
    throw err;
  }
};

module.exports = { runMatchmaking };
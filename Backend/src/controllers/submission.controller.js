const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/submissions
 * Submit a completed challenge with the GitHub link
 */
const submitChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    // Accept either repo_url or github_url from frontend, canonical is repo_url
    const { battle_id, github_url, repo_url, live_url } = req.body;
    const finalRepoUrl = repo_url || github_url;

    if (!battle_id || !finalRepoUrl) {
      return res.status(400).json({ error: 'BadRequest', message: 'battle_id and repository URL (repo_url or github_url) are required.' });
    }

    // 1. Ensure the user is currently in a team
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('profile_id', userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Forbidden', message: 'You must be in a team to submit.' });
    }

    // 2. Fetch challenge_id from the active battle
    const { data: battleData } = await supabaseAdmin
      .from('battles')
      .select('challenge_id')
      .eq('id', battle_id)
      .single();

    const challengeId = battleData?.challenge_id || null;

    // 3. Create the submission record in the database using canonical repo_url
    const submissionData = {
      battle_id,
      challenge_id: challengeId,
      team_id: membership.team_id,
      submitted_by: userId,
      repo_url: finalRepoUrl,
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString()
    };

    if (live_url && typeof live_url === 'string' && live_url.trim()) {
      submissionData.live_url = live_url.trim();
    }

    let { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .insert([submissionData])
      .select()
      .single();

    // Fallback if live_url column does not exist in database yet
    if (submissionError && submissionError.message && submissionError.message.includes('live_url')) {
      console.warn('[SubmitChallenge] live_url column not found in database; retrying without live_url.');
      delete submissionData.live_url;
      const retry = await supabaseAdmin
        .from('submissions')
        .insert([submissionData])
        .select()
        .single();
      submission = retry.data;
      submissionError = retry.error;
    }

    // Handle existing submission for this team and challenge by updating it
    if (submissionError && submissionError.message && submissionError.message.includes('unique_team_challenge_submission')) {
      console.log('[SubmitChallenge] Submission already exists for this team and challenge. Updating repo_url...');
      const { data: updatedSub, error: updateErr } = await supabaseAdmin
        .from('submissions')
        .update({
          repo_url: finalRepoUrl,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString()
        })
        .match({ team_id: membership.team_id, challenge_id: challengeId })
        .select()
        .single();

      if (updateErr) throw updateErr;
      submission = updatedSub;
      submissionError = null;
    }

    if (submissionError) throw submissionError;

    // 4. Mark the battle as SUBMITTED so the clock stops
    await supabaseAdmin
      .from('battles')
      .update({ status: 'SUBMITTED' })
      .eq('id', battle_id);

    return res.status(200).json({ 
      message: 'Challenge submitted successfully! Great work.', 
      submission: {
        ...submission,
        github_url: submission.repo_url // For backward compatibility with frontend
      }
    });

  } catch (err) {
    console.error('[SubmitChallenge Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to submit challenge.' });
  }
};

module.exports = {
  submitChallenge
};
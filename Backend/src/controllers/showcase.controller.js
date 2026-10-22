const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/showcase/opt-in
 * A team member explicitly grants permission to make their submission public.
 */
const optInToShowcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { submission_id } = req.body;

    if (!submission_id) {
      return res.status(400).json({ error: 'BadRequest', message: 'submission_id is required.' });
    }

    // 1. Verify the user is part of the team that owns this submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('team_id')
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      return res.status(404).json({ error: 'NotFound', message: 'Submission not found.' });
    }

    const { data: membership, error: memError } = await supabaseAdmin
      .from('team_members')
      .select('profile_id')
      .eq('team_id', submission.team_id)
      .eq('profile_id', userId)
      .single();

    if (memError || !membership) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only team members can opt-in to the showcase.' });
    }

    // 2. Grant public showcase permission
    const { data: showcase, error: showcaseError } = await supabaseAdmin
      .from('showcase_projects')
      .upsert(
        { 
          submission_id, 
          team_id: submission.team_id, 
          is_public: true,
          consented_at: new Date().toISOString()
        }, 
        { onConflict: 'submission_id' }
      )
      .select()
      .single();

    if (showcaseError) throw showcaseError;

    return res.status(200).json({
      message: 'Project successfully added to the public showcase!',
      showcase
    });

  } catch (err) {
    console.error('[OptInShowcase Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to update showcase permissions.' });
  }
};

/**
 * GET /api/showcase
 * Fetches all public showcase projects for the frontend gallery.
 */
const getPublicShowcase = async (req, res) => {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('showcase_projects')
      .select(`
        id,
        created_at,
        submissions (
          repo_url,
          battles (
            challenges ( title, category )
          )
        ),
        teams ( name )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (projects || []).map((p) => ({
      ...p,
      submissions: p.submissions ? {
        ...p.submissions,
        github_url: p.submissions.repo_url
      } : null
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('[GetPublicShowcase Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch showcase projects.' });
  }
};

module.exports = {
  optInToShowcase,
  getPublicShowcase
};
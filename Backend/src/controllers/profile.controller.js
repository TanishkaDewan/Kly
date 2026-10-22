const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/profiles/me
 * Fetch the authenticated user's profile, skills, and current stats
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    if (!profile) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Profile not found. Please complete profile setup.'
      });
    }

    const { data: userSkills, error: skillsError } = await supabaseAdmin
      .from('profile_skills')
      .select('skills ( id, name, category )')
      .eq('profile_id', userId);

    if (skillsError) throw skillsError;

    const { data: stats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') throw statsError;

    return res.status(200).json({
      profile: {
        ...profile,
        skills: userSkills ? userSkills.map(s => s.skills) : [],
        stats: stats || { xp: 0, rating: 1000, battles_played: 0, battles_won: 0 }
      }
    });
  } catch (err) {
    console.error('[GetMyProfile Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to retrieve profile data.' });
  }
};

/**
 * PUT /api/profiles/me
 * Upsert user profile and assign selected skills
 */
const upsertMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, full_name, avatar_url, github_username, experience_level, skill_ids } = req.body;

    if (!username || !full_name || !github_username) {
      return res.status(400).json({ error: 'BadRequest', message: 'username, full_name, and github_username are required.' });
    }

    const profilePayload = {
      id: userId,
      username,
      full_name,
      avatar_url: avatar_url || null,
      github_username,
      experience_level: experience_level || 'BEGINNER',
      updated_at: new Date().toISOString()
    };

    const { data: updatedProfile, error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload)
      .select()
      .single();

    if (upsertError) {
      if (upsertError.code === '23505') return res.status(409).json({ error: 'Conflict', message: 'Username is already in use.' });
      throw upsertError;
    }

    // Ensure stats exist
    await supabaseAdmin.from('user_stats').upsert({ profile_id: userId }, { onConflict: 'profile_id', ignoreDuplicates: true });

    if (Array.isArray(skill_ids)) {
      await supabaseAdmin.from('profile_skills').delete().eq('profile_id', userId);
      if (skill_ids.length > 0) {
        const skillRows = skill_ids.map(id => ({ profile_id: userId, skill_id: id }));
        await supabaseAdmin.from('profile_skills').insert(skillRows);
      }
    }

    return res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (err) {
    console.error('[UpsertProfile Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to update profile.' });
  }
};

/**
 * GET /api/profiles/skills
 * Fetch all available skills and categories
 */
const getAllSkills = async (req, res) => {
  try {
    const { data: skills, error } = await supabaseAdmin.from('skills').select('*').order('category', { ascending: true });
    if (error) throw error;
    return res.status(200).json({ skills });
  } catch (err) {
    console.error('[GetAllSkills Error]:', err.message);
    return res.status(500).json({ error: 'InternalServerError', message: 'Failed to retrieve skills list.' });
  }
};

module.exports = { getMyProfile, upsertMyProfile, getAllSkills };
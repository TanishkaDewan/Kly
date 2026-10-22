import { getAccessToken } from './supabase';

/**
 * Base API URL resolved from environment variable.
 * Fallback defaults:
 * - Production: 'https://klyro-kiuu.onrender.com'
 * - Development: 'http://localhost:5000'
 */
const resolvedBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://klyro-kiuu.onrender.com' : 'http://localhost:5000')
).replace(/\/+$/, '');

/**
 * Low-level HTTP request helper that attaches Supabase auth headers.
 *
 * @param {string} endpoint - API path, e.g. '/api/profiles/me'
 * @param {Object} [options] - fetch options
 * @param {boolean} [requiresAuth=true] - whether Bearer token is needed
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}, requiresAuth = true) {
  const url = `${resolvedBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (requiresAuth) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const authError = new Error('Authentication required. Missing Supabase session access token.');
      authError.status = 401;
      authError.code = 'AUTH_REQUIRED';
      throw authError;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Sanitize network errors without exposing tokens
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const networkError = new Error('Unable to connect to the KLYRO backend service. Please check your connection.');
      networkError.status = 0;
      throw networkError;
    }
    throw err;
  }
}

// ============================================================
// PROFILE & SKILLS APIS
// ============================================================

export async function getProfile() {
  return apiRequest('/api/profiles/me', { method: 'GET' }, true);
}

export async function updateProfile(profileData) {
  return apiRequest('/api/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }, true);
}

export async function getSkills() {
  return apiRequest('/api/profiles/skills', { method: 'GET' }, false);
}

// ============================================================
// MATCHMAKING & TEAMS APIS
// ============================================================

export async function joinMatchmaking(skillCategory) {
  return apiRequest('/api/matchmaking/join', {
    method: 'POST',
    body: JSON.stringify({ skill_category: skillCategory })
  }, true);
}

export async function leaveMatchmaking() {
  return apiRequest('/api/matchmaking/leave', {
    method: 'POST'
  }, true);
}

export async function getCurrentTeam() {
  return apiRequest('/api/teams/current', { method: 'GET' }, true);
}

export async function acceptTeam(teamId) {
  return apiRequest(`/api/teams/${teamId}/accept`, {
    method: 'POST'
  }, true);
}

export async function rejectTeam(teamId) {
  return apiRequest(`/api/teams/${teamId}/reject`, {
    method: 'POST'
  }, true);
}

// ============================================================
// CHALLENGES & BATTLES APIS
// ============================================================

export async function getChallenges() {
  return apiRequest('/api/challenges', { method: 'GET' }, false);
}

export async function getChallengeBySlug(slug) {
  return apiRequest(`/api/challenges/${slug}`, { method: 'GET' }, false);
}

export async function startBattle(challengeId) {
  return apiRequest('/api/battles/start', {
    method: 'POST',
    body: JSON.stringify({ challenge_id: challengeId })
  }, true);
}

export async function resetBattleTimer(battleId = null, hours = 8) {
  return apiRequest('/api/battles/reset-timer', {
    method: 'POST',
    body: JSON.stringify({ battle_id: battleId, hours })
  }, true);
}

export async function submitChallenge({ battle_id, github_url, repo_url, live_url }) {
  const finalRepoUrl = repo_url || github_url;
  return apiRequest('/api/submissions', {
    method: 'POST',
    body: JSON.stringify({
      battle_id,
      github_url: finalRepoUrl,
      repo_url: finalRepoUrl,
      live_url: live_url || null
    })
  }, true);
}

export async function runEvaluation(submissionId) {
  return apiRequest('/api/evaluations/run', {
    method: 'POST',
    body: JSON.stringify({ submission_id: submissionId })
  }, true);
}

// ============================================================
// RESULTS APIS
// ============================================================

export async function getTeamResults(teamId) {
  return apiRequest(`/api/results/teams/${teamId}`, { method: 'GET' }, true);
}

// ============================================================
// LEADERBOARD APIS
// ============================================================

export async function getPlayerLeaderboard() {
  return apiRequest('/api/leaderboard/players', { method: 'GET' }, false);
}

export async function getTeamLeaderboard() {
  return apiRequest('/api/leaderboard/teams', { method: 'GET' }, false);
}

// ============================================================
// SHOWCASE APIS
// ============================================================

export async function getPublicShowcase() {
  return apiRequest('/api/showcase', { method: 'GET' }, false);
}

export async function optInToShowcase(submissionId) {
  return apiRequest('/api/showcase/opt-in', {
    method: 'POST',
    body: JSON.stringify({ submission_id: submissionId })
  }, true);
}

export default {
  getProfile,
  updateProfile,
  getSkills,
  joinMatchmaking,
  leaveMatchmaking,
  getCurrentTeam,
  acceptTeam,
  rejectTeam,
  getChallenges,
  getChallengeBySlug,
  startBattle,
  resetBattleTimer,
  submitChallenge,
  runEvaluation,
  getTeamResults,
  getPlayerLeaderboard,
  getTeamLeaderboard,
  getPublicShowcase,
  optInToShowcase
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[KLYRO Auth Warning]: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
    'Authentication and protected API calls will require these environment variables.'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

let cachedAccessToken = null;

// Synchronously sync token on any Supabase auth state change
supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token || null;
});

/**
 * Manually update the cached access token (e.g. immediately upon sign in)
 * @param {string|null} token
 */
export function setCachedAccessToken(token) {
  cachedAccessToken = token;
}

/**
 * Retrieves the current valid Supabase session access token.
 * Returns null if no active session exists.
 *
 * @returns {Promise<string|null>}
 */
export async function getAccessToken() {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    cachedAccessToken = session?.access_token || null;
    return cachedAccessToken;
  } catch (err) {
    console.warn('[KLYRO Auth]: Error resolving session token:', err.message);
    return null;
  }
}

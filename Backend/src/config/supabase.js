require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const isTestEnvironment = process.env.NODE_ENV === 'test';

const supabaseUrl = process.env.SUPABASE_URL || (isTestEnvironment ? 'https://placeholder.supabase.co' : undefined);
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || (isTestEnvironment ? 'placeholder-anon-key' : undefined);
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (isTestEnvironment ? 'placeholder-service-role-key' : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase initialization failed: SUPABASE_URL and SUPABASE_ANON_KEY must be configured in environment variables.'
  );
}

// Public client (respects Row-Level Security, used with user JWTs)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin/Service-role client (bypasses RLS, for trusted backend writes like evaluations/scoring)
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey
);

module.exports = {
  supabase,
  supabaseAdmin
};
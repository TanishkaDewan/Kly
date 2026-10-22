require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');
const axios = require('axios');

async function testFullFlow() {
  console.log('--- 1. Testing Auth & Team Retrieval ---');
  // 1. Sign in as Alice Chen
  const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
    email: 'alice@klyro.com',
    password: 'KlyroPassword123!'
  });

  if (authErr) throw authErr;
  console.log(`[Auth Success] Signed in as ${authData.user.email} (ID: ${authData.user.id})`);
  const token = authData.session.access_token;

  // 2. Fetch current team from Backend API
  const teamRes = await axios.get('http://localhost:5000/api/teams/current', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('\n--- 2. Team & Active Battle Details ---');
  console.log('Team Name:', teamRes.data?.team?.name);
  console.log('Team Status:', teamRes.data?.team?.status);
  console.log('Members Count:', teamRes.data?.members?.length);
  console.log('Teammates:', teamRes.data?.members?.map(m => `${m.profiles?.username} (${m.role_in_team})`));
  console.log('Active Battle ID:', teamRes.data?.activeBattle?.id);
  console.log('Battle End Time:', teamRes.data?.activeBattle?.end_time);

  const battleId = teamRes.data?.activeBattle?.id;
  if (!battleId) {
    console.error('No active battle found for this team.');
    return;
  }

  // 3. Test GitHub Repo Submission
  console.log('\n--- 3. Testing GitHub Repo Submission ---');
  const testRepo = 'https://github.com/shravani-student/demo-repository';
  const subRes = await axios.post('http://localhost:5000/api/submissions', {
    battle_id: battleId,
    repo_url: testRepo
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('[Submission Success]:', subRes.data?.message);
  const submissionId = subRes.data?.submission?.id;
  console.log('Submission ID:', submissionId);

  // 4. Test Evaluation Run (calls AI Service + Gemini LLM)
  console.log('\n--- 4. Triggering AI Evaluation (Calls FastAPI & Gemini) ---');
  console.log('Calling POST http://localhost:5000/api/evaluations/run with submission_id: ' + submissionId);

  try {
    const evalRes = await axios.post(`http://localhost:5000/api/evaluations/run`, {
      submission_id: submissionId
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 120000
    });

    console.log('[Evaluation Complete!]:', evalRes.data?.message);
    const evalData = evalRes.data?.data?.evaluation || evalRes.data?.data;
    console.log('Total Score:', evalData?.total_score);
    console.log('Feedback Summary:', evalData?.feedback_summary);
    console.log('Strengths:', evalData?.strengths);
    console.log('Weaknesses:', evalData?.weaknesses);
    console.log('Dimension Scores:', evalRes.data?.data?.evaluation_scores?.map(d => `${d.dimension}: ${d.dimension_score || d.raw_score}`));
  } catch (evalErr) {
    console.error('Evaluation Error:', evalErr.response?.data || evalErr.message);
  }
}

testFullFlow().catch(console.error);

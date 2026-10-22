process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const {
  parseGitHubUrl,
  normalizeRequirements,
  buildAiPayload,
  validateAndExtractAiResult,
  EXPECTED_DIMENSIONS
} = require('../src/services/evaluation.service');
const { calculateRatingChange } = require('../src/services/rating.service');

test('parseGitHubUrl - valid public repository URLs', () => {
  const url1 = parseGitHubUrl('https://github.com/klyro-team/battle-arena');
  assert.strictEqual(url1.owner, 'klyro-team');
  assert.strictEqual(url1.repo, 'battle-arena');

  const url2 = parseGitHubUrl('https://github.com/octocat/Hello-World.git');
  assert.strictEqual(url2.owner, 'octocat');
  assert.strictEqual(url2.repo, 'Hello-World');

  const url3 = parseGitHubUrl('http://github.com/user/project/');
  assert.strictEqual(url3.owner, 'user');
  assert.strictEqual(url3.repo, 'project');

  const url4 = parseGitHubUrl('github.com/developer/app');
  assert.strictEqual(url4.owner, 'developer');
  assert.strictEqual(url4.repo, 'app');
});

test('parseGitHubUrl - rejects invalid URLs, hosts, and empty paths', () => {
  assert.throws(() => parseGitHubUrl(''), /GitHub repository URL is required/);
  assert.throws(() => parseGitHubUrl(null), /GitHub repository URL is required/);
  assert.throws(() => parseGitHubUrl('https://gitlab.com/user/repo'), /Only public repositories on github.com are accepted/);
  assert.throws(() => parseGitHubUrl('https://github.com/singlepart'), /Invalid GitHub repository path/);
  assert.throws(() => parseGitHubUrl('https://github.com//'), /Invalid GitHub repository path/);
});

test('normalizeRequirements - handles various database formats', () => {
  assert.deepStrictEqual(normalizeRequirements(['Requirement 1', 'Requirement 2']), ['Requirement 1', 'Requirement 2']);

  const objectReqs = [
    { title: 'JWT Authentication' },
    { requirement: 'Redis Caching' },
    { text: 'Leaderboard API' }
  ];
  assert.deepStrictEqual(normalizeRequirements(objectReqs), [
    'JWT Authentication',
    'Redis Caching',
    'Leaderboard API'
  ]);

  const jsonStrReqs = JSON.stringify(['Docker deployment', 'Automated CI']);
  assert.deepStrictEqual(normalizeRequirements(jsonStrReqs), ['Docker deployment', 'Automated CI']);

  // Object schema as stored in Supabase challenges table
  const supabaseSchemaReqs = {
    must_have: [
      'POST /cart',
      'DELETE /cart/:id',
      'GET /cart'
    ]
  };
  assert.deepStrictEqual(normalizeRequirements(supabaseSchemaReqs), [
    'POST /cart',
    'DELETE /cart/:id',
    'GET /cart'
  ]);

  const jsonObjectSchemaStr = JSON.stringify(supabaseSchemaReqs);
  assert.deepStrictEqual(normalizeRequirements(jsonObjectSchemaStr), [
    'POST /cart',
    'DELETE /cart/:id',
    'GET /cart'
  ]);

  assert.deepStrictEqual(normalizeRequirements(null), []);
  assert.deepStrictEqual(normalizeRequirements(undefined), []);
  assert.deepStrictEqual(normalizeRequirements(''), []);
});

test('buildAiPayload - correctly formats request for FastAPI', () => {
  const payload = buildAiPayload({
    repoUrl: 'https://github.com/acme/backend-service.git',
    challengeId: 'chall-123',
    challengeTitle: 'API Challenge',
    rawRequirements: ['Requirement A', 'Requirement B']
  });

  assert.strictEqual(payload.owner, 'acme');
  assert.strictEqual(payload.repo, 'backend-service');
  assert.strictEqual(payload.challenge_id, 'chall-123');
  assert.strictEqual(payload.challenge_title, 'API Challenge');
  assert.deepStrictEqual(payload.requirements, ['Requirement A', 'Requirement B']);
});

test('validateAndExtractAiResult - verified 72.8 evaluation response fixture', () => {
  const verified728Fixture = {
    status: 'SUCCESS',
    evaluated_at: '2026-10-14T16:46:36.623575+00:00',
    model: 'gemini-3-flash-preview',
    total_score: 72.8,
    dimension_scores: [
      { dimension: 'Technical Quality', raw_score: 3.8, weight: 0.20, dimension_score: 76.0, weighted_score: 15.2, rationale: 'Good React code' },
      { dimension: 'Architecture & Engineering', raw_score: 4.2, weight: 0.15, dimension_score: 84.0, weighted_score: 12.6, rationale: 'Decoupled components' },
      { dimension: 'Functionality & Completeness', raw_score: 3.0, weight: 0.20, dimension_score: 60.0, weighted_score: 12.0, rationale: 'Core routes present' },
      { dimension: 'Innovation & Problem Solving', raw_score: 3.5, weight: 0.15, dimension_score: 70.0, weighted_score: 10.5, rationale: 'Innovative concept' },
      { dimension: 'Feasibility & Scalability', raw_score: 4.0, weight: 0.15, dimension_score: 80.0, weighted_score: 12.0, rationale: 'Scalable stack' },
      { dimension: 'Documentation & Engineering Process', raw_score: 3.5, weight: 0.15, dimension_score: 70.0, weighted_score: 10.5, rationale: 'Good README' }
    ],
    requirements_evaluation: [
      { requirement: 'React Router routes', status: 'MET', evidence: 'App.jsx', justification: 'Routes exist' },
      { requirement: 'Cockpit submission', status: 'NOT_VERIFIABLE', evidence: 'App.jsx', justification: 'Source omitted' },
      { requirement: 'AuthContext provider', status: 'MET', evidence: 'AuthContext.jsx', justification: 'Provider wraps App' }
    ],
    feedback_summary: 'KLYRO shows strong architectural foundation.',
    strengths: ['Clean idiomatic React'],
    weaknesses: ['Low commit count'],
    recommendations: ['Add unit tests'],
    suspicious_flags: [],
    contributions: [
      { github_username: 'Siddhantpatil3158', estimated_percentage: 100.0, evidence: ['4 commits'] }
    ]
  };

  const validated = validateAndExtractAiResult(verified728Fixture);
  assert.strictEqual(validated.status, 'SUCCESS');
  assert.strictEqual(validated.isDegraded, false);
  assert.strictEqual(validated.totalScore, 72.8);
  assert.strictEqual(validated.dimensionScores.length, 6);
  assert.strictEqual(validated.requirementsEvaluation.length, 3);
  assert.strictEqual(validated.requirementsEvaluation[1].status, 'NOT_VERIFIABLE');
});

test('validateAndExtractAiResult - valid SUCCESS response with 6 dimensions', () => {
  const validAiResponse = {
    status: 'SUCCESS',
    total_score: 85.5,
    dimension_scores: EXPECTED_DIMENSIONS.map((d) => ({
      dimension: d.name,
      raw_score: 4.2,
      weight: d.weight,
      dimension_score: 84.0,
      weighted_score: round(84.0 * d.weight, 2),
      rationale: 'Well designed'
    })),
    requirements_evaluation: [
      { requirement: 'JWT', status: 'MET', evidence: 'src/auth.js', justification: 'Verified' }
    ],
    feedback_summary: 'Excellent work overall.',
    strengths: ['Clean code'],
    weaknesses: ['Minor styling'],
    recommendations: ['Add Redis'],
    suspicious_flags: [],
    contributions: [
      { github_username: 'alice', estimated_percentage: 100.0, evidence: ['All commits'] }
    ]
  };

  function round(val, dec) {
    return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
  }

  const validated = validateAndExtractAiResult(validAiResponse);
  assert.strictEqual(validated.status, 'SUCCESS');
  assert.strictEqual(validated.isDegraded, false);
  assert.strictEqual(validated.totalScore, 85.5);
  assert.strictEqual(validated.dimensionScores.length, 6);
  assert.strictEqual(validated.requirementsEvaluation[0].status, 'MET');
});

test('validateAndExtractAiResult - valid EVALUATION_DEGRADED response', () => {
  const degradedAiResponse = {
    status: 'EVALUATION_DEGRADED',
    degraded_reason: 'Gemini API service unavailable (HTTP 503)',
    total_score: null,
    dimension_scores: null,
    contributions: [
      { github_username: 'bob', estimated_percentage: 100.0 }
    ],
    evidence_manifest: { files_inspected: ['server.js'] }
  };

  const validated = validateAndExtractAiResult(degradedAiResponse);
  assert.strictEqual(validated.status, 'EVALUATION_DEGRADED');
  assert.strictEqual(validated.isDegraded, true);
  assert.strictEqual(validated.totalScore, null);
  assert.strictEqual(validated.dimensionScores, null);
  assert.strictEqual(validated.degradedReason, 'Gemini API service unavailable (HTTP 503)');
});

test('validateAndExtractAiResult - rejects malformed responses and fabricated scores', () => {
  // Missing required dimensions
  const missingDims = {
    status: 'SUCCESS',
    total_score: 80.0,
    dimension_scores: [
      { dimension: 'Technical Quality', raw_score: 4.0, weight: 0.20, dimension_score: 80.0, weighted_score: 16.0 }
    ]
  };
  assert.throws(() => validateAndExtractAiResult(missingDims), /expected 6 dimension scores/);

  // Invalid total_score (>100 or <0 or NaN)
  const invalidScore = {
    status: 'SUCCESS',
    total_score: 150.0,
    dimension_scores: EXPECTED_DIMENSIONS.map((d) => ({
      dimension: d.name, raw_score: 4.0, weight: d.weight, dimension_score: 80.0, weighted_score: 16.0
    }))
  };
  assert.throws(() => validateAndExtractAiResult(invalidScore), /total_score must be a finite number between 0 and 100/);

  // Unknown status
  assert.throws(() => validateAndExtractAiResult({ status: 'UNKNOWN' }), /unrecognized status/);
});

test('calculateRatingChange - deterministic rating and battle outcome', () => {
  assert.deepStrictEqual(calculateRatingChange(85), { ratingChange: 25, battleResult: 'WIN' });
  assert.deepStrictEqual(calculateRatingChange(80), { ratingChange: 25, battleResult: 'WIN' });
  assert.deepStrictEqual(calculateRatingChange(75), { ratingChange: 5, battleResult: 'PASS' });
  assert.deepStrictEqual(calculateRatingChange(72.8), { ratingChange: 5, battleResult: 'PASS' });
  assert.deepStrictEqual(calculateRatingChange(50), { ratingChange: 5, battleResult: 'PASS' });
  assert.deepStrictEqual(calculateRatingChange(49), { ratingChange: -15, battleResult: 'LOSS' });
  assert.deepStrictEqual(calculateRatingChange(0), { ratingChange: -15, battleResult: 'LOSS' });
});

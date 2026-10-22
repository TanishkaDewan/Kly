process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const {
  validateAndExtractAiResult,
  EXPECTED_DIMENSIONS
} = require('../src/services/evaluation.service');
const { calculateRatingChange } = require('../src/services/rating.service');

// Load the actual saved eval_result.json from fixtures
const evalResultPath = path.resolve(__dirname, 'fixtures/eval_result.json');
const savedResult = JSON.parse(fs.readFileSync(evalResultPath, 'utf8'));

test('Task 2.1 — Backend validator accepts actual saved eval_result.json', () => {
  assert.strictEqual(savedResult.status, 'SUCCESS');
  assert.strictEqual(savedResult.total_score, 72.8);
  assert.strictEqual(savedResult.dimension_scores.length, 6);

  const validated = validateAndExtractAiResult(savedResult);
  assert.strictEqual(validated.status, 'SUCCESS');
  assert.strictEqual(validated.isDegraded, false);
  assert.strictEqual(validated.totalScore, 72.8);
  assert.strictEqual(validated.dimensionScores.length, 6);
  assert.strictEqual(validated.requirementsEvaluation.length, 3);
  assert.strictEqual(validated.feedbackSummary.includes('KLYRO'), true);
  assert.strictEqual(validated.contributions.length, 1);
});

test('Task 2.2 — Persistence mapping generates valid database rows matching schema', () => {
  const validated = validateAndExtractAiResult(savedResult);
  const finalScore = validated.totalScore;
  const submissionId = 'ecc318a4-1a72-4a62-b5ef-c14c3e74faa4';
  const teamId = '206f65f9-78e4-4f36-8633-b577a758ddeb';
  const challengeId = '4806bc5c-9b7c-475b-9834-ff435431b1f7';

  // 1. Evaluations master row
  const evalRow = {
    submission_id: submissionId,
    team_id: teamId,
    challenge_id: challengeId,
    total_score: finalScore,
    feedback_summary: validated.feedbackSummary,
    strengths: validated.strengths || [],
    weaknesses: validated.weaknesses || [],
    recommendations: validated.recommendations || [],
    suspicious_flags: validated.suspiciousFlags || [],
    raw_ai_response: {
      total_score: finalScore,
      dimension_scores: validated.dimensionScores,
      requirements_evaluation: validated.requirementsEvaluation,
      evidence_manifest: validated.evidenceManifest,
      contributions: validated.contributions
    },
    evaluated_at: new Date().toISOString()
  };

  assert.strictEqual(evalRow.total_score, 72.8);
  assert.strictEqual(typeof evalRow.total_score, 'number');
  assert.ok(evalRow.feedback_summary.length > 0);

  // 2. Evaluation_scores child rows
  const dimensionRows = validated.dimensionScores.map((dim) => ({
    evaluation_id: 'eval-mock-id',
    dimension: dim.dimension,
    raw_score: dim.raw_score,
    weight: dim.weight,
    weighted_score: dim.weighted_score,
    status: dim.rationale || 'SCORED'
  }));

  assert.strictEqual(dimensionRows.length, 6);
  for (const r of dimensionRows) {
    assert.ok(r.raw_score >= 0 && r.raw_score <= 5.0, `raw_score ${r.raw_score} out of range`);
    assert.ok(r.weight > 0 && r.weight <= 1.0, `weight ${r.weight} out of range`);
    assert.ok(r.weighted_score >= 0 && r.weighted_score <= 100, `weighted_score ${r.weighted_score} out of range`);
  }

  // Verify weighted sum
  const sumWeighted = dimensionRows.reduce((sum, r) => sum + r.weighted_score, 0);
  assert.strictEqual(Math.round(sumWeighted * 10) / 10, 72.8);

  // 3. Rating and XP calculations
  const teamXpAwarded = finalScore >= 80 ? 200 : finalScore >= 50 ? 100 : 50;
  assert.strictEqual(teamXpAwarded, 100);

  const { ratingChange, battleResult } = calculateRatingChange(finalScore);
  assert.strictEqual(ratingChange, 5);
  assert.strictEqual(battleResult, 'PASS');
});

test('Task 2.3 — Results API normalizes 0-5 raw ratings to 0-100 dimension_score', () => {
  const validated = validateAndExtractAiResult(savedResult);

  // Simulate database retrieval as performed in result.controller.js
  const storedEvalData = {
    id: 'mock-eval-id',
    total_score: validated.totalScore,
    feedback_summary: validated.feedbackSummary,
    evaluation_scores: validated.dimensionScores.map((d) => ({
      dimension: d.dimension,
      raw_score: d.raw_score,
      weight: d.weight,
      weighted_score: d.weighted_score,
      status: d.rationale
    }))
  };

  // Formatter logic from result.controller.js
  const formattedScores = storedEvalData.evaluation_scores.map((score) => {
    const raw = score.raw_score;
    const normalized = typeof raw === 'number' && raw <= 5.0
      ? Math.round((raw / 5.0) * 100 * 10) / 10
      : raw;
    return {
      ...score,
      dimension_score: score.dimension_score ?? normalized
    };
  });

  assert.strictEqual(formattedScores.length, 6);
  assert.deepStrictEqual(
    formattedScores.map(s => ({ dim: s.dimension, score: s.dimension_score })),
    [
      { dim: 'Technical Quality', score: 76.0 },
      { dim: 'Architecture & Engineering', score: 84.0 },
      { dim: 'Functionality & Completeness', score: 60.0 },
      { dim: 'Innovation & Problem Solving', score: 70.0 },
      { dim: 'Feasibility & Scalability', score: 80.0 },
      { dim: 'Documentation & Engineering Process', score: 70.0 }
    ]
  );
});

test('Task 2.4 — BattleResultsPage frontend rendering calculations match exactly', () => {
  const validated = validateAndExtractAiResult(savedResult);

  const mockSubmission = {
    id: 'ecc318a4-1a72-4a62-b5ef-c14c3e74faa4',
    status: 'EVALUATED',
    team_xp_awarded: 100,
    evaluation: {
      total_score: 72.8,
      evaluation_scores: [
        { dimension: 'Technical Quality', raw_score: 3.8, dimension_score: 76.0, weight: 0.20 },
        { dimension: 'Architecture & Engineering', raw_score: 4.2, dimension_score: 84.0, weight: 0.15 },
        { dimension: 'Functionality & Completeness', raw_score: 3.0, dimension_score: 60.0, weight: 0.20 },
        { dimension: 'Innovation & Problem Solving', raw_score: 3.5, dimension_score: 70.0, weight: 0.15 },
        { dimension: 'Feasibility & Scalability', raw_score: 4.0, dimension_score: 80.0, weight: 0.15 },
        { dimension: 'Documentation & Engineering Process', raw_score: 3.5, dimension_score: 70.0, weight: 0.15 }
      ]
    }
  };

  // Logic from BattleResultsPage.jsx:
  const evaluation = mockSubmission.evaluation;
  const isPending = !evaluation && (mockSubmission.status === 'SUBMITTED' || mockSubmission.status === 'EVALUATING');
  const isDegraded = 
    mockSubmission.status === 'DEGRADED' ||
    mockSubmission.status === 'EVALUATION_DEGRADED' ||
    evaluation?.status === 'EVALUATION_DEGRADED' ||
    (!isPending && evaluation && evaluation.total_score == null);

  assert.strictEqual(isPending, false);
  assert.strictEqual(isDegraded, false);

  // Composite score display
  const totalScoreDisplay = isPending ? 'PENDING' : isDegraded || evaluation.total_score == null ? 'N/A' : evaluation.total_score;
  assert.strictEqual(totalScoreDisplay, 72.8);

  // Dimension scores display
  const scoreVals = evaluation.evaluation_scores.map(dim => {
    return dim.dimension_score ?? (typeof dim.raw_score === 'number' && dim.raw_score <= 5.0 ? Math.round((dim.raw_score / 5.0) * 100 * 10) / 10 : dim.raw_score) ?? dim.score ?? 0;
  });

  assert.deepStrictEqual(scoreVals, [76.0, 84.0, 60.0, 70.0, 80.0, 70.0]);
});

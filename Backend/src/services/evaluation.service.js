const axios = require('axios');
const { supabaseAdmin } = require('../config/supabase');
const { calculateRatingChange } = require('./rating.service');

/**
 * Authoritative AI evaluation dimensions and weights defined by Member 3's AI Service.
 * Total: 100%. Python calculates the final weighted total_score.
 */
const EXPECTED_DIMENSIONS = [
  { name: 'Technical Quality', weight: 0.20 },
  { name: 'Architecture & Engineering', weight: 0.15 },
  { name: 'Functionality & Completeness', weight: 0.20 },
  { name: 'Innovation & Problem Solving', weight: 0.15 },
  { name: 'Feasibility & Scalability', weight: 0.15 },
  { name: 'Documentation & Engineering Process', weight: 0.15 }
];

/**
 * Safely parses a public GitHub repository URL into owner and repo.
 * Handles trailing slashes, .git extensions, and optional protocol prefixes.
 * Rejects non-github.com hosts and invalid patterns.
 *
 * @param {string} rawUrl - e.g. "https://github.com/owner/repo"
 * @returns {{ owner: string, repo: string }}
 */
const parseGitHubUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('GitHub repository URL is required.');
  }

  const trimmed = rawUrl.trim();
  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL format: "${rawUrl}".`);
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== 'github.com' && host !== 'www.github.com') {
    throw new Error(`Invalid host "${parsed.hostname}". Only public repositories on github.com are accepted.`);
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error(`Invalid GitHub repository path: "${parsed.pathname}". Expected format: https://github.com/owner/repo`);
  }

  const owner = pathParts[0].trim();
  let repo = pathParts[1].trim();
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  const validIdentifier = /^[a-zA-Z0-9_.-]+$/;
  if (!owner || !repo || !validIdentifier.test(owner) || !validIdentifier.test(repo)) {
    throw new Error(`Invalid GitHub owner or repository name in "${rawUrl}".`);
  }

  return { owner, repo };
};

/**
 * Normalizes challenge requirements into an array of strings matching the AI service schema.
 *
 * @param {any} requirementsData - Array, string, or undefined from challenge record
 * @returns {string[]}
 */
const normalizeRequirements = (requirementsData) => {
  if (!requirementsData) return [];

  if (Array.isArray(requirementsData)) {
    return requirementsData
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          return (item.title || item.requirement || item.name || item.text || item.description || JSON.stringify(item)).trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }

  if (typeof requirementsData === 'string') {
    const trimmed = requirementsData.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeRequirements(parsed);
      } catch {
        return [trimmed];
      }
    }
    return trimmed.length > 0 ? [trimmed] : [];
  }

  if (typeof requirementsData === 'object') {
    const candidateList = requirementsData.must_have ||
                          requirementsData.requirements ||
                          requirementsData.items ||
                          requirementsData.features;
    if (candidateList) {
      return normalizeRequirements(candidateList);
    }

    const extracted = [];
    for (const val of Object.values(requirementsData)) {
      if (Array.isArray(val)) {
        extracted.push(...normalizeRequirements(val));
      } else if (typeof val === 'string' && val.trim()) {
        extracted.push(val.trim());
      }
    }
    if (extracted.length > 0) return extracted;
  }

  return [];
};

/**
 * Constructs the outgoing AI request payload matching FastAPI's ChallengeEvaluationRequest model.
 *
 * @param {Object} params
 * @param {string} params.repoUrl - The submitted GitHub URL
 * @param {string|null} params.challengeId - Challenge UUID
 * @param {string|null} params.challengeTitle - Challenge Title
 * @param {any} params.rawRequirements - Challenge requirements from database
 * @returns {Object} Request body for POST /evaluate
 */
const buildAiPayload = ({ repoUrl, challengeId = null, challengeTitle = null, rawRequirements = null }) => {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const requirements = normalizeRequirements(rawRequirements);

  return {
    owner,
    repo,
    challenge_id: challengeId || null,
    challenge_title: challengeTitle || null,
    requirements
  };
};

/**
 * Validates and extracts the AI service response against the authoritative contract.
 * Distinguishes SUCCESS from EVALUATION_DEGRADED without fabricating scores or throwing unhandled errors.
 *
 * @param {any} aiResult - Raw JSON response from AI service
 * @returns {Object} Validated and structured result
 */
const validateAndExtractAiResult = (aiResult) => {
  if (!aiResult || typeof aiResult !== 'object') {
    throw new Error('Invalid AI evaluation response: empty or non-object response received.');
  }

  if (aiResult.status === 'EVALUATION_DEGRADED') {
    return {
      status: 'EVALUATION_DEGRADED',
      isDegraded: true,
      degradedReason: aiResult.degraded_reason || 'AI evaluation returned degraded mode.',
      totalScore: null,
      dimensionScores: null,
      requirementsEvaluation: null,
      feedbackSummary: null,
      strengths: Array.isArray(aiResult.strengths) ? aiResult.strengths : [],
      weaknesses: Array.isArray(aiResult.weaknesses) ? aiResult.weaknesses : [],
      recommendations: Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [],
      suspiciousFlags: Array.isArray(aiResult.suspicious_flags) ? aiResult.suspicious_flags : [],
      contributions: Array.isArray(aiResult.contributions) ? aiResult.contributions : [],
      evidenceManifest: aiResult.evidence_manifest || null,
      repository: aiResult.repository || null
    };
  }

  if (aiResult.status === 'SUCCESS') {
    const totalScore = aiResult.total_score;
    if (typeof totalScore !== 'number' || !Number.isFinite(totalScore) || totalScore < 0 || totalScore > 100) {
      throw new Error(`Invalid AI evaluation response: total_score must be a finite number between 0 and 100 (received: ${totalScore}).`);
    }

    if (!Array.isArray(aiResult.dimension_scores)) {
      throw new Error('Invalid AI evaluation response: dimension_scores must be an array.');
    }

    if (aiResult.dimension_scores.length !== 6) {
      throw new Error(`Invalid AI evaluation response: expected 6 dimension scores, received ${aiResult.dimension_scores.length}.`);
    }

    for (const expected of EXPECTED_DIMENSIONS) {
      const found = aiResult.dimension_scores.find((d) => d.dimension === expected.name);
      if (!found) {
        throw new Error(`Invalid AI evaluation response: missing expected dimension "${expected.name}".`);
      }
      if (typeof found.dimension_score !== 'number' || typeof found.raw_score !== 'number') {
        throw new Error(`Invalid AI evaluation response: dimension "${expected.name}" has invalid score values.`);
      }
      if (Math.abs(found.weight - expected.weight) > 0.001) {
        throw new Error(`Invalid AI evaluation response: dimension "${expected.name}" weight mismatch (expected ${expected.weight}, got ${found.weight}).`);
      }
    }

    return {
      status: 'SUCCESS',
      isDegraded: false,
      totalScore,
      dimensionScores: aiResult.dimension_scores,
      requirementsEvaluation: Array.isArray(aiResult.requirements_evaluation) ? aiResult.requirements_evaluation : [],
      feedbackSummary: typeof aiResult.feedback_summary === 'string' ? aiResult.feedback_summary : '',
      strengths: Array.isArray(aiResult.strengths) ? aiResult.strengths : [],
      weaknesses: Array.isArray(aiResult.weaknesses) ? aiResult.weaknesses : [],
      recommendations: Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [],
      suspiciousFlags: Array.isArray(aiResult.suspicious_flags) ? aiResult.suspicious_flags : [],
      contributions: Array.isArray(aiResult.contributions) ? aiResult.contributions : [],
      evidenceManifest: aiResult.evidence_manifest || null,
      repository: aiResult.repository || null
    };
  }

  throw new Error(`Invalid AI evaluation response: unrecognized status "${aiResult.status}". Expected "SUCCESS" or "EVALUATION_DEGRADED".`);
};

/**
 * Orchestrates the evaluation of a submission by communicating with the FastAPI AI Service.
 *
 * @param {string} submissionId - UUID of the submission to evaluate
 * @returns {Promise<Object>}
 */
const runEvaluation = async (submissionId) => {
  let isClaimed = false;

  try {
    // 1. Fetch submission, battle, and challenge details
    const { data: submission, error: subErr } = await supabaseAdmin
      .from('submissions')
      .select('*, battles(challenge_id, challenges(id, title, requirements, constraints))')
      .eq('id', submissionId)
      .single();

    if (subErr || !submission) {
      throw new Error(`Submission not found (ID: ${submissionId}).`);
    }

    // Guard A: Already completed evaluation (EVALUATED)
    if (submission.status === 'EVALUATED') {
      console.warn(`[Evaluation] Submission ${submissionId} has already been evaluated. Returning existing record.`);
      const { data: existingEval } = await supabaseAdmin
        .from('evaluations')
        .select('*, evaluation_scores(*), contribution_analysis(*)')
        .eq('submission_id', submissionId)
        .single();

      return {
        success: true,
        status: 'EVALUATED',
        alreadyEvaluated: true,
        finalScore: existingEval?.total_score ?? null,
        totalScore: existingEval?.total_score ?? null,
        teamXpAwarded: submission.team_xp_awarded || 0,
        dimensionScores: existingEval?.evaluation_scores || [],
        feedbackSummary: existingEval?.feedback_summary || null,
        contributions: existingEval?.contribution_analysis || []
      };
    }

    // Guard B: Already completed in degraded mode (DEGRADED)
    if (submission.status === 'DEGRADED') {
      console.warn(`[Evaluation] Submission ${submissionId} was previously recorded as DEGRADED. Returning existing record.`);
      const { data: existingEval } = await supabaseAdmin
        .from('evaluations')
        .select('*, contribution_analysis(*)')
        .eq('submission_id', submissionId)
        .single();

      return {
        success: false,
        status: 'EVALUATED_DEGRADED',
        alreadyEvaluated: true,
        finalScore: null,
        totalScore: null,
        teamXpAwarded: 0,
        feedbackSummary: existingEval?.feedback_summary || null,
        contributions: existingEval?.contribution_analysis || []
      };
    }

    // Guard C: Another request is currently evaluating this submission (EVALUATING)
    if (submission.status === 'EVALUATING') {
      console.warn(`[Evaluation] Submission ${submissionId} is currently being evaluated by another request.`);
      return {
        success: false,
        status: 'IN_PROGRESS',
        message: 'Evaluation is currently in progress by another worker.'
      };
    }

    // Guard D: Previously failed evaluation (FAILED)
    if (submission.status === 'FAILED') {
      console.warn(`[Evaluation] Submission ${submissionId} previously FAILED and cannot be automatically repeated.`);
      return {
        success: false,
        status: 'FAILED',
        message: 'Submission evaluation previously failed and cannot be automatically repeated.'
      };
    }

    // Guard E: Submission must be in SUBMITTED state to begin evaluation
    if (submission.status !== 'SUBMITTED') {
      return {
        success: false,
        status: 'INVALID_STATUS',
        message: `Submission status "${submission.status}" cannot be transitioned to evaluation.`
      };
    }

    // Atomic Conditional Claim: Transition status from SUBMITTED to EVALUATING
    // Only succeeds if status is still SUBMITTED at the moment of update
    const { data: claimData, error: claimErr } = await supabaseAdmin
      .from('submissions')
      .update({ status: 'EVALUATING' })
      .eq('id', submissionId)
      .eq('status', 'SUBMITTED')
      .select('id, status');

    if (claimErr || !claimData || claimData.length === 0) {
      console.warn(`[Evaluation] Concurrency collision: Submission ${submissionId} was claimed by another worker.`);
      return {
        success: false,
        status: 'CONFLICT',
        message: 'Submission was claimed by another evaluation worker concurrently.'
      };
    }

    isClaimed = true;
    console.log(`[Evaluation] Successfully claimed submission ${submissionId} for evaluation.`);

    // 2. Fetch Team Members
    const { data: members, error: memErr } = await supabaseAdmin
      .from('team_members')
      .select('profile_id, profiles(github_username)')
      .eq('team_id', submission.team_id);

    if (memErr || !members || !members.length) {
      throw new Error(`Team members not found for team ID: ${submission.team_id}.`);
    }

    // 3. Resolve AI Service configuration
    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (!aiServiceUrl) {
      throw new Error('AI_SERVICE_URL configuration is missing on the server.');
    }

    // Target endpoint is strictly POST /evaluate (do NOT append /api)
    const cleanServiceUrl = aiServiceUrl.replace(/\/+$/, '');
    const endpoint = `${cleanServiceUrl}/evaluate`;

    // 4. Construct payload adhering to FastAPI's ChallengeEvaluationRequest schema
    // Use canonical repo_url with fallback to github_url
    const rawRepoUrl = submission.repo_url || submission.github_url;
    const challengeDetails = submission.battles?.challenges || submission.challenges || {};
    const challengeId = submission.battles?.challenge_id || submission.challenge_id || challengeDetails.id || null;
    const challengeTitle = challengeDetails.title || null;
    const rawRequirements = challengeDetails.requirements || null;

    const aiPayload = buildAiPayload({
      repoUrl: rawRepoUrl,
      challengeId,
      challengeTitle,
      rawRequirements
    });

    // 5. Build headers with optional Bearer token
    const headers = {
      'Content-Type': 'application/json'
    };
    const serviceKey = process.env.AI_SERVICE_KEY;
    if (serviceKey) {
      headers['Authorization'] = `Bearer ${serviceKey.trim()}`;
    }

    console.log(`[Evaluation] Calling AI Service at ${endpoint} for ${aiPayload.owner}/${aiPayload.repo}`);

    // Set a 180s timeout for repository evidence fetching and AI analysis
    const response = await axios.post(endpoint, aiPayload, {
      headers,
      timeout: 180000
    });

    const aiResult = response.data;

    // 6. Validate AI response against authoritative schema
    const validated = validateAndExtractAiResult(aiResult);

    // -------------------------------------------------------------------------
    // Branch A: EVALUATION_DEGRADED
    // -------------------------------------------------------------------------
    if (validated.isDegraded) {
      console.warn(`[Evaluation] AI Service returned degraded mode for submission ${submissionId}: ${validated.degradedReason}`);

      // Transition submission to DEGRADED with 0 XP awarded
      await supabaseAdmin
        .from('submissions')
        .update({ status: 'DEGRADED', team_xp_awarded: 0 })
        .eq('id', submissionId);

      // Persist degraded evaluation master record with null total_score
      const { data: evalRecord, error: evalErr } = await supabaseAdmin
        .from('evaluations')
        .insert([{
          submission_id: submissionId,
          team_id: submission.team_id,
          challenge_id: challengeId,
          total_score: null,
          feedback_summary: `Evaluation degraded: ${validated.degradedReason || 'AI service fallback'}`,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          suspicious_flags: [],
          raw_ai_response: {
            status: 'EVALUATION_DEGRADED',
            degraded_reason: validated.degradedReason,
            evidence_manifest: validated.evidenceManifest
          },
          evaluated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (evalErr) {
        console.error('[Evaluation] Warning: Could not insert degraded evaluation record:', evalErr.message);
      }

      // Record any available contribution heuristics without XP into canonical contribution_analysis
      if (evalRecord && validated.contributions && validated.contributions.length > 0) {
        const contribRows = [];
        for (const member of members) {
          const gitUser = member.profiles?.github_username;
          const contrib = validated.contributions.find(
            (c) => (c.github_username && c.github_username === gitUser) ||
                   (c.contributor && c.contributor === gitUser) ||
                   (c.username && c.username === gitUser)
          );
          const percentage = contrib ? contrib.estimated_percentage : Math.floor(100 / members.length);

          contribRows.push({
            evaluation_id: evalRecord.id,
            profile_id: member.profile_id,
            github_username: gitUser || 'unknown',
            estimated_percentage: percentage,
            summary: contrib?.evidence ? contrib.evidence.join('; ') : 'Degraded heuristic analysis',
            signals: {
              evidence: contrib?.evidence || [],
              confidence: contrib?.confidence || 'LOW',
              individual_xp_awarded: 0
            }
          });
        }

        if (contribRows.length > 0) {
          await supabaseAdmin.from('contribution_analysis').insert(contribRows);
        }
      }

      return {
        success: false,
        status: 'EVALUATION_DEGRADED',
        degradedReason: validated.degradedReason,
        finalScore: null,
        totalScore: null,
        teamXpAwarded: 0,
        contributions: validated.contributions,
        evidenceManifest: validated.evidenceManifest,
        repository: validated.repository
      };
    }

    // -------------------------------------------------------------------------
    // Branch B: SUCCESS
    // -------------------------------------------------------------------------
    // Use Python's deterministic total_score as authoritative
    const finalScore = validated.totalScore;

    // Base XP rules based on final score
    const teamXpAwarded = finalScore >= 80 ? 200 : finalScore >= 50 ? 100 : 50;

    // 1. Update submission record to EVALUATED
    await supabaseAdmin
      .from('submissions')
      .update({ status: 'EVALUATED', team_xp_awarded: teamXpAwarded })
      .eq('id', submissionId);

    // 2. Persist master evaluations record
    const { data: evalRecord, error: evalErr } = await supabaseAdmin
      .from('evaluations')
      .insert([{
        submission_id: submissionId,
        team_id: submission.team_id,
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
      }])
      .select()
      .single();

    if (evalErr) {
      throw new Error(`Failed to persist evaluation record: ${evalErr.message}`);
    }

    // 3. Persist individual 6 dimension scores in evaluation_scores
    if (evalRecord && validated.dimensionScores && validated.dimensionScores.length > 0) {
      const dimensionRows = validated.dimensionScores.map((dim) => ({
        evaluation_id: evalRecord.id,
        dimension: dim.dimension,
        raw_score: dim.raw_score,
        weight: dim.weight,
        weighted_score: dim.weighted_score,
        status: dim.rationale || dim.status || 'SCORED'
      }));

      const { error: dimErr } = await supabaseAdmin
        .from('evaluation_scores')
        .insert(dimensionRows);

      if (dimErr) {
        console.error('[Evaluation] Warning: Failed to persist dimension scores:', dimErr.message);
      }
    }

    // 4. Update team total_xp
    const { data: teamData } = await supabaseAdmin
      .from('teams')
      .select('total_xp')
      .eq('id', submission.team_id)
      .single();

    await supabaseAdmin
      .from('teams')
      .update({ total_xp: ((teamData && teamData.total_xp) || 0) + teamXpAwarded })
      .eq('id', submission.team_id);

    // 5. Calculate rating and outcome
    const { ratingChange, battleResult } = calculateRatingChange(finalScore);

    // 6. Distribute individual XP, update user_stats (canonical store), and persist contribution_analysis
    const contribRows = [];
    for (const member of members) {
      const gitUser = member.profiles?.github_username;
      const contrib = validated.contributions.find(
        (c) => (c.github_username && c.github_username === gitUser) ||
               (c.contributor && c.contributor === gitUser) ||
               (c.username && c.username === gitUser)
      );
      const percentage = contrib ? contrib.estimated_percentage : Math.floor(100 / members.length);
      const individualXp = Math.floor(teamXpAwarded * (percentage / 100));

      if (evalRecord) {
        contribRows.push({
          evaluation_id: evalRecord.id,
          profile_id: member.profile_id,
          github_username: gitUser || 'unknown',
          estimated_percentage: percentage,
          summary: contrib?.evidence ? contrib.evidence.join('; ') : 'AI contribution analysis',
          signals: {
            evidence: contrib?.evidence || [],
            confidence: contrib?.confidence || 'MEDIUM',
            individual_xp_awarded: individualXp
          }
        });
      }

      // Update user_stats as the single authoritative store for player statistics
      const { data: currentStats } = await supabaseAdmin
        .from('user_stats')
        .select('xp, rating, battles_played, battles_won')
        .eq('profile_id', member.profile_id)
        .single();

      const currentXp = currentStats?.xp || 0;
      const currentRating = currentStats?.rating || 1000;
      const played = (currentStats?.battles_played || 0) + 1;
      const won = battleResult === 'WIN' ? (currentStats?.battles_won || 0) + 1 : (currentStats?.battles_won || 0);

      const newXp = currentXp + individualXp;
      const newRating = Math.max(0, currentRating + ratingChange);

      await supabaseAdmin
        .from('user_stats')
        .upsert({
          profile_id: member.profile_id,
          xp: newXp,
          rating: newRating,
          battles_played: played,
          battles_won: won,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id' });
    }

    if (contribRows.length > 0) {
      const { error: contribErr } = await supabaseAdmin
        .from('contribution_analysis')
        .insert(contribRows);

      if (contribErr) {
        console.error('[Evaluation] Warning: Failed to persist contribution analysis:', contribErr.message);
      }
    }

    return {
      success: true,
      status: 'SUCCESS',
      finalScore,
      totalScore: finalScore,
      teamXpAwarded,
      dimensionScores: validated.dimensionScores,
      feedbackSummary: validated.feedbackSummary,
      strengths: validated.strengths,
      weaknesses: validated.weaknesses,
      recommendations: validated.recommendations,
      requirementsEvaluation: validated.requirementsEvaluation,
      contributions: validated.contributions
    };

  } catch (err) {
    const statusMsg = err.response ? `[HTTP ${err.response.status}]` : '';
    const detailMsg = err.response?.data?.message || err.message;
    console.error(`[Evaluation Orchestration Error]: ${statusMsg} ${detailMsg}`);

    // If failure occurred after the submission was claimed into EVALUATING,
    // transition status to FAILED so it is not permanently stuck
    if (isClaimed) {
      try {
        await supabaseAdmin
          .from('submissions')
          .update({ status: 'FAILED' })
          .eq('id', submissionId)
          .eq('status', 'EVALUATING');
        console.warn(`[Evaluation] Transitioned claimed submission ${submissionId} to FAILED.`);
      } catch (recoveryErr) {
        console.error(`[Evaluation Recovery Error]: Could not transition submission ${submissionId} to FAILED: ${recoveryErr.message}`);
      }
    }

    throw new Error(`Evaluation orchestration failed: ${detailMsg}`);
  }
};

module.exports = {
  runEvaluation,
  parseGitHubUrl,
  normalizeRequirements,
  buildAiPayload,
  validateAndExtractAiResult,
  EXPECTED_DIMENSIONS
};
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowRight, 
  Cpu, 
  ShieldCheck, 
  Share2, 
  Loader2,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { GithubIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { getTeamResults, getCurrentTeam, optInToShowcase } from '../services/api';

/**
 * Verified historical evaluation fixture produced by the genuine evaluation of
 * repository TanishkaDewan/klyro (branch feature/frontend) against the
 * KLYRO Competitive Coding Frontend Arena challenge (Total Score: 72.8/100).
 * Used when /results?historical=true or /results?demo=true is accessed.
 */
const HISTORICAL_VERIFIED_728_FIXTURE = {
  id: 'ecc318a4-hist-728',
  repo_url: 'https://github.com/TanishkaDewan/klyro',
  status: 'EVALUATED',
  team_xp_awarded: 100,
  submitted_at: '2026-10-14T16:46:36.623Z',
  battles: {
    id: 'd5a5634d-frontend-arena',
    challenges: {
      id: '4806bc5c-frontend-arena',
      title: 'KLYRO Competitive Coding Frontend Arena',
      difficulty: 'HARD'
    }
  },
  evaluation: {
    id: 'eval-hist-728',
    total_score: 72.8,
    feedback_summary: 'KLYRO shows a very strong architectural foundation with a professional-grade frontend setup. The routing and global state management are correctly implemented. While the core "Arena" functionality could not be fully verified due to file inspection limits, the existing code suggests a high level of technical competence.',
    strengths: [
      'Clean and idiomatic React code using modern hooks and Context API.',
      'Sophisticated UI/UX architecture with layered visual components.',
      'Well-documented monorepo structure and team responsibilities.',
      'Robust routing configuration covering all required application states.'
    ],
    weaknesses: [
      'Very low commit count (4) for a project of this scope.',
      'Heavy reliance on mock data in the AuthContext snippet.',
      'Primary feature logic (Arena Cockpit) was not available in the inspected source files.'
    ],
    recommendations: [
      'Implement real API integration within the AuthContext to replace mock user data.',
      'Increase commit frequency to demonstrate iterative progress and collaborative development.',
      'Add unit tests for the AuthContext and routing logic to ensure stability.'
    ],
    evaluation_scores: [
      {
        dimension: 'Technical Quality',
        raw_score: 3.8,
        dimension_score: 76.0,
        weight: 0.20,
        weighted_score: 15.2,
        status: 'SCORED'
      },
      {
        dimension: 'Architecture & Engineering',
        raw_score: 4.2,
        dimension_score: 84.0,
        weight: 0.15,
        weighted_score: 12.6,
        status: 'SCORED'
      },
      {
        dimension: 'Functionality & Completeness',
        raw_score: 3.0,
        dimension_score: 60.0,
        weight: 0.20,
        weighted_score: 12.0,
        status: 'SCORED'
      },
      {
        dimension: 'Innovation & Problem Solving',
        raw_score: 3.5,
        dimension_score: 70.0,
        weight: 0.15,
        weighted_score: 10.5,
        status: 'SCORED'
      },
      {
        dimension: 'Feasibility & Scalability',
        raw_score: 4.0,
        dimension_score: 80.0,
        weight: 0.15,
        weighted_score: 12.0,
        status: 'SCORED'
      },
      {
        dimension: 'Documentation & Engineering Process',
        raw_score: 3.5,
        dimension_score: 70.0,
        weight: 0.15,
        weighted_score: 10.5,
        status: 'SCORED'
      }
    ],
    contribution_analysis: [
      {
        profile_id: 'contrib-siddhant',
        github_username: 'Siddhantpatil3158',
        estimated_percentage: 100,
        summary: '4 commits recorded in contributor log; touched frontend/package.json, frontend/src/App.jsx.',
        confidence: 'MEDIUM'
      }
    ]
  }
};

const DEMO_SUBMISSION_FIXTURE = HISTORICAL_VERIFIED_728_FIXTURE;

export default function BattleResultsPage() {
  const { user, session, loading: authLoading, openAuthModal } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true' || searchParams.get('historical') === 'true';
  const queryTeamId = searchParams.get('teamId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  
  const [showcaseOptIn, setShowcaseOptIn] = useState(false);
  const [optingIn, setOptingIn] = useState(false);
  const [optInSuccess, setOptInSuccess] = useState(false);
  const [optInError, setOptInError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchResults = async () => {
    if (isDemoMode) {
      setSubmission(HISTORICAL_VERIFIED_728_FIXTURE);
      setLoading(false);
      setError(null);
      return;
    }

    if (authLoading) return;

    if (!user && !session) {
      setError('AUTH_REQUIRED');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let teamId = queryTeamId;

      if (!teamId) {
        // Fallback: try fetching the user's current team
        const currentTeamRes = await getCurrentTeam();
        teamId = currentTeamRes?.team?.id;
      }

      if (!teamId) {
        setError('No active battle team identified. Please provide a team ID or participate in an active battle.');
        setLoading(false);
        return;
      }

      const res = await getTeamResults(teamId);
      const results = res?.results || [];

      if (results.length === 0) {
        setSubmission(null);
      } else {
        setSubmission(results[0]); // most recent submission
      }
    } catch (err) {
      console.error('Failed to load battle results:', err);
      if (err.status === 401 || err.code === 'AUTH_REQUIRED' || err.message?.includes('Authorization') || err.message?.includes('Authentication')) {
        setError('AUTH_REQUIRED');
      } else {
        setError(err.message || 'Failed to retrieve team battle results from server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setSubmission(DEMO_SUBMISSION_FIXTURE);
      setLoading(false);
      setError(null);
      return;
    }

    // Do not initiate protected network requests while session is initializing
    if (authLoading) {
      return;
    }

    if (!user && !session) {
      setError('AUTH_REQUIRED');
      setLoading(false);
      return;
    }

    fetchResults();
  }, [isDemoMode, queryTeamId, authLoading, user, session]);

  const handleOptIn = async (e) => {
    const checked = e.target.checked;
    setShowcaseOptIn(checked);
    if (!checked || !submission?.id) return;

    if (isDemoMode) {
      setOptInSuccess(true);
      setTimeout(() => setOptInSuccess(false), 5000);
      return;
    }

    setOptingIn(true);
    setOptInError(null);
    try {
      await optInToShowcase(submission.id);
      setOptInSuccess(true);
      setTimeout(() => setOptInSuccess(false), 5000);
    } catch (err) {
      console.error('Showcase opt-in failed:', err);
      setOptInError(err.message || 'Failed to opt-in to public showcase.');
      setShowcaseOptIn(false);
    } finally {
      setOptingIn(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (authLoading || (loading && !error)) {
    return (
      <div className="pt-36 pb-20 max-w-7xl mx-auto px-6 text-center">
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-white/50">
          <Loader2 size={36} className="animate-spin text-[#22d3ee]" />
          <span className="text-xs font-mono uppercase tracking-widest">
            {authLoading ? 'Verifying Squad Authentication...' : 'Retrieving Verifiable AI Battle Audit...'}
          </span>
        </div>
      </div>
    );
  }

  if (error === 'AUTH_REQUIRED') {
    return (
      <div className="pt-36 pb-20 max-w-2xl mx-auto px-6 text-center">
        <div className="p-8 sm:p-10 rounded-2xl bg-[#070b12]/95 border border-[#22d3ee]/30 text-white space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#22d3ee]/10 to-transparent blur-3xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-[#22d3ee]/10 border border-[#22d3ee]/30 flex items-center justify-center mx-auto text-[#22d3ee]">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-jakarta uppercase tracking-tight text-white">
              Authentication Required
            </h2>
            <p className="text-xs text-white/60 font-sans mt-2 max-w-md mx-auto leading-relaxed">
              Squad battle evaluations and telemetry are protected. Please sign in to authenticate with your Supabase session or inspect the verified historical audit.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => openAuthModal('login')}
              className="px-6 py-2.5 rounded-xl bg-[#22d3ee] text-[#070b12] text-xs font-bold font-jakarta uppercase tracking-wider hover:bg-[#38bdf8] transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              Sign In to View Results
            </button>
            <Link
              to={`/results?teamId=${queryTeamId || ''}&historical=true`}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-semibold border border-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Historical Audit (72.8)</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-36 pb-20 max-w-2xl mx-auto px-6 text-center">
        <div className="p-8 rounded-2xl bg-[#070b12]/90 border border-red-500/30 text-red-400 space-y-4 shadow-2xl">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <h2 className="text-xl font-bold text-white">Battle Results Unavailable</h2>
          <p className="text-xs text-white/60 font-sans">{error}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={fetchResults}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-mono text-red-300 transition-colors"
            >
              <RefreshCw size={12} />
              <span>Retry Query</span>
            </button>
            <Link
              to="/arena"
              className="px-5 py-2 rounded-lg bg-[#22d3ee] text-[#070b12] text-xs font-bold font-jakarta uppercase"
            >
              Back to Arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="pt-36 pb-20 max-w-md mx-auto px-6 text-center">
        <div className="p-8 rounded-2xl bg-[#070b12]/80 border border-white/10 space-y-3">
          <Info size={32} className="mx-auto text-white/40" />
          <h3 className="text-lg font-bold text-white">No Submission Found</h3>
          <p className="text-xs text-white/50 font-sans">
            This squad has not submitted a challenge repository for evaluation yet.
          </p>
          <div className="pt-2">
            <Link
              to="/arena"
              className="inline-block px-6 py-2.5 rounded-lg bg-[#22d3ee] text-[#070b12] text-xs font-bold font-jakarta uppercase"
            >
              Go to Arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const evaluation = submission.evaluation;
  // Pending: submission is queued or currently being evaluated by the background workers
  const isPending = !evaluation && (submission.status === 'SUBMITTED' || submission.status === 'EVALUATING');

  // Degraded: evaluation completed or explicitly recorded in degraded fallback mode without scores
  const isDegraded = 
    submission.status === 'DEGRADED' ||
    submission.status === 'EVALUATION_DEGRADED' ||
    evaluation?.status === 'EVALUATION_DEGRADED' ||
    (!isPending && evaluation && evaluation.total_score == null);

  const challenge = submission.battles?.challenges;
  const challengeTitle = challenge?.title || 'Competitive Arena Battle';
  const difficulty = challenge?.difficulty || 'EXPERT';
  const repoUrl = submission.repo_url || submission.github_url || '';
  const scores = evaluation?.evaluation_scores || [];
  const contributions = evaluation?.contribution_analysis || submission.contributions || [];
  const totalScore = evaluation?.total_score;
  const xpAwarded = submission.team_xp_awarded || 0;

  return (
    <div className="relative pt-28 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Explicit Historical / Demo Evaluation Notice */}
      {isDemoMode && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#22d3ee]/10 border-2 border-[#22d3ee]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[#22d3ee] shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="shrink-0 text-[#22d3ee]" />
            <div>
              <span className="font-mono font-black text-sm uppercase tracking-wider block text-white">
                HISTORICAL VERIFIED EVALUATION — 72.8 / 100
              </span>
              <span className="text-xs text-white/70 font-sans block mt-0.5">
                Displaying the genuine verified AI evaluation for repository <strong className="text-[#22d3ee]">TanishkaDewan/klyro</strong> (branch feature/frontend) on the KLYRO Frontend Arena challenge. This is a previously completed evaluation, not a new live AI request.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#22d3ee]/20 text-[#22d3ee] font-mono text-xs font-bold border border-[#22d3ee]/40 uppercase tracking-widest shrink-0">
            HISTORICAL AUDIT
          </span>
        </div>
      )}

      {/* Top Banner */}
      <div className="mb-10 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#070b12] via-[#0f172a] to-[#070b12] border border-[#22d3ee]/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#22d3ee]/20 via-[#6366f1]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#22d3ee]/10 text-[#22d3ee] font-bold border border-[#22d3ee]/30">
                {submission.status || 'EVALUATED'}
              </span>
              <span className="font-mono text-xs text-white/50">SUB-{submission.id?.slice(0, 8)}</span>
              <span className="font-mono text-xs text-white/40">·</span>
              <span className="font-mono text-xs text-white/40">{difficulty}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white uppercase tracking-tight">
              {challengeTitle}
            </h1>
            {repoUrl && (
              <p className="text-xs text-white/50 font-mono mt-1">
                Repository:{' '}
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#22d3ee] underline underline-offset-2"
                >
                  {repoUrl}
                </a>
              </p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center p-4 px-6 rounded-2xl bg-[#070b12]/90 border border-white/10 shadow-lg">
              <div className="text-[11px] font-mono text-white/40 uppercase">AI Composite Score</div>
              <div className="text-4xl sm:text-5xl font-mono font-black text-[#22d3ee] tracking-tight">
                {isPending ? 'PENDING' : isDegraded || totalScore == null ? 'N/A' : totalScore}
              </div>
              <div className="text-[10px] font-mono text-white/30">
                {isPending ? 'EVALUATION IN PROGRESS' : isDegraded ? 'DEGRADED EVALUATION' : 'OUT OF 100'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 px-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                +{xpAwarded} XP GAINED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending / Processing Alert Banner */}
      {isPending && (
        <div className="mb-8 p-6 rounded-2xl bg-[#22d3ee]/10 border border-[#22d3ee]/30 flex items-start gap-4 text-[#22d3ee]">
          <Loader2 size={24} className="shrink-0 mt-0.5 animate-spin text-[#22d3ee]" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm uppercase font-mono tracking-wider text-white">
              Evaluation In Progress
            </h4>
            <p className="text-xs text-white/70 font-sans leading-relaxed">
              Your repository submission is currently queued and being analyzed by the KLYRO AI multi-agent evaluation engine.
              Git history, architecture structure, and challenge requirement fulfillment are being evaluated.
              Verified scores will display once evaluation completes.
            </p>
          </div>
        </div>
      )}

      {/* Degraded Alert Banner */}
      {isDegraded && (
        <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 text-amber-300">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm uppercase font-mono tracking-wider">
                AI Scoring Temporarily Unavailable (Degraded Mode)
              </h4>
              <p className="text-xs text-amber-200/80 font-sans leading-relaxed">
                The automated AI evaluation service is temporarily unavailable due to upstream Gemini quota constraints (429 / 503).
                Your repository submission has been safely preserved in Supabase. In accordance with KLYRO verifiable evaluation rules,
                scores are never invented or defaulted to zero.
              </p>
            </div>
          </div>
          <div className="pt-1 pl-10 flex items-center gap-3">
            <Link
              to="/results?historical=true"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-bold border border-amber-500/40 transition-colors"
            >
              <span>View Verified Historical Evaluation (72.8/100)</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Main Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Dimensions Card */}
          {isPending && (
            <div className="p-7 rounded-2xl bg-[#070b12]/80 border border-[#22d3ee]/20 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-[#22d3ee]" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-jakarta">
                    6-Dimension AI Consensus
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/30 uppercase font-bold flex items-center gap-1.5">
                  <Loader2 size={10} className="animate-spin" />
                  Processing
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#22d3ee]/5 border border-[#22d3ee]/15 text-xs text-white/70 font-sans leading-relaxed space-y-1.5">
                <p>
                  AI dimension scoring is underway. Scores remain pending until full verification completes.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {[
                  'Technical Quality',
                  'Architecture & Engineering',
                  'Functionality & Completeness',
                  'Innovation & Problem Solving',
                  'Feasibility & Scalability',
                  'Documentation & Tests'
                ].map((dimName) => (
                  <div key={dimName} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                    <div className="text-[11px] text-white/50 font-sans line-clamp-1">{dimName}</div>
                    <div className="text-xs font-mono font-semibold text-[#22d3ee]/80">Pending...</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Degraded Unavailable Dimensions Card */}
          {isDegraded && (
            <div className="p-7 rounded-2xl bg-[#070b12]/80 border border-amber-500/20 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-amber-400" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-jakarta">
                    6-Dimension AI Consensus Status
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase font-bold">
                  Scores Unavailable
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-white/70 font-sans leading-relaxed space-y-1.5">
                <p>
                  AI dimension scoring is paused while upstream evaluation services recover. Dimension scores are not fabricated or defaulted to zero.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {[
                  'Technical Quality',
                  'Architecture & Engineering',
                  'Functionality & Completeness',
                  'Innovation & Problem Solving',
                  'Feasibility & Scalability',
                  'Documentation & Tests'
                ].map((dimName) => (
                  <div key={dimName} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                    <div className="text-[11px] text-white/50 font-sans line-clamp-1">{dimName}</div>
                    <div className="text-xs font-mono font-semibold text-amber-300/80">Unavailable</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6-Dimension Score Matrix */}
          {scores.length > 0 && !isDegraded && !isPending && (
            <div className="p-7 rounded-2xl bg-[#070b12]/80 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-[#22d3ee]" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-jakarta">
                    6-Dimension Weighted Evaluation
                  </h3>
                </div>
                <span className="text-xs font-mono text-white/40">Verified AI Dimension Analysis</span>
              </div>

              <div className="space-y-5">
                {scores.map((dim) => {
                  const weightPct = dim.weight ? `${Math.round(dim.weight * 100)}%` : '';
                  const scoreVal = dim.dimension_score ?? (typeof dim.raw_score === 'number' && dim.raw_score <= 5.0 ? Math.round((dim.raw_score / 5.0) * 100 * 10) / 10 : dim.raw_score) ?? dim.score ?? 0;
                  return (
                    <div key={dim.dimension} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{dim.dimension}</span>
                          {weightPct && (
                            <span className="text-[10px] font-mono text-white/40">({weightPct} weight)</span>
                          )}
                        </div>
                        <div className="font-mono font-bold text-[#22d3ee]">{scoreVal} / 100</div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#22d3ee] to-[#6366f1] rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, scoreVal)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Qualitative AI Feedback */}
          {evaluation && (evaluation.strengths?.length > 0 || evaluation.weaknesses?.length > 0 || evaluation.recommendations?.length > 0) && (
            <div className="p-7 rounded-2xl bg-[#070b12]/80 border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <Sparkles size={16} className="text-[#22d3ee]" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-jakarta">
                  AI Arbiter Qualitative Diagnosis
                </h3>
              </div>

              {evaluation.feedback_summary && (
                <p className="text-xs text-white/70 italic font-sans border-l-2 border-[#22d3ee] pl-3 py-1">
                  "{evaluation.feedback_summary}"
                </p>
              )}

              <div className="space-y-4 text-xs font-sans">
                {evaluation.strengths?.length > 0 && (
                  <div>
                    <h4 className="font-mono text-emerald-400 font-bold uppercase mb-2">Key Strengths</h4>
                    <ul className="space-y-1.5 list-disc list-inside text-white/70">
                      {evaluation.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.weaknesses?.length > 0 && (
                  <div>
                    <h4 className="font-mono text-amber-400 font-bold uppercase mb-2">Areas for Optimization</h4>
                    <ul className="space-y-1.5 list-disc list-inside text-white/70">
                      {evaluation.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-mono text-[#22d3ee] font-bold uppercase mb-2">Actionable Recommendations</h4>
                    <ul className="space-y-1.5 list-disc list-inside text-white/70">
                      {evaluation.recommendations.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: AI-Assisted Estimated Contribution & Actions */}
        <div className="space-y-8">
          {/* AI-Assisted Estimated Contribution */}
          <div className="p-7 rounded-2xl bg-[#070b12]/80 border border-white/10 shadow-xl">
            <div className="mb-4">
              <span className="text-[10px] font-mono text-[#22d3ee] uppercase font-bold tracking-wider">
                SIGNATURE TELEMETRY
              </span>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-jakarta mt-0.5">
                AI-assisted estimated contribution
              </h3>
              <p className="text-[11px] text-white/50 mt-1 font-sans">
                Estimated from commit complexity, architectural ownership, and PR velocity.
              </p>
            </div>

            {contributions.length === 0 ? (
              <p className="text-xs text-white/40 font-mono">No individual breakdown recorded for this submission.</p>
            ) : (
              <div className="space-y-6">
                {contributions.map((member, idx) => {
                  const pct = member.estimated_percentage ?? member.contribution_percentage ?? 0;
                  const githubHandle = member.github_username || member.profiles?.github_username || 'contributor';
                  const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${githubHandle}`;

                  return (
                    <div key={member.profile_id || idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={avatar} alt={githubHandle} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                          <div>
                            <div className="text-xs font-bold text-white">@{githubHandle}</div>
                            <div className="text-[10px] font-mono text-white/40">Verified Member</div>
                          </div>
                        </div>
                        <div className="text-right font-mono font-black text-lg text-[#22d3ee]">
                          {pct}%
                        </div>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-[#22d3ee] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {member.summary && (
                        <p className="text-[11px] font-sans text-white/60">
                          {member.summary}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Winner Showcase Opt-in Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#070b12] border border-[#22d3ee]/30 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22d3ee] font-bold uppercase">
              <Trophy size={16} />
              <span>VICTORY SHOWCASE PRIVILEGE</span>
            </div>
            <p className="text-xs text-white/70 font-sans leading-relaxed">
              You can grant permission to publish this project in the <strong>KLYRO Hall of Fame Showcase</strong> for public peer review.
            </p>

            {optInSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-sans">
                ✓ Successfully published to Hall of Fame Showcase!
              </div>
            )}

            {optInError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-sans">
                {optInError}
              </div>
            )}

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                disabled={optingIn}
                checked={showcaseOptIn}
                onChange={handleOptIn}
                className="w-4 h-4 accent-[#22d3ee] rounded disabled:opacity-50"
              />
              <span className="text-xs font-medium text-white flex items-center gap-2">
                <span>Showcase repository on KLYRO Public Hall of Fame</span>
                {optingIn && <Loader2 size={12} className="animate-spin text-[#22d3ee]" />}
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleShare}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold font-jakarta uppercase tracking-wider border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={14} />
                <span>{copiedLink ? 'LINK COPIED!' : 'SHARE RESULT'}</span>
              </button>

              <Link
                to="/arena"
                className="btn-arena flex-1 py-3 rounded-xl bg-[#22d3ee] text-[#070b12] text-xs font-bold font-jakarta uppercase tracking-wider hover:bg-[#38bdf8] transition-all flex items-center justify-center gap-2"
              >
                <span>NEXT BATTLE</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

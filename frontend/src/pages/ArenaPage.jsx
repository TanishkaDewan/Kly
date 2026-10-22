import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  ShieldCheck, 
  GitBranch, 
  Check, 
  X, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Send,
  Zap,
  Activity,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { GithubIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { 
  joinMatchmaking, 
  leaveMatchmaking, 
  getCurrentTeam, 
  acceptTeam, 
  rejectTeam, 
  getChallenges, 
  startBattle, 
  submitChallenge, 
  runEvaluation 
} from '../services/api';

export default function ArenaPage() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Matchmaking / Battle state
  // 'IDLE' | 'SEARCHING' | 'PROPOSED' | 'CONFIRMED_BATTLE'
  const [matchState, setMatchState] = useState('IDLE');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Match queue data
  const [selectedSkill, setSelectedSkill] = useState('BACKEND');
  const [searchTime, setSearchTime] = useState(0);

  // Current Team & Battle data
  const [currentTeam, setCurrentTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [myConsentStatus, setMyConsentStatus] = useState('PENDING');
  const [challenges, setChallenges] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);

  // Active Challenge in battle
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Submission state
  const [repoUrl, setRepoUrl] = useState('');
  const [submittingRepo, setSubmittingRepo] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [submissionError, setSubmissionError] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');

  // Countdown timer based on real end_time
  const [secondsLeft, setSecondsLeft] = useState(0);

  // 1. Initial Data Fetch: Check existing team & load challenges
  const checkCurrentStatus = async () => {
    setGeneralError(null);
    try {
      // Fetch available challenges
      try {
        const chalRes = await getChallenges();
        const chalList = chalRes?.challenges || [];
        setChallenges(chalList);
        if (chalList.length > 0 && !selectedChallenge) {
          setSelectedChallenge(chalList[0]);
        }
      } catch (err) {
        console.warn('Could not load challenges list:', err);
      }

      // If user is authenticated, check their current team state
      if (user) {
        const teamRes = await getCurrentTeam();
        if (teamRes?.hasTeam && teamRes.team) {
          const team = teamRes.team;
          setCurrentTeam(team);
          setTeamMembers(teamRes.members || []);
          setMyConsentStatus(teamRes.myStatus || 'PENDING');

          if (teamRes.activeBattle) {
            setActiveBattle(teamRes.activeBattle);
          }
          if (teamRes.challenge) {
            setSelectedChallenge(teamRes.challenge);
          }

          if (team.status === 'PROPOSED') {
            setMatchState('PROPOSED');
          } else if (team.status === 'CONFIRMED' || team.status === 'ACTIVE') {
            setMatchState('CONFIRMED_BATTLE');
          }
        } else {
          // Check if user is actively waiting in matchmaking_queue
          try {
            const { data: queueEntry } = await supabase
              .from('matchmaking_queue')
              .select('*')
              .eq('profile_id', user.id)
              .maybeSingle();

            if (queueEntry) {
              setSelectedSkill(queueEntry.skill_category || 'FRONTEND');
              setMatchState('SEARCHING');
            } else {
              setMatchState('IDLE');
              setCurrentTeam(null);
              setTeamMembers([]);
              setActiveBattle(null);
            }
          } catch (qErr) {
            setMatchState('IDLE');
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync team status:', err);
      // Don't show blocking error for fresh accounts
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    checkCurrentStatus();
  }, [user]);

  // Queue elapsed timer
  useEffect(() => {
    let interval;
    if (matchState === 'SEARCHING') {
      interval = setInterval(() => {
        setSearchTime((t) => t + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [matchState]);

  // Real countdown timer based on activeBattle end_time
  useEffect(() => {
    if (!activeBattle?.end_time) return;
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(activeBattle.end_time).getTime();
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setSecondsLeft(calculateRemaining());
    const timer = setInterval(() => {
      const rem = calculateRemaining();
      setSecondsLeft(rem);
      if (rem <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBattle]);

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Matchmaking Actions
  const handleStartQueue = async () => {
    if (!user) {
      openAuthModal('LOGIN');
      return;
    }
    setActionLoading(true);
    setGeneralError(null);
    try {
      await joinMatchmaking(selectedSkill);
      setMatchState('SEARCHING');
    } catch (err) {
      console.error('Failed to join queue:', err);
      setGeneralError(err.message || 'Failed to enter matchmaking queue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelQueue = async () => {
    setActionLoading(true);
    try {
      await leaveMatchmaking();
    } catch (err) {
      console.warn('Leave queue warning:', err);
    } finally {
      setMatchState('IDLE');
      setActionLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setActionLoading(true);
    await checkCurrentStatus();
    setActionLoading(false);
  };

  const handleAcceptTeam = async () => {
    if (!currentTeam?.id) return;
    setActionLoading(true);
    setGeneralError(null);
    try {
      const res = await acceptTeam(currentTeam.id);
      setMyConsentStatus('ACCEPTED');
      if (res?.team?.status === 'CONFIRMED' || res?.team?.status === 'ACTIVE') {
        setCurrentTeam(res.team);
        setMatchState('CONFIRMED_BATTLE');
      } else {
        await checkCurrentStatus();
      }
    } catch (err) {
      console.error('Failed to accept team proposal:', err);
      setGeneralError(err.message || 'Failed to register acceptance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTeam = async () => {
    if (!currentTeam?.id) return;
    setActionLoading(true);
    setGeneralError(null);
    try {
      await rejectTeam(currentTeam.id);
      setCurrentTeam(null);
      setMatchState('IDLE');
    } catch (err) {
      console.error('Failed to reject team proposal:', err);
      setGeneralError(err.message || 'Failed to reject team proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBattle = async (challengeId) => {
    setActionLoading(true);
    setGeneralError(null);
    try {
      const res = await startBattle(challengeId);
      if (res?.battle) {
        setActiveBattle(res.battle);
        setMatchState('CONFIRMED_BATTLE');
      }
    } catch (err) {
      console.error('Failed to start battle:', err);
      setGeneralError(err.message || 'Failed to initialize active battle.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRepo = async (e) => {
    e.preventDefault();
    setSubmissionError('');
    if (!repoUrl.includes('github.com')) {
      setSubmissionError('Please provide a valid public GitHub repository URL.');
      return;
    }
    const battleId = activeBattle?.id || 'demo-battle';

    setSubmittingRepo(true);
    try {
      const res = await submitChallenge({
        battle_id: battleId,
        github_url: repoUrl,
        repo_url: repoUrl
      });
      setActiveSubmission(res?.submission || { id: 'latest', repo_url: repoUrl });
      setSubmissionSuccess(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmissionError(err.message || 'Failed to submit repository to backend.');
    } finally {
      setSubmittingRepo(false);
    }
  };

  const handleTriggerEvaluation = async () => {
    const submissionId = activeSubmission?.id;
    if (!submissionId) {
      setEvaluationError('No valid submission ID available to evaluate.');
      return;
    }

    setIsEvaluating(true);
    setEvaluationError('');
    try {
      const res = await runEvaluation(submissionId);
      // Navigate to results with current team id
      const teamId = currentTeam?.id || '';
      navigate(`/results?teamId=${teamId}`);
    } catch (err) {
      console.error('Evaluation run failed:', err);
      setEvaluationError(err.message || 'Failed to run AI evaluation. The AI service may be offline or returned degraded status.');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="pt-36 pb-20 max-w-7xl mx-auto px-6 text-center">
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-white/50">
          <Loader2 size={36} className="animate-spin text-[#22d3ee]" />
          <span className="text-xs font-mono uppercase tracking-widest">
            Loading Arena Environment...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-28 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Header Banner */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 mb-3">
          <Zap size={13} className="text-[#22d3ee]" />
          <span className="font-mono text-xs text-[#22d3ee] font-bold uppercase tracking-wider">
            COMPETITIVE ARENA COCKPIT
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
          Matchmaking & Battle Arena
        </h1>
        <p className="text-sm text-white/60 mt-2 font-sans">
          Rule-based matchmaking • Explicit team consent • Real-time challenges • AI development evaluation
        </p>
      </div>

      {/* Global Error Banner */}
      {generalError && (
        <div className="max-w-3xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm font-sans">{generalError}</span>
          </div>
          <button
            onClick={() => setGeneralError(null)}
            className="text-xs font-mono text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* STATE 1: IDLE / QUEUE TRIGGER */}
      {matchState === 'IDLE' && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="p-8 sm:p-10 rounded-2xl bg-[#070b12]/80 border border-white/10 text-center relative overflow-hidden shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#22d3ee]/10 border border-[#22d3ee]/30 flex items-center justify-center text-[#22d3ee] mx-auto mb-6">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Join Active Matchmaking Pool</h2>
            <p className="text-xs text-white/60 max-w-md mx-auto mb-6 font-sans">
              Our rule-based engine pairs complementary specialties (Frontend + Backend + AI) based on your selected skill role.
            </p>

            {/* Skill Category Selector */}
            <div className="mb-8 max-w-md mx-auto">
              <label className="block text-[11px] font-mono uppercase text-white/50 mb-2">
                Select Your Queuing Skill Role:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['BACKEND', 'FRONTEND', 'AI_ML'].map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSelectedSkill(skill)}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all ${
                      selectedSkill === skill
                        ? 'bg-[#22d3ee] text-[#070b12] shadow-sm'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left max-w-xl mx-auto text-xs font-mono text-white/70">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[#22d3ee] block font-bold">01. NO BLACK-BOX ML</span>
                <span className="text-white/40 text-[11px]">Strict skill synergy pairing</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[#22d3ee] block font-bold">02. DUAL CONSENT</span>
                <span className="text-white/40 text-[11px]">All accept or auto-rematch</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[#22d3ee] block font-bold">03. TIMED SPRINT</span>
                <span className="text-white/40 text-[11px]">Live deadline & AI Arbiter</span>
              </div>
            </div>

            <button
              onClick={handleStartQueue}
              disabled={actionLoading}
              className="btn-arena px-10 py-4 rounded-full bg-[#22d3ee] text-[#070b12] font-jakarta text-sm font-bold uppercase tracking-wider hover:bg-[#38bdf8] inline-flex items-center gap-3 shadow-[0_0_30px_rgba(34,211,238,0.4)] disabled:opacity-50"
            >
              {actionLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Entering Queue...</span>
                </>
              ) : (
                <>
                  <span>FIND SQUAD & START BATTLE</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Available Challenges Preview */}
          {challenges.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#070b12]/60 border border-white/10">
              <h3 className="text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-4">
                Active Arena Challenges ({challenges.length})
              </h3>
              <div className="space-y-3">
                {challenges.slice(0, 3).map((ch) => (
                  <div key={ch.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{ch.title}</div>
                      <div className="text-xs text-white/40 font-mono mt-0.5">
                        Category: {ch.category} · Limit: {ch.time_limit_minutes || 2880}m
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 font-bold uppercase">
                      {ch.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: SEARCHING / QUEUE HUD */}
      {matchState === 'SEARCHING' && (
        <div className="max-w-2xl mx-auto">
          <div className="p-10 rounded-2xl bg-[#070b12]/90 border border-[#22d3ee]/40 text-center relative overflow-hidden shadow-2xl">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#22d3ee] flex items-center justify-center text-[#22d3ee] mx-auto mb-6 animate-spin">
              <Activity size={28} />
            </div>
            <div className="text-xs font-mono text-[#22d3ee] uppercase tracking-widest mb-1">
              SEARCHING ARENA QUEUE...
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Complementary Profiles</h2>
            <div className="text-3xl font-mono font-black text-white my-4">
              00:{searchTime.toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-white/50 font-sans max-w-sm mx-auto mb-6">
              Queued as <strong>{selectedSkill}</strong>. Scanning backend matchmaking pool for matching players.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleRefreshStatus}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white transition-colors"
              >
                <RefreshCw size={12} className={actionLoading ? 'animate-spin' : ''} />
                <span>Check Match</span>
              </button>

              <button
                onClick={handleCancelQueue}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-mono text-red-400 uppercase transition-colors"
              >
                [ Cancel Matchmaking ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: PROPOSED TEAM CONSENT */}
      {matchState === 'PROPOSED' && currentTeam && (
        <div className="max-w-4xl mx-auto">
          <div className="p-7 sm:p-9 rounded-2xl bg-[#070b12]/90 border border-white/10 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
              <div>
                <span className="text-xs font-mono text-[#22d3ee] font-bold uppercase tracking-wider">
                  TEAM PROPOSAL: {currentTeam.name}
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">Review Squad Composition</h2>
              </div>
              <button
                onClick={handleRefreshStatus}
                className="flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-white"
              >
                <RefreshCw size={12} />
                <span>Sync Consents</span>
              </button>
            </div>

            {/* Teammates Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {teamMembers.map((member, idx) => {
                const profile = member.profiles || {};
                const isMe = member.profile_id === user?.id;
                const consent = isMe ? myConsentStatus : member.consent_status;
                const avatar = profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username || idx}`;

                return (
                  <div
                    key={member.profile_id || idx}
                    className={`p-5 rounded-xl border transition-all ${
                      consent === 'ACCEPTED'
                        ? 'bg-[#22d3ee]/5 border-[#22d3ee]/40'
                        : consent === 'REJECTED'
                        ? 'bg-red-500/5 border-red-500/40'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={avatar}
                        alt={profile.username || 'Combatant'}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{profile.username || 'Combatant'}</span>
                          {isMe && (
                            <span className="text-[10px] font-mono text-[#22d3ee] font-bold">(YOU)</span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-[#22d3ee] font-semibold">
                          Role: {member.role_in_team || 'ENGINEER'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                      <span className="text-white/40">CONSENT STATUS:</span>
                      <span
                        className={`font-bold ${
                          consent === 'ACCEPTED'
                            ? 'text-[#22d3ee]'
                            : consent === 'REJECTED'
                            ? 'text-red-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {consent}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Consent Actions */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/60 font-sans">
                A battle starts ONLY if all members explicitly click <strong className="text-white">ACCEPT</strong>. Backend enforces mutual consent.
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleRejectTeam}
                  disabled={actionLoading || myConsentStatus === 'ACCEPTED'}
                  className="px-5 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold font-jakarta uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  REJECT & DISBAND
                </button>
                <button
                  onClick={handleAcceptTeam}
                  disabled={actionLoading || myConsentStatus === 'ACCEPTED'}
                  className="btn-arena px-7 py-2.5 rounded-full bg-[#22d3ee] text-[#070b12] text-xs font-bold font-jakarta uppercase tracking-wider hover:bg-[#38bdf8] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>{myConsentStatus === 'ACCEPTED' ? 'CONSENT RECORDED' : 'ACCEPT SQUAD'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: CONFIRMED LIVE BATTLE COCKPIT */}
      {matchState === 'CONFIRMED_BATTLE' && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Top Battle HUD Bar */}
          <div className="p-6 rounded-2xl bg-[#070b12] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#22d3ee] font-bold uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
                <span>
                  SQUAD: {currentTeam?.name || 'VERIFIED SQUAD'} · STATUS: ACTIVE BATTLE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {selectedChallenge?.title || 'Distributed Real-Time Telemetry Engine'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 px-5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <div className="text-[10px] font-mono text-white/50 uppercase">Time Remaining</div>
                <div className="text-2xl font-mono font-black text-[#22d3ee] tracking-wider">
                  {secondsLeft > 0
                    ? formatTime(secondsLeft)
                    : activeBattle
                    ? '00:00:00'
                    : formatTime((selectedChallenge?.time_limit_minutes || 60) * 60)}
                </div>
              </div>
              <div className="p-3 px-5 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/30 text-center">
                <div className="text-[10px] font-mono text-[#6366f1] uppercase font-bold">Max Reward</div>
                <div className="text-2xl font-mono font-black text-white">+250 XP</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Problem Statement & Requirements (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 sm:p-7 rounded-2xl bg-[#070b12]/80 border border-white/10">
                <h3 className="text-sm font-mono font-bold text-[#22d3ee] uppercase tracking-wider mb-3">
                  PROBLEM STATEMENT
                </h3>
                <p className="text-xs text-white/80 leading-relaxed font-sans mb-6">
                  {selectedChallenge?.description || 
                    'Build a high-throughput, fault-tolerant WebSocket telemetry aggregator that streams real-time system metrics to connected clients with guaranteed monotonicity, reconnection backoff, and zero-drop backpressure handling.'}
                </p>

                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-3">
                  EVALUATION REQUIREMENTS
                </h3>
                <div className="space-y-2.5 text-xs font-sans">
                  {(() => {
                    const raw = selectedChallenge?.requirements;
                    let list = [];
                    if (Array.isArray(raw)) list = raw;
                    else if (Array.isArray(raw?.must_have)) list = raw.must_have;
                    else if (typeof raw === 'string') {
                      try {
                        const parsed = JSON.parse(raw);
                        list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.must_have) ? parsed.must_have : [raw];
                      } catch {
                        list = [raw];
                      }
                    }

                    if (list.length > 0) {
                      return list.map((req, i) => {
                        const text = typeof req === 'object' ? req.title || req.requirement || req.text || JSON.stringify(req) : req;
                        return (
                          <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-[#22d3ee] shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-white">REQ {i + 1}:</strong> {text}
                            </div>
                          </div>
                        );
                      });
                    }

                    return (
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-[#22d3ee] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">REQ 1 — High-Quality Architecture:</strong> Modular single-responsibility functions, clean types, and comprehensive error handling.
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mt-6 mb-3">
                  CONSTRAINTS
                </h3>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono text-white/60">
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Standard Open-Source Stacks</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Public GitHub Repo Only</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Verifiable Git Commit Signatures</span>
                </div>
              </div>
            </div>

            {/* Right Col: Team Roster & Submission Form (1 Col) */}
            <div className="space-y-6">
              {/* Squad HUD */}
              <div className="p-5 rounded-2xl bg-[#070b12]/80 border border-white/10">
                <h4 className="text-xs font-mono font-bold text-[#22d3ee] uppercase tracking-wider mb-4">
                  SQUAD ROSTER (CONFIRMED)
                </h4>
                <div className="space-y-3">
                  {teamMembers.map((m, idx) => {
                    const prof = m.profiles || {};
                    const avatar = prof.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${prof.username || idx}`;
                    return (
                      <div key={m.profile_id || idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                        <img src={avatar} alt={prof.username} className="w-8 h-8 rounded-full object-cover border border-[#22d3ee]/40" />
                        <div className="text-xs">
                          <div className="font-bold text-white">{prof.username || 'Combatant'}</div>
                          <div className="text-[10px] font-mono text-white/50">{m.role_in_team}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Public GitHub Repo Submission */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#070b12] border border-[#22d3ee]/30 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-mono text-[#22d3ee] font-bold uppercase mb-2">
                  <GitBranch size={15} />
                  <span>REPO SUBMISSION</span>
                </div>
                <p className="text-xs text-white/60 font-sans mb-4">
                  Provide your squad's public GitHub repository URL for AI evaluation.
                </p>

                {submissionSuccess ? (
                  <div className="p-4 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/40 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#22d3ee] font-bold">
                      <CheckCircle2 size={16} />
                      <span>SUBMISSION CONFIRMED</span>
                    </div>
                    <div className="text-xs font-mono text-white/80 truncate">
                      {repoUrl}
                    </div>

                    {evaluationError && (
                      <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-sans">
                        {evaluationError}
                      </div>
                    )}

                    <button
                      onClick={handleTriggerEvaluation}
                      disabled={isEvaluating}
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#6366f1] text-[#070b12] font-jakarta font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50"
                    >
                      {isEvaluating ? (
                        <>
                          <Activity size={16} className="animate-spin" />
                          <span>AI EVALUATION IN PROGRESS...</span>
                        </>
                      ) : (
                        <>
                          <span>TRIGGER AI EVALUATION</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRepo} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono text-white/60 mb-1">
                        PUBLIC GITHUB REPOSITORY URL
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://github.com/team-cyphers/telemetry-hub"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        className="w-full bg-[#070b12] border border-white/15 rounded-lg px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#22d3ee] transition-colors placeholder:text-white/20"
                      />
                    </div>

                    {submissionError && (
                      <div className="text-[11px] font-mono text-red-400 flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        <span>{submissionError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingRepo}
                      className="w-full py-3 rounded-xl bg-[#22d3ee] hover:bg-[#38bdf8] text-[#070b12] font-jakarta text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
                    >
                      {submittingRepo ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      <span>{submittingRepo ? 'SUBMITTING TO BACKEND...' : 'SUBMIT PUBLIC REPOSITORY'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

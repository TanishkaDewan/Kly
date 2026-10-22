import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Sparkles, 
  Users, 
  Trophy, 
  Clock, 
  GitBranch, 
  CheckCircle2, 
  TrendingUp,
  Cpu
} from 'lucide-react';
import Hero from '../components/Hero';

export default function HomePage() {
  const activeChallenges = [
    {
      id: 'ch-01',
      title: 'Real-Time Telemetry & Consensus Arbiter',
      category: 'Distributed Systems',
      difficulty: 'EXPERT',
      rewardXp: '+250 XP',
      activeTeams: 48,
      timeLeft: '32h 14m',
      tags: ['Rust', 'WebSocket', 'gRPC'],
      description: 'Architect a low-latency state synchronizer capable of broadcasting 100k events/sec with monotonic clock ordering.',
    },
    {
      id: 'ch-02',
      title: 'Autonomous Multi-Agent AI Code Reviewer',
      category: 'AI & Inference',
      difficulty: 'HARD',
      rewardXp: '+200 XP',
      activeTeams: 86,
      timeLeft: '45h 50m',
      tags: ['Python', 'FastAPI', 'Claude / Gemini API'],
      description: 'Build a multi-agent consensus pipeline that audits pull requests against AST syntax graphs and security vulnerability matrices.',
    },
    {
      id: 'ch-03',
      title: 'High-Frequency Order Book & Execution Engine',
      category: 'Systems & Fintech',
      difficulty: 'HARD',
      rewardXp: '+200 XP',
      activeTeams: 62,
      timeLeft: '18h 05m',
      tags: ['C++', 'Lock-Free Queues', 'Zero-Copy'],
      description: 'Implement a memory-mapped limit order book matching engine with nanosecond execution determinism.',
    },
  ];

  const recentBattles = [
    {
      id: 'b-991',
      challenge: 'WebSocket Telemetry Hub',
      winnerTeam: 'TEAM CYPHERS (Alex, Sam, Elena)',
      score: 94.2,
      eloGain: '+42 ELO',
      aiVerdict: 'Flawless non-blocking concurrency model with 98% test coverage.',
      timeAgo: '4 hours ago',
    },
    {
      id: 'b-990',
      challenge: 'Distributed Vector Indexer',
      winnerTeam: 'NEURAL FORGE (David, Marcus)',
      score: 91.8,
      eloGain: '+38 ELO',
      aiVerdict: 'Innovative SIMD cosine distance implementation and clear architecture.',
      timeAgo: '7 hours ago',
    },
  ];

  return (
    <div className="relative">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. The Core Competitive Loop Visualizer */}
      <section className="relative z-10 py-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 mb-3">
            <Sparkles size={13} className="text-[#22d3ee]" />
            <span className="font-mono text-xs text-[#22d3ee] font-bold uppercase tracking-wider">
              THE COMPETITIVE GAMEPLAY
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Engineers Compete on KLYRO
          </h2>
          <p className="text-sm text-white/60 mt-3 font-sans">
            No synthetic LeetCode trivia. No biased demo pitches. Complete the 48-hour engineering loop and let your development evidence speak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#22d3ee]/40 transition-all group">
            <div className="text-xs font-mono font-bold text-[#22d3ee] mb-2">01 / MATCHMAKING</div>
            <div className="w-12 h-12 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] mb-4 group-hover:scale-110 transition-transform">
              <Users size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Complementary Teams</h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Rule-based matching pairs Frontend, Backend, and AI specialists. Both players must explicitly click <span className="text-[#22d3ee] font-semibold">ACCEPT</span> to confirm.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#6366f1]/40 transition-all group">
            <div className="text-xs font-mono font-bold text-[#6366f1] mb-2">02 / BATTLE SPRINT</div>
            <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#6366f1] mb-4 group-hover:scale-110 transition-transform">
              <Clock size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">48–72h Live Battle</h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Receive a production-grade problem statement with strict requirements and constraints. Build normally in a public GitHub repo.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#22d3ee]/40 transition-all group">
            <div className="text-xs font-mono font-bold text-[#22d3ee] mb-2">03 / AI ARBITER</div>
            <div className="w-12 h-12 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] mb-4 group-hover:scale-110 transition-transform">
              <Cpu size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Evidence-Based Judge</h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              At deadline, AI audits repository commits, pull requests, test suites, and individual contribution distribution.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#6366f1]/40 transition-all group">
            <div className="text-xs font-mono font-bold text-[#6366f1] mb-2">04 / PROGRESSION</div>
            <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#6366f1] mb-4 group-hover:scale-110 transition-transform">
              <Trophy size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">XP, ELO & Showcase</h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Gain ELO rating, level up your engineering passport, climb global leaderboards, and opt-in to showcase your winning codebase.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Live Arena Challenges Board */}
      <section className="relative z-10 py-16 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="font-mono text-xs text-[#22d3ee] font-bold uppercase tracking-wider mb-2">
              ACTIVE BATTLE ROSTER
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Open Engineering Arenas
            </h2>
          </div>
          <Link
            to="/arena"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#22d3ee] hover:underline uppercase tracking-wider"
          >
            <span>View All Arenas in Queue</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeChallenges.map((ch) => (
            <div
              key={ch.id}
              className="p-6 rounded-2xl bg-[#070b12]/80 border border-white/10 hover:border-[#22d3ee]/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                    {ch.category}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#6366f1] bg-[#6366f1]/10 px-2 py-0.5 rounded border border-[#6366f1]/30">
                    {ch.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-[#22d3ee] transition-colors mb-2">
                  {ch.title}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
                  {ch.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {ch.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-white/50 border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-mono text-white/50">
                  <span className="flex items-center gap-1 text-[#22d3ee]">
                    <Clock size={13} />
                    {ch.timeLeft}
                  </span>
                  <span>·</span>
                  <span>{ch.activeTeams} teams</span>
                </div>
                <Link
                  to="/arena"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3ee]/10 hover:bg-[#22d3ee] text-[#22d3ee] hover:text-[#070b12] text-xs font-bold font-jakarta uppercase tracking-wider transition-all"
                >
                  <span>Queue Up</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Live Battles Feed & AI Verbatim */}
      <section className="relative z-10 py-16 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="font-mono text-xs text-[#22d3ee] font-bold uppercase tracking-wider mb-2">
            RECENT TELEMETRY
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Recent Battle Outcomes & AI Verdicts
          </h2>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {recentBattles.map((battle) => (
            <div
              key={battle.id}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">{battle.winnerTeam}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3ee]/10 text-[#22d3ee] font-semibold">
                    VICTORY {battle.eloGain}
                  </span>
                </div>
                <div className="text-xs text-white/50 font-sans">
                  Challenge: <span className="text-white/80">{battle.challenge}</span> · {battle.timeAgo}
                </div>
                <p className="text-xs text-white/70 italic font-instrument text-base mt-1">
                  "{battle.aiVerdict}"
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-[#22d3ee]">{battle.score}</div>
                  <div className="text-[10px] font-mono text-white/40 uppercase">AI Composite Score</div>
                </div>
                <Link
                  to="/results?demo=true"
                  className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/80 hover:text-white border border-white/10 transition-colors"
                >
                  Audit Evaluation →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Big Bottom Banner CTA */}
      <section className="relative z-10 py-20 px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-[#22d3ee]/15 blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase mb-4">
            Ready to Prove Your Code?
          </h2>
          <p className="text-sm text-white/70 max-w-lg mx-auto mb-8 font-sans">
            Join the matchmaking queue, team up with complementary engineers, and take on your next software challenge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/arena"
              className="btn-arena px-8 py-4 rounded-full bg-[#22d3ee] text-[#070b12] font-jakarta text-sm font-bold uppercase tracking-wider hover:bg-[#38bdf8] flex items-center gap-2"
            >
              <span>ENTER THE ARENA</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/leaderboard"
              className="px-6 py-4 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 text-sm font-semibold tracking-wide transition-all"
            >
              Explore Global Rankings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

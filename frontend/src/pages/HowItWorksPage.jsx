import React, { useState } from 'react';
import { 
  Cpu, 
  GitBranch, 
  ShieldCheck, 
  Scale, 
  Terminal, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  Users
} from 'lucide-react';

export default function HowItWorksPage() {
  // Interactive Scoring Weight Simulator State
  const [weights, setWeights] = useState({
    requirement: 25,
    technical: 20,
    feasibility: 20,
    innovation: 15,
    codeQuality: 10,
    documentation: 10,
  });

  const [sampleScores, setSampleScores] = useState({
    requirement: 95,
    technical: 88,
    feasibility: 85,
    innovation: 90,
    codeQuality: 82,
    documentation: 80,
  });

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const calculateCompositeScore = () => {
    if (totalWeight === 0) return '0.0';
    const weightedSum = (
      sampleScores.requirement * weights.requirement +
      sampleScores.technical * weights.technical +
      sampleScores.feasibility * weights.feasibility +
      sampleScores.innovation * weights.innovation +
      sampleScores.codeQuality * weights.codeQuality +
      sampleScores.documentation * weights.documentation
    );
    const normalizedScore = weightedSum / totalWeight;
    return Math.min(100, Math.max(0, normalizedScore)).toFixed(1);
  };

  const getEffectiveWeight = (val) => {
    if (totalWeight === 0) return '0.0%';
    return `${((val / totalWeight) * 100).toFixed(1)}%`;
  };

  return (
    <div className="relative pt-28 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 mb-3">
          <Scale size={13} className="text-[#22d3ee]" />
          <span className="font-mono text-xs text-[#22d3ee] font-bold uppercase tracking-wider">
            EVALUATION PROTOCOL & SPEC
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
          The KLYRO Engine
        </h1>
        <p className="text-base text-white/70 mt-3 font-instrument italic text-xl max-w-xl mx-auto">
          "Don't just show us what you built. Show us how you built it."
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {/* Pillar 1 */}
        <div className="p-8 rounded-2xl bg-[#070b12]/80 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/30 flex items-center justify-center text-[#22d3ee]">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#22d3ee] uppercase font-bold">PILLAR 01</span>
              <h3 className="text-lg font-bold text-white">Rule-Based Matchmaking</h3>
            </div>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
            No unpredictable black-box algorithms. Matchmaking pairs complementary specializations (Frontend UI + Backend Concurrency + AI/ML Engine) and requires <strong>explicit mutual consent</strong> before any battle timer triggers.
          </p>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-mono text-white/50">
            • 2–3 Engineers per squad<br />
            • Rematch limits capped at 3 attempts<br />
            • Immediate refund on unconfirmed queues
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="p-8 rounded-2xl bg-[#070b12]/80 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/30 flex items-center justify-center text-[#6366f1]">
              <GitBranch size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#6366f1] uppercase font-bold">PILLAR 02</span>
              <h3 className="text-lg font-bold text-white">One-Pass GitHub Ingestion</h3>
            </div>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
            Teams develop freely on public GitHub repositories without invasive tracking agents during the sprint. At deadline, our ingestion client fetches repository metadata, AST syntax trees, commits, and pull requests in a single secure pass.
          </p>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-mono text-white/50">
            • Full commit timeline & diff parsing<br />
            • Directory tree pruning (no lockfiles/node_modules)<br />
            • Zero server-side arbitrary code execution
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="p-8 rounded-2xl bg-[#070b12]/80 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/30 flex items-center justify-center text-[#22d3ee]">
              <Cpu size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#22d3ee] uppercase font-bold">PILLAR 03</span>
              <h3 className="text-lg font-bold text-white">6-Dimension AI Consensus</h3>
            </div>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
            The AI engine evaluates the code against the original challenge requirements and constraints. It outputs strict requirement compliance (<span className="text-emerald-400">MET</span>, <span className="text-amber-400">PARTIAL</span>, <span className="text-red-400">MISSING</span>) alongside detailed engineering feedback.
          </p>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-mono text-white/50">
            • Strict prompt-injection shielding<br />
            • Pydantic structural validation<br />
            • Multi-agent scoring consensus
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="p-8 rounded-2xl bg-[#070b12]/80 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/30 flex items-center justify-center text-[#6366f1]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#6366f1] uppercase font-bold">PILLAR 04</span>
              <h3 className="text-lg font-bold text-white">Estimated Contribution</h3>
            </div>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
            We reject raw commit-count metrics. Individual contribution is an <strong>AI-assisted estimation</strong> derived from functional area ownership, architectural commits, lines changed in context of complexity, and PR reviews.
          </p>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-mono text-white/50">
            • Evaluates commit quality over volume<br />
            • Tracks module ownership distribution<br />
            • Backs every percentage with git evidence
          </div>
        </div>
      </div>

      {/* INTERACTIVE SCORING WEIGHT SIMULATOR */}
      <section className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#070b12] to-[#0f172a] border border-[#22d3ee]/30 shadow-2xl mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#22d3ee] font-bold uppercase mb-1">
              <Sliders size={14} />
              <span>INTERACTIVE SCORING SIMULATOR</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Configurable 6-Dimension Score Engine</h2>
          </div>
          <div className="p-3 px-6 rounded-xl bg-[#070b12] border border-white/10 text-right">
            <div className="text-[10px] font-mono text-white/40 uppercase">Composite Output</div>
            <div className="text-3xl font-mono font-black text-[#22d3ee]">
              {calculateCompositeScore()} <span className="text-sm text-white/50">/ 100</span>
            </div>
            {totalWeight !== 100 && totalWeight > 0 && (
              <div className="text-[9px] font-mono text-[#22d3ee]/80 mt-0.5">
                Normalized to 100% basis
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase text-white/60">Dimension Weights</h4>
              {totalWeight !== 100 && (
                <button
                  type="button"
                  onClick={() => setWeights({
                    requirement: 25,
                    technical: 20,
                    feasibility: 20,
                    innovation: 15,
                    codeQuality: 10,
                    documentation: 10,
                  })}
                  className="text-[10px] font-mono text-[#22d3ee] hover:underline transition-colors"
                >
                  Reset to Standard (100%)
                </button>
              )}
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                <span className="text-white">Requirement Completion</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#22d3ee] font-bold">{weights.requirement}%</span>
                  {totalWeight !== 100 && totalWeight > 0 && (
                    <span className="text-[10px] text-white/40 font-normal">
                      ({getEffectiveWeight(weights.requirement)} eff)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.requirement}
                onChange={(e) => setWeights({ ...weights, requirement: Number(e.target.value) })}
                className="w-full accent-[#22d3ee]"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                <span className="text-white">Technical Quality</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#22d3ee] font-bold">{weights.technical}%</span>
                  {totalWeight !== 100 && totalWeight > 0 && (
                    <span className="text-[10px] text-white/40 font-normal">
                      ({getEffectiveWeight(weights.technical)} eff)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.technical}
                onChange={(e) => setWeights({ ...weights, technical: Number(e.target.value) })}
                className="w-full accent-[#22d3ee]"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                <span className="text-white">Feasibility & Reliability</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#22d3ee] font-bold">{weights.feasibility}%</span>
                  {totalWeight !== 100 && totalWeight > 0 && (
                    <span className="text-[10px] text-white/40 font-normal">
                      ({getEffectiveWeight(weights.feasibility)} eff)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.feasibility}
                onChange={(e) => setWeights({ ...weights, feasibility: Number(e.target.value) })}
                className="w-full accent-[#22d3ee]"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                <span className="text-white">Innovation & UX</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#22d3ee] font-bold">{weights.innovation}%</span>
                  {totalWeight !== 100 && totalWeight > 0 && (
                    <span className="text-[10px] text-white/40 font-normal">
                      ({getEffectiveWeight(weights.innovation)} eff)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.innovation}
                onChange={(e) => setWeights({ ...weights, innovation: Number(e.target.value) })}
                className="w-full accent-[#22d3ee]"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                <span className="text-white">Code Quality & Architecture</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#22d3ee] font-bold">{weights.codeQuality}%</span>
                  {totalWeight !== 100 && totalWeight > 0 && (
                    <span className="text-[10px] text-white/40 font-normal">
                      ({getEffectiveWeight(weights.codeQuality)} eff)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.codeQuality}
                onChange={(e) => setWeights({ ...weights, codeQuality: Number(e.target.value) })}
                className="w-full accent-[#22d3ee]"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                <span className="text-white">Documentation & Tests</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#22d3ee] font-bold">{weights.documentation}%</span>
                  {totalWeight !== 100 && totalWeight > 0 && (
                    <span className="text-[10px] text-white/40 font-normal">
                      ({getEffectiveWeight(weights.documentation)} eff)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.documentation}
                onChange={(e) => setWeights({ ...weights, documentation: Number(e.target.value) })}
                className="w-full accent-[#22d3ee]"
              />
            </div>
          </div>

          {/* Sample Score Inputs */}
          <div className="p-6 rounded-xl bg-[#070b12] border border-white/10 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-white/60">Simulated AI Dimension Scores (0–100)</h4>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/50 block text-[10px]">Req Score</span>
                <span className="text-lg font-bold text-white">{sampleScores.requirement}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/50 block text-[10px]">Tech Quality</span>
                <span className="text-lg font-bold text-white">{sampleScores.technical}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/50 block text-[10px]">Feasibility</span>
                <span className="text-lg font-bold text-white">{sampleScores.feasibility}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/50 block text-[10px]">Innovation</span>
                <span className="text-lg font-bold text-white">{sampleScores.innovation}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/50 block text-[10px]">Code Quality</span>
                <span className="text-lg font-bold text-white">{sampleScores.codeQuality}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/50 block text-[10px]">Documentation</span>
                <span className="text-lg font-bold text-white">{sampleScores.documentation}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#22d3ee]/5 border border-[#22d3ee]/20 text-[11px] font-mono text-[#22d3ee] space-y-1">
              <div>
                Weights Total: <strong>{totalWeight}%</strong>
                {totalWeight === 100 ? (
                  <span className="text-white/50 ml-2 font-normal">(Standard 100% distribution)</span>
                ) : totalWeight === 0 ? (
                  <span className="text-amber-300 ml-2 font-normal">(Zero total weight — score defaults to 0.0)</span>
                ) : (
                  <span className="text-white/50 ml-2 font-normal">(Normalized mathematically to 100% basis)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Honesty & Safety Guarantee */}
      <div className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs font-sans text-white/70 space-y-3">
        <div className="flex items-center gap-2 font-mono font-bold text-amber-400 uppercase">
          <AlertTriangle size={16} />
          <span>TECHNICAL HONESTY & TRANSPARENCY PRINCIPLES</span>
        </div>
        <p>
          1. <strong>AI-Assisted, Not Infallible:</strong> We never claim 100% objective perfection. AI acts as an impartial reviewer auditing against deterministic evidence.
        </p>
        <p>
          2. <strong>Estimated Contribution:</strong> Individual breakdown reflects git commit complexity, module ownership, and pull request activity rather than a mathematical proof of author intent.
        </p>
        <p>
          3. <strong>Zero Remote Code Execution:</strong> Repositories are analyzed statically as untrusted data trees. No user code is executed on our servers.
        </p>
      </div>
    </div>
  );
}

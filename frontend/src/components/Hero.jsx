import React from 'react';
import { ArrowRight, Sparkles, Terminal, Activity, ShieldCheck } from 'lucide-react';
import ParticleText from './ParticleText';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center pt-28 pb-16 px-6 sm:px-8 lg:px-12 z-10 select-none">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center">

        {/* 2. THE LIQUID GLASS CARD (220x200px, shifted 50px upward) */}
        <div className="w-full flex justify-center mb-2">
          <div
            className="liquid-glass-card w-[220px] h-[200px] p-5 flex flex-col justify-between text-left translate-y-[-50px] transition-transform duration-500 hover:scale-[1.03] group cursor-default"
            style={{
              background: 'rgba(255, 255, 255, 0.01)',
              backgroundBlendMode: 'luminosity',
            }}
          >
            {/* Card Top: [ BETA ] Tag & Indicator */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[14px] font-semibold text-[#22d3ee] tracking-wide">
                [ BETA ]
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22d3ee]"></span>
              </span>
            </div>

            {/* Card Middle: Headline with Instrument Serif italicized "Evidence" */}
            <div className="my-auto">
              <h3 className="text-[18px] leading-[1.3] font-sans font-medium text-white/95">
                Judged by{' '}
                <span className="font-instrument italic font-normal text-2xl text-white underline decoration-[#22d3ee]/40 decoration-wavy decoration-1 underline-offset-2">
                  Evidence
                </span>
                , not Demos.
              </h3>
            </div>

            {/* Card Bottom: Small Description */}
            <div>
              <p className="text-[11px] leading-[1.4] text-white/60 font-sans">
                AI-evaluated development journeys, not just final output.
              </p>
            </div>
          </div>
        </div>

        {/* 3. HERO CONTENT & TYPOGRAPHY */}
        
        {/* Large Interactive Particle Name from PDF */}
        <div className="w-full flex items-center justify-center my-4 sm:my-6">
          <div className="w-full max-w-[550px] sm:max-w-[750px] md:max-w-[920px] h-[90px] sm:h-[125px] md:h-[155px] relative cursor-pointer group">
            <ParticleText
              text="KLYRO"
              fontSize={140}
              particleSize={8}
              particleCount={50}
              mouseRadius={85}
              mouseForce={32}
              colors={['#FFFFFF', '#22d3ee', '#38bdf8', '#818cf8', '#6366f1']}
              mode="onEnter"
              autoFit={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Eyebrow */}
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/5 border border-[#22d3ee]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
          <span className="font-jakarta text-[11px] font-bold tracking-[0.2em] uppercase text-[#22d3ee]">
            COMPETITIVE SOFTWARE ENGINEERING
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-sans font-extrabold text-[40px] sm:text-[54px] md:text-[64px] lg:text-[72px] leading-[1.02] tracking-tight uppercase text-white max-w-4xl mx-auto drop-shadow-sm">
          DON'T JUST SHIP IT. PROVE IT<span className="text-[#6366f1]">.</span>
        </h1>

        {/* Description */}
        <p className="mt-6 text-[14px] leading-[1.65] text-white/70 font-sans max-w-[512px] mx-auto text-balance">
          Form a team, take on a real engineering challenge, and get an AI-evaluated breakdown of your code, your process, and your individual contribution.
        </p>

        {/* Live Stat Strip */}
        <div className="mt-8 py-2 px-4 rounded-lg bg-[#070b12]/60 border border-white/5 backdrop-blur-sm inline-flex items-center flex-wrap justify-center gap-x-3 gap-y-1 text-white/80 text-center">
          <div className="inline-flex items-center gap-1.5">
            <span className="font-sans text-[10px] font-bold tracking-widest text-white/50 uppercase">
              REPOS EVALUATED
            </span>
            <span className="font-mono text-xs font-semibold text-white/95">
              1,204
            </span>
          </div>

          <span className="text-[#22d3ee]/40 font-mono text-xs">·</span>

          <div className="inline-flex items-center gap-1.5">
            <span className="font-sans text-[10px] font-bold tracking-widest text-white/50 uppercase">
              ACTIVE TEAMS
            </span>
            <span className="font-mono text-xs font-semibold text-[#22d3ee]">
              312
            </span>
          </div>

          <span className="text-[#22d3ee]/40 font-mono text-xs">·</span>

          <div className="inline-flex items-center gap-1.5">
            <span className="font-sans text-[10px] font-bold tracking-widest text-white/50 uppercase">
              GLOBAL RANK
            </span>
            <span className="font-mono text-xs font-semibold text-[#6366f1]">
              TIER 1
            </span>
          </div>
        </div>

        {/* Primary CTA & Actions */}
        <div className="mt-9 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="#arena"
            id="cta-enter-arena"
            className="btn-arena group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#22d3ee] text-[#070b12] font-jakarta text-sm font-bold uppercase tracking-wider hover:bg-[#38bdf8] transition-all duration-200"
          >
            <span>ENTER THE ARENA</span>
            <ArrowRight
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>

          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 hover:border-white/20 font-jakarta text-sm font-semibold tracking-wide transition-all duration-200"
          >
            <Terminal size={16} className="text-[#22d3ee]" />
            <span>VIEW BENCHMARK SPEC</span>
          </a>
        </div>

        {/* Micro-Features Strip */}
        <div className="mt-14 pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full max-w-3xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 shrink-0">
              <Activity size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-jakarta">Real-Time Telemetry</h4>
              <p className="text-[11px] text-white/50 font-sans mt-0.5">Commit delta, branch velocity & debug profiling analyzed live.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-jakarta">Cryptographic Proof</h4>
              <p className="text-[11px] text-white/50 font-sans mt-0.5">Immutable skill passports verifiable on any public repo.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-jakarta">AI Arbiter Engine</h4>
              <p className="text-[11px] text-white/50 font-sans mt-0.5">Multi-agent consensus grading on design, tests & edge cases.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

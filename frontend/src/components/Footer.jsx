import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';
import { GithubIcon, TwitterIcon } from './Icons';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#070b12] text-white/60 pt-12 pb-8 px-6 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1: Brand */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#22d3ee] to-[#6366f1] p-[1.5px]">
              <div className="w-full h-full bg-[#070b12] rounded-[6px] flex items-center justify-center">
                <span className="font-mono text-xs font-black text-[#22d3ee]">K/</span>
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-widest text-white uppercase">KLYRO</span>
          </Link>
          <p className="text-xs text-white/50 leading-relaxed font-sans max-w-xs">
            The premier online competitive software engineering arena. Judged by development evidence, AI consensus, and real code.
          </p>
          <div className="flex items-center gap-3 pt-2 text-white/70">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#22d3ee] transition-colors" aria-label="GitHub">
              <GithubIcon size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#22d3ee] transition-colors" aria-label="Twitter">
              <TwitterIcon size={16} />
            </a>
          </div>
        </div>

        {/* Col 2: Arena Navigation */}
        <div>
          <h4 className="text-xs font-jakarta font-bold uppercase tracking-wider text-white mb-4">The Arena</h4>
          <ul className="space-y-2.5 text-xs font-sans">
            <li><Link to="/arena" className="hover:text-[#22d3ee] transition-colors">Active Battles</Link></li>
            <li><Link to="/arena" className="hover:text-[#22d3ee] transition-colors">Matchmaking Lobby</Link></li>
            <li><Link to="/leaderboard" className="hover:text-[#22d3ee] transition-colors">Global Leaderboard</Link></li>
            <li><Link to="/showcase" className="hover:text-[#22d3ee] transition-colors">Hall of Fame Showcase</Link></li>
          </ul>
        </div>

        {/* Col 3: Protocol */}
        <div>
          <h4 className="text-xs font-jakarta font-bold uppercase tracking-wider text-white mb-4">Protocol & AI</h4>
          <ul className="space-y-2.5 text-xs font-sans">
            <li><Link to="/how-it-works" className="hover:text-[#22d3ee] transition-colors">AI Evaluation Architecture</Link></li>
            <li><Link to="/how-it-works" className="hover:text-[#22d3ee] transition-colors">GitHub Evidence Pipeline</Link></li>
            <li><Link to="/results?demo=true" className="hover:text-[#22d3ee] transition-colors">Interactive Evaluation Demo</Link></li>
            <li><Link to="/how-it-works" className="hover:text-[#22d3ee] transition-colors">Contribution Estimation Spec</Link></li>
          </ul>
        </div>

        {/* Col 4: Arena Telemetry Status */}
        <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-white/80">
            <span>ARENA STATUS</span>
            <span className="flex items-center gap-1.5 text-[#22d3ee]">
              <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
              OPERATIONAL
            </span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span>EVALUATION ENGINE</span>
            <span>v2.4.1 (CONSENSUS)</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span>NETWORK LATENCY</span>
            <span>18ms</span>
          </div>
          <div className="pt-2 border-t border-white/5 text-[10px] text-white/40">
            Protected against prompt injection & unauthorized executions.
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40">
        <div>
          © 2026 KLYRO PLATFORM. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#22d3ee]">DON'T JUST SHIP IT. PROVE IT.</span>
        </div>
      </div>
    </footer>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  ExternalLink, 
  Search, 
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { GithubIcon } from '../components/Icons';
import { getPublicShowcase } from '../services/api';

export default function ShowcasePage() {
  const [selectedTech, setSelectedTech] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const techFilters = ['ALL', 'Rust', 'Go', 'TypeScript', 'Python', 'C++'];

  const fetchShowcase = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicShowcase();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load showcase projects:', err);
      setError(err.message || 'Failed to load showcase projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowcase();
  }, []);

  const filtered = projects.filter((proj) => {
    const title = proj.submissions?.battles?.challenges?.title || 'Competitive Battle Submission';
    const teamName = proj.teams?.name || 'Squad Submission';
    const category = proj.submissions?.battles?.challenges?.category || '';

    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTech = selectedTech === 'ALL' || category.toLowerCase().includes(selectedTech.toLowerCase());
    return matchesSearch && matchesTech;
  });

  return (
    <div className="relative pt-28 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 mb-3">
          <Trophy size={13} className="text-[#22d3ee]" />
          <span className="font-mono text-xs text-[#22d3ee] font-bold uppercase tracking-wider">
            HALL OF FAME
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
          Winning Codebase Showcase
        </h1>
        <p className="text-sm text-white/60 mt-2 font-sans">
          Curated battle-winning repositories verified and scored by the KLYRO AI Arbiter.
        </p>
      </div>

      {/* Search & Tech Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search showcases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b12] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#22d3ee] font-mono placeholder:text-white/30"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#070b12] border border-white/10 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {techFilters.map((tech) => (
            <button
              key={tech}
              onClick={() => setSelectedTech(tech)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors whitespace-nowrap ${
                selectedTech === tech
                  ? 'bg-white/15 text-[#22d3ee] font-bold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm font-sans">{error}</span>
          </div>
          <button
            onClick={fetchShowcase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-mono transition-colors"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-white/50">
          <Loader2 size={32} className="animate-spin text-[#22d3ee]" />
          <span className="text-xs font-mono uppercase tracking-widest">
            Loading Hall of Fame Showcases...
          </span>
        </div>
      )}

      {/* Showcase Grid */}
      {!loading && !error && (
        filtered.length === 0 ? (
          <div className="rounded-2xl bg-[#070b12]/80 border border-white/10 p-16 text-center text-white/50 font-mono text-sm max-w-xl mx-auto space-y-3">
            <div className="text-white/30 text-3xl font-bold">🏛️</div>
            <p className="text-white font-semibold">No Public Showcases Available</p>
            <p className="text-xs text-white/40">
              Battle winning squads must explicitly opt-in from their battle results page to showcase their codebases in the Hall of Fame.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((proj) => {
              const challenge = proj.submissions?.battles?.challenges;
              const title = challenge?.title || 'Competitive Battle Submission';
              const teamName = proj.teams?.name || 'Verified Squad';
              const repoUrl = proj.submissions?.repo_url || proj.submissions?.github_url || '#';
              const category = challenge?.category || 'General Software';

              return (
                <div
                  key={proj.id}
                  className="p-7 rounded-2xl bg-[#070b12]/80 border border-white/10 hover:border-[#22d3ee]/40 transition-all duration-300 flex flex-col justify-between group shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-[#22d3ee]/10 text-[#22d3ee] font-bold border border-[#22d3ee]/30">
                        VERIFIED SUBMISSION
                      </span>
                      <div className="text-right font-mono font-bold text-xs text-white/40">
                        {category}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#22d3ee] transition-colors mb-1">
                      {title}
                    </h3>
                    <div className="text-xs font-mono text-white/40 mb-3">
                      Squad: <span className="text-white/70 font-semibold">{teamName}</span>
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
                      Publicly showcased battle codebase evaluated by the KLYRO AI Arbiter.
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5">
                        {category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5">
                        Production Codebase
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    {repoUrl && repoUrl !== '#' ? (
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-white transition-colors"
                      >
                        <GithubIcon size={14} />
                        <span>Source Code</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs font-mono text-white/30">Private Repo</span>
                    )}

                    <Link
                      to="/results?demo=true"
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#22d3ee] hover:underline"
                    >
                      <span>AI Breakdown</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

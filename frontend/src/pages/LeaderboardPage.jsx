import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  User, 
  Users,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { GithubIcon } from '../components/Icons';
import { getPlayerLeaderboard, getTeamLeaderboard } from '../services/api';

export default function LeaderboardPage() {
  const [tab, setTab] = useState('PLAYERS'); // 'PLAYERS' | 'TEAMS'
  const [selectedTech, setSelectedTech] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const techFilters = ['ALL', 'Rust', 'Go', 'TypeScript', 'Python', 'C++'];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'PLAYERS') {
        const data = await getPlayerLeaderboard();
        setPlayers(Array.isArray(data) ? data : []);
      } else {
        const data = await getTeamLeaderboard();
        setTeams(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const getTier = (rating) => {
    if (!rating) return 'INITIATE';
    if (rating >= 2400) return 'TIER 1 ARBITER';
    if (rating >= 2200) return 'GRANDMASTER';
    if (rating >= 2000) return 'CONTENDER';
    return 'CHALLENGER';
  };

  const filteredPlayers = players.filter((p) => {
    const name = p.full_name || p.username || 'Anonymous';
    const username = p.username || '';
    const github = p.github_username || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          github.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredTeams = teams.filter((t) => {
    return (t.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="relative pt-28 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/30 mb-3">
          <Trophy size={13} className="text-[#6366f1]" />
          <span className="font-mono text-xs text-[#6366f1] font-bold uppercase tracking-wider">
            GLOBAL COMPETITIVE STANDINGS
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
          Arena Leaderboard
        </h1>
        <p className="text-sm text-white/60 mt-2 font-sans">
          Verifiable rankings based on challenge outcomes, ELO performance, and AI-evaluated development evidence.
        </p>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Tab switcher */}
        <div className="inline-flex p-1 rounded-xl bg-[#070b12] border border-white/10">
          <button
            onClick={() => setTab('PLAYERS')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-jakarta font-bold uppercase tracking-wider transition-all ${
              tab === 'PLAYERS'
                ? 'bg-[#22d3ee] text-[#070b12] shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>Individual Engineers</span>
          </button>
          <button
            onClick={() => setTab('TEAMS')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-jakarta font-bold uppercase tracking-wider transition-all ${
              tab === 'TEAMS'
                ? 'bg-[#22d3ee] text-[#070b12] shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Competitive Squads</span>
          </button>
        </div>

        {/* Search & Tech Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search handle or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#070b12] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#22d3ee] placeholder:text-white/30 font-mono w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#070b12] border border-white/10 p-1 rounded-xl">
            {techFilters.map((tech) => (
              <button
                key={tech}
                onClick={() => setSelectedTech(tech)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors ${
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
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm font-sans">{error}</span>
          </div>
          <button
            onClick={fetchData}
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
            Synchronizing Arena Standings...
          </span>
        </div>
      )}

      {/* PLAYERS TABLE */}
      {!loading && !error && tab === 'PLAYERS' && (
        filteredPlayers.length === 0 ? (
          <div className="rounded-2xl bg-[#070b12]/80 border border-white/10 p-12 text-center text-white/40 font-mono text-sm">
            No player standings found matching your search.
          </div>
        ) : (
          <div className="rounded-2xl bg-[#070b12]/80 border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase text-white/40">
                    <th className="py-4 px-6">Rank</th>
                    <th className="py-4 px-6">Gladiator / Handle</th>
                    <th className="py-4 px-6">Tier Status</th>
                    <th className="py-4 px-6">ELO Rating</th>
                    <th className="py-4 px-6">Win Rate</th>
                    <th className="py-4 px-6 text-right">Total XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-sans">
                  {filteredPlayers.map((player, idx) => {
                    const rank = idx + 1;
                    const rating = player.rating || 1200;
                    const xp = player.total_xp ?? player.xp ?? 0;
                    const won = player.battles_won || 0;
                    const played = player.battles_played || 0;
                    const winRate = played > 0 ? `${Math.round((won / played) * 100)}%` : '0%';
                    const record = `${won}W - ${Math.max(0, played - won)}L`;
                    const avatar = player.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.username || player.id}`;
                    const displayName = player.full_name || player.username || 'Anonymous Player';

                    return (
                      <tr
                        key={player.id || idx}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Rank Badge */}
                        <td className="py-4 px-6 font-mono font-bold">
                          {rank === 1 && (
                            <span className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/40 text-amber-400 flex items-center justify-center font-black">
                              #1
                            </span>
                          )}
                          {rank === 2 && (
                            <span className="w-7 h-7 rounded-lg bg-slate-300/10 border border-slate-300/40 text-slate-300 flex items-center justify-center font-black">
                              #2
                            </span>
                          )}
                          {rank === 3 && (
                            <span className="w-7 h-7 rounded-lg bg-amber-600/10 border border-amber-600/40 text-amber-600 flex items-center justify-center font-black">
                              #3
                            </span>
                          )}
                          {rank > 3 && (
                            <span className="w-7 h-7 text-white/40 flex items-center justify-center">
                              #{rank}
                            </span>
                          )}
                        </td>

                        {/* Gladiator Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatar}
                              alt={displayName}
                              className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-[#22d3ee]/50 transition-colors"
                            />
                            <div>
                              <div className="font-bold text-white group-hover:text-[#22d3ee] transition-colors flex items-center gap-2">
                                <span>{displayName}</span>
                              </div>
                              <div className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                                <GithubIcon size={10} />
                                <span>{player.github_username || player.username || 'unlinked'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="py-4 px-6">
                          <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 font-bold uppercase tracking-wider">
                            {getTier(rating)}
                          </span>
                        </td>

                        {/* ELO Rating */}
                        <td className="py-4 px-6 font-mono font-black text-white text-sm">
                          {rating}
                        </td>

                        {/* Win Rate */}
                        <td className="py-4 px-6 font-mono text-white/70">
                          <div>{winRate}</div>
                          <div className="text-[10px] text-white/30">{record}</div>
                        </td>

                        {/* XP */}
                        <td className="py-4 px-6 font-mono text-[#6366f1] font-bold text-right">
                          {xp.toLocaleString()} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* TEAMS TABLE */}
      {!loading && !error && tab === 'TEAMS' && (
        filteredTeams.length === 0 ? (
          <div className="rounded-2xl bg-[#070b12]/80 border border-white/10 p-12 text-center text-white/40 font-mono text-sm">
            No squads found in leaderboard standings.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTeams.map((team, idx) => (
              <div
                key={team.id || idx}
                className="p-6 rounded-2xl bg-[#070b12]/80 border border-white/10 hover:border-[#22d3ee]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#22d3ee]/10 text-[#22d3ee]">
                      RANK #{idx + 1}
                    </span>
                    <span className="font-mono text-xs text-white/50">
                      XP Rank
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>

                  <div className="space-y-1 mb-4 text-xs font-mono text-white/60">
                    <div className="text-white/40 text-[10px] uppercase">Squad ID:</div>
                    <div className="text-white/60 text-[11px] truncate">{team.id}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-white/40 uppercase">Total Squad XP</div>
                    <div className="text-xl font-mono font-black text-[#22d3ee]">
                      {(team.total_xp || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

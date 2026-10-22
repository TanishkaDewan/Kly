import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Trophy, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Edit3, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { GithubIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { updateProfile, getSkills } from '../services/api';

export default function ProfilePage() {
  const { user, refreshProfile, openAuthModal } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [allSkills, setAllSkills] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    githubUsername: '',
    experienceLevel: 'INTERMEDIATE',
    selectedSkillIds: []
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        githubUsername: user.githubUsername || '',
        experienceLevel: user.experienceLevel || 'INTERMEDIATE',
        selectedSkillIds: (user.skills || []).map(s => s.id)
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await getSkills();
        if (res?.skills) setAllSkills(res.skills);
      } catch (err) {
        console.warn('Could not load skills list:', err);
      }
    };
    fetchSkills();
  }, []);

  if (!user) {
    return (
      <div className="pt-36 pb-20 text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#22d3ee]">
          <User size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Profile Connected</h2>
        <p className="text-xs text-white/50 mb-6 font-sans">
          Please authenticate or create a KLYRO identity to view your competitive skill passport.
        </p>
        <button
          onClick={() => openAuthModal && openAuthModal('LOGIN')}
          className="btn-arena inline-block px-8 py-3 rounded-full bg-[#22d3ee] text-[#070b12] font-bold text-xs uppercase"
        >
          Sign In to KLYRO
        </button>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        full_name: formData.fullName,
        username: formData.username || user.username,
        github_username: formData.githubUsername,
        experience_level: formData.experienceLevel,
        skill_ids: formData.selectedSkillIds
      });

      await refreshProfile();
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skillId) => {
    setFormData(prev => {
      const exists = prev.selectedSkillIds.includes(skillId);
      return {
        ...prev,
        selectedSkillIds: exists 
          ? prev.selectedSkillIds.filter(id => id !== skillId)
          : [...prev.selectedSkillIds, skillId]
      };
    });
  };

  const rating = user.rating || 1000;
  const xp = user.xp || 0;
  const wins = user.wins || 0;
  const losses = user.losses || 0;
  const totalBattles = user.battlesPlayed || (wins + losses);
  const winRate = totalBattles > 0 ? `${Math.round((wins / totalBattles) * 100)}%` : '0%';

  const getTier = (r) => {
    if (r >= 2400) return 'Tier 1 Arbiter';
    if (r >= 2200) return 'Grandmaster';
    if (r >= 2000) return 'Contender';
    return 'Initiate';
  };

  return (
    <div className="relative pt-28 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Top Notification Alerts */}
      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400">
          <CheckCircle2 size={18} />
          <span className="text-sm font-sans">Profile successfully updated on KLYRO Arena network!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm font-sans">{error}</span>
        </div>
      )}

      {/* Top Profile Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#070b12]/90 border border-white/10 shadow-2xl relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#22d3ee]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#22d3ee]/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-[#22d3ee] text-[#070b12] font-mono text-[10px] font-black uppercase">
                {user.streak || 0}🔥 STREAK
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user.fullName}</h1>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-white/40 hover:text-white p-1 rounded transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              <div className="text-xs font-mono text-[#22d3ee] font-semibold mt-0.5">
                @{user.username} · {user.role || 'Gladiator Engineer'}
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs font-mono text-white/50">
                <a
                  href={`https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <GithubIcon size={13} />
                  <span>{user.githubUsername || 'unlinked'}</span>
                </a>
                <span>·</span>
                <span className="text-emerald-400 font-bold uppercase">{user.experienceLevel}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Counter */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full md:w-auto">
            <div className="p-3.5 px-4 sm:px-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div className="text-[10px] font-mono text-white/40 uppercase">ELO Rating</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-[#22d3ee]">{rating}</div>
              <div className="text-[9px] font-mono text-[#22d3ee] uppercase mt-0.5">{getTier(rating)}</div>
            </div>

            <div className="p-3.5 px-4 sm:px-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div className="text-[10px] font-mono text-white/40 uppercase">Total XP</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-[#6366f1]">{xp.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-white/40 uppercase mt-0.5">Canonical Stats</div>
            </div>

            <div className="p-3.5 px-4 sm:px-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div className="text-[10px] font-mono text-white/40 uppercase">Record</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-white">{wins}W - {losses}L</div>
              <div className="text-[9px] font-mono text-emerald-400 uppercase mt-0.5">{winRate} Winrate</div>
            </div>
          </div>
        </div>

        {/* Inline Edit Form */}
        {editing && (
          <form onSubmit={handleSave} className="mt-6 pt-6 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-white/60 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-[#070b12] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22d3ee]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/60 mb-1">Handle / Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#070b12] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22d3ee]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/60 mb-1">GitHub Username</label>
                <input
                  type="text"
                  required
                  value={formData.githubUsername}
                  onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                  className="w-full bg-[#070b12] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22d3ee]"
                />
              </div>
            </div>

            {allSkills.length > 0 && (
              <div>
                <label className="block text-[10px] font-mono text-white/60 mb-2">Select Arena Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map(s => {
                    const selected = formData.selectedSkillIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSkill(s.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                          selected 
                            ? 'bg-[#22d3ee] text-[#070b12] font-bold' 
                            : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#22d3ee] text-[#070b12] text-xs font-bold font-jakarta uppercase hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Verified Skill Passport (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#070b12]/80 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <ShieldCheck size={16} className="text-[#22d3ee]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-jakarta">
                Verified Skill Passport
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-mono uppercase text-white/40 mb-2">Core Tech Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill) => (
                      <span 
                        key={skill.id || skill.name} 
                        className="px-2.5 py-1 rounded bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 text-xs font-mono font-semibold"
                      >
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    (user.primaryStack || ['TypeScript', 'Node.js', 'PostgreSQL']).map((tech) => (
                      <span key={tech} className="px-2.5 py-1 rounded bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 text-xs font-mono font-semibold">
                        {tech}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="text-[10px] font-mono uppercase text-white/40">Verified Arena Competencies</div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-white/80">Lock-Free Concurrency</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">VERIFIED ✓</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-white/80">Async Architecture</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">VERIFIED ✓</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-white/80">Automated Testing & CI</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">VERIFIED ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Verifiable Battle History Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#6366f1]" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-jakarta">
                Verifiable Battle History
              </h3>
            </div>
            <span className="text-xs font-mono text-white/40">{totalBattles} Total Battles</span>
          </div>

          <div className="space-y-4">
            {totalBattles === 0 ? (
              <div className="p-8 rounded-2xl bg-[#070b12]/80 border border-white/10 text-center text-white/40 font-mono text-xs space-y-2">
                <p className="text-white/70 font-semibold text-sm">No Arena Battles Completed Yet</p>
                <p>Queue in the Arena to compete, earn canonical XP, and establish your verified engineering record.</p>
                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-block px-5 py-2 rounded-lg bg-[#22d3ee] text-[#070b12] font-bold text-xs font-jakarta uppercase"
                  >
                    Enter Arena Queue
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#070b12]/80 border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-[#22d3ee] font-bold">ACTIVE CAREER RECORD</div>
                  <h4 className="text-sm font-bold text-white mt-1">Arena Combatant Performance</h4>
                  <p className="text-xs text-white/50 font-sans mt-0.5">
                    {wins} victorious battles across competitive seasons. Rating calculated via canonical ELO engine.
                  </p>
                </div>
                <Link
                  to="/leaderboard"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white border border-white/10 transition-colors shrink-0"
                >
                  View Rankings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

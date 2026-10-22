import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ArrowRight, ShieldCheck, Zap, Terminal, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { GithubIcon } from './Icons';

export default function AuthModal() {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authMode, 
    setAuthMode, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGithub 
  } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    githubUsername: '',
    email: '',
    password: '',
    role: 'Backend Developer',
    experienceLevel: 'INTERMEDIATE',
    techStack: 'TypeScript, Node.js, PostgreSQL',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmail(formData.email, formData.password);
      } else {
        await signUpWithEmail(formData.email, formData.password, {
          username: formData.username || formData.email.split('@')[0],
          full_name: formData.fullName || formData.username || 'Klyro Engineer',
          github_username: formData.githubUsername || formData.username,
          role: formData.role,
          experience_level: formData.experienceLevel
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const SQUAD_MEMBERS = [
    { name: 'Alice Chen', email: 'alice@klyro.com', role: 'Frontend · Team 1', color: 'border-[#22d3ee]/40 text-[#22d3ee]' },
    { name: 'Bob Martinez', email: 'bob@klyro.com', role: 'Backend · Team 1', color: 'border-emerald-400/40 text-emerald-400' },
    { name: 'Charlie Kim', email: 'charlie@klyro.com', role: 'AI/ML · Team 1', color: 'border-purple-400/40 text-purple-400' },
    { name: 'Diana Prince', email: 'diana@klyro.com', role: 'Fullstack · Team 2', color: 'border-amber-400/40 text-amber-400' },
    { name: 'Ethan Hunt', email: 'ethan@klyro.com', role: 'DevOps · Team 2', color: 'border-rose-400/40 text-rose-400' },
    { name: 'Fiona Gallagher', email: 'fiona@klyro.com', role: 'Backend · Team 2', color: 'border-blue-400/40 text-blue-400' },
    { name: 'George Vance', email: 'george@klyro.com', role: 'In Queue · Searching', color: 'border-yellow-400/40 text-yellow-400' },
    { name: 'Test User 1', email: 'test1@klyro.com', role: 'Tester · Standard', color: 'border-cyan-400/40 text-cyan-300' }
  ];

  const handleQuickLogin = async (email) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithEmail(email, 'KlyroPassword123!');
      setAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || `Failed to sign in as ${email}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    await handleQuickLogin('alice@klyro.com');
  };

  const handleGithubOAuth = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithGithub();
    } catch (err) {
      if (err.message?.includes('provider is not enabled') || err.error_code === 'validation_failed') {
        setErrorMsg('GitHub OAuth is not enabled in your Supabase project dashboard yet. Please use the 1-Click Sign In button below or enter email/password.');
      } else {
        setErrorMsg(err.message || 'GitHub OAuth failed. Please check your network connection.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070b12]/80 backdrop-blur-md animate-fadeIn">
      {/* Liquid Glass Modal Card */}
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#0f172a]/95 border border-white/10 p-7 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-[#22d3ee]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-[#6366f1]/20 to-transparent blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close Modal"
        >
          <X size={20} />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <button
            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            className={`text-lg font-jakarta font-bold uppercase tracking-wider pb-1 transition-all ${
              authMode === 'login'
                ? 'text-[#22d3ee] border-b-2 border-[#22d3ee]'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Access Arena
          </button>
          <span className="text-white/20">/</span>
          <button
            onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
            className={`text-lg font-jakarta font-bold uppercase tracking-wider pb-1 transition-all ${
              authMode === 'register'
                ? 'text-[#22d3ee] border-b-2 border-[#22d3ee]'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Create Profile
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* GitHub OAuth Primary Action */}
        <button
          type="button"
          onClick={handleGithubOAuth}
          disabled={loading}
          className="w-full mb-5 flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#070b12] hover:bg-[#070b12]/80 border border-white/15 text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-sm hover:border-[#22d3ee]/50 group disabled:opacity-50"
        >
          <GithubIcon size={18} className="text-white group-hover:text-[#22d3ee] transition-colors" />
          <span>Continue with GitHub</span>
          <span className="ml-auto text-[11px] font-mono text-[#22d3ee] uppercase bg-[#22d3ee]/10 px-2 py-0.5 rounded">
            Recommended
          </span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-[11px] font-mono text-white/40 uppercase">or with credentials</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {authMode === 'login' && (
          <div className="mb-5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span className="flex items-center gap-1.5 text-white/80 font-bold">
                <Zap size={13} className="text-[#22d3ee]" />
                <span>1-CLICK SQUAD SIGN IN:</span>
              </span>
              <span className="text-[#22d3ee]">Teams of 3</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {SQUAD_MEMBERS.map((sq) => (
                <button
                  key={sq.email}
                  type="button"
                  onClick={() => handleQuickLogin(sq.email)}
                  disabled={loading}
                  className={`flex flex-col text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border transition-all ${sq.color} disabled:opacity-50 group`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="truncate">{sq.name}</span>
                    <span className="text-[9px] font-mono opacity-80 shrink-0 group-hover:text-[#22d3ee]">Sign in</span>
                  </div>
                  <div className="text-[10px] font-mono opacity-80 truncate">{sq.role}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Handle</label>
                  <input
                    type="text"
                    required
                    placeholder="neo_dev"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">GitHub User</label>
                  <input
                    type="text"
                    required
                    placeholder="octocat"
                    value={formData.githubUsername}
                    onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                    className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Core Specialty</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors"
                  >
                    <option value="Frontend Developer">Frontend Engineer</option>
                    <option value="Backend Developer">Backend / Distributed Systems</option>
                    <option value="AI / ML Engineer">AI / ML Engineer</option>
                    <option value="Fullstack Engineer">Fullstack Engineer</option>
                    <option value="DevOps / Cloud">DevOps / Cloud Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Experience Tier</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors"
                  >
                    <option value="BEGINNER">Initiate (Beginner)</option>
                    <option value="INTERMEDIATE">Contender (Intermediate)</option>
                    <option value="ADVANCED">Grandmaster (Advanced)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="engineer@klyro.dev"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors placeholder:text-white/20"
            />
          </div>

          {authMode === 'login' && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    email: 'test1@klyro.com',
                    password: 'KlyroPassword123!'
                  }));
                }}
                className="text-[11px] font-mono text-[#22d3ee]/80 hover:text-[#22d3ee] transition-colors underline underline-offset-2"
              >
                Fill Verified Demo Squad Account
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-full bg-[#22d3ee] text-[#070b12] font-jakarta text-sm font-bold uppercase tracking-wider hover:bg-[#38bdf8] transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing Authorization...</span>
              </>
            ) : (
              <>
                <span>{authMode === 'login' ? 'Enter Competitive Arena' : 'Confirm Registration'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-white/40 font-mono">
          <span>Protected by cryptographic passport verification.</span>
        </div>
      </div>
    </div>
  );
}

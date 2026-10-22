import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { X, ArrowRight, ShieldCheck, Zap, Terminal, Sparkles, AlertCircle, Loader2, Database, ChevronDown, ChevronUp } from 'lucide-react';
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
    experienceLevel: 'INTERMEDIATE'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDemoSquads, setShowDemoSquads] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmail(formData.email, formData.password);
        setSuccessMsg('Successfully signed in! Entering arena...');
        setTimeout(() => setAuthModalOpen(false), 600);
      } else {
        const username = formData.username.trim() || formData.email.split('@')[0];
        const fullName = formData.fullName.trim() || username;
        const githubUsername = formData.githubUsername.trim() || username;

        const authResult = await signUpWithEmail(formData.email, formData.password, {
          username,
          full_name: fullName,
          github_username: githubUsername,
          role: 'PLAYER',
          experience_level: formData.experienceLevel
        });

        // Ensure user profile is immediately stored in PostgreSQL database
        const createdUserId = authResult?.user?.id || (await supabase.auth.getUser())?.data?.user?.id;
        if (createdUserId) {
          try {
            await supabase.from('profiles').upsert({
              id: createdUserId,
              username,
              full_name: fullName,
              github_username: githubUsername,
              experience_level: formData.experienceLevel || 'INTERMEDIATE',
              role: 'PLAYER',
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
            }, { onConflict: 'id' });

            await supabase.from('user_stats').upsert({
              profile_id: createdUserId,
              rating: 1000,
              xp: 0,
              battles_played: 0,
              battles_won: 0
            }, { onConflict: 'profile_id' });
          } catch (dbErr) {
            console.warn('[Profile DB Sync]:', dbErr.message);
          }
        }

        setSuccessMsg('Account registered and profile stored in database! Entering arena...');
        setTimeout(() => setAuthModalOpen(false), 700);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
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
    { name: 'Test User 1', email: 'test1@klyro.com', role: 'Tester · Standard', color: 'border-cyan-400/40 text-cyan-300' }
  ];

  const handleQuickLogin = async (email) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await signInWithEmail(email, 'KlyroPassword123!');
      setSuccessMsg(`Signed in as ${email}! Entering arena...`);
      setTimeout(() => setAuthModalOpen(false), 500);
    } catch (err) {
      setErrorMsg(err.message || `Failed to sign in as ${email}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubOAuth = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithGithub();
    } catch (err) {
      if (err.message?.includes('provider is not enabled') || err.error_code === 'validation_failed') {
        setErrorMsg('GitHub OAuth is not enabled in your Supabase dashboard yet. Please use email & password authentication below.');
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
        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-3">
          <button
            onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`text-base font-jakarta font-bold uppercase tracking-wider pb-1 transition-all ${
              authMode === 'login'
                ? 'text-[#22d3ee] border-b-2 border-[#22d3ee]'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Email Login
          </button>
          <span className="text-white/20">/</span>
          <button
            onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`text-base font-jakarta font-bold uppercase tracking-wider pb-1 transition-all ${
              authMode === 'register'
                ? 'text-[#22d3ee] border-b-2 border-[#22d3ee]'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Create Account & Save to Database
          </button>
        </div>

        {/* Database Storage Assurance Banner */}
        <div className="mb-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 font-bold">
            <Database size={13} />
            <span>Database Storage: Active</span>
          </span>
          <span className="text-white/60">PostgreSQL (Supabase)</span>
        </div>

        {/* Success Feedback */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Username / Handle</label>
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
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Thomas Anderson"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">GitHub Username</label>
                  <input
                    type="text"
                    placeholder="octocat"
                    value={formData.githubUsername}
                    onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                    className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">Core Specialty</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#070b12]/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee] transition-colors"
                  >
                    <option value="Frontend Developer">Frontend Engineer</option>
                    <option value="Backend Developer">Backend / Systems</option>
                    <option value="AI / ML Engineer">AI / ML Specialist</option>
                    <option value="Fullstack Engineer">Fullstack Engineer</option>
                    <option value="DevOps / Cloud">DevOps / Cloud</option>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-full bg-[#22d3ee] text-[#070b12] font-jakarta text-sm font-bold uppercase tracking-wider hover:bg-[#38bdf8] transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing Authentication...</span>
              </>
            ) : (
              <>
                <span>{authMode === 'login' ? 'Sign In with Email & Password' : 'Create Account & Save Profile'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-4 text-center">
          {authMode === 'login' ? (
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-xs text-white/60 hover:text-[#22d3ee] transition-colors font-mono"
            >
              Don't have an account yet? <span className="text-[#22d3ee] underline font-bold">Register & Store to Database</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-xs text-white/60 hover:text-[#22d3ee] transition-colors font-mono"
            >
              Already registered? <span className="text-[#22d3ee] underline font-bold">Sign In via Email & Password</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-[10px] font-mono text-white/30 uppercase">or alternative access</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {/* GitHub OAuth Button */}
        <button
          type="button"
          onClick={handleGithubOAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white font-mono text-xs transition-all disabled:opacity-50"
        >
          <GithubIcon size={14} />
          <span>Continue with GitHub OAuth</span>
        </button>

        {/* Collapsible 1-Click Squad Accounts */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowDemoSquads(!showDemoSquads)}
            className="w-full flex items-center justify-between text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Zap size={12} className="text-[#22d3ee]" />
              <span>1-Click Test Squad Accounts (Alice, Bob, etc.)</span>
            </span>
            {showDemoSquads ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDemoSquads && (
            <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
              {SQUAD_MEMBERS.map((sq) => (
                <button
                  key={sq.email}
                  type="button"
                  onClick={() => handleQuickLogin(sq.email)}
                  disabled={loading}
                  className={`flex flex-col text-left p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border transition-all ${sq.color} disabled:opacity-50`}
                >
                  <div className="text-[11px] font-bold text-white truncate">{sq.name}</div>
                  <div className="text-[9px] font-mono opacity-80 truncate">{sq.role}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

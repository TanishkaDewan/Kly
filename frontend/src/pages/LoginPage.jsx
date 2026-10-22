import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Terminal, ArrowLeft, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import GlassForm from '../components/GlassForm';
import { GithubIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signInWithEmail, signInWithGithub } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (formData) => {
    const email = formData['Email'];
    const password = formData['Password'];

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/arena');
      }, 800);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials or user not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubOAuth = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      await signInWithGithub();
    } catch (err) {
      if (err.message?.includes('provider is not enabled') || err.error_code === 'validation_failed') {
        setErrorMessage('GitHub OAuth is not enabled in your Supabase project dashboard yet. Please use the 1-Click Demo Sign In below or enter email/password.');
      } else {
        setErrorMessage(err.message || 'GitHub OAuth failed. Please check your connection.');
      }
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
    setErrorMessage('');
    setLoading(true);
    try {
      await signInWithEmail(email, 'KlyroPassword123!');
      setSuccess(true);
      setTimeout(() => {
        navigate('/arena');
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || `Failed to sign in as ${email}`);
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    await handleQuickLogin('alice@klyro.com');
  };

  return (
    <div className="relative min-h-screen">
      {/* Top back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 text-xs font-mono tracking-wider uppercase transition-all backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          <span>Back to KLYRO</span>
        </Link>
      </div>

      <GlassForm
        title="Arena Authentication"
        subtitle="Enter your credentials to enter the engineering arena."
        icon={<Terminal className="text-[#22d3ee] w-6 h-6" />}
        fields={[
          { placeholder: 'Email', type: 'email', required: true },
          { placeholder: 'Password', type: 'password', required: true },
        ]}
        buttonText={loading ? 'Verifying Credentials...' : success ? 'Authenticated! Redirecting...' : 'Enter Arena'}
        onSubmit={handleLogin}
        maxWidth="30rem"
        backgroundGradientFrom="#070b12"
        backgroundGradientVia="#0f172a"
        backgroundGradientTo="#070b12"
        blob1Color="#22d3ee"
        blob2Color="#6366f1"
        blob3Color="#38bdf8"
        cardBgColor="rgba(15, 23, 42, 0.65)"
        cardBorderColor="rgba(255, 255, 255, 0.15)"
        iconBgColor="rgba(34, 211, 238, 0.12)"
        iconColor="#22d3ee"
        extraContent={
          <div className="mt-6 pt-5 border-t border-white/10 space-y-4 text-center">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left">
                {errorMessage}
              </div>
            )}
            {/* 1-Click Squad Selector */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                <span className="flex items-center gap-1 text-white/80 font-bold">
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
                    className={`flex flex-col text-left p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border transition-all ${sq.color} disabled:opacity-50 group`}
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

            {/* Quick GitHub Auth */}
            <button
              type="button"
              onClick={handleGithubOAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-white font-sans text-xs font-semibold tracking-wide transition-all duration-200 group disabled:opacity-50"
            >
              <GithubIcon size={16} className="text-white group-hover:text-[#22d3ee] transition-colors" />
              <span>{loading ? 'Authorizing...' : 'Continue with GitHub Passport'}</span>
              <span className="ml-auto text-[10px] font-mono text-[#22d3ee] bg-[#22d3ee]/10 px-2 py-0.5 rounded border border-[#22d3ee]/20">
                Fast Pass
              </span>
            </button>

            {/* Status note */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-white/50">
              <ShieldCheck size={13} className="text-[#22d3ee]" />
              <span>Cryptographic Proof & Skill Identity Verified</span>
            </div>
          </div>
        }
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck, Terminal, User, LogOut, Trophy, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, openAuthModal, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'ARENA', path: '/arena' },
    { name: 'LEADERBOARD', path: '/leaderboard' },
    { name: 'HOW IT WORKS', path: '/how-it-works' },
    { name: 'EVALUATION DEMO', path: '/results?demo=true' },
    { name: 'SHOWCASE', path: '/showcase' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#070b12]/90 backdrop-blur-md border-b border-white/10 py-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Minimalist Wordmark Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] rounded-sm"
          aria-label="KLYRO Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22d3ee] to-[#6366f1] p-[1.5px] shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#070b12] rounded-[6.5px] flex items-center justify-center">
              <span className="font-mono text-xs font-black text-[#22d3ee] tracking-tighter">K/</span>
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-widest text-white uppercase transition-colors group-hover:text-white/90">
            KLYRO
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-7" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `text-[14px] font-sans font-semibold tracking-wider transition-all duration-200 relative py-1.5 ${
                  isActive
                    ? 'text-[#22d3ee] after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#22d3ee]'
                    : 'text-white/75 hover:text-[#22d3ee] after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#22d3ee] hover:after:w-full'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop User Hub / Auth Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#22d3ee]/40 transition-all text-left"
              >
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-[#22d3ee]/40"
                />
                <div className="hidden xl:block">
                  <div className="text-xs font-bold text-white leading-none">{user.username}</div>
                  <div className="text-[10px] font-mono text-[#22d3ee] leading-none mt-0.5">{user.rating} ELO</div>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f172a] border border-white/10 shadow-2xl p-2 z-50 text-xs font-sans animate-fadeIn">
                  <div className="p-2 border-b border-white/10 mb-1">
                    <div className="font-bold text-white">{user.fullName}</div>
                    <div className="text-[11px] font-mono text-[#22d3ee]">{user.role}</div>
                    <div className="text-[10px] font-mono text-white/50 mt-1">XP: {user.xp.toLocaleString()} · STREAK: {user.streak}🔥</div>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors"
                  >
                    <User size={14} className="text-[#22d3ee]" />
                    <span>View Skill Passport</span>
                  </Link>
                  <Link
                    to="/arena"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors"
                  >
                    <Activity size={14} className="text-[#22d3ee]" />
                    <span>My Active Battles</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left"
                  >
                    <LogOut size={14} />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-jakarta font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-white/15 bg-white/[0.03] text-white hover:border-[#22d3ee]/60 hover:text-[#22d3ee] hover:bg-[#22d3ee]/10 transition-all duration-200"
            >
              LOGIN
            </Link>
          )}

          <Link
            to="/arena"
            className="btn-arena flex items-center gap-2 text-xs font-jakarta font-bold uppercase tracking-wider px-5 py-2.5 rounded-full bg-[#22d3ee] text-[#070b12] shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:bg-[#38bdf8]"
          >
            <span>ENTER ARENA</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-white/90 hover:text-[#22d3ee] p-2 focus:outline-none focus:ring-2 focus:ring-[#22d3ee] rounded-md transition-colors"
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Full-Screen Dark Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[65px] bg-[#0f172a] z-40 lg:hidden flex flex-col justify-between px-8 py-8 transition-opacity duration-300 animate-fadeIn"
          style={{ height: 'calc(100vh - 65px)' }}
        >
          <div className="flex flex-col space-y-4 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-xl font-sans font-semibold tracking-wider text-white hover:text-[#22d3ee] transition-colors py-2 border-b border-white/5 flex items-center justify-between group"
              >
                <span>{link.name}</span>
                <ArrowRight size={18} className="text-[#22d3ee] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
            {user ? (
              <Link
                to="/profile"
                className="text-xl font-sans font-semibold tracking-wider text-[#22d3ee] py-2 border-b border-white/5 flex items-center justify-between"
              >
                <span>MY PROFILE & PASSPORT</span>
                <User size={18} />
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-sans font-semibold text-left tracking-wider text-white/80 hover:text-[#22d3ee] py-2 border-b border-white/5 flex items-center justify-between"
              >
                <span>LOGIN / REGISTER</span>
                <ArrowRight size={18} className="text-[#22d3ee]" />
              </Link>
            )}
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
              <span>ARENA STATUS: LIVE BATTLE QUEUE OPEN</span>
            </div>
            <Link
              to="/arena"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#22d3ee] text-[#070b12] font-jakarta font-bold uppercase tracking-wider shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            >
              <span>ENTER THE ARENA</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

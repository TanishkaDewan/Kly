import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setCachedAccessToken } from '../services/supabase';
import { getProfile } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Map Supabase Auth user + backend profile into uniform frontend user model
  const buildUserModel = (authUser, backendProfile = null) => {
    if (!authUser) return null;

    const meta = authUser.user_metadata || {};
    const profile = backendProfile?.profile || backendProfile || {};
    const stats = profile.stats || {};

    return {
      id: authUser.id,
      email: authUser.email,
      username: profile.username || meta.username || authUser.email?.split('@')[0] || 'klyro_engineer',
      fullName: profile.full_name || meta.full_name || 'Klyro Engineer',
      avatar: profile.avatar_url || meta.avatar_url || null,
      githubUsername: profile.github_username || meta.github_username || null,
      role: profile.role || meta.role || 'PLAYER',
      experienceLevel: profile.experience_level || meta.experience_level || 'BEGINNER',
      skills: profile.skills || [],
      // Gamification stats from canonical user_stats
      stats: {
        xp: stats.xp || 0,
        rating: stats.rating || 1000,
        battlesPlayed: stats.battles_played || 0,
        battlesWon: stats.battles_won || 0,
        currentStreak: stats.current_streak || 0
      },
      // Convenience aliases
      xp: stats.xp || 0,
      rating: stats.rating || 1000,
      wins: stats.battles_won || 0,
      losses: Math.max(0, (stats.battles_played || 0) - (stats.battles_won || 0)),
      battlesPlayed: stats.battles_played || 0,
      streak: stats.current_streak || 0
    };
  };

  // Fetch full profile from backend when authenticated
  const loadProfile = async (authUser) => {
    try {
      const response = await getProfile();
      setUser(buildUserModel(authUser, response));
    } catch {
      // Fallback to basic metadata if backend profile is not yet initialized
      setUser(buildUserModel(authUser, null));
    }
  };

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            setCachedAccessToken(initialSession.access_token);
            setUser(buildUserModel(initialSession.user, null));
            loadProfile(initialSession.user);
          } else {
            setUser(null);
            setCachedAccessToken(null);
          }
        }
      } catch (err) {
        console.warn('[AuthContext]: Session initialization error:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession?.user) {
          setCachedAccessToken(newSession.access_token);
          setUser((prev) => prev || buildUserModel(newSession.user, null));
          await loadProfile(newSession.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setCachedAccessToken(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Supabase Password Login
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setCachedAccessToken(data.session.access_token);
      setUser(buildUserModel(data.user, null));
      loadProfile(data.user);
    }
    setAuthModalOpen(false);
    return data;
  };

  // Supabase Registration
  const signUpWithEmail = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setCachedAccessToken(data.session.access_token);
      setUser(buildUserModel(data.user, null));
      loadProfile(data.user);
    }
    setAuthModalOpen(false);
    return data;
  };

  // Supabase GitHub OAuth
  const signInWithGithub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCachedAccessToken(null);
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (session?.user) {
      await loadProfile(session.user);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(String(mode).toLowerCase() === 'register' ? 'register' : 'login');
    setAuthModalOpen(true);
  };

  useEffect(() => {
    const handleAuthRequired = (e) => {
      openAuthModal(e?.detail?.mode || 'login');
    };
    window.addEventListener('klyro:auth-required', handleAuthRequired);
    return () => window.removeEventListener('klyro:auth-required', handleAuthRequired);
  }, []);

  // Backward compatibility alias for existing code calling login()
  const login = (userData) => {
    setUser((prev) => ({ ...(prev || {}), ...userData }));
    setAuthModalOpen(false);
  };

  const logout = () => {
    signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGithub,
        signOut,
        refreshProfile,
        login,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        openAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

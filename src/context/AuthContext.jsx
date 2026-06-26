import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase, getAuthRedirect } from '../lib/supabase';
import { track, identify, resetAnalytics } from '../lib/analytics';

const AuthContext = createContext();

const AUTH_COOLDOWN_MS = 3000;
const PROFILE_TIMEOUT_MS = 10000;

function timeoutPromise(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out: ${label}`)), ms)
    ),
  ]);
}

function mapProfile(data) {
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name || data.email?.split('@')[0] || 'User',
    photoURL: data.photo_url || null,
    phone: data.phone || '',
    defaultCurrency: data.default_currency || 'INR',
    splitmateId: data.splitmate_id || '',
    profileCompleted: data.profile_completed || false,
  };
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Auth] fetchProfile error:', error.message);
    throw error;
  }

  return mapProfile(data);
}

async function ensureProfile(sessionUser) {
  const meta = sessionUser.user_metadata || {};
  const profile = {
    id: sessionUser.id,
    email: sessionUser.email || meta.email || '',
    display_name: meta.display_name || meta.full_name || meta.name || sessionUser.email?.split('@')[0] || 'User',
    photo_url: meta.avatar_url || meta.picture || null,
    phone: '',
    default_currency: 'INR',
  };

  console.log('[Auth] ensureProfile: upserting profile for', sessionUser.email);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Auth] ensureProfile error:', error.message);
      throw error;
    }

    return mapProfile(data);
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapSessionUser(sessionUser) {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName: sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
    photoURL: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null,
    phone: '',
    defaultCurrency: 'INR',
    splitmateId: '',
    profileCompleted: false,
  };
}

function getCooldownError() {
  const err = new Error('Please wait a moment before trying again.');
  err.status = 429;
  return err;
}

function getPendingError() {
  const err = new Error('A request for this account is already in progress.');
  err.status = 429;
  return err;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef({});
  const lastCallRef = useRef({});

  function checkCooldown(key) {
    const now = Date.now();
    const last = lastCallRef.current[key];
    if (last && (now - last) < AUTH_COOLDOWN_MS) return true;
    lastCallRef.current[key] = now;
    return false;
  }

  function withDedup(key, fn) {
    return async (...args) => {
      if (pendingRef.current[key]) throw getPendingError();
      if (checkCooldown(key)) throw getCooldownError();
      pendingRef.current[key] = true;
      try {
        return await fn(...args);
      } finally {
        delete pendingRef.current[key];
      }
    };
  }

  async function resolveUser(sessionUser) {
    console.log('[Auth] resolveUser: checking profile for', sessionUser.email);
    let profile;
    try {
      profile = await timeoutPromise(
        fetchProfile(sessionUser.id),
        PROFILE_TIMEOUT_MS,
        'fetchProfile'
      );
    } catch (err) {
      console.warn('[Auth] fetchProfile failed:', err.message);
      profile = null;
    }

    if (!profile) {
      console.log('[Auth] resolveUser: no profile found, creating one');
      try {
        profile = await timeoutPromise(
          ensureProfile(sessionUser),
          PROFILE_TIMEOUT_MS,
          'ensureProfile'
        );
      } catch (err) {
        console.warn('[Auth] ensureProfile failed:', err.message);
        profile = null;
      }
    }

    if (profile) {
      console.log('[Auth] resolveUser: profile resolved, setting user');
      identify(profile.id, {
        email: profile.email,
        display_name: profile.displayName,
        splitmate_id: profile.splitmateId,
      });
      return profile;
    }

    console.warn('[Auth] resolveUser: using fallback from session metadata');
    return mapSessionUser(sessionUser);
  }

  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    function finish(newUser) {
      if (cancelled || resolved) return;
      resolved = true;
      if (newUser !== undefined) setUser(newUser);
      setLoading(false);
    }

    const init = async () => {
      console.log('[Auth] init: checking existing session');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('[Auth] init: getSession error:', error.message);
      }

      if (cancelled) return;

      if (session?.user) {
        const userData = await resolveUser(session.user);
        if (!cancelled) {
          finish(userData);
        }
      } else {
        console.log('[Auth] init: no session');
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange: event=' + event, 'email=' + (session?.user?.email || 'none'));

      if (cancelled) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const userData = await resolveUser(session.user);
          if (!cancelled) {
            finish(userData);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] onAuthStateChange: signed out');
        finish(null);
      } else if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          const userData = await resolveUser(session.user);
          if (!cancelled) {
            finish(userData);
          }
        } else {
          finish(null);
        }
      }
    });

    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        console.warn('[Auth] safety timeout: forcing finish');
        finish(null);
      }
    }, 15000);

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(withDedup('signUp', async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw error;

    if (data?.session) {
      const userData = await resolveUser(data.user);
      track('user_signup', { email, method: 'email' });
      return userData;
    }

    return null;
  }), []);

  const signIn = useCallback(withDedup('signIn', async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        const typedErr = new Error('Please verify your email before signing in. Check your inbox for the confirmation link.');
        typedErr.code = 'EMAIL_NOT_CONFIRMED';
        typedErr.email = email;
        throw typedErr;
      }
      throw error;
    }

    const userData = await resolveUser(data.user);
    track('user_login', { method: 'email' });
    return userData;
  }), []);

  const resendVerificationEmail = useCallback(withDedup('resendVerification', async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthRedirect('/auth/callback'),
      },
    });
    if (error) throw error;
  }), []);

  const signInWithGoogle = useCallback(withDedup('google', async () => {
    const redirectTo = getAuthRedirect('/auth/callback');
    console.log('[Auth] signInWithGoogle redirectTo:', redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      console.error('[Auth] signInWithGoogle error:', error);
      throw error;
    }
  }), []);

  const signOut = useCallback(withDedup('signOut', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    resetAnalytics();
  }), []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      display_name: updates.displayName ?? user.displayName,
      phone: updates.phone ?? user.phone,
      photo_url: updates.photoURL ?? user.photoURL,
      default_currency: updates.defaultCurrency ?? user.defaultCurrency,
      profile_completed: updates.profileCompleted ?? user.profileCompleted,
    });
    if (error) {
      console.warn('[Auth] updateProfile error:', error.message);
      return;
    }
    setUser(prev => ({ ...prev, ...updates }));
  }, [user]);

  const completeProfile = useCallback(async (phone, displayNameOverride) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      display_name: displayNameOverride || user.displayName,
      phone: phone,
      profile_completed: true,
    });
    if (error) throw error;
    setUser(prev => ({ ...prev, phone, profileCompleted: true, displayName: displayNameOverride || prev.displayName }));
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, signIn, signUp, signInWithGoogle, signOut,
      updateProfile, completeProfile, resendVerificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

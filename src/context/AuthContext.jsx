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
  const t0 = Date.now();
  console.log('[trace] fetchProfile: ENTER userId=' + userId + ' t=' + t0);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  const t1 = Date.now();
  console.log('[trace] fetchProfile: query DONE elapsed=' + (t1 - t0) + 'ms data=' + (data ? 'found' : 'null') + ' error=' + (error ? error.message : 'null'));

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

  const t0 = Date.now();
  console.log('[trace] ensureProfile: ENTER email=' + sessionUser.email + ' t=' + t0);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .maybeSingle();
    const t1 = Date.now();
    console.log('[trace] ensureProfile: upsert DONE elapsed=' + (t1 - t0) + 'ms data=' + (data ? 'found' : 'null') + ' error=' + (error ? error.message : 'null'));

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
  const resolveUserCallIdRef = useRef(0);

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
    const callId = ++resolveUserCallIdRef.current;
    const t0 = Date.now();
    console.log('[trace] resolveUser#' + callId + ': ENTER email=' + sessionUser.email + ' t=' + t0);
    let profile;
    try {
      console.log('[trace] resolveUser#' + callId + ': calling fetchProfile t=' + Date.now());
      profile = await timeoutPromise(
        fetchProfile(sessionUser.id),
        PROFILE_TIMEOUT_MS,
        'fetchProfile'
      );
      console.log('[trace] resolveUser#' + callId + ': fetchProfile returned elapsed=' + (Date.now() - t0) + 'ms profile=' + (profile ? 'ok' : 'null'));
    } catch (err) {
      const t1 = Date.now();
      console.warn('[trace] resolveUser#' + callId + ': fetchProfile THREW elapsed=' + (t1 - t0) + 'ms msg=' + err.message + ' stack=' + (err.stack || 'no-stack'));
      profile = null;
    }

    if (!profile) {
      const t2 = Date.now();
      console.log('[trace] resolveUser#' + callId + ': no profile, calling ensureProfile elapsed=' + (t2 - t0) + 'ms');
      try {
        profile = await timeoutPromise(
          ensureProfile(sessionUser),
          PROFILE_TIMEOUT_MS,
          'ensureProfile'
        );
        console.log('[trace] resolveUser#' + callId + ': ensureProfile returned elapsed=' + (Date.now() - t2) + 'ms profile=' + (profile ? 'ok' : 'null'));
      } catch (err) {
        const t3 = Date.now();
        console.warn('[trace] resolveUser#' + callId + ': ensureProfile THREW elapsed=' + (t3 - t2) + 'ms msg=' + err.message + ' stack=' + (err.stack || 'no-stack'));
        profile = null;
      }
    }

    if (profile) {
      console.log('[trace] resolveUser#' + callId + ': profile RESOLVED total_elapsed=' + (Date.now() - t0) + 'ms');
      try {
        identify(profile.id, {
          email: profile.email,
          display_name: profile.displayName,
          splitmate_id: profile.splitmateId,
        });
      } catch (identifyErr) {
        console.warn('[trace] resolveUser#' + callId + ': identify() THREW msg=' + identifyErr.message + ' stack=' + (identifyErr.stack || 'no-stack'));
      }
      console.log('[trace] resolveUser#' + callId + ': RETURN via RESOLVED path total=' + (Date.now() - t0) + 'ms');
      return profile;
    }

    console.warn('[trace] resolveUser#' + callId + ': RETURN via FALLBACK path total=' + (Date.now() - t0) + 'ms');
    return mapSessionUser(sessionUser);
  }

  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    function finish(newUser) {
      if (cancelled || resolved) {
        console.log('[trace] finish: SKIP cancelled=' + cancelled + ' resolved=' + resolved + ' newUser=' + (newUser ? 'ok' : 'null') + ' at t=' + Date.now());
        return;
      }
      resolved = true;
      console.log('[trace] finish: PROCEED user=' + (newUser ? 'ok' : 'null') + ' at t=' + Date.now());
      if (newUser !== undefined) setUser(newUser);
      setLoading(false);
    }

    const init = async () => {
      const ti0 = Date.now();
      console.log('[trace] init: START t=' + ti0);
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('[trace] init: getSession DONE elapsed=' + (Date.now() - ti0) + 'ms session=' + (session ? 'yes' : 'null') + ' error=' + (error ? error.message : 'null'));

      if (error) {
        console.warn('[Auth] init: getSession error:', error.message);
      }

      if (cancelled) return;

      if (session?.user) {
        console.log('[trace] init: calling resolveUser from getSession path');
        let userData;
        try {
          userData = await resolveUser(session.user);
          console.log('[trace] init: resolveUser DONE total_elapsed=' + (Date.now() - ti0) + 'ms');
        } catch (initRuErr) {
          console.error('[trace] init: resolveUser UNCAUGHT EXCEPTION elapsed=' + (Date.now() - ti0) + 'ms msg=' + initRuErr.message + ' stack=' + (initRuErr.stack || 'no-stack'));
        }
        if (!cancelled) {
          finish(userData);
        }
      } else {
        console.log('[trace] init: no session elapsed=' + (Date.now() - ti0) + 'ms');
        if (!cancelled) finish(null);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const te = Date.now();
      console.log('[trace] onAuthStateChange: ENTER event=' + event + ' email=' + (session?.user?.email || 'none') + ' t=' + te);

      if (cancelled) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('[trace] onAuthStateChange: calling resolveUser for event=' + event);
          let userData;
          try {
            userData = await resolveUser(session.user);
            console.log('[trace] onAuthStateChange: resolveUser DONE event=' + event + ' elapsed=' + (Date.now() - te) + 'ms user=' + (userData ? 'ok' : 'null'));
          } catch (oscRuErr) {
            console.error('[trace] onAuthStateChange: resolveUser UNCAUGHT EXCEPTION event=' + event + ' elapsed=' + (Date.now() - te) + 'ms msg=' + oscRuErr.message + ' stack=' + (oscRuErr.stack || 'no-stack'));
          }
          if (!cancelled) {
            finish(userData);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[trace] onAuthStateChange: SIGNED_OUT');
        finish(null);
      } else if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('[trace] onAuthStateChange: calling resolveUser for INITIAL_SESSION');
          let userData;
          try {
            userData = await resolveUser(session.user);
            console.log('[trace] onAuthStateChange: resolveUser DONE INITIAL_SESSION elapsed=' + (Date.now() - te) + 'ms');
          } catch (oscIsErr) {
            console.error('[trace] onAuthStateChange: resolveUser UNCAUGHT EXCEPTION INITIAL_SESSION elapsed=' + (Date.now() - te) + 'ms msg=' + oscIsErr.message + ' stack=' + (oscIsErr.stack || 'no-stack'));
          }
          if (!cancelled) {
            finish(userData);
          }
        }
        // Do not call finish(null) here. INITIAL_SESSION fires before the PKCE
        // code exchange completes on /auth/callback. Calling finish(null) at this
        // point permanently closes the one-shot gate and blocks the real SIGNED_IN
        // event that arrives moments later. The no-session case is handled by
        // init() after getSession() has confirmed the state definitively.
      }
    });

    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        console.warn('[trace] SAFETY_TIMEOUT FIRED at ' + (Date.now()) + 'ms after mount — auth not resolved yet');
        finish(null);
      } else {
        console.log('[trace] SAFETY_TIMEOUT FIRED at ' + (Date.now()) + 'ms after mount — already resolved (ok)');
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

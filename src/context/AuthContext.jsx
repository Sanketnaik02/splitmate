import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

const AUTH_COOLDOWN_MS = 3000;

function mapProfile(data) {
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name || data.email?.split('@')[0] || 'User',
    photoURL: data.photo_url || null,
    phone: data.phone || '',
    defaultCurrency: data.default_currency || 'INR',
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
    return null;
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

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    console.warn('[Auth] ensureProfile error (may need migration):', error.message);
    return null;
  }

  return mapProfile(data);
}

function mapSessionUser(sessionUser, profile) {
  return profile || {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName: sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
    photoURL: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null,
    phone: '',
    defaultCurrency: 'INR',
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
    let profile = await fetchProfile(sessionUser.id);

    if (!profile) {
      console.log('[Auth] resolveUser: no profile found, creating one');
      profile = await ensureProfile(sessionUser);
    }

    if (profile) {
      console.log('[Auth] resolveUser: profile resolved, setting user');
    } else {
      console.warn('[Auth] resolveUser: using fallback from session metadata');
    }

    return profile || mapSessionUser(sessionUser, null);
  }

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      console.log('[Auth] init: checking existing session');
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        if (session?.user) {
          console.log('[Auth] init: session found for', session.user.email);
          const userData = await resolveUser(session.user);
          if (!cancelled) setUser(userData);
        } else {
          console.log('[Auth] init: no session');
        }
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange: event=' + event, 'email=' + (session?.user?.email || 'none'));

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        const userData = await resolveUser(session.user);
        if (!cancelled) setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] onAuthStateChange: signed out');
        if (!cancelled) setUser(null);
      }

      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(withDedup('signUp', async (name, email, password) => {
    const key = `signUp:${email.toLowerCase()}`;
    if (pendingRef.current[key]) throw getPendingError();
    if (checkCooldown(key)) throw getCooldownError();
    pendingRef.current[key] = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) throw error;

      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          display_name: name,
          photo_url: null,
          phone: '',
          default_currency: 'INR',
        });
        if (profileError && profileError.code !== '23505') {
          console.warn('[Auth] signUp profile insert error (may need migration):', profileError.message);
        }
      }

      return data.user;
    } finally {
      delete pendingRef.current[key];
    }
  }), []);

  const signIn = useCallback(withDedup('signIn', async (email, password) => {
    const key = `signIn:${email.toLowerCase()}`;
    if (pendingRef.current[key]) throw getPendingError();
    if (checkCooldown(key)) throw getCooldownError();
    pendingRef.current[key] = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    } finally {
      delete pendingRef.current[key];
    }
  }), []);

  const signInWithGoogle = useCallback(withDedup('google', async () => {
    console.log('[Auth] signInWithGoogle: starting OAuth');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  }), []);


  const signOut = useCallback(withDedup('signOut', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
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
    });
    if (error) {
      console.warn('[Auth] updateProfile upsert error (may need migration):', error.message);
      return;
    }
    setUser(prev => ({ ...prev, ...updates }));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

const AUTH_COOLDOWN_MS = 3000;

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (data) {
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      photoURL: data.photo_url,
      phone: data.phone || '',
      defaultCurrency: data.default_currency || 'INR',
    };
  }
  return null;
}

function mapSessionUser(sessionUser, profile) {
  return profile || {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName: sessionUser.user_metadata?.display_name || sessionUser.email?.split('@')[0] || 'User',
    photoURL: sessionUser.user_metadata?.avatar_url || null,
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

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (!cancelled) setUser(mapSessionUser(session.user, profile));
        }
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        const profile = await fetchProfile(session.user.id);
        if (!cancelled) setUser(mapSessionUser(session.user, profile));
      } else if (event === 'SIGNED_OUT') {
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
        if (profileError && profileError.code !== '23505') throw profileError;
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

  // const signInWithGoogle = useCallback(withDedup('google', async () => {
  //   const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  //   if (error) throw error;
  // }), []);
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://splitmate-ten-psi.vercel.app/dashboard'
      }
    });

    if (error) throw error;
  }, []);


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
    if (error) throw error;
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

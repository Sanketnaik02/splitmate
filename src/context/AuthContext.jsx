import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { store } from '../utils/storage';

const AuthContext = createContext();

function getCurrentUserId() {
  try { return localStorage.getItem('splitmate_session'); } catch { return null; }
}

function setCurrentUserId(id) {
  if (id) localStorage.setItem('splitmate_session', id);
  else localStorage.removeItem('splitmate_session');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = getCurrentUserId();
    if (id) {
      const found = store.get('users', id);
      if (found) setUser(found);
    }
    setLoading(false);
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const existing = store.where('users', 'email', email);
    if (existing.length > 0) throw new Error('DUPLICATE_EMAIL');

    const newUser = store.add('users', {
      displayName: name,
      email,
      password,
      photoURL: null,
      phone: '',
      defaultCurrency: 'INR',
    });

    setCurrentUserId(newUser.id);
    setUser(newUser);
    return newUser;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const matched = store.where('users', 'email', email);
    if (matched.length === 0) throw new Error('No account found with this email');
    if (matched[0].password !== password) throw new Error('Incorrect password');

    setCurrentUserId(matched[0].id);
    setUser(matched[0]);
    return matched[0];
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const existing = store.where('users', 'email', 'demo@splitmate.app');
    if (existing.length > 0) {
      setCurrentUserId(existing[0].id);
      setUser(existing[0]);
      return existing[0];
    }

    const newUser = store.add('users', {
      displayName: 'Demo User',
      email: 'demo@splitmate.app',
      password: '',
      photoURL: null,
      phone: '',
      defaultCurrency: 'INR',
    });

    setCurrentUserId(newUser.id);
    setUser(newUser);
    return newUser;
  }, []);

  const signOut = useCallback(async () => {
    setCurrentUserId(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates) => {
    if (!user) return;
    const updated = store.update('users', user.id, updates);
    if (updated) setUser(updated);
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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useToast } from '../../components/ui/Toast';

const AUTH_COOLDOWN_MS = 3000;
let pendingReset = false;
let lastResetCall = 0;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const submitRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) setReady(true);
    return () => { subscription?.unsubscribe(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitRef.current) return;
    setError('');
    if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (pendingReset) { setError('A password reset request is already in progress.'); return; }
    const now = Date.now();
    if (lastResetCall && (now - lastResetCall) < AUTH_COOLDOWN_MS) { setError('Please wait a moment before trying again.'); return; }
    lastResetCall = now;
    pendingReset = true;
    submitRef.current = true;
    setSubmitting(true);
    try {
      const { error: reqError } = await supabase.auth.updateUser({ password });
      if (reqError) {
        const msg = getAuthErrorMessage(reqError);
        if (msg) { setError(msg); return; }
        showToast(reqError.message, 'error');
        return;
      }
      showToast('Password updated successfully!', 'success');
      navigate('/signin');
    } finally {
      pendingReset = false;
      submitRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle={ready ? 'Enter your new password below.' : 'Checking recovery link...'}
      alternate={{ text: 'Back to', link: 'Sign in', to: '/signin' }}
    >
      {ready ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" icon="🔒" />
          <Button type="submit" fullWidth loading={submitting} disabled={submitting}>Update Password</Button>
        </form>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">Please wait...</p>
      )}
    </AuthLayout>
  );
}

import React, { useState, useRef } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { validateEmail } from '../../utils/validators';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useToast } from '../../components/ui/Toast';

const AUTH_COOLDOWN_MS = 3000;
const pendingForgotRef = {};
const lastForgotCall = {};

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submitRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitRef.current) return;
    setError('');
    if (!validateEmail(email)) { showToast('Please enter a valid email', 'error'); return; }
    const key = email.toLowerCase();
    if (pendingForgotRef[key]) { setError('A request for this email is already in progress.'); return; }
    const now = Date.now();
    const last = lastForgotCall[key];
    if (last && (now - last) < AUTH_COOLDOWN_MS) { setError('Please wait a moment before trying again.'); return; }
    lastForgotCall[key] = now;
    pendingForgotRef[key] = true;
    submitRef.current = true;
    setSubmitting(true);
    try {
      const { error: reqError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (reqError) {
        const msg = getAuthErrorMessage(reqError);
        if (msg) { setError(msg); return; }
        showToast(reqError.message, 'error');
        return;
      }
      setSent(true);
      showToast('Reset link sent to your email', 'success');
    } finally {
      delete pendingForgotRef[key];
      submitRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link"
      alternate={{ text: 'Remember your password?', link: 'Sign in', to: '/signin' }}
    >
      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">Check your email for the reset link.</p>
          <Button fullWidth variant="secondary" onClick={() => setSent(false)}>Send again</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@email.com" icon="✉️" />
          <Button type="submit" fullWidth loading={submitting} disabled={submitting}>Send Reset Link</Button>
        </form>
      )}
    </AuthLayout>
  );
}

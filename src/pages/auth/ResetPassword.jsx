import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) setReady(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Password updated successfully!', 'success');
    navigate('/signin');
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle={ready ? 'Enter your new password below.' : 'Checking recovery link...'}
      alternate={{ text: 'Back to', link: 'Sign in', to: '/signin' }}
    >
      {ready ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" icon="🔒" />
          <Button type="submit" fullWidth loading={submitting}>Update Password</Button>
        </form>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">Please wait...</p>
      )}
    </AuthLayout>
  );
}

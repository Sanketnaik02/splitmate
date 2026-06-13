import React, { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { validateEmail } from '../../utils/validators';
import { useToast } from '../../components/ui/Toast';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) { showToast('Please enter a valid email', 'error'); return; }
    setSent(true);
    showToast('Reset link sent to your email', 'success');
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
          <p className="text-sm text-gray-600 mb-4">Check your email for the reset link.</p>
          <Button fullWidth variant="secondary" onClick={() => setSent(false)}>Send again</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@email.com" icon="✉️" />
          <Button type="submit" fullWidth>Send Reset Link</Button>
        </form>
      )}
    </AuthLayout>
  );
}

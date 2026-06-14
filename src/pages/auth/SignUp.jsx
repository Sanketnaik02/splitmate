import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';
import { getAuthErrorMessage } from '../../utils/authErrors';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmRequired, setConfirmRequired] = useState(false);
  const submitRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitRef.current) return;
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
    submitRef.current = true;
    setSubmitting(true);
    try {
      const result = await signUp(name, email, password);
      if (result) {
        // Auto-logged in
        navigate('/dashboard');
      } else {
        // Email confirmation required
        setConfirmRequired(true);
      }
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg || err?.message || 'Something went wrong. Try again.');
    } finally {
      submitRef.current = false;
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg || 'Google sign-in failed. Try again.');
    } finally {
      submitRef.current = false;
      setGoogleLoading(false);
    }
  };

  if (confirmRequired) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle=""
        alternate={{ text: 'Back to', link: 'Sign in', to: '/signin' }}
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">We sent a confirmation link to:</p>
          <p className="text-sm font-semibold text-gray-900 mb-4">{email}</p>
          <p className="text-xs text-gray-400">Click the link in the email to activate your account, then sign in.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start tracking expenses with friends"
      alternate={{ text: 'Already have an account?', link: 'Sign in', to: '/signin' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" icon="👤" />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@email.com" icon="✉️" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" icon="🔒" />
        <Button type="submit" fullWidth loading={submitting} disabled={submitting}>Create Account</Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-100 px-3 text-xs text-gray-400">or</span></div>
        </div>
        <Button type="button" variant="secondary" fullWidth icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957273V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957273 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
          </svg>
        } onClick={handleGoogle} loading={googleLoading} disabled={submitting || googleLoading}>Continue with Google</Button>
      </form>
    </AuthLayout>
  );
}

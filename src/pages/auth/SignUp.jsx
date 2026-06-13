import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
    try {
      await signUp(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err?.message === 'DUPLICATE_EMAIL') {
        setError('This email is already registered. Please login instead.');
      } else {
        setError('Something went wrong. Try again.');
      }
    }
  };

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
        <Button type="submit" fullWidth loading={loading}>Create Account</Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
        </div>
        <Button type="button" variant="secondary" fullWidth icon="🔴" onClick={signInWithGoogle}>Continue with Google</Button>
      </form>
    </AuthLayout>
  );
}

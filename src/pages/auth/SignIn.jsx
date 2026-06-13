import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch { setError('Invalid email or password'); }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue splitting expenses"
      alternate={{ text: "Don't have an account?", link: 'Sign up', to: '/signup' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@email.com" icon="✉️" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" icon="🔒" />
        <div className="text-right">
          <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-primary-600 font-medium hover:underline">
            Forgot password?
          </button>
        </div>
        <Button type="submit" fullWidth loading={loading}>Sign In</Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
        </div>
        <Button type="button" variant="secondary" fullWidth icon="🔴" onClick={signInWithGoogle}>Continue with Google</Button>
      </form>
    </AuthLayout>
  );
}

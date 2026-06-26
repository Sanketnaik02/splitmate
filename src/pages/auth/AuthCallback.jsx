import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { captureError } from '../../lib/sentry';

const MAX_WAIT_MS = 10000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Completing sign in...');
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    if (!loading && user) {
      handledRef.current = true;
      setStatus('Signed in! Redirecting...');
      const t = setTimeout(() => navigate('/dashboard', { replace: true }), 300);
      return () => clearTimeout(t);
    }

    if (!loading && !user) {
      handledRef.current = true;
      setError('Could not complete sign in. Your session may have expired.');
      setStatus(null);
      captureError(new Error('OAuth callback: no user after auth ready'), {
        tag: 'auth.callback.no_user',
      });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!handledRef.current) {
        setTimedOut(true);
        setError('Sign in is taking longer than expected. Check your connection and try again.');
        setStatus(null);
      }
    }, MAX_WAIT_MS);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    handledRef.current = false;
    setTimedOut(false);
    setError(null);
    setStatus('Retrying...');
    window.location.href = '/signin';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-600/30">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Sign in failed</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/signin', { replace: true })}
              className="px-5 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-600/30">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>
      </div>
    </div>
  );
}

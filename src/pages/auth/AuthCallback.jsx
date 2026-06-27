import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { captureError } from '../../lib/sentry';

const MAX_WAIT_MS = 25000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Completing sign in...');
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const handledRef = useRef(false);

  // Primary path: explicit PKCE code exchange.
  //
  // When Google (or any OAuth provider) redirects back with ?code=, this effect
  // runs exchangeCodeForSession() and awaits its completion synchronously.
  // Once the exchange resolves, getSession() is called directly — the session
  // is guaranteed to be in localStorage at this point, so there is no race
  // against the SIGNED_IN event or AuthContext timing.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // No OAuth code — this is not a PKCE callback (e.g. email verification
    // that uses a different mechanism). Fall through to the AuthContext fallback.
    if (!code) return;

    const exchange = async () => {
      try {
        // supabase-js v2: exchangeCodeForSession(code: string)
        // Returns { data: { session, user }, error }
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          if (handledRef.current) return;
          handledRef.current = true;
          captureError(exchangeError, { tag: 'auth.callback.exchange_error' });
          setError(exchangeError.message || 'Sign in failed. Please try again.');
          setStatus(null);
          return;
        }

        // Exchange succeeded. The session is now written to localStorage.
        // Read it directly — no dependency on any async event.
        const { data: { session } } = await supabase.auth.getSession();

        if (handledRef.current) return;

        if (session) {
          handledRef.current = true;
          setStatus('Signed in! Redirecting...');
          setTimeout(() => navigate('/dashboard', { replace: true }), 300);
        } else {
          handledRef.current = true;
          captureError(
            new Error('PKCE exchange succeeded but getSession returned null'),
            { tag: 'auth.callback.no_session_post_exchange' }
          );
          setError('Could not complete sign in. Please try again.');
          setStatus(null);
        }
      } catch (err) {
        if (handledRef.current) return;
        handledRef.current = true;
        captureError(err, { tag: 'auth.callback.exchange_exception' });
        setError('Sign in failed. Please try again.');
        setStatus(null);
      }
    };

    exchange();
  }, [navigate]);

  // Fallback path: watch AuthContext resolution.
  //
  // Handles cases where there is no ?code= in the URL (e.g. email confirmation
  // redirects, or password reset). Also acts as a safety net on the OAuth path
  // if AuthContext resolves before the exchange effect completes.
  //
  // When ?code= IS present, the !loading && !user branch is intentionally
  // suppressed — the exchange effect above owns the outcome for that case.
  useEffect(() => {
    if (handledRef.current) return;

    if (!loading && user) {
      handledRef.current = true;
      setStatus('Signed in! Redirecting...');
      const t = setTimeout(() => navigate('/dashboard', { replace: true }), 300);
      return () => clearTimeout(t);
    }

    if (!loading && !user) {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('code')) {
        // Only surface the no-user error when there is no OAuth exchange
        // in progress. If ?code= exists, the exchange effect handles the outcome.
        handledRef.current = true;
        setError('Could not complete sign in. Your session may have expired.');
        setStatus(null);
        captureError(new Error('OAuth callback: no user after auth ready'), {
          tag: 'auth.callback.no_user',
        });
      }
    }
  }, [user, loading, navigate]);

  // Timeout safety net — fires if neither path resolves within MAX_WAIT_MS.
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

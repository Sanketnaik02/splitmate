import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    let cancelled = false;

    async function handleOAuth() {
      console.log('[AuthCallback] Mounted. URL:', window.location.href);
      console.log('[AuthCallback] Search params:', window.location.search);
      console.log('[AuthCallback] Hash:', window.location.hash);

      // Let the Supabase client detect the session from URL.
      // getSession() internally calls _recoverSession() which:
      //   1. Checks URL for ?code=xxx (PKCE) or #access_token=xxx (implicit)
      //   2. If PKCE code found, POSTs to /auth/v1/token to exchange for session
      //   3. Stores session in localStorage
      //   4. Returns the session
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        console.error('[AuthCallback] getSession error:', error.message);
        setStatus('Authentication failed. Redirecting...');
        await new Promise(r => setTimeout(r, 1500));
        if (!cancelled) navigate('/signin', { replace: true });
        return;
      }

      if (data?.session) {
        console.log('[AuthCallback] Session established for:', data.session.user?.email);
        setStatus('Signed in! Redirecting...');
        // Profile will be handled by AuthContext's resolveUser
        await new Promise(r => setTimeout(r, 500));
        if (!cancelled) navigate('/dashboard', { replace: true });
      } else {
        console.warn('[AuthCallback] No session found after auth flow.');
        console.log('[AuthCallback] Current URL parameters may have been consumed.');
        // Try onAuthStateChange as fallback
        const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[AuthCallback] onAuthStateChange fallback:', event, !!session);
          if (session && !cancelled) {
            subData.subscription.unsubscribe();
            navigate('/dashboard', { replace: true });
          }
        });
        // No session after 5s → redirect to sign in
        setTimeout(() => {
          if (!cancelled) {
            subData.subscription.unsubscribe();
            setStatus('Session not found. Redirecting to sign in...');
            setTimeout(() => {
              if (!cancelled) navigate('/signin', { replace: true });
            }, 1000);
          }
        }, 5000);
      }
    }

    handleOAuth();

    return () => { cancelled = true; };
  }, [navigate]);

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

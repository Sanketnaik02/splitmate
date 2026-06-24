import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Strip any trailing path so the URL is always the bare project URL.
// createClient() appends /auth/v1, /rest/v1, etc. internally.
// A URL like "https://project.supabase.co/rest/v1/" would produce
// broken auth endpoints like "https://project.supabase.co/rest/v1/auth/v1/..."
const url = rawUrl?.replace(/\/?(rest\/v1\/?)?$/, '');

console.log('[Supabase] Init with URL:', url);
console.log('[Supabase] Key present:', !!anonKey);

if (!url) {
  console.error('[Supabase] VITE_SUPABASE_URL is not set! Auth and API calls will fail.');
}

if (!anonKey) {
  console.error('[Supabase] VITE_SUPABASE_ANON_KEY is not set! Auth and API calls will fail.');
}

export const supabase = createClient(url || '', anonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

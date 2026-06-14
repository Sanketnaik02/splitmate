import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const baseUrl = url?.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(baseUrl || url, anonKey);

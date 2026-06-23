import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') || 'https://placeholder.supabase.co'; // Strip /rest/v1 and trailing slashes if present
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

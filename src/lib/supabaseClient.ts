import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// In production browser environments, we prefer using the /api/supabase proxy
// to keep all traffic under the same domain (platform.erani.mx) and avoid CORS.
const clientUrl = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production')
  ? `${window.location.origin}/api/supabase`
  : supabaseUrl;

if (!supabaseUrl && typeof window !== 'undefined') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey && typeof window !== 'undefined') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Browser / client-side Supabase client.
 * Uses the anon key – respects Row Level Security (RLS).
 */
export const supabase = createClient(clientUrl, supabaseAnonKey);

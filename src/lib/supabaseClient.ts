import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// In production browser environments, we previously used a proxy
// but it causes 401 errors due to stripped headers or rewrite issues.
// Supabase natively supports CORS so we can connect directly.
const clientUrl = supabaseUrl;

if (!supabaseUrl && typeof window !== 'undefined') {
  console.error('CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Connection to Supabase will fail.');
}
if (!supabaseAnonKey && typeof window !== 'undefined') {
  console.error('CRITICAL: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Authentication with Supabase will fail.');
}

/**
 * Browser / client-side Supabase client.
 * Uses the anon key – respects Row Level Security (RLS).
 */
export const supabase = createClient(clientUrl, supabaseAnonKey);

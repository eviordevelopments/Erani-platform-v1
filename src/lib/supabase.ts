import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Browser / client-side Supabase client.
 * Uses the anon key – respects Row Level Security (RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase admin client.
 * Uses the service_role key – bypasses RLS.
 * NEVER expose this on the client bundle.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

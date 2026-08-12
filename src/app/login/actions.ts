'use server'

import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const GENERIC_ERROR = 'Credenciales inválidas. Verifica tu email y contraseña.'

/**
 * Server Action to perform login.
 * This bypasses browser-level network issues (CORS, ERR_CONNECTION_RESET)
 * by executing the request from the Node.js server.
 *
 * After a successful sign-in, reads `onboarding_completed` from the `profiles`
 * table (not from user_metadata) to determine the post-login redirect destination.
 */
export async function loginAction(email: string, password: string) {
  console.log("--- Login Action Start ---");
  console.log("Target URL:", supabaseUrl);
  console.log("Key Length:", supabaseAnonKey?.length);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false
        }
    })
    
    console.log("Attempting sign-in for:", email.trim());
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      console.error("Supabase Auth Error:", error.message);
      // Return a generic error message regardless of whether the email exists
      // to avoid leaking information about registered accounts (Req 4.6)
      return { success: false, error: GENERIC_ERROR }
    }

    const userId = data.user?.id
    console.log("Login successful for:", userId);

    // Read onboarding_completed from profiles table (not user_metadata) — Req 4.3
    let onboardingCompleted = false
    if (userId) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.warn("Could not read profile for user:", userId, profileError.message)
        // Default to false (redirect to onboarding) if profile can't be read
        onboardingCompleted = false
      } else {
        onboardingCompleted = profile?.onboarding_completed ?? false
      }
    }

    return { 
        success: true, 
        session: data.session, 
        user: data.user,
        onboardingCompleted,
    }
  } catch (err: any) {
    console.error("Critical error in loginAction catch block:", err);
    return { success: false, error: `Error de servidor: ${err.message || "Desconocido"}` }
  }
}

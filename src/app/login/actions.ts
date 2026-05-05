'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Server Action to perform login.
 * This bypasses browser-level network issues (CORS, ERR_CONNECTION_RESET)
 * by executing the request from the Node.js server.
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
      return { success: false, error: error.message }
    }

    console.log("Login successful for:", data.user?.id);
    return { 
        success: true, 
        session: data.session, 
        user: data.user 
    }
  } catch (err: any) {
    console.error("Critical error in loginAction catch block:", err);
    return { success: false, error: `Error de servidor: ${err.message || "Desconocido"}` }
  }
}

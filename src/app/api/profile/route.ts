/**
 * GET /api/profile
 *
 * Returns the profile + org for the currently authenticated user.
 * Uses supabaseAdmin to bypass RLS, but scopes the query strictly
 * to the user_id extracted from the JWT — so no user can ever see
 * another user's data.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado o token faltante' }, { status: 401 })
    }

    console.log('[API/PROFILE] Token received length:', token?.length);
    // Verify the token and extract the user — use anon client for auth only
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)

    if (authError || !user) {
      console.error('[API/PROFILE] Auth verification failed:', authError?.message || 'No user returned');
      return NextResponse.json({ error: authError?.message || 'Token inválido' }, { status: 401 })
    }
    console.log('[API/PROFILE] Auth verified successfully for user:', user.id);

    // Fetch profile using admin client, scoped strictly to this user's id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Fetch org if linked
    let org = null
    if (profile.organization_id) {
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('id, name, logo_url, plan, paid_subscription, eris_balance, subscription_activated_at')
        .eq('id', profile.organization_id)
        .single()
      org = orgData ?? null
    }

    return NextResponse.json({ profile, org })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

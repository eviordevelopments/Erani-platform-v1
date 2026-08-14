/**
 * API Route: /api/auth/org
 *
 * Central server route for all organization-scoped operations.
 * Uses supabaseAdmin (service role) to bypass RLS for all writes.
 *
 * Supported actions:
 *   - create_org
 *   - invite_members
 *   - create_admin_profile
 *   - lookup_member
 *   - create_member_profile
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ── Types ──────────────────────────────────────────────────────────────────

interface CreateOrgPayload {
  name: string
  sector?: string
  team_size?: string
  logo_url?: string
  bio?: string
  goals?: string[]
  recovery_email?: string
  audited_file_types?: string[]
}

interface InviteMembersPayload {
  organization_id: string
  members: Array<{ email: string; profile_type: 'admin' | 'member'; role?: string }>
}

interface CreateAdminProfilePayload {
  user_id: string
  organization_id: string
  email: string
  full_name?: string
  role?: string
}

interface CreateAdminAccountPayload {
  organization_id: string
  email: string
  password: string
  full_name?: string
  role?: string
}

interface LookupMemberPayload {
  email: string
  org_name: string
}

interface CreateMemberProfilePayload {
  user_id: string
  organization_id: string
  email: string
  display_name?: string
  bio?: string
}

interface ResolveMemberUserIdPayload {
  email: string
}

interface SetMemberPasswordPayload {
  user_id: string
  password: string
}

interface CreateUserPreferencesPayload {
  user_id: string
  organization_id?: string
  font_size?: number
  theme_color?: string
  custom_logo_url?: string | null
  bento_order?: string[]
}

interface SendReferralInvitePayload {
  referrer_organization_id: string
  email: string
}

// ── Error helper ───────────────────────────────────────────────────────────

function handleDbError(error: { code?: string; message: string }) {
  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'Ya existe un registro con esos datos.' },
      { status: 409 }
    )
  }
  if (error.code === '42501') {
    return NextResponse.json(
      { error: 'Sin permisos para realizar esta operación.' },
      { status: 403 }
    )
  }
  return NextResponse.json({ error: error.message }, { status: 500 })
}

// ── Action handlers ────────────────────────────────────────────────────────

async function createOrg(payload: CreateOrgPayload): Promise<NextResponse> {
  const { name, sector, team_size, logo_url, bio, goals, recovery_email, audited_file_types } = payload

  if (!name || name.trim() === '') {
    return NextResponse.json(
      { error: 'El nombre de la organización es requerido.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .insert({ name: name.trim(), sector, team_size, logo_url, bio, goals, recovery_email, audited_file_types })
    .select('id')
    .single()

  if (error) return handleDbError(error)

  return NextResponse.json({ organization_id: data.id })
}

async function inviteMembers(payload: InviteMembersPayload): Promise<NextResponse> {
  const { organization_id, members } = payload

  if (!organization_id) {
    return NextResponse.json(
      { error: 'organization_id es requerido.' },
      { status: 400 }
    )
  }

  if (!Array.isArray(members) || members.length === 0) {
    return NextResponse.json(
      { error: 'La lista de miembros no puede estar vacía.' },
      { status: 400 }
    )
  }

  // Plan limit: max 5 members total (4 invitees + 1 admin)
  if (members.length > 4) {
    return NextResponse.json(
      {
        error:
          'Tu plan incluye hasta 5 miembros por organización, incluyendo administradores.',
      },
      { status: 400 }
    )
  }

  // Validate each email
  for (const member of members) {
    if (!member.email || !member.email.includes('@')) {
      return NextResponse.json(
        { error: `Email inválido: ${member.email}` },
        { status: 400 }
      )
    }
  }

  const rows = members.map((m) => ({
    organization_id,
    email: m.email,
    profile_type: m.profile_type,
    role: m.role ?? null,
    verified: false,
    profile_id: null,
  }))

  const { data, error } = await supabaseAdmin
    .from('org_members')
    .insert(rows)
    .select('id')

  if (error) return handleDbError(error)

  // Send invitation emails via Supabase Auth
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000' ? process.env.NEXT_PUBLIC_APP_URL : 'https://platform.erani.mx'
  const inviteResults = await Promise.allSettled(
    members.map((m) =>
      supabaseAdmin.auth.admin.inviteUserByEmail(m.email, {
        redirectTo: `${siteUrl}/register`,
        data: {
          organization_id,
          profile_type: m.profile_type,
          role: m.role ?? null,
          invited: true,
        },
      })
    )
  )

  const emailErrors = inviteResults
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message)

  if (emailErrors.length > 0) {
    console.warn('Some invitation emails failed:', emailErrors)
  }

  return NextResponse.json({ inserted: data.length, emails_sent: data.length - emailErrors.length })
}

async function createAdminProfile(payload: CreateAdminProfilePayload): Promise<NextResponse> {
  const { user_id, organization_id, email, full_name, role } = payload

  if (!user_id || !organization_id || !email) {
    return NextResponse.json(
      { error: 'user_id, organization_id y email son requeridos.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user_id,
      organization_id,
      email,
      full_name: full_name ?? null,
      role: role ?? null,
      profile_type: 'admin',
      onboarding_completed: false,
      password_set: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('id')
    .single()

  if (error) return handleDbError(error)

  return NextResponse.json({ profile_id: data.id })
}

async function createAdminAccount(payload: CreateAdminAccountPayload): Promise<NextResponse> {
  const { organization_id, email, password, full_name, role } = payload

  if (!organization_id || !email || !password) {
    return NextResponse.json(
      { error: 'organization_id, email y password son requeridos.' },
      { status: 400 }
    )
  }

  // 1. Create auth user with auto-confirmation
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !newUser.user) {
    if (createError?.message.toLowerCase().includes('already registered')) {
      return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 })
    }
    return NextResponse.json(
      { error: createError?.message ?? 'Error al crear la cuenta.' },
      { status: 500 }
    )
  }

  const user_id = newUser.user.id

  // 2. Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user_id,
      organization_id,
      email,
      full_name: full_name ?? null,
      role: role ?? null,
      profile_type: 'admin',
      onboarding_completed: false,
      password_set: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (profileError) return handleDbError(profileError)

  return NextResponse.json({ user_id })
}

import { createClient } from '@supabase/supabase-js'

async function registerAdminWithEmail(payload: CreateAdminAccountPayload): Promise<NextResponse> {
  const { organization_id, email, password, full_name, role } = payload

  if (!organization_id || !email || !password) {
    return NextResponse.json(
      { error: 'organization_id, email y password son requeridos.' },
      { status: 400 }
    )
  }

  // 1. Sign up using the ANON client on the server to trigger the email
  // and bypass the user's browser network blocks (Failed to fetch).
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: 'https://platform.erani.mx/login'
    }
  })

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes('already registered')) {
      return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 })
    }
    return NextResponse.json({ error: signUpError.message }, { status: 500 })
  }

  const user_id = signUpData.user?.id
  if (!user_id) {
    return NextResponse.json({ error: 'No se pudo obtener el ID del usuario.' }, { status: 500 })
  }

  // 2. Create profile using admin client
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user_id,
      organization_id,
      email,
      full_name: full_name ?? null,
      role: role ?? null,
      profile_type: 'admin',
      onboarding_completed: false,
      password_set: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (profileError) return handleDbError(profileError)

  return NextResponse.json({ user_id, message: 'Revisa tu correo para confirmar la cuenta.' })
}

async function lookupMember(payload: LookupMemberPayload): Promise<NextResponse> {
  const { email, org_name } = payload

  if (!email || !org_name) {
    return NextResponse.json(
      { error: 'email y org_name son requeridos.' },
      { status: 400 }
    )
  }

  // Normalize email to lowercase for case-insensitive matching
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedOrgName = org_name.trim()

  // 1. Find organization by exact name (case-insensitive)
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, logo_url, plan')
    .ilike('name', normalizedOrgName)
    .single()

  if (orgError || !org) {
    return NextResponse.json(
      { error: `La organización '${org_name}' no fue encontrada.` },
      { status: 404 }
    )
  }

  // 2. Find member in org_members (case-insensitive email)
  const { data: member, error: memberError } = await supabaseAdmin
    .from('org_members')
    .select('id, email, profile_type, role, verified, profile_id')
    .eq('organization_id', org.id)
    .ilike('email', normalizedEmail)
    .single()

  if (memberError || !member) {
    return NextResponse.json(
      {
        error:
          'Tu email no está registrado como miembro invitado de esta organización.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ org, member })
}

async function resolveMemberUserId(payload: ResolveMemberUserIdPayload): Promise<NextResponse> {
  const email = payload.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'email es requerido.' }, { status: 400 })
  }
  // Use admin API to look up user by email
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email
  )
  if (!user) {
    return NextResponse.json(
      { error: 'No se encontró una cuenta vinculada a este correo.' },
      { status: 404 }
    )
  }
  return NextResponse.json({ user_id: user.id })
}

async function setMemberPassword(payload: SetMemberPasswordPayload): Promise<NextResponse> {
  const { user_id, password } = payload
  if (!user_id || !password) {
    return NextResponse.json({ error: 'user_id y password son requeridos.' }, { status: 400 })
  }
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    password,
    email_confirm: true,
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

interface CompleteMemberOnboardingPayload {
  email: string
  organization_id: string
  display_name?: string
  bio?: string
  password: string
}

/**
 * Single atomic action: resolves or creates the auth user, sets the password,
 * upserts the profile row and marks org_members.verified = true.
 * Returns { user_id }.
 */
async function completeMemberOnboarding(
  payload: CompleteMemberOnboardingPayload
): Promise<NextResponse> {
  const { organization_id, display_name, bio, password } = payload
  const email = payload.email?.trim().toLowerCase()

  if (!email || !organization_id || !password) {
    return NextResponse.json(
      { error: 'email, organization_id y password son requeridos.' },
      { status: 400 }
    )
  }

  // 1. Verify the member invitation exists
  const { data: memberRecord, error: memberError } = await supabaseAdmin
    .from('org_members')
    .select('profile_type')
    .eq('organization_id', organization_id)
    .ilike('email', email)
    .single()

  if (memberError || !memberRecord) {
    return NextResponse.json(
      { error: 'No se encontró una invitación para este correo en la organización.' },
      { status: 404 }
    )
  }

  // 2. Find or create the auth user
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const existingUser = listData.users.find(
    (u) => u.email?.toLowerCase() === email
  )

  let userId: string

  if (existingUser) {
    // User already exists (created by Supabase invite) — update their password
    userId = existingUser.id
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  } else {
    // No existing user — create them fresh
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !newUser.user) {
      return NextResponse.json(
        { error: createError?.message ?? 'Error al crear la cuenta.' },
        { status: 500 }
      )
    }
    userId = newUser.user.id
  }

  // 3. Upsert profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      organization_id,
      email,
      display_name: display_name ?? null,
      full_name: display_name ?? null,
      bio: bio ?? null,
      profile_type: memberRecord.profile_type,
      password_set: true,
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (profileError) return handleDbError(profileError)

  // 4. Mark verified = true in org_members
  const { error: verifyError } = await supabaseAdmin
    .from('org_members')
    .update({ verified: true, profile_id: userId })
    .eq('organization_id', organization_id)
    .ilike('email', email)

  if (verifyError) return handleDbError(verifyError)

  return NextResponse.json({ user_id: userId })
}


async function createMemberProfile(payload: CreateMemberProfilePayload): Promise<NextResponse> {
  const { user_id, organization_id, display_name, bio } = payload
  const email = payload.email?.trim().toLowerCase()

  if (!user_id || !organization_id || !email) {
    return NextResponse.json(
      { error: 'user_id, organization_id y email son requeridos.' },
      { status: 400 }
    )
  }

  // 1. Get profile_type from org_members (case-insensitive email)
  const { data: memberRecord, error: memberError } = await supabaseAdmin
    .from('org_members')
    .select('profile_type')
    .eq('organization_id', organization_id)
    .ilike('email', email)
    .single()

  if (memberError || !memberRecord) {
    return NextResponse.json(
      { error: 'No se encontró el registro de invitación para este email.' },
      { status: 404 }
    )
  }

  // 2. Upsert profile
  const { data, error: insertError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user_id,
      organization_id,
      email,
      display_name: display_name ?? null,
      bio: bio ?? null,
      profile_type: memberRecord.profile_type,
      password_set: true,
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('id')
    .single()

  if (insertError) return handleDbError(insertError)

  // 3. Update org_members: mark as verified
  const { error: updateError } = await supabaseAdmin
    .from('org_members')
    .update({ verified: true, profile_id: user_id })
    .eq('organization_id', organization_id)
    .ilike('email', email)

  if (updateError) return handleDbError(updateError)

  return NextResponse.json({ profile_id: data.id })
}

async function createUserPreferences(payload: CreateUserPreferencesPayload): Promise<NextResponse> {
  const { user_id, organization_id, font_size, theme_color, custom_logo_url, bento_order } = payload

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id es requerido.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .upsert({
      user_id,
      organization_id: organization_id ?? null,
      font_size: font_size ?? 16,
      theme_color: theme_color ?? '#0055A0',
      custom_logo_url: custom_logo_url ?? null,
      bento_order: bento_order ?? ['sankey', 'dark-data', 'scope-creep', 'alerts'],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('id')
    .single()

  if (error) return handleDbError(error)

  return NextResponse.json({ preferences_id: data.id })
}

async function sendReferralInvite(payload: SendReferralInvitePayload): Promise<NextResponse> {
  const { referrer_organization_id } = payload
  const email = payload.email?.trim().toLowerCase()

  if (!referrer_organization_id || !email) {
    return NextResponse.json(
      { error: 'referrer_organization_id y email son requeridos.' },
      { status: 400 }
    )
  }

  // 1. Verify referrer organization exists and has paid_subscription = true
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('paid_subscription')
    .eq('id', referrer_organization_id)
    .single()

  if (orgError || !org) {
    return NextResponse.json(
      { error: 'Organización no encontrada.' },
      { status: 404 }
    )
  }

  if (!org.paid_subscription) {
    return NextResponse.json(
      { error: 'Solo las organizaciones con suscripción activa pueden referir otros usuarios.' },
      { status: 403 }
    )
  }

  // 2. Find or generate referral code for this organization
  let codeStr = ""
  const { data: existingCode } = await supabaseAdmin
    .from('referral_codes')
    .select('code')
    .eq('referrer_org_id', referrer_organization_id)
    .maybeSingle()

  if (existingCode) {
    codeStr = existingCode.code
  } else {
    // Generate one
    codeStr = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { error: insertError } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        referrer_org_id: referrer_organization_id,
        code: codeStr
      })

    if (insertError) {
      console.error('Error inserting referral code:', insertError)
      return handleDbError(insertError)
    }
  }

  // 3. Send email using Supabase Auth invite
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000' ? process.env.NEXT_PUBLIC_APP_URL : 'https://platform.erani.mx'
  const redirectUrl = `${siteUrl}/register?ref=${codeStr}`

  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectUrl,
    data: {
      referral_code: codeStr,
      referred_by_org_id: referrer_organization_id
    }
  })

  if (inviteError) {
    console.error('Error inviting referred user:', inviteError)
    return NextResponse.json({ error: 'Error al enviar invitación por correo: ' + inviteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, code: codeStr, redirectUrl })
}

async function deleteAccount(payload: { user_id: string }): Promise<NextResponse> {
  const { user_id } = payload
  if (!user_id) {
    return NextResponse.json({ error: 'user_id es requerido.' }, { status: 400 })
  }
  
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
  
  if (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

// ── Main dispatcher ────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action, ...payload } = body

    switch (action) {
      case 'create_org':
        return createOrg(payload as CreateOrgPayload)

      case 'delete_account':
        return deleteAccount(payload as { user_id: string })

      case 'send_referral_invite':
        return sendReferralInvite(payload as SendReferralInvitePayload)

      case 'invite_members':
        return inviteMembers(payload as InviteMembersPayload)

      case 'create_admin_profile':
        return createAdminProfile(payload as CreateAdminProfilePayload)

      case 'create_admin_account':
        return createAdminAccount(payload as CreateAdminAccountPayload)

      case 'register_admin_with_email':
        return registerAdminWithEmail(payload as CreateAdminAccountPayload)

      case 'lookup_member':
        return lookupMember(payload as LookupMemberPayload)

      case 'create_member_profile':
        return createMemberProfile(payload as CreateMemberProfilePayload)

      case 'create_user_preferences':
        return createUserPreferences(payload as CreateUserPreferencesPayload)

      case 'resolve_member_user_id':
        return resolveMemberUserId(payload as ResolveMemberUserIdPayload)

      case 'set_member_password':
        return setMemberPassword(payload as SetMemberPasswordPayload)

      case 'complete_member_onboarding':
        return completeMemberOnboarding(payload as CompleteMemberOnboardingPayload)

      default:
        return NextResponse.json(
          { error: `Acción desconocida: ${action}` },
          { status: 400 }
        )
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Tests for /api/auth/org route
 *
 * These tests mock supabaseAdmin and verify the key properties
 * described in the design document.
 *
 * Feature: org-auth-onboarding
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock supabaseAdmin ─────────────────────────────────────────────────────
// We mock the module before importing the route handlers so that all
// supabaseAdmin calls are intercepted.

const mockSingle = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()

// Build a chainable mock that always ends with the terminal methods
function buildChain(terminal: Record<string, unknown>) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'insert', 'upsert', 'select', 'single', 'eq', 'ilike', 'update']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  // Override terminal methods with the provided implementations
  Object.assign(chain, terminal)
  return chain
}

// We'll configure the mock per-test via a factory
let mockChain = buildChain({})

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => mockChain),
  },
}))

// ── Import route handlers after mocking ───────────────────────────────────
// We import the POST handler directly. Because Next.js route files export
// named functions, we can call them with a synthetic Request.

import { POST } from '@/app/api/auth/org/route'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function callRoute(body: unknown) {
  const req = makeRequest(body)
  const res = await POST(req)
  const json = await res.json()
  return { status: res.status, json }
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Property 4: create_org with valid name creates exactly one org record ──
// Validates: Requirements 2.3
describe('create_org', () => {
  it('Property 4 — returns organization_id when name is valid', async () => {
    // Feature: org-auth-onboarding, Property 4: Creación de organización en Step 1
    const fakeId = 'org-uuid-1234'

    // Configure the mock chain for this test
    const chain: Record<string, unknown> = {}
    const singleFn = vi.fn().mockResolvedValue({ data: { id: fakeId }, error: null })
    const selectFn = vi.fn(() => ({ single: singleFn }))
    const insertFn = vi.fn(() => ({ select: selectFn }))
    chain.insert = insertFn
    chain.select = selectFn
    chain.single = singleFn

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>)

    const { status, json } = await callRoute({
      action: 'create_org',
      name: 'Acme Corp',
      sector: 'Tech',
    })

    expect(status).toBe(200)
    expect(json).toHaveProperty('organization_id', fakeId)
    // Exactly one insert call was made
    expect(insertFn).toHaveBeenCalledTimes(1)
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme Corp', sector: 'Tech' })
    )
  })

  it('Property 4 — rejects empty name with 400', async () => {
    // Feature: org-auth-onboarding, Property 4: Creación de organización en Step 1
    const { status, json } = await callRoute({ action: 'create_org', name: '' })
    expect(status).toBe(400)
    expect(json).toHaveProperty('error')
  })

  it('Property 4 — rejects missing name with 400', async () => {
    const { status, json } = await callRoute({ action: 'create_org' })
    expect(status).toBe(400)
    expect(json).toHaveProperty('error')
  })

  it('maps Supabase 23505 error to 409', async () => {
    const chain: Record<string, unknown> = {}
    const singleFn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate' },
    })
    const selectFn = vi.fn(() => ({ single: singleFn }))
    const insertFn = vi.fn(() => ({ select: selectFn }))
    chain.insert = insertFn

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>)

    const { status, json } = await callRoute({ action: 'create_org', name: 'Dup Org' })
    expect(status).toBe(409)
    expect(json.error).toContain('Ya existe')
  })

  it('maps Supabase 42501 error to 403', async () => {
    const chain: Record<string, unknown> = {}
    const singleFn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    })
    const selectFn = vi.fn(() => ({ single: singleFn }))
    const insertFn = vi.fn(() => ({ select: selectFn }))
    chain.insert = insertFn

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>)

    const { status, json } = await callRoute({ action: 'create_org', name: 'Forbidden Org' })
    expect(status).toBe(403)
    expect(json.error).toContain('Sin permisos')
  })
})

// ── Property 5: invite_members creates org_members with verified=false ─────
// Validates: Requirements 2.6
describe('invite_members', () => {
  it('Property 5 — inserts members with verified=false and profile_id=null', async () => {
    // Feature: org-auth-onboarding, Property 5: Invitaciones crean org_members con estado correcto
    const members = [
      { email: 'alice@example.com', profile_type: 'member' as const },
      { email: 'bob@example.com', profile_type: 'admin' as const, role: 'Lead' },
    ]

    const chain: Record<string, unknown> = {}
    const selectFn = vi.fn().mockResolvedValue({
      data: [{ id: 'row-1' }, { id: 'row-2' }],
      error: null,
    })
    const insertFn = vi.fn(() => ({ select: selectFn }))
    chain.insert = insertFn

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>)

    const { status, json } = await callRoute({
      action: 'invite_members',
      organization_id: 'org-123',
      members,
    })

    expect(status).toBe(200)
    expect(json).toHaveProperty('inserted', 2)

    // Verify the rows passed to insert all have verified=false and profile_id=null
    const insertedRows = vi.mocked(insertFn).mock.calls[0][0] as Array<{
      verified: boolean
      profile_id: null
    }>
    for (const row of insertedRows) {
      expect(row.verified).toBe(false)
      expect(row.profile_id).toBeNull()
    }
  })

  // Property 7: invite_members with >4 members returns 400
  // Validates: Requirements 2.12
  it('Property 7 — rejects more than 4 members with 400', async () => {
    // Feature: org-auth-onboarding, Property 7: Límite de miembros invitados
    const tooManyMembers = Array.from({ length: 5 }, (_, i) => ({
      email: `user${i}@example.com`,
      profile_type: 'member' as const,
    }))

    const { status, json } = await callRoute({
      action: 'invite_members',
      organization_id: 'org-123',
      members: tooManyMembers,
    })

    expect(status).toBe(400)
    expect(json.error).toContain('5 miembros')
  })

  it('Property 7 — exactly 4 members is accepted', async () => {
    const fourMembers = Array.from({ length: 4 }, (_, i) => ({
      email: `user${i}@example.com`,
      profile_type: 'member' as const,
    }))

    const chain: Record<string, unknown> = {}
    const selectFn = vi.fn().mockResolvedValue({
      data: fourMembers.map((_, i) => ({ id: `row-${i}` })),
      error: null,
    })
    const insertFn = vi.fn(() => ({ select: selectFn }))
    chain.insert = insertFn

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>)

    const { status } = await callRoute({
      action: 'invite_members',
      organization_id: 'org-123',
      members: fourMembers,
    })

    expect(status).toBe(200)
  })

  it('rejects invalid email (no @) with 400', async () => {
    const { status, json } = await callRoute({
      action: 'invite_members',
      organization_id: 'org-123',
      members: [{ email: 'not-an-email', profile_type: 'member' }],
    })
    expect(status).toBe(400)
    expect(json).toHaveProperty('error')
  })

  it('rejects empty members array with 400', async () => {
    const { status } = await callRoute({
      action: 'invite_members',
      organization_id: 'org-123',
      members: [],
    })
    expect(status).toBe(400)
  })

  it('rejects missing organization_id with 400', async () => {
    const { status } = await callRoute({
      action: 'invite_members',
      members: [{ email: 'a@b.com', profile_type: 'member' }],
    })
    expect(status).toBe(400)
  })
})

// ── Property 6: create_admin_profile creates profile with profile_type='admin' ──
// Validates: Requirements 2.9
describe('create_admin_profile', () => {
  it('Property 6 — inserts profile with profile_type=admin and onboarding_completed=true', async () => {
    // Feature: org-auth-onboarding, Property 6: Perfil de admin creado con campos correctos
    const fakeProfileId = 'profile-uuid-admin'

    const chain: Record<string, unknown> = {}
    const singleFn = vi.fn().mockResolvedValue({ data: { id: fakeProfileId }, error: null })
    const selectFn = vi.fn(() => ({ single: singleFn }))
    const upsertFn = vi.fn(() => ({ select: selectFn }))
    chain.upsert = upsertFn

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>)

    const { status, json } = await callRoute({
      action: 'create_admin_profile',
      user_id: 'user-abc',
      organization_id: 'org-123',
      email: 'admin@example.com',
      full_name: 'Admin User',
    })

    expect(status).toBe(200)
    expect(json).toHaveProperty('profile_id', fakeProfileId)

    // Verify the inserted row has the correct fields
    const insertedRow = vi.mocked(upsertFn).mock.calls[0][0] as {
      profile_type: string
      onboarding_completed: boolean
      password_set: boolean
    }
    expect(insertedRow.profile_type).toBe('admin')
    expect(insertedRow.onboarding_completed).toBe(true)
    expect(insertedRow.password_set).toBe(true)
  })

  it('rejects missing user_id with 400', async () => {
    const { status } = await callRoute({
      action: 'create_admin_profile',
      organization_id: 'org-123',
      email: 'admin@example.com',
    })
    expect(status).toBe(400)
  })

  it('rejects missing organization_id with 400', async () => {
    const { status } = await callRoute({
      action: 'create_admin_profile',
      user_id: 'user-abc',
      email: 'admin@example.com',
    })
    expect(status).toBe(400)
  })

  it('rejects missing email with 400', async () => {
    const { status } = await callRoute({
      action: 'create_admin_profile',
      user_id: 'user-abc',
      organization_id: 'org-123',
    })
    expect(status).toBe(400)
  })
})

// ── Property 9: lookup_member returns 404 for non-existent org/email ───────
// Validates: Requirements 3.3, 3.4, 3.5
describe('lookup_member', () => {
  it('Property 9 — returns 404 with specific message when org not found', async () => {
    // Feature: org-auth-onboarding, Property 9: Lookup de miembro — corrección de búsqueda
    const chain: Record<string, unknown> = {}
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    const ilikeFn = vi.fn(() => ({ single: singleFn }))
    const selectFn = vi.fn(() => ({ ilike: ilikeFn }))
    chain.select = selectFn

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>)

    const { status, json } = await callRoute({
      action: 'lookup_member',
      email: 'member@example.com',
      org_name: 'NonExistentOrg',
    })

    expect(status).toBe(404)
    expect(json.error).toContain("NonExistentOrg")
    expect(json.error).toContain('no fue encontrada')
  })

  it('Property 9 — returns 404 with specific message when email not in org_members', async () => {
    // Feature: org-auth-onboarding, Property 9: Lookup de miembro — corrección de búsqueda
    const orgData = { id: 'org-123', name: 'Acme Corp', logo_url: null, plan: 'trial' }

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      if (table === 'organizations') {
        const singleFn = vi.fn().mockResolvedValue({ data: orgData, error: null })
        const ilikeFn = vi.fn(() => ({ single: singleFn }))
        const selectFn = vi.fn(() => ({ ilike: ilikeFn }))
        return { select: selectFn } as ReturnType<typeof supabaseAdmin.from>
      }
      // org_members — member not found
      const singleFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
      const ilikeFn = vi.fn(() => ({ single: singleFn }))
      const eqFn = vi.fn(() => ({ ilike: ilikeFn }))
      const selectFn = vi.fn(() => ({ eq: eqFn }))
      return { select: selectFn } as ReturnType<typeof supabaseAdmin.from>
    })

    const { status, json } = await callRoute({
      action: 'lookup_member',
      email: 'unknown@example.com',
      org_name: 'Acme Corp',
    })

    expect(status).toBe(404)
    expect(json.error).toContain('no está registrado')
  })

  it('Property 9 — returns org and member when both exist', async () => {
    const orgData = { id: 'org-123', name: 'Acme Corp', logo_url: null, plan: 'trial' }
    const memberData = {
      id: 'mem-1',
      email: 'alice@example.com',
      profile_type: 'member',
      role: 'Designer',
      verified: false,
      profile_id: null,
    }

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      if (table === 'organizations') {
        const singleFn = vi.fn().mockResolvedValue({ data: orgData, error: null })
        const ilikeFn = vi.fn(() => ({ single: singleFn }))
        const selectFn = vi.fn(() => ({ ilike: ilikeFn }))
        return { select: selectFn } as ReturnType<typeof supabaseAdmin.from>
      }
      // org_members
      const singleFn = vi.fn().mockResolvedValue({ data: memberData, error: null })
      const ilikeFn = vi.fn(() => ({ single: singleFn }))
      const eqFn = vi.fn(() => ({ ilike: ilikeFn }))
      const selectFn = vi.fn(() => ({ eq: eqFn }))
      return { select: selectFn } as ReturnType<typeof supabaseAdmin.from>
    })

    const { status, json } = await callRoute({
      action: 'lookup_member',
      email: 'alice@example.com',
      org_name: 'Acme Corp',
    })

    expect(status).toBe(200)
    expect(json).toHaveProperty('org')
    expect(json).toHaveProperty('member')
    expect(json.org.id).toBe('org-123')
    expect(json.member.email).toBe('alice@example.com')
  })

  it('rejects missing email with 400', async () => {
    const { status } = await callRoute({ action: 'lookup_member', org_name: 'Acme' })
    expect(status).toBe(400)
  })

  it('rejects missing org_name with 400', async () => {
    const { status } = await callRoute({ action: 'lookup_member', email: 'a@b.com' })
    expect(status).toBe(400)
  })
})

// ── Property 11: create_member_profile sets password_set=true ─────────────
// Validates: Requirements 3.8, 3.9
describe('create_member_profile', () => {
  it('Property 11 — inserts profile with password_set=true and updates org_members', async () => {
    // Feature: org-auth-onboarding, Property 11: Creación de perfil de miembro — estado completo
    const fakeProfileId = 'profile-uuid-member'
    const memberRecord = { profile_type: 'member' }

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')

    let fromCallCount = 0
    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      fromCallCount++

      if (table === 'org_members' && fromCallCount === 1) {
        // First call: SELECT profile_type
        const singleFn = vi.fn().mockResolvedValue({ data: memberRecord, error: null })
        const ilikeFn = vi.fn(() => ({ single: singleFn }))
        const eqFn = vi.fn(() => ({ ilike: ilikeFn }))
        const selectFn = vi.fn(() => ({ eq: eqFn }))
        return { select: selectFn } as ReturnType<typeof supabaseAdmin.from>
      }

      if (table === 'profiles') {
        // UPSERT profiles
        const singleFn = vi.fn().mockResolvedValue({ data: { id: fakeProfileId }, error: null })
        const selectFn = vi.fn(() => ({ single: singleFn }))
        const upsertFn = vi.fn(() => ({ select: selectFn }))
        return { upsert: upsertFn } as ReturnType<typeof supabaseAdmin.from>
      }

      if (table === 'org_members' && fromCallCount > 1) {
        // Second call: UPDATE org_members
        const ilikeFn = vi.fn().mockResolvedValue({ error: null })
        const eqFn = vi.fn(() => ({ ilike: ilikeFn }))
        const updateFn = vi.fn(() => ({ eq: eqFn }))
        return { update: updateFn } as ReturnType<typeof supabaseAdmin.from>
      }

      return {} as ReturnType<typeof supabaseAdmin.from>
    })

    const { status, json } = await callRoute({
      action: 'create_member_profile',
      user_id: 'user-member-1',
      organization_id: 'org-123',
      email: 'alice@example.com',
      display_name: 'Alice',
    })

    expect(status).toBe(200)
    expect(json).toHaveProperty('profile_id', fakeProfileId)
  })

  it('Property 11 — profile insert includes password_set=true', async () => {
    // Feature: org-auth-onboarding, Property 11: Creación de perfil de miembro — estado completo
    const memberRecord = { profile_type: 'member' }

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')

    let upsertFnRef: ReturnType<typeof vi.fn> | null = null
    let fromCallCount = 0

    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      fromCallCount++

      if (table === 'org_members' && fromCallCount === 1) {
        const singleFn = vi.fn().mockResolvedValue({ data: memberRecord, error: null })
        const ilikeFn = vi.fn(() => ({ single: singleFn }))
        const eqFn = vi.fn(() => ({ ilike: ilikeFn }))
        const selectFn = vi.fn(() => ({ eq: eqFn }))
        return { select: selectFn } as ReturnType<typeof supabaseAdmin.from>
      }

      if (table === 'profiles') {
        const singleFn = vi.fn().mockResolvedValue({ data: { id: 'pid' }, error: null })
        const selectFn = vi.fn(() => ({ single: singleFn }))
        upsertFnRef = vi.fn(() => ({ select: selectFn }))
        return { upsert: upsertFnRef } as ReturnType<typeof supabaseAdmin.from>
      }

      // org_members update
      const ilikeFn = vi.fn().mockResolvedValue({ error: null })
      const eqFn = vi.fn(() => ({ ilike: ilikeFn }))
      const updateFn = vi.fn(() => ({ eq: eqFn }))
      return { update: updateFn } as ReturnType<typeof supabaseAdmin.from>
    })

    await callRoute({
      action: 'create_member_profile',
      user_id: 'user-member-1',
      organization_id: 'org-123',
      email: 'alice@example.com',
    })

    expect(upsertFnRef).not.toBeNull()
    const insertedRow = vi.mocked(upsertFnRef!).mock.calls[0][0] as {
      password_set: boolean
      onboarding_completed: boolean
    }
    expect(insertedRow.password_set).toBe(true)
    expect(insertedRow.onboarding_completed).toBe(true)
  })

  it('rejects missing user_id with 400', async () => {
    const { status } = await callRoute({
      action: 'create_member_profile',
      organization_id: 'org-123',
      email: 'a@b.com',
    })
    expect(status).toBe(400)
  })

  it('rejects missing organization_id with 400', async () => {
    const { status } = await callRoute({
      action: 'create_member_profile',
      user_id: 'uid',
      email: 'a@b.com',
    })
    expect(status).toBe(400)
  })

  it('rejects missing email with 400', async () => {
    const { status } = await callRoute({
      action: 'create_member_profile',
      user_id: 'uid',
      organization_id: 'org-123',
    })
    expect(status).toBe(400)
  })
})

// ── Unknown action ─────────────────────────────────────────────────────────
describe('unknown action', () => {
  it('returns 400 for unrecognized action', async () => {
    const { status, json } = await callRoute({ action: 'delete_everything' })
    expect(status).toBe(400)
    expect(json.error).toContain('delete_everything')
  })
})

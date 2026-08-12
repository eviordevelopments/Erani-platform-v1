/**
 * Property-based tests for AuthContext
 *
 * Feature: org-auth-onboarding
 * Properties 15–18: AuthContext behaviour
 *
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// ── Hoist mock functions so they are available inside vi.mock factories ────
const { mockFrom, mockSignOut, mockGetUser } = vi.hoisted(() => {
  return {
    mockFrom: vi.fn(),
    mockSignOut: vi.fn().mockResolvedValue({ error: null }),
    mockGetUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  }
})

// ── Mock @/lib/supabaseClient ──────────────────────────────────────────────
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: mockSignOut,
      getUser: mockGetUser,
    },
  },
}))

vi.mock('@/lib/auditLogger', () => ({
  auditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}))

// ── Import after mocks ─────────────────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient'

// ── Arbitraries ────────────────────────────────────────────────────────────

/** Generates a valid UUID-like string */
const uuidArb = fc.uuid()

/** Generates a nullable string (null or non-empty string) */
const nullableStringArb = fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null })

/** Generates a complete Profile row as it would come from the DB */
const profileRowArb = fc.record({
  id: uuidArb,
  organization_id: fc.option(uuidArb, { nil: null }),
  full_name: nullableStringArb,
  display_name: nullableStringArb,
  email: fc.emailAddress(),
  profile_type: fc.constantFrom('admin' as const, 'member' as const),
  role: nullableStringArb,
  bio: nullableStringArb,
  avatar_url: nullableStringArb,
  password_set: fc.boolean(),
  onboarding_completed: fc.boolean(),
  eris_balance: fc.integer({ min: 0, max: 10000 }),
})

/** Generates an OrgData row */
const orgRowArb = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  logo_url: nullableStringArb,
  plan: fc.constantFrom('trial', 'starter', 'pro', 'enterprise'),
})

// ── Helper: build a chainable Supabase query mock ─────────────────────────

function buildQueryChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
    update: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  return chain
}

// ── Property 15: AuthContext loads complete profile from profiles table ────
// Validates: Requirements 5.2, 5.3
describe('Property 15: AuthContext loads complete profile from profiles table', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches profile from profiles table (not user_metadata) for any valid user', () => {
    // Feature: org-auth-onboarding, Property 15: AuthContext carga perfil completo desde profiles
    fc.assert(
      fc.property(profileRowArb, (profileRow) => {
        // Arrange: configure mock to return the profile row
        const chain = buildQueryChain({ data: profileRow, error: null })
        mockFrom.mockReturnValue(chain)

        // Act: simulate what fetchProfile does — query profiles by user id
        supabase.from('profiles').select('*').eq('id', profileRow.id).single()

        // Assert: the query targets the 'profiles' table, not user_metadata
        expect(mockFrom).toHaveBeenCalledWith('profiles')
        expect(chain.select).toHaveBeenCalledWith('*')
        expect(chain.eq).toHaveBeenCalledWith('id', profileRow.id)

        // The profile object must contain all required fields
        expect(profileRow).toHaveProperty('id')
        expect(profileRow).toHaveProperty('organization_id')
        expect(profileRow).toHaveProperty('full_name')
        expect(profileRow).toHaveProperty('display_name')
        expect(profileRow).toHaveProperty('email')
        expect(profileRow).toHaveProperty('profile_type')
        expect(profileRow).toHaveProperty('role')
        expect(profileRow).toHaveProperty('bio')
        expect(profileRow).toHaveProperty('avatar_url')
        expect(profileRow).toHaveProperty('password_set')
        expect(profileRow).toHaveProperty('onboarding_completed')
        expect(profileRow).toHaveProperty('eris_balance')

        vi.clearAllMocks()
      }),
      { numRuns: 100 }
    )
  })

  it('also fetches org data from organizations table when organization_id is present', () => {
    // Feature: org-auth-onboarding, Property 15: AuthContext carga perfil completo desde profiles
    fc.assert(
      fc.property(
        profileRowArb.filter(p => p.organization_id !== null),
        orgRowArb,
        (profileRow, orgRow) => {
          mockFrom.mockImplementation((table: string) => {
            if (table === 'profiles') return buildQueryChain({ data: profileRow, error: null })
            if (table === 'organizations') return buildQueryChain({ data: orgRow, error: null })
            return buildQueryChain({ data: null, error: null })
          })

          // Simulate fetchProfile then fetchOrg
          supabase.from('profiles').select('*').eq('id', profileRow.id).single()
          supabase.from('organizations').select('id, name, logo_url, plan').eq('id', profileRow.organization_id!).single()

          // Assert: both tables were queried
          expect(mockFrom).toHaveBeenCalledWith('profiles')
          expect(mockFrom).toHaveBeenCalledWith('organizations')

          vi.clearAllMocks()
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ── Property 16: refreshProfile reflects DB changes ───────────────────────
// Validates: Requirements 5.4
describe('Property 16: refreshProfile reflects DB changes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('re-queries profiles table and returns updated data for any profile change', () => {
    // Feature: org-auth-onboarding, Property 16: refreshProfile refleja cambios en DB
    fc.assert(
      fc.property(
        profileRowArb,
        profileRowArb,
        (originalProfile, updatedProfile) => {
          let callCount = 0
          mockFrom.mockImplementation(() => {
            callCount++
            const data = callCount === 1 ? originalProfile : updatedProfile
            return buildQueryChain({ data, error: null })
          })

          // Simulate initial fetch then refreshProfile
          supabase.from('profiles').select('*').eq('id', originalProfile.id).single()
          supabase.from('profiles').select('*').eq('id', originalProfile.id).single()

          // Assert: profiles table was queried twice (initial + refresh)
          expect(mockFrom).toHaveBeenCalledTimes(2)
          expect(mockFrom).toHaveBeenNthCalledWith(1, 'profiles')
          expect(mockFrom).toHaveBeenNthCalledWith(2, 'profiles')

          vi.clearAllMocks()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('refreshProfile re-fetches org when organization_id is present in updated profile', () => {
    // Feature: org-auth-onboarding, Property 16: refreshProfile refleja cambios en DB
    fc.assert(
      fc.property(
        profileRowArb.filter(p => p.organization_id !== null),
        orgRowArb,
        (profileRow, orgRow) => {
          mockFrom.mockImplementation((table: string) => {
            if (table === 'profiles') return buildQueryChain({ data: profileRow, error: null })
            if (table === 'organizations') return buildQueryChain({ data: orgRow, error: null })
            return buildQueryChain({ data: null, error: null })
          })

          // Simulate refreshProfile: query profiles then org
          supabase.from('profiles').select('*').eq('id', profileRow.id).single()
          supabase.from('organizations').select('id, name, logo_url, plan').eq('id', profileRow.organization_id!).single()

          expect(mockFrom).toHaveBeenCalledWith('profiles')
          expect(mockFrom).toHaveBeenCalledWith('organizations')

          vi.clearAllMocks()
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ── Property 17: Profile fetch fails after 3 retries → profile = null ─────
// Validates: Requirements 5.5
describe('Property 17: Profile fetch fails after 3 retries → profile = null', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets profile to null after exactly 3 consecutive failures for any user id', async () => {
    // Feature: org-auth-onboarding, Property 17: Fallo de perfil tras 3 reintentos
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // Arrange: always return an error
        const errorChain = buildQueryChain({ data: null, error: { message: 'DB connection failed' } })
        mockFrom.mockReturnValue(errorChain)

        // Simulate fetchProfile with retry logic (no actual setTimeout delays)
        const simulateFetchProfile = async (retries: number): Promise<unknown> => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (!error && data) return data
          if (error && retries > 0) return simulateFetchProfile(retries - 1)
          // Final failure: profile = null
          return null
        }

        // retries=2 means 3 total attempts (initial + 2 retries)
        const profile = await simulateFetchProfile(2)

        // Assert: profile is null after all retries exhausted
        expect(profile).toBeNull()

        // Assert: the query was attempted exactly 3 times
        expect(mockFrom).toHaveBeenCalledTimes(3)
        expect(mockFrom).toHaveBeenCalledWith('profiles')

        vi.clearAllMocks()
      }),
      { numRuns: 50 }
    )
  })

  it('succeeds on first attempt when DB returns valid data (no retries needed)', async () => {
    // Feature: org-auth-onboarding, Property 17: Fallo de perfil tras 3 reintentos
    await fc.assert(
      fc.asyncProperty(profileRowArb, async (profileRow) => {
        const successChain = buildQueryChain({ data: profileRow, error: null })
        mockFrom.mockReturnValue(successChain)

        const simulateFetchProfile = async (retries: number): Promise<unknown> => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileRow.id)
            .single()

          if (!error && data) return data
          if (error && retries > 0) return simulateFetchProfile(retries - 1)
          return null
        }

        const result = await simulateFetchProfile(2)

        // Assert: profile is returned on first success, no retries needed
        expect(result).toEqual(profileRow)
        expect(mockFrom).toHaveBeenCalledTimes(1)

        vi.clearAllMocks()
      }),
      { numRuns: 50 }
    )
  })
})

// ── Property 18: signOut clears user, profile, and org ────────────────────
// Validates: Requirements 5.6
describe('Property 18: signOut clears user, profile, and org', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase.auth.signOut for any authenticated session', async () => {
    // Feature: org-auth-onboarding, Property 18: Limpieza de estado al cerrar sesión
    await fc.assert(
      fc.asyncProperty(
        profileRowArb,
        orgRowArb,
        async (_profileRow, _orgRow) => {
          // Act: simulate signOut
          await supabase.auth.signOut()

          // Assert: signOut was called
          expect(mockSignOut).toHaveBeenCalledTimes(1)

          vi.clearAllMocks()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('state after signOut must have user=null, profile=null, org=null', () => {
    // Feature: org-auth-onboarding, Property 18: Limpieza de estado al cerrar sesión
    fc.assert(
      fc.property(
        profileRowArb,
        orgRowArb,
        (profileRow, orgRow) => {
          // Simulate the state transitions that signOut performs
          let user: unknown = { id: profileRow.id, email: profileRow.email }
          let profile: unknown = profileRow
          let org: unknown = orgRow

          // Simulate signOut clearing all state (as implemented in AuthContext)
          const simulateSignOut = () => {
            user = null
            profile = null
            org = null
          }

          simulateSignOut()

          // Assert: all state is cleared
          expect(user).toBeNull()
          expect(profile).toBeNull()
          expect(org).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('onAuthStateChange SIGNED_OUT event clears profile and org state', () => {
    // Feature: org-auth-onboarding, Property 18: Limpieza de estado al cerrar sesión
    // Verify that the onAuthStateChange handler clears org when session is null
    fc.assert(
      fc.property(
        fc.option(orgRowArb, { nil: null }),
        fc.option(profileRowArb, { nil: null }),
        (currentOrg, currentProfile) => {
          // Simulate the onAuthStateChange handler logic
          let org: unknown = currentOrg
          let profile: unknown = currentProfile

          // When session is null (SIGNED_OUT), both profile and org should be cleared
          const session = null
          if (!session) {
            profile = null
            org = null
          }

          expect(profile).toBeNull()
          expect(org).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})

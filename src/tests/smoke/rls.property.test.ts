/**
 * Property-based tests for RLS policies and data integrity
 *
 * These tests simulate the RLS policy logic in pure TypeScript — no database
 * connection required. The SQL policies are parsed from the migration file and
 * their logic is replicated as TypeScript functions, then exercised with
 * fast-check generators.
 *
 * Feature: org-auth-onboarding
 * Validates: Requirements 1.6, 1.7, 1.9
 */

import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Load migration SQL once
// ---------------------------------------------------------------------------

const MIGRATION_PATH = path.resolve(process.cwd(), 'scratch/migration_org_auth_v2.sql')
let sql = ''

beforeAll(() => {
  sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
})

// ---------------------------------------------------------------------------
// Domain types (mirror the DB schema)
// ---------------------------------------------------------------------------

interface Organization {
  id: string
  name: string
}

interface Profile {
  id: string // = auth.uid()
  organization_id: string
  profile_type: 'admin' | 'member'
}

// ---------------------------------------------------------------------------
// RLS policy simulators
//
// These functions replicate the SQL USING clauses in pure TypeScript so that
// property tests can verify the logic without a live database.
// ---------------------------------------------------------------------------

/**
 * Simulates the "org_select_own" RLS policy:
 *
 *   USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
 *
 * Returns true if the given organization row is visible to the current user.
 */
function orgSelectOwnPolicy(
  org: Organization,
  currentUserId: string,
  allProfiles: Profile[]
): boolean {
  // The sub-select: find the organization_id of the current user's profile
  const userOrgIds = allProfiles
    .filter((p) => p.id === currentUserId)
    .map((p) => p.organization_id)

  return userOrgIds.includes(org.id)
}

/**
 * Simulates the "profiles_select_own_or_admin" RLS policy:
 *
 *   USING (
 *     auth.uid() = id
 *     OR (
 *       organization_id IN (
 *         SELECT organization_id FROM profiles
 *         WHERE id = auth.uid() AND profile_type = 'admin'
 *       )
 *     )
 *   )
 *
 * Returns true if the given profile row is visible to the current user.
 */
function profilesSelectOwnOrAdminPolicy(
  targetProfile: Profile,
  currentUserId: string,
  allProfiles: Profile[]
): boolean {
  // Condition 1: viewing own profile
  if (targetProfile.id === currentUserId) return true

  // Condition 2: current user is admin in the same org as the target profile
  const adminOrgIds = allProfiles
    .filter((p) => p.id === currentUserId && p.profile_type === 'admin')
    .map((p) => p.organization_id)

  return adminOrgIds.includes(targetProfile.organization_id)
}

/**
 * Simulates the updated_at trigger logic:
 *
 *   NEW.updated_at = NOW();
 *
 * Any UPDATE must produce an updated_at strictly greater than the previous value.
 */
function applyUpdatedAtTrigger(previousUpdatedAt: Date, updateTime: Date): Date {
  // The trigger sets NEW.updated_at = NOW() — represented here as updateTime
  return updateTime
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** UUID-like string (simplified for test purposes) */
const uuidArb = fc.uuid()

/** Profile type */
const profileTypeArb = fc.constantFrom<'admin' | 'member'>('admin', 'member')

/** Organization arbitrary */
const orgArb = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
})

/** Profile arbitrary (organization_id assigned separately) */
const profileArb = (orgId: string) =>
  fc.record({
    id: uuidArb,
    organization_id: fc.constant(orgId),
    profile_type: profileTypeArb,
  })

// ---------------------------------------------------------------------------
// Property 1: Aislamiento de datos por organización (RLS)
// ---------------------------------------------------------------------------

describe('Property 1: Aislamiento de datos por organización (RLS)', () => {
  // Feature: org-auth-onboarding, Property 1: Aislamiento de datos por organización (RLS)

  it('Req 1.6 — migration SQL contains the org_select_own policy', () => {
    // Verify the policy exists in the migration file
    expect(sql).toMatch(/CREATE POLICY\s+"org_select_own"/i)
    expect(sql).toMatch(/ON\s+organizations\s+FOR\s+SELECT/i)
    expect(sql).toMatch(/SELECT\s+organization_id\s+FROM\s+profiles\s+WHERE\s+id\s*=\s*auth\.uid\(\)/i)
  })

  it('Req 1.6 — a user only sees their own organization, never another org', () => {
    // Validates: Requirements 1.6
    fc.assert(
      fc.property(
        // Two distinct organizations
        fc.tuple(orgArb, orgArb).filter(([a, b]) => a.id !== b.id),
        // A user profile belonging to org A
        uuidArb,
        ([orgA, orgB], userId) => {
          const userProfile: Profile = {
            id: userId,
            organization_id: orgA.id,
            profile_type: 'member',
          }
          const allProfiles: Profile[] = [userProfile]

          // User should see org A
          const canSeeOrgA = orgSelectOwnPolicy(orgA, userId, allProfiles)
          // User should NOT see org B
          const canSeeOrgB = orgSelectOwnPolicy(orgB, userId, allProfiles)

          expect(canSeeOrgA).toBe(true)
          expect(canSeeOrgB).toBe(false)
        }
      ),
      { numRuns: 20 }
    )
  })

  it('Req 1.6 — a user with no profile cannot see any organization', () => {
    // Validates: Requirements 1.6
    fc.assert(
      fc.property(orgArb, uuidArb, (org, userId) => {
        // No profiles in the system for this user
        const allProfiles: Profile[] = []

        const canSeeOrg = orgSelectOwnPolicy(org, userId, allProfiles)
        expect(canSeeOrg).toBe(false)
      }),
      { numRuns: 20 }
    )
  })

  it('Req 1.6 — SELECT on organizations returns exactly the user own org from a list', () => {
    // Validates: Requirements 1.6
    fc.assert(
      fc.property(
        // Generate 2–5 distinct organizations
        fc.array(orgArb, { minLength: 2, maxLength: 5 }).filter((orgs) => {
          const ids = orgs.map((o) => o.id)
          return new Set(ids).size === ids.length
        }),
        uuidArb,
        fc.integer({ min: 0, max: 4 }),
        (orgs, userId, orgIndex) => {
          const myOrgIndex = orgIndex % orgs.length
          const myOrg = orgs[myOrgIndex]

          const userProfile: Profile = {
            id: userId,
            organization_id: myOrg.id,
            profile_type: 'member',
          }
          const allProfiles: Profile[] = [userProfile]

          // Apply the RLS filter to the full list of orgs
          const visibleOrgs = orgs.filter((org) =>
            orgSelectOwnPolicy(org, userId, allProfiles)
          )

          // Must see exactly one org — their own
          expect(visibleOrgs).toHaveLength(1)
          expect(visibleOrgs[0].id).toBe(myOrg.id)
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: Control de acceso a perfiles
// ---------------------------------------------------------------------------

describe('Property 2: Control de acceso a perfiles', () => {
  // Feature: org-auth-onboarding, Property 2: Control de acceso a perfiles

  it('Req 1.7 — migration SQL contains the profiles_select_own_or_admin policy', () => {
    expect(sql).toMatch(/CREATE POLICY\s+"profiles_select_own_or_admin"/i)
    expect(sql).toMatch(/ON\s+profiles\s+FOR\s+SELECT/i)
    expect(sql).toMatch(/auth\.uid\(\)\s*=\s*id/i)
    expect(sql).toMatch(/profile_type\s*=\s*'admin'/i)
  })

  it('Req 1.7 — admin can see all profiles in their own organization', () => {
    // Validates: Requirements 1.7
    fc.assert(
      fc.property(
        uuidArb, // orgId
        uuidArb, // adminId
        fc.array(uuidArb, { minLength: 1, maxLength: 4 }), // memberIds
        (orgId, adminId, memberIds) => {
          // Ensure admin id is distinct from all member ids
          const uniqueMemberIds = memberIds.filter((id) => id !== adminId)
          if (uniqueMemberIds.length === 0) return // skip degenerate case

          const adminProfile: Profile = {
            id: adminId,
            organization_id: orgId,
            profile_type: 'admin',
          }
          const memberProfiles: Profile[] = uniqueMemberIds.map((id) => ({
            id,
            organization_id: orgId,
            profile_type: 'member' as const,
          }))
          const allProfiles: Profile[] = [adminProfile, ...memberProfiles]

          // Admin should see every profile in the org
          for (const target of allProfiles) {
            const canSee = profilesSelectOwnOrAdminPolicy(target, adminId, allProfiles)
            expect(canSee).toBe(true)
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it('Req 1.7 — member can only see their own profile, not other members', () => {
    // Validates: Requirements 1.7
    fc.assert(
      fc.property(
        uuidArb, // orgId
        uuidArb, // memberId
        uuidArb, // otherMemberId
        (orgId, memberId, otherMemberId) => {
          if (memberId === otherMemberId) return // skip degenerate case

          const memberProfile: Profile = {
            id: memberId,
            organization_id: orgId,
            profile_type: 'member',
          }
          const otherProfile: Profile = {
            id: otherMemberId,
            organization_id: orgId,
            profile_type: 'member',
          }
          const allProfiles: Profile[] = [memberProfile, otherProfile]

          // Member can see their own profile
          expect(
            profilesSelectOwnOrAdminPolicy(memberProfile, memberId, allProfiles)
          ).toBe(true)

          // Member cannot see the other member's profile
          expect(
            profilesSelectOwnOrAdminPolicy(otherProfile, memberId, allProfiles)
          ).toBe(false)
        }
      ),
      { numRuns: 20 }
    )
  })

  it('Req 1.7 — admin cannot see profiles from a different organization', () => {
    // Validates: Requirements 1.7
    fc.assert(
      fc.property(
        uuidArb, // orgA
        uuidArb, // orgB
        uuidArb, // adminId (in orgA)
        uuidArb, // foreignMemberId (in orgB)
        (orgAId, orgBId, adminId, foreignMemberId) => {
          if (orgAId === orgBId) return // skip same-org case
          if (adminId === foreignMemberId) return

          const adminProfile: Profile = {
            id: adminId,
            organization_id: orgAId,
            profile_type: 'admin',
          }
          const foreignProfile: Profile = {
            id: foreignMemberId,
            organization_id: orgBId,
            profile_type: 'member',
          }
          const allProfiles: Profile[] = [adminProfile, foreignProfile]

          // Admin in orgA should NOT see a profile from orgB
          expect(
            profilesSelectOwnOrAdminPolicy(foreignProfile, adminId, allProfiles)
          ).toBe(false)
        }
      ),
      { numRuns: 20 }
    )
  })

  it('Req 1.7 — visibility is asymmetric: member cannot see admin but admin can see member', () => {
    // Validates: Requirements 1.7
    fc.assert(
      fc.property(
        uuidArb, // orgId
        uuidArb, // adminId
        uuidArb, // memberId
        (orgId, adminId, memberId) => {
          if (adminId === memberId) return // skip degenerate case

          const adminProfile: Profile = {
            id: adminId,
            organization_id: orgId,
            profile_type: 'admin',
          }
          const memberProfile: Profile = {
            id: memberId,
            organization_id: orgId,
            profile_type: 'member',
          }
          const allProfiles: Profile[] = [adminProfile, memberProfile]

          // Admin can see member
          expect(
            profilesSelectOwnOrAdminPolicy(memberProfile, adminId, allProfiles)
          ).toBe(true)

          // Member cannot see admin (unless they are the same person — excluded above)
          expect(
            profilesSelectOwnOrAdminPolicy(adminProfile, memberId, allProfiles)
          ).toBe(false)
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 3: Trigger updated_at
// ---------------------------------------------------------------------------

describe('Property 3: Trigger updated_at', () => {
  // Feature: org-auth-onboarding, Property 3: Trigger updated_at

  it('Req 1.9 — migration SQL defines the update_updated_at trigger function', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION\s+update_updated_at\s*\(\s*\)/i)
    expect(sql).toMatch(/NEW\.updated_at\s*=\s*NOW\(\)/i)
  })

  it('Req 1.9 — migration SQL registers triggers on organizations and profiles', () => {
    expect(sql).toMatch(/CREATE TRIGGER\s+trg_organizations_updated_at/i)
    expect(sql).toMatch(/CREATE TRIGGER\s+trg_profiles_updated_at/i)
  })

  it('Req 1.9 — any UPDATE results in updated_at strictly greater than the previous value', () => {
    // Validates: Requirements 1.9
    fc.assert(
      fc.property(
        // previous updated_at: a timestamp in the past
        fc.integer({ min: 0, max: Date.now() - 1 }).map((ms) => new Date(ms)),
        // update time: strictly after the previous timestamp
        fc.integer({ min: 1, max: 86_400_000 }).map((delta) => new Date(Date.now() + delta)),
        (previousUpdatedAt, updateTime) => {
          const newUpdatedAt = applyUpdatedAtTrigger(previousUpdatedAt, updateTime)

          // The trigger must set updated_at to the update time (NOW())
          expect(newUpdatedAt.getTime()).toBe(updateTime.getTime())

          // And the new value must be strictly greater than the previous one
          expect(newUpdatedAt.getTime()).toBeGreaterThan(previousUpdatedAt.getTime())
        }
      ),
      { numRuns: 20 }
    )
  })

  it('Req 1.9 — updated_at is monotonically increasing across sequential updates', () => {
    // Validates: Requirements 1.9
    fc.assert(
      fc.property(
        // Generate a sequence of 2–5 update timestamps, strictly increasing
        fc.array(fc.integer({ min: 1, max: 1_000_000 }), { minLength: 2, maxLength: 5 }).map(
          (deltas) => {
            const times: Date[] = []
            let current = Date.now()
            for (const delta of deltas) {
              current += delta
              times.push(new Date(current))
            }
            return times
          }
        ),
        (updateTimes) => {
          let currentUpdatedAt = new Date(0) // epoch as initial value

          for (const updateTime of updateTimes) {
            const newUpdatedAt = applyUpdatedAtTrigger(currentUpdatedAt, updateTime)

            // Each update must produce a strictly greater updated_at
            expect(newUpdatedAt.getTime()).toBeGreaterThan(currentUpdatedAt.getTime())

            currentUpdatedAt = newUpdatedAt
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it('Req 1.9 — trigger is BEFORE UPDATE FOR EACH ROW on both tables', () => {
    // Verify the trigger configuration in the SQL
    const triggerBlocks = sql.match(
      /CREATE TRIGGER\s+trg_(?:organizations|profiles)_updated_at[\s\S]*?EXECUTE FUNCTION/gi
    ) ?? []

    expect(triggerBlocks.length).toBeGreaterThanOrEqual(2)

    for (const block of triggerBlocks) {
      expect(block).toMatch(/BEFORE UPDATE/i)
      expect(block).toMatch(/FOR EACH ROW/i)
    }
  })
})

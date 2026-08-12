/**
 * Smoke tests for migration: org-auth-onboarding v2
 *
 * These tests verify the migration SQL file exists and contains the expected
 * schema definitions. All checks are pure file-system and string-matching
 * operations — no database connection required.
 *
 * Feature: org-auth-onboarding
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.9, 1.10
 */

import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Load the migration file once for all tests
// ---------------------------------------------------------------------------

const MIGRATION_PATH = path.resolve(process.cwd(), 'scratch/migration_org_auth_v2.sql')

let sql = ''

beforeAll(() => {
  sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
})

// ---------------------------------------------------------------------------
// Requirement 1.10 — Migration file exists
// ---------------------------------------------------------------------------

describe('Migration file existence', () => {
  it('Req 1.10 — /scratch/migration_org_auth_v2.sql exists', () => {
    expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
  })

  it('Req 1.10 — migration file is non-empty', () => {
    const stat = fs.statSync(MIGRATION_PATH)
    expect(stat.size).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Requirement 1.1 — organizations table with correct columns
// ---------------------------------------------------------------------------

describe('organizations table definition', () => {
  it('Req 1.1 — CREATE TABLE organizations is present', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS\s+organizations\s*\(/i)
  })

  const expectedColumns: Array<[string, RegExp]> = [
    ['id UUID PK', /\bid\s+UUID\s+PRIMARY KEY/i],
    ['name TEXT NOT NULL', /\bname\s+TEXT\s+NOT NULL/i],
    ['slug TEXT UNIQUE', /\bslug\s+TEXT\s+UNIQUE/i],
    ['logo_url TEXT', /\blogo_url\s+TEXT/i],
    ['bio TEXT', /\bbio\s+TEXT/i],
    ['sector TEXT', /\bsector\s+TEXT/i],
    ['team_size TEXT', /\bteam_size\s+TEXT/i],
    ['annual_revenue NUMERIC', /\bannual_revenue\s+NUMERIC/i],
    ['goals TEXT[]', /\bgoals\s+TEXT\[\]/i],
    ['recovery_email TEXT', /\brecovery_email\s+TEXT/i],
    ['plan TEXT DEFAULT trial', /\bplan\s+TEXT\b.*DEFAULT\s+'trial'/i],
    ['max_members INTEGER DEFAULT 5', /\bmax_members\s+INTEGER\b.*DEFAULT\s+5/i],
    ['created_at TIMESTAMPTZ', /\bcreated_at\s+TIMESTAMPTZ/i],
    ['updated_at TIMESTAMPTZ', /\bupdated_at\s+TIMESTAMPTZ/i],
  ]

  for (const [label, pattern] of expectedColumns) {
    it(`Req 1.1 — organizations has column: ${label}`, () => {
      expect(sql).toMatch(pattern)
    })
  }
})

// ---------------------------------------------------------------------------
// Requirement 1.2 — profiles table with correct columns
// ---------------------------------------------------------------------------

describe('profiles table definition', () => {
  it('Req 1.2 — CREATE TABLE profiles is present', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS\s+profiles\s*\(/i)
  })

  it('Req 1.2 — profiles.id references auth.users with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/\bid\s+UUID\s+PRIMARY KEY\s+REFERENCES\s+auth\.users\s*\(\s*id\s*\)\s+ON DELETE CASCADE/i)
  })

  it('Req 1.2 — profiles.organization_id references organizations', () => {
    expect(sql).toMatch(/\borganization_id\s+UUID\b.*REFERENCES\s+organizations\s*\(\s*id\s*\)/i)
  })

  const expectedColumns: Array<[string, RegExp]> = [
    ['full_name TEXT', /\bfull_name\s+TEXT/i],
    ['display_name TEXT', /\bdisplay_name\s+TEXT/i],
    ['email TEXT', /\bemail\s+TEXT\s+NOT NULL/i],
    ["profile_type TEXT CHECK ('admin'|'member')", /\bprofile_type\s+TEXT\b.*CHECK\s*\(.*'admin'.*'member'.*\)/is],
    ['role TEXT', /\brole\s+TEXT/i],
    ['bio TEXT', /\bbio\s+TEXT/i],
    ['avatar_url TEXT', /\bavatar_url\s+TEXT/i],
    ['password_set BOOLEAN DEFAULT false', /\bpassword_set\s+BOOLEAN\b.*DEFAULT\s+false/i],
    ['onboarding_completed BOOLEAN DEFAULT false', /\bonboarding_completed\s+BOOLEAN\b.*DEFAULT\s+false/i],
    ['eris_balance INTEGER DEFAULT 100', /\beris_balance\s+INTEGER\b.*DEFAULT\s+100/i],
    ['created_at TIMESTAMPTZ', /\bcreated_at\s+TIMESTAMPTZ/i],
    ['updated_at TIMESTAMPTZ', /\bupdated_at\s+TIMESTAMPTZ/i],
  ]

  for (const [label, pattern] of expectedColumns) {
    it(`Req 1.2 — profiles has column: ${label}`, () => {
      expect(sql).toMatch(pattern)
    })
  }
})

// ---------------------------------------------------------------------------
// Requirement 1.3 — org_members table with correct columns
// ---------------------------------------------------------------------------

describe('org_members table definition', () => {
  it('Req 1.3 — CREATE TABLE org_members is present', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS\s+org_members\s*\(/i)
  })

  it('Req 1.3 — org_members.organization_id references organizations with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/\borganization_id\s+UUID\s+NOT NULL\s+REFERENCES\s+organizations\s*\(\s*id\s*\)\s+ON DELETE CASCADE/i)
  })

  it('Req 1.3 — org_members.profile_id references profiles with ON DELETE SET NULL', () => {
    expect(sql).toMatch(/\bprofile_id\s+UUID\b.*REFERENCES\s+profiles\s*\(\s*id\s*\)\s+ON DELETE SET NULL/i)
  })

  const expectedColumns: Array<[string, RegExp]> = [
    ['id UUID PK', /\bid\s+UUID\s+PRIMARY KEY/i],
    ['email TEXT NOT NULL', /\bemail\s+TEXT\s+NOT NULL/i],
    ["profile_type TEXT CHECK ('admin'|'member')", /\bprofile_type\s+TEXT\b.*CHECK\s*\(.*'admin'.*'member'.*\)/is],
    ['role TEXT', /\brole\s+TEXT/i],
    ['invited_at TIMESTAMPTZ DEFAULT NOW()', /\binvited_at\s+TIMESTAMPTZ\s+DEFAULT\s+NOW\(\)/i],
    ['verified BOOLEAN DEFAULT false', /\bverified\s+BOOLEAN\b.*DEFAULT\s+false/i],
  ]

  for (const [label, pattern] of expectedColumns) {
    it(`Req 1.3 — org_members has column: ${label}`, () => {
      expect(sql).toMatch(pattern)
    })
  }
})

// ---------------------------------------------------------------------------
// Requirement 1.4 — obsolete tables are dropped
// ---------------------------------------------------------------------------

describe('Obsolete tables are dropped', () => {
  it('Req 1.4 — DROP TABLE team_members is present', () => {
    expect(sql).toMatch(/DROP TABLE IF EXISTS\s+team_members\b/i)
  })

  it('Req 1.4 — DROP TABLE user_preferences is present', () => {
    expect(sql).toMatch(/DROP TABLE IF EXISTS\s+user_preferences\b/i)
  })

  it('Req 1.4 — DROP TABLE organization_features is present', () => {
    expect(sql).toMatch(/DROP TABLE IF EXISTS\s+organization_features\b/i)
  })
})

// ---------------------------------------------------------------------------
// Requirement 1.5 — RLS is enabled on all three tables
// ---------------------------------------------------------------------------

describe('Row Level Security is enabled', () => {
  it('Req 1.5 — RLS enabled on organizations', () => {
    expect(sql).toMatch(/ALTER TABLE\s+organizations\s+ENABLE ROW LEVEL SECURITY/i)
  })

  it('Req 1.5 — RLS enabled on profiles', () => {
    expect(sql).toMatch(/ALTER TABLE\s+profiles\s+ENABLE ROW LEVEL SECURITY/i)
  })

  it('Req 1.5 — RLS enabled on org_members', () => {
    expect(sql).toMatch(/ALTER TABLE\s+org_members\s+ENABLE ROW LEVEL SECURITY/i)
  })
})

// ---------------------------------------------------------------------------
// Requirement 1.9 — updated_at triggers on organizations and profiles
// ---------------------------------------------------------------------------

describe('updated_at triggers', () => {
  it('Req 1.9 — update_updated_at() function is defined', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION\s+update_updated_at\s*\(\s*\)/i)
  })

  it('Req 1.9 — trigger trg_organizations_updated_at is created on organizations', () => {
    expect(sql).toMatch(/CREATE TRIGGER\s+trg_organizations_updated_at\b/i)
    expect(sql).toMatch(/trg_organizations_updated_at[\s\S]*?ON\s+organizations\b/i)
  })

  it('Req 1.9 — trigger trg_profiles_updated_at is created on profiles', () => {
    expect(sql).toMatch(/CREATE TRIGGER\s+trg_profiles_updated_at\b/i)
    expect(sql).toMatch(/trg_profiles_updated_at[\s\S]*?ON\s+profiles\b/i)
  })

  it('Req 1.9 — triggers fire BEFORE UPDATE FOR EACH ROW', () => {
    // Both triggers should use BEFORE UPDATE ... FOR EACH ROW
    const triggerBlocks = sql.match(/CREATE TRIGGER\s+trg_\w+_updated_at[\s\S]*?EXECUTE FUNCTION/gi) ?? []
    expect(triggerBlocks.length).toBeGreaterThanOrEqual(2)
    for (const block of triggerBlocks) {
      expect(block).toMatch(/BEFORE UPDATE/i)
      expect(block).toMatch(/FOR EACH ROW/i)
    }
  })

  it('Req 1.9 — no updated_at trigger is defined on org_members', () => {
    // The spec only requires triggers on organizations and profiles
    expect(sql).not.toMatch(/CREATE TRIGGER\s+trg_org_members_updated_at\b/i)
  })
})

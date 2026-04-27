-- ============================================================
-- ERANI Platform v1 — Supabase Schema
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/ctgizovelvkzahbmxwgc/sql/new
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. ORGANIZATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'trial',   -- trial | starter | pro | enterprise
  trl_level   INTEGER DEFAULT 1,               -- 1–9 NASA TRL
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. PROFILES (linked to Supabase Auth users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name       TEXT,
  email           TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'client',  -- client | admin | dev
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. AUDITS (Forensic Audit Sessions)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | complete
  dark_data_index NUMERIC(5,2) DEFAULT 0,           -- percentage 0–100
  scope_creep_pct NUMERIC(5,2) DEFAULT 0,           -- percentage 0–100
  roi_recovered   NUMERIC(12,2) DEFAULT 0,          -- USD
  trl_level       INTEGER DEFAULT 1,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. ALERTS (Intruder Firewall Events)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_id        UUID REFERENCES audits(id) ON DELETE CASCADE,
  ticket          TEXT,
  description     TEXT,
  risk_level      TEXT NOT NULL DEFAULT 'low',  -- low | medium | high | critical
  resolved        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. METADATA UPLOADS (File Ingestion Records)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metadata_uploads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id        UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  source          TEXT,  -- slack | jira | clickup | csv | zip
  storage_path    TEXT,
  processed       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata_uploads  ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Organizations: members of the org can read
CREATE POLICY "Org members can view their org"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Audits: org members can view/create audits for their org
CREATE POLICY "Org members can view audits"
  ON audits FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can create audits"
  ON audits FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Alerts: org members can view their org's alerts
CREATE POLICY "Org members can view alerts"
  ON alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 7. AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_audits_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- 9. SESSIONS (Calendly & Platform Reminders)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | completed | cancelled
  calendly_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sessions"
  ON sessions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- 8. SEED DATA (optional — remove in production)
-- ─────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, plan, trl_level)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'ERANI Demo Org',
  'erani-demo',
  'pro',
  5
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ERANI Platform v1 — New Tables for Preferences and Audit Logs
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. USER PREFERENCES
-- Stores font_size, theme_color, and custom_logo_url per organization
CREATE TABLE IF NOT EXISTS user_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  font_size       INTEGER DEFAULT 10,  -- 8 to 14 px
  theme_color     TEXT DEFAULT '#0055A0', -- Default erani-blue
  custom_logo_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- 2. AUDIT LOGS
-- Tracks security and administrative actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL, -- login | upload | settings_change | password_update
  description     TEXT,
  ip_address      TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STORAGE BUCKET FOR LOGOS
-- Run this to create the bucket (requires Supabase UI or Admin)
-- insert into storage.buckets (id, name, public) values ('logos', 'logos', true);

-- ─────────────────────────────────────────────
-- Enable RLS
-- ─────────────────────────────────────────────
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- Preferences: Org members can view and update their own org preferences
CREATE POLICY "Org members can view preferences"
  ON user_preferences FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can update preferences"
  ON user_preferences FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Audit Logs: Org members can view their own org's logs
CREATE POLICY "Org members can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Auto-update Trigger
-- ─────────────────────────────────────────────
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- Seed demo preferences
-- ─────────────────────────────────────────────
INSERT INTO user_preferences (organization_id)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001')
ON CONFLICT (organization_id) DO NOTHING;

-- ============================================================
-- 4. INGESTION LAYER (PRIMARY EVIDENCE)
-- ============================================================
-- Stores metadata of primary evidence files uploaded by the user
CREATE TABLE IF NOT EXISTS ingestion_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  content_type    TEXT,
  storage_path    TEXT NOT NULL,
  status          TEXT DEFAULT 'uploaded', -- uploaded, processing, processed, error
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Run this to create the bucket for ingestion
-- insert into storage.buckets (id, name, public) values ('primary_evidence', 'primary_evidence', false);

-- Enable RLS
ALTER TABLE ingestion_documents ENABLE ROW LEVEL SECURITY;

-- Policies for Ingestion Documents
CREATE POLICY "Org members can view their ingestion documents"
  ON ingestion_documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert ingestion documents"
  ON ingestion_documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can update their ingestion documents"
  ON ingestion_documents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Auto-update Trigger for Ingestion Layer
CREATE TRIGGER trg_ingestion_documents_updated_at
  BEFORE UPDATE ON ingestion_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

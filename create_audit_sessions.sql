-- ============================================================
-- ERANI Platform v1 — Create Audit Sessions
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/ctgizovelvkzahbmxwgc/sql/new
-- ============================================================

-- 1. Create audit_sessions table
CREATE TABLE IF NOT EXISTS audit_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Org members can view audit_sessions"
  ON audit_sessions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM audits WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Org members can insert audit_sessions"
  ON audit_sessions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM audits WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Org members can update audit_sessions"
  ON audit_sessions FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM audits WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Org members can delete audit_sessions"
  ON audit_sessions FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM audits WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 4. Update Trigger
CREATE TRIGGER trg_audit_sessions_updated_at
  BEFORE UPDATE ON audit_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Add reference to metadata_uploads
-- This allows files to be uploaded directly into a specific audit session
ALTER TABLE metadata_uploads ADD COLUMN IF NOT EXISTS audit_session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE;el 
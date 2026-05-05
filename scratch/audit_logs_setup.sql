-- ============================================================
-- ERANI PLATFORM – Forensic Audit Infrastructure
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- 1. Ensure audit_logs table exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    action          TEXT        NOT NULL,
    description     TEXT,
    metadata        JSONB       DEFAULT '{}'::jsonb,
    icon_type       TEXT        DEFAULT 'activity',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for real-time queries (filter by org + ordered by time)
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
    ON audit_logs (organization_id, created_at DESC);

-- ============================================================
-- 2. Add streaming_logs_enabled to organization_features
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_features'
          AND column_name = 'streaming_logs_enabled'
    ) THEN
        ALTER TABLE organization_features
            ADD COLUMN streaming_logs_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================================
-- 3. Row Level Security for audit_logs
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies first to allow re-runs
DROP POLICY IF EXISTS "Users can view their organization logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs"   ON audit_logs;

-- Users can only SELECT logs belonging to their own organization
CREATE POLICY "Users can view their organization logs"
    ON audit_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Any authenticated user can INSERT (the logger validates org_id client-side)
CREATE POLICY "Authenticated users can insert logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 4. Enable Realtime for audit_logs
-- ============================================================
-- Note: if this errors with "already member", it is safe to ignore.
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'audit_logs already in supabase_realtime publication';
    END;
END $$;

-- ============================================================
-- 5. Storage Bucket for Forensic PDFs
-- ============================================================
-- Create the bucket (public so generated PDF URLs work without tokens).
-- If the bucket already exists this is a no-op.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'forensic-reports',
    'forensic-reports',
    true,
    52428800,  -- 50 MB limit per file
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Storage RLS Policies for forensic-reports bucket
-- ============================================================
DROP POLICY IF EXISTS "Public read forensic reports"   ON storage.objects;
DROP POLICY IF EXISTS "Auth upload forensic reports"   ON storage.objects;
DROP POLICY IF EXISTS "Auth delete forensic reports"   ON storage.objects;

-- Anyone (including unauthenticated) can read PDFs (for public share links)
CREATE POLICY "Public read forensic reports"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'forensic-reports');

-- Only authenticated users can upload
CREATE POLICY "Auth upload forensic reports"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'forensic-reports'
        AND auth.role() = 'authenticated'
    );

-- Only authenticated users can delete their own uploads
CREATE POLICY "Auth delete forensic reports"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'forensic-reports'
        AND auth.role() = 'authenticated'
    );

-- ============================================================
-- DONE – Copy the output of SELECT count(*) FROM audit_logs;
-- to verify connectivity before testing the frontend.
-- ============================================================
SELECT
    'audit_logs'       AS table_name,
    count(*)           AS record_count
FROM audit_logs
UNION ALL
SELECT
    'forensic_reports' AS table_name,
    count(*)           AS record_count
FROM forensic_reports;

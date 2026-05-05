-- ============================================================
-- ERANI Platform v1 — Real-Time Logs & Storage Configuration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. ENHANCE ORGANIZATION FEATURES
-- Adds the toggle for streaming logs
CREATE TABLE IF NOT EXISTS public.organization_features (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    firewall_enabled BOOLEAN DEFAULT true,
    email_alerts BOOLEAN DEFAULT true,
    slack_alerts BOOLEAN DEFAULT false,
    auto_audit BOOLEAN DEFAULT false,
    streaming_logs_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the column exists if table already existed
ALTER TABLE public.organization_features 
ADD COLUMN IF NOT EXISTS streaming_logs_enabled BOOLEAN DEFAULT true;

-- 2. ENHANCE AUDIT LOGS
-- Adds icon_type for frontend visualization
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'activity';

-- 3. ENABLE REALTIME FOR AUDIT LOGS
-- This allows the frontend to listen for new logs as they happen
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
    -- Ensure the realtime publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- Add the table to the publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
    END;
END $$;

-- 4. UPDATE FORENSIC REPORTS FOR STORAGE
-- Adds the PDF URL field to link storage files
ALTER TABLE public.forensic_reports
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 5. RLS POLICIES (Safety check)
ALTER TABLE public.organization_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view features"
  ON public.organization_features FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can update features"
  ON public.organization_features FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- ERANI Platform — Forensic Evidence Bucket Schema
-- Run in: https://supabase.com/dashboard/project/ctgizovelvkzahbmxwgc/sql/new
-- ============================================================

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forensic_evidence', 'forensic_evidence', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for the bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to forensic_evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forensic_evidence');

-- Allow authenticated users to read their own files (or all files in the bucket for simplicity if organization isolation is handled by app logic)
CREATE POLICY "Allow authenticated reads from forensic_evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'forensic_evidence');

-- Allow service role full access
CREATE POLICY "Service role full access to forensic_evidence"
ON storage.objects
USING (bucket_id = 'forensic_evidence')
WITH CHECK (bucket_id = 'forensic_evidence');

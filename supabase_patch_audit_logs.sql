-- ============================================================
-- ERANI Platform v1 — Patch for audit_logs table
-- Run this in your Supabase SQL Editor to add the icon_type column
-- ============================================================

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'activity';

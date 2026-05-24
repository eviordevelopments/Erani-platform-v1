-- ============================================================
-- ERANI Platform v1 — Forensic Vector & RAG Schema
-- ⚠️  CRITICAL: Run this BEFORE using the Forensic Audit feature
--
-- Run in: https://supabase.com/dashboard/project/ctgizovelvkzahbmxwgc/sql/new
-- ============================================================

-- ── 0. Enable pgvector extension ──────────────────────────────────────────────
-- Required for vector(3072) column type and <=> cosine similarity operator
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. DOCUMENT EMBEDDINGS TABLE ──────────────────────────────────────────────
-- Stores chunked text embeddings from uploaded forensic evidence files.
-- DIMENSION = 3072 (verified output of gemini-embedding-001 as of 2026-05)
-- DO NOT change to 768 — that was the old wrong assumption.
CREATE TABLE IF NOT EXISTS document_embeddings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id TEXT NOT NULL,
  project_id      TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  chunk_index     INTEGER NOT NULL DEFAULT 0,
  content         TEXT NOT NULL,
  embedding       vector(3072),          -- ← gemini-embedding-001 real output dim
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast filtered lookups by org + project
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_org_proj
  ON document_embeddings(organization_id, project_id);

-- IVFFlat index for approximate nearest-neighbor vector search
-- (train after 1000+ rows; for small datasets exact search is fine)
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector
  ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── 2. SEMANTIC SEARCH FUNCTION ───────────────────────────────────────────────
-- Used by forensic/route.ts to find historically similar audit chunks.
-- Called via: supabase.rpc("match_document_chunks", { ... })

-- Drop the function first in case the return type signature has changed
DROP FUNCTION IF EXISTS match_document_chunks(vector, double precision, integer, text);

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding  vector(3072),
  match_threshold  float,
  match_count      int,
  filter_org_id    text
)
RETURNS TABLE(
  id          UUID,
  content     TEXT,
  file_name   TEXT,
  project_id  TEXT,
  similarity  float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.content,
    de.file_name,
    de.project_id,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE
    de.organization_id = filter_org_id
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── 3. ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow service role (used in route.ts) full access — bypasses RLS
-- Public/anon policies are restricted by org
CREATE POLICY "Service role full access to document_embeddings"
  ON document_embeddings
  USING (true)
  WITH CHECK (true);

-- ── 4. PATCH forensic_reports TABLE ───────────────────────────────────────────
-- The existing forensic_reports table (forensic_schema.sql) is missing:
--  • payload_completo  (the full Gemini JSON response)
--  • project_id        (needed for upsert onConflict)
--  • pdf_url           (used in forensic/page.tsx for persistence check)

-- Add missing columns (IF NOT EXISTS style via DO block)
DO $$
BEGIN
  -- payload_completo: full structured JSON from Gemini
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forensic_reports' AND column_name = 'payload_completo'
  ) THEN
    ALTER TABLE forensic_reports ADD COLUMN payload_completo JSONB DEFAULT '{}';
  END IF;

  -- project_id: needed for upsert deduplication logic
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forensic_reports' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE forensic_reports ADD COLUMN project_id TEXT UNIQUE;
  END IF;

  -- pdf_url: optional link to generated PDF in Supabase Storage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forensic_reports' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE forensic_reports ADD COLUMN pdf_url TEXT;
  END IF;
END $$;

-- ── 5. INSERT POLICY for forensic_reports ─────────────────────────────────────
-- The existing forensic_schema.sql only has SELECT and UPDATE.
-- The route.ts upsert requires INSERT permission.
CREATE POLICY "Service role can insert forensic reports"
  ON forensic_reports FOR INSERT
  WITH CHECK (true);

-- ── 6. VERIFICATION QUERIES ───────────────────────────────────────────────────
-- Run these after applying the schema to confirm everything is set up:
--
-- SELECT extname FROM pg_extension WHERE extname = 'vector';
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'document_embeddings';
-- SELECT proname FROM pg_proc WHERE proname = 'match_document_chunks';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'forensic_reports' AND column_name IN ('payload_completo','project_id','pdf_url');

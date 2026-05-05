-- FIX: Final standard for Forensic Audit Pipeline (768 Dimensions)
-- Resolves: RPC Ambiguity, UUID Type Mismatch, and Vector Dimension Mismatch

-- 1. Standardize organization_id to TEXT and force vector dimension to 768
DO $$ 
BEGIN
    -- Update document_embeddings organization_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_embeddings' AND column_name = 'organization_id') THEN
        ALTER TABLE public.document_embeddings ALTER COLUMN organization_id TYPE TEXT;
    END IF;

    -- FORCE dimension to 768 (fixes the 3072 mismatch)
    -- WARNING: This will clear existing vectors if they were 3072, allowing re-ingestion
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_embeddings' AND column_name = 'embedding') THEN
        ALTER TABLE public.document_embeddings ALTER COLUMN embedding TYPE vector(768);
    END IF;

    -- Update forensic_reports organization_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forensic_reports' AND column_name = 'organization_id') THEN
        ALTER TABLE public.forensic_reports ALTER COLUMN organization_id TYPE TEXT;
    END IF;
END $$;

-- 2. Clean up ALL versions of the RPC function to ensure zero ambiguity
DROP FUNCTION IF EXISTS public.match_document_chunks(vector, float, int, uuid);
DROP FUNCTION IF EXISTS public.match_document_chunks(vector, float, int, text);
DROP FUNCTION IF EXISTS public.match_document_chunks(extensions.vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS public.match_document_chunks(extensions.vector, double precision, integer, text);
DROP FUNCTION IF EXISTS public.match_document_chunks(vector(768), float, int, text);
DROP FUNCTION IF EXISTS public.match_document_chunks(vector(3072), float, int, text);

-- 3. Recreate the RAG Matching Function strictly with 768 dimensions
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_org_id text
)
RETURNS TABLE (
  id bigint,
  content text,
  file_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.content,
    document_embeddings.file_name,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE document_embeddings.organization_id = filter_org_id
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Final verification of project_id unique constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forensic_reports_project_id_key') THEN
        ALTER TABLE public.forensic_reports ADD CONSTRAINT forensic_reports_project_id_key UNIQUE (project_id);
    END IF;
END $$;


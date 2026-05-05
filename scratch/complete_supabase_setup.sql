-- 1. Enable PGVector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create document_embeddings table
CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id BIGSERIAL PRIMARY KEY,
    organization_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768), -- Gemini embedding-001 returns 768 dims
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_doc_embed_org_project ON public.document_embeddings(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_doc_embed_vector ON public.document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Create matching function for RAG
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

-- 5. Update forensic_reports table
ALTER TABLE public.forensic_reports ADD COLUMN IF NOT EXISTS project_id TEXT;
-- Remove old constraint if it exists (fixes the error user had)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forensic_reports_organization_id_key') THEN
        ALTER TABLE public.forensic_reports DROP CONSTRAINT forensic_reports_organization_id_key;
    END IF;
END $$;

-- Add new unique constraint per project
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forensic_reports_project_id_key') THEN
        ALTER TABLE public.forensic_reports ADD CONSTRAINT forensic_reports_project_id_key UNIQUE (project_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_forensic_reports_project_id ON public.forensic_reports(project_id);

-- Update forensic_reports to support multiple reports per organization (one per project)
ALTER TABLE public.forensic_reports ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.forensic_reports DROP CONSTRAINT IF EXISTS forensic_reports_organization_id_key;
ALTER TABLE public.forensic_reports ADD CONSTRAINT forensic_reports_project_id_key UNIQUE (project_id);
CREATE INDEX IF NOT EXISTS idx_forensic_reports_project_id ON public.forensic_reports(project_id);

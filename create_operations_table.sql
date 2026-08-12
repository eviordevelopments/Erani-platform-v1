CREATE TABLE public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  responsables UUID[] DEFAULT '{}',
  project_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  linked_sessions UUID[] DEFAULT '{}',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Users can view operations in their org"
  ON public.operations FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM public.organizations
      WHERE id = operations.organization_id
    )
  );

CREATE POLICY "Users can insert operations in their org"
  ON public.operations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations
      WHERE id = operations.organization_id
    )
  );

CREATE POLICY "Users can update operations in their org"
  ON public.operations FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM public.organizations
      WHERE id = operations.organization_id
    )
  );

CREATE POLICY "Users can delete operations in their org"
  ON public.operations FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM public.organizations
      WHERE id = operations.organization_id
    )
  );

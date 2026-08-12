-- update_automations_schema.sql
-- Ejecuta esto en el SQL Editor de Supabase para crear y configurar la tabla de automatizaciones

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.automations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    source_session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'inactive', -- active, inactive, error
    category text NOT NULL DEFAULT 'operativa', -- forense, financiera, operativa
    roi_projection numeric NOT NULL DEFAULT 0,
    hours_saved_monthly numeric NOT NULL DEFAULT 0,
    coi_recovery_amount numeric NOT NULL DEFAULT 0,
    fuga_name text,
    n8n_id text,
    last_run timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para que los usuarios de la organización puedan ver y editar sus flujos
CREATE POLICY "Users can view automations of their organization" 
ON public.automations FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert automations to their organization" 
ON public.automations FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update automations of their organization" 
ON public.automations FOR UPDATE 
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete automations of their organization" 
ON public.automations FOR DELETE 
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 4. Limpiar datos viejos o huérfanos (por seguridad, elimina cualquier flujo sin sesión ligada)
DELETE FROM public.automations WHERE source_session_id IS NULL;

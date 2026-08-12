-- Migración para crear la tabla de Etiquetas Universales (workspace_tags)
CREATE TABLE IF NOT EXISTS workspace_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la tabla ya existía con TEXT, forzamos el cambio a UUID
ALTER TABLE workspace_tags ALTER COLUMN organization_id TYPE UUID USING organization_id::UUID;

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_workspace_tags_org ON workspace_tags(organization_id);

-- Habilitar RLS
ALTER TABLE workspace_tags ENABLE ROW LEVEL SECURITY;

-- Borrar políticas si existen para evitar duplicados
DROP POLICY IF EXISTS "Permitir lectura a miembros de la organización" ON workspace_tags;
DROP POLICY IF EXISTS "Permitir inserción a miembros de la organización" ON workspace_tags;
DROP POLICY IF EXISTS "Permitir actualización a miembros de la organización" ON workspace_tags;
DROP POLICY IF EXISTS "Permitir eliminación a miembros de la organización" ON workspace_tags;

-- Políticas de RLS corregidas
CREATE POLICY "Permitir lectura a miembros de la organización" ON workspace_tags
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Permitir inserción a miembros de la organización" ON workspace_tags
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Permitir actualización a miembros de la organización" ON workspace_tags
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Permitir eliminación a miembros de la organización" ON workspace_tags
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

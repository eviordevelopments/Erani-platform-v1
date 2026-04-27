-- ============================================================
-- ERANI Platform v1 — Forensic Audit & Bento Report Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS forensic_reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_name        TEXT NOT NULL DEFAULT 'AUDITORIA ALPHA',
  
  -- Financial Impact Metrics
  impacto_directo     NUMERIC DEFAULT 0,
  impacto_futuro      NUMERIC DEFAULT 0,
  scope_creep         NUMERIC DEFAULT 0,
  rentabilidad_point  NUMERIC DEFAULT 0,
  coi_anual           NUMERIC DEFAULT 0,
  
  -- Detailed Analysis (JSONB for flexibility)
  -- Structure: Array of {id: string, description: string, filter: string, hrs: number, cost: number, status: string}
  tickets             JSONB DEFAULT '[]',
  
  -- Health KPIs
  kpi_revisiones      NUMERIC DEFAULT 0,
  kpi_friccion_talento NUMERIC DEFAULT 0,
  kpi_dark_data       NUMERIC DEFAULT 0,
  
  -- Charts & Evolution
  -- firewall_impact: Array of {month: string, value: number}
  firewall_impact     JSONB DEFAULT '[{"month": "Mes 1", "value": 0}, {"month": "Mes 2", "value": 0}, {"month": "Mes 3", "value": 0}]',
  -- margen_evolucion: Array of {month: string, value: string, desc: string}
  margen_evolucion    JSONB DEFAULT '[{"month": "Mes 1", "value": "0%", "desc": "Control de Fugas"}, {"month": "Mes 2", "value": "0%", "desc": "Visibilidad 100%"}, {"month": "Mes 3", "value": "0%", "desc": "Rentabilidad Estabilizada"}]',
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE forensic_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Org members can view forensic reports"
  ON forensic_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can update forensic reports"
  ON forensic_reports FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Auto-update Trigger
CREATE TRIGGER trg_forensic_reports_updated_at
  BEFORE UPDATE ON forensic_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INITIAL SEED (OPTIONAL)
-- ============================================================
-- INSERT INTO forensic_reports (organization_id, project_name, impacto_directo, impacto_futuro, scope_creep, rentabilidad_point, coi_anual, kpi_revisiones, kpi_friccion_talento, kpi_dark_data)
-- VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 'ERANI DEMO PROJECT', 16800, 24300, 50, 50400, 201600, 11.5, 84.6, 100);

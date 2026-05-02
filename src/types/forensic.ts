export interface ReportMetadata {
  project_name: string;
  audit_id: string;
  currency: string;
}

export interface Slide1ImpactoDirecto {
  fuga_confirmada_mxn: number;
  riesgo_latente_mensual_mxn: number;
  desviacion_scope_creep_pct: number;
  punto_conciencia_rentabilidad_mxn: number;
  coi_anual_mxn: number;
}

export interface Top5Ticket {
  ticket_id: string;
  descripcion: string;
  filtro: "[INT]" | "[EXT]";
  hrs_calc: number;
  costo_invisible_mxn: number;
}

export interface ResumenConsolidacion {
  otros_tickets_cantidad: number;
  otros_tickets_monto_mxn: number;
  fuga_externa_mxn: number;
  fuga_interna_mxn: number;
  total_conciliado_monto_mxn: number;
  estado_inventario_desc: string;
}

export interface Slide2AnalisisForense {
  top_5_tickets: Top5Ticket[];
  resumen_consolidacion: ResumenConsolidacion;
}

export interface Slide3KpisSalud {
  monitor_bucle_pct: number;
  indice_friccion_pct: number;
  dark_data_index_pct: number;
  intensidad_scope_creep_pct: number;
  analisis_ceguera_operativa: string;
}

export interface Slide4EstrategiaFirewall {
  protocolos_bloqueo: string;
  roi_dias: number;
  proyeccion_margen_pct: number;
}

export interface Slide5AnexoSustento {
  frameworks: string[];
  glosario: string[];
}

export interface AnexoTecnico {
  metodologia_inferencia: string;
  vectores_auditados: string[];
  frameworks_utilizados?: string[];
  glosario_terminos?: string[];
}

export interface ForensicReport {
  report_metadata: ReportMetadata;
  slide_1_impacto_directo: Slide1ImpactoDirecto;
  slide_2_analisis_forense: Slide2AnalisisForense;
  slide_3_kpis_salud: Slide3KpisSalud;
  slide_4_estrategia_firewall: Slide4EstrategiaFirewall;
  slide_5_anexo_sustento: Slide5AnexoSustento;
  // Alias used by the Bento report UI in audit/page.tsx
  anexo_tecnico: AnexoTecnico;
}

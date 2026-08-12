"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  BarChart3, 
  Table as TableIcon, 
  Activity, 
  Lock, 
  FileText,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  ArrowRight,
  ChevronDown,
  Cpu
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ReportDownloader from "@/components/ReportDownloader";
import { useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/lib/supabaseClient";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { persistForensicReport } from "@/lib/forensicPersistence";
import { useAuth } from "@/context/AuthContext";
import ForensicHistoryDashboard from "@/components/ForensicHistoryDashboard";


// --- Types ---
interface ForensicTicket {
  id: string;
  description: string;
  filter: string;
  hrs: number;
  cost: number;
  status: 'execution' | 'blindspot' | 'capital_leak';
}

export interface ForensicReportData {
  projectName: string;
  impactoDirecto: number;
  impactoFuturo: number;
  scopeCreep: number;
  rentabilidadPoint: number;
  coiAnual: number;
  tickets: ForensicTicket[];
  kpiRevisiones: number;
  kpiFriccionTalento: number;
  kpiDarkData: number;
  resumenConsolidacion: {
    fugaExterna: number;
    fugaInterna: number;
    totalConciliado: number;
    estadoInventario: string;
  };
  cegueraOperativa: string;
  firewallProtocolos: string;
  firewallRoi: number;
  anexoFrameworks: string[];
  anexoGlosario: string[];
  firewallImpact: { month: string; value: number }[];
  margenEvolucion: { month: string; value: string; desc: string }[];
  aiModel?: string;
  projectSize?: string;
  erisCost?: number;
}

const INITIAL_DATA: ForensicReportData = {
  projectName: "PROYECTO ALPHA",
  impactoDirecto: 0,
  impactoFuturo: 0,
  scopeCreep: 0,
  rentabilidadPoint: 0,
  coiAnual: 0,
  tickets: [],
  kpiRevisiones: 0,
  kpiFriccionTalento: 0,
  kpiDarkData: 0,
  resumenConsolidacion: {
    fugaExterna: 0,
    fugaInterna: 0,
    totalConciliado: 0,
    estadoInventario: "Esperando análisis de Erani Engine..."
  },
  cegueraOperativa: "Análisis en proceso...",
  firewallProtocolos: "Pendiente de definición estratégica.",
  firewallRoi: 0,
  anexoFrameworks: [],
  anexoGlosario: [],
  firewallImpact: [
    { month: "Mes 1", value: 10 },
    { month: "Mes 2", value: 25 },
    { month: "Mes 3", value: 30 },
  ],
  margenEvolucion: [
    { month: "Mes 1", value: "10%", desc: "Control de Fugas" },
    { month: "Mes 2", value: "22%", desc: "Visibilidad 100%" },
    { month: "Mes 3", value: "30%", desc: "Rentabilidad Estabilizada" },
  ],
  aiModel: "Motor de Inferencia ERANI V1",
  projectSize: "medium",
  erisCost: 30
};

type TabId = "scorecard" | "analysis" | "kpis" | "firewall" | "annex";

export default function ForensicPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-erani-blue/20 border-t-erani-blue rounded-full animate-spin" />
        <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Cargando Módulo Forense...</p>
      </div>
    }>
      <ForensicContent />
    </Suspense>
  );
}

function ForensicContent() {
  const { isSidebarCollapsed } = useDashboard();
  const { user, profile, org } = useAuth();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const timestamp = searchParams.get("t");
  
  const [activeTab, setActiveTab] = useState<TabId>("scorecard");
  const [data, setData] = useState<ForensicReportData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Iniciando...");
  const [viewMode, setViewMode] = useState<"history" | "report">("report");

  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (user && profile) {
      if (reportId) {
        setViewMode("report");
        fetchForensicData();
      } else {
        setViewMode("history");
        setLoading(false);
      }
    }
  }, [reportId, timestamp, user, profile]);

  const fetchForensicData = async (retries = 4) => {
    try {
      console.log(`[Hydration] Starting fetch for reportId: ${reportId}, attempt: ${5 - retries}`);
      setLoading(true);
      setFetchError(null);
      setStatusMessage(`Cargando reporte forense...`);

      let query = supabase.from('forensic_reports').select('*');

      if (reportId) {
        // Fallback logic: Try ID first, then project_id if ID looks like a custom slug
        const isNumeric = /^\d+$/.test(reportId);

        if (isNumeric) {
          console.log(`[Hydration] Searching by Primary Key (id): ${reportId}`);
          query = query.eq('id', reportId);
        } else {
          console.log(`[Hydration] Searching by Project Identifier (project_id): ${reportId}`);
          query = query.eq('project_id', reportId);
        }
      }

      const { data: result, error } = await query.single();

      if (error) {
        console.error(`[Hydration Error] Supabase says:`, error);
        
        // If not found by ID, and we haven't tried project_id yet, try it
        if (error.code === 'PGRST116' && reportId && !reportId.startsWith('PRJ-')) {
           console.log(`[Hydration] Not found by ID, trying as project_id fallback...`);
           const fallback = await supabase.from('forensic_reports').select('*').eq('project_id', reportId).single();
           if (!fallback.error) {
             mapData(fallback.data);
             return;
           }
        }

        if (retries > 0 && (error.message.includes("fetch") || error.message.includes("network") || error.code === 'PGRST116')) {
          setStatusMessage("Reporte no listo aún. Reintentando sincronización...");
          console.warn(`[Hydration] Retrying fetch in 2s... ${retries} attempts left`);
          await new Promise(r => setTimeout(r, 2000));
          return fetchForensicData(retries - 1);
        }
        
        setFetchError({
          message: error.message || "Reporte no encontrado",
          code: error.code,
          details: `No se encontró el reporte con ID ${reportId}. Es posible que la base de datos esté tardando en indexar.`
        } as any);
        setLoading(false);
        return;
      }

      if (result) {
        setStatusMessage("Mapeando evidencia forense...");
        console.log(`[Hydration] Successfully retrieved report:`, result.id);
        const mappedData = mapData(result);
        
        // AUTO-PERSIST: If no PDF exists yet, generate and save it
        if (!result.pdf_url && mappedData) {
          setStatusMessage("Persistiendo reporte en Supabase...");
          persistForensicReport(result.id, mappedData, organizationId || undefined);
        }
      } else {
        setFetchError("El resultado de la base de datos fue nulo." as any);
      }
    } catch (err: any) {
      console.error("[Hydration Critical] System failure:", err);
      const isNetworkError = err.message?.toLowerCase().includes("fetch") || err.message?.toLowerCase().includes("network");
      
      if (retries > 0 && isNetworkError) {
        console.warn(`[Hydration] Retrying system catch in 2s... ${retries} attempts left`);
        await new Promise(r => setTimeout(r, 2000));
        return fetchForensicData(retries - 1);
      }
      
      setFetchError({
        message: "Error crítico de comunicación con la base de datos.",
        code: "NETWORK_FAILURE",
        details: err.message
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const mapData = (report: any) => {
    try {
      console.log(`[Mapping] Transforming record:`, report.id);
      const p = report.payload_completo || {};
      
      const mapped: ForensicReportData = {
        projectName: p.report_metadata?.project_name || report.project_name || "PROYECTO SIN NOMBRE",
        impactoDirecto: p.slide_1_impacto_directo?.fuga_confirmada_mxn || report.impacto_directo || 0,
        impactoFuturo: p.slide_1_impacto_directo?.riesgo_latente_mensual_mxn || report.impacto_futuro || 0,
        scopeCreep: p.slide_1_impacto_directo?.desviacion_scope_creep_pct || report.scope_creep || 0,
        rentabilidadPoint: p.slide_1_impacto_directo?.punto_conciencia_rentabilidad_mxn || report.rentabilidad_point || 0,
        coiAnual: p.slide_1_impacto_directo?.coi_anual_mxn || report.coi_anual || 0,
        
        tickets: (p.slide_2_analisis_forense?.top_5_tickets || report.tickets || []).map((t: any) => ({
          id: t.ticket_id || t.id || Math.random().toString(36).substr(2, 9),
          description: t.descripcion || t.description || "Sin descripción",
          filter: t.filtro || t.filter || "General",
          hrs: t.hrs_calc || t.hrs || 0,
          cost: t.costo_invisible_mxn || t.cost || 0,
          status: (t.costo_invisible_mxn || t.cost) > 5000 ? 'capital_leak' : ((t.hrs_calc || t.hrs) > 10 ? 'blindspot' : 'execution')
        })),

        resumenConsolidacion: {
          fugaExterna: p.slide_2_analisis_forense?.resumen_consolidacion?.fuga_externa_mxn || 0,
          fugaInterna: p.slide_2_analisis_forense?.resumen_consolidacion?.fuga_interna_mxn || 0,
          totalConciliado: p.slide_2_analisis_forense?.resumen_consolidacion?.total_conciliado_monto_mxn || 0,
          estadoInventario: p.slide_2_analisis_forense?.resumen_consolidacion?.estado_inventario_desc || ""
        },

        kpiRevisiones: p.slide_3_kpis_salud?.monitor_bucle_pct || report.kpi_revisiones || 0,
        kpiFriccionTalento: p.slide_3_kpis_salud?.indice_friccion_pct || report.kpi_friccion_talento || 0,
        kpiDarkData: p.slide_3_kpis_salud?.dark_data_index_pct || report.kpi_dark_data || 0,
        cegueraOperativa: p.slide_3_kpis_salud?.analisis_ceguera_operativa || "",

        firewallProtocolos: p.slide_4_estrategia_firewall?.protocolos_bloqueo || report.firewall_protocolos || "",
        firewallRoi: p.slide_4_estrategia_firewall?.roi_dias || report.firewall_roi || 0,

        anexoFrameworks: p.slide_5_anexo_sustento?.frameworks || report.anexo_frameworks || [],
        anexoGlosario: p.slide_5_anexo_sustento?.glosario || report.anexo_glosario || [],
        
        firewallImpact: [
          { month: "Inicia", value: 0 },
          { month: "Mes 1",  value: (p.slide_4_estrategia_firewall?.roi_dias < 30) ? 65 : 45 },
          { month: "Mes 2",  value: 85 },
          { month: "Mes 3",  value: 100 }
        ],
        margenEvolucion: [
          { month: "Mes 1", value: `${Math.round((p.slide_4_estrategia_firewall?.proyeccion_margen_pct || 30) * 0.4)}%`, desc: "Control de Fugas" },
          { month: "Mes 2", value: `${Math.round((p.slide_4_estrategia_firewall?.proyeccion_margen_pct || 30) * 0.7)}%`, desc: "Visibilidad 100%" },
          { month: "Mes 3", value: `${(p.slide_4_estrategia_firewall?.proyeccion_margen_pct || 30)}%`, desc: "Rentabilidad Estabilizada" },
        ],
        aiModel: "Motor de Inferencia ERANI V1",
        projectSize: p.report_metadata?.project_size || report.project_size || 'medium',
        erisCost: (p.report_metadata?.project_size || report.project_size) === 'small' ? 15 : (p.report_metadata?.project_size || report.project_size) === 'large' ? 45 : 30
      };

      setData(mapped);
      console.log(`[Mapping] Success. Engine detected: Motor de Inferencia ERANI V1`);
      return mapped;
    } catch (mapErr) {
      console.error("[Mapping Error] Failed to parse payload:", mapErr);
      return null;
    }
  };

  const TABS = [
    { id: "scorecard", label: "ScoreCard", icon: Target },
    { id: "analysis", label: "Análisis Forense", icon: TableIcon },
    { id: "kpis", label: "KPIs de Salud", icon: Activity },
    { id: "firewall", label: "Firewall / Blindaje", icon: Lock },
    { id: "annex", label: "Anexo Técnico", icon: FileText },
  ];
  
  if (viewMode === "history") {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className={`flex-1 transition-all duration-500 overflow-y-auto ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative flex flex-col h-screen overflow-x-hidden`}>
          <ForensicHistoryDashboard organizationId={organizationId || null} />
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className={`flex-1 transition-all duration-500 flex flex-col items-center justify-center gap-6 p-4 md:p-8 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative h-screen overflow-x-hidden`}>
          <div className="relative">
            <div className="w-20 h-20 border-2 border-erani-blue/10 border-t-erani-blue rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-erani-blue animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-black dark:text-white">Sincronizando Reporte</h2>
            <p className="text-[10px] text-erani-blue font-bold uppercase tracking-widest animate-pulse">{statusMessage}</p>
            <p className="text-[9px] text-slate-600 dark:text-gray-600 uppercase tracking-widest mt-2">ID: {reportId || "Último disponible"}</p>
          </div>
          
          <button 
            onClick={() => setLoading(false)}
            className="mt-8 text-[8px] text-gray-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
          >
            Saltar Espera
          </button>
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className={`flex-1 transition-all duration-500 flex flex-col items-center justify-center p-4 md:p-8 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative h-screen overflow-x-hidden`}>
          <div className="max-w-md w-full bg-[#0d0d0d] border border-red-900/30 p-8 rounded-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Error de Hidratación</h2>
              <p className="text-sm text-gray-400">{(fetchError as any).message || "No se pudo sincronizar el reporte."}</p>
            </div>
            <button 
              onClick={() => fetchForensicData()}
              className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-xl"
            >
              Reintentar Sincronización
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-500 overflow-y-auto p-4 md:p-8 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative flex flex-col h-screen overflow-x-hidden`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-erani-blue/10 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#9e80ff]/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-erani-purple/5 blur-[180px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-[1600px] flex flex-col gap-10">
          
          {/* Header & Navigation */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                   <h1 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                      <ShieldAlert className="w-8 h-8 text-erani-purple" />
                      Peritaje Forense
                   </h1>
                   <p className="text-xs uppercase font-bold tracking-widest text-gray-500">
                      Inferencia de Nivel 2 aplicada a Metadata Operativa
                   </p>
                </div>

                <div className="flex items-center gap-4">
                   {/* Model Info (Read-only) */}
                   <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-foreground/5 border border-glass-border">
                     <Cpu className="w-4 h-4 text-erani-purple" />
                     <div className="flex flex-col">
                       <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">Motor de IA Utilizado</span>
                        <span className="text-[10px] font-black text-foreground">
                         {data.aiModel || "Motor de Inferencia ERANI V1"}
                       </span>
                     </div>
                   </div>

                   {/* ERIS Consumption Info */}
                   <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-erani-blue/5 border border-erani-blue/20">
                     <Zap className="w-4 h-4 text-erani-blue" />
                     <div className="flex flex-col">
                       <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">Costo de Auditoría</span>
                        <span className="text-[10px] font-black text-erani-blue">
                         {data.erisCost ? `${data.erisCost.toFixed(1)} ERIS` : "30.0 ERIS"}
                       </span>
                     </div>
                   </div>

                    <ReportDownloader data={data} org={org} reportId={reportId} />
                 </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-foreground/5 p-1.5 rounded-2xl border border-glass-border self-start backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                    ? "bg-gradient-to-r from-erani-blue to-erani-purple text-white shadow-lg shadow-erani-blue/20" 
                    : "text-gray-400 hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <AnimatePresence mode="wait">
             {loading ? (
               <motion.div
                 key="loading"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center py-20 gap-4"
               >
                 <div className="w-12 h-12 border-4 border-erani-blue/20 border-t-erani-blue rounded-full animate-spin" />
                 <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 animate-pulse">
                   Recuperando Peritaje Forense...
                 </p>
               </motion.div>
             ) : fetchError ? (
               <motion.div
                 key="error"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col items-center justify-center py-20 px-8 rounded-3xl bg-red-500/5 border border-red-500/20 gap-6 text-center"
               >
                 <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                   <AlertTriangle className="w-8 h-8 text-red-500" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                      {fetchError?.includes("conexión") ? "Fallo de Comunicación" : "Error de Acceso a Datos"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                      {fetchError || "No se pudo recuperar el reporte."}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 p-6 bg-foreground/5 rounded-2xl border border-glass-border text-left w-full max-w-2xl">
                     <p className="text-[10px] uppercase font-black tracking-widest text-erani-purple">Diagnóstico Erani:</p>
                      <p className="text-[11px] text-gray-400">
                        {(typeof fetchError === 'object' && (fetchError as any).code === 'NETWORK_FAILURE')
                          ? "Detectamos un fallo de red o DNS. Revisa tu conexión o configuración de proxy."
                          : "Si el reporte existe en Supabase pero no se carga, verifica que las políticas RLS permitan el acceso. En desarrollo puedes usar:"}
                      </p>
                      {(typeof fetchError === 'object' && (fetchError as any).code !== 'NETWORK_FAILURE') && (
                        <code className="text-[10px] font-mono text-gray-400 bg-black/20 p-4 rounded-xl break-all">
                          {`ALTER POLICY "Enable read access for all users" ON "public"."forensic_reports" TO anon USING (true);`}
                        </code>
                      )}
                  </div>
                 <button 
                   onClick={() => fetchForensicData()}
                   className="px-8 py-3 rounded-xl bg-foreground text-background text-[10px] uppercase font-black tracking-widest hover:bg-foreground/90 transition-all"
                 >
                   Reintentar Conexión
                 </button>
               </motion.div>
             ) : (
               <>
                 {/* WEB VIEW (Hidden on Print) */}
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.3, ease: "easeOut" }}
                   className="print:hidden"
                 >
                   <div id="forensic-scorecard-grid">
                      {activeTab === "scorecard" && <ScoreCardTab data={data} />}
                      {activeTab === "analysis" && <AnalysisTab tickets={data.tickets} data={data} />}
                      {activeTab === "kpis" && <HealthKpisTab data={data} />}
                      {activeTab === "firewall" && <FirewallTab data={data} />}
                      {activeTab === "annex" && <AnnexTab data={data} />}
                   </div>
                 </motion.div>

                 {/* PRINT VIEW (Hidden on Web) */}
                 <div className="hidden print:flex flex-col w-full">
                    <div className="flex flex-col gap-8 w-full break-inside-avoid">
                       <PrintHeader org={org} data={data} reportId={reportId} />
                       <ScoreCardTab data={data} />
                    </div>
                    <div className="h-12" />
                    <div className="flex flex-col gap-8 w-full break-inside-avoid break-before-page">
                       <PrintHeader org={org} data={data} reportId={reportId} />
                       <AnalysisTab tickets={data.tickets} data={data} />
                    </div>
                    <div className="h-12" />
                    <div className="flex flex-col gap-8 w-full break-inside-avoid break-before-page">
                       <PrintHeader org={org} data={data} reportId={reportId} />
                       <HealthKpisTab data={data} />
                    </div>
                    <div className="h-12" />
                    <div className="flex flex-col gap-8 w-full break-inside-avoid break-before-page">
                       <PrintHeader org={org} data={data} reportId={reportId} />
                       <FirewallTab data={data} />
                    </div>
                    <div className="h-12" />
                    <div className="flex flex-col gap-8 w-full break-inside-avoid break-before-page">
                       <PrintHeader org={org} data={data} reportId={reportId} />
                       <AnnexTab data={data} />
                       <PrintFooter />
                    </div>
                 </div>
               </>
             )}
          </AnimatePresence>

          <footer className="mt-12 flex justify-between items-center opacity-30 text-[9px] uppercase font-bold tracking-[0.3em] text-gray-400 print:hidden">
             <span>Profitability Firewall | Industrial Grade Forensic Audit</span>
             <span>*Cálculo basado en el Modelo Forense de Nivel 2, diseñado bajo marcos de eficiencia operativa B2B.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

// --- Sub-Tabs Components ---

function AnimatedNumber({ value, suffix = "", prefix = "", decimals = 0 }: { value: number, suffix?: string, prefix?: string, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function ScoreCardTab({ data }: { data: ForensicReportData }) {
  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      {/* Left Column: Title Section */}
      <div className="col-span-12 lg:col-span-4 flex flex-col justify-center gap-5 py-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 12 }}
            transition={{ type: "spring", damping: 10 }}
            className="w-14 h-14 rounded-2xl bg-erani-purple/10 flex items-center justify-center border border-erani-purple/20 shadow-lg shadow-erani-purple/10 ml-2"
          >
             <TrendingUp className="w-7 h-7 text-erani-purple" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black uppercase leading-[1.0] tracking-tight text-foreground"
          >
            Profitability <br />
            <span className="text-erani-purple drop-shadow-[0_0_20px_rgba(158,128,255,0.4)]">Firewall</span> <br />
            Report
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase"
          >
             <div className="w-10 h-[2px] bg-erani-purple/40" /> {data.projectName}
          </motion.div>
      </div>

      {/* Right Column: Cards Grid */}
      <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Direct Impact Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-1 md:col-span-2 glassmorphism p-10 rounded-[3rem] border border-glass-border flex justify-between items-start group hover:border-erani-purple/30 transition-all duration-500 shadow-2xl relative overflow-hidden"
          >
              <div className="absolute top-0 right-0 w-32 h-32 bg-erani-purple/5 blur-3xl -z-10" />
              <div className="flex flex-col gap-2">
                 <span className="text-[11px] uppercase font-black tracking-widest text-gray-500">Impacto Directo</span>
                 <span className="text-5xl font-black text-foreground">
                    <AnimatedNumber value={data.impactoDirecto} prefix="$" suffix=".00 MXN" />
                 </span>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-erani-coral animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-erani-coral">Fuga Confirmada</span>
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                 <span className="text-[11px] uppercase font-black tracking-widest text-gray-500">Impacto Futuro</span>
                 <span className="text-3xl font-black text-gray-400">
                    <AnimatedNumber value={data.impactoFuturo} prefix="$" suffix=".00 MXN" />
                 </span>
                 <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Riesgo Latente Mensual</span>
              </div>
          </motion.div>

          {/* Scope Creep Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glassmorphism p-10 rounded-[3rem] border border-glass-border flex flex-col items-center justify-center gap-6 text-center group hover:border-erani-purple/30 transition-all duration-500 relative overflow-hidden"
          >
              <div className="absolute inset-0 bg-gradient-to-b from-erani-purple/5 to-transparent -z-10" />
              <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-erani-coral to-erani-purple">
                <AnimatedNumber value={data.scopeCreep} suffix="%" />
              </span>
              <div className="flex flex-col gap-1">
                 <span className="text-[11px] uppercase font-black tracking-widest text-foreground">Desviación Total</span>
                 <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">(Scope Creep)</span>
              </div>
          </motion.div>

          {/* Profitability Point Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glassmorphism p-10 rounded-[3rem] border border-glass-border flex flex-col gap-10 group hover:border-erani-blue/30 transition-all duration-500 relative overflow-hidden"
          >
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-erani-blue/5 blur-3xl -z-10" />
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase font-black tracking-widest text-gray-500">Conciencia de Rentabilidad</span>
                <span className="text-4xl font-black text-foreground">
                  <AnimatedNumber value={data.rentabilidadPoint} prefix="$" suffix=".00 MXN" />
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Punto de Equilibrio (Regla de Tercios)</span>
              </div>
              <div className="flex flex-col gap-2 border-t border-glass-border pt-8">
                <span className="text-[11px] uppercase font-black tracking-widest text-gray-500">COI Anual</span>
                <span className="text-3xl font-black text-gray-400">
                  <AnimatedNumber value={data.coiAnual} prefix="$" suffix=".00 MXN" />
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">(Costo de Inacción)</span>
              </div>
          </motion.div>
      </div>
    </div>
  );
}

function AnalysisTab({ tickets, data }: { tickets: ForensicTicket[], data: ForensicReportData }) {
  const getStatusColor = (status: ForensicTicket['status']) => {
    switch(status) {
      case 'execution': return 'bg-emerald-500';
      case 'blindspot': return 'bg-amber-500';
      case 'capital_leak': return 'bg-erani-coral';
    }
  };

  return (
    <div className="flex flex-col gap-8">
       <h3 className="text-2xl font-black uppercase tracking-tight text-foreground text-center mb-4">Análisis Forense</h3>
       
       <div className="glassmorphism rounded-[2.5rem] border border-glass-border overflow-hidden">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="border-b border-white/5 bg-white/5">
                   <th className="px-8 py-6 text-[10px] uppercase font-black tracking-widest text-gray-500">Ticket ID</th>
                   <th className="px-8 py-6 text-[10px] uppercase font-black tracking-widest text-gray-500">Descripción</th>
                   <th className="px-8 py-6 text-[10px] uppercase font-black tracking-widest text-gray-500">Tipo / Filtro</th>
                   <th className="px-8 py-6 text-[10px] uppercase font-black tracking-widest text-gray-500 text-right">Hrs Calc</th>
                   <th className="px-8 py-6 text-[10px] uppercase font-black tracking-widest text-gray-500 text-right">Costo Invisible</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {tickets.length > 0 ? tickets.map((ticket, i) => (
                   <tr key={`${ticket.id}-${i}`} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                         <span className="px-3 py-1.5 rounded-lg bg-erani-coral/10 text-erani-coral text-[10px] font-mono font-bold border border-erani-coral/20">
                           {ticket.id}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-gray-300">{ticket.description}</td>
                      <td className="px-8 py-5 text-xs font-mono text-slate-600 dark:text-gray-500">[{ticket.filter}]</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-gray-300 text-right">{ticket.hrs}</td>
                      <td className="px-8 py-5 text-sm font-bold text-erani-coral text-right">
                        <AnimatedNumber value={ticket.cost} prefix="$" suffix=".00" />
                      </td>
                   </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-xs uppercase font-black tracking-widest text-gray-600 opacity-50">
                       Esperando Hidratación de Datos de Erani Engine...
                    </td>
                  </tr>
                )}
             </tbody>
             {tickets.length > 0 && (
                <tfoot className="bg-foreground/5 border-t border-glass-border">
                   <tr className="font-black">
                      <td className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-black dark:text-white">Total</td>
                      <td colSpan={2} className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-slate-600 dark:text-gray-500 text-center">Total Conciliado</td>
                      <td className="px-8 py-6 text-sm text-slate-800 dark:text-gray-300 text-right">
                        <AnimatedNumber value={tickets.reduce((acc, t) => acc + t.hrs, 0)} decimals={1} />
                      </td>
                      <td className="px-8 py-6 text-lg text-erani-coral text-right">
                        <AnimatedNumber value={tickets.reduce((acc, t) => acc + t.cost, 0)} prefix="$" />
                      </td>
                   </tr>
                </tfoot>
             )}
          </table>
          <div className="flex justify-between items-start gap-12 px-8 py-8 border-t border-white/5">
             <div className="flex flex-col gap-4 max-w-2xl text-[10px] font-bold leading-relaxed text-gray-500">
                <p>Fuga Externa (Cliente): <AnimatedNumber value={data.resumenConsolidacion.fugaExterna} prefix="$" suffix=".00 MXN" /></p>
                <p>Fuga Interna (Equipo): <AnimatedNumber value={data.resumenConsolidacion.fugaInterna} prefix="$" suffix=".00 MXN" /></p>
                <p className="opacity-50 font-medium">Estado del Inventario: {data.resumenConsolidacion.estadoInventario}</p>
             </div>
             <div className="flex flex-col gap-3">
                {[
                  { label: "Desviación con evidencia directa de ejecución", color: "bg-emerald-500" },
                  { label: "Trabajo ejecutado sin registro (Blind Spot operativo)", color: "bg-amber-500" },
                  { label: "Fuga de capital por falta de cierre o desviación masiva", color: "bg-erani-coral" },
                ].map((leg, i) => (
                  <div key={i} className="flex items-center gap-3 text-[9px] uppercase font-black tracking-widest text-gray-400">
                     <div className={`w-3 h-3 rounded-full ${leg.color}`} /> {leg.label}
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}

function HealthKpisTab({ data }: { data: ForensicReportData }) {
  return (
    <div className="flex flex-col gap-8">
       <h3 className="text-2xl font-black uppercase tracking-tight text-foreground text-center mb-4">KPIs de Salud Operativa</h3>
       
       <div className="grid grid-cols-12 gap-6">
          {/* Loop Monitor */}
          <div className="col-span-12 md:col-span-4 glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-8">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-gray-300">Monitor de Bucle de Revisiones</span>
             </div>
             <div className="flex items-center justify-center relative py-8">
                <div className="text-4xl font-black text-black dark:text-white">
                  <AnimatedNumber value={data.kpiRevisiones} suffix="%" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                   <motion.div 
                     initial={{ rotate: 0 }}
                     animate={{ rotate: 360 }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="w-32 h-32 rounded-full border-[12px] border-white/5 border-t-[#9e80ff]" 
                   />
                </div>
             </div>
             <p className="text-[10px] font-bold text-gray-500 leading-relaxed text-center">
                {data.cegueraOperativa || "Inferencia de bucles en proceso..."}
             </p>
          </div>

          {/* Talent Friction & Dark Data */}
          <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
             <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/5 grid grid-cols-2 gap-12">
                <div className="flex flex-col gap-6 border-r border-glass-border pr-12">
                   <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-gray-300">Índice de Fricción de Talento</span>
                   <div className="text-4xl font-black text-black dark:text-white">
                      <AnimatedNumber value={data.kpiFriccionTalento} suffix="%" />
                   </div>
                   <div className="w-full bg-white/5 h-2 rounded-full relative overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.kpiFriccionTalento}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-[#9e80ff]" 
                      />
                   </div>
                   <p className="text-[9px] font-medium text-gray-600 leading-relaxed">
                     Análisis de latencia operativa detectado por el motor Erani.
                   </p>
                </div>
                <div className="flex flex-col gap-6">
                   <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-6">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-gray-300">Índice de Datos Oscuros (Dark Data Index)</span>
                        <div className="text-4xl font-black text-black dark:text-white">
                          <AnimatedNumber value={data.kpiDarkData} suffix="%" />
                        </div>
                      </div>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-full border-8 border-[#9e80ff]/20 border-t-[#9e80ff]" 
                      />
                   </div>
                   <p className="text-[9px] font-medium text-gray-600 leading-relaxed">
                     Detección de metadata no registrada manualmente.
                   </p>
                </div>
             </div>

             <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-2 max-w-md">
                   <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-gray-300">Intensidad de Scope Creep</span>
                   <p className="text-[9px] font-medium text-slate-600 dark:text-gray-600 leading-relaxed">
                     Desviación presupuestal por solicitudes fuera de SOW.
                   </p>
                </div>
                <div className="flex items-center gap-6">
                   <span className="text-3xl font-black text-black dark:text-white">
                      <AnimatedNumber value={data.scopeCreep} suffix="%" />
                   </span>
                   <div className="w-32 h-10 relative">
                      <div className="absolute inset-0 bg-white/5 rounded-full" />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.scopeCreep}%` }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="absolute left-0 top-0 bottom-0 bg-[#9e80ff]/30 rounded-full" 
                      />
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function FirewallTab({ data }: { data: ForensicReportData }) {
  return (
    <div className="flex flex-col gap-10">
       <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-black uppercase text-black dark:text-white tracking-tight">El Firewall</h3>
          <p className="text-xs uppercase font-bold tracking-widest text-slate-600 dark:text-gray-500">Recomendaciones del Sistema</p>
       </div>

       <div className="grid grid-cols-2 gap-8">
          <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-4">
             <div className="flex items-center gap-3 text-erani-purple">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[10px] uppercase font-black tracking-widest">Protocolos de Bloqueo</span>
             </div>
             <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                {data.firewallProtocolos}
             </p>
          </div>
          <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-4">
             <div className="flex items-center gap-3 text-emerald-500">
                <Zap className="w-5 h-5" />
                <span className="text-[10px] uppercase font-black tracking-widest">ROI de Automatización</span>
             </div>
             <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                Al detener el "Pilón" sistemático, la inversión en el Firewall se recupera en los primeros {data.firewallRoi} días de operación blindada. <br /><br />
                Se proyecta una estabilización del margen neto optimizada según el análisis forense.
             </p>
          </div>
       </div>

       <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 glassmorphism p-10 rounded-[2.5rem] border border-white/5 flex flex-col gap-8">
             <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">Impacto del Fiscalizador Automático (n8n)</span>
                <span className="text-xl font-black text-emerald-500">30%</span>
             </div>
             
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={data.firewallImpact}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#9e80ff" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: "#fff" }} 
                        activeDot={{ r: 8 }} 
                        animationDuration={2000}
                        animationEasing="ease-in-out"
                      />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="col-span-4 glassmorphism p-10 rounded-[2.5rem] border border-white/5 flex flex-col gap-8">
             <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">Evolución del Margen</span>
             <div className="flex flex-col gap-6">
                {data.margenEvolucion.map((step, i) => (
                  <div key={i} className="flex flex-col gap-2">
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-white">{step.month}:</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{step.desc}</span>
                     </div>
                     <div className="text-lg font-black text-erani-blue">{step.value}</div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}

function AnnexTab({ data }: { data: ForensicReportData }) {
  return (
    <div className="flex flex-col gap-10">
       <div className="grid grid-cols-2 gap-10">
          <div className="flex flex-col gap-6">
             <h4 className="text-sm font-black uppercase tracking-widest text-erani-purple flex items-center gap-3">
                <ShieldAlert className="w-4 h-4" />
                Frameworks de Sustento
             </h4>
             <ul className="flex flex-col gap-3">
                {data.anexoFrameworks.length > 0 ? data.anexoFrameworks.map((f, i) => (
                  <li key={i} className="text-[10px] font-bold text-gray-400 flex items-start gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-erani-purple mt-1 flex-shrink-0" />
                     {f}
                  </li>
                )) : (
                  <li className="text-[10px] font-medium text-gray-600">Cargando marcos metodológicos...</li>
                )}
             </ul>
          </div>
          <div className="flex flex-col gap-6">
             <h4 className="text-sm font-black uppercase tracking-widest text-erani-blue flex items-center gap-3">
                <FileText className="w-4 h-4" />
                Glosario de Términos
             </h4>
             <ul className="flex flex-col gap-3">
                {data.anexoGlosario.length > 0 ? data.anexoGlosario.map((g, i) => (
                  <li key={i} className="text-[10px] font-bold text-gray-400 flex items-start gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-erani-blue mt-1 flex-shrink-0" />
                     {g}
                  </li>
                )) : (
                  <li className="text-[10px] font-medium text-gray-600">Cargando glosario técnico...</li>
                )}
             </ul>
          </div>
       </div>
       
       <div className="flex flex-col items-center justify-center py-10 gap-6 opacity-50 border-t border-white/5 mt-10">
          <div className="flex flex-col items-center gap-2">
             <span className="text-xs uppercase font-black tracking-[0.5em] text-gray-500">Anexo Técnico Detallado</span>
             <p className="text-[10px] font-bold text-gray-600">Exportación de Metadata Cruda para Auditoría Externa</p>
          </div>
          <button 
             onClick={() => window.print()}
             className="px-8 py-4 rounded-xl border border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest hover:border-white/30 transition-all"
          >
             Generar PDF de Evidencia
          </button>
       </div>
    </div>
  );
}

// --- Print Components ---

function PrintHeader({ org, data, reportId }: { org: any, data: ForensicReportData, reportId: string | null }) {
  const isBeta = org?.plan?.toLowerCase().includes('beta') || org?.paid_subscription;
  const logoUrl = isBeta && org?.logo_url ? org.logo_url : null;

  return (
    <div className="flex justify-between items-start pb-6 mb-8 border-b border-gray-200 dark:border-white/10 break-inside-avoid w-full">
       <div className="flex flex-col gap-2">
          {logoUrl ? (
             <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
          ) : (
             <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-erani-purple" />
                <span className="text-xl font-black tracking-widest uppercase">ERANI ENGINE</span>
             </div>
          )}
          <h2 className="text-lg font-black uppercase mt-4 text-foreground">{data.projectName}</h2>
          {reportId && <span className="text-[9px] uppercase font-bold text-gray-500">ID Reporte: {reportId}</span>}
       </div>
       <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-[10px] font-black uppercase text-erani-purple">Profitability Firewall Report</span>
          <span className="text-[8px] font-bold text-gray-400">{new Date().toLocaleDateString('es-MX')}</span>
       </div>
    </div>
  );
}

function PrintFooter() {
  return (
    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col gap-6 text-[9px] text-gray-500 break-inside-avoid w-full">
       <div className="flex justify-between items-center font-bold uppercase tracking-widest">
          <a href="https://erani.mx" target="_blank" rel="noopener noreferrer" className="text-erani-blue hover:underline">erani.mx</a>
          <span>Soporte: contacto@erani.mx</span>
       </div>
       <p className="text-[8px] text-justify opacity-60 leading-relaxed">
         CONFIDENCIALIDAD Y SOBERANÍA DE DATOS: Este documento de Análisis Forense Operacional ha sido generado
         por el Motor de Inferencia Erani bajo protocolos estrictos de privacidad. La información aquí contenida es estrictamente 
         confidencial y para uso exclusivo del destinatario. Erani opera procesando únicamente vectores de metadata cifrados 
         y no almacena texto legible ni información de identificación personal en texto claro. 
         La distribución no autorizada de este documento está estrictamente prohibida.
       </p>
    </div>
  );
}

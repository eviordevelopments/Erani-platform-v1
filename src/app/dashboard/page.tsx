"use client";

import { motion, Reorder } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import DonutChart from "@/components/DonutChart";
import SankeyDiagram from "@/components/SankeyDiagram";
import ReportDownloader from "@/components/ReportDownloader";
import InAppTour from "@/components/InAppTour";
import WidgetContainer from "@/components/widgets/WidgetContainer";
import WidgetLibrarySidebar from "@/components/WidgetLibrarySidebar";
import { useDashboard, mapPayloadToInsights } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { WIDGET_REGISTRY } from "@/config/widgetRegistry";
import { Loader2, AlertCircle, Info, ArrowUpRight, TrendingUp, Layers, CheckCircle, Zap, PlusCircle, AlertTriangle, Pin, Trash2 } from "lucide-react";
import { ChartRenderer } from "@/components/chat/ChatInterface";

function Spinner() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-erani-purple/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="flex flex-col items-center gap-6 relative z-10">
         <Image src="/isologo.png" alt="Cargando..." width={64} height={64} className="object-contain animate-pulse logo-adaptive drop-shadow-[0_0_15px_rgba(116,4,255,0.5)]" />
         <p className="text-sm uppercase tracking-widest font-black text-gray-400">Iniciando Dashboard...</p>
      </div>
    </div>
  );
}

function getCardContent(widgetKey: string, insights: any, isLive: boolean) {
  if (widgetKey === "sankey") {
    return (
      <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between border-b border-glass-border pb-4">
              <h2 className="text-xs uppercase font-black tracking-widest text-nav-text">Evolución de Rendimiento Financiero</h2>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                  Rescate de ROI Proyectado
              </span>
          </div>
          <div className="flex-1 mt-4">
            <SankeyDiagram data={insights?.revenueData} />
          </div>
          {isLive && insights && (
             <div className="mt-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500/60">Recuperación Estimada</span>
                <span className="text-sm font-black text-emerald-500">${insights.roiRecovered?.toLocaleString() || 0}</span>
             </div>
          )}
      </div>
    );
  }

  if (widgetKey === "dark-data") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 h-full text-center">
          <h2 className="text-xs uppercase font-black tracking-widest text-nav-text w-full">Dark Data Index</h2>
          <DonutChart 
            percentage={insights?.darkDataIndex ?? 90} 
            label="Dark Data" 
            color="#FF5C5C" 
            size={160} 
            strokeWidth={20} 
          />
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-relaxed">
               {isLive && insights 
                 ? `${insights.tasksWithoutEstimate} de ${insights.totalTasks} tareas no registradas manualmente.` 
                 : "El 90% de la metadata operativa no estaba registrada manualmente."}
            </p>
            <span className="text-[8px] font-black text-erani-coral uppercase tracking-tighter">Inferencia N2 Activa</span>
          </div>
      </div>
    );
  }

  if (widgetKey === "scope-creep") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 h-full text-center">
          <h2 className="text-xs uppercase font-black tracking-widest text-nav-text w-full">Intensidad de Scope Creep</h2>
          <DonutChart 
            percentage={insights?.scopeCreepPct ?? 50} 
            label="Scope Creep" 
            color="#9e80ff" 
            size={140} 
            strokeWidth={16} 
          />
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-relaxed">
               {isLive && insights 
                 ? `${insights.scopeCreepPct}% de la fuga atribuible a extensiones no presupuestadas.`
                 : "50% de la fuga atribuible a extensiones no presupuestadas sin Time Estimate."}
            </p>
            <span className="text-[8px] font-black text-erani-purple uppercase tracking-tighter">Fuga Triangulada</span>
          </div>
      </div>
    );
  }

  if (widgetKey === "alerts") {
    return (
      <div className="flex flex-col gap-4 h-full">
         <div className="flex items-center justify-between border-b border-glass-border pb-4">
              <h2 className="text-xs uppercase font-black tracking-widest text-nav-text">Intruder Alerts (Firewall Activo)</h2>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-1 rounded bg-erani-blue/10 text-erani-blue animate-pulse">
                  Real-Time Forensic
              </span>
         </div>
         <div className="flex flex-col gap-3">
             {(insights?.alerts || [
                { id: "1", ticket: "ODS-401", description: "Ticket sin Time Estimate creado en Jira", riskLevel: "high" },
                { id: "2", ticket: "REQ-22", description: "Mensaje en Slack sugiere cambio de alcance", riskLevel: "medium" }
             ]).map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-foreground/5 transition-all hover:bg-foreground/10 group/alert">
                      <div className="flex items-center gap-4">
                         <span className={`font-mono text-[10px] px-2 py-1 rounded ${
                           alert.riskLevel === 'high' || alert.riskLevel === 'critical' ? 'bg-erani-coral/10 text-erani-coral' : 'bg-erani-purple/10 text-erani-purple'
                         }`}>{alert.ticket}</span>
                         <span className="text-xs font-bold text-foreground line-clamp-1">{alert.description}</span>
                      </div>
                      <Info className="w-3 h-3 text-nav-text group-hover/alert:text-foreground cursor-help" />
                  </div>
             ))}
         </div>
      </div>
    );
  }

  const registryWidget = WIDGET_REGISTRY.find(w => w.id === widgetKey);
  return registryWidget ? registryWidget.mockComponent : <div className="text-nav-text text-sm">Widget no encontrado: "{String(widgetKey)}"</div>;
}

function LiveWidgetWrapper({ config, globalInsights }: { config: any, globalInsights: any }) {
  const [projectInsights, setProjectInsights] = useState<any>(null);
  const [loading, setLoading] = useState(!!config.projectId);

  useEffect(() => {
    if (!config.projectId) {
       setProjectInsights(null);
       setLoading(false);
       return;
    }
    let isMounted = true;
    const fetchProj = async () => {
       setLoading(true);
       const { data } = await supabase
         .from('forensic_reports')
         .select('payload_completo')
         .eq('project_id', config.projectId)
         .order('created_at', { ascending: false })
         .limit(1)
         .maybeSingle();

       if (isMounted) {
         if (data && data.payload_completo) {
            setProjectInsights(mapPayloadToInsights(data.payload_completo));
         } else {
            setProjectInsights(null);
         }
         setLoading(false);
       }
    };
    fetchProj();
    return () => { isMounted = false; };
  }, [config.projectId]);

  // If a specific project is requested, we strictly use its insights (or lack thereof)
  // Otherwise, we use the global organization insights.
  const activeInsights = config.projectId ? projectInsights : globalInsights;
  const isLive = !!activeInsights && Object.keys(activeInsights).length > 0;

  if (loading) {
     return (
       <div className="h-full flex flex-col items-center justify-center gap-4">
         <Image src="/isologo.png" alt="Cargando..." width={48} height={48} className="object-contain animate-pulse logo-adaptive" />
         <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue">Sincronizando...</span>
       </div>
     );
  }

  return getCardContent(config.widgetKey || config.type, activeInsights, isLive);
}

export default function DashboardPage() {
  const { insights, processingState, bentoOrder, updateBentoOrder, isSidebarCollapsed, storageStats } = useDashboard();
  const { profile, user, loading, org } = useAuth();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [pinnedCharts, setPinnedCharts] = useState<any[]>([]);

  // Dashboard state can be "live" or "demo"
  const isLive = !!insights;

  // Realtime Sync for Pinned Interactive Charts from Chat
  useEffect(() => {
    const syncPinned = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("erani_pinned_charts");
        if (saved) {
          try {
            setPinnedCharts(JSON.parse(saved));
          } catch {}
        } else {
          setPinnedCharts([]);
        }
      }
    };
    syncPinned();
    window.addEventListener("storage", syncPinned);
    return () => window.removeEventListener("storage", syncPinned);
  }, []);

  const handleUnpinChart = (chartTitle: string) => {
    const updated = pinnedCharts.filter(c => c.title !== chartTitle);
    setPinnedCharts(updated);
    localStorage.setItem("erani_pinned_charts", JSON.stringify(updated));
  };

  // Guard for loading profile data
  if (loading) return <Spinner />;

  if (!profile) {
    // Profile may still be propagating (e.g. first-time member onboarding).
    // Auto-retry after 2s before showing an error.
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="glassmorphism p-8 rounded-2xl border border-glass-border flex flex-col items-center gap-4 text-center max-w-sm">
          <Loader2 className="w-10 h-10 text-erani-blue animate-spin" />
          <h2 className="text-lg font-black uppercase tracking-widest text-foreground">
            Configurando tu sesión
          </h2>
          <p className="text-xs text-nav-text font-medium leading-relaxed">
            Estamos preparando tu espacio de trabajo...
          </p>
          <button
            onClick={() => window.location.reload()}
            className="button-premium px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const userName = (profile?.full_name || user?.user_metadata?.fullName || "Usuario").split(' ')[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-8 relative overflow-x-hidden`}>
        
        <div className="max-w-[1600px] flex flex-col gap-8">
          
          <div className="flex flex-col gap-6">
            <motion.div 
               id="tour-verify-dashboard"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex flex-col gap-1"
            >
               <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold uppercase tracking-widest text-nav-text whitespace-nowrap">
                     Bienvenido a ERANI,
                  </span>
                  <span 
                    className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral animate-gradient-x drop-shadow-[0_0_12px_rgba(158,128,255,0.8)] uppercase tracking-widest"
                    style={{ backgroundSize: '200% auto' }}
                  >
                     {userName}
                  </span>
               </div>
            </motion.div>
            
            {/* Storage Warning Banner */}
            {storageStats?.isCritical && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-erani-coral/10 border border-erani-coral/30 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_0_20px_rgba(255,92,92,0.15)] gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-erani-coral/20 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-erani-coral animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-erani-coral">Almacenamiento Crítico ({storageStats.usedGB.toFixed(2)}GB / {storageStats.limitGB}GB)</h3>
                    <p className="text-xs text-foreground font-medium mt-1">
                      {storageStats.isFull 
                        ? "Has alcanzado el límite máximo. No podrás crear nuevos proyectos ni cargar evidencia. Elimina archivos o mejora tu plan." 
                        : "Estás a punto de quedarte sin espacio. Libera espacio pronto o adquiere un plan ERANI Cloud."}
                    </p>
                  </div>
                </div>
                <Link href="/subscription" className="px-6 py-4 bg-erani-coral text-white rounded-xl text-[10px] uppercase font-black tracking-widest hover:scale-105 transition-transform whitespace-nowrap shadow-lg shadow-erani-coral/20">
                  Gestionar Espacio
                </Link>
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                 <h1 className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-4">
                    Auditoría Forense Activa
                    {processingState === "parsing" || processingState === "computing" ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-erani-blue/10 border border-erani-blue/20">
                        <Loader2 className="w-3 h-3 text-erani-blue animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue">Actualizando...</span>
                      </div>
                    ) : isLive ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Data</span>
                      </div>
                    ) : null}
                 </h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  id="tour-widget-library"
                  onClick={() => setIsLibraryOpen(true)}
                  className="px-5 py-4 rounded-xl border border-erani-purple/30 bg-erani-purple/10 text-erani-purple hover:bg-erani-purple/20 text-[10px] uppercase font-black tracking-widest flex items-center gap-2 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Personalizar
                </button>
                <button 
                  id="tour-sync"
                  onClick={() => window.location.reload()}
                  className="button-premium px-6 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center gap-3"
                >
                  <Zap className="w-4 h-4" />
                  Sincronizar
                </button>
              </div>
            </div>
          </div>

          {/* Pinned Interactive AI Charts Section */}
          {pinnedCharts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 w-full p-6 glassmorphism rounded-3xl border border-glass-border shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-glass-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Pin className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xs uppercase font-black tracking-widest text-foreground">
                      Gráficas Fijadas del Agente Forense
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Visualizaciones interactivas fijadas desde el Chat de IA
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                  {pinnedCharts.length} {pinnedCharts.length === 1 ? 'Gráfica Fijada' : 'Gráficas Fijadas'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
                {pinnedCharts.map((chartItem) => (
                  <div key={chartItem.id} className="glassmorphism rounded-3xl border border-glass-border p-4 shadow-lg flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-glass-border/60 px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 line-clamp-1">
                          {chartItem.title || "Gráfica Fijada"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnpinChart(chartItem.title)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 shrink-0"
                        title="Desfijar del Dashboard"
                      >
                        <Trash2 className="w-3 h-3" /> Desfijar
                      </button>
                    </div>
                    <ChartRenderer>
                      {JSON.stringify({ type: chartItem.type, title: chartItem.title, data: chartItem.data })}
                    </ChartRenderer>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* trial or frozen banners based on eris_logic.md */}
          {org && !org.paid_subscription && (profile?.eris_balance ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-6 rounded-3xl overflow-hidden border border-erani-purple/20 bg-gradient-to-r from-erani-purple/10 via-foreground/5 to-erani-blue/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-erani-purple/5"
            >
              <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-erani-purple/20 text-erani-purple text-[8px] font-black uppercase tracking-widest border border-erani-purple/30">
                    Modo Trial
                  </span>
                  <span className="text-nav-text text-[10px] font-black uppercase tracking-widest">
                    {profile?.eris_balance ?? 20} ERIS Restantes
                  </span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Estás utilizando una cuenta de prueba de ERANI
                </h3>
                <p className="text-xs text-nav-text max-w-xl font-medium leading-relaxed">
                  Para desbloquear el Firewall de Rentabilidad, 100 ERIS de balance y eliminar las restricciones de proyectos y auditorías, activa tu suscripción de ERANI Beta con tu código de adquisición o adquiere una nueva.
                </p>
              </div>

              <div className="flex items-center gap-3 relative z-10 shrink-0">
                <Link
                  id="tour-validate-code"
                  href="/subscription/activate"
                  className="button-premium px-5 py-3.5 rounded-xl text-[9px] uppercase font-black tracking-widest"
                >
                  Validar Código
                </Link>
                <Link
                  id="tour-acquire-plan"
                  href="/subscription"
                  className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] uppercase font-black tracking-widest transition-all"
                >
                  Adquirir Plan
                </Link>
              </div>
            </motion.div>
          )}

          {org && (profile?.eris_balance ?? 0) === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-6 rounded-3xl overflow-hidden border border-erani-coral/20 bg-gradient-to-r from-erani-coral/10 via-foreground/5 to-erani-coral/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-erani-coral/5"
            >
              <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-erani-coral/20 text-erani-coral text-[8px] font-black uppercase tracking-widest border border-erani-coral/30 animate-pulse">
                    Espacio Congelado
                  </span>
                  <span className="text-nav-text text-[10px] font-black uppercase tracking-widest">
                    0 ERIS
                  </span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Tu balance de ERIS se ha agotado
                </h3>
                <p className="text-xs text-nav-text max-w-xl font-medium leading-relaxed">
                  Las auditorías forenses, la creación de nuevos proyectos y las consultas al agente forense se encuentran pausadas. Activa o adquiere una suscripción de ERANI Beta para reanudar la operación.
                </p>
              </div>

              <div className="flex items-center gap-3 relative z-10 shrink-0">
                <Link
                  href="/subscription/activate"
                  className="button-premium px-5 py-3.5 rounded-xl text-[9px] uppercase font-black tracking-widest"
                >
                  Validar Código
                </Link>
                <Link
                  href="/subscription"
                  className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] uppercase font-black tracking-widest transition-all"
                >
                  Adquirir Plan
                </Link>
              </div>
            </motion.div>
          )}

          {/* DRAGGABLE BENTO GRID OR PREMIUM EMPTY STATE */}
          {!isLive ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphism p-12 flex flex-col items-center justify-center text-center gap-8 rounded-[2.5rem] border border-glass-border relative overflow-hidden min-h-[500px]"
            >
              {/* Design glows inside the card */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-erani-purple/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-erani-blue/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="p-5 rounded-full bg-erani-purple/10 border border-erani-purple/20 text-erani-purple animate-pulse">
                <AlertCircle className="w-12 h-12" />
              </div>

              <div className="flex flex-col gap-3 max-w-xl relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral">
                  Esperando Evidencia Forense
                </h2>
                <p className="text-sm font-medium text-nav-text leading-relaxed">
                  Para diagnosticar tus fugas de rentabilidad y activar el Firewall de Rentabilidad, necesitamos procesar los registros de tus herramientas (Jira, Slack, Notion o ClickUp).
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch max-w-3xl w-full relative z-10 mt-4">
                {[
                  {
                    step: "01",
                    title: "Descargar Reporte",
                    desc: "Exporta la actividad o base de datos de Jira, Slack o Notion en formato CSV/JSON."
                  },
                  {
                    step: "02",
                    title: "Subir Evidencia",
                    desc: "Carga los archivos en el Protocolo de Auditoría para que nuestro motor forense los procese."
                  },
                  {
                    step: "03",
                    title: "Firewall Activo",
                    desc: "Inferencia L2 de Erani Engine mapeará las fugas de tiempo y costos ocultos en tiempo real."
                  }
                ].map((s, idx) => (
                  <div key={idx} className="flex-1 p-6 rounded-2xl border border-white/5 bg-foreground/5 flex flex-col gap-3 text-left hover:bg-foreground/10 transition-colors">
                    <span className="text-xs font-black tracking-widest text-erani-blue">{s.step}</span>
                    <h3 className="text-xs uppercase font-black tracking-wider text-foreground">{s.title}</h3>
                    <p className="text-[11px] font-medium text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4 mt-4">
                <Link
                  href="/audit"
                  className="button-premium px-10 py-5 rounded-2xl text-xs uppercase tracking-widest font-black flex items-center gap-3 shadow-xl shadow-erani-purple/20 hover:scale-105 transition-transform"
                >
                  Configurar Primera Auditoría <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <Reorder.Group 
                axis="y" 
                values={bentoOrder} 
                onReorder={updateBentoOrder}
                id="bento-report-grid" 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-2 bg-background relative"
              >
                  {bentoOrder.map((config) => (
                    <WidgetContainer key={config.id} config={config}>
                      <LiveWidgetWrapper config={config} globalInsights={insights} />
                    </WidgetContainer>
                  ))}
              </Reorder.Group>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Tasks Analizados", val: insights?.totalTasks ?? 0, icon: Layers },
                    { label: "Dark Data ROI Leak", val: `$${((insights?.tasksWithoutEstimate ?? 0) * 280).toLocaleString()}`, icon: TrendingUp },
                    { label: "Scope Creep ROI Leak", val: `$${((insights?.scopeCreepTasks ?? 0) * 672).toLocaleString()}`, icon: ArrowUpRight },
                    { label: "ROI Recuperable", val: `$${(insights?.roiRecovered ?? 0).toLocaleString()}`, icon: CheckCircle },
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="glassmorphism p-6 flex flex-col gap-2 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <stat.icon className="w-3 h-3 text-erani-blue" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-nav-text">{stat.label}</span>
                      </div>
                      <span className="text-2xl font-black text-foreground">{stat.val}</span>
                    </motion.div>
                  ))}
              </div>
            </>
          )}
        </div>
        <InAppTour 
          tourKey="dashboard" 
          isSubscriptionActive={org?.paid_subscription || false}
          steps={[
            { targetId: "tour-verify-dashboard", title: "Verificar Dashboard", content: "Aquí puedes ver el estado general de tu cuenta y la auditoría forense actual." },
            { targetId: "tour-sync", title: "Botón Sincronizar", content: "Utiliza este botón para recargar y sincronizar tus datos más recientes en tiempo real.", position: "bottom" },
            { targetId: "tour-widget-library", title: "Personalizar Dashboard", content: "Abre la Biblioteca de Widgets para añadir métricas predictivas, gráficos forenses y adaptar tu Firewall de Rentabilidad.", position: "bottom" },
            { targetId: "tour-validate-code", title: "Validar Código", content: "Si tienes un código de acceso de tu organización, valídalo aquí para activar tu suscripción y obtener 100 ERIS.", position: "left" },
            { targetId: "tour-acquire-plan", title: "Adquirir Plan", content: "Actualiza tu plan para desbloquear operaciones ilimitadas y el máximo nivel de seguridad.", position: "left" },
            { targetId: "tour-nav-audit", title: "Auditoría Forense", content: "Navega aquí para generar tu primer protocolo de auditoría e investigar fugas en tus proyectos.", position: "right" },
            { targetId: "tour-nav-forensic", title: "Peritaje Forense", content: "Crea y gestiona tus proyectos forenses de forma segura.", position: "right" },
            { targetId: "tour-nav-sessions", title: "Sesiones de Estrategia", content: "Agenda y entra a sesiones de estrategia con tu equipo.", position: "right" },
            { targetId: "tour-nav-marketplace", title: "Automatizaciones", content: "Conecta tus flujos de trabajo con nuestras integraciones automatizadas.", position: "right" },
            { targetId: "tour-nav-services", title: "Erani Services+", content: "Solicita servicios operativos de alto nivel manejados por expertos.", position: "right", isFeaturePlus: true },
            { targetId: "tour-nav-settings", title: "Configuración", content: "Ajusta la configuración de tu cuenta y preferencias.", position: "right" },
            { targetId: "tour-nav-agent", title: "Consultar al Agente", content: "Hazle preguntas al agente de IA sobre tus datos y estrategias.", position: "right" },
            { targetId: "tour-nav-feedback", title: "Feedback y Soporte", content: "Danos tus sugerencias para mejorar y contacta a soporte.", position: "top" }
          ]} 
        />

        {/* Widget Library Sidebar */}
        <WidgetLibrarySidebar 
          isOpen={isLibraryOpen} 
          onClose={() => setIsLibraryOpen(false)} 
          isSubscriptionActive={org?.paid_subscription || false} 
          hasProjects={isLive}
        />
      </main>
    </div>
  );
}

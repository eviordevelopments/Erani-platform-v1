"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import { useDashboard } from "@/context/DashboardContext";
import { ArrowLeft, Bot, AlertTriangle, Activity, Target, Layers, LayoutGrid, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatProvider, useChat } from "@/context/ChatContext";
import ChatInterface from "@/components/chat/ChatInterface";
import DataRoomFilters from "@/components/dataroom/DataRoomFilters";
import DataRoomCharts from "@/components/dataroom/DataRoomCharts";
import DataRoomTable from "@/components/dataroom/DataRoomTable";
import DataRoomGallery from "@/components/dataroom/DataRoomGallery";
import { subDays, startOfYear } from "date-fns";
import Image from "next/image";

interface ForensicReport {
  id: number;
  project_id: string;
  project_name: string;
  impacto_directo: number;
  payload_completo: any;
  created_at: string;
}

export default function DataRoomPage() {
  const params = useParams();
  const collectionId = params?.id as string;
  const roomId = params?.roomId as string;
  const router = useRouter();
  
  const { isSidebarCollapsed } = useDashboard();
  const { profile } = useAuth();

  const [dataRoom, setDataRoom] = useState<any>(null);
  const [reports, setReports] = useState<ForensicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [totalFuga, setTotalFuga] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [automations, setAutomations] = useState<any[]>([]);
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  // Split Pane / Slider State
  const [agentWidth, setAgentWidth] = useState(450);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      // Calculate width from the right edge
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 350 && newWidth <= 900) {
        setAgentWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = 'default';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Filtros Avanzados
  const [viewMode, setViewMode] = useState<'dashboard' | 'table' | 'gallery'>('dashboard');
  const [dateFilter, setDateFilter] = useState('all');
  const [xAxis, setXAxis] = useState<'project' | 'date'>('project');
  const [yAxis, setYAxis] = useState<'impact' | 'alerts'>('impact');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    if (collectionId && roomId && profile?.id) {
      validateAccessAndFetchData();
    }
  }, [collectionId, roomId, profile]);

  const validateAccessAndFetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Data Room to check creator
      const { data: drData, error: drError } = await supabase
        .from('data_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (drError) throw drError;

      // 2. If not creator, check collaborators
      if (drData.created_by !== profile?.id) {
        const { data: collabData, error: collabError } = await supabase
          .from('data_room_collaborators')
          .select('*')
          .eq('data_room_id', roomId)
          .eq('user_id', profile?.id)
          .maybeSingle();

        if (collabError || !collabData) {
          setAccessDenied(true);
          return;
        }
      }

      setDataRoom(drData);

      // 3. Fetch Reports for this collection based on linked_projects
      const { data: colData, error: colError } = await supabase
        .from('collections')
        .select('linked_projects')
        .eq('id', collectionId)
        .single();

      if (colError) throw colError;

      const linkedProjects = colData.linked_projects || [];

      if (linkedProjects.length > 0) {
        const { data: repData, error: repError } = await supabase
          .from('forensic_reports')
          .select('id, project_id, project_name, created_at, payload_completo')
          .in('project_id', linkedProjects);
          
        if (repError) throw repError;

        // Map and extract KPIs
        let totalFugaAcc = 0;
        let alerts = 0;
        let autos: any[] = [];
        
        let localProjectsMap = new Map<string, string>();
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('erani_projects');
            if (stored) {
              JSON.parse(stored).forEach((p: any) => localProjectsMap.set(p.id, p.name));
            }
          } catch(e) {}
        }

        const mapped = (repData || []).map((row: any) => {
           let finalName = localProjectsMap.get(row.project_id) || 
                           row.payload_completo?.report_metadata?.project_name || 
                           row.project_name || "Sin Nombre";
                           
           const payload = row.payload_completo || {};
           
           // Extract Fuga
           const slide2 = payload.slide_2_analisis_forense || {};
           const fugaInterna = slide2?.resumen_consolidacion?.fuga_interna_mxn || 0;
           const fugaExterna = slide2?.resumen_consolidacion?.fuga_externa_mxn || 0;
           const impacto = fugaInterna + fugaExterna;
           totalFugaAcc += impacto;

           // Count some mock alerts based on risk points
           if (impacto > 1000000) alerts += 3;
           else if (impacto > 500000) alerts += 1;

           // Extract automations
           const slide10 = payload.slide_10_analisis_financiero || {};
           const slide11 = payload.slide_11_casos_uso_ai || {};
           
           if (slide11.casos_de_uso && Array.isArray(slide11.casos_de_uso)) {
              slide11.casos_de_uso.forEach((c: any) => {
                 autos.push({ project: finalName, type: 'AI', title: c.area || "Automatización", desc: c.descripcion });
              });
           }

           return { ...row, project_name: finalName, impacto_directo: impacto };
        });

        setReports(mapped);
        setTotalFuga(totalFugaAcc);
        setAlertCount(alerts);
        setAutomations(autos);
      } else {
        setReports([]);
        setTotalFuga(0);
        setAlertCount(0);
        setAutomations([]);
      }

    } catch (err) {
      console.error("Error fetching data room:", err);
      // Might be access denied by RLS
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de reportes en memoria
  const getFilteredReports = () => {
    let filtered = [...reports];
    const now = new Date();
    
    if (dateFilter === '30days') {
      const thirtyDaysAgo = subDays(now, 30);
      filtered = filtered.filter(r => new Date(r.created_at) >= thirtyDaysAgo);
    } else if (dateFilter === 'this_year') {
      const startOfCurrYear = startOfYear(now);
      filtered = filtered.filter(r => new Date(r.created_at) >= startOfCurrYear);
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      // Incluir hasta el final del día de la fecha final
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        const d = new Date(r.created_at);
        return d >= start && d <= end;
      });
    }
    
    return filtered;
  };

  const filteredReports = getFilteredReports();

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
         <div className="flex flex-col items-center gap-4 p-10 glassmorphism border border-glass-border rounded-3xl max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <h1 className="text-xl font-black uppercase tracking-widest">Acceso Denegado</h1>
            <p className="text-sm text-gray-500">No tienes permisos para visualizar este Data Room. Contacta al creador de la colección.</p>
            <button 
              onClick={() => router.push(`/collections/${collectionId}`)}
              className="mt-4 px-6 py-2 bg-foreground/10 hover:bg-foreground/20 rounded-xl text-xs uppercase font-bold transition-colors"
            >
              Volver a Colección
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />

      <main className={`flex-1 transition-all duration-500 overflow-hidden ${isSidebarCollapsed ? "ml-20" : "ml-64"} flex relative`}>
        {/* Gradients */}
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-${dataRoom?.color_tag || 'erani-purple'}/5 blur-[120px] rounded-full pointer-events-none -z-10`} />
        
        {loading ? (
           <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden w-full h-full">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-erani-purple/10 blur-[120px] rounded-full pointer-events-none" />
             <div className="flex flex-col items-center gap-6 relative z-10">
                <Image src="/isologo.png" alt="Cargando..." width={64} height={64} className="object-contain animate-pulse logo-adaptive drop-shadow-[0_0_15px_rgba(116,4,255,0.5)]" />
                <p className="text-sm uppercase tracking-widest font-black text-gray-400">Analizando Datos...</p>
             </div>
           </div>
        ) : !dataRoom ? (
           <div className="flex-1 flex items-center justify-center">
             <p className="text-gray-500 font-bold uppercase tracking-widest">Data Room no encontrado</p>
           </div>
        ) : (
          <div className="flex flex-1 w-full h-full">
            
            {/* LEFT DASHBOARD PANEL */}
            <div className="flex-1 p-6 md:p-8 pl-10 md:pl-16 flex flex-col gap-6 h-screen overflow-y-auto custom-scrollbar">
               {/* Nav & Header */}
               <div className="flex flex-col gap-6">
                 <button 
                   onClick={() => router.push(`/collections/${collectionId}`)}
                   className={`flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-${dataRoom.color_tag} transition-colors w-max`}
                 >
                   <ArrowLeft className="w-4 h-4" /> Volver a Colección
                 </button>
                 
                 <div className="flex items-start justify-between">
                   <div className="flex flex-col gap-2">
                     <span className={`text-[10px] font-black uppercase tracking-widest text-${dataRoom.color_tag} bg-${dataRoom.color_tag}/10 border border-${dataRoom.color_tag}/20 px-3 py-1 rounded-full w-max flex items-center gap-2`}>
                        <Bot className="w-3 h-3" />
                        Data Room Analítico
                     </span>
                     <h1 className="text-3xl font-black uppercase tracking-tight text-foreground pr-4">{dataRoom.name}</h1>
                     {dataRoom.description && (
                       <p className="text-sm text-gray-400 mt-1 max-w-3xl">{dataRoom.description}</p>
                     )}
                   </div>
                 </div>
               </div>

               {/* Filtros */}
               <DataRoomFilters 
                  viewMode={viewMode} setViewMode={setViewMode}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  xAxis={xAxis} setXAxis={setXAxis}
                  yAxis={yAxis} setYAxis={setYAxis}
                  colorTag={dataRoom.color_tag}
                  customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
                  customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
               />

               {/* Vistas Dinámicas */}
               <div className="mt-2 flex-1 min-h-[500px]">
                  <AnimatePresence mode="wait">
                    {viewMode === 'dashboard' && (
                       <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          {/* KPIs (Siempre Visibles en Dashboard) */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
                             <div className="glassmorphism p-6 rounded-2xl border border-glass-border flex flex-col gap-2 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-${dataRoom.color_tag}/10 blur-2xl rounded-full`} />
                                <Activity className={`w-5 h-5 text-${dataRoom.color_tag} mb-2`} />
                                <p className="text-[9px] uppercase font-black tracking-widest text-gray-500">Fuga Analizada Total</p>
                                <p className="text-3xl font-black text-foreground mt-1">
                                   ${filteredReports.reduce((acc, r) => acc + (r.impacto_directo || 0), 0).toLocaleString()} 
                                   <span className="text-xs text-gray-500"> MXN</span>
                                </p>
                             </div>
                             
                             <div className="glassmorphism p-6 rounded-2xl border border-glass-border flex flex-col gap-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-2xl rounded-full" />
                                <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
                                <p className="text-[9px] uppercase font-black tracking-widest text-gray-500">Señales de Riesgo</p>
                                <p className="text-3xl font-black text-foreground mt-1">
                                   {filteredReports.reduce((acc, r) => acc + (r.impacto_directo > 500000 ? 1 : 0), 0)} 
                                   <span className="text-xs text-gray-500"> Alertas</span>
                                </p>
                             </div>

                             <div className="glassmorphism p-6 rounded-2xl border border-glass-border flex flex-col gap-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
                                <Target className="w-5 h-5 text-emerald-500 mb-2" />
                                <p className="text-[9px] uppercase font-black tracking-widest text-gray-500">Auditorías Base</p>
                                <p className="text-3xl font-black text-foreground mt-1">
                                   {filteredReports.length} 
                                   <span className="text-xs text-gray-500"> Proyectos</span>
                                </p>
                             </div>
                          </div>
                          
                          {/* Gráficas Avanzadas */}
                          <DataRoomCharts 
                            reports={filteredReports} 
                            xAxis={xAxis} 
                            yAxis={yAxis} 
                            colorTag={dataRoom.color_tag} 
                          />
                       </motion.div>
                    )}

                    {viewMode === 'table' && (
                       <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <DataRoomTable reports={filteredReports} colorTag={dataRoom.color_tag} />
                       </motion.div>
                    )}

                    {viewMode === 'gallery' && (
                       <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <DataRoomGallery reports={filteredReports} colorTag={dataRoom.color_tag} />
                       </motion.div>
                    )}
                  </AnimatePresence>
               </div>

            </div>

            {/* RIGHT SIDE: Dedicated AI Chat for Data Room (Slide-over) */}
            <AnimatePresence initial={false}>
               {isAgentOpen && (
                 <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: agentWidth, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="shrink-0 border-l border-glass-border bg-background/90 backdrop-blur-md flex flex-col h-screen overflow-hidden relative group/resizer"
                 >
                    {/* Drag Handle (Split Slider) */}
                    <div 
                       className="absolute left-0 top-0 bottom-0 w-1.5 hover:w-2.5 bg-transparent hover:bg-erani-purple/50 active:bg-erani-purple cursor-col-resize z-[300] transition-all flex items-center justify-center"
                       onMouseDown={(e) => {
                          e.preventDefault();
                          isDraggingRef.current = true;
                          document.body.style.cursor = 'col-resize';
                       }}
                    >
                       <div className="h-12 w-0.5 bg-erani-purple/50 group-hover/resizer:bg-erani-purple rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="w-full flex flex-col h-full pl-1.5">
                       <div className="p-4 border-b border-glass-border bg-background/50 flex justify-between items-start">
                          <div>
                            <h2 className="text-xs uppercase font-black tracking-widest text-erani-purple flex items-center gap-2">
                               <Bot className="w-4 h-4" /> Agente Forense
                            </h2>
                            <p className="text-[10px] text-gray-500 mt-1">El agente tiene contexto de todos los proyectos en este Data Room.</p>
                          </div>
                          <button onClick={() => setIsAgentOpen(false)} className="p-1.5 text-gray-500 hover:text-foreground bg-foreground/5 rounded-full transition-colors shrink-0">
                             <X className="w-4 h-4" />
                          </button>
                       </div>
                       <div className="flex-1 overflow-hidden relative w-full h-full">
                          <ChatProvider>
                             <DataRoomAgentBinder collectionId={collectionId} />
                             <ChatInterface 
                                isEmbedded={true} 
                                embeddedProjects={reports.map(r => ({ id: r.id.toString(), name: r.project_name }))} 
                             />
                          </ChatProvider>
                       </div>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Floating Action Button for AI Agent */}
            <AnimatePresence>
               {!isAgentOpen && (
                  <motion.button
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0, opacity: 0 }}
                     onClick={() => setIsAgentOpen(true)}
                     className="fixed top-8 right-8 z-50 px-6 py-4 rounded-full bg-gradient-to-r from-[#1E50BA] to-[#7404FF] text-white shadow-[0_0_20px_rgba(116,4,255,0.3)] hover:shadow-[0_0_30px_rgba(116,4,255,0.5)] flex items-center gap-3 font-black uppercase tracking-widest text-[11px] group transition-all hover:-translate-y-1"
                  >
                     <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                     Agente Forense
                  </motion.button>
               )}
            </AnimatePresence>

          </div>
        )}
      </main>
    </div>
  );
}

import { useChat as useChatRaw } from "@/context/ChatContext";
function DataRoomAgentBinder({ collectionId }: { collectionId: string }) {
  const { setActiveProjectId, activeProjectId } = useChatRaw();
  useEffect(() => {
    if (activeProjectId !== collectionId) {
      setActiveProjectId(collectionId);
    }
  }, [collectionId, activeProjectId, setActiveProjectId]);
  return null;
}

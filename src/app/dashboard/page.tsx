"use client";

import { motion, Reorder } from "framer-motion";
import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import DonutChart from "@/components/DonutChart";
import SankeyDiagram from "@/components/SankeyDiagram";
import ReportDownloader from "@/components/ReportDownloader";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertCircle, Info, ArrowUpRight, TrendingUp, Layers, CheckCircle, Zap } from "lucide-react";

export default function DashboardPage() {
  const { insights, processingState, bentoOrder, updateBentoOrder, isSidebarCollapsed } = useDashboard();
  const { profile, user } = useAuth();

  // Dashboard state can be "live" or "demo"
  const isLive = !!insights;
  
  // Mapping of card keys to components
  const cards = useMemo(() => ({
    "sankey": (
      <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xs uppercase font-black tracking-widest text-nav-text">Evolución de Rendimiento Financiero</h2>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                  Rescate de ROI Proyectado
              </span>
          </div>
          <div className="flex-1 mt-4">
            <SankeyDiagram data={insights?.revenueData} />
          </div>
          {isLive && (
             <div className="mt-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500/60">Recuperación Estimada</span>
                <span className="text-sm font-black text-emerald-500">${insights.roiRecovered.toLocaleString()} USD</span>
             </div>
          )}
      </div>
    ),
    "dark-data": (
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
               {isLive 
                 ? `${insights.tasksWithoutEstimate} de ${insights.totalTasks} tareas no registradas manualmente.` 
                 : "El 90% de la metadata operativa no estaba registrada manualmente."}
            </p>
            <span className="text-[8px] font-black text-erani-coral uppercase tracking-tighter">Inferencia N2 Activa</span>
          </div>
      </div>
    ),
    "scope-creep": (
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
               {isLive 
                 ? `${insights.scopeCreepPct}% de la fuga atribuible a extensiones no presupuestadas.`
                 : "50% de la fuga atribuible a extensiones no presupuestadas sin Time Estimate."}
            </p>
            <span className="text-[8px] font-black text-erani-purple uppercase tracking-tighter">Fuga Triangulada</span>
          </div>
      </div>
    ),
    "alerts": (
      <div className="flex flex-col gap-4 h-full">
         <div className="flex items-center justify-between border-b border-white/5 pb-4">
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
    )
  }), [insights, isLive]);

  const userName = profile?.full_name || user?.user_metadata?.fullName || "Usuario";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-8 relative overflow-x-hidden`}>
        
        <div className="max-w-[1600px] flex flex-col gap-8">
          
          <div className="flex flex-col gap-6">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex flex-col gap-1"
            >
               <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
                  <span className="text-2xl font-bold uppercase tracking-widest text-nav-text">
                     Bienvenido a ERANI,{" "}
                     <span 
                       className="relative inline-block text-xl text-transparent bg-clip-text bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral animate-gradient-x drop-shadow-[0_0_12px_rgba(158,128,255,0.8)]"
                       style={{ backgroundSize: '200% auto' }}
                     >
                        {userName}
                     </span>
                  </span>
               </div>
            </motion.div>
            
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
              <button 
                onClick={() => window.location.reload()}
                className="button-premium px-6 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center gap-3"
              >
                <Zap className="w-4 h-4" />
                Sincronizar
              </button>
            </div>
          </div>

          {!isLive && !profile?.onboardingCompleted && (
             <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 rounded-2xl bg-erani-purple/10 border border-erani-purple/20 flex items-center gap-4"
             >
                <div className="w-10 h-10 rounded-xl bg-erani-purple/20 flex items-center justify-center text-erani-purple">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-foreground uppercase tracking-widest">Modo de Demostración</span>
                  <span className="text-[10px] text-nav-text font-medium">Sube archivos en el Protocolo de Auditoría para ver tus métricas reales aquí.</span>
                </div>
             </motion.div>
          )}

          {/* DRAGGABLE BENTO GRID */}
          <Reorder.Group 
            axis="y" 
            values={bentoOrder} 
            onReorder={updateBentoOrder}
            id="bento-report-grid" 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-2 bg-background"
          >
              {bentoOrder.map((key) => {
                const isWide = key === "sankey" || key === "alerts";
                return (
                  <Reorder.Item 
                    key={key} 
                    value={key}
                    dragListener={true}
                    className={`col-span-1 ${isWide ? 'md:col-span-2' : ''} glassmorphism p-6 cursor-grab active:cursor-grabbing hover:border-erani-blue/20 transition-colors relative group`}
                  >
                    {/* Drag Handle UI */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 transition-opacity">
                       <div className="grid grid-cols-2 gap-0.5">
                          {[1,2,3,4,5,6].map(i => <div key={i} className="w-1 h-1 rounded-full bg-foreground/40" />)}
                       </div>
                    </div>

                    {/* Content Rendering */}
                    {(cards as any)[key]}
                  </Reorder.Item>
                );
              })}
          </Reorder.Group>

          {isLive && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Tasks Analizados", val: insights.totalTasks, icon: Layers },
                  { label: "Dark Data ROI Leak", val: `$${(insights.tasksWithoutEstimate * 280).toLocaleString()}`, icon: TrendingUp },
                  { label: "Scope Creep ROI Leak", val: `$${(insights.scopeCreepTasks * 672).toLocaleString()}`, icon: ArrowUpRight },
                  { label: "ROI Recuperable", val: `$${insights.roiRecovered.toLocaleString()}`, icon: CheckCircle },
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
          )}
        </div>
      </main>
    </div>
  );
}

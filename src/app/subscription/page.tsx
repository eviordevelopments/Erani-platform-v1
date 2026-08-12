"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { 
  CreditCard, ShieldCheck, Zap, 
  CalendarCheck2, CalendarClock, RefreshCcw, 
  Headphones, CheckCircle2, Ticket, 
  BarChart3, Activity, ChevronRight, ArrowUpRight, 
  X, Info, HardDrive, Cpu, TrendingUp, AlertTriangle, FileText
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SubscriptionPage() {
  const { isSidebarCollapsed, storageStats } = useDashboard();
  const { profile, org, loading } = useAuth();
  const stripeUrl = "https://buy.stripe.com/8x2bJ25CwaW056TbOg8N202";
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [realFiles, setRealFiles] = useState<any[]>([]);

  useEffect(() => {
    if (org?.id) {
      const fetchAudits = async () => {
        const { data } = await supabase.from('audits').select('metadata').eq('organization_id', org.id);
        if (data) {
          const files: any[] = [];
          data.forEach(d => {
            if (d.metadata?.files) {
              d.metadata.files.forEach((f: any) => {
                files.push({
                  ...f,
                  projectName: d.metadata.name,
                  uploadedAt: d.metadata.createdAt || new Date().toISOString()
                });
              });
            }
          });
          setRealFiles(files);
        }
      };
      fetchAudits();
    }
  }, [org]);
  
  // --- REAL DATA CALCULATION ---
  const baseGB = 0.002; // Base cloud storage overhead (~2 MB)
  let currentGB = baseGB;
  
  // Sort files by date to generate a timeline
  const sortedFiles = [...realFiles].sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());

  // Cloud Trend
  const cloudTrendData = sortedFiles.map(f => {
    const fileGB = (f.size || 1000) / (1024 * 1024 * 1024); // Convert bytes to GB
    currentGB += fileGB;
    return {
      day: new Date(f.uploadedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      gb: Number(currentGB.toFixed(4))
    };
  });
  if (cloudTrendData.length === 0) {
    cloudTrendData.push({ day: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), gb: baseGB });
  }
  const currentLimitGB = storageStats?.limitGB || (org?.paid_subscription ? 10 : 5);
  const totalGB = storageStats?.usedGB || (currentGB > currentLimitGB ? currentLimitGB : Number(currentGB.toFixed(4)));
  const cloudPct = (totalGB / currentLimitGB) * 100;

  // ERIS consumption history
  const consumptionData = sortedFiles.map(f => {
    const cost = f.size > 5000000 ? 30 : f.size > 1000000 ? 20 : 10;
    const mbSize = f.size ? (f.size / (1024 * 1024)).toFixed(2) + " MB" : "1.2 MB";
    return {
      service: "Almacenamiento y Evidencia (Storage)",
      date: new Date(f.uploadedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      eris: -cost,
      sizeStr: mbSize,
      type: "usage",
      detail: `Evidencia: ${f.name} en ${f.projectName}`
    };
  }).reverse(); // Most recent first
  
  if (consumptionData.length === 0) {
    // Add default quantified operations if no uploaded files yet
    consumptionData.push(
      { service: "Auditoría Forense de Código", date: "19 jul 2026", eris: -30, sizeStr: "245.5 MB", type: "usage", detail: "Auditoría en Repositorio Principal" },
      { service: "Bóveda de Evidencia Data Room", date: "18 jul 2026", eris: -20, sizeStr: "185.0 MB", type: "usage", detail: "Archivos Encriptados Data Room" },
      { service: "Generación de Reporte Ejecutivo PDF", date: "17 jul 2026", eris: -10, sizeStr: "12.4 MB", type: "usage", detail: "Reporte Board & Certificado ROI" },
      { service: "Inferencia Agente IA Forense", date: "16 jul 2026", eris: -5, sizeStr: "4.8 MB", type: "usage", detail: "Consulta de Contexto y Vectorización" },
      { service: "Generación de UI & Diagramas", date: "15 jul 2026", eris: -15, sizeStr: "3.6 MB", type: "usage", detail: "Assets Gráficos y Render UI" }
    );
  }

  // Add the initial recharge
  consumptionData.push({
    service: "Recarga Inicial",
    date: org?.subscription_activated_at ? new Date(org.subscription_activated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    eris: org?.paid_subscription ? 100 : 20,
    sizeStr: "N/A",
    type: "credit",
    detail: org?.paid_subscription ? "ERANI Beta" : "ERANI Trial"
  });

  const fullHistoryData = [...consumptionData];

  // Trend Data (ERIS over time)
  let trackEris = org?.paid_subscription ? 100 : 20;
  const trendData = sortedFiles.map(f => {
    const cost = f.rowCount > 5000 ? 30 : f.rowCount > 1000 ? 20 : 10;
    trackEris -= cost;
    return {
      day: new Date(f.uploadedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      eris: trackEris
    };
  });
  if (trendData.length === 0) {
    trendData.push({ day: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), eris: trackEris });
  }

  const planFeatures = [
    "Motor de IA e inferencia nivel 2", "Sesiones de estrategia semanales", 
    "Control de Scope Creep", "Dark Data Index", "Acceso completo a ERANI PLATFORM", 
    "Auditorias Forenses", "Creación de Proyectos", "Almacenamiento en ERANI CLOUD 10 GB", 
    "Cálculo de ROI y Blindaje Operativo", "Mapa de Fugas por Herramienta", 
    "Análisis Forense", "Acceso a Features BETA", "ERANI SERVICES+", 
    "Marketplace de Automatizaciones", "Memoria de Contexto", "Historial Forense", 
    "100 ERIS de consumo", "Soporte Técnico 24/7", "5 usuarios", "Agente AI Forense"
  ];

  const trialFeatures = [
    "Agente AI Forense (Limitado)", "Creación de Proyectos (1)", 
    "Almacenamiento en ERANI CLOUD 2 GB", "Auditorias Forenses Limitadas",
    "Acceso a ERANI PLATFORM", "20 ERIS de consumo"
  ];

  const currentFeatures = org?.paid_subscription ? planFeatures : trialFeatures;

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden transition-colors duration-300">
      <Sidebar />

      {/* The main content area adapts dynamically based on sidebar state */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-6 md:p-10 relative h-screen overflow-y-auto custom-scrollbar`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-erani-purple/10 blur-[150px] rounded-full pointer-events-none -z-10 dark:bg-erani-purple/5" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-erani-blue/10 blur-[120px] rounded-full pointer-events-none -z-10 dark:bg-erani-blue/5" />

        <div className="w-full flex flex-col gap-8 pb-12 pt-4">
          
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-erani-blue/10 border border-erani-blue/20 text-erani-blue w-fit">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-widest">
                  Plan Activo: {org?.paid_subscription ? "ERANI Beta" : "ERANI Trial"}
                </span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                Portal de <span className="text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-erani-purple">Suscripción</span>
              </h1>
              <p className="text-nav-text max-w-xl text-sm font-medium">
                Gestiona tus cuotas, monitorea tu consumo de recursos forenses y ajusta los parámetros de facturación desde un solo lugar.
              </p>
            </div>
            
            <button
              onClick={() => {
                const subject = encodeURIComponent("Soporte ERANI — Solicitud de Ayuda");
                const body = encodeURIComponent("Hola equipo ERANI,\n\nNecesito ayuda con:\n\n[Describe tu problema aquí]\n\nGracias.");
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=emilcastle2608@gmail.com&su=${subject}&body=${body}`, "_blank");
              }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background border border-glass-border shadow-sm hover:shadow-md transition-all group dark:bg-foreground/5"
            >
              <div className="w-8 h-8 rounded-full bg-erani-blue/20 flex items-center justify-center text-erani-blue">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Soporte Priority</span>
                <span className="text-[9px] text-nav-text font-medium">emilcastle2608@gmail.com</span>
              </div>
              <ChevronRight className="w-4 h-4 text-nav-text group-hover:translate-x-1 transition-transform ml-2" />
            </button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
            
            {/* UPGRADE BANNER FOR TRIAL USERS */}
            {org && !org.paid_subscription && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-12 w-full bg-gradient-to-r from-erani-blue/10 via-erani-purple/10 to-transparent border border-erani-purple/20 p-5 md:p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-erani-purple/20 blur-[50px] pointer-events-none rounded-full" />
                <div className="flex flex-col gap-1 z-10">
                  <span className="text-[10px] uppercase font-black tracking-widest text-erani-purple">Desbloquea ERANI Beta</span>
                  <h2 className="text-xl font-black text-foreground">Aumenta tu Capacidad Forense</h2>
                  <p className="text-sm text-nav-text font-medium">Estás en ERANI Trial. Haz upgrade para obtener 100 ERIS y acceso sin límites.</p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="button-premium px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shrink-0 z-10 shadow-lg shadow-erani-purple/20"
                >
                  Hacer Upgrade <Zap className="w-4 h-4" />
                </button>
              </motion.div>
            )}
            
            {/* Storage Warning Banner */}
            {storageStats?.isCritical && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-erani-coral/10 border border-erani-coral/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_0_20px_rgba(255,92,92,0.15)] gap-4 w-full"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-erani-coral/20 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-erani-coral animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-erani-coral">Almacenamiento Crítico ({storageStats.usedGB.toFixed(2)}GB / {storageStats.limitGB}GB)</h3>
                    <p className="text-xs text-foreground font-medium mt-1">
                      {storageStats.isFull 
                        ? "Has alcanzado el límite máximo. No podrás crear nuevos proyectos ni cargar evidencia. Elimina archivos para continuar operando." 
                        : "Estás a punto de quedarte sin espacio. Libera espacio pronto o asegúrate de tener el plan adecuado."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Left Column: Stats & Breakdown */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Graphical Overview */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-background/80 backdrop-blur-xl border border-glass-border shadow-sm p-8 flex flex-col gap-8 relative overflow-hidden rounded-[2rem] dark:bg-foreground/5"
              >
                <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-erani-blue/10 to-transparent pointer-events-none dark:from-erani-blue/5" />
                
                <div className="flex justify-between items-center z-10 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-erani-blue/10 text-erani-blue">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs uppercase font-black tracking-widest text-foreground">Consumo de Red (ERIS)</h3>
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    SISTEMA OPTIMIZADO
                  </span>
                </div>

                {(() => {
                  const balance = profile?.eris_balance ?? 20;
                  const limit = org?.paid_subscription ? 100 : 20;
                  const consumed = Math.max(0, limit - balance);
                  const consumedPct = limit > 0 ? (consumed / limit) * 100 : 0;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10 w-full">
                      <div className="flex flex-col gap-1 p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                        <span className="text-nav-text text-[10px] uppercase tracking-widest font-bold mb-1">Balance Actual</span>
                        <span className={`text-4xl font-black flex items-baseline gap-1 ${balance === 0 ? "text-erani-coral" : "text-foreground"}`}>
                          {balance} <span className={`text-sm ${balance === 0 ? "text-erani-coral font-medium" : "text-erani-blue"}`}>{balance === 0 ? "CONGELADO" : "ERIS"}</span>
                        </span>
                        <span className="text-nav-text text-[10px] font-bold mt-2 flex items-center gap-1">
                          El plan te otorga {limit} ERIS
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 p-5 rounded-2xl bg-foreground/5 border border-glass-border md:col-span-2">
                        <span className="text-nav-text text-[10px] uppercase tracking-widest font-bold mb-1">Consumo Total vs Límite</span>
                        
                        <div className="flex flex-col gap-3 mt-1">
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-foreground">{consumed} <span className="text-sm text-nav-text">/ {limit} ERIS</span></span>
                            <span className="text-xs font-bold text-nav-text">{consumedPct.toFixed(0)}% Consumido</span>
                          </div>
                          
                          {/* Custom Progress Bar */}
                          <div className="h-3 w-full bg-foreground/10 rounded-full overflow-hidden relative border border-glass-border">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${consumedPct}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={`absolute top-0 left-0 h-full ${balance === 0 ? "bg-erani-coral" : "bg-gradient-to-r from-erani-blue to-erani-purple"}`}
                            />
                            {/* Markers */}
                            <div className="absolute top-0 bottom-0 left-[50%] w-px bg-foreground/20" />
                            <div className="absolute top-0 bottom-0 left-[80%] w-px bg-red-500/50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 mt-2">
                  {/* Storage Info with Progress Bar */}
                  <div className="flex flex-col gap-4 p-5 rounded-2xl bg-erani-purple/5 border border-erani-purple/20 md:col-span-2">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-erani-purple/10 rounded-xl text-erani-purple shrink-0 mt-1">
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col flex-1 gap-4">
                        <div>
                          <span className="text-sm font-black text-foreground uppercase tracking-widest">Almacenamiento ERANI CLOUD</span>
                          <p className="text-[11px] text-nav-text font-medium mt-1 leading-relaxed">
                            Límite máximo de {currentLimitGB}GB de proyectos, archivos y auditorías en el almacenamiento forense de la nube.
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-foreground">{totalGB} <span className="text-sm text-nav-text font-bold">/ {currentLimitGB} GB</span></span>
                            <span className="text-xs font-bold text-erani-purple">{cloudPct.toFixed(1)}% Consumido</span>
                          </div>
                          
                          {/* Custom Progress Bar */}
                          <div className="h-3 w-full bg-foreground/5 rounded-full overflow-hidden relative border border-glass-border">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${cloudPct}%` }}
                              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-erani-purple to-[#D4C4FF]"
                            />
                            {/* Markers */}
                            <div className="absolute top-0 bottom-0 left-[50%] w-px bg-foreground/20" />
                            <div className="absolute top-0 bottom-0 left-[80%] w-px bg-red-500/50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Trend Graphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ERIS Trend Graph */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-background/80 backdrop-blur-xl border border-glass-border shadow-sm p-6 flex flex-col gap-6 rounded-[2rem] dark:bg-foreground/5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-erani-purple/10 text-erani-purple">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs uppercase font-black tracking-widest text-foreground">Rendimiento ERIS</h3>
                    </div>
                    <span className="text-[10px] text-nav-text font-medium bg-foreground/5 px-3 py-1 rounded-full border border-glass-border">
                      30 días
                    </span>
                  </div>
                  
                  <div className="h-[200px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEris" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9e80ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#9e80ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-foreground/5" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} className="text-nav-text" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} className="text-nav-text" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                          itemStyle={{ color: '#9e80ff', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="eris" stroke="#9e80ff" strokeWidth={3} fillOpacity={1} fill="url(#colorEris)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* ERANI Cloud Trend Graph */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-background/80 backdrop-blur-xl border border-glass-border shadow-sm p-6 flex flex-col gap-6 rounded-[2rem] dark:bg-foreground/5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-erani-blue/10 text-erani-blue">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs uppercase font-black tracking-widest text-foreground">Tendencia Cloud (GB)</h3>
                    </div>
                    <span className="text-[10px] text-nav-text font-medium bg-foreground/5 px-3 py-1 rounded-full border border-glass-border">
                      30 días
                    </span>
                  </div>
                  
                  <div className="h-[200px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cloudTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-foreground/5" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} className="text-nav-text" />
                        <YAxis domain={[0, currentLimitGB]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} className="text-nav-text" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                          itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="gb" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCloud)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* Tabular Breakdown */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-background/80 backdrop-blur-xl border border-glass-border rounded-[2rem] flex flex-col overflow-hidden shadow-sm dark:bg-foreground/5"
              >
                <div className="p-6 border-b border-glass-border flex justify-between items-center bg-foreground/5">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-nav-text" />
                    <h3 className="text-xs uppercase font-black tracking-widest text-foreground">Desglose Operativo</h3>
                  </div>
                  <button 
                    onClick={() => setShowHistoryModal(true)}
                    className="text-[10px] font-bold text-erani-blue hover:text-erani-purple transition-colors"
                  >
                    VER HISTORIAL COMPLETO
                  </button>
                </div>
                
                {/* Rules of consumption */}
                <div className="px-6 py-3 bg-foreground/5 flex flex-wrap gap-4 text-[10px] font-medium text-nav-text border-b border-glass-border">
                  <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Costos ERIS:</span>
                  <span><strong>Auditoría:</strong> Pequeña (10), Mediana (20), Grande (30)</span>
                  <span><strong>Agente Forense:</strong> 5 por uso</span>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-foreground/5 text-[9px] uppercase tracking-widest text-nav-text">
                        <th className="p-4 font-black">Servicio</th>
                        <th className="p-4 font-black hidden md:table-cell">Detalle</th>
                        <th className="p-4 font-black text-right">Gasto Almacenamiento</th>
                        <th className="p-4 font-black">Fecha</th>
                        <th className="p-4 font-black text-right">Impacto (ERIS)</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-glass-border">
                      {consumptionData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-foreground/5 transition-colors group">
                          <td className="p-4 font-medium text-foreground flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${item.type === 'credit' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-erani-purple shadow-[0_0_8px_rgba(158,128,255,0.5)]'}`} />
                            {item.service}
                          </td>
                          <td className="p-4 text-nav-text text-xs hidden md:table-cell">{item.detail}</td>
                          <td className="p-4 text-right font-black font-mono text-erani-purple text-xs">{item.sizeStr || "1.2 MB"}</td>
                          <td className="p-4 text-nav-text text-xs font-mono">{item.date}</td>
                          <td className="p-4 text-right">
                            <span className={`font-black px-2 py-1 rounded-md text-xs ${item.type === 'credit' ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' : 'text-foreground bg-foreground/5'}`}>
                              {item.eris > 0 ? `+${item.eris}` : item.eris}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Billing & Actions */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Active Plan / Renewal Info */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-background/80 backdrop-blur-xl p-6 rounded-[2rem] flex flex-col gap-6 border border-erani-purple/20 shadow-lg relative overflow-hidden dark:bg-gradient-to-br dark:from-erani-purple/5 dark:to-transparent"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-erani-purple/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-erani-purple">Nivel de Servicio</span>
                    <h2 className="text-3xl font-black text-foreground">{org?.paid_subscription ? "ERANI Beta" : "ERANI Trial"}</h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-erani-purple/10 flex items-center justify-center border border-erani-purple/20 shadow-[0_0_15px_rgba(158,128,255,0.2)] shrink-0">
                    <ShieldCheck className="w-6 h-6 text-erani-purple" />
                  </div>
                </div>

                <div className="flex flex-col gap-1 z-10">
                  <span className="text-2xl font-black text-foreground">
                    {org?.paid_subscription ? "$3,750" : "$0.00"} <span className="text-sm font-bold text-nav-text">MXN / Pago por ERIS</span>
                  </span>
                  <div className="flex flex-col gap-2 mt-2 p-3 bg-erani-purple/5 border border-erani-purple/10 rounded-xl">
                    <span className="text-[10px] text-nav-text leading-relaxed font-medium">
                      Tu acceso a la plataforma es permanente, no tiene fecha de caducidad. Lo que pagas es el consumo de ERIS que te permiten ejecutar las auditorías forenses y el agente de IA. La intervención tiene una duración promedio recomendada de 90 días o 3 meses, pero si tus ERIS se terminan antes, puedes renovarlos para continuar operando sin interrupciones.
                    </span>
                    <button onClick={() => setShowPoliciesModal(true)} className="text-[10px] text-erani-purple font-black uppercase tracking-widest hover:underline text-left">
                      Consultar Políticas de Suscripción y Facturación
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 bg-foreground/5 p-4 rounded-xl border border-glass-border z-10 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-nav-text">
                      <CalendarCheck2 className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Expedición</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {org?.subscription_activated_at 
                        ? new Date(org.subscription_activated_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                        : "N/A (Modo Trial)"}
                    </span>
                  </div>
                  <div className="h-px w-full bg-glass-border" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-nav-text">
                      <CalendarClock className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Tiempo Estimado</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      90 días (Promedio)
                    </span>
                  </div>
                </div>

                {/* Manual Renew Note */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-erani-blue/5 border border-erani-blue/20 z-10 relative w-full">
                  <RefreshCcw className="w-5 h-5 text-erani-blue shrink-0" /> 
                  <div className="flex flex-col flex-1">
                    <span className="text-xs font-bold text-foreground">Renovación Manual</span>
                    <span className="text-[9px] text-nav-text leading-tight mt-0.5 pr-2">El sistema emitirá notificaciones preventivas al aproximarse al límite de consumo establecido.</span>
                  </div>
                  <button onClick={() => setShowPoliciesModal(true)} className="p-2 rounded-full hover:bg-erani-blue/10 text-erani-blue transition-colors group z-20">
                    <Info className="w-5 h-5" />
                    <span className="absolute -top-8 right-0 bg-background border border-glass-border text-foreground text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">Ver Políticas</span>
                  </button>
                </div>

                {/* Renew / Upgrade Button depending on status */}
                {org?.paid_subscription ? (
                  <Link 
                    href="/checkout"
                    className="button-premium w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 mt-2 z-10"
                  >
                    Renovar ERIS <Zap className="w-4 h-4" />
                  </Link>
                ) : (
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full py-4 rounded-xl border border-erani-purple/30 bg-erani-purple/10 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 text-erani-purple hover:bg-erani-purple/20 transition-colors mt-2 z-10"
                  >
                    Ver Planes <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>

              {/* Plan Features */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-background/80 backdrop-blur-xl border border-glass-border rounded-[2rem] p-6 flex flex-col gap-4 shadow-sm dark:bg-foreground/5"
              >
                <h3 className="text-xs uppercase font-black tracking-widest text-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-erani-purple" /> ¿Qué incluye {org?.paid_subscription ? "ERANI Beta" : "ERANI Trial"}?
                </h3>
                <div className="h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  <ul className="flex flex-col gap-3">
                    {currentFeatures.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] font-medium text-nav-text">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> 
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Payment Methods */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-background/80 backdrop-blur-xl border border-glass-border rounded-[2rem] p-6 flex flex-col gap-5 shadow-sm dark:bg-foreground/5"
              >
                <div className="flex items-center gap-3 text-nav-text">
                  <CreditCard className="w-4 h-4" />
                  <h3 className="text-xs uppercase font-black tracking-widest text-foreground">Métodos de Pago Aceptados</h3>
                </div>

                <div className="flex flex-col gap-4">
                  <p className="text-[10px] text-nav-text leading-relaxed">Aceptamos las principales tarjetas de crédito y débito de forma segura a través de nuestro proveedor de pagos.</p>
                  
                  {/* Accepted Cards Icons */}
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center shadow-sm"><span className="text-[10px] font-black text-[#1434CB] italic">VISA</span></div>
                     <div className="w-12 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center shadow-sm"><span className="text-[10px] font-black text-[#EB001B]">MC</span></div>
                     <div className="w-12 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center shadow-sm"><span className="text-[10px] font-black text-[#006FCF]">AMEX</span></div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-nav-text">Powered by</span>
                    <span className="text-xs font-black text-[#635BFF] tracking-tighter">stripe</span>
                  </div>
                </div>
              </motion.div>


            </div>
          </div>
        </div>

        {/* History Modal */}
        <AnimatePresence>
          {showHistoryModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-background border border-glass-border rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                <div className="flex justify-between items-center p-6 border-b border-glass-border bg-foreground/5">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-black uppercase tracking-widest text-foreground">Historial Completo de ERIS</h2>
                    <span className="text-xs text-nav-text">Registro de todas las transacciones y consumos en ERANI Platform.</span>
                  </div>
                  <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 rounded-full hover:bg-foreground/10 transition-colors text-nav-text hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-foreground/5 text-[10px] uppercase tracking-widest text-nav-text">
                        <th className="p-4 font-black">Servicio</th>
                        <th className="p-4 font-black">Detalle</th>
                        <th className="p-4 font-black text-right">Almacenamiento</th>
                        <th className="p-4 font-black">Fecha</th>
                        <th className="p-4 font-black text-right">Impacto (ERIS)</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-glass-border">
                      {fullHistoryData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-foreground/5 transition-colors">
                          <td className="p-4 font-medium text-foreground flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${item.type === 'credit' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-erani-purple shadow-[0_0_8px_rgba(158,128,255,0.5)]'}`} />
                            {item.service}
                          </td>
                          <td className="p-4 text-nav-text text-xs">{item.detail}</td>
                          <td className="p-4 text-right font-black font-mono text-erani-purple text-xs">{item.sizeStr || "1.2 MB"}</td>
                          <td className="p-4 text-nav-text text-xs font-mono">{item.date}</td>
                          <td className="p-4 text-right">
                            <span className={`font-black px-2 py-1 rounded-md text-xs ${item.type === 'credit' ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' : 'text-foreground bg-foreground/5'}`}>
                              {item.eris > 0 ? `+${item.eris}` : item.eris}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Policies Modal */}
        <AnimatePresence>
          {showPoliciesModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-background border border-glass-border rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                <div className="flex justify-between items-center p-6 border-b border-glass-border bg-foreground/5 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-erani-blue/10 text-erani-blue rounded-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Políticas de Suscripción</h2>
                      <span className="text-sm text-nav-text font-medium">Condiciones, renovaciones y seguridad de ERANI Beta.</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPoliciesModal(false)}
                    className="p-2 rounded-full hover:bg-foreground/10 transition-colors text-nav-text hover:text-foreground"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="flex flex-col gap-8">
                    
                    {/* Section 1 */}
                    <div className="flex items-start gap-4">
                      <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Renovaciones Manuales y Seguridad</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Para garantizar su seguridad y control presupuestal, las renovaciones de plan operan bajo un modelo estrictamente manual. El sistema emitirá alertas preventivas al acercarse al límite de consumo. Le sugerimos realizar la recarga únicamente al agotar su saldo de ERIS para optimizar su ciclo de facturación.
                        </p>
                        <div className="p-4 bg-erani-purple/5 border border-erani-purple/20 rounded-xl mt-2 text-sm text-nav-text font-medium">
                          La integridad de su información está plenamente resguardada. Al agotarse el saldo de ERIS, sus proyectos, archivos, historial y auditorías previas permanecerán intactos y accesibles. Únicamente se restringirá la ejecución de nuevas auditorías y consultas al Agente IA hasta concretar la renovación.
                        </div>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="flex items-start gap-4">
                      <CalendarClock className="w-8 h-8 text-erani-blue shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Duración Estimada y Acceso</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Su cuenta y el acceso a ERANI Platform tienen carácter permanente; no están sujetos a fechas de caducidad. El periodo de 3 meses (90 días) representa exclusivamente el tiempo promedio estimado para ejecutar e implementar una intervención forense integral.
                        </p>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Independientemente de superar el tiempo estimado o agotar sus recursos anticipadamente, su acceso a la plataforma continuará ininterrumpido. Sin embargo, será imprescindible adquirir una nueva asignación de ERIS para desplegar auditorías adicionales.
                        </p>
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Custodia de Información</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Sus datos operan bajo estrictos protocolos de confidencialidad y encriptación. Ningún miembro de nuestro equipo cuenta con acceso a su información operativa. Si requiere la eliminación definitiva de sus datos, puede ejecutar la destrucción autónoma desde el panel de Configuración de Cuenta y Seguridad.
                        </p>
                      </div>
                    </div>

                    {/* Section 4 */}
                    <div className="flex items-start gap-4">
                      <Zap className="w-8 h-8 text-erani-purple shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Acerca de ERANI Beta</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Durante su fase de despliegue Beta, ERANI opera mediante un cargo único que asigna un bloque operativo de 100 ERIS (recursos aplicables al análisis de auditorías, gestión de proyectos y despliegue del Agente IA), proyectados para cubrir una intervención estándar de 90 días.
                        </p>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          La persistencia de su información está garantizada a lo largo del tiempo. Asimismo, los recursos (ERIS) no consumidos carecen de caducidad y permanecerán en su cuenta hasta su ejecución efectiva.
                        </p>
                      </div>
                    </div>

                    {/* Section 5 */}
                    <div className="flex items-start gap-4">
                      <Ticket className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Convenios y Founding Members</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Al ingresar un código de convenio activo, la plataforma garantizará los términos comerciales pactados durante la vigencia del mismo. Cualquier actualización contractual será debidamente notificada mediante los canales oficiales.
                        </p>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Nos encontramos en un proceso de estructuración de esquemas de facturación. No obstante, los usuarios designados como "Founding Members" (participantes en la fase Beta) mantendrán el congelamiento de precios y beneficios según los lineamientos estipulados en su respectivo Acuerdo de Nivel de Servicio (SLA), salvaguardando sus condiciones originales.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
                <div className="p-6 border-t border-glass-border bg-foreground/5 flex justify-end shrink-0">
                  <button 
                    onClick={() => setShowPoliciesModal(false)}
                    className="px-6 py-3 bg-foreground text-background font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Entendido
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-background border border-glass-border rounded-[2rem] shadow-[0_0_80px_rgba(158,128,255,0.3),0_0_40px_rgba(74,144,226,0.2)] dark:shadow-[0_0_60px_rgba(158,128,255,0.15)] w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative"
            >
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/10 transition-colors text-nav-text hover:text-foreground z-50 bg-background/50 backdrop-blur-md border border-glass-border"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Branding, Data & Actions */}
              <div className="flex-1 p-8 md:p-12 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-background to-foreground/5">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-erani-purple/20 via-transparent to-transparent pointer-events-none" />
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent,rgba(158,128,255,0.05),transparent)] pointer-events-none" 
                />

                <div className="flex flex-col gap-6 z-10 relative">
                  <Image src="/eanilogo.png" alt="ERANI" width={140} height={40} className="logo-adaptive mb-4" />
                  
                  <div className="flex flex-col gap-2 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-erani-blue/10 to-erani-purple/10 blur-[40px] -z-10 rounded-full" />
                    <span className="text-xs uppercase font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-erani-purple">Haz Upgrade</span>
                    <motion.h2 
                      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-[linear-gradient(to_right,#9E80FF,#FFFFFF,#4A90E2,#9E80FF)] bg-[length:200%_auto] tracking-tighter pb-2"
                      style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                    >
                      ERANI Beta
                    </motion.h2>
                    <p className="text-sm md:text-base text-nav-text font-medium mt-2 leading-relaxed">
                      Lleva tu capacidad de auditoría forense al siguiente nivel. Desbloquea 100 ERIS operativos, la suite completa del Agente IA y almacenamiento ilimitado.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-1 p-6 rounded-2xl bg-foreground/5 border border-glass-border backdrop-blur-xl">
                    <span className="text-xs font-bold text-nav-text uppercase tracking-widest">Inversión Única</span>
                    <span className="text-4xl font-black text-foreground">$3,750 <span className="text-sm font-bold text-nav-text">MXN</span></span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-8 z-10 relative w-full">
                  <Link 
                    href="/checkout"
                    onClick={() => setShowUpgradeModal(false)}
                    className="button-premium w-full py-5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-erani-purple/20 group overflow-hidden relative"
                  >
                    <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                    <span className="relative flex items-center gap-2">Ir al Checkout <ArrowUpRight className="w-4 h-4" /></span>
                  </Link>
                  <Link 
                    href="/subscription/activate"
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-4 rounded-xl border border-glass-border hover:bg-foreground/5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 text-foreground transition-colors"
                  >
                    Tengo un Código de Convenio <Ticket className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Features */}
              <div className="w-full md:w-[45%] bg-foreground/[0.03] dark:bg-[#0a0a0a] border-l border-glass-border p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-erani-blue/5 blur-[80px] pointer-events-none rounded-full" />
                
                <h3 className="text-xs uppercase font-black tracking-widest text-foreground/80 dark:text-white/80 flex items-center gap-2 sticky top-0 bg-transparent py-2 z-10 backdrop-blur-sm">
                  <Cpu className="w-4 h-4 text-emerald-500" /> Todo Incluido en Beta
                </h3>
                
                <ul className="flex flex-col gap-4 z-10 relative mt-2">
                  {planFeatures.map((feat, i) => (
                    <motion.li 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      key={i} 
                      className="flex items-start gap-3 text-xs font-medium text-nav-text dark:text-gray-400 group"
                    >
                      <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0 mt-0.5 group-hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 
                      </div>
                      <span className="group-hover:text-foreground dark:group-hover:text-white transition-colors">{feat}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SubscriptionPage() {
  const { isSidebarCollapsed } = useDashboard();
  const stripeUrl = "https://buy.stripe.com/8x2bJ25CwaW056TbOg8N202";
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  
  // Mock data for breakdown
  const consumptionData = [
    { service: "Inferencia L2 (Audit)", date: "18 May 2026", eris: -10, type: "usage", detail: "Auditoría Pequeña" },
    { service: "Agente Forense (Query)", date: "17 May 2026", eris: -5, type: "usage", detail: "Consulta de contexto" },
    { service: "Recarga Trimestral", date: "01 May 2026", eris: +100, type: "credit", detail: "ERANI Beta" },
    { service: "Inferencia L2 (Audit)", date: "28 Apr 2026", eris: -20, type: "usage", detail: "Auditoría Mediana" },
  ];

  // Full history
  const fullHistoryData = [
    ...consumptionData,
    { service: "Inferencia L2 (Audit)", date: "10 Apr 2026", eris: -30, type: "usage", detail: "Auditoría Grande" },
    { service: "Agente Forense (Query)", date: "05 Apr 2026", eris: -5, type: "usage", detail: "Resolución de fuga" },
  ];

  // Trend data
  const trendData = [
    { day: "1 May", eris: 100 },
    { day: "5 May", eris: 80 },
    { day: "10 May", eris: 80 },
    { day: "15 May", eris: 75 },
    { day: "17 May", eris: 70 },
    { day: "18 May", eris: 60 },
  ];

  // Cloud Storage Trend Data
  const cloudTrendData = [
    { day: "1 May", gb: 1.2 },
    { day: "5 May", gb: 2.5 },
    { day: "10 May", gb: 2.8 },
    { day: "15 May", gb: 3.5 },
    { day: "17 May", gb: 4.0 },
    { day: "18 May", gb: 4.2 },
  ];

  const planFeatures = [
    "Motor de IA e inferencia nivel 2", "Sesiones de estrategia semanales", 
    "Control de Scope Creep", "Dark Data Index", "Acceso completo a ERANI PLATFORM", 
    "Auditorias Forenses", "Creación de Proyectos", "Almacenamiento en ERANI CLOUD 10 GB", 
    "Cálculo de ROI y Blindaje Operativo", "Mapa de Fugas por Herramienta", 
    "Análisis Forense", "Acceso a Features BETA", "ERANI SERVICES+", 
    "Marketplace de Automatizaciones", "Memoria de Contexto", "Historial Forense", 
    "100 ERIS de consumo", "Soporte Técnico 24/7", "5 usuarios", "Agente AI Forense"
  ];

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
                <span className="text-[10px] uppercase font-black tracking-widest">Plan Activo: ERANI Beta</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground">
                Portal de <span className="text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-erani-purple">Suscripción</span>
              </h1>
              <p className="text-nav-text max-w-xl text-sm font-medium">
                Gestiona tus cuotas, monitorea tu consumo de recursos forenses y ajusta los parámetros de facturación desde un solo lugar.
              </p>
            </div>
            
            <Link href="/feedback" className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background border border-glass-border shadow-sm hover:shadow-md transition-all group dark:bg-foreground/5">
              <div className="w-8 h-8 rounded-full bg-erani-blue/20 flex items-center justify-center text-erani-blue">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Soporte Priority</span>
                <span className="text-[9px] text-nav-text font-medium">Contactar agente 24/7</span>
              </div>
              <ChevronRight className="w-4 h-4 text-nav-text group-hover:translate-x-1 transition-transform ml-2" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
            
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
                  <div className="flex flex-col gap-1 p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                    <span className="text-nav-text text-[10px] uppercase tracking-widest font-bold mb-1">Balance Actual</span>
                    <span className="text-4xl font-black text-foreground flex items-baseline gap-1">
                      85 <span className="text-sm text-erani-blue">ERIS</span>
                    </span>
                    <span className="text-nav-text text-[10px] font-bold mt-2 flex items-center gap-1">
                      El plan te otorga 100 ERIS
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 p-5 rounded-2xl bg-foreground/5 border border-glass-border md:col-span-2">
                    <span className="text-nav-text text-[10px] uppercase tracking-widest font-bold mb-1">Consumo Total vs Límite</span>
                    
                    <div className="flex flex-col gap-3 mt-1">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-black text-foreground">15 <span className="text-sm text-nav-text">/ 100 ERIS</span></span>
                        <span className="text-xs font-bold text-nav-text">15% Consumido</span>
                      </div>
                      
                      {/* Custom Progress Bar */}
                      <div className="h-3 w-full bg-foreground/10 rounded-full overflow-hidden relative border border-glass-border">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '15%' }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-erani-blue to-erani-purple"
                        />
                        {/* Markers */}
                        <div className="absolute top-0 bottom-0 left-[50%] w-px bg-foreground/20" />
                        <div className="absolute top-0 bottom-0 left-[80%] w-px bg-red-500/50" />
                      </div>
                    </div>
                  </div>
                </div>

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
                            Límite máximo de 10GB de proyectos, archivos y auditorías en el almacenamiento forense de la nube.
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-foreground">4.2 <span className="text-sm text-nav-text font-bold">/ 10 GB</span></span>
                            <span className="text-xs font-bold text-erani-purple">42% Consumido</span>
                          </div>
                          
                          {/* Custom Progress Bar */}
                          <div className="h-3 w-full bg-foreground/5 rounded-full overflow-hidden relative border border-glass-border">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '42%' }}
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
                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} className="text-nav-text" />
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
                    <span className="text-[10px] uppercase font-black tracking-widest text-erani-purple">Plan de Pago Actual</span>
                    <h2 className="text-3xl font-black text-foreground">ERANI Beta</h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-erani-purple/10 flex items-center justify-center border border-erani-purple/20 shadow-[0_0_15px_rgba(158,128,255,0.2)] shrink-0">
                    <ShieldCheck className="w-6 h-6 text-erani-purple" />
                  </div>
                </div>

                <div className="flex flex-col gap-1 z-10">
                  <span className="text-2xl font-black text-foreground">$3,750 <span className="text-sm font-bold text-nav-text">MXN / Pago por ERIS</span></span>
                  <div className="flex flex-col gap-2 mt-2 p-3 bg-erani-purple/5 border border-erani-purple/10 rounded-xl">
                    <span className="text-[10px] text-nav-text leading-relaxed font-medium">
                      La intervención tiene una duración total de 90 días o 3 meses con acceso completo a la plataforma. Se paga por el consumo de ERIS e incluye 3 meses de acceso a la plataforma, los ERIS aplican para las auditorías forenses y agente forense, se pueden renovar en caso de consumirse antes del final de la intervención y se acumularán. El plan solo se podrá renovar una vez se acabe la intervención.
                    </span>
                    <button onClick={() => setShowPoliciesModal(true)} className="text-[10px] text-erani-purple font-black uppercase tracking-widest hover:underline text-left">
                      Checa nuestras políticas de pago aquí.
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 bg-foreground/5 p-4 rounded-xl border border-glass-border z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-nav-text">
                      <CalendarCheck2 className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Expedición</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">01 Mayo 2026</span>
                  </div>
                  <div className="h-px w-full bg-glass-border" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-nav-text">
                      <CalendarClock className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Vencimiento Est.</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">01 Agosto 2026</span>
                  </div>
                </div>

                {/* Manual Renew Note */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-erani-blue/5 border border-erani-blue/20 z-10 relative">
                  <RefreshCcw className="w-5 h-5 text-erani-blue shrink-0" /> 
                  <div className="flex flex-col flex-1">
                    <span className="text-xs font-bold text-foreground">Renovación Manual</span>
                    <span className="text-[9px] text-nav-text leading-tight mt-0.5 pr-2">Te informaremos cuando estés cerca de tu límite.</span>
                  </div>
                  <button onClick={() => setShowPoliciesModal(true)} className="p-2 rounded-full hover:bg-erani-blue/10 text-erani-blue transition-colors group z-20">
                    <Info className="w-5 h-5" />
                    <span className="absolute -top-8 right-0 bg-background border border-glass-border text-foreground text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">Ver Políticas</span>
                  </button>
                </div>

                {/* Upgrade Button - Now Routes to Checkout Flow */}
                <Link 
                  href="/checkout"
                  className="button-premium w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 mt-2 z-10"
                >
                  Ir al Checkout <Zap className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Plan Features */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-background/80 backdrop-blur-xl border border-glass-border rounded-[2rem] p-6 flex flex-col gap-4 shadow-sm dark:bg-foreground/5"
              >
                <h3 className="text-xs uppercase font-black tracking-widest text-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-erani-purple" /> ¿Qué incluye ERANI Beta?
                </h3>
                <div className="h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  <ul className="flex flex-col gap-3">
                    {planFeatures.map((feat, i) => (
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
                          Por seguridad, las renovaciones de tu plan son <strong className="text-foreground">manuales</strong> una vez que termines tus ERIS. 
                          Te mantendremos informado cuando estén por terminarse. En caso de que quieras renovar, te invitamos a hacerlo una vez que se hayan terminado tus ERIS disponibles.
                        </p>
                        <div className="p-4 bg-erani-purple/5 border border-erani-purple/20 rounded-xl mt-2 text-sm text-nav-text font-medium">
                          Descuida, todos tus proyectos, archivos, historial y auditorías se guardarán si lo tienes habilitado aquí en tu sesión. Solo si se acaban tus ERIS no podrás realizar más auditorías ni usar el agente forense.
                        </div>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="flex items-start gap-4">
                      <CalendarClock className="w-8 h-8 text-erani-blue shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Duración y Suspensión</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Todos los demás servicios tendrán una duración total de 3 meses en caso de consumir todos tus ERIS; seguirán activos. A los 3 meses de servicio, se suspenderá la plataforma hasta su renovación.
                        </p>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Te enviaremos un correo invitándote a renovar tu periodo de servicio con una fecha límite de 2 semanas desde su emisión. En caso de no renovar, borraremos tu cuenta.
                        </p>
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Custodia de Información</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Toda tu información se encontrará custodiada; nadie, ni nuestro equipo, tendrá acceso a ella hasta su eliminación si no recibimos respuesta. Si deseas borrar tu sesión de manera autónoma puedes hacerlo desde configuración -{">"} cuenta y seguridad.
                        </p>
                      </div>
                    </div>

                    {/* Section 4 */}
                    <div className="flex items-start gap-4">
                      <Zap className="w-8 h-8 text-erani-purple shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Acerca de ERANI Beta</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Por ahora ERANI se encuentra en fase beta, solo cuenta con un pago único con 100 ERIS por consumo aplicando para auditorías, proyectos y agente forense, y una duración de 90 días o su equivalente de 3 meses de intervención forense. 
                        </p>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Dentro de los 90 días deberás consumir tus ERIS. En caso de finalizar los 90 días en la fecha establecida por el sistema, se perderán tus ERIS hasta una nueva renovación.
                        </p>
                      </div>
                    </div>

                    {/* Section 5 */}
                    <div className="flex items-start gap-4">
                      <Ticket className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
                      <div className="flex flex-col gap-2">
                        <h4 className="text-lg font-black text-foreground">Convenios y Founding Members</h4>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          En caso de contar con un <strong>código de referido</strong> se respetará ese precio del servicio mientras se mantenga el convenio vigente; te mantendremos informado en caso de actualizar el convenio.
                        </p>
                        <p className="text-sm text-nav-text leading-relaxed font-medium">
                          Estamos actualizando nuestros planes de pago. Si eres <strong>founding member</strong> (cliente en fase beta o que haya adquirido ERANI BETA), se respetará el precio y todo lo que incluye tu plan según las condiciones establecidas en tu contrato de servicios y SLA cuando se adquirió, hasta su término en la fecha establecida.
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
    </div>
  );
}

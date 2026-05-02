"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Play, 
  Pause, 
  Settings2, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter,
  Zap,
  BarChart3,
  ShieldCheck,
  Cpu,
  ArrowUpRight,
  ExternalLink
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import Sidebar from "@/components/Sidebar";

export default function MarketplacePage() {
  const { automations, toggleAutomation } = useDashboard();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredAutomations = useMemo(() => {
    return automations.filter(auto => {
      const matchesSearch = auto.name.toLowerCase().includes(search.toLowerCase()) || 
                            auto.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || auto.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [automations, search, filter]);

  const totalROI = useMemo(() => {
    const active = automations.filter(a => a.status === "active");
    if (active.length === 0) return 0;
    return active.reduce((acc, curr) => acc + curr.roi_projection, 0) / active.length;
  }, [automations]);

  const totalHoursSaved = useMemo(() => {
    return automations
      .filter(a => a.status === "active")
      .reduce((acc, curr) => acc + curr.hours_saved_monthly, 0);
  }, [automations]);

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      
      <main className="flex-1 ml-[280px] p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          
          {/* Header & Global ROI */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-erani-blue/10 border border-erani-blue/20">
                  <ShoppingBag className="w-5 h-5 text-erani-blue" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-erani-blue">Marketplace Forense</span>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Automatizaciones <span className="text-erani-blue">n8n</span>
              </h1>
              <p className="text-nav-text text-sm mt-2 max-w-xl">
                Ecosistema de flujos activos diseñados para maximizar el ROI operativo y blindar la rentabilidad mediante ingeniería forense.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="glassmorphism p-6 flex flex-col gap-1 min-w-[200px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-12 h-12" />
                </div>
                <span className="text-[8px] uppercase font-black tracking-widest text-nav-text">ROI Promedio Activo</span>
                <span className="text-3xl font-black text-erani-blue">{totalROI.toFixed(0)}%</span>
                <div className="w-full h-1 bg-foreground/5 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(totalROI / 5, 100)}%` }}
                    className="h-full bg-erani-blue"
                  />
                </div>
              </div>

              <div className="glassmorphism p-6 flex flex-col gap-1 min-w-[200px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock className="w-12 h-12" />
                </div>
                <span className="text-[8px] uppercase font-black tracking-widest text-nav-text">Horas Ahorradas / Mes</span>
                <span className="text-3xl font-black text-erani-purple">{totalHoursSaved}h</span>
                <div className="w-full h-1 bg-foreground/5 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(totalHoursSaved, 100)}%` }}
                    className="h-full bg-erani-purple"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nav-text group-focus-within:text-erani-blue transition-colors" />
              <input 
                type="text"
                placeholder="Buscar automatización por nombre o descripción..."
                className="input-premium !pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 glassmorphism p-1">
              {["all", "forense", "financiera", "operativa"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] uppercase font-black tracking-widest transition-all ${
                    filter === cat 
                    ? "bg-erani-blue text-white shadow-lg shadow-erani-blue/20" 
                    : "text-nav-text hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {cat === "all" ? "Todos" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Automation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAutomations.map((auto) => (
                <motion.div
                  key={auto.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="premium-border-container group"
                >
                  <div className="premium-border-inner flex flex-col p-6 gap-6 min-h-[320px]">
                    {/* Status & Category */}
                    <div className="flex justify-between items-start">
                      <div className={`px-3 py-1 rounded-full text-[7px] uppercase font-black tracking-[0.2em] border ${
                        auto.category === "forense" ? "border-erani-blue/30 text-erani-blue bg-erani-blue/5" :
                        auto.category === "financiera" ? "border-erani-purple/30 text-erani-purple bg-erani-purple/5" :
                        "border-erani-coral/30 text-erani-coral bg-erani-coral/5"
                      }`}>
                        {auto.category}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          auto.status === "active" ? "bg-emerald-500" : "bg-gray-500"
                        }`} />
                        <span className="text-[8px] uppercase font-black tracking-widest text-nav-text">
                          {auto.status === "active" ? "En Línea" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground group-hover:text-erani-blue transition-colors flex items-center gap-2">
                        {auto.name}
                        {auto.status === "active" && <Zap className="w-4 h-4 text-erani-blue fill-erani-blue" />}
                      </h3>
                      <p className="text-nav-text text-xs leading-relaxed line-clamp-3">
                        {auto.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-glass-border">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-nav-text">
                          <BarChart3 className="w-3 h-3" />
                          <span className="text-[7px] uppercase font-black tracking-widest">ROI Proyectado</span>
                        </div>
                        <span className="text-xl font-black text-foreground">+{auto.roi_projection}%</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <div className="flex items-center gap-1.5 text-nav-text justify-end">
                          <Clock className="w-3 h-3" />
                          <span className="text-[7px] uppercase font-black tracking-widest">Ahorro Mensual</span>
                        </div>
                        <span className="text-xl font-black text-foreground">{auto.hours_saved_monthly}h</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => toggleAutomation(auto.id)}
                        className={`flex-1 py-3 rounded-xl text-[9px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all ${
                          auto.status === "active" 
                          ? "bg-foreground/5 text-foreground hover:bg-erani-coral/10 hover:text-erani-coral" 
                          : "bg-erani-blue text-white shadow-lg shadow-erani-blue/20 hover:scale-[1.02]"
                        }`}
                      >
                        {auto.status === "active" ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" /> Detener Flujo
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" /> Activar n8n
                          </>
                        )}
                      </button>
                      
                      <button className="p-3 rounded-xl bg-foreground/5 text-nav-text hover:text-foreground transition-all">
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </div>

                    {auto.last_run && (
                      <div className="text-[7px] text-center text-nav-text uppercase font-medium tracking-[0.2em]">
                        Última ejecución: {auto.last_run.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* n8n Status Card */}
            <div className="glassmorphism p-6 flex flex-col gap-6 bg-gradient-to-br from-erani-blue/5 to-transparent border-erani-blue/10 min-h-[320px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-erani-blue/10 flex items-center justify-center border border-erani-blue/20">
                  <Cpu className="w-5 h-5 text-erani-blue" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-black tracking-widest text-erani-blue">n8n System Status</span>
                  <span className="text-xs font-black text-foreground">ERANI Node Cluster v2</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Memory Usage", value: "240MB / 1GB", progress: 24 },
                  { label: "CPU Load", value: "12%", progress: 12 },
                  { label: "Webhook Latency", value: "45ms", progress: 5 }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between text-[7px] uppercase font-black tracking-widest">
                      <span className="text-nav-text">{stat.label}</span>
                      <span className="text-foreground">{stat.value}</span>
                    </div>
                    <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.progress}%` }}
                        className="h-full bg-erani-blue"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-[8px] uppercase font-black tracking-widest text-emerald-500">Todo el sistema nominal</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              </div>

              <button className="button-premium w-full py-4 rounded-xl text-[9px] uppercase font-black tracking-widest flex items-center justify-center gap-2">
                Open n8n Interface <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="glassmorphism p-10 mt-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border-erani-purple/20 bg-gradient-to-r from-erani-purple/5 via-transparent to-erani-blue/5">
             <div className="flex flex-col gap-3 max-w-xl text-center md:text-left">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                  ¿Necesitas un flujo <span className="text-erani-purple">Personalizado</span>?
                </h2>
                <p className="text-nav-text text-xs leading-relaxed">
                  Nuestro equipo de ingeniería forense puede diseñar automatizaciones específicas para tu agencia, integrando modelos de IA propietarios y conectores directos a tu stack financiero.
                </p>
             </div>
             <button className="button-premium px-10 py-5 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] hover:scale-105 transition-transform shrink-0 whitespace-nowrap">
                Solicitar Ingeniería de Flujo
             </button>
             
             {/* Decorative Elements */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-erani-purple/5 blur-[100px] -z-10" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-erani-blue/5 blur-[100px] -z-10" />
          </div>

        </div>
      </main>
    </div>
  );
}

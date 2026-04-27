"use client";

import { useState, useEffect } from "react";
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
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

// --- Types ---
interface ForensicTicket {
  id: string;
  description: string;
  filter: string;
  hrs: number;
  cost: number;
  status: 'execution' | 'blindspot' | 'capital_leak';
}

interface ForensicReportData {
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
  firewallImpact: { month: string; value: number }[];
  margenEvolucion: { month: string; value: string; desc: string }[];
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
  firewallImpact: [
    { month: "Mes 1", value: 0 },
    { month: "Mes 2", value: 0 },
    { month: "Mes 3", value: 0 },
  ],
  margenEvolucion: [
    { month: "Mes 1", value: "0%", desc: "Control de Fugas" },
    { month: "Mes 2", value: "0%", desc: "Visibilidad 100%" },
    { month: "Mes 3", value: "0%", desc: "Rentabilidad Estabilizada" },
  ]
};

type TabId = "scorecard" | "analysis" | "kpis" | "firewall" | "annex";

export default function ForensicPage() {
  const { isSidebarCollapsed } = useDashboard();
  const [activeTab, setActiveTab] = useState<TabId>("scorecard");
  const [data, setData] = useState<ForensicReportData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("Gemini 1.5 Flash");

  useEffect(() => {
    fetchForensicData();
  }, []);

  const fetchForensicData = async () => {
    try {
      setLoading(true);
      // In a real scenario, we would fetch by organization_id or similar
      const { data: report, error } = await supabase
        .from('forensic_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching forensic data:", error);
      } else if (report) {
        setData({
          projectName: report.project_name || "PROYECTO SIN NOMBRE",
          impactoDirecto: report.impacto_directo || 0,
          impactoFuturo: report.impacto_futuro || 0,
          scopeCreep: report.scope_creep || 0,
          rentabilidadPoint: report.rentabilidad_point || 0,
          coiAnual: report.coi_anual || 0,
          tickets: report.tickets || [],
          kpiRevisiones: report.kpi_revisiones || 0,
          kpiFriccionTalento: report.kpi_friccion_talento || 0,
          kpiDarkData: report.kpi_dark_data || 0,
          firewallImpact: report.firewall_impact || INITIAL_DATA.firewallImpact,
          margenEvolucion: report.margen_evolucion || INITIAL_DATA.margenEvolucion
        });
      }
    } catch (err) {
      console.error("System error:", err);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: "scorecard", label: "ScoreCard", icon: Target },
    { id: "analysis", label: "Análisis Forense", icon: TableIcon },
    { id: "kpis", label: "KPIs de Salud", icon: Activity },
    { id: "firewall", label: "Firewall / Blindaje", icon: Lock },
    { id: "annex", label: "Anexo Técnico", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-8 relative overflow-x-hidden`}>
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
                  {/* Model Selector */}
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl glassmorphism border border-white/5 group hover:border-erani-purple transition-all cursor-pointer">
                    <Cpu className="w-4 h-4 text-erani-purple" />
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">Motor de IA</span>
                       <span className="text-[10px] font-black text-foreground flex items-center gap-2">
                        {selectedModel} <ChevronDown className="w-3 h-3 text-gray-600" />
                      </span>
                    </div>
                  </div>

                   <ReportDownloader targetId="forensic-scorecard-grid" />
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
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3, ease: "easeOut" }}
             >
                 <div id="forensic-scorecard-grid">
                    {activeTab === "scorecard" && <ScoreCardTab data={data} />}
                    {activeTab === "analysis" && <AnalysisTab tickets={data.tickets} />}
                    {activeTab === "kpis" && <HealthKpisTab data={data} />}
                    {activeTab === "firewall" && <FirewallTab data={data} />}
                    {activeTab === "annex" && <AnnexTab />}
                 </div>
             </motion.div>
          </AnimatePresence>

          <footer className="mt-12 flex justify-between items-center opacity-30 text-[9px] uppercase font-bold tracking-[0.3em] text-gray-400">
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

  return <span>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function ScoreCardTab({ data }: { data: ForensicReportData }) {
  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      {/* Left Column: Title Section */}
      <div className="col-span-12 lg:col-span-4 flex flex-col justify-center gap-5 py-8 overflow-hidden">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 12 }}
            transition={{ type: "spring", damping: 10 }}
            className="w-14 h-14 rounded-2xl bg-erani-purple/10 flex items-center justify-center border border-erani-purple/20 shadow-lg shadow-erani-purple/10"
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

function AnalysisTab({ tickets }: { tickets: ForensicTicket[] }) {
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
                   <tr key={ticket.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                         <span className="px-3 py-1.5 rounded-lg bg-erani-coral/10 text-erani-coral text-[10px] font-mono font-bold border border-erani-coral/20">
                           {ticket.id}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-300">{ticket.description}</td>
                      <td className="px-8 py-5 text-xs font-mono text-gray-500">[{ticket.filter}]</td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-300 text-right">{ticket.hrs}</td>
                      <td className="px-8 py-5 text-sm font-bold text-erani-coral text-right">
                        <AnimatedNumber value={ticket.cost} prefix="$" suffix=".00" />
                      </td>
                   </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-xs uppercase font-black tracking-widest text-gray-600 opacity-50">
                       Esperando Hidratación de Datos de Gemini...
                    </td>
                  </tr>
                )}
             </tbody>
             {tickets.length > 0 && (
                <tfoot className="bg-white/5 border-t border-white/10">
                   <tr className="font-black">
                      <td className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-white">Total</td>
                      <td colSpan={2} className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-gray-500 text-center">Total Conciliado</td>
                      <td className="px-8 py-6 text-sm text-gray-300 text-right">
                        <AnimatedNumber value={tickets.reduce((acc, t) => acc + t.hrs, 0)} decimals={1} />
                      </td>
                      <td className="px-8 py-6 text-lg text-erani-coral text-right">
                        <AnimatedNumber value={tickets.reduce((acc, t) => acc + t.cost, 0)} prefix="$" />
                      </td>
                   </tr>
                </tfoot>
             )}
          </table>
       </div>

       <div className="flex justify-between items-start gap-12 px-8">
          <div className="flex flex-col gap-4 max-w-2xl text-[10px] font-bold leading-relaxed text-gray-500">
             <p>Fuga Externa (Cliente): $8,400.00 (Focus Group y Validaciones no previstas).</p>
             <p>Fuga Interna (Equipo): $8,400.00 (Deuda técnica y bugs de integración).</p>
             <p className="opacity-50 font-medium">Estado del Inventario: De los {tickets.length} tickets totales, 11 han sido liquidados (Fuga Confirmada) y 15 permanecen en "To Do/In Process", representando un Riesgo Latente de $24,300.00 que aún no se ha detenido.</p>
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
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">Monitor de Bucle de Revisiones</span>
             </div>
             <div className="flex items-center justify-center relative py-8">
                <div className="text-4xl font-black text-white">
                  <AnimatedNumber value={data.kpiRevisiones} suffix="%" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                   {/* Simplified Donut Visual */}
                   <motion.div 
                     initial={{ rotate: 0 }}
                     animate={{ rotate: 360 }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="w-32 h-32 rounded-full border-[12px] border-white/5 border-t-[#9e80ff]" 
                   />
                </div>
             </div>
             <p className="text-[10px] font-bold text-gray-500 leading-relaxed text-center">
                Umbral SODA superado. Las tareas están regresando a revisión más de lo tolerable, indicando falta de claridad en el SOW original.
             </p>
          </div>

          {/* Talent Friction & Dark Data */}
          <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
             <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/5 grid grid-cols-2 gap-12">
                <div className="flex flex-col gap-6 border-r border-white/5 pr-12">
                   <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">Índice de Fricción de Talento</span>
                   <div className="text-4xl font-black text-white">
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
                     La mayoría de los tickets presentan una latencia superior a 72 horas desde su creación hasta su última actualización, indicando "Ceguera Operativa".
                   </p>
                </div>
                <div className="flex flex-col gap-6">
                   <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-6">
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">Índice de Datos Oscuros (Dark Data Index)</span>
                        <div className="text-4xl font-black text-white">
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
                     ERANI tuvo que iluminar la totalidad de la metadata mediante Inferencia de Nivel 2 debido a la ausencia absoluta de registros manuales (0% logs).
                   </p>
                </div>
             </div>

             <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-2 max-w-md">
                   <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">Intensidad de Scope Creep</span>
                   <p className="text-[9px] font-medium text-gray-600 leading-relaxed">
                     La mitad de la fuga es atribuible directamente a solicitudes externas ([EXT]) que no estaban presupuestadas como horas de consultoría/ajuste.
                   </p>
                </div>
                <div className="flex items-center gap-6">
                   <span className="text-3xl font-black text-white">
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
                      <motion.div 
                        initial={{ left: 0 }}
                        animate={{ left: `${data.scopeCreep}%` }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="absolute top-0 bottom-0 border-r-4 border-[#9e80ff] h-full rounded-r-full" 
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
          <h3 className="text-3xl font-black uppercase text-white tracking-tight">El Firewall</h3>
          <p className="text-xs uppercase font-bold tracking-widest text-gray-500">Recomendaciones del Sistema</p>
       </div>

       <div className="grid grid-cols-2 gap-8">
          <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-4">
             <div className="flex items-center gap-3 text-erani-purple">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[10px] uppercase font-black tracking-widest">Protocolos de Bloqueo</span>
             </div>
             <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                Implementación de un Middleware de IA para interceptar tickets de ClickUp. Si un ticket no tiene "Time Estimate" o pertenece a "Focus Group" sin orden de cambio, el sistema enviará una Alerta de Intruso inmediata.
             </p>
          </div>
          <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-4">
             <div className="flex items-center gap-3 text-emerald-500">
                <Zap className="w-5 h-5" />
                <span className="text-[10px] uppercase font-black tracking-widest">ROI de Automatización</span>
             </div>
             <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                Al detener el "Pilón" sistemático, la inversión en el Firewall se recupera en los primeros 21 días de operación blindada. <br /><br />
                Se proyecta una estabilización del margen neto al +30% para el tercer mes, eliminando la hemorragia por retrabajos técnicos.
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

function AnnexTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 opacity-30">
       <FileText className="w-16 h-16 text-gray-600" />
       <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase font-black tracking-[0.5em] text-gray-500">Anexo Técnico Detallado</span>
          <p className="text-[10px] font-bold text-gray-600">Exportación de Metadata Cruda para Auditoría Externa</p>
       </div>
       <button className="px-8 py-4 rounded-xl border border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest hover:border-white/30 transition-all">
          Generar PDF de Evidencia
       </button>
    </div>
  );
}

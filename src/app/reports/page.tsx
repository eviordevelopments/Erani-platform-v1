"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Search, 
  Calendar,
  ShieldCheck,
  ArrowRight,
  Filter,
  Loader2,
  AlertTriangle
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { auditLogger } from "@/lib/auditLogger";

interface ForensicReport {
  id: string;
  project_id: string;
  project_name: string;
  pdf_url: string | null;
  impacto_directo: number;
  created_at: string;
}

export default function ReportsHistoryPage() {
  const { isSidebarCollapsed } = useDashboard();
  const { profile } = useAuth();
  
  const [reports, setReports] = useState<ForensicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "high-impact">("all");

  useEffect(() => {
    if (profile?.organization_id) {
      fetchReports();
    }
  }, [profile]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forensic_reports')
        .select('id, project_id, project_name, pdf_url, impacto_directo, created_at')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching historical reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.project_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "high-impact" && r.impacto_directo > 50000);
    return matchesSearch && matchesFilter;
  });

  const handleDownload = async (report: ForensicReport) => {
    if (!report.pdf_url) return;
    
    // Log the download event
    await auditLogger.log(
      'REPORT_DOWNLOAD', 
      `Descarga de reporte histórico: ${report.project_name}`,
      { reportId: report.id, projectId: report.project_id },
      'download'
    );
    
    window.open(report.pdf_url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[112px]" : "ml-[312px]"} p-10 lg:p-14 relative overflow-x-hidden`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-erani-blue/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-erani-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-[1400px] flex flex-col gap-10">
          
          {/* Header */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                   <h1 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                      <FileText className="w-8 h-8 text-erani-blue" />
                      Historial de Peritajes
                   </h1>
                   <p className="text-xs uppercase font-bold tracking-widest text-gray-500">
                      Archivo Central de Auditorías Forenses y Documentación de ROI
                   </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Buscar por proyecto o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/5 border border-glass-border pl-12 pr-6 py-3 rounded-xl text-xs font-bold text-foreground focus:border-erani-blue focus:outline-none transition-all w-80"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setFilter(filter === "all" ? "high-impact" : "all")}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-[10px] uppercase font-black tracking-widest ${
                      filter === "high-impact" 
                      ? "bg-erani-coral/10 border-erani-coral/30 text-erani-coral" 
                      : "bg-white/5 border-glass-border text-gray-400 hover:text-white"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {filter === "high-impact" ? "Alto Impacto" : "Todos"}
                  </button>
                </div>
            </div>
          </div>

          {/* Reports Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-10 h-10 text-erani-blue animate-spin" />
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 animate-pulse">Sincronizando Archivo...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 px-10 rounded-[3rem] bg-white/[0.02] border border-dashed border-white/10 text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-gray-700" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black uppercase text-foreground">Sin Registros</h3>
                <p className="text-sm text-gray-500 max-w-sm">No se encontraron reportes históricos que coincidan con tu búsqueda o criterios de filtrado.</p>
              </div>
              <button 
                onClick={() => window.location.href = '/audit'}
                className="button-premium px-8 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest"
              >
                Iniciar Nueva Auditoría
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredReports.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border group hover:border-erani-blue/30 transition-all flex flex-col gap-6 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-2xl bg-erani-blue/10 border border-erani-blue/20 text-erani-blue">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-gray-700 bg-black/20 px-3 py-1 rounded-full">
                        {report.project_id}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-black uppercase tracking-tight text-foreground truncate group-hover:text-erani-blue transition-colors">
                        {report.project_name}
                      </h3>
                      <div className="flex items-center gap-2 text-[9px] uppercase font-bold text-gray-500 tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] uppercase font-black tracking-widest text-gray-600">Impacto Directo</span>
                        <span className="text-lg font-black text-erani-coral">
                          ${report.impacto_directo?.toLocaleString() || "0"} <span className="text-[10px]">MXN</span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 items-end text-right">
                        <span className="text-[8px] uppercase font-black tracking-widest text-gray-600">Status</span>
                        <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Archivado
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleDownload(report)}
                        disabled={!report.pdf_url}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${
                          report.pdf_url 
                          ? "bg-foreground text-background hover:bg-erani-blue hover:text-white" 
                          : "bg-white/5 text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {report.pdf_url ? <Download className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                        PDF
                      </button>
                      <button 
                        onClick={() => window.location.href = `/forensic?id=${report.id}`}
                        className="p-4 rounded-xl border border-glass-border text-nav-text hover:text-foreground hover:bg-white/5 transition-all"
                        title="Ver Dashboard Forense"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Decorative Gradient */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-erani-blue/5 blur-3xl group-hover:bg-erani-blue/10 transition-all pointer-events-none" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <footer className="mt-12 flex justify-between items-center opacity-30 text-[9px] uppercase font-bold tracking-[0.3em] text-gray-400">
             <span>Historical Asset Repository | Erani Platform v1.2</span>
             <span className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Encrypted Historical Persistence
             </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

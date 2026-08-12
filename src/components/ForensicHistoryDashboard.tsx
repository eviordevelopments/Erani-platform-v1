"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Tag, Filter, ShieldAlert, AlertTriangle, ArrowRight, LayoutGrid, Calendar, ChevronDown, Database } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ForensicHistoryDashboardProps {
  organizationId: string | null;
}

interface ProjectTag {
  id: string;
  label: string;
  name?: string;
  color: string;
}

interface HistoryReport {
  id: string;
  project_id: string;
  project_name: string;
  project_size: string;
  created_at: string;
  pdf_url: string | null;
  tags: ProjectTag[];
  fuga_estimada?: number;
  parent_project_name?: string;
}

export default function ForensicHistoryDashboard({ organizationId }: ForensicHistoryDashboardProps) {
  const router = useRouter();
  const [reports, setReports] = useState<HistoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [workspaceTags, setWorkspaceTags] = useState<ProjectTag[]>([]);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [isSizeFilterOpen, setIsSizeFilterOpen] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchHistory();
      fetchWorkspaceTags();
    }
  }, [organizationId]);

  const fetchWorkspaceTags = async () => {
    try {
      const { data, error } = await supabase.from('workspace_tags').select('*').eq('organization_id', organizationId);
      if (data) setWorkspaceTags(data as any);
    } catch(e) {}
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forensic_reports')
        .select('id, project_id, project_name, created_at, payload_completo')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all audits and collections to map real names
      const [{ data: auditsData }, { data: collectionsData }] = await Promise.all([
        supabase.from('audits').select('id, metadata, collection_id').eq('organization_id', organizationId),
        supabase.from('collections').select('id, name').eq('organization_id', organizationId)
      ]);

      let localProjectsMap: Record<string, string> = {};
      try {
        const localData = localStorage.getItem('erani_projects');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              if (p.id) localProjectsMap[p.id] = p.name || p.label || "";
            });
          } else {
            localProjectsMap = parsed;
          }
        }
      } catch (e) {}

      const collectionsMap = new Map<string, string>();
      if (collectionsData) collectionsData.forEach((c: any) => collectionsMap.set(c.id, c.name));

      const auditsMap = new Map<string, any>();
      if (auditsData) auditsData.forEach((a: any) => auditsMap.set(a.id, a));

      const mappedReports: HistoryReport[] = (data || []).map((row: any) => {
        const metadata = row.payload_completo?.report_metadata || {};
        const slide2 = row.payload_completo?.slide_2_analisis_forense || {};
        const fugaInterna = slide2?.resumen_consolidacion?.fuga_interna_mxn || 0;
        const fugaExterna = slide2?.resumen_consolidacion?.fuga_externa_mxn || 0;
        
        let finalName = "Auditoría sin Nombre";
        let parentName = "Proyecto General";
        
        const audit = auditsMap.get(row.project_id);
        if (audit) {
           finalName = audit.metadata?.name || finalName;
           if (audit.collection_id) {
             parentName = collectionsMap.get(audit.collection_id) || parentName;
           }
        } else {
           // Fallback checks for legacy reports
           if (collectionsMap.has(row.project_id)) {
             finalName = collectionsMap.get(row.project_id) || finalName;
             parentName = collectionsMap.get(row.project_id) || parentName;
           } else if (localProjectsMap[row.project_id]) {
             finalName = localProjectsMap[row.project_id] || finalName;
             parentName = localProjectsMap[row.project_id] || parentName;
           } else {
             finalName = metadata.project_name || row.project_name || finalName;
           }
        }
        
        return {
          id: row.id,
          project_id: row.project_id,
          project_name: finalName,
          parent_project_name: parentName,
          project_size: row.project_size || metadata.project_size || "medium",
          created_at: row.created_at,
          pdf_url: row.pdf_url,
          tags: metadata.tags || [],
          fuga_estimada: fugaInterna + fugaExterna
        };
      });

      setReports(mappedReports);
    } catch (err) {
      console.error("Error fetching forensic history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique tags from all reports
  const allTagsMap = new Map<string, ProjectTag>();
  reports.forEach(r => {
    r.tags.forEach(t => allTagsMap.set(t.label, t));
  });
  const uniqueTags = Array.from(allTagsMap.values());

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSize = selectedSize === "all" || r.project_size === selectedSize;
    const matchesTag = selectedTag === "all" || r.tags.some(t => t.label === selectedTag);
    return matchesSearch && matchesSize && matchesTag;
  });

  const getSizeLabel = (size: string) => {
    switch(size) {
      case 'small': return 'Pequeño';
      case 'large': return 'Grande';
      default: return 'Mediano';
    }
  };

  const getTagColorClass = (colorStr: string) => {
    if (colorStr.includes('blue')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (colorStr.includes('purple')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (colorStr.includes('coral') || colorStr.includes('red')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (colorStr.includes('green')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (colorStr.includes('yellow')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col relative overflow-hidden">
      
      {/* Background decorations matching the main page */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-erani-blue/5 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-erani-purple/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="p-8 pb-0 flex flex-col gap-4 z-20">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                 <span className="text-[10px] uppercase font-black tracking-[0.2em] text-nav-text">
                    Diagnóstico Forense de Infraestructura
                 </span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                 Dictámenes de <span className="text-gradient-brand">Peritaje Forense</span>
              </h1>
           </div>

           <div className="flex items-center gap-4">
             <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar en proyectos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-foreground/5 border border-glass-border rounded-full pl-12 pr-6 py-3 text-[11px] font-bold w-48 focus:outline-none focus:border-erani-blue/50 transition-all placeholder:text-gray-600 text-foreground"
            />
          </div>

          {/* Tag Filter */}
          <div className="relative">
            <button 
              onClick={() => { setIsTagFilterOpen(!isTagFilterOpen); setIsSizeFilterOpen(false); }}
              className="bg-foreground/5 hover:bg-foreground/10 border border-glass-border rounded-full pl-10 pr-4 py-3 text-[10px] font-bold text-foreground cursor-pointer transition-all flex items-center gap-2 relative min-w-[160px] text-left"
            >
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <span className="flex-1 truncate">{selectedTag === 'all' ? 'Todas las Etiquetas' : selectedTag}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isTagFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isTagFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-2 right-0 w-56 z-50 p-2 rounded-2xl border border-glass-border shadow-2xl bg-background backdrop-blur-xl flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar"
                >
                  <button 
                    onClick={() => { setSelectedTag('all'); setIsTagFilterOpen(false); }}
                    className={`text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${selectedTag === 'all' ? 'bg-erani-blue/10 text-erani-blue' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
                  >
                    Todas las Etiquetas
                  </button>
                  {workspaceTags.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => { setSelectedTag(t.name || t.label); setIsTagFilterOpen(false); }}
                      className={`text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 ${selectedTag === (t.name || t.label) ? `bg-${t.color}/10 text-${t.color}` : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
                    >
                      <div className={`w-2 h-2 rounded-full bg-${t.color}`} />
                      {t.name || t.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Size Filter */}
          <div className="relative">
            <button 
              onClick={() => { setIsSizeFilterOpen(!isSizeFilterOpen); setIsTagFilterOpen(false); }}
              className="bg-foreground/5 hover:bg-foreground/10 border border-glass-border rounded-full pl-10 pr-4 py-3 text-[10px] font-bold text-foreground cursor-pointer transition-all flex items-center gap-2 relative min-w-[150px] text-left"
            >
              <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <span className="flex-1 truncate">
                {selectedSize === 'all' ? 'Cualquier Tamaño' : 
                 selectedSize === 'small' ? 'Small (Pequeño)' : 
                 selectedSize === 'medium' ? 'Medium (Mediano)' : 
                 'Large (Grande)'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isSizeFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isSizeFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-2 right-0 w-48 z-50 p-2 rounded-2xl border border-glass-border shadow-2xl bg-background backdrop-blur-xl flex flex-col gap-1"
                  >
                    {[
                      { id: 'all', label: 'Cualquier Tamaño' },
                      { id: 'small', label: 'Small (Pequeño)' },
                      { id: 'medium', label: 'Medium (Mediano)' },
                      { id: 'large', label: 'Large (Grande)' }
                    ].map(size => (
                      <button 
                        key={size.id}
                        onClick={() => { setSelectedSize(size.id); setIsSizeFilterOpen(false); }}
                        className={`text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${selectedSize === size.id ? 'bg-erani-blue/10 text-erani-blue' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <p className="text-xs uppercase font-bold tracking-widest text-gray-500 max-w-4xl leading-relaxed">
          Espacio de hidratación y alimentación de reportes. Selecciona una auditoría procesada para renderizar sus métricas en la vista dinámica de slides interactivas y exportar tu dictamen en PDF.
        </p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative z-10">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-erani-blue/20 border-t-erani-blue rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-gray-500">Cargando repositorio forense...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed border-glass-border rounded-2xl bg-background/50 backdrop-blur-md shadow-sm">
          <ShieldAlert className="w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wider">No hay reportes encontrados</h3>
          <p className="text-sm text-gray-500">Aún no hay auditorías con estos filtros. Genera una desde Auditorías y Proyectos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReports.map((report, i) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push('/forensic?id=' + report.id)}
              className="premium-border-container group h-full cursor-pointer min-h-[300px]"
            >
              <div className="premium-border-inner p-6 md:p-8 flex flex-col items-stretch h-full w-full relative z-10">

              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider text-foreground pr-4 line-clamp-2 leading-tight group-hover:text-erani-blue transition-colors">
                      {report.project_name}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-1 break-all select-all">
                      ID: {report.project_id}
                    </p>
                    {report.parent_project_name && (
                      <p className="text-[10px] text-erani-blue font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                        📁 {report.parent_project_name}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 rounded-xl bg-background border shrink-0 ${report.pdf_url ? 'border-erani-purple/30 text-erani-purple' : 'border-glass-border text-gray-500'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    {getSizeLabel(report.project_size)}
                  </span>
                </div>
              </div>

              {report.fuga_estimada ? (
                <div className="mt-2 mb-4 bg-background border border-red-900/30 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-red-500/70 font-bold">Fuga Detectada</p>
                    <p className="text-sm font-black text-red-400">{formatCurrency(report.fuga_estimada)}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 mb-4 h-14" />
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-glass-border">
                {report.tags && report.tags.length > 0 ? (
                  report.tags.map(t => (
                    <span key={t.id} className={`text-[9px] px-2 py-1 rounded border font-bold uppercase tracking-wider ${getTagColorClass(t.color)}`}>
                      {t.label}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] px-2 py-1 rounded border border-glass-border bg-background text-gray-500 font-bold uppercase tracking-wider">
                    Sin etiquetas
                  </span>
                )}
              </div>
              
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="w-5 h-5 text-erani-blue" />
              </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

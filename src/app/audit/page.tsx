"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { 
  Plus, 
  Folder, 
  Settings, 
  Trash2, 
  Search, 
  Shield, 
  History, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  UploadCloud,
  X,
  AlertTriangle,
  Database,
  ArrowLeft,
  Calendar,
  Layers,
  Cpu,
  Target,
  Briefcase,
  BarChart3,
  Globe,
  Users,
  Timer,
  Cloud,
  Lock,
  Zap,
  TrendingUp,
  ArrowUpRight,
  BarChart,
  FileJson,
  Server
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { auditLogger } from "@/lib/auditLogger";
import { useRef } from "react";
import { ForensicReport } from "@/types/forensic";
import DonutChart from "@/components/DonutChart";
import RealtimeLogTerminal from "@/components/RealtimeLogTerminal";
import { supabase } from "@/lib/supabase";

interface ForensicFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "ingesting" | "completed" | "error";
  progress: number;
  error?: string;
}

interface Project {
  id: string;
  name: string;
  icon?: string;
  size: "small" | "medium" | "large";
  files: ForensicFile[];
  status: "idle" | "processing" | "completed";
  createdAt: string;
  serverRegion: string;
  teamAccess: string[];
  isTemporal: boolean;
  expirationHours: number;
  settings: {
    allowStorage: boolean;
    historicalContext: boolean;
    aiModel: string;
    aiTemperature: number;
  };
}

const PROJECT_SIZES = {
  small: { label: "Pequeño", description: "25 registros o menos", color: "erani-blue" },
  medium: { label: "Mediano", description: "25 a 50 registros", color: "erani-purple" },
  large: { label: "Grande", description: "75 registros o más", color: "erani-coral" }
};

export default function AuditProtocolPage() {
  const { isSidebarCollapsed, uploadedFiles } = useDashboard();
  const { user, profile, updateErisBalance } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"setup" | "manage" | "processing" | "report">("manage");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const activeProject = projects.find(p => p.id === activeProjectId);
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectingIconFor, setSelectingIconFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actualFiles, setActualFiles] = useState<Record<string, File[]>>({});

  // Processing Animation State
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [analysisLogs, setAnalysisLogs] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warning' }[]>([]);
  const [analysisError, setAnalysisError] = useState<{ message: string; stage: string } | null>(null);
  const [inferenceStats, setInferenceStats] = useState({ memory: 0.8, params: 12.1 });
  
  const ICON_LIBRARY = [
    { id: 'folder', icon: Folder },
    { id: 'shield', icon: Shield },
    { id: 'database', icon: Database },
    { id: 'layers', icon: Layers },
    { id: 'cpu', icon: Cpu },
    { id: 'target', icon: Target },
    { id: 'briefcase', icon: Briefcase },
    { id: 'barchart', icon: BarChart3 },
  ];

  const PROCESSING_STEPS = [
    { id: "METADATA_PARSING", label: "Consolidación de Archivos y Metadata", icon: FileText },
    { id: "RAG_RETRIEVAL", label: "Triangulación de Logs Operativos (RAG)", icon: Layers },
    { id: "MODEL_INIT", label: "Inicializando Motor de Inferencia ERANI V1", icon: Cpu },
    { id: "GEMINI_INFERENCE", label: "Análisis Forense con Inferencia Estratégica", icon: Database },
    { id: "REPORT_PERSISTENCE", label: "Generando Reporte Ejecutivo de Alta Fidelidad", icon: FileJson }
  ];

  const handleChangeIcon = (projectId: string, iconId: string) => {
      setProjects(projects.map(p => p.id === projectId ? { ...p, icon: iconId } : p));
      setSelectingIconFor(null);
  };

  const toggleProjectSetting = (projectId: string, setting: 'allowStorage' | 'historicalContext' | 'aiModel' | 'aiTemperature', value?: any) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updated = { ...p, settings: { ...p.settings, [setting]: value !== undefined ? value : !p.settings[setting as keyof typeof p.settings] } };
        // Sync to DB
        syncProjectToDB(updated);
        return updated;
      }
      return p;
    }));
  };

  const syncProjectToDB = async (project: Project) => {
    if (!profile?.organization_id) return;
    
    const { error } = await supabase
      .from('audits')
      .upsert({
        id: project.id.includes('-') && project.id.length > 20 ? project.id : undefined, // Check if it's a UUID
        organization_id: profile.organization_id,
        created_by: profile.id,
        status: project.status,
        metadata: {
          ...project,
          // Avoid circular or redundant data if needed
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) console.error("Error syncing project to DB:", error);
  };

  // New Project Form
  const [newProject, setNewProject] = useState({
    name: "",
    size: "small" as "small" | "medium" | "large",
    allowStorage: true,
    historicalContext: true,
    serverRegion: "us-west",
    teamAccess: ["Admin", "Security Ops"],
    isTemporal: false,
    expirationHours: 24,
    aiModel: "gemini-2.5-flash",
    aiTemperature: 0.7
  });

  // Load projects from Supabase
  useEffect(() => {
    if (profile?.organization_id) {
      const fetchProjects = async () => {
        const { data, error } = await supabase
          .from('audits')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error loading audits:", error);
          return;
        }

        if (data && data.length > 0) {
          const mappedProjects: Project[] = data.map(d => ({
            id: d.id,
            name: d.metadata?.name || "Proyecto sin nombre",
            icon: d.metadata?.icon || "folder",
            size: d.metadata?.size || "medium",
            files: d.metadata?.files || [],
            status: d.status as any,
            createdAt: d.created_at,
            serverRegion: d.metadata?.serverRegion || "us-west",
            teamAccess: d.metadata?.teamAccess || [],
            isTemporal: d.metadata?.isTemporal || false,
            expirationHours: d.metadata?.expirationHours || 24,
            settings: d.metadata?.settings || {
              allowStorage: true,
              historicalContext: true,
              aiModel: "gemini-2.5-flash",
              aiTemperature: 0.7
            }
          }));
          setProjects(mappedProjects);
        } else {
          // If no projects in DB, set a default mock one but don't save it yet
          const mockProject: Project = {
            id: "PRJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
            name: "Auditoría de Rentabilidad Q1",
            size: "medium",
            files: [],
            status: "completed",
            createdAt: new Date().toISOString(),
            serverRegion: "us-west",
            teamAccess: ["Admin", "Security Ops"],
            isTemporal: false,
            expirationHours: 24,
            settings: { 
              allowStorage: true, 
              historicalContext: true,
              aiModel: "gemini-2.5-flash",
              aiTemperature: 0.7
            }
          };
          setProjects([mockProject]);
        }
      };
      fetchProjects();
    }
  }, [profile]);

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    
    // Deduct ERIS based on project size
    const cost = newProject.size === 'small' ? 15 : newProject.size === 'large' ? 45 : 30;
    const currentBalance = user?.user_metadata?.eris_balance ?? 100;
    
    await updateErisBalance(Math.max(0, currentBalance - cost));

    // Save to Supabase
    const { data, error } = await supabase
      .from('audits')
      .insert({
        organization_id: profile?.organization_id,
        created_by: profile?.id,
        status: 'idle',
        metadata: {
          name: newProject.name,
          icon: "folder",
          size: newProject.size,
          files: [],
          serverRegion: newProject.serverRegion,
          teamAccess: newProject.teamAccess,
          isTemporal: newProject.isTemporal,
          expirationHours: newProject.expirationHours,
          settings: { 
            allowStorage: newProject.allowStorage, 
            historicalContext: newProject.historicalContext,
            aiModel: newProject.aiModel,
            aiTemperature: newProject.aiTemperature
          }
        }
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project in Supabase:", error);
      return;
    }

    const project: Project = {
      id: data.id,
      name: data.metadata.name,
      icon: data.metadata.icon,
      size: data.metadata.size,
      files: [],
      status: "idle",
      createdAt: data.created_at,
      serverRegion: data.metadata.serverRegion,
      teamAccess: data.metadata.teamAccess,
      isTemporal: data.metadata.isTemporal,
      expirationHours: data.metadata.expirationHours,
      settings: data.metadata.settings
    };
    
    setProjects([project, ...projects]);
    setActiveProjectId(project.id);
    setView("setup");

    // LOG: Project Created
    await auditLogger.log('PROJECT_CREATE', `Proyecto creado: ${project.name}`, { 
      projectId: project.id, 
      size: project.size,
      region: project.serverRegion
    }, 'plus');

    setNewProject({ 
      name: "", 
      size: "small", 
      allowStorage: true, 
      historicalContext: true,
      serverRegion: "us-west",
      teamAccess: ["Admin", "Security Ops"],
      isTemporal: false,
      expirationHours: 24,
      aiModel: "gemini-2.5-flash",
      aiTemperature: 0.7
    });
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este proyecto? Esta acción es irreversible.")) {
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting project:", error);
        return;
      }

      setProjects(projects.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
    }
  };

  const ingestFile = async (projectId: string, file: File, fileId: string) => {
    try {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            files: p.files.map(f => f.id === fileId ? { ...f, status: "ingesting", progress: 10 } : f)
          };
        }
        return p;
      }));

      const formData = new FormData();
      formData.append('action', 'ingest');
      formData.append('projectId', projectId);
      formData.append('organizationId', profile?.organization_id || 'org_erani_test'); 
      formData.append('files', file);

      const response = await fetch(`/api/forensic?action=ingest`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            files: p.files.map(f => f.id === fileId ? { ...f, status: "completed", progress: 100 } : f)
          };
        }
        return p;
      }));

      // LOG: File Ingested
      await auditLogger.log('FILE_UPLOAD', `Archivo ingerido: ${file.name}`, { 
        projectId, 
        fileName: file.name,
        fileSize: file.size
      }, 'upload');
    } catch (err: any) {
      console.error("Error ingesting file:", err);
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            files: p.files.map(f => f.id === fileId ? { ...f, status: "error", error: err.message, progress: 0 } : f)
          };
        }
        return p;
      }));
    }
  };

  const handleFiles = (incomingFiles: File[]) => {
    if (activeProjectId && incomingFiles.length > 0) {
      // Store actual File objects for the session (non-persisted)
      setActualFiles(prev => ({
        ...prev,
        [activeProjectId]: [...(prev[activeProjectId] || []), ...incomingFiles]
      }));

      const newFiles: ForensicFile[] = incomingFiles.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        name: f.name,
        size: f.size,
        type: f.type,
        status: "pending",
        progress: 0
      }));

      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            files: [...p.files, ...newFiles]
          };
        }
        return p;
      }));

      // Start ingestion for each file
      incomingFiles.forEach((file, index) => {
        ingestFile(activeProjectId, file, newFiles[index].id);
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileClick = () => fileInputRef.current?.click();

  // Progress Simulation & API Integration Effect
  useEffect(() => {
    if (view === "processing" && activeProject) {
      setProcessingProgress(0);
      setCurrentStepIdx(0);
      setAnalysisLogs([]);
      setAnalysisError(null);
      
      let isSubscribed = true;

      const addLog = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
        if (!isSubscribed) return;
        setAnalysisLogs(prev => [...prev.slice(-15), { id: Math.random().toString(36).substr(2, 9), msg, type }]);
      };

      const triggerAnalysis = async () => {
        try {
          // Manual progress increments for UX while waiting for stages
          const progressInterval = setInterval(() => {
            setProcessingProgress(prev => {
              const stepSize = 100 / PROCESSING_STEPS.length;
              const targetMax = (currentStepIdx + 0.8) * stepSize;
              if (prev < targetMax) return prev + 0.15;
              return prev;
            });
          }, 60);

          // Simulate some granular logs based on steps
          const logInterval = setInterval(() => {
            const step = PROCESSING_STEPS[currentStepIdx];
            const randomLogs = {
              METADATA_PARSING: ["Analizando headers de archivos...", "Extrayendo metadatos de usuario...", "Validando integridad de hashes...", "Estructurando vectores base..."],
              RAG_RETRIEVAL: ["Consultando base de vectores...", "Triangulando patrones históricos...", "Recuperando fragmentos de contexto...", "Aumentando precisión de búsqueda..."],
              MODEL_INIT: ["Calentando motores de inferencia...", "Sincronizando pesos del modelo...", "Estableciendo conexión segura GTO...", "Optimizando latencia de clúster..."],
              GEMINI_INFERENCE: ["Ejecutando razonamiento probabilístico...", "Detectando anomalías operativas...", "Calculando impacto de inacción (COI)...", "Verificando consistencia semántica..."],
              REPORT_PERSISTENCE: ["Compilando hallazgos técnicos...", "Generando visualizaciones ejecutivas...", "Finalizando reporte de peritaje...", "Cifrando reporte de salida..."]
            };
            const currentMsgs = randomLogs[step.id as keyof typeof randomLogs] || [];
            const msg = currentMsgs[Math.floor(Math.random() * currentMsgs.length)];
            addLog(msg);

            // Update stats
            setInferenceStats(prev => ({
              memory: Math.min(3.8, prev.memory + Math.random() * 0.1),
              params: prev.params + Math.random() * 0.05
            }));
          }, 2000);

          addLog(`Iniciando auditoría: ${activeProject.name}`, 'info');
          addLog(`Configurando entorno en región ${activeProject.serverRegion}`, 'info');

          const formData = new FormData();
          formData.append('action',           'analyze');
          formData.append('organizationId',    profile?.organization_id || 'org_erani_test');
          formData.append('projectId',         activeProject.id);
          formData.append('allowStorage',      String(activeProject.settings.allowStorage));
          formData.append('historicalContext', String(activeProject.settings.historicalContext));
          formData.append('aiModel',           activeProject.settings.aiModel || 'gemini-2.5-flash'); 
          formData.append('aiTemperature',     String(activeProject.settings.aiTemperature));
          formData.append('isTemporal',        String(activeProject.isTemporal));

          const response = await fetch(`/api/forensic?action=analyze`, {
            method: 'POST',
            body: formData,
          });

          clearInterval(progressInterval);
          clearInterval(logInterval);

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw { 
              message: result.error || `Error del servidor: ${response.status}`, 
              stage: result.stage || "ERROR" 
            };
          }
          
          if (isSubscribed) {
            console.log("Análisis forense completado en backend");
            setProcessingProgress(100);
            setCurrentStepIdx(PROCESSING_STEPS.length - 1);
            
            if (result.report) {
              addLog("Análisis completado con éxito", 'success');
              setForensicReport(result.report);
              // Small delay to let the user see the 100% completion
              setTimeout(() => {
                if (isSubscribed) {
                   // Redirect to the dedicated forensic view with the specific report ID
                   if (result.dbRecord?.id) {
                     router.push(`/forensic?id=${result.dbRecord.id}&t=${Date.now()}`);
                   } else {
                     router.push(`/forensic?t=${Date.now()}`);
                   }
                }
              }, 1200);
            }
          }
        } catch (err: any) {
          console.error("Error en auditoría forense:", err);
          if (isSubscribed) {
            let errorMessage = err.message || "Fallo crítico en el motor forense.";
            
            // Specifically handle Google's high demand (503) error
            if (errorMessage.toLowerCase().includes("high demand") || errorMessage.toLowerCase().includes("service unavailable")) {
              errorMessage = "⚠️ ALTA DEMANDA: El modelo seleccionado está saturado en los servidores de Google. Por favor, intenta con 'Gemini 2.5 Flash-Lite' o reintenta en unos minutos.";
            }

            setAnalysisError({
              message: errorMessage,
              stage: err.stage || "UNKNOWN"
            });
            // Jump to the failing stage in UI if possible
            const stageIdx = PROCESSING_STEPS.findIndex(s => s.id === err.stage);
            if (stageIdx !== -1) {
              setCurrentStepIdx(stageIdx);
              setProcessingProgress((stageIdx / PROCESSING_STEPS.length) * 100 + 5);
            }
          }
        }
      };

      triggerAnalysis();
      
      return () => {
        isSubscribed = false;
      };
    }
  }, [view, activeProject]);



  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative flex flex-col h-screen`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-erani-blue/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-erani-purple/5 blur-[150px] rounded-full pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="p-8 pb-0 flex items-center justify-between z-20">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-nav-text">
                   Diagnóstico Forense de Infraestructura
                </span>
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                Gestión de <span className="text-gradient-brand">Auditorías y Proyectos</span>
             </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
                <input 
                  type="text"
                  placeholder="Buscar en evidencia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-foreground/5 border border-glass-border rounded-full pl-12 pr-6 py-3 text-[11px] font-bold w-64 focus:outline-none focus:border-erani-blue/50 transition-all placeholder:text-gray-600"
                />
             </div>
             <button 
                onClick={() => setView("manage")}
                className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'manage' ? 'bg-foreground text-background shadow-xl' : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border border-glass-border'}`}
             >
                Administrar Proyectos
             </button>
             <button 
                onClick={() => { setView("setup"); setActiveProjectId(null); }}
                className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'setup' && !activeProjectId ? 'bg-erani-blue text-white shadow-xl shadow-erani-blue/20' : 'bg-erani-blue/10 text-erani-blue hover:bg-erani-blue/20'}`}
             >
                <Plus className="w-4 h-4" /> Nuevo Proyecto
             </button>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {/* VIEW: MANAGE PROJECTS */}
            {view === "manage" && (
              <motion.div 
                key="manage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {(() => {
                  const filtered = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()));
                  
                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-glass-border rounded-[3rem] bg-foreground/5 opacity-80 hover:opacity-100 hover:border-erani-blue/50 transition-all cursor-pointer" onClick={() => { setView("setup"); setActiveProjectId(null); }}>
                         <div className="w-20 h-20 rounded-3xl bg-erani-blue/10 flex items-center justify-center text-erani-blue mb-2">
                            <Folder className="w-10 h-10" />
                         </div>
                         <div className="text-center flex flex-col gap-2">
                             <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Aún no hay auditorías</h3>
                             <p className="text-xs font-medium text-gray-500 max-w-md">No se encontraron proyectos forenses o archivos. Inicia configurando tu primer entorno de auditoría para comenzar.</p>
                         </div>
                         <button className="mt-4 px-8 py-4 bg-erani-blue text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-erani-blue/20">
                            <Plus className="w-4 h-4" /> Agrega tu primer proyecto
                         </button>
                      </div>
                    )
                  }

                  return filtered.map((project) => (
                    <div key={project.id} className="premium-border-container group">
                      <div className="premium-border-inner p-6 flex flex-col gap-5 h-full">
                        <div className="flex justify-between items-start">
                          <div className="relative z-20">
                             <button 
                               onClick={() => setSelectingIconFor(selectingIconFor === project.id ? null : project.id)}
                               className="w-12 h-12 rounded-2xl bg-erani-blue/10 flex items-center justify-center text-erani-blue hover:bg-erani-blue/20 transition-colors border border-erani-blue/20"
                             >
                                {(() => {
                                   const IconComp = ICON_LIBRARY.find(i => i.id === (project.icon || 'folder'))?.icon || Folder;
                                   return <IconComp className="w-6 h-6" />;
                                })()}
                             </button>
                             
                             <AnimatePresence>
                               {selectingIconFor === project.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute top-14 left-0 z-50 glassmorphism p-3 rounded-2xl border border-glass-border shadow-2xl grid grid-cols-4 gap-2 w-48 bg-background/80 backdrop-blur-xl"
                                  >
                                     {ICON_LIBRARY.map((item) => (
                                        <button 
                                          key={item.id}
                                          onClick={() => handleChangeIcon(project.id, item.id)}
                                          className={`p-2.5 flex items-center justify-center rounded-xl transition-colors ${project.icon === item.id || (!project.icon && item.id === 'folder') ? 'bg-erani-blue/20 text-erani-blue' : 'text-gray-500 hover:bg-foreground/10 hover:text-foreground'}`}
                                        >
                                           <item.icon className="w-4 h-4" />
                                        </button>
                                     ))}
                                  </motion.div>
                               )}
                             </AnimatePresence>
                          </div>

                          <div className="flex gap-2 relative z-10">
                            <button 
                              onClick={() => { setActiveProjectId(project.id); setView("setup"); }}
                              className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-gray-500 hover:text-foreground transition-all"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProject(project.id)}
                              className="p-2 rounded-lg bg-erani-coral/10 hover:bg-erani-coral/20 text-erani-coral transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-erani-blue/80">{project.id}</span>
                          <h3 className="text-lg leading-tight font-black uppercase tracking-tight text-foreground line-clamp-2" title={project.name}>{project.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <Calendar className="w-3.5 h-3.5 text-gray-500" />
                             <span className="text-[10px] font-bold text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-between">
                            <span className="text-[9px] uppercase font-black text-gray-500">Archivos</span>
                            <span className="text-sm font-black text-foreground">{project.files.length}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-between">
                            <span className="text-[9px] uppercase font-black text-gray-500">Volumen</span>
                            <span className={`text-[10px] font-black uppercase text-${PROJECT_SIZES[project.size].color}`}>
                              {PROJECT_SIZES[project.size].label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-5 border-t border-glass-border mt-auto">
                          <div className="flex items-center gap-2">
                             <History className={`w-4 h-4 ${project.settings.historicalContext ? 'text-emerald-500' : 'text-gray-500'}`} />
                             <div className="flex flex-col">
                                 <span className="text-[8px] uppercase font-black text-gray-500">Contexto AI</span>
                                 <span className={`text-[9px] font-bold ${project.settings.historicalContext ? 'text-emerald-500' : 'text-gray-500'}`}>
                                   {project.settings.historicalContext ? 'Activo' : 'Inactivo'}
                                 </span>
                             </div>
                          </div>
                          <button 
                            onClick={() => { setActiveProjectId(project.id); setView("setup"); }}
                            className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-erani-blue/10 hover:bg-erani-blue/20 text-erani-blue text-[9px] font-black uppercase tracking-widest transition-all gap-2"
                          >
                            Abrir <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </motion.div>
            )}

            {/* VIEW: SETUP PROJECT */}
            {view === "setup" && !activeProjectId && (
              <motion.div 
                key="setup-new"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 h-full"
              >
                <div className="flex items-center justify-between">
                   <button 
                    onClick={() => setView("manage")}
                    className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-all"
                   >
                     <ArrowLeft className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Volver a Proyectos</span>
                   </button>
                   <div className="flex flex-col items-end">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Nueva <span className="text-gradient-brand">Misión Forense</span></h2>
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Configuración de Parámetros</p>
                   </div>
                </div>

                <div className="glassmorphism p-10 rounded-[3rem] border border-glass-border flex-1 grid lg:grid-cols-2 gap-12">
                   <div className="flex flex-col gap-10">
                      <div className="flex flex-col gap-4">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Nombre de la Auditoría / Proyecto</label>
                          <input 
                            type="text"
                            placeholder="Ej. Auditoría de Marketing Q2 - Agencia X"
                            value={newProject.name}
                            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                            className="input-premium py-6"
                          />
                      </div>

                      <div className="flex flex-col gap-4">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Volumen de Datos Estimado</label>
                          <div className="grid grid-cols-3 gap-4">
                            {(Object.keys(PROJECT_SIZES) as Array<keyof typeof PROJECT_SIZES>).map(size => (
                              <button
                                key={size}
                                onClick={() => setNewProject({...newProject, size})}
                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 text-center ${
                                  newProject.size === size 
                                  ? `bg-erani-${PROJECT_SIZES[size].color}/10 border-erani-${PROJECT_SIZES[size].color} shadow-lg` 
                                  : "bg-foreground/5 border-glass-border hover:border-foreground/20"
                                }`}
                              >
                                <span className={`text-[10px] font-black uppercase tracking-widest ${newProject.size === size ? `text-erani-${PROJECT_SIZES[size].color}` : 'text-foreground'}`}>
                                  {PROJECT_SIZES[size].label}
                                </span>
                                <span className="text-[8px] font-bold text-gray-500 uppercase">{PROJECT_SIZES[size].description}</span>
                              </button>
                            ))}
                          </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-8 lg:border-l lg:border-glass-border lg:pl-12">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="flex flex-col gap-4">
                             <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Región del Servidor</label>
                             <div className="relative">
                                <select 
                                  value={newProject.serverRegion}
                                  onChange={(e) => setNewProject({...newProject, serverRegion: e.target.value})}
                                  className="input-premium py-4 pl-12 w-full appearance-none bg-foreground/5"
                                >
                                  <option value="us-west">US West (Oregon)</option>
                                  <option value="us-east">US East (N. Virginia)</option>
                                  <option value="eu-central">EU Central (Frankfurt)</option>
                                  <option value="latam-south">LATAM South (Sao Paulo)</option>
                                </select>
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-erani-blue" />
                             </div>
                          </div>

                          <div className="flex flex-col gap-4">
                             <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Acceso de Equipo</label>
                             <div className="relative">
                                <div className="input-premium py-4 pl-12 flex gap-2 items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
                                   {newProject.teamAccess.map((member, i) => (
                                     <span key={i} className="px-2 py-1 rounded-md bg-erani-blue/10 border border-erani-blue/20 text-[8px] font-black uppercase text-erani-blue">
                                       {member}
                                     </span>
                                   ))}
                                   <button className="p-1 rounded-md bg-foreground/5 hover:bg-foreground/10 text-gray-500">
                                      <Plus className="w-3 h-3" />
                                   </button>
                                </div>
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-erani-blue" />
                             </div>
                          </div>
                       </div>

                       <div className="flex flex-col gap-4">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Políticas de Privacidad e Ingesta</label>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="flex items-center justify-between p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-emerald-500" />
                                      <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Almacenamiento</span>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => setNewProject({...newProject, allowStorage: !newProject.allowStorage})}
                                  className={`w-10 h-6 rounded-full p-1 transition-all ${newProject.allowStorage ? 'bg-erani-blue' : 'bg-gray-700'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${newProject.allowStorage ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                             </div>

                             <div className="flex items-center justify-between p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                      <Timer className="w-4 h-4 text-erani-coral" />
                                      <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Modo Temporal</span>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => setNewProject({...newProject, isTemporal: !newProject.isTemporal})}
                                  className={`w-10 h-6 rounded-full p-1 transition-all ${newProject.isTemporal ? 'bg-erani-coral' : 'bg-gray-700'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${newProject.isTemporal ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                             </div>
                          </div>

                          {newProject.isTemporal && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-5 rounded-2xl bg-erani-coral/5 border border-erani-coral/20 flex flex-col gap-3"
                            >
                               <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-erani-coral">Tiempo de Eliminación</span>
                                  <span className="text-[10px] font-bold text-foreground">{newProject.expirationHours} Horas</span>
                               </div>
                               <input 
                                 type="range"
                                 min="1"
                                 max="168"
                                 value={newProject.expirationHours}
                                 onChange={(e) => setNewProject({...newProject, expirationHours: parseInt(e.target.value)})}
                                 className="w-full accent-erani-coral"
                               />
                               <p className="text-[8px] text-erani-coral/60 italic">Los datos se borrarán automáticamente de {newProject.serverRegion} tras este periodo.</p>
                            </motion.div>
                          )}
                       </div>

                       <div className="flex flex-col gap-6 pt-6 border-t border-glass-border">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-erani-blue flex items-center gap-2">
                             <Cpu className="w-4 h-4" /> Configuración del Motor IA
                          </label>
                        <div className="grid grid-cols-2 gap-6">
                             <div className="flex flex-col gap-3">
                                <label className="text-[9px] uppercase font-bold text-gray-500">Modelo AI (Motor)</label>
                                <select 
                                   value={newProject.aiModel || "gemini-2.5-flash"}
                                   onChange={(e) => setNewProject({...newProject, aiModel: e.target.value})}
                                   className="select-premium text-[10px] font-black"
                                 >
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Forense Primario)</option>
                                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Alta Disponibilidad)</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Análisis Profundo)</option>
                                  </select>
                             </div>
                             <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                   <label className="text-[9px] uppercase font-bold text-gray-500">Temperatura (Creatividad)</label>
                                   <span className="text-[10px] font-black text-foreground">{newProject.aiTemperature}</span>
                                </div>
                                <input 
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={newProject.aiTemperature}
                                  onChange={(e) => setNewProject({...newProject, aiTemperature: parseFloat(e.target.value)})}
                                  className="w-full accent-erani-blue h-1.5 bg-foreground/10 rounded-full"
                                />
                                <div className="flex justify-between text-[7px] font-bold text-gray-600 uppercase tracking-widest">
                                   <span>Forense</span>
                                   <span>Creativo</span>
                                </div>
                             </div>
                          </div>
                       </div>

                      <div className="mt-auto pt-6 lg:border-t lg:border-glass-border">
                          <button 
                            onClick={handleCreateProject}
                            disabled={!newProject.name}
                            className="button-premium w-full py-6 rounded-[2rem] text-[11px] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-4 disabled:opacity-30 shadow-2xl shadow-erani-blue/20"
                          >
                            Crear Proyecto y Configurar Evidencia <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: SETUP PROJECT (EXISTING) */}
            {view === "setup" && activeProjectId && (
              <motion.div 
                key="setup-existing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 h-full"
              >
                <div className="flex items-center justify-between">
                   <button 
                    onClick={() => setView("manage")}
                    className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-all"
                   >
                     <ArrowLeft className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Volver a Proyectos</span>
                   </button>

                   <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue">{activeProject?.id}</span>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{activeProject?.name}</h2>
                      </div>
                      <div className="w-px h-10 bg-glass-border" />
                      <div className={`px-4 py-2 rounded-xl bg-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color}/10 border border-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color}/20 text-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color} text-[10px] font-black uppercase tracking-widest`}>
                        {PROJECT_SIZES[activeProject?.size || 'small'].label}
                      </div>
                   </div>
                </div>
                     <div className="glassmorphism p-10 rounded-[3rem] border border-glass-border flex-1 grid lg:grid-cols-[1fr_400px] gap-12 overflow-hidden">
                   {/* Left Column: Evidence Ingestion */}
                   <div className="flex flex-col gap-8 overflow-hidden">
                       <input 
                         type="file"
                         ref={fileInputRef}
                         onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                         className="hidden"
                         multiple
                       />
                       <div 
                         onClick={handleFileClick}
                         onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                         onDragLeave={() => setIsDragging(false)}
                         onDrop={handleDrop}
                         className={`relative h-56 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden shrink-0 cursor-pointer group ${
                           isDragging ? 'border-erani-blue bg-erani-blue/5' : 'border-glass-border bg-foreground/5 hover:border-erani-blue/30'
                         }`}
                       >
                         <motion.div 
                           animate={isDragging ? { scale: 1.1, rotate: [0, 5, -5, 0] } : {}}
                           className="w-16 h-16 rounded-2xl bg-foreground/5 border border-glass-border flex items-center justify-center text-erani-blue relative z-10 shadow-xl group-hover:scale-110 transition-transform"
                         >
                            <UploadCloud className="w-8 h-8" />
                         </motion.div>
                         <div className="flex flex-col items-center gap-1 relative z-10 text-center">
                            <span className="text-xl font-black uppercase tracking-tight group-hover:text-erani-blue transition-colors">Ingesta de Evidencia</span>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Haz clic o arrastra metadata operativa (Jira, Slack, Notion)</p>
                         </div>                     
                         
                         {/* Visual accents */}
                         <div className="absolute top-6 left-6 p-2 rounded-lg glassmorphism border-glass-border flex items-center gap-2 opacity-20 scale-75">
                            <FileText className="w-4 h-4 text-erani-blue" />
                            <span className="text-[8px] font-black uppercase">CSV / XLSX</span>
                         </div>
                         <div className="absolute bottom-6 right-6 p-2 rounded-lg glassmorphism border-glass-border flex items-center gap-2 opacity-20 scale-75">
                            <Database className="w-4 h-4 text-erani-purple" />
                            <span className="text-[8px] font-black uppercase">JSON Logs</span>
                         </div>
                      </div>

                      <div className="flex flex-col gap-4 overflow-hidden flex-1">
                         <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Archivos Cargados ({activeProject?.files.length})</h3>
                            {activeProject?.files.length! > 0 && (
                               <span className="text-[9px] font-black text-erani-blue uppercase tracking-widest">Evidencia Lista</span>
                            )}
                         </div>
                         
                         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-3">
                                {activeProject?.files.map((file, idx) => (
                                 <div key={file.id || idx} className="glassmorphism p-4 rounded-2xl flex flex-col gap-3 border border-glass-border group hover:border-erani-blue/30 transition-all">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 truncate">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                          file.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                                          file.status === 'error' ? 'bg-erani-coral/10 text-erani-coral' : 
                                          'bg-erani-blue/10 text-erani-blue'
                                        }`}>
                                           {file.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : 
                                            file.status === 'error' ? <X className="w-4 h-4" /> : 
                                            <FileText className="w-4 h-4" />}
                                        </div>
                                        <div className="flex flex-col truncate">
                                           <span className="text-[10px] font-bold text-foreground truncate">{file.name}</span>
                                           <span className="text-[8px] font-black text-gray-600">
                                             {(file.size / 1024).toFixed(1)} KB • {
                                               file.status === 'completed' ? 'Procesado' : 
                                               file.status === 'ingesting' ? 'Ingestando...' :
                                               file.status === 'error' ? 'Fallo' : 'Pendiente'
                                             }
                                           </span>
                                        </div>
                                      </div>
                                      <button className="p-1.5 rounded-lg text-gray-700 hover:text-erani-coral hover:bg-erani-coral/10 transition-all">
                                         <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Progress Bar for Ingestion */}
                                    {(file.status === 'ingesting' || file.status === 'completed' || file.status === 'error') && (
                                      <div className="flex flex-col gap-1.5">
                                        <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${file.progress}%` }}
                                            className={`h-full ${
                                              file.status === 'completed' ? 'bg-emerald-500' : 
                                              file.status === 'error' ? 'bg-erani-coral' : 
                                              'bg-erani-blue animate-pulse'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {file.status === 'error' && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <AlertTriangle className="w-3 h-3 text-erani-coral shrink-0" />
                                        <span className="text-[7px] font-black text-erani-coral uppercase truncate leading-tight" title={file.error}>
                                          Error: {file.error}
                                        </span>
                                      </div>
                                    )}
                                 </div>
                               ))}
                               {activeProject?.files.length === 0 && (
                                 <div className="col-span-2 h-40 flex flex-col items-center justify-center border border-dashed border-glass-border rounded-[2rem] opacity-30 bg-foreground/5">
                                    <Folder className="w-8 h-8 mb-2" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Esperando Ingesta...</span>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Right Column: Checklist & Execution */}
                   <div className="flex flex-col gap-8 lg:border-l lg:border-glass-border lg:pl-12 overflow-hidden">
                      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue">Protocolos Gemelos Digitales</span>
                            <div className="flex gap-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-erani-blue animate-pulse" />
                               <div className="w-1.5 h-1.5 rounded-full bg-erani-purple animate-pulse delay-75" />
                            </div>
                         </div>

                         <div className="flex flex-col gap-3">
                            {[
                              { label: "Verificación de Infraestructura", icon: Database },
                              { label: "Validación de Contexto Histórico", icon: Clock },
                              { label: "Blindaje de Datos Personales", icon: Shield },
                              { label: "Alineación Forense Gemini", icon: Cpu }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-glass-border transition-colors hover:bg-foreground/10">
                                 <div className="w-8 h-8 rounded-full border border-glass-border flex items-center justify-center bg-background/50">
                                    {activeProject?.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />}
                                 </div>
                                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</span>
                              </div>
                            ))}
                         </div>

                         <div className="pt-6 border-t border-glass-border flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                     <Shield className="w-4 h-4 text-emerald-500" />
                                     <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Almacenamiento</span>
                                  </div>
                                  <p className="text-[8px] text-gray-500 italic">Cifrado GTO Blindado</p>
                               </div>
                               <button 
                                 onClick={() => toggleProjectSetting(activeProject!.id, 'allowStorage')}
                                 className={`w-10 h-6 rounded-full p-1 transition-all ${activeProject?.settings.allowStorage ? 'bg-erani-blue' : 'bg-gray-700'}`}
                               >
                                 <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${activeProject?.settings.allowStorage ? 'translate-x-4' : 'translate-x-0'}`} />
                               </button>
                            </div>

                            <div className="flex items-center justify-between">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                     <History className="w-4 h-4 text-erani-purple" />
                                     <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Memoria de Contexto</span>
                                  </div>
                                  <p className="text-[8px] text-gray-500 italic">Aprendizaje AI Gemini</p>
                               </div>
                               <button 
                                 onClick={() => toggleProjectSetting(activeProject!.id, 'historicalContext')}
                                 className={`w-10 h-6 rounded-full p-1 transition-all ${activeProject?.settings.historicalContext ? 'bg-erani-purple' : 'bg-gray-700'}`}
                                >
                                 <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${activeProject?.settings.historicalContext ? 'translate-x-4' : 'translate-x-0'}`} />
                               </button>
                            </div>

                            <div className="flex items-center justify-between">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                     <Cpu className="w-4 h-4 text-erani-blue" />
                                     <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Motor Forense</span>
                                  </div>
                               </div>
                               <select 
                                 value={activeProject?.settings.aiModel || "gemini-2.5-flash"}
                                 onChange={(e) => toggleProjectSetting(activeProject!.id, 'aiModel', e.target.value)}
                                 className="bg-transparent text-[9px] font-black uppercase text-erani-blue border-none focus:ring-0 cursor-pointer text-right"
                               >
                                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
                                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                               </select>
                            </div>

                            <div className="flex flex-col gap-3">
                               <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                     <Zap className="w-4 h-4 text-amber-500" />
                                     <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Temperatura</span>
                                  </div>
                                  <span className="text-[10px] font-black text-foreground">{activeProject?.settings.aiTemperature}</span>
                               </div>
                               <input 
                                 type="range"
                                 min="0"
                                 max="1"
                                 step="0.1"
                                 value={activeProject?.settings.aiTemperature}
                                 onChange={(e) => toggleProjectSetting(activeProject!.id, 'aiTemperature', parseFloat(e.target.value))}
                                 className="w-full accent-erani-blue h-1.5 bg-foreground/10 rounded-full"
                               />
                            </div>

                            <div className="p-4 rounded-2xl bg-erani-blue/5 border border-erani-blue/10 text-[9px] text-erani-blue font-bold leading-tight flex items-center gap-3">
                               <AlertTriangle className="w-4 h-4 shrink-0" />
                               Soberanía de Datos: No procesamos información legible, solo vectores de metadata cifrados.
                            </div>
                         </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-glass-border">
                          <button 
                             onClick={() => setView("processing")}
                             disabled={activeProject?.files.length === 0 || !activeProject?.files.some(f => f.status === 'completed')}
                             className="button-premium w-full py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 disabled:opacity-30 shadow-xl shadow-erani-blue/20"
                          >
                             Ejecutar Análisis Forense <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: PROCESSING */}
            {view === "processing" && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-background/80 backdrop-blur-2xl flex flex-col overflow-hidden rounded-[3rem] border border-glass-border shadow-2xl"
              >
                {/* Header Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-foreground/5 z-20 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                    className="h-full bg-gradient-brand shadow-[0_0_15px_rgba(0,183,255,0.5)]"
                  />
                </div>

                <div className="flex h-full w-full">
                  {/* Left Panel: High-Fidelity Visualizer */}
                  <div className="hidden lg:flex lg:w-[42%] h-full flex-col items-center justify-center relative border-r border-glass-border/20 bg-black/2 dark:bg-white/1 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,183,255,0.05)_0%,transparent_70%)]" />
                      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-erani-blue/5 blur-[120px] rounded-full animate-pulse" />
                      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-erani-purple/5 blur-[120px] rounded-full animate-pulse delay-700" />
                      
                      {/* Data Orbs / Particles for depth */}
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full bg-erani-blue/30"
                          style={{ 
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                          }}
                          animate={{ 
                            y: [0, -100],
                            opacity: [0, 0.8, 0],
                            scale: [0, 1.5, 0]
                          }}
                          transition={{ 
                            duration: 5 + Math.random() * 5, 
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 10
                          }}
                        />
                      ))}
                    </div>

                    {/* Triangulation Animation Container */}
                    <div className="relative w-full aspect-square max-w-[450px] flex items-center justify-center">
                      {/* Rotating Lines / Grid */}
                      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 500 500">
                        {/* Static Hex Grid Background */}
                        <defs>
                          <pattern id="hexGrid" width="50" height="43.3" patternUnits="userSpaceOnUse">
                            <path d="M25 0 L50 14.4 L50 43.3 L25 57.7 L0 43.3 L0 14.4 Z" fill="none" stroke="currentColor" strokeWidth="0.2" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hexGrid)" />

                        <motion.circle 
                          cx="250" cy="250" r="220" 
                          fill="none" stroke="var(--erani-blue)" strokeWidth="0.5" strokeDasharray="10 15"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.circle 
                          cx="250" cy="250" r="160" 
                          fill="none" stroke="var(--erani-purple)" strokeWidth="0.5" strokeDasharray="5 10"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        />
                        
                        {/* Dynamic connection lines with "pulse" effect */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                          <g key={i}>
                            <motion.line 
                              x1="250" y1="250"
                              x2={250 + Math.cos(angle * Math.PI / 180) * 180}
                              y2={250 + Math.sin(angle * Math.PI / 180) * 180}
                              stroke="var(--erani-blue)"
                              strokeWidth="1"
                              strokeOpacity="0.2"
                              animate={{ strokeOpacity: [0.1, 0.4, 0.1] }}
                              transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                            />
                            <motion.circle
                              cx={250 + Math.cos(angle * Math.PI / 180) * 180}
                              cy={250 + Math.sin(angle * Math.PI / 180) * 180}
                              r="2"
                              fill="var(--erani-blue)"
                              animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                            />
                          </g>
                        ))}
                      </svg>

                      {/* Central Core (Erani Logo) */}
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.02, 1],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-20"
                      >
                        <div className="w-32 h-32 lg:w-40 lg:h-40 bg-background/40 backdrop-blur-3xl rounded-full flex items-center justify-center border border-erani-blue/30 shadow-[0_0_50px_rgba(0,183,255,0.2)] relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-brand opacity-10" />
                           <Image src="/isologo.png" alt="ERANI" width={90} height={90} className="logo-adaptive relative z-10" />
                        </div>
                      </motion.div>

                      {/* Active Radar Sweep */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[440px] h-[440px] pointer-events-none"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 183, 255, 0.1) 60deg, transparent 60deg)'
                        }}
                      />
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-4 px-12 text-center">
                      <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-erani-blue/10 border border-erani-blue/20">
                         <div className="w-1.5 h-1.5 rounded-full bg-erani-blue animate-ping" />
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-erani-blue">Forensic Inference Engine</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-400 font-montserrat tracking-tight leading-relaxed">
                        Triangulando vectores de auditoría en <span className="text-erani-blue">GTO-{activeProject?.serverRegion}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Panel: Professional Streaming & Control */}
                  <div className="flex-1 h-full flex flex-col p-6 lg:p-12 relative bg-background overflow-hidden">
                    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
                      {/* Current Stage Header */}
                      <div className="mb-6 lg:mb-10">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Etapa de Análisis {currentStepIdx + 1}/5</span>
                          <div className="h-px flex-1 bg-glass-border/30" />
                        </div>
                        
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentStepIdx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-2"
                          >
                            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-foreground font-montserrat leading-tight">
                              {PROCESSING_STEPS[currentStepIdx].label}
                            </h2>
                            <div className="flex items-center gap-2">
                               <div className="flex gap-1">
                                  {[1, 2, 3].map(i => (
                                    <motion.div 
                                      key={i}
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                      className="w-1.5 h-1.5 rounded-full bg-erani-blue"
                                    />
                                  ))}
                               </div>
                               <span className="text-[10px] font-bold text-erani-blue uppercase tracking-widest animate-pulse">Procesando...</span>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Vertical Timeline Navigation */}
                      <div className="mb-10 flex gap-2">
                        {PROCESSING_STEPS.map((step, idx) => (
                          <div key={step.id} className="flex-1 flex flex-col gap-2">
                            <div className="relative h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={false}
                                animate={{ 
                                  width: idx < currentStepIdx ? "100%" : idx === currentStepIdx ? "50%" : "0%",
                                  backgroundColor: idx <= currentStepIdx ? "var(--erani-blue)" : "transparent"
                                }}
                                className="absolute inset-0 transition-colors"
                              />
                            </div>
                            <div className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${idx === currentStepIdx ? 'text-erani-blue' : idx < currentStepIdx ? 'text-foreground/60' : 'text-foreground/20'}`}>
                              {step.label.split(' ')[0]}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Analysis Streaming Terminal (REAL-TIME) */}
                      {profile?.organization_id ? (
                        <RealtimeLogTerminal organizationId={profile.organization_id} />
                      ) : (
                        <div className="flex-1 flex items-center justify-center bg-foreground/5 rounded-3xl border border-glass-border animate-pulse">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sincronizando con el Núcleo...</span>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between mt-6">
                         <div className="flex items-center gap-8">
                            <div className="flex flex-col">
                               <span className="text-[8px] uppercase font-black text-gray-500 tracking-widest">Estado del Buffer</span>
                               <span className="text-xs font-black text-foreground">{(processingProgress).toFixed(0)}% Sincronizado</span>
                            </div>
                            <div className="w-px h-8 bg-glass-border/30" />
                            <div className="flex flex-col">
                               <span className="text-[8px] uppercase font-black text-gray-500 tracking-widest">Nivel de Confianza</span>
                               <span className="text-xs font-black text-erani-blue">99.98% Probabilístico</span>
                            </div>
                         </div>

                         <button 
                           onClick={() => setView("manage")}
                           className="px-6 py-3 rounded-2xl bg-erani-coral/10 hover:bg-erani-coral/20 text-erani-coral text-[9px] font-black uppercase tracking-widest transition-all border border-erani-coral/20"
                         >
                           Interrumpir Análisis
                         </button>
                      </div>
                    </div>

                    {/* Error Overlay (Relative to Right Panel) */}
                    <AnimatePresence>
                      {analysisError && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-8 z-50 bg-background/95 backdrop-blur-xl rounded-[2.5rem] border border-erani-coral/30 p-12 flex flex-col items-center justify-center text-center shadow-2xl"
                        >
                          <div className="w-20 h-20 rounded-3xl bg-erani-coral/10 border border-erani-coral/20 flex items-center justify-center text-erani-coral mb-6">
                            <AlertTriangle className="w-10 h-10" />
                          </div>
                          <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">Fallo Crítico Detectado</h3>
                          <p className="text-sm font-medium text-gray-500 max-w-md mb-10 leading-relaxed font-montserrat">
                            {typeof analysisError === 'string' ? analysisError : (analysisError as any).message}
                          </p>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setView("manage")}
                              className="px-10 py-4 rounded-full bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-widest transition-all border border-glass-border"
                            >
                              Cancelar Operación
                            </button>
                            <button 
                                onClick={async () => {
                                  setAnalysisError(null);
                                  setProcessingProgress(0);
                                  setCurrentStepIdx(0);
                                  // Log the event
                                  await auditLogger.log('FORENSIC_RETRY', 'Reintento de análisis forense', {}, 'rotate-ccw');
                                  setView("manage");
                                  setTimeout(() => setView("processing"), 100);
                                }}
                              className="px-12 py-4 rounded-full bg-erani-coral text-white shadow-xl shadow-erani-coral/30 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                            >
                              Reintentar Análisis
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}


            {/* VIEW: BENTO REPORT */}
            {view === "report" && forensicReport && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 pb-12"
              >
                {/* Report Header */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-erani-blue">
                        {forensicReport.report_metadata.audit_id}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-glass-border" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        {forensicReport.report_metadata.project_name}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                      Resultado del <span className="text-gradient-brand">Peritaje Forense</span>
                    </h2>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setView("manage")}
                      className="px-6 py-3 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-glass-border text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Cerrar Reporte
                    </button>
                    <button className="px-8 py-3 rounded-full bg-erani-blue text-white shadow-lg shadow-erani-blue/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                      <FileText className="w-4 h-4" /> Exportar PDF
                    </button>
                  </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Slide 1: Impacto Directo (Wide) */}
                  <div className="md:col-span-2 glassmorphism p-8 rounded-[2.5rem] border border-glass-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-32 h-32 text-erani-blue" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nav-text">Impacto Directo y Scorecard</h3>
                        <span className="px-3 py-1 rounded-full bg-erani-coral/10 text-erani-coral text-[9px] font-black uppercase tracking-widest">Pérdida Crítica Detectada</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-gray-500">Fuga Confirmada</span>
                          <span className="text-3xl font-black text-erani-coral">${forensicReport.slide_1_impacto_directo.fuga_confirmada_mxn.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-gray-600 uppercase">Tickets Liquidados</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-gray-500">Riesgo Latente</span>
                          <span className="text-3xl font-black text-foreground">${forensicReport.slide_1_impacto_directo.riesgo_latente_mensual_mxn.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-gray-600 uppercase">Mensual Proyectado</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-gray-500">Scope Creep</span>
                          <span className="text-3xl font-black text-erani-purple">{forensicReport.slide_1_impacto_directo.desviacion_scope_creep_pct}%</span>
                          <span className="text-[8px] font-bold text-gray-600 uppercase">Desviación de Alcance</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-gray-500">COI Anual</span>
                          <span className="text-3xl font-black text-erani-blue">${forensicReport.slide_1_impacto_directo.coi_anual_mxn.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-gray-600 uppercase">Costo de Inacción</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide 3: KPIs de Salud (Single) */}
                  <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nav-text">Monitores de Salud AI</h3>
                    
                    <div className="flex flex-col gap-6">
                      {[
                        { label: "Bucle de Ineficiencia", val: forensicReport.slide_3_kpis_salud.monitor_bucle_pct, color: "#00B7FF" },
                        { label: "Índice de Fricción", val: forensicReport.slide_3_kpis_salud.indice_friccion_pct, color: "#9e80ff" },
                        { label: "Dark Data Index", val: forensicReport.slide_3_kpis_salud.dark_data_index_pct, color: "#FF5C5C" }
                      ].map((kpi, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <DonutChart percentage={kpi.val} size={50} strokeWidth={6} color={kpi.color} />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-gray-500">{kpi.label}</span>
                            <span className="text-lg font-black text-foreground">{kpi.val}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                       <span className="text-[8px] font-black uppercase text-erani-blue tracking-widest block mb-1">Ceguera Operativa</span>
                       <p className="text-[9px] font-medium text-gray-400 italic leading-relaxed">{forensicReport.slide_3_kpis_salud.analisis_ceguera_operativa}</p>
                    </div>
                  </div>

                  {/* Slide 2: Análisis Forense (Full Width Bottom) */}
                  <div className="md:col-span-2 glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nav-text">Hemorragias Críticas (Top 5)</h3>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded bg-erani-blue/10 text-erani-blue text-[8px] font-black uppercase">Consolidación Activa</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-glass-border">
                            <th className="py-4 text-[9px] font-black uppercase text-gray-500">Ticket ID</th>
                            <th className="py-4 text-[9px] font-black uppercase text-gray-500">Descripción</th>
                            <th className="py-4 text-[9px] font-black uppercase text-gray-500">Origen</th>
                            <th className="py-4 text-[9px] font-black uppercase text-gray-500">Inferencia</th>
                            <th className="py-4 text-[9px] font-black uppercase text-gray-500 text-right">Costo Invisible</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forensicReport.slide_2_analisis_forense.top_5_tickets.map((ticket, i) => (
                            <tr key={i} className="border-b border-glass-border/50 group/row hover:bg-foreground/5 transition-colors">
                              <td className="py-4 text-[10px] font-mono font-bold text-erani-blue">{ticket.ticket_id}</td>
                              <td className="py-4 text-[10px] font-bold text-foreground max-w-[200px] truncate">{ticket.descripcion}</td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ticket.filtro === '[INT]' ? 'bg-amber-500/10 text-amber-500' : 'bg-erani-purple/10 text-erani-purple'}`}>
                                  {ticket.filtro}
                                </span>
                              </td>
                              <td className="py-4 text-[10px] font-bold text-gray-500">{ticket.hrs_calc}h Est.</td>
                              <td className="py-4 text-[10px] font-black text-foreground text-right">${ticket.costo_invisible_mxn.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-erani-blue/5">
                            <td colSpan={4} className="py-4 px-4 text-[10px] font-black uppercase text-gray-500">
                              Otros {forensicReport.slide_2_analisis_forense.resumen_consolidacion.otros_tickets_cantidad} Tickets Consolidados
                            </td>
                            <td className="py-4 px-4 text-[10px] font-black text-foreground text-right">
                              ${forensicReport.slide_2_analisis_forense.resumen_consolidacion.otros_tickets_monto_mxn.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Slide 4: Estrategia Firewall */}
                  <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-8 relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 opacity-5">
                       <Shield className="w-40 h-40 text-emerald-500" />
                    </div>
                    
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nav-text">Estrategia de Blindaje</h3>
                    
                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-emerald-500">ROI Proyectado</span>
                        </div>
                        <span className="text-3xl font-black text-foreground">{forensicReport.slide_4_estrategia_firewall.roi_dias} Días</span>
                      </div>

                      <div className="p-5 rounded-3xl bg-erani-blue/10 border border-erani-blue/20 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-erani-blue" />
                          <span className="text-[10px] font-black uppercase text-erani-blue">Mejora de Margen</span>
                        </div>
                        <span className="text-3xl font-black text-foreground">+{forensicReport.slide_4_estrategia_firewall.proyeccion_margen_pct}%</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Protocolos de Bloqueo</span>
                        <p className="text-[10px] font-medium text-gray-400 leading-relaxed">{forensicReport.slide_4_estrategia_firewall.protocolos_bloqueo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Technical Annex (Full Width) */}
                  <div className="md:col-span-3 glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-erani-purple/10">
                        <FileJson className="w-5 h-5 text-erani-purple" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nav-text">Anexo Técnico Forense</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest block">Metodología de Inferencia</span>
                        <p className="text-[10px] font-medium text-gray-400 leading-relaxed bg-foreground/5 p-4 rounded-2xl border border-glass-border">
                          {forensicReport.anexo_tecnico.metodologia_inferencia}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest block">Vectores de Auditoría</span>
                        <div className="flex flex-wrap gap-2">
                          {forensicReport.anexo_tecnico.vectores_auditados.map((vector, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full bg-erani-blue/5 border border-erani-blue/10 text-[9px] font-bold text-erani-blue">
                              {vector}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

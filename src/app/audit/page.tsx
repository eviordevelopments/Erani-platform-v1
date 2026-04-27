"use client";

import { useState, useEffect, useCallback } from "react";
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
  Lock
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { useRef } from "react";

interface Project {
  id: string;
  name: string;
  icon?: string;
  size: "small" | "medium" | "large";
  files: any[];
  status: "idle" | "processing" | "completed";
  createdAt: string;
  serverRegion: string;
  teamAccess: string[];
  isTemporal: boolean;
  expirationHours: number;
  settings: {
    allowStorage: boolean;
    historicalContext: boolean;
  };
}

const PROJECT_SIZES = {
  small: { label: "Pequeño", description: "25 registros o menos", color: "erani-blue" },
  medium: { label: "Mediano", description: "25 a 50 registros", color: "erani-purple" },
  large: { label: "Grande", description: "75 registros o más", color: "erani-coral" }
};

export default function AuditProtocolPage() {
  const { isSidebarCollapsed, uploadedFiles } = useDashboard();
  const [view, setView] = useState<"setup" | "manage" | "processing">("manage");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectingIconFor, setSelectingIconFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing Animation State
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  
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
    { label: "Triangulando Logs Operativos", icon: Layers },
    { label: "Análisis de Dark Data & Metadata", icon: Database },
    { label: "Cálculo de Rentabilidad Forense", icon: Cpu },
    { label: "Generando Reporte Ejecutivo Bento", icon: FileText }
  ];

  const handleChangeIcon = (projectId: string, iconId: string) => {
      setProjects(projects.map(p => p.id === projectId ? { ...p, icon: iconId } : p));
      setSelectingIconFor(null);
  };

  const toggleProjectSetting = (projectId: string, setting: 'allowStorage' | 'historicalContext') => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, settings: { ...p.settings, [setting]: !p.settings[setting] } } : p
    ));
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
    expirationHours: 24
  });

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("erani_audit_projects");
    if (saved) {
      setProjects(JSON.parse(saved));
    } else {
      // Default mock project
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
        settings: { allowStorage: true, historicalContext: true }
      };
      setProjects([mockProject]);
    }
  }, []);

  // Save projects to localStorage
  useEffect(() => {
    localStorage.setItem("erani_audit_projects", JSON.stringify(projects));
  }, [projects]);

  const handleCreateProject = () => {
    if (!newProject.name) return;
    
    const project: Project = {
      id: "PRJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      name: newProject.name,
      icon: "folder",
      size: newProject.size,
      files: [],
      status: "idle",
      createdAt: new Date().toISOString(),
      serverRegion: newProject.serverRegion,
      teamAccess: newProject.teamAccess,
      isTemporal: newProject.isTemporal,
      expirationHours: newProject.expirationHours,
      settings: {
        allowStorage: newProject.allowStorage,
        historicalContext: newProject.historicalContext
      }
    };
    
    setProjects([project, ...projects]);
    setActiveProjectId(project.id);
    setView("setup");
    setNewProject({ 
      name: "", 
      size: "small", 
      allowStorage: true, 
      historicalContext: true,
      serverRegion: "us-west",
      teamAccess: ["Admin", "Security Ops"],
      isTemporal: false,
      expirationHours: 24
    });
  };

  const handleFiles = (incomingFiles: File[]) => {
    if (activeProjectId && incomingFiles.length > 0) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            files: [...p.files, ...incomingFiles.map(f => ({ name: f.name, size: f.size, type: f.type, id: Math.random().toString() }))]
          };
        }
        return p;
      }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileClick = () => fileInputRef.current?.click();

  // Progress Simulation Effect
  useEffect(() => {
    if (view === "processing") {
      setProcessingProgress(0);
      setCurrentStepIdx(0);
      
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setView("manage"), 1500); // In real app, redirect to /forensic
            return 100;
          }
          const next = prev + 0.5;
          const stepSize = 100 / PROCESSING_STEPS.length;
          setCurrentStepIdx(Math.min(Math.floor(next / stepSize), PROCESSING_STEPS.length - 1));
          return next;
        });
      }, 30);
      
      return () => clearInterval(interval);
    }
  }, [view]);

  const activeProject = projects.find(p => p.id === activeProjectId);

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
                                 <div key={idx} className="glassmorphism p-4 rounded-2xl flex items-center justify-between border border-glass-border group hover:border-erani-blue/30 transition-all">
                                    <div className="flex items-center gap-3 truncate">
                                       <div className="w-8 h-8 rounded-lg bg-erani-blue/10 flex items-center justify-center text-erani-blue shrink-0">
                                          <FileText className="w-4 h-4" />
                                       </div>
                                       <div className="flex flex-col truncate">
                                          <span className="text-[10px] font-bold text-foreground truncate">{file.name}</span>
                                          <span className="text-[8px] font-black text-gray-600">{(file.size / 1024).toFixed(1)} KB</span>
                                       </div>
                                    </div>
                                    <button className="p-1.5 rounded-lg text-gray-700 hover:text-erani-coral hover:bg-erani-coral/10 transition-all opacity-0 group-hover:opacity-100">
                                       <X className="w-3.5 h-3.5" />
                                    </button>
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

                            <div className="p-4 rounded-2xl bg-erani-blue/5 border border-erani-blue/10 text-[9px] text-erani-blue font-bold leading-tight flex items-center gap-3">
                               <AlertTriangle className="w-4 h-4 shrink-0" />
                               Soberanía de Datos: No procesamos información legible, solo vectores de metadata cifrados.
                            </div>
                         </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-glass-border">
                          <button 
                             onClick={() => setView("processing")}
                             disabled={activeProject?.files.length === 0}
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
                 className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 overflow-hidden"
               >
                 {/* Background flair */}
                 <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-erani-blue/10 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-erani-purple/10 blur-[150px] rounded-full animate-pulse delay-700" />
                 </div>

                 <div className="relative mb-24">
                    {/* Orbiting File Icons */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="w-[450px] h-[450px] rounded-full border border-glass-border border-dashed relative"
                    >
                       {[0, 72, 144, 216, 288].map((angle, i) => (
                          <motion.div 
                            key={i}
                            className="absolute w-12 h-12 rounded-2xl glassmorphism border border-glass-border flex items-center justify-center text-erani-blue shadow-2xl backdrop-blur-md"
                            style={{ 
                              top: `calc(50% - 24px + ${Math.sin(angle * Math.PI / 180) * 225}px)`,
                              left: `calc(50% - 24px + ${Math.cos(angle * Math.PI / 180) * 225}px)`,
                            }}
                            animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                          >
                             {i % 2 === 0 ? <FileText className="w-6 h-6" /> : <Database className="w-6 h-6 text-erani-purple" />}
                          </motion.div>
                       ))}
                    </motion.div>

                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="relative">
                          <motion.div 
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10"
                          >
                             <Image src="/isologo.png" alt="ERANI" width={140} height={140} className="logo-adaptive" />
                          </motion.div>
                          <div className="absolute inset-0 bg-erani-blue/20 blur-[60px] rounded-full -z-10 animate-pulse" />
                       </div>
                    </div>
                 </div>

                 <div className="w-full max-w-3xl flex flex-col gap-12 relative z-10">
                    <div className="flex flex-col items-center gap-4 text-center">
                       <AnimatePresence mode="wait">
                          <motion.h2 
                            key={currentStepIdx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-4xl font-black uppercase tracking-tight text-foreground"
                          >
                             {PROCESSING_STEPS[currentStepIdx].label}
                          </motion.h2>
                       </AnimatePresence>
                       <p className="text-[10px] font-black text-erani-blue uppercase tracking-[0.4em] flex items-center gap-6">
                          <span className="w-12 h-px bg-erani-blue/30" />
                          Ejecutando Diagnóstico Forense Gemini
                          <span className="w-12 h-px bg-erani-blue/30" />
                       </p>
                    </div>

                    <div className="flex flex-col gap-5">
                       <div className="flex items-center justify-between px-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Progreso de Sincronización</span>
                          <span className="text-sm font-black text-foreground tabular-nums">{Math.floor(processingProgress)}%</span>
                       </div>
                       <div className="h-3 w-full bg-foreground/5 rounded-full overflow-hidden border border-glass-border p-0.5">
                          <motion.div 
                            className="h-full bg-gradient-brand rounded-full shadow-[0_0_15px_rgba(0,183,255,0.3)]"
                            initial={{ width: "0%" }}
                            animate={{ width: `${processingProgress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                       {PROCESSING_STEPS.map((step, i) => {
                         const Icon = step.icon;
                         const isCompleted = i < currentStepIdx;
                         const isActive = i === currentStepIdx;
                         
                         return (
                           <motion.div 
                             key={i}
                             className={`p-6 rounded-[2.5rem] border transition-all duration-700 flex items-center gap-6 ${
                               isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5' :
                               isActive ? 'bg-erani-blue/10 border-erani-blue/30 shadow-2xl shadow-erani-blue/10 scale-[1.03]' :
                               'bg-foreground/5 border-glass-border opacity-40'
                             }`}
                           >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                isCompleted ? 'bg-emerald-500 text-white' :
                                isActive ? 'bg-erani-blue text-white shadow-lg shadow-erani-blue/40' :
                                'bg-foreground/10 text-gray-500'
                              }`}>
                                 {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />}
                              </div>
                              <div className="flex flex-col">
                                 <span className={`text-[11px] font-black uppercase tracking-tight ${isCompleted ? 'text-emerald-500' : isActive ? 'text-foreground' : 'text-gray-500'}`}>
                                    {step.label}
                                 </span>
                                 {isActive && (
                                   <motion.span 
                                     animate={{ opacity: [0.4, 1, 0.4] }}
                                     transition={{ duration: 1.5, repeat: Infinity }}
                                     className="text-[8px] font-bold text-erani-blue uppercase tracking-widest mt-1"
                                   >
                                      Analizando vectores...
                                   </motion.span>
                                 )}
                              </div>
                           </motion.div>
                         );
                       })}
                    </div>

                    <div className="flex justify-center mt-12">
                       <button 
                         onClick={() => setView("manage")}
                         className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-erani-coral transition-all py-2 border-b border-transparent hover:border-erani-coral"
                       >
                          Interrumpir Proceso y Guardar como Borrador
                       </button>
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

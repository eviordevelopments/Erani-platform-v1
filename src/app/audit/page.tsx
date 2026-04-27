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
  Cpu
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

interface Project {
  id: string;
  name: string;
  size: "small" | "medium" | "large";
  files: any[];
  status: "idle" | "processing" | "completed";
  createdAt: string;
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
  
  // New Project Form
  const [newProject, setNewProject] = useState({
    name: "",
    size: "small" as "small" | "medium" | "large",
    allowStorage: true,
    historicalContext: true
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
      size: newProject.size,
      files: [],
      status: "idle",
      createdAt: new Date().toISOString(),
      settings: {
        allowStorage: newProject.allowStorage,
        historicalContext: newProject.historicalContext
      }
    };
    
    setProjects([project, ...projects]);
    setActiveProjectId(project.id);
    setView("setup");
    setNewProject({ name: "", size: "small", allowStorage: true, historicalContext: true });
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (activeProjectId && files.length > 0) {
      // Simulate file upload to active project
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            files: [...p.files, ...files.map(f => ({ name: f.name, size: f.size, type: f.type, id: Math.random().toString() }))],
            status: "processing"
          };
        }
        return p;
      }));
      setView("processing");
    }
  };

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
                <span className="px-3 py-1 rounded-full border border-erani-blue/20 bg-erani-blue/10 text-[9px] uppercase font-black tracking-widest text-erani-blue">
                   Protocolo TRL-4
                </span>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-nav-text">
                   Auditoría Forense de Infraestructura
                </span>
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                Gestión de <span className="text-gradient-brand">Evidencia Primaria</span>
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
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase())).map((project) => (
                  <div key={project.id} className="premium-border-container group">
                    <div className="premium-border-inner p-8 flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-2xl bg-erani-blue/10 flex items-center justify-center text-erani-blue">
                          <Folder className="w-6 h-6" />
                        </div>
                        <div className="flex gap-2">
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

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue/60">{project.id}</span>
                        <h3 className="text-xl font-black uppercase tracking-tight text-foreground truncate">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <Calendar className="w-3.5 h-3.5 text-gray-500" />
                           <span className="text-[10px] font-bold text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-foreground/5 border border-glass-border flex flex-col gap-1">
                          <span className="text-[8px] uppercase font-black text-gray-500">Archivos</span>
                          <span className="text-lg font-black text-foreground">{project.files.length}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-foreground/5 border border-glass-border flex flex-col gap-1">
                          <span className="text-[8px] uppercase font-black text-gray-500">Tamaño</span>
                          <span className={`text-[10px] font-black uppercase text-${PROJECT_SIZES[project.size].color}`}>
                            {PROJECT_SIZES[project.size].label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                        <div className="flex items-center gap-2">
                           <History className={`w-3.5 h-3.5 ${project.settings.historicalContext ? 'text-emerald-500' : 'text-gray-600'}`} />
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Contexto Histórico</span>
                        </div>
                        <button 
                          onClick={() => { setActiveProjectId(project.id); setView("setup"); }}
                          className="flex items-center gap-2 text-erani-blue text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all"
                        >
                          Abrir Auditoría <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* VIEW: SETUP PROJECT */}
            {view === "setup" && !activeProjectId && (
              <motion.div 
                key="setup-new"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto flex flex-col gap-12 py-12"
              >
                <div className="text-center flex flex-col gap-4">
                   <h2 className="text-4xl font-black uppercase tracking-tight">Nueva <span className="text-gradient-brand">Misión Forense</span></h2>
                   <p className="text-gray-500 font-medium">Configura los parámetros de tu auditoría para iniciar la ingesta de datos.</p>
                </div>

                <div className="glassmorphism p-12 rounded-[3rem] border border-glass-border flex flex-col gap-10">
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

                   <div className="flex flex-col gap-6">
                      <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 text-center">Selecciona el Volumen de Datos Estimado</label>
                      <div className="grid grid-cols-3 gap-6">
                        {(Object.keys(PROJECT_SIZES) as Array<keyof typeof PROJECT_SIZES>).map(size => (
                          <button
                            key={size}
                            onClick={() => setNewProject({...newProject, size})}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-3 text-center ${
                              newProject.size === size 
                              ? `bg-erani-${PROJECT_SIZES[size].color}/10 border-erani-${PROJECT_SIZES[size].color} shadow-lg` 
                              : "bg-foreground/5 border-glass-border hover:border-foreground/20"
                            }`}
                          >
                            <span className={`text-xs font-black uppercase tracking-widest ${newProject.size === size ? `text-erani-${PROJECT_SIZES[size].color}` : 'text-foreground'}`}>
                              {PROJECT_SIZES[size].label}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{PROJECT_SIZES[size].description}</span>
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8 pt-6 border-t border-glass-border">
                      <div className="flex items-center justify-between p-6 rounded-3xl bg-foreground/5 border border-glass-border">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-emerald-500" />
                              <span className="text-[11px] font-black uppercase tracking-tight text-foreground">Permitir Almacenamiento</span>
                           </div>
                           <p className="text-[9px] text-gray-500 max-w-[200px]">Cifrado seguro para auditorías recurrentes y logs forenses.</p>
                        </div>
                        <button 
                          onClick={() => setNewProject({...newProject, allowStorage: !newProject.allowStorage})}
                          className={`w-14 h-8 rounded-full p-1 transition-all ${newProject.allowStorage ? 'bg-erani-blue' : 'bg-gray-700'}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-white transition-all transform ${newProject.allowStorage ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-6 rounded-3xl bg-foreground/5 border border-glass-border">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                              <History className="w-4 h-4 text-erani-purple" />
                              <span className="text-[11px] font-black uppercase tracking-tight text-foreground">Contexto Histórico AI</span>
                           </div>
                           <p className="text-[9px] text-gray-500 max-w-[200px]">Usa auditorías pasadas para mejorar la detección de fugas.</p>
                        </div>
                        <button 
                          onClick={() => setNewProject({...newProject, historicalContext: !newProject.historicalContext})}
                          className={`w-14 h-8 rounded-full p-1 transition-all ${newProject.historicalContext ? 'bg-erani-purple' : 'bg-gray-700'}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-white transition-all transform ${newProject.historicalContext ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                   </div>

                   <button 
                     onClick={handleCreateProject}
                     disabled={!newProject.name}
                     className="button-premium w-full py-8 rounded-[2rem] text-xs uppercase font-black tracking-[0.3em] flex items-center justify-center gap-4 disabled:opacity-30 shadow-2xl shadow-erani-blue/20"
                   >
                     Crear Proyecto y Configurar Evidencia <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            )}

            {/* VIEW: SETUP PROJECT (EXISTING) */}
            {view === "setup" && activeProjectId && (
              <motion.div 
                key="setup-existing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-12"
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
                      <div className="w-px h-12 bg-glass-border" />
                      <div className={`px-4 py-2 rounded-xl bg-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color}/10 border border-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color}/20 text-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color} text-[10px] font-black uppercase tracking-widest`}>
                        {PROJECT_SIZES[activeProject?.size || 'small'].label}
                      </div>
                   </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_450px] gap-12">
                   {/* Drag & Drop Area */}
                   <div className="flex flex-col gap-8">
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`aspect-video rounded-[3rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-8 relative overflow-hidden ${
                          isDragging ? 'border-erani-blue bg-erani-blue/5' : 'border-glass-border bg-foreground/5 hover:border-erani-blue/30'
                        }`}
                      >
                         <div className="w-24 h-24 rounded-3xl bg-foreground/5 border border-glass-border flex items-center justify-center text-erani-blue relative z-10 shadow-2xl">
                            <UploadCloud className="w-12 h-12" />
                         </div>
                         <div className="flex flex-col items-center gap-3 relative z-10 text-center">
                            <span className="text-2xl font-black uppercase tracking-tight">Ingesta Forense</span>
                            <p className="text-sm font-medium text-gray-500 max-w-sm">Arrastra tus archivos de metadata operativos (Jira, Slack, Notion, etc) directamente aquí.</p>
                         </div>
                         
                         {/* Floating file types for UI flair */}
                         <div className="absolute top-10 left-10 p-3 rounded-xl glassmorphism border-glass-border flex items-center gap-3 opacity-20">
                            <FileText className="w-4 h-4 text-erani-blue" />
                            <span className="text-[8px] font-black">XLSX</span>
                         </div>
                         <div className="absolute bottom-10 right-10 p-3 rounded-xl glassmorphism border-glass-border flex items-center gap-3 opacity-20">
                            <Database className="w-4 h-4 text-erani-purple" />
                            <span className="text-[8px] font-black">CSV / JSON</span>
                         </div>
                      </div>

                      <div className="flex flex-col gap-6">
                         <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 px-2">Archivos en este Proyecto ({activeProject?.files.length})</h3>
                         <div className="grid grid-cols-2 gap-4">
                            {activeProject?.files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((file, idx) => (
                              <div key={idx} className="glassmorphism p-5 rounded-2xl flex items-center justify-between border border-glass-border group hover:border-erani-blue/30 transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-erani-blue/10 text-erani-blue">
                                       <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col truncate max-w-[120px]">
                                       <span className="text-[10px] font-bold text-foreground truncate">{file.name}</span>
                                       <span className="text-[8px] font-black text-gray-600">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                 </div>
                                 <button className="text-gray-700 hover:text-erani-coral opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                            ))}
                            {activeProject?.files.length === 0 && (
                              <div className="col-span-2 py-12 flex flex-col items-center justify-center border border-dashed border-glass-border rounded-[2rem] opacity-30">
                                 <Folder className="w-8 h-8 mb-3" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Sin archivos cargados</span>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>

                   {/* Sidebar: Checklist & Permissions */}
                   <div className="flex flex-col gap-8">
                      <div className="glassmorphism p-10 rounded-[3rem] border border-glass-border flex flex-col gap-8">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue">Checklist de Auditoría</span>
                            <div className="w-2 h-2 rounded-full bg-erani-blue animate-pulse" />
                         </div>

                         <div className="flex flex-col gap-5">
                            {[
                              { label: "Verificación de Infraestructura", icon: Database },
                              { label: "Validación de Contexto Histórico", icon: Clock },
                              { label: "Blindaje de Datos Personales", icon: Shield },
                              { label: "Alineación Forense Gemini", icon: Cpu }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-white/5">
                                 <div className="w-8 h-8 rounded-full border border-glass-border flex items-center justify-center">
                                    {activeProject?.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />}
                                 </div>
                                 <span className="text-[11px] font-bold text-gray-500">{item.label}</span>
                              </div>
                            ))}
                         </div>

                         <div className="pt-6 border-t border-glass-border flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                               <Shield className="w-4 h-4 text-emerald-500" />
                               <span className="text-[9px] uppercase font-black tracking-widest text-foreground">Aviso de Privacidad (GTO)</span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed italic">
                               {activeProject?.settings.allowStorage 
                                 ? "Almacenamiento SEGURO activado. Tus datos están blindados según la Ley de Protección de Datos Personales del Estado de Guanajuato."
                                 : "Modo TEMPORAL activo. Ningún dato será almacenado permanentemente tras finalizar la sesión de auditoría."}
                            </p>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                               Transparencia total: No tomamos ni vemos los datos, todos están cifrados y blindados para tu exclusiva administración.
                            </p>
                         </div>

                         <button 
                            disabled={activeProject?.files.length === 0}
                            className="button-premium w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4 disabled:opacity-30"
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
                 className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-12"
               >
                 <div className="relative mb-20">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-80 h-80 rounded-full border border-erani-blue/20 border-dashed"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 rounded-full border border-erani-purple/20 border-dashed"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Image src="/isologo.png" alt="ERANI" width={100} height={100} className="animate-pulse logo-adaptive" />
                    </div>
                    
                    {/* Floating Nodes */}
                    {[0, 72, 144, 216, 288].map((angle, i) => (
                      <motion.div 
                        key={i}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                        className="absolute w-4 h-4 rounded-full bg-erani-blue shadow-[0_0_15px_rgba(0,85,160,0.5)]"
                        style={{ 
                          top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 160}px)`,
                          left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 160}px)`,
                        }}
                      />
                    ))}
                 </div>

                 <div className="flex flex-col items-center gap-8 max-w-xl w-full">
                    <div className="flex flex-col items-center gap-3">
                       <h2 className="text-3xl font-black uppercase tracking-tight">Sincronizando Evidencia</h2>
                       <p className="text-gray-500 font-medium text-center">Nuestro motor AI está extrayendo los parámetros operativos de <span className="text-foreground font-black">{activeProject?.name}</span>.</p>
                    </div>

                    <div className="w-full flex flex-col gap-6">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue">Protocolo de Verificación</span>
                          <span className="text-[10px] font-black text-foreground">74%</span>
                       </div>
                       <div className="w-full h-2 bg-foreground/5 rounded-full overflow-hidden border border-glass-border">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "74%" }}
                            className="h-full bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral shadow-[0_0_20px_rgba(0,85,160,0.5)]"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                       {[
                         { label: "Triangulando Logs", icon: Layers, status: "completed" },
                         { label: "Análisis de Dark Data", icon: Database, status: "completed" },
                         { label: "Cálculo de Rentabilidad", icon: Cpu, status: "processing" },
                         { label: "Generando Reporte Bento", icon: FileText, status: "pending" }
                       ].map((item, i) => (
                         <div key={i} className={`p-4 rounded-2xl flex items-center gap-4 border transition-all ${item.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : item.status === 'processing' ? 'bg-erani-blue/5 border-erani-blue/20 text-foreground animate-pulse' : 'bg-foreground/5 border-glass-border text-gray-600'}`}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                            {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                         </div>
                       ))}
                    </div>

                    <button 
                      onClick={() => setView("manage")}
                      className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-erani-blue transition-all"
                    >
                      Interrumpir Proceso y Guardar como Borrador
                    </button>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

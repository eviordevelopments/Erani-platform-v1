"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Trash2, 
  MoreVertical,
  Cpu,
  History,
  Database,
  ShieldAlert,
  Settings,
  X,
  Sliders,
  SlidersHorizontal,
  BrainCircuit,
  Search as SearchIcon,
  Sparkles,
  UserCheck,
  FileUp,
  UploadCloud,
  FileText,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, Folder } from "lucide-react";

export interface AgentFile {
  id: string;
  name: string;
  size: string;
  content: string;
}

export interface AgentSettings {
  model: string;
  mode: "Analyze" | "Deep Thinking" | "Create";
  temperature: number;
  maxTokens: number;
  userName: string;
  customSystemPrompt: string;
  files: AgentFile[];
}

export default function ChatSidebar() {
  const { threads, activeThread, loadThread, createThread, deleteThread, activeProjectId, setActiveProjectId, isChatSidebarOpen, setIsChatSidebarOpen, projects, selectedProjectName, setSelectedProjectName } = useChat();
  const { org } = useAuth();
  const isPremiumUser = org?.paid_subscription === true;

  const [showSettings, setShowSettings] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [premiumAlert, setPremiumAlert] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const filteredThreads = threads.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // ── Agent Settings State Persistent in localStorage ──────────────────────
  const DEFAULT_SETTINGS: AgentSettings = {
    model: "meta-llama/llama-3.1-8b-instruct",
    mode: "Analyze",
    temperature: 0.2,
    maxTokens: 2000,
    userName: "",
    customSystemPrompt: "",
    files: [],
  };

  const [agentSettings, setAgentSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [settingsForm, setSettingsForm] = useState<AgentSettings>(DEFAULT_SETTINGS);

  // Sync settings when component mounts (post-hydration) and when top bar changes model/mode
  useEffect(() => {
    const syncSettings = () => {
      const saved = localStorage.getItem("erani_agent_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAgentSettings(parsed);
          setSettingsForm(parsed);
        } catch {}
      }
    };
    syncSettings();
    window.addEventListener("storage", syncSettings);
    return () => window.removeEventListener("storage", syncSettings);
  }, []);

  const handleOpenSettings = () => {
    setSettingsForm(agentSettings);
    setShowSettings(true);
  };

  const handleSaveSettings = () => {
    setAgentSettings(settingsForm);
    if (typeof window !== "undefined") {
      localStorage.setItem("erani_agent_settings", JSON.stringify(settingsForm));
      window.dispatchEvent(new Event("storage"));
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
    setShowSettings(false);
  };

  const handleCompanyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || "";
        const newFile: AgentFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: textContent.slice(0, 15000),
        };
        setSettingsForm((prev) => ({
          ...prev,
          files: [...prev.files, newFile],
        }));
      };
      reader.readAsText(file);
    });
  };

  const handleRemoveCompanyFile = (fileId: string) => {
    setSettingsForm((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isChatSidebarOpen ? 320 : 0, 
        opacity: isChatSidebarOpen ? 1 : 0,
        marginRight: isChatSidebarOpen ? 24 : 0
      }}
      className="flex flex-col gap-6 h-full border-r border-glass-border shrink-0 overflow-hidden"
    >
      <div className="w-80 flex flex-col gap-6 h-full pr-6 pb-6">
        {/* New Chat & Close Sidebar Row */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            id="tour-agent-new"
            onClick={() => createThread()}
            className="button-premium flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> Nuevo Peritaje
          </button>
          <button
            type="button"
            onClick={() => setIsChatSidebarOpen(false)}
            className="p-3.5 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-all border border-glass-border shadow-sm hover:scale-105 active:scale-95"
            title="Cerrar / Ocultar Barra Lateral"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      {/* Context Memory */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-erani-purple" /> Contexto Activo
            </label>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowProjects(!showProjects)}
            className={`w-full glassmorphism p-3 rounded-xl border border-glass-border flex flex-col gap-2 transition-all hover:bg-foreground/5 cursor-pointer ${!activeProjectId ? 'opacity-70' : ''}`}
          >
             <div className="flex items-center justify-between text-[9px] uppercase font-bold text-foreground w-full">
                <span className="flex items-center gap-2 truncate">
                  <Folder className="w-3.5 h-3.5 text-erani-purple" />
                  {selectedProjectName}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showProjects ? 'rotate-180' : ''}`} />
             </div>
             <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                <div className={`h-full ${activeProjectId ? 'w-full bg-erani-purple' : 'w-0 bg-emerald-500'}`} />
             </div>
             <span className="text-[8px] text-gray-500 text-left w-full truncate">
               {activeProjectId ? "Archivos inyectados al contexto." : "Ningún proyecto vinculado."}
             </span>
          </button>

          <AnimatePresence>
            {showProjects && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 w-full mt-2 glassmorphism border border-glass-border rounded-xl p-2 z-[100] shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
              >
                {projects.length === 0 ? (
                  <div className="px-4 py-3 text-center text-[9px] uppercase font-bold text-gray-500">
                    No hay proyectos
                  </div>
                ) : (
                  projects.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectName(p.name);
                        setActiveProjectId(p.id);
                        setShowProjects(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-foreground/5 rounded-lg text-[9px] uppercase font-black tracking-widest text-foreground transition-all flex items-center gap-2"
                    >
                      <Folder className="w-3 h-3 text-erani-purple/50" />
                      {p.name}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Threads History */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> Historial
          </label>
          <Search onClick={() => setIsSearching(!isSearching)} className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-foreground transition-colors" />
        </div>

        <AnimatePresence>
          {isSearching && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input 
                type="text" 
                placeholder="Buscar conversación..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-erani-blue transition-colors"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
          {filteredThreads.length === 0 && (
             <div className="p-4 text-center">
                <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500">No se encontraron resultados</span>
             </div>
          )}
          {filteredThreads.map((thread) => (
            <motion.div 
              key={thread.id}
              onClick={() => loadThread(thread.id)}
              whileHover={{ x: 4 }}
              className={`group flex flex-col gap-1 p-4 rounded-2xl border transition-all cursor-pointer relative ${
                activeThread?.id === thread.id 
                ? 'bg-foreground/5 border-glass-border shadow-inner' 
                : 'border-transparent hover:border-glass-border hover:bg-foreground/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-foreground truncate max-w-[150px]">{thread.title}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(thread.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-erani-coral/10 text-erani-coral rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[8px] uppercase tracking-widest text-gray-500">
                {new Date(thread.created_at).toLocaleDateString()}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Eris Status & Settings */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="p-4 rounded-2xl bg-erani-blue/5 border border-erani-blue/10 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-erani-blue tracking-widest">Costo por Consulta</span>
                <span className="text-sm font-black text-foreground">5.0 ERIS</span>
            </div>
            <ShieldAlert className="w-5 h-5 text-erani-blue opacity-40" />
        </div>
        
        <button 
          onClick={handleOpenSettings}
          className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-foreground/5 text-gray-400 hover:text-foreground transition-all group border border-transparent hover:border-glass-border"
        >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-erani-purple group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-[9px] uppercase font-black tracking-widest text-foreground">Ajustes del Agente</span>
            </div>
            {(agentSettings.customSystemPrompt || agentSettings.files.length > 0 || agentSettings.userName) && (
              <span suppressHydrationWarning className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
        </button>
      </div>

      {/* ── FULL AGENT SETTINGS MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-background/90 glassmorphism border border-glass-border rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              {/* Top Decorative Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-erani-blue via-erani-purple to-emerald-500" />

              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-glass-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-erani-purple/10 border border-erani-purple/30 text-erani-purple">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-foreground">
                      Ajustes Especiales del Agente Forense
                    </h2>
                    <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                      Configura el motor de inferencia, parámetros de temperatura, prompt personalizado y contexto corporativo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="p-2.5 rounded-full hover:bg-foreground/10 text-gray-400 hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
                
                {/* Section 1: Motor & Modo */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-erani-blue flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" /> Motor de Inferencia y Modo de Operación
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Model Selector Synced with Top Bar */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                      <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 flex items-center justify-between">
                        <span>Modelo de Inteligencia Artificial</span>
                        {!isPremiumUser && <span className="text-[8px] text-erani-coral font-bold">🔒 Plan Gratuito</span>}
                      </label>
                      <select
                        value={settingsForm.model}
                        onChange={(e) => {
                          const val = e.target.value;
                          const isPremiumModel = ["google/gemini-3.5-flash", "anthropic/claude-sonnet-4-5", "x-ai/grok-4.5", "openai/gpt-4o"].includes(val);
                          if (isPremiumModel && !isPremiumUser) {
                            setPremiumAlert(true);
                            setTimeout(() => setPremiumAlert(false), 3000);
                            return;
                          }
                          setSettingsForm({ ...settingsForm, model: val });
                        }}
                        className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:border-erani-purple transition-all"
                      >
                        <optgroup label="Modelos Trial (Gratis)">
                          <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 (Rápido)</option>
                          <option value="mistralai/mistral-small-2603">Mistral Small (Análisis)</option>
                        </optgroup>
                        <optgroup label="Modelos Premium (Beta)">
                          <option value="google/gemini-3.5-flash" disabled={!isPremiumUser}>
                            Gemini 3.5 Flash {!isPremiumUser ? "🔒 (Requiere Suscripción)" : ""}
                          </option>
                          <option value="anthropic/claude-sonnet-4-5" disabled={!isPremiumUser}>
                            Claude Sonnet 4 {!isPremiumUser ? "🔒 (Requiere Suscripción)" : ""}
                          </option>
                          <option value="x-ai/grok-4.5" disabled={!isPremiumUser}>
                            Grok 4 {!isPremiumUser ? "🔒 (Requiere Suscripción)" : ""}
                          </option>
                          <option value="openai/gpt-4o" disabled={!isPremiumUser}>
                            GPT-4o {!isPremiumUser ? "🔒 (Requiere Suscripción)" : ""}
                          </option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                      <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                        Modo de Trabajo
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-background border border-glass-border rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, mode: "Analyze" })}
                          className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${
                            settingsForm.mode === "Analyze"
                              ? "bg-erani-blue/20 text-erani-blue border border-erani-blue/30 shadow-sm"
                              : "text-gray-400 hover:text-foreground"
                          }`}
                        >
                          <SearchIcon className="w-3 h-3" /> Analizar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, mode: "Deep Thinking" })}
                          className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${
                            settingsForm.mode === "Deep Thinking"
                              ? "bg-erani-purple/20 text-erani-purple border border-erani-purple/30 shadow-sm"
                              : "text-gray-400 hover:text-foreground"
                          }`}
                        >
                          <BrainCircuit className="w-3 h-3" /> Profundo
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, mode: "Create" })}
                          className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${
                            settingsForm.mode === "Create"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                              : "text-gray-400 hover:text-foreground"
                          }`}
                        >
                          <Sparkles className="w-3 h-3" /> Crear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Personalización & Parámetros */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-erani-purple flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Personalización y Parámetros del Modelo
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* User Name */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                      <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                        ¿Cómo quieres que te llame ERANI?
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Carlos, Director Operativo..."
                        value={settingsForm.userName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, userName: e.target.value })}
                        className="w-full bg-background border border-glass-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-erani-purple transition-all"
                      />
                    </div>

                    {/* Temperature Slider */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                          Temperatura
                        </label>
                        <span className="text-xs font-mono font-bold text-erani-purple">
                          {settingsForm.temperature.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={settingsForm.temperature}
                        onChange={(e) => setSettingsForm({ ...settingsForm, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-erani-purple cursor-pointer mt-2"
                      />
                      <div className="flex justify-between text-[8px] uppercase font-bold text-gray-500 mt-1">
                        <span>Preciso (0.0)</span>
                        <span>Creativo (1.0)</span>
                      </div>
                    </div>

                    {/* Max Tokens / Detail Length */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                      <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                        Longitud de Respuesta
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-background border border-glass-border rounded-xl">
                        {[
                          { label: "Concisa", val: 500 },
                          { label: "Normal", val: 2000 },
                          { label: "Extensa", val: 4000 },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, maxTokens: item.val })}
                            className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                              settingsForm.maxTokens === item.val
                                ? "bg-erani-purple/20 text-erani-purple border border-erani-purple/30 shadow-sm"
                                : "text-gray-400 hover:text-foreground"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Custom System Prompt & Corporate Files */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <FileUp className="w-4 h-4" /> Directivas de Empresa & Base de Conocimiento (PDFs / Docs)
                  </h3>

                  {/* Custom Prompt Textarea */}
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                    <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                      Prompt / Directivas Especiales de tu Empresa
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. Prioriza siempre el cálculo de ROI en MXN, sigue la política de privacidad HIPAA y reporta anomalías de tickets que superen las 10h..."
                      value={settingsForm.customSystemPrompt}
                      onChange={(e) => setSettingsForm({ ...settingsForm, customSystemPrompt: e.target.value })}
                      className="w-full bg-background border border-glass-border rounded-xl p-3 text-xs font-medium text-foreground focus:outline-none focus:border-emerald-500 transition-all custom-scrollbar"
                    />
                  </div>

                  {/* Corporate File Upload Area */}
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                        Archivos Corporativos Persistentes (PDFs, TXT, CSV)
                      </label>
                      <span className="text-[8px] font-mono text-emerald-400">
                        {settingsForm.files.length} cargados
                      </span>
                    </div>

                    <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-glass-border hover:border-emerald-500/50 rounded-2xl cursor-pointer bg-background/50 hover:bg-emerald-500/5 transition-all group">
                      <UploadCloud className="w-7 h-7 text-gray-400 group-hover:text-emerald-400 transition-colors mb-2" />
                      <span className="text-[10px] uppercase font-black tracking-widest text-foreground group-hover:text-emerald-400 transition-colors">
                        Haz click o arrastra archivos para añadir a la base del agente
                      </span>
                      <span className="text-[8px] text-gray-500 mt-1">Soporta PDF, CSV, TXT, JSON (Leídos localmente y persistidos)</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.txt,.csv,.json,.md,.doc,.docx"
                        onChange={handleCompanyFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Files List */}
                    {settingsForm.files.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        {settingsForm.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-background border border-glass-border text-xs"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="font-bold text-foreground truncate max-w-xs">{file.name}</span>
                              <span className="text-[9px] font-mono text-gray-500">{file.size}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCompanyFile(file.id)}
                              className="p-1.5 text-erani-coral hover:bg-erani-coral/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-glass-border bg-foreground/2 flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">
                  Los cambios se aplicarán en tus próximas consultas al agente.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-foreground hover:bg-foreground/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="button-premium px-8 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest text-white shadow-xl shadow-erani-purple/20 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Guardar Ajustes
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 right-10 z-[600] bg-emerald-500 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl"
          >
            <CheckCircle2 className="w-5 h-5" /> Configuración Guardada Correctamente
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Lock Alert Toast */}
      <AnimatePresence>
        {premiumAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 right-10 z-[600] bg-erani-coral text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl"
          >
            <ShieldAlert className="w-5 h-5" /> Modelo Premium Restringido. Suscríbete para Desbloquear.
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}

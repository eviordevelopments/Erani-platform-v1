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
  Sliders
} from "lucide-react";
import { useState } from "react";

interface Thread {
  id: string;
  title: string;
  date: string;
}

const MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "Google" },
  { id: "gpt-5", name: "GPT-5 (Preview)", provider: "OpenAI" },
  { id: "llama-3-70b", name: "Llama 3 70B", provider: "Meta" },
  { id: "gemma-2b", name: "Gemma 2B", provider: "Google" },
];

export default function ChatSidebar() {
  const [threads, setThreads] = useState<Thread[]>([
    { id: "1", title: "Análisis de Discrepancias Q1", date: "Hace 2 horas" },
    { id: "2", title: "Auditoría de Proveedores 2024", date: "Ayer" },
    { id: "3", title: "Protocolo de Blindaje Fiscal", date: "24 Abr 2024" },
  ]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="w-80 flex flex-col gap-6 h-full border-r border-glass-border pr-6 shrink-0">
      {/* New Chat Button */}
      <button className="button-premium w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest">
        <Plus className="w-4 h-4" /> Nuevo Peritaje
      </button>

      {/* Model Selector */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-erani-blue" /> Motor de Inferencia
        </label>
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="select-premium w-full !text-[10px]"
        >
          {MODELS.map(model => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
      </div>

      {/* Context Memory */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-erani-purple" /> Contexto Activo
            </label>
            <button className="text-[8px] uppercase font-bold text-erani-blue hover:underline">Gestionar</button>
        </div>
        <div className="glassmorphism p-3 rounded-xl border border-glass-border flex flex-col gap-2">
           <div className="flex items-center justify-between text-[9px] uppercase font-bold text-foreground">
              <span>Proyecto Alpha</span>
              <span className="text-emerald-500">Activo</span>
           </div>
           <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-emerald-500" />
           </div>
           <span className="text-[8px] text-gray-500">12 archivos procesados</span>
        </div>
      </div>

      {/* Threads History */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> Historial
          </label>
          <Search className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-foreground transition-colors" />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
          {threads.map((thread) => (
            <motion.div 
              key={thread.id}
              whileHover={{ x: 4 }}
              className="group flex flex-col gap-1 p-4 rounded-2xl hover:bg-foreground/5 border border-transparent hover:border-glass-border transition-all cursor-pointer relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-foreground truncate max-w-[150px]">{thread.title}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setThreads(threads.filter(t => t.id !== thread.id));
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-erani-coral/10 text-erani-coral rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[8px] uppercase tracking-widest text-gray-500">{thread.date}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Eris Status & Settings */}
      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-2xl bg-erani-blue/5 border border-erani-blue/10 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-erani-blue tracking-widest">Costo por Consulta</span>
                <span className="text-sm font-black text-foreground">5.0 ERIS</span>
            </div>
            <ShieldAlert className="w-5 h-5 text-erani-blue opacity-40" />
        </div>
        
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/5 text-gray-500 hover:text-foreground transition-all"
        >
            <Settings className="w-4 h-4" />
            <span className="text-[9px] uppercase font-black tracking-widest">Ajustes del Agente</span>
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md glassmorphism border border-glass-border p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue">Configuración</span>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Ajustes del Agente</h3>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
                      <Sliders className="w-4 h-4" /> Creatividad (Temperature)
                    </label>
                    <input type="range" className="w-full accent-erani-blue h-1.5 bg-foreground/10 rounded-full appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[8px] uppercase font-bold text-gray-500 tracking-widest">
                       <span>Precisión</span>
                       <span>Creatividad</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Longitud de Respuesta</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Breve', 'Estándar', 'Detallada'].map(size => (
                        <button key={size} className="py-2 rounded-xl border border-glass-border text-[9px] font-black uppercase tracking-widest hover:bg-erani-blue/10 transition-colors">
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="button-premium w-full py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

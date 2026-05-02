"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  TrendingUp, 
  MoreHorizontal, 
  Clock, 
  User, 
  AlertCircle,
  Filter,
  CheckCircle2,
  X
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useDashboard, FeedbackItem } from "@/context/DashboardContext";

const COLUMNS = [
  { id: "todo", label: "Reportado", color: "gray" },
  { id: "in-progress", label: "En Desarrollo", color: "erani-blue" },
  { id: "review", label: "Validación", color: "erani-purple" },
  { id: "done", label: "Desplegado", color: "emerald" }
];

export default function FeedbackKanbanPage() {
  const { isSidebarCollapsed, feedback, addFeedback, updateFeedbackStatus } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    title: "",
    description: "",
    type: "feature" as const,
    priority: "medium" as const
  });

  const handleAddFeedback = () => {
    if (!newFeedback.title) return;
    const item: FeedbackItem = {
      id: "FB-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      title: newFeedback.title,
      description: newFeedback.description,
      type: newFeedback.type,
      status: "todo",
      priority: newFeedback.priority,
      reportedBy: "Comunidad Erani",
      createdAt: new Date()
    };
    addFeedback(item);
    setIsModalOpen(false);
    setNewFeedback({ title: "", description: "", type: "feature", priority: "medium" });
  };

  const getIcon = (type: FeedbackItem["type"]) => {
    switch (type) {
      case "bug": return <Bug className="w-3.5 h-3.5 text-erani-coral" />;
      case "feature": return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
      case "improvement": return <TrendingUp className="w-3.5 h-3.5 text-erani-blue" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative flex flex-col h-screen`}>
        {/* Background Gradients */}
        <div className="bg-blob-purple top-[-10%] left-[-5%] w-[600px] h-[600px]" />
        
        {/* Header */}
        <header className="p-8 pb-4 flex items-center justify-between z-20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-purple flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Roadmap Colaborativo
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Community <span className="text-gradient-brand">Feedback</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-6 py-3 bg-foreground/5 border border-glass-border rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-foreground transition-all">
                <Filter className="w-4 h-4" /> Filtrar Roadmap
             </button>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="button-premium px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
             >
                <Plus className="w-4 h-4" /> Reportar o Sugerir
             </button>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 p-8 pt-6 flex gap-6 overflow-x-auto no-scrollbar z-10">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col gap-6 min-w-[320px] max-w-[320px]">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${col.color === 'gray' ? 'gray-500' : col.color === 'emerald' ? 'emerald-500' : col.color}`} />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">{col.label}</span>
                 </div>
                 <span className="text-[10px] font-bold text-gray-500 bg-foreground/5 px-2 py-0.5 rounded-md">
                    {feedback.filter(f => f.status === col.id).length}
                 </span>
              </div>

              <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10">
                <AnimatePresence>
                  {feedback
                    .filter((item) => item.status === col.id)
                    .map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="premium-border-container group"
                      >
                        <div className="premium-border-inner p-5 flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 bg-foreground/5 px-2 py-1 rounded-lg border border-glass-border">
                                 {getIcon(item.type)}
                                 <span className="text-[8px] font-black uppercase text-gray-400">{item.type}</span>
                              </div>
                              <button className="text-gray-600 hover:text-foreground p-1">
                                 <MoreHorizontal className="w-4 h-4" />
                              </button>
                           </div>

                           <div className="flex flex-col gap-1.5">
                              <h3 className="text-[13px] font-black uppercase tracking-tight text-foreground group-hover:text-erani-blue transition-colors">
                                 {item.title}
                              </h3>
                              <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-2">
                                 {item.description}
                              </p>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-glass-border mt-1">
                              <div className="flex items-center gap-2">
                                 <div className="w-5 h-5 rounded-full bg-erani-blue/20 flex items-center justify-center">
                                    <User className="w-3 h-3 text-erani-blue" />
                                 </div>
                                 <span className="text-[9px] font-bold text-gray-500">{item.reportedBy}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="flex items-center gap-1 text-[9px] font-black text-gray-600 uppercase">
                                    <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                 </div>
                              </div>
                           </div>
                           
                           {/* Status Controls for simulation */}
                           <div className="grid grid-cols-2 gap-2 mt-1">
                              {col.id !== 'done' && (
                                <button 
                                  onClick={() => updateFeedbackStatus(item.id, COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1].id as FeedbackItem["status"])}
                                  className="w-full py-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-[8px] font-black uppercase tracking-widest text-gray-500 transition-all"
                                >
                                  Mover Siguiente
                                </button>
                              )}
                              {item.priority === 'high' && (
                                <div className="flex items-center justify-center gap-1 text-erani-coral text-[8px] font-black uppercase">
                                  <AlertCircle className="w-2.5 h-2.5" /> Prioridad
                                </div>
                              )}
                           </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
                
                {feedback.filter(f => f.status === col.id).length === 0 && (
                   <div className="py-20 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-glass-border rounded-[2rem] opacity-30">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Columna Vacía</span>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal for reporting */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
            >
               <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="premium-border-container max-w-lg w-full"
               >
                  <div className="premium-border-inner p-10 flex flex-col gap-8">
                     <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Colaborar con <span className="text-gradient-brand">Roadmap</span></h2>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-foreground/5 hover:bg-erani-coral/10 hover:text-erani-coral transition-all">
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                           <label className="text-[9px] uppercase font-black tracking-widest text-gray-500">Título del Reporte / Sugerencia</label>
                           <input 
                             type="text" 
                             className="input-premium"
                             placeholder="Ej. Integración con Stripe..."
                             value={newFeedback.title}
                             onChange={(e) => setNewFeedback({...newFeedback, title: e.target.value})}
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex flex-col gap-2">
                              <label className="text-[9px] uppercase font-black tracking-widest text-gray-500">Tipo de Entrada</label>
                              <select 
                                className="select-premium text-[10px]"
                                value={newFeedback.type}
                                onChange={(e) => setNewFeedback({...newFeedback, type: e.target.value as any})}
                              >
                                 <option value="feature">Nueva Funcionalidad</option>
                                 <option value="bug">Reportar Bug</option>
                                 <option value="improvement">Mejora UI/UX</option>
                              </select>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[9px] uppercase font-black tracking-widest text-gray-500">Prioridad</label>
                              <select 
                                className="select-premium text-[10px]"
                                value={newFeedback.priority}
                                onChange={(e) => setNewFeedback({...newFeedback, priority: e.target.value as any})}
                              >
                                 <option value="low">Baja</option>
                                 <option value="medium">Media</option>
                                 <option value="high">Crítica</option>
                              </select>
                           </div>
                        </div>

                        <div className="flex flex-col gap-2">
                           <label className="text-[9px] uppercase font-black tracking-widest text-gray-500">Descripción Detallada</label>
                           <textarea 
                             className="textarea-premium h-32"
                             placeholder="Describe qué podemos mejorar..."
                             value={newFeedback.description}
                             onChange={(e) => setNewFeedback({...newFeedback, description: e.target.value})}
                           ></textarea>
                        </div>
                     </div>

                     <button 
                        onClick={handleAddFeedback}
                        className="button-premium w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]"
                     >
                        Enviar al Roadmap
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

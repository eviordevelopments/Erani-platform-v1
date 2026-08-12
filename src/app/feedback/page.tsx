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
import { useAuth } from "@/context/AuthContext";

const COLUMNS = [
  { id: "todo", label: "Reportado", color: "gray" },
  { id: "in-progress", label: "En Desarrollo", color: "erani-blue" },
  { id: "review", label: "Validación", color: "erani-purple" },
  { id: "done", label: "Desplegado", color: "emerald" }
];

export default function FeedbackKanbanPage() {
  const [filterType, setFilterType] = useState<"all" | "bug" | "feature" | "improvement">("all");
  const filterOptions: Array<"all" | "bug" | "feature" | "improvement"> = ["all", "feature", "improvement", "bug"];
  const { profile } = useAuth();
  const { isSidebarCollapsed, feedback, addFeedback, editFeedback, updateFeedbackStatus, deleteFeedback } = useDashboard();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState<{
    title: string;
    description: string;
    type: "bug" | "feature" | "improvement";
    priority: "low" | "medium" | "high";
  }>({
    title: "",
    description: "",
    type: "feature",
    priority: "medium"
  });

  const handleAddFeedback = () => {
    if (!newFeedback.title) return;
    
    if (editingId) {
      const originalItem = feedback.find(f => f.id === editingId);
      if (originalItem) {
        editFeedback({
          ...originalItem,
          title: newFeedback.title,
          description: newFeedback.description,
          type: newFeedback.type,
          priority: newFeedback.priority,
        });
      }
    } else {
      const item: FeedbackItem = {
        id: "FB-" + Math.random().toString(36).substr(2, 6).toUpperCase() + (profile?.id ? `_${profile.id}` : ""),
        title: newFeedback.title,
        description: newFeedback.description,
        type: newFeedback.type,
        status: "todo",
        priority: newFeedback.priority,
        reportedBy: profile?.display_name || profile?.full_name || "Comunidad Erani",
        userId: profile?.id,
        createdAt: new Date()
      };
      addFeedback(item);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
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

      <main className={`transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px] w-[calc(100vw-104px)]" : "ml-[296px] w-[calc(100vw-296px)]"} relative flex flex-col h-screen`}>
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
             <button 
                onClick={() => {
                  const nextIdx = (filterOptions.indexOf(filterType) + 1) % filterOptions.length;
                  setFilterType(filterOptions[nextIdx]);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 border border-glass-border rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-foreground transition-all"
             >
                <Filter className="w-4 h-4" /> 
                {filterType === "all" ? "Filtrar Roadmap" : 
                 filterType === "feature" ? "Solo Funcionalidades" :
                 filterType === "improvement" ? "Solo Mejoras" : "Solo Bugs"}
             </button>
             <button 
                onClick={() => {
                  setEditingId(null);
                  setNewFeedback({ title: "", description: "", type: "feature", priority: "medium" });
                  setIsModalOpen(true);
                }}
                className="button-premium px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
             >
                <Plus className="w-4 h-4" /> Reportar o Sugerir
             </button>
          </div>
        </header>

        {/* Kanban Board */}
        <div 
          className="flex-1 p-8 pt-6 flex gap-6 overflow-x-auto no-scrollbar z-10 w-full"
          onClick={() => setActiveDropdown(null)}
        >
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col gap-6 flex-1 min-w-[280px]">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${col.color === 'gray' ? 'gray-500' : col.color === 'emerald' ? 'emerald-500' : col.color}`} />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">{col.label}</span>
                 </div>
                 <span className="text-[10px] font-bold text-gray-500 bg-foreground/5 px-2 py-0.5 rounded-md">
                    {feedback.filter(f => f.status === col.id && (filterType === "all" || f.type === filterType)).length}
                 </span>
              </div>

              <div 
                className="flex-1 flex flex-col -space-y-6 overflow-y-auto overflow-x-visible no-scrollbar pb-10 min-h-[200px] pt-4 px-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) {
                    updateFeedbackStatus(id, col.id as FeedbackItem["status"]);
                  }
                }}
              >
                <AnimatePresence>
                  {feedback
                    .filter((item) => item.status === col.id && (filterType === "all" || item.type === filterType))
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="premium-border-container group cursor-grab active:cursor-grabbing hover:-translate-y-6 hover:z-50 transition-all duration-300 relative bg-background/95 backdrop-blur-md shadow-[0_-8px_20px_rgba(0,0,0,0.15)]"
                        style={{ zIndex: index }}
                        draggable
                        onDragStart={(e: any) => e.dataTransfer.setData("text/plain", item.id)}
                      >
                        <div className="premium-border-inner p-5 flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 bg-foreground/5 px-2 py-1 rounded-lg border border-glass-border">
                                 {getIcon(item.type)}
                                 <span className="text-[8px] font-black uppercase text-gray-400">{item.type}</span>
                              </div>
                                 {profile?.id && (!item.userId || item.userId === profile.id) && (
                                   <div className="relative">
                                     <button 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setActiveDropdown(activeDropdown === item.id ? null : item.id);
                                       }}
                                       className="text-gray-600 hover:text-foreground p-1"
                                     >
                                        <MoreHorizontal className="w-4 h-4" />
                                     </button>
                                     {activeDropdown === item.id && (
                                       <div className="absolute right-0 top-6 w-32 bg-background border border-glass-border rounded-xl shadow-xl overflow-hidden z-[100]">
                                         <button 
                                           onClick={() => {
                                             setEditingId(item.id);
                                             setNewFeedback({
                                               title: item.title,
                                               description: item.description,
                                               type: item.type,
                                               priority: item.priority
                                             });
                                             setIsModalOpen(true);
                                             setActiveDropdown(null);
                                           }}
                                           className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-foreground/5 transition-colors"
                                         >
                                           Editar
                                         </button>
                                         <button 
                                           onClick={() => {
                                             deleteFeedback(item.id);
                                             setActiveDropdown(null);
                                           }}
                                           className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-erani-coral hover:bg-erani-coral/10 transition-colors"
                                         >
                                           Eliminar
                                         </button>
                                       </div>
                                     )}
                                   </div>
                                 )}
                           </div>

                           <div className="flex flex-col gap-1.5">
                              <h3 className="text-[13px] font-black uppercase tracking-tight text-foreground group-hover:text-erani-blue transition-colors">
                                 {item.title}
                              </h3>
                              <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-2">
                                 {item.description}
                              </p>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-glass-border mt-1 gap-2 overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                 <div className="w-5 h-5 flex-shrink-0 rounded-full bg-erani-blue/20 flex items-center justify-center">
                                    <User className="w-3 h-3 text-erani-blue" />
                                 </div>
                                 <span className="text-[9px] font-bold text-gray-500 truncate">{item.reportedBy}</span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                 <div className="flex items-center gap-1 text-[9px] font-black text-gray-600 uppercase">
                                    <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                 </div>
                              </div>
                           </div>
                           
                           {/* Status Controls */}
                           <div className="grid grid-cols-2 gap-2 mt-1">
                              {item.priority === 'high' && (
                                <div className="flex items-center justify-center gap-1 text-erani-coral text-[8px] font-black uppercase col-span-2">
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
                        <h2 className="text-2xl font-black uppercase tracking-tight">
                          {editingId ? "Editar " : "Colaborar con "}
                          <span className="text-gradient-brand">Roadmap</span>
                        </h2>
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
                        {editingId ? "Guardar Cambios" : "Enviar al Roadmap"}
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

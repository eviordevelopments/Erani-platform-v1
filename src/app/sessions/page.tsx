"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  X,
  PlusCircle,
  Video,
  FileText,
  Loader2,
  LayoutDashboard
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useDashboard } from "@/context/DashboardContext";

export default function SessionsPage() {
  const { sessions, addSession, isSidebarCollapsed } = useDashboard();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbSessions, setDbSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Form State
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    notes: ""
  });

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (Array.isArray(data)) setDbSessions(data);
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledAt = new Date(`${formData.date}T${formData.time}`);
    
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          scheduledAt: scheduledAt.toISOString(),
          notes: formData.notes
        })
      });
      
      const newSession = await res.json();
      setDbSessions(prev => [newSession, ...prev]);
      setIsModalOpen(false);
      setFormData({ title: "", date: "", time: "", notes: "" });
    } catch (e) {
      console.error("Error creating session:", e);
    }
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-8 relative overflow-x-hidden`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-blue/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-[1600px] flex flex-col gap-8 pt-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
               <h1 className="text-4xl font-black uppercase tracking-tight text-white">
                  Sesiones de <span className="text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-erani-purple">Estrategia</span>
               </h1>
               <p className="text-xs uppercase font-bold tracking-widest text-gray-500">
                  Agenda y monitorea tus auditorías forenses en vivo.
               </p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="button-premium px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3"
            >
              <PlusCircle className="w-4 h-4" />
              Agendar Sesión Nueva
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            
            {/* Calendar Column */}
            <div className="glassmorphism p-8 flex flex-col gap-8 min-h-[600px]">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-xl font-black text-white uppercase tracking-tight capitalize">{monthName} {year}</span>
                     <span className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">{dbSessions.length} Eventos Agendados</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <ChevronLeft className="w-5 h-5" />
                     </button>
                     <button onClick={() => changeMonth(1)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                     </button>
                  </div>
               </div>

               {/* Calendar Grid */}
               <div className="flex-1 grid grid-cols-7 gap-1">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="text-center py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">{d}</div>
                  ))}
                  
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-4 border border-white/5 opacity-20" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = new Date().toDateString() === new Date(year, currentDate.getMonth(), day).toDateString();
                    const hasEvent = dbSessions.some(s => new Date(s.scheduled_at).getDate() === day && new Date(s.scheduled_at).getMonth() === currentDate.getMonth());

                    return (
                      <div 
                        key={day} 
                        className={`p-4 border border-white/5 aspect-square relative group transition-all hover:bg-white/5 cursor-pointer ${
                          isToday ? 'bg-erani-blue/5 border-erani-blue/20' : ''
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${isToday ? 'text-erani-blue' : 'text-gray-500 group-hover:text-white'}`}>{day}</span>
                        {hasEvent && (
                           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                              <div className="w-1 h-1 rounded-full bg-erani-blue shadow-[0_0_5px_rgba(0,85,160,0.8)]" />
                              <div className="w-1 h-1 rounded-full bg-erani-purple shadow-[0_0_5px_rgba(158,128,255,0.8)]" />
                           </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* Upcoming Events Column */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">Próximos Pasos (Historial)</h3>
                   <span className="text-[10px] font-bold text-erani-blue bg-erani-blue/10 px-2 py-0.5 rounded uppercase">Onboarding</span>
                </div>

                <div className="flex flex-col gap-3">
                   {isLoading ? (
                     <div className="glassmorphism p-12 flex flex-col items-center justify-center gap-4 text-center">
                        <Loader2 className="w-8 h-8 text-erani-blue animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Sincronizando con Erani Cloud...</span>
                     </div>
                   ) : dbSessions.length === 0 ? (
                     <div className="glassmorphism p-12 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-700">
                           <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No hay sesiones activas. Agenda tu diagnóstico inicial.</p>
                     </div>
                   ) : (
                     dbSessions.map((session, idx) => (
                        <motion.div 
                          key={session.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="glassmorphism p-6 flex flex-col gap-4 group/session hover:border-erani-blue/20 transition-all"
                        >
                           <div className="flex items-start justify-between">
                              <div className="flex flex-col gap-1">
                                 <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover/session:text-erani-blue transition-colors">{session.title}</h4>
                                 <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    <Clock className="w-3 h-3 text-erani-purple" />
                                    {new Date(session.scheduled_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {new Date(session.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              </div>
                              <span className="p-2 rounded-lg bg-white/5 text-gray-600 group-hover/session:text-white transition-colors">
                                 <MoreVertical className="w-4 h-4" />
                              </span>
                           </div>
                           
                           <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tight text-white/40">
                                 <Video className="w-3 h-3" />
                                 Google Meet
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tight text-white/40">
                                 <FileText className="w-3 h-3" />
                                 Agenda Brief
                              </div>
                           </div>
                        </motion.div>
                     ))
                   )}
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* NEW SESSION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg glassmorphism p-10 flex flex-col gap-8 shadow-2xl relative"
            >
               <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
               </button>

               <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Nueva Sesión</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Configurando Sesión de Auditoría Forense</p>
               </div>

               <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Proyecto y Objetivos</label>
                     <input 
                        required
                        placeholder="Ej: Revisión de Escalamiento TRL5 / Jira Audit"
                        className="input-premium"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Fecha</label>
                        <input 
                           type="date"
                           required
                           className="input-premium"
                           value={formData.date}
                           onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Hora</label>
                        <input 
                           type="time"
                           required
                           className="input-premium"
                           value={formData.time}
                           onChange={e => setFormData({...formData, time: e.target.value})}
                        />
                     </div>
                  </div>

                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Notas Forenses (Opcional)</label>
                     <textarea 
                        rows={3}
                        placeholder="Define los puntos clave a analizar..."
                        className="textarea-premium"
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                     />
                  </div>

                  <button className="button-premium w-full py-4 mt-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3">
                     Guardar Sesión en Plataforma
                     <CheckCircle2 className="w-4 h-4" />
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, List, Activity, Calendar as CalendarIcon, Clock, Folder, Server, Bot, Check, ArrowRight, ShieldCheck, FileText, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDashboard } from "@/context/DashboardContext";

export default function UnifiedWorkspace({ audits, collections, operations, dbSessions, googleEvents, workspaceTags, orgMembers }: any) {
  const router = useRouter();
  const { automations } = useDashboard();
  const [viewMode, setViewMode] = useState<'gallery' | 'table' | 'timeline'>('gallery');

  const resolveCollabs = (arr: any[]) => {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.map(id => {
         if (typeof id === 'string' && id.includes('@')) return id;
         const member = (orgMembers || []).find((m: any) => m.id === id || m.profile_id === id);
         return member ? member.email : id;
      }).filter(Boolean);
  };
  const [filterType, setFilterType] = useState<'all' | 'audit' | 'collection' | 'operation' | 'session' | 'task' | 'automation'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Combine everything into a single array
  const allItems = [
    ...(audits || []).map((a: any) => ({ ...a, unified_type: 'audit', title: a.metadata?.name || 'Auditoría', date: a.created_at, status: 'active', color: a.color_tag || null, collabs: resolveCollabs(a.metadata?.teamAccess || a.collaborators || []) })),
    ...(collections || []).map((c: any) => ({ ...c, unified_type: 'collection', title: c.name || 'Data Room', date: c.created_at, status: 'active', color: c.color_tag || null, collabs: resolveCollabs(c.collaborators || c.invited_emails || []) })),
    ...(operations || []).map((o: any) => ({ ...o, unified_type: 'operation', title: o.title, date: o.created_at, status: o.status, color: o.color_tag || null, collabs: resolveCollabs(o.collaborators || []) })),
    ...(automations || []).map((a: any) => ({ ...a, unified_type: 'automation', title: a.name || 'Automatización', date: a.created_at || new Date(), status: a.status, color: a.color_tag || null, collabs: resolveCollabs(a.collaborators || []) })),
    ...(dbSessions || []).map((s: any) => ({ 
       ...s, 
       unified_type: s.item_type === 'session' || s.calendly_url ? 'session' : 'task', 
       title: s.title, 
       date: s.scheduled_at || s.created_at, 
       status: s.status, 
       color: s.color_tag || null,
       collabs: resolveCollabs(s.collaborators || [])
    })),
    ...(googleEvents || []).map((e: any) => ({
       id: e.id,
       unified_type: 'session',
       title: e.summary || 'Google Meet',
       date: e.start?.dateTime || e.start?.date || new Date(),
       status: 'scheduled',
       color: null,
       googleEvent: true,
       collabs: resolveCollabs((e.attendees || []).map((x: any) => x.email))
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredItems = filterType === 'all' ? allItems : allItems.filter(item => item.unified_type === filterType);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'audit': return <ShieldCheck className="w-4 h-4 text-erani-blue" />;
      case 'collection': return <Server className="w-4 h-4 text-erani-purple" />;
      case 'operation': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'automation': return <Bot className="w-4 h-4 text-erani-blue" />;
      case 'session': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'task': return <Check className="w-4 h-4 text-erani-coral" />;
      default: return <Folder className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'audit': return 'Auditoría';
      case 'collection': return 'Data Room';
      case 'operation': return 'Operación';
      case 'automation': return 'Automatización';
      case 'session': return 'Sesión';
      case 'task': return 'Tarea';
      default: return 'Elemento';
    }
  };

  const handleNavigate = (item: any) => {
    switch(item.unified_type) {
      case 'audit': router.push('/audit'); break;
      case 'collection': router.push(`/collections/${item.id}`); break;
      case 'operation': break; // Opens in operations tab
      case 'automation': router.push('/marketplace'); break;
      case 'session': 
         if (item.googleEvent) window.open(`https://calendar.google.com/calendar/u/0/r/eventedit/${item.id}`, '_blank');
         else router.push(`/sessions?taskId=${item.id}`); 
         break;
      case 'task': router.push(`/sessions?taskId=${item.id}`); break;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-10">
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 border-b border-glass-border pb-4">
        <div className="flex items-center gap-3">
            <div className="relative">
              <div 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="bg-foreground/5 border border-glass-border rounded-xl px-4 py-2 w-64 text-xs font-black uppercase tracking-widest text-foreground cursor-pointer flex justify-between items-center hover:bg-foreground/10 transition-colors"
              >
                <span className="truncate">
                   {filterType === 'all' ? 'Todas las Entidades' : 
                    filterType === 'audit' ? 'Auditorías' : 
                    filterType === 'collection' ? 'Data Rooms' : 
                    filterType === 'operation' ? 'Operaciones' : 
                    filterType === 'automation' ? 'Automatizaciones' : 
                    filterType === 'session' ? 'Sesiones' : 'Tareas'}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
              </div>
              <AnimatePresence>
                 {isFilterOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-full bg-background border border-glass-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                       {[
                         { id: 'all', label: 'Todas las Entidades' },
                         { id: 'audit', label: 'Auditorías' },
                         { id: 'collection', label: 'Data Rooms' },
                         { id: 'operation', label: 'Operaciones' },
                         { id: 'automation', label: 'Automatizaciones' },
                         { id: 'session', label: 'Sesiones' },
                         { id: 'task', label: 'Tareas' }
                       ].map(opt => (
                          <div 
                            key={opt.id}
                            onClick={() => { setFilterType(opt.id as any); setIsFilterOpen(false); }}
                            className="px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-foreground/5 cursor-pointer transition-colors text-foreground"
                          >
                             {opt.label}
                          </div>
                       ))}
                    </motion.div>
                 )}
              </AnimatePresence>
            </div>

            <div className="bg-foreground/5 p-1 rounded-xl flex items-center border border-glass-border">
              <button 
                onClick={() => setViewMode("gallery")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'gallery' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}
              >
                Galería
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}
              >
                Tabla
              </button>
              <button 
                onClick={() => setViewMode("timeline")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'timeline' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}
              >
                Timeline
              </button>
            </div>
        </div>
      </div>

      <div className="flex-1 w-full">
         {viewMode === 'gallery' ? (
            <div className="flex flex-col gap-10">
               {['audit', 'collection', 'operation', 'automation', 'session', 'task'].map((type) => {
                  const items = filteredItems.filter(i => i.unified_type === type);
                  if (items.length === 0) return null;
                  return (
                     <div key={type} className="flex flex-col gap-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                           {getTypeIcon(type)} {getTypeLabel(type)} <span className="bg-foreground/5 text-gray-500 px-2 py-0.5 rounded-full text-[10px]">{items.length}</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {items.map((item, idx) => (
                              <div 
                                key={idx}
                                onClick={() => handleNavigate(item)}
                                className="bg-background/40 backdrop-blur-md border border-glass-border rounded-2xl p-5 hover:border-erani-blue/50 hover:shadow-[0_0_20px_rgba(0,85,160,0.1)] transition-all cursor-pointer group flex flex-col gap-3 relative overflow-hidden"
                              >
                                 <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                       <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-glass-border flex items-center justify-center">
                                          {getTypeIcon(item.unified_type)}
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[9px] uppercase font-black tracking-widest text-gray-500">{getTypeLabel(item.unified_type)}</span>
                                          <h3 className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-erani-blue transition-colors leading-snug pr-2 break-words">{item.title}</h3>
                                       </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-erani-blue transition-colors group-hover:translate-x-1" />
                                 </div>
                                 <div className="flex flex-wrap items-center gap-4 mt-2 text-[10px] uppercase font-bold tracking-widest text-gray-500 relative z-10">
                                    <span className="flex items-center gap-1.5"><CalendarIcon className="w-3 h-3" /> {new Date(item.date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> {item.status || 'Activo'}</span>
                                    {item.color && item.color.split(',').map((tag: string, i: number) => {
                                        const t = tag.trim();
                                        const tagData = (workspaceTags || []).find((wt: any) => wt.id === t);
                                        const actualTag = tagData ? tagData.color : t;
                                        const tagName = tagData ? tagData.name : t;
                                        const bgMap: any = { 'erani-blue': 'bg-erani-blue/20 text-erani-blue', 'erani-purple': 'bg-erani-purple/20 text-erani-purple', 'emerald': 'bg-emerald-500/20 text-emerald-500', 'amber': 'bg-amber-500/20 text-amber-500', 'coral': 'bg-erani-coral/20 text-erani-coral', 'gray': 'bg-gray-500/20 text-gray-400' };
                                        return t ? <span key={i} className={`px-2 py-0.5 rounded-full text-[8px] font-black border border-glass-border ${bgMap[actualTag] || 'bg-foreground/10 text-foreground'}`}>{tagName}</span> : null;
                                    })}
                                 </div>
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-erani-blue/5 blur-[50px] group-hover:bg-erani-blue/10 transition-colors pointer-events-none rounded-full" />
                              </div>
                           ))}
                        </div>
                     </div>
                  );
               })}
               {filteredItems.length === 0 && (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
                    <Folder className="w-10 h-10 opacity-20" />
                    <p className="text-xs uppercase font-black tracking-widest">No hay elementos en esta vista</p>
                 </div>
               )}
            </div>
         ) : viewMode === 'table' ? (
            <div className="flex flex-col gap-10">
               {['audit', 'collection', 'operation', 'automation', 'session', 'task'].map((type) => {
                  const items = filteredItems.filter(i => i.unified_type === type);
                  if (items.length === 0) return null;
                  return (
                     <div key={type} className="flex flex-col gap-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                           {getTypeIcon(type)} {getTypeLabel(type)}
                        </h2>
                        <div className="bg-background/40 backdrop-blur-md border border-glass-border rounded-3xl overflow-hidden shadow-2xl">
                           <div className="overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left border-collapse">
                                 <thead>
                                    <tr className="bg-foreground/5 border-b border-glass-border text-[9px] uppercase font-black tracking-widest text-gray-500">
                                       <th className="p-4 pl-6 font-medium">Entidad</th>
                                       <th className="p-4 font-medium">Título</th>
                                       <th className="p-4 font-medium">Colaboradores</th>
                                       <th className="p-4 font-medium">Estado</th>
                                       <th className="p-4 font-medium">Fecha</th>
                                       <th className="p-4 pr-6 text-right font-medium">Acción</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {items.map((item, idx) => (
                                       <tr key={idx} onClick={() => handleNavigate(item)} className="border-b border-glass-border/50 hover:bg-foreground/5 cursor-pointer transition-colors group">
                                          <td className="p-4 pl-6">
                                             <div className="flex items-center gap-3">
                                                {getTypeIcon(item.unified_type)}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{getTypeLabel(item.unified_type)}</span>
                                             </div>
                                          </td>
                                          <td className="p-4">
                                             <span className="text-xs font-black text-foreground uppercase group-hover:text-erani-blue transition-colors block break-words whitespace-normal">{item.title}</span>
                                             {item.color && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                   {item.color.split(',').map((tag: string, i: number) => {
                                                      const t = tag.trim();
                                                      const tagData = (workspaceTags || []).find((wt: any) => wt.id === t);
                                                      const actualTag = tagData ? tagData.color : t;
                                                      const tagName = tagData ? tagData.name : t;
                                                      const bgMap: any = { 'erani-blue': 'bg-erani-blue/20 text-erani-blue', 'erani-purple': 'bg-erani-purple/20 text-erani-purple', 'emerald': 'bg-emerald-500/20 text-emerald-500', 'amber': 'bg-amber-500/20 text-amber-500', 'coral': 'bg-erani-coral/20 text-erani-coral', 'gray': 'bg-gray-500/20 text-gray-400' };
                                                      return t ? <span key={i} className={`px-2 py-0.5 rounded-full text-[8px] font-black border border-glass-border ${bgMap[actualTag] || 'bg-foreground/10 text-foreground'}`}>{tagName}</span> : null;
                                                   })}
                                                </div>
                                             )}
                                          </td>
                                          <td className="p-4">
                                             {item.collabs && item.collabs.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                   {item.collabs.map((email: string, i: number) => (
                                                      <span key={i} className="text-[9px] font-bold text-gray-400 bg-foreground/5 px-2 py-0.5 rounded-md truncate max-w-[150px]" title={email}>{email}</span>
                                                   ))}
                                                </div>
                                             ) : (
                                                <span className="text-[9px] font-bold text-gray-600 italic">Sin invitados</span>
                                             )}
                                          </td>
                                          <td className="p-4">
                                             <span className="bg-foreground/5 border border-glass-border px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                                {item.status || 'Activo'}
                                             </span>
                                          </td>
                                          <td className="p-4">
                                             <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                                {new Date(item.date).toLocaleDateString()}
                                             </span>
                                          </td>
                                          <td className="p-4 pr-6 text-right">
                                             <ArrowRight className="w-4 h-4 inline-block text-gray-500 group-hover:text-erani-blue group-hover:translate-x-1 transition-all" />
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  );
               })}
               {filteredItems.length === 0 && (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
                    <Folder className="w-10 h-10 opacity-20" />
                    <p className="text-xs uppercase font-black tracking-widest">No hay elementos en esta vista</p>
                 </div>
               )}
            </div>
         ) : (
            <div className="bg-background/40 backdrop-blur-md border border-glass-border rounded-3xl overflow-hidden shadow-2xl p-6 h-full flex flex-col relative">
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-6">Línea de Tiempo Operativa</h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar relative px-8 flex flex-col items-center">
                    {/* Central Vertical Line */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-erani-blue via-erani-purple to-transparent rounded-full opacity-50" />
                    
                    {filteredItems.map((item, idx) => {
                        const isLeft = idx % 2 === 0;
                        return (
                          <div key={idx} className="w-full relative flex items-center justify-center mb-8 group">
                              {/* The Central Node */}
                              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-background border-4 border-erani-purple z-10 shadow-[0_0_15px_rgba(158,128,255,0.6)] group-hover:scale-125 transition-transform" />
                              
                              <div className={`w-1/2 flex ${isLeft ? 'justify-end pr-10' : 'justify-start pl-10 ml-auto'}`}>
                                 <div 
                                   onClick={() => handleNavigate(item)}
                                   className="bg-background border border-glass-border rounded-2xl p-5 hover:border-erani-purple/50 hover:shadow-[0_0_20px_rgba(158,128,255,0.15)] transition-all flex flex-col gap-3 w-full max-w-[400px] cursor-pointer relative"
                                 >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                                              {getTypeIcon(item.unified_type)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-erani-purple">{getTypeLabel(item.unified_type)}</span>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-gray-500 bg-foreground/5 px-2 py-1 rounded-full">{new Date(item.date).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight leading-snug">{item.title}</h3>
                                    {/* Connecting Line to Center Node */}
                                    <div className={`absolute top-1/2 -translate-y-1/2 w-10 h-[2px] bg-erani-purple/30 ${isLeft ? '-right-10' : '-left-10'}`} />
                                 </div>
                              </div>
                          </div>
                        );
                    })}
                    {filteredItems.length === 0 && (
                        <div className="text-gray-500 text-xs font-black uppercase tracking-widest mt-10 z-10 bg-background px-4 py-2 rounded-full border border-glass-border">No hay elementos en la línea de tiempo</div>
                    )}
                </div>
            </div>
         )}
      </div>
    </div>
  );
}

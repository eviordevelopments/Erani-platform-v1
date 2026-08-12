import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Diamond, Search } from "lucide-react";
import Image from "next/image";
import { WIDGET_REGISTRY, WidgetDefinition, WidgetCategory } from "@/config/widgetRegistry";
import { useDashboard } from "@/context/DashboardContext";

interface WidgetLibrarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscriptionActive: boolean;
  hasProjects: boolean;
}

export default function WidgetLibrarySidebar({ isOpen, onClose, isSubscriptionActive, hasProjects }: WidgetLibrarySidebarProps) {
  const { addWidget } = useDashboard();
  const [activeCategory, setActiveCategory] = useState<WidgetCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWidgets = WIDGET_REGISTRY.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || w.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "Todos" },
    { id: "forensic", label: "Forenses" },
    { id: "charts", label: "Gráficos" },
    { id: "metrics", label: "Métricas Clave" },
    { id: "standard", label: "Estándar ERANI" },
  ];

  const handleAddWidget = (widget: WidgetDefinition) => {
    if (!hasProjects) return;
    const isLockedBeta = widget.isBeta && !isSubscriptionActive;
    if (isLockedBeta) return;
    addWidget(widget.id, widget.defaultColSpan);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 md:p-12">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/90 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[1400px] h-full max-h-[900px] bg-background border border-glass-border shadow-[0_0_100px_rgba(0,0,0,0.5)] z-50 rounded-[2rem] flex overflow-hidden glassmorphism"
          >
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-erani-purple/10 blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-erani-blue/10 blur-[120px] -z-10 pointer-events-none" />

            {/* Left Sidebar (Collections) */}
            <div className="w-64 border-r border-glass-border bg-foreground/5 flex flex-col hidden md:flex shrink-0">
              <div className="p-8 pb-4 flex flex-col gap-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-erani-purple/5 to-transparent pointer-events-none" />
                <Image src="/eanilogo.png" alt="ERANI" width={100} height={25} className="logo-adaptive relative z-10" />
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black uppercase tracking-widest text-foreground relative z-10 leading-tight">Biblioteca<br/>de Widgets</h2>
                  <span className="text-[9px] text-nav-text font-medium mt-2 relative z-10 uppercase tracking-widest">Colecciones</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 no-scrollbar">
                {categories.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setActiveCategory(c.id as any)}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all flex items-center justify-between group ${
                      activeCategory === c.id 
                        ? 'bg-erani-purple/20 text-erani-purple shadow-[0_0_15px_rgba(158,128,255,0.15)] border border-erani-purple/30' 
                        : 'bg-transparent text-nav-text hover:bg-foreground/5 hover:text-foreground border border-transparent'
                    }`}
                  >
                    <span>{c.label}</span>
                    {activeCategory === c.id && (
                      <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-erani-purple shadow-[0_0_10px_rgba(158,128,255,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-6 border-t border-glass-border">
                 <div className="bg-erani-purple/10 border border-erani-purple/30 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-erani-purple">
                       <Diamond className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">ERANI Beta</span>
                    </div>
                    <span className="text-[9px] text-nav-text leading-relaxed">
                       Los widgets marcados con diamante requieren una suscripción activa.
                    </span>
                 </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Header / Search */}
              <div className="h-20 border-b border-glass-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
                <div className="relative w-full max-w-md">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-nav-text" />
                  <input 
                    type="text" 
                    placeholder="Buscar métricas, gráficos forenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-foreground/5 border border-glass-border rounded-xl pl-12 pr-4 py-3 text-xs text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 focus:bg-foreground/10 transition-colors"
                  />
                </div>
                <button onClick={onClose} className="p-3 rounded-full hover:bg-foreground/10 transition-colors text-nav-text hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Category Scroll (Visible only on small screens) */}
              <div className="md:hidden p-4 border-b border-glass-border flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                {categories.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setActiveCategory(c.id as any)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                      activeCategory === c.id 
                        ? 'bg-erani-purple/20 text-erani-purple border border-erani-purple/30' 
                        : 'bg-foreground/5 text-nav-text border border-glass-border hover:bg-foreground/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Grid Content */}
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                {filteredWidgets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                       <Search className="w-8 h-8 text-nav-text opacity-50" />
                    </div>
                    <span className="text-nav-text text-xs uppercase tracking-widest font-black">No se encontraron widgets</span>
                  </div>
                ) : (
                  <motion.div 
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    <AnimatePresence>
                      {filteredWidgets.map((widget) => {
                        const isLockedBeta = widget.isBeta && !isSubscriptionActive;
                        const isLockedNoProject = !hasProjects;
                        const isLocked = isLockedBeta || isLockedNoProject;

                        return (
                          <motion.div 
                            key={widget.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={!isLocked ? { y: -5 } : {}}
                            className={`relative rounded-2xl border flex flex-col ${widget.isBeta ? 'border-erani-purple/30 bg-gradient-to-br from-erani-purple/5 to-transparent' : 'border-glass-border bg-foreground/5'} overflow-hidden group h-72`}
                          >
                            {/* Widget Header Info */}
                            <div className="p-5 flex items-start justify-between border-b border-white/5 bg-background/50 backdrop-blur-sm z-10 shrink-0 rounded-t-2xl">
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex items-center justify-between w-full">
                                  <h3 className="text-xs font-black text-foreground truncate pr-2">{widget.name}</h3>
                                  {widget.isBeta && (
                                    <div className="flex items-center justify-center p-1.5 rounded-full bg-erani-purple/20 text-erani-purple shrink-0">
                                      <Diamond className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-[9px] text-nav-text line-clamp-2 leading-relaxed">{widget.description}</p>
                              </div>
                            </div>

                            {/* Mock Visualization Area */}
                            <div className="flex-1 bg-background/30 flex items-center justify-center relative p-4 overflow-hidden rounded-b-2xl">
                              <div className="w-full h-full transform scale-90 rounded-2xl overflow-hidden flex items-center justify-center">
                                {widget.mockComponent}
                              </div>
                              
                              {/* Hover Overlay */}
                              {!isLocked && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                                   <button 
                                     onClick={() => handleAddWidget(widget)}
                                     className="button-premium px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center gap-2 shadow-xl shadow-erani-purple/20 transform translate-y-4 group-hover:translate-y-0 transition-transform"
                                   >
                                     <Plus className="w-4 h-4" /> Añadir
                                   </button>
                                </div>
                              )}
                              
                              {/* Locked Overlay (Beta) */}
                              {isLockedBeta && (
                                <div className="absolute inset-0 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                                  <div className="p-3 bg-erani-purple/10 rounded-full border border-erani-purple/30">
                                     <Diamond className="w-6 h-6 text-erani-purple animate-pulse" />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-erani-purple">ERANI Beta</span>
                                     <span className="text-[8px] text-nav-text leading-relaxed">Suscripción activa requerida.</span>
                                  </div>
                                </div>
                              )}

                              {/* Locked Overlay (No Project) */}
                              {!isLockedBeta && isLockedNoProject && (
                                <div className="absolute inset-0 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                                  <div className="p-3 bg-foreground/5 rounded-full border border-glass-border">
                                     <Plus className="w-6 h-6 text-nav-text opacity-50" />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-nav-text">Proyecto Requerido</span>
                                     <span className="text-[8px] text-nav-text opacity-60 leading-relaxed">Sube evidencia para usar este widget.</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

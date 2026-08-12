import React, { useState, useRef, useEffect } from "react";
import { Reorder } from "framer-motion";
import { MoreVertical, Maximize2, Minimize2, Trash2, Link, Folder, Check, X } from "lucide-react";
import { useDashboard, WidgetConfig } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface WidgetContainerProps {
  config: WidgetConfig;
  children: React.ReactNode;
}

export default function WidgetContainer({ config, children }: WidgetContainerProps) {
  const { removeWidget, updateWidgetConfig } = useDashboard();
  const { profile } = useAuth();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLinkingProject, setIsLinkingProject] = useState(false);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isWide = config.colSpan === 2;

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemove = () => {
    removeWidget(config.id);
  };

  const handleToggleSize = () => {
    updateWidgetConfig(config.id, { colSpan: isWide ? 1 : 2 });
    setMenuOpen(false);
  };

  const handleOpenLinker = async () => {
    setMenuOpen(false);
    setIsLinkingProject(true);
    if (profile?.organization_id) {
      setIsLoadingProjects(true);
      const { data } = await supabase
        .from('audits')
        .select('id, metadata')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setProjects(data.map((d: any) => ({
          id: d.id,
          name: d.metadata?.name || 'Proyecto sin nombre'
        })));
      }
      setIsLoadingProjects(false);
    }
  };

  const handleLinkProject = (projectId: string) => {
    updateWidgetConfig(config.id, { projectId });
    setIsLinkingProject(false);
  };

  return (
    <Reorder.Item 
      value={config}
      dragListener={!isLinkingProject}
      className={`col-span-1 ${isWide ? 'md:col-span-2' : ''} glassmorphism p-6 cursor-grab active:cursor-grabbing hover:border-erani-blue/20 transition-all relative group h-full flex flex-col`}
    >
      {/* Drag Handle UI */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-40 transition-opacity">
         <div className="grid grid-cols-2 gap-0.5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="w-1 h-1 rounded-full bg-foreground/40" />)}
         </div>
      </div>

      {/* 3-Dot Menu */}
      <div className="absolute top-4 right-4 z-20" ref={menuRef}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded-full hover:bg-foreground/10 text-nav-text transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-glass-border bg-background shadow-xl overflow-hidden glassmorphism z-30 animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="flex flex-col py-1">
              <button 
                onClick={handleToggleSize}
                className="w-full text-left px-4 py-2 text-xs font-medium text-foreground hover:bg-foreground/10 flex items-center gap-2"
              >
                {isWide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {isWide ? "Contraer" : "Expandir"}
              </button>
              <button 
                onClick={handleOpenLinker}
                className="w-full text-left px-4 py-2 text-xs font-medium text-foreground hover:bg-foreground/10 flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                Vincular Proyecto
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                onClick={handleRemove}
                className="w-full text-left px-4 py-2 text-xs font-medium text-erani-coral hover:bg-erani-coral/10 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Widget
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Linker Overlay */}
      {isLinkingProject && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-40 rounded-[2.5rem] p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-widest text-erani-blue flex items-center gap-2">
              <Folder className="w-4 h-4" /> Vincular Proyecto
            </h4>
            <button 
              onClick={() => setIsLinkingProject(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {isLoadingProjects ? (
              <div className="text-xs text-gray-500 text-center mt-4">Cargando proyectos...</div>
            ) : projects.length === 0 ? (
              <div className="text-xs text-gray-500 text-center mt-4">No hay proyectos almacenados.</div>
            ) : (
              projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleLinkProject(p.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-colors ${
                    config.projectId === p.id 
                      ? 'bg-erani-blue/10 border-erani-blue text-erani-blue' 
                      : 'bg-foreground/5 border-glass-border hover:bg-foreground/10 text-foreground'
                  }`}
                >
                  <span className="text-xs font-bold truncate pr-4">{p.name}</span>
                  {config.projectId === p.id && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))
            )}
          </div>
          {config.projectId && (
            <button 
              onClick={() => handleLinkProject('')} // Clear selection
              className="mt-2 text-[10px] text-gray-500 hover:text-erani-coral uppercase font-bold tracking-widest transition-colors text-center w-full"
            >
              Desvincular Proyecto Actual
            </button>
          )}
        </div>
      )}

      {/* Content Rendering */}
      <div className={`flex-1 mt-4 pointer-events-auto cursor-auto ${isLinkingProject ? 'opacity-0' : 'opacity-100 transition-opacity'}`}>
        {children}
      </div>
    </Reorder.Item>
  );
}

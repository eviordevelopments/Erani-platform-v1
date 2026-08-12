"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, FolderKanban, ChevronDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const AVAILABLE_NODES = [
  { id: "drive", name: "Google Drive", icon: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" },
  { id: "sheets", name: "Google Sheets", icon: "https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" },
  { id: "docs", name: "Google Docs", icon: "https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg" },
  { id: "forms", name: "Google Forms", icon: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Google_Forms_2020_Logo.svg" },
  { id: "meet", name: "Google Meet", icon: "https://upload.wikimedia.org/wikipedia/commons/8/86/Google_Meet_icon_%282020%29.svg" },
  { id: "chatgpt", name: "ChatGPT", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
  { id: "gemini", name: "Gemini", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" },
  { id: "claude", name: "Claude", icon: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" }
];

const CustomSelect = ({ value, onChange, options, placeholder, isOpen, toggleOpen, label }: any) => {
  const selectedOption = options.find((o: any) => o.value === value);
  return (
    <div className="flex flex-col gap-2 relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1">{label}</label>
      <div 
        onClick={toggleOpen}
        className="w-full bg-foreground/5 border border-glass-border rounded-xl p-4 text-sm cursor-pointer flex justify-between items-center text-foreground hover:bg-foreground/10 transition-colors"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 w-full mt-2 bg-background border border-glass-border rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar"
          >
            <div onClick={() => { onChange(""); toggleOpen(); }} className="px-4 py-3 text-sm cursor-pointer hover:bg-foreground/5 transition-colors text-muted-foreground border-b border-glass-border/50">
              {placeholder}
            </div>
            {options.map((opt: any) => (
              <div key={opt.value} onClick={() => { onChange(opt.value); toggleOpen(); }} className="px-4 py-3 text-sm cursor-pointer hover:bg-foreground/5 transition-colors text-foreground truncate">
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CustomFlowSidebar({
  isOpen,
  onClose,
  automations,
}: {
  isOpen: boolean;
  onClose: () => void;
  automations: any[];
}) {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"automation" | "project" | null>(null);

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [otherNodes, setOtherNodes] = useState("");

  const [formData, setFormData] = useState({
    automationId: "",
    projectId: "",
    operationDetails: "",
    description: ""
  });

  // Fetch user projects (audits)
  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', session.user.id)
            .single();

          if (profile?.organization_id) {
            const { data: audits, error } = await supabase
              .from('audits')
              .select('id, metadata')
              .eq('organization_id', profile.organization_id)
              .order('created_at', { ascending: false });
              
            if (error) {
               console.error("Supabase Error:", error);
            }
              
            if (audits) {
              setUserProjects(audits);
            }
          }
        } catch (error) {
          console.error("Error fetching projects:", error);
        } finally {
          setIsLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [isOpen]);

  const toggleNode = (nodeId: string) => {
    setSelectedNodes(prev => 
      prev.includes(nodeId) ? prev.filter(n => n !== nodeId) : [...prev, nodeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const selectedAuto = automations.find(a => a.id === formData.automationId);
    const selectedProject = userProjects.find(p => p.id === formData.projectId);
    
    // Obtenemos los nombres reales de los nodos seleccionados para mandarlos
    const nodesNames = selectedNodes.map(id => AVAILABLE_NODES.find(n => n.id === id)?.name || id);
    if (otherNodes.trim() !== "") nodesNames.push(otherNodes);

    try {
      const res = await fetch("/api/automations/notify-custom-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: profile?.full_name || profile?.email || "Usuario ERANI",
          userEmail: profile?.email || "",
          projectId: formData.projectId || null,
          projectName: selectedProject ? (selectedProject.metadata?.name || selectedProject.title || "Proyecto Sin Nombre") : "Sin proyecto vinculado",
          automationId: formData.automationId || null,
          automationName: selectedAuto ? selectedAuto.name : "Flujo Personalizado Nuevo",
          operationDetails: formData.operationDetails,
          description: formData.description,
          nodes: nodesNames
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFormData({ automationId: "", projectId: "", operationDetails: "", description: "" });
          setSelectedNodes([]);
          setOtherNodes("");
          onClose();
        }, 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectOptions = userProjects.map(p => ({ 
    value: p.id, 
    label: p.metadata?.name || p.title || 'Proyecto Sin Nombre' 
  }));
  const automationOptions = automations.map(a => ({ value: a.id, label: a.name }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l border-glass-border shadow-2xl z-[70] p-8 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-glass-border">
              <div>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-erani-purple flex items-center gap-2">
                  <FolderKanban className="w-4 h-4" /> Ingeniería Forense
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mt-1">Flujo Personalizado</h2>
                <p className="text-xs text-nav-text mt-2">
                  Conecta una automatización o diseña un flujo nuevo anclado a tus proyectos activos.
                </p>
              </div>
              <button onClick={onClose} className="p-3 bg-foreground/5 rounded-xl hover:bg-foreground/10 text-nav-text hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <Send className="w-10 h-10 text-emerald-500 ml-1" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Solicitud Registrada</h3>
                <p className="text-sm text-nav-text max-w-md leading-relaxed">
                  El equipo de ingeniería ha sido notificado. Te hemos enviado un correo de confirmación con el enlace para agendar la sesión de valoración con tu Project Manager.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <CustomSelect 
                    label="Automatización (Opcional)"
                    value={formData.automationId}
                    onChange={(val: string) => setFormData({...formData, automationId: val})}
                    options={automationOptions}
                    placeholder="-- Diseñar Flujo Nuevo --"
                    isOpen={openDropdown === "automation"}
                    toggleOpen={() => setOpenDropdown(openDropdown === "automation" ? null : "automation")}
                  />

                  <div className="relative">
                    <CustomSelect 
                      label="Proyecto Vinculado"
                      value={formData.projectId}
                      onChange={(val: string) => setFormData({...formData, projectId: val})}
                      options={projectOptions}
                      placeholder={isLoadingProjects ? "Cargando proyectos..." : "-- Selecciona tu Proyecto --"}
                      isOpen={openDropdown === "project"}
                      toggleOpen={() => setOpenDropdown(openDropdown === "project" ? null : "project")}
                    />
                    {isLoadingProjects && <Loader2 className="absolute right-4 top-10 w-4 h-4 animate-spin text-nav-text" />}
                  </div>

                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1">Tipo de Operación o Fuga a Mitigar</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. Conciliación bancaria mensual, extracción de datos de facturas PDF..."
                    value={formData.operationDetails}
                    onChange={e => setFormData({...formData, operationDetails: e.target.value})}
                    className="w-full bg-foreground/5 border border-glass-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-erani-purple transition-colors"
                  />
                </div>

                {/* NODES UI SECTION */}
                <div className="flex flex-col gap-3 mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1">Nodos y Herramientas a Integrar</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AVAILABLE_NODES.map(node => {
                      const isSelected = selectedNodes.includes(node.id);
                      return (
                        <div 
                          key={node.id}
                          onClick={() => toggleNode(node.id)}
                          className={`relative cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 overflow-hidden ${
                            isSelected 
                              ? "bg-erani-purple/10 border-erani-purple shadow-[0_0_15px_rgba(158,128,255,0.2)]" 
                              : "bg-foreground/5 border-glass-border hover:bg-foreground/10 hover:border-foreground/20"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-erani-purple rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <img src={node.icon} alt={node.name} className="w-8 h-8 object-contain mb-2" />
                          <span className={`text-[10px] font-bold text-center ${isSelected ? "text-erani-purple" : "text-nav-text"}`}>
                            {node.name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <input 
                    type="text" 
                    placeholder="¿Alguna otra? (Ej. Salesforce, Jira, SAP...)"
                    value={otherNodes}
                    onChange={e => setOtherNodes(e.target.value)}
                    className="w-full bg-foreground/5 border border-glass-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-erani-purple transition-colors mt-2"
                  />
                </div>

                <div className="flex flex-col gap-2 flex-1 mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1">Descripción y Requerimientos Específicos</label>
                  <textarea 
                    required
                    placeholder="Describe cómo visualizas el flujo de la automatización..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full flex-1 min-h-[140px] bg-foreground/5 border border-glass-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-erani-purple transition-colors resize-none leading-relaxed custom-scrollbar"
                  />
                </div>

                <div className="mt-auto pt-6 border-t border-glass-border">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 rounded-2xl text-[11px] uppercase font-black tracking-widest flex items-center justify-center gap-3 bg-gradient-to-r from-erani-blue to-erani-purple text-white shadow-[0_0_20px_rgba(158,128,255,0.4)] hover:shadow-[0_0_30px_rgba(158,128,255,0.6)] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Enviar Solicitud a Ingeniería <Send className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

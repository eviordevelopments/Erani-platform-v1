"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Loader2,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Briefcase,
  FileText,
  Check,
  X,
  Clock,
  Users,
  Target,
  Tag,
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  ChevronDown,
  Video
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  icon?: string;
  color_tag?: string;
  linked_projects?: string[];
  linked_tasks?: string[];
  linked_sessions?: string[];
  collaborators?: string[];
}

const COLOR_TAGS = [
  { id: 'erani-blue', label: 'Azul', bg: 'bg-erani-blue', border: 'border-erani-blue/30', text: 'text-erani-blue', bgSoft: 'bg-erani-blue/10' },
  { id: 'erani-purple', label: 'Morado', bg: 'bg-erani-purple', border: 'border-erani-purple/30', text: 'text-erani-purple', bgSoft: 'bg-erani-purple/10' },
  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-500', bgSoft: 'bg-emerald-500/10' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-500', bgSoft: 'bg-amber-500/10' },
  { id: 'coral', label: 'Coral', bg: 'bg-erani-coral', border: 'border-erani-coral/30', text: 'text-erani-coral', bgSoft: 'bg-erani-coral/10' },
  { id: 'gray', label: 'Gris', bg: 'bg-gray-500', border: 'border-gray-500/30', text: 'text-gray-500', bgSoft: 'bg-gray-500/10' }
];

const ICONS = [
  { id: 'FolderOpen', icon: FolderOpen },
  { id: 'ShieldCheck', icon: ShieldCheck },
  { id: 'Layers', icon: Layers },
  { id: 'Briefcase', icon: Briefcase },
  { id: 'FileText', icon: FileText }
];

export default function CollectionsDashboardPage() {
  const { isSidebarCollapsed } = useDashboard();
  const { profile } = useAuth();
  const router = useRouter();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectingIconFor, setSelectingIconFor] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Create Form State
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("FolderOpen");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [isCollaboratorsDropdownOpen, setIsCollaboratorsDropdownOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isTasksDropdownOpen, setIsTasksDropdownOpen] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isSessionsDropdownOpen, setIsSessionsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [workspaceTags, setWorkspaceTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("erani-blue");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dbSessions, setDbSessions] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchCollections();
      fetchOrgMembers();
      fetchProjects();
      fetchTasksAndSessions();
      fetchWorkspaceTags();
      fetchGoogleEvents();
    }
  }, [profile]);

  const fetchGoogleEvents = async () => {
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkspaceTags = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_tags')
        .select('*')
        .eq('organization_id', profile?.organization_id);
      if (!error && data) setWorkspaceTags(data);
    } catch (e) {}
  };

  const fetchOrgMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select(`id, profile_id, email, role, profiles:profile_id (full_name, avatar_url)`)
        .eq('organization_id', profile?.organization_id);
      if (!error && data) setOrgMembers(data);
    } catch (e) {}
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('id, metadata')
        .eq('organization_id', profile?.organization_id);
      if (!error && data) setProjects(data);
    } catch (e) {}
  };

  const fetchTasksAndSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, google_event_id, scheduled_at, status')
        .eq('organization_id', profile?.organization_id);
      if (!error && data) {
         setTasks(data.filter(d => d.status === 'todo' || !d.scheduled_at));
         setDbSessions(data.filter(d => d.status !== 'todo' && !!d.scheduled_at));
      } else {
         console.error("fetchTasksAndSessions error", error);
      }
    } catch (e) {}
  };

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error("Error fetching collections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = (collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectionToDelete(collectionId);
    setOpenMenuFor(null);
  };

  const confirmDelete = async () => {
    if (!collectionToDelete) return;
    try {
      const { error } = await supabase.from('collections').delete().eq('id', collectionToDelete);
      if (error) throw error;
      setCollections(prev => prev.filter(c => c.id !== collectionToDelete));
      setToastMessage({ type: 'success', text: "Colección eliminada." });
    } catch (err) {
      console.error(err);
      setToastMessage({ type: 'error', text: "No se pudo eliminar la colección." });
    } finally {
      setCollectionToDelete(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDuplicateCollection = async (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          organization_id: profile?.organization_id,
          name: `${collection.name} (Copia)`,
          description: collection.description,
          icon: collection.icon,
          color_tag: collection.color_tag,
          collaborators: (collection as any).collaborators || [],
          linked_projects: (collection as any).linked_projects || [],
          linked_tasks: (collection as any).linked_tasks || [],
          linked_sessions: (collection as any).linked_sessions || [],
          created_by: profile?.id
        })
        .select()
        .single();
        
      if (error) throw error;
      setCollections(prev => [data, ...prev]);
      setToastMessage({ type: 'success', text: "Colección duplicada con éxito." });
    } catch (err) {
      console.error(err);
      setToastMessage({ type: 'error', text: "No se pudo duplicar la colección." });
    } finally {
      setOpenMenuFor(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleEditClick = (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingColId(col.id);
    setNewColName(col.name);
    setNewColDesc(col.description || "");
    setSelectedIcon(col.icon || "FolderOpen");
    setSelectedTags(col.color_tag ? col.color_tag.split(',') : []);
    setSelectedProjects(col.linked_projects || []);
    setSelectedTasks(col.linked_tasks || []);
    setSelectedSessions(col.linked_sessions || []);
    setSelectedCollaborators(col.collaborators || []);
    setIsCreateModalOpen(true);
    setOpenMenuFor(null);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !profile?.organization_id) return;

    try {
      setIsCreating(true);
      if (editingColId) {
        const { data, error } = await supabase
          .from('collections')
          .update({
            name: newColName.trim(),
            description: newColDesc.trim() || null,
            icon: selectedIcon,
            color_tag: selectedTags.join(','),
            collaborators: selectedCollaborators,
            linked_projects: selectedProjects,
            linked_tasks: selectedTasks,
            linked_sessions: selectedSessions
          })
          .eq('id', editingColId)
          .select()
          .single();

        if (error) throw error;
        setCollections(prev => prev.map(c => c.id === editingColId ? data : c));
        
        setIsCreateModalOpen(false);
        setEditingColId(null);
        setNewColName("");
        setNewColDesc("");
        setSelectedIcon("FolderOpen");
        setSelectedTags([]);
        setSelectedCollaborators([]);
        setSelectedProjects([]);
        setSelectedTasks([]);
        setSelectedSessions([]);
      } else {
        const { data, error } = await supabase
          .from('collections')
          .insert({
            organization_id: profile.organization_id,
            name: newColName.trim(),
            description: newColDesc.trim() || null,
            icon: selectedIcon,
            color_tag: selectedTags.join(','),
            collaborators: selectedCollaborators,
            linked_projects: selectedProjects,
            linked_tasks: selectedTasks,
            linked_sessions: selectedSessions
          })
          .select()
          .single();

        if (error) throw error;

        // Close modal and navigate directly to the new Data Room
        setIsCreateModalOpen(false);
        setNewColName("");
        setNewColDesc("");
        setSelectedIcon("FolderOpen");
        setSelectedTags([]);
        setSelectedCollaborators([]);
        setSelectedProjects([]);
        setSelectedTasks([]);
        setSelectedSessions([]);
        router.push(`/collections/${data.id}`);
      }
    } catch (err: any) {
      console.error("Error creating/updating collection:", err);
      setToastMessage({ type: 'error', text: err?.message || "Error al guardar la colección." });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateIcon = async (collectionId: string, iconName: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ icon: iconName })
        .eq('id', collectionId);
      if (error) throw error;
      setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, icon: iconName } : c));
    } catch (e) {
      console.error("Error updating collection icon:", e);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !profile?.organization_id) return;
    try {
      setIsCreatingTag(true);
      const { data, error } = await supabase
        .from('workspace_tags')
        .insert({
          organization_id: profile.organization_id,
          name: newTagName.trim(),
          color: newTagColor
        })
        .select()
        .single();
      if (error) throw error;
      setWorkspaceTags(prev => [...prev, data]);
      setNewTagName("");
      setNewTagColor("erani-blue");
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-500 overflow-y-auto p-4 md:p-8 pl-8 md:pl-16 ${isSidebarCollapsed ? "ml-20" : "ml-64"} relative overflow-x-hidden`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-erani-blue/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-erani-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="w-full h-full flex flex-col gap-10">
          
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-black tracking-[0.2em] text-nav-text">
                         Diagnóstico Forense de Infraestructura
                      </span>
                   </div>
                   <h1 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                      <FolderOpen className="w-8 h-8 text-erani-blue" />
                      Colecciones & <span className="text-gradient-brand">Data Rooms</span>
                   </h1>
                </div>

                <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto relative z-50">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Buscar colecciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-foreground/5 border border-glass-border rounded-full pl-12 pr-6 py-3 text-[11px] font-bold w-48 lg:w-64 focus:outline-none focus:border-erani-blue/50 transition-all placeholder:text-gray-600 text-foreground"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-8 py-3 rounded-xl text-[12px] font-medium tracking-widest transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-[#1E50BA] to-[#7404FF] text-white shadow-xl shadow-[#7404FF]/20 hover:shadow-2xl hover:shadow-[#7404FF]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shrink-0"
                  >
                    <Plus className="w-5 h-5 stroke-[1.5]" />
                    <span>NUEVA COLECCIÓN</span>
                  </button>
                </div>
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-gray-500 leading-relaxed">
               Espacio de gobernanza y multi-colaboración corporativa. Agrupa proyectos y auditorías para mantener un control forense exacto e interactúa con el Agente de IA para cruzar la información.
            </p>
          </div>

          {/* Collections Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="w-10 h-10 border-2 border-erani-blue/20 border-t-erani-blue rounded-full animate-spin" />
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 animate-pulse">Sincronizando Colecciones...</p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 px-10 rounded-3xl bg-black/20 border border-dashed border-gray-800 text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <Layers className="w-10 h-10 text-gray-600" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black uppercase tracking-wider text-white">Sin Colecciones</h3>
                <p className="text-sm text-gray-500 max-w-sm">Crea tu primera Colección para comenzar a agrupar tus proyectos y auditorías de manera organizada.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-8 py-3 rounded-xl bg-erani-blue/10 border border-erani-blue/30 text-erani-blue text-[10px] uppercase font-black tracking-widest hover:bg-erani-blue/20 transition-all"
              >
                Crear Colección
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredCollections.map((col, i) => {
                  const tagIds = col.color_tag ? col.color_tag.split(',') : [];
                  const colTags = workspaceTags.filter(t => tagIds.includes(t.id));
                  const IconComp = ICONS.find(ic => ic.id === col.icon)?.icon || FolderOpen;

                  // Primary color def is the first tag's color, or default blue
                  const primaryTag = colTags.length > 0 ? colTags[0] : null;
                  const colorDef = primaryTag ? (COLOR_TAGS.find(c => c.id === primaryTag.color) || COLOR_TAGS[0]) : null;

                  // Get global tags from linked projects/audits
                  const linkedProjs = projects.filter(p => col.linked_projects?.includes(p.id));
                  const collectionTags: any[] = [];
                  linkedProjs.forEach(p => {
                    if (p.metadata?.tags && Array.isArray(p.metadata.tags)) {
                      p.metadata.tags.forEach((t: any) => {
                        if (!collectionTags.find(ct => ct.label === t.label)) {
                          collectionTags.push(t);
                        }
                      });
                    }
                  });

                  return (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => router.push(`/collections/${col.id}`)}
                    className={`premium-border-container group cursor-pointer h-full min-h-[300px] relative ${selectingIconFor === col.id || openMenuFor === col.id ? 'z-50' : 'z-10'}`}
                  >
                    <div className={`premium-border-inner p-8 !flex !flex-col !items-stretch !justify-start h-full w-full relative z-10 gap-6 ${selectingIconFor === col.id || openMenuFor === col.id ? 'overflow-visible' : 'overflow-hidden'}`}>
                      <div className={`flex items-start justify-between relative w-full ${selectingIconFor === col.id || openMenuFor === col.id ? 'z-30' : 'z-10'}`}>
                        <div 
                          className="relative z-30"
                          onMouseEnter={() => setSelectingIconFor(col.id)}
                          onMouseLeave={() => setSelectingIconFor(null)}
                        >
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectingIconFor(selectingIconFor === col.id ? null : col.id);
                            }}
                            className={`p-3 rounded-2xl transition-colors cursor-pointer ${colorDef ? `${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}` : 'bg-erani-blue/10 border border-erani-blue/20 text-erani-blue'}`}
                          >
                            <IconComp className="w-6 h-6" />
                          </button>
                          
                          <AnimatePresence>
                            {selectingIconFor === col.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-14 left-0 z-50 glassmorphism p-3 rounded-2xl border border-glass-border shadow-2xl grid grid-cols-5 gap-2 w-52 bg-background/90 backdrop-blur-xl"
                              >
                                {ICONS.map(ic => {
                                  const OptionIcon = ic.icon;
                                  return (
                                    <button
                                      key={ic.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateIcon(col.id, ic.id);
                                        setSelectingIconFor(null);
                                      }}
                                      className={`p-2 rounded-xl hover:bg-foreground/10 text-foreground transition-all flex items-center justify-center ${col.icon === ic.id ? 'bg-erani-blue/20 text-erani-blue' : ''}`}
                                    >
                                      <OptionIcon className="w-5 h-5" />
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          {colTags.length > 0 ? colTags.map((tagInfo, idx) => {
                            const tColor = COLOR_TAGS.find(c => c.id === tagInfo.color) || COLOR_TAGS[0];
                            return (
                              <span key={idx} className={`text-[10px] font-black uppercase tracking-widest ${tColor.bgSoft} border ${tColor.border} ${tColor.text} px-3 py-1 rounded-full`}>
                                {tagInfo.name}
                              </span>
                            );
                          }) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-erani-purple bg-erani-purple/10 border border-erani-purple/20 px-3 py-1 rounded-full">
                              Colección
                            </span>
                          )}
                          <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue bg-erani-blue/10 border border-erani-blue/20 px-3 py-1 rounded-full mr-2">
                            {col.linked_projects ? `${col.linked_projects.length} Proyectos` : "0 Proyectos"}
                          </span>
                          
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuFor(openMenuFor === col.id ? null : col.id);
                              }}
                              className="p-1.5 rounded-full hover:bg-foreground/10 text-gray-500 hover:text-foreground transition-colors"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                              {openMenuFor === col.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute top-10 right-0 z-50 min-w-[160px] bg-background border border-glass-border rounded-xl shadow-2xl py-2 flex flex-col"
                                >
                                  <button onClick={(e) => handleEditClick(col, e)} className="flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-foreground/5 text-foreground transition-colors text-left w-full">
                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                    Editar
                                  </button>
                                  <button onClick={(e) => handleDuplicateCollection(col, e)} className="flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-foreground/5 text-foreground transition-colors text-left w-full">
                                    <Copy className="w-4 h-4 text-erani-blue" />
                                    Duplicar
                                  </button>
                                  <div className="h-px bg-glass-border my-1 w-full" />
                                  <button onClick={(e) => handleDeleteCollection(col.id, e)} className="flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 text-red-500 transition-colors text-left w-full">
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 relative z-10 flex-1">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-wider text-foreground line-clamp-2 leading-tight group-hover:text-erani-blue transition-colors">
                          {col.name}
                        </h3>
                        {col.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {col.description}
                          </p>
                        )}
                      </div>

                      {/* Display global tags from linked projects */}
                      {collectionTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 relative z-10 pb-2">
                          {collectionTags.map((t, idx) => (
                            <span key={idx} className={`text-[9px] px-2 py-1 rounded border font-bold uppercase tracking-wider bg-${t.color || 'gray'}/10 text-${t.color || 'gray'} border-${t.color || 'gray'}/30`}>
                              {t.label || t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-glass-border relative z-10 w-full mt-auto">
                         <div className="flex items-center gap-2 text-[9px] uppercase font-bold text-gray-500 tracking-widest">
                           <Calendar className="w-3 h-3" />
                           {new Date(col.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </div>
                         
                         <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-erani-blue group-hover:text-white transition-all text-gray-500">
                           <ArrowRight className="w-4 h-4" />
                         </div>
                      </div>

                      {/* Decorative Gradient */}
                      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${colorDef ? `from-${colorDef.id}` : 'from-erani-blue'}/5 to-transparent rounded-bl-full pointer-events-none`} />
                    </div>
                  </motion.div>
                )})}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Create Slide-over */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none w-full justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-transparent pointer-events-auto"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-background border-l border-glass-border shadow-2xl flex flex-col p-8 overflow-y-auto pointer-events-auto h-full"
            >
               <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-foreground transition-colors bg-foreground/5 rounded-full z-10">
                  <X className="w-5 h-5" />
               </button>

              {(() => {
                const primaryTagId = selectedTags.length > 0 ? selectedTags[0] : null;
                const primaryTagInfo = workspaceTags.find(t => t.id === primaryTagId);
                const activeColorId = primaryTagInfo?.color || 'erani-blue';
                const activeColorToken = activeColorId === 'emerald' ? 'emerald-500' : activeColorId === 'amber' ? 'amber-500' : activeColorId === 'coral' ? 'erani-coral' : activeColorId === 'gray' ? 'gray-500' : activeColorId;

                return (
                  <>
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl bg-erani-blue/10 text-erani-blue`}>
                  {(() => {
                    const ModalIconComp = ICONS.find(ic => ic.id === selectedIcon)?.icon || Layers;
                    return <ModalIconComp className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-foreground">Nueva Colección</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Crear Espacio de Trabajo Unificado</p>
                </div>
              </div>

              <form onSubmit={handleCreateCollection} className="flex flex-col flex-1 overflow-hidden">
                 <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* Basic Fields */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Nombre de la Colección</label>
                  <input 
                    type="text" 
                    required
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="Ej. Auditorías Q3 2026 - Planta Norte"
                    className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm focus:border-erani-blue focus:outline-none transition-all text-foreground placeholder:text-gray-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Descripción Estratégica</label>
                  <textarea 
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    placeholder="Describe el propósito o el conjunto de proyectos que vivirán aquí..."
                    rows={2}
                    className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm focus:border-erani-blue focus:outline-none transition-all text-foreground placeholder:text-gray-500 resize-none"
                  />
                </div>

                {/* Icons & Colors */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Icono Distintivo</label>
                     <div className="flex flex-wrap gap-2">
                       {ICONS.map(i => {
                          const IconComponent = i.icon;
                          const isSelected = selectedIcon === i.id;
                          return (
                             <button key={i.id} type="button" onClick={() => setSelectedIcon(i.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isSelected ? `border-${activeColorToken} bg-${activeColorToken}/10 text-${activeColorToken}` : 'border-glass-border bg-foreground/5 text-muted-foreground hover:bg-foreground/10'}`}>
                                <IconComponent className="w-5 h-5" />
                             </button>
                          );
                       })}
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" /> Etiquetas</label>
                        <button type="button" onClick={() => setIsCreatingTag(!isCreatingTag)} className="text-[10px] uppercase font-bold text-erani-blue hover:underline">
                           {isCreatingTag ? "Cancelar" : "+ Nueva Etiqueta"}
                        </button>
                     </div>
                     
                     {isCreatingTag ? (
                        <div className="flex flex-col gap-2 p-3 bg-foreground/5 border border-glass-border rounded-xl">
                           <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Nombre de etiqueta..." className="w-full bg-background border border-glass-border rounded-lg py-1.5 px-3 text-xs focus:border-erani-blue focus:outline-none text-foreground" />
                           <div className="flex flex-wrap gap-2 mt-1">
                              {COLOR_TAGS.map(t => (
                                 <button key={t.id} type="button" onClick={() => setNewTagColor(t.id)} className={`w-5 h-5 rounded-full ${t.bg} border-2 ${newTagColor === t.id ? 'border-foreground shadow-sm scale-110' : 'border-transparent opacity-50'} transition-all`} title={t.label} />
                              ))}
                           </div>
                           <button type="button" onClick={handleCreateTag} disabled={!newTagName.trim()} className="mt-2 w-full py-1.5 rounded-lg bg-erani-blue text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Guardar Etiqueta</button>
                        </div>
                     ) : (
                        <div className="relative" onMouseLeave={() => setIsTagsDropdownOpen(false)}>
                           <div 
                              onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                              className="w-full bg-background border border-glass-border rounded-xl py-3 px-4 text-sm flex items-center justify-between cursor-pointer text-muted-foreground"
                           >
                              {selectedTags.length > 0 ? (
                                 <div className="flex gap-2 flex-wrap">
                                    {selectedTags.map(tagId => {
                                       const tag = workspaceTags.find(t => t.id === tagId);
                                       if (!tag) return null;
                                       const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                                       return (
                                          <span key={tagId} className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest transition-all ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>
                                             {tag.name}
                                          </span>
                                       );
                                    })}
                                 </div>
                              ) : "Seleccionar o crear etiquetas..."}
                              <ChevronDown className="w-4 h-4" />
                           </div>
                           
                           <AnimatePresence>
                              {isTagsDropdownOpen && (
                                 <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full mt-2 left-0 w-full z-50 bg-background border border-glass-border shadow-2xl rounded-xl p-3 max-h-48 overflow-y-auto"
                                 >
                                    <div className="flex flex-col gap-1">
                                       {workspaceTags.map(t => {
                                          const isSelected = selectedTags.includes(t.id);
                                          const colorDef = COLOR_TAGS.find(c => c.id === t.color) || COLOR_TAGS[0];
                                          return (
                                             <div 
                                                key={t.id} 
                                                onClick={() => {
                                                   setSelectedTags(prev => isSelected ? prev.filter(id => id !== t.id) : [...prev, t.id]);
                                                }}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-foreground/5 transition-colors ${isSelected ? 'bg-foreground/5' : ''}`}
                                             >
                                                <div className="flex items-center gap-2">
                                                   <span className={`w-3 h-3 rounded-full ${colorDef.bg}`} />
                                                   <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4 text-foreground" />}
                                             </div>
                                          );
                                       })}
                                       {workspaceTags.length === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-2">No hay etiquetas. Crea una nueva arriba.</span>}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     )}
                   </div>
                </div>

                {/* Linking sections */}
                <div className="space-y-4">
                   <h3 className="text-xs uppercase font-black tracking-widest text-foreground border-b border-glass-border pb-2 mt-4">Interconexiones</h3>
                   
                   {/* Collaborators */}
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Equipo & Colaboradores</label>
                     <div className="relative z-30 w-full" onMouseLeave={() => setIsCollaboratorsDropdownOpen(false)}>
                        <button 
                           type="button"
                           onClick={() => setIsCollaboratorsDropdownOpen(!isCollaboratorsDropdownOpen)}
                           className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm focus:border-erani-blue focus:outline-none transition-all text-foreground text-left flex items-center justify-between"
                        >
                           <span className={selectedCollaborators.length ? "text-foreground font-bold text-[10px] uppercase" : "text-gray-500 font-bold text-[10px] uppercase"}>
                              {selectedCollaborators.length ? `${selectedCollaborators.length} colaboradores seleccionados` : "Seleccionar colaboradores..."}
                           </span>
                           <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCollaboratorsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                           {isCollaboratorsDropdownOpen && (
                              <motion.div 
                                 initial={{ opacity: 0, y: -10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="absolute top-full mt-2 left-0 w-full z-50 bg-background border border-glass-border shadow-2xl rounded-xl p-3 max-h-48 overflow-y-auto"
                              >
                                 <div className="flex flex-col gap-1">
                                    {orgMembers.map(m => {
                                       const isSelected = selectedCollaborators.includes(m.id);
                                       return (
                                          <div 
                                             key={m.id} 
                                             onClick={() => setSelectedCollaborators(prev => isSelected ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                             className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-foreground/5' : 'hover:bg-foreground/5'}`}
                                          >
                                             <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${isSelected ? `border-${activeColorToken}` : 'border-gray-500'}`}>
                                                   {isSelected && <Check className={`w-2 h-2 text-${activeColorToken}`} />}
                                                </div>
                                                <span className="text-[10px] font-bold truncate max-w-[200px]">{m.profiles?.full_name || m.email}</span>
                                             </div>
                                          </div>
                                       );
                                    })}
                                    {orgMembers.length === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-2">No hay miembros disponibles.</span>}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                   </div>

                   {/* Projects & Audits */}
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Proyectos / Auditorías</label>
                     <div className="relative z-20 w-full" onMouseLeave={() => setIsProjectsDropdownOpen(false)}>
                        <button 
                           type="button"
                           onClick={() => setIsProjectsDropdownOpen(!isProjectsDropdownOpen)}
                           className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm focus:border-erani-blue focus:outline-none transition-all text-foreground text-left flex items-center justify-between"
                        >
                           <span className={selectedProjects.length ? "text-foreground font-bold text-[10px] uppercase" : "text-gray-500 font-bold text-[10px] uppercase"}>
                              {selectedProjects.length ? `${selectedProjects.length} proyectos seleccionados` : "Seleccionar proyectos..."}
                           </span>
                           <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProjectsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                           {isProjectsDropdownOpen && (
                              <motion.div 
                                 initial={{ opacity: 0, y: -10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="absolute top-full mt-2 left-0 w-full z-50 bg-background border border-glass-border shadow-2xl rounded-xl p-3 max-h-48 overflow-y-auto"
                              >
                                 <div className="flex flex-col gap-1">
                                    {projects.map(p => {
                                       const isSelected = selectedProjects.includes(p.id);
                                       return (
                                          <div 
                                             key={p.id} 
                                             onClick={() => setSelectedProjects(prev => isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                                             className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-foreground/5' : 'hover:bg-foreground/5'}`}
                                          >
                                             <span className="text-[10px] font-bold uppercase truncate">{p.metadata?.name || "Proyecto sin nombre"}</span>
                                             {isSelected && <Check className="w-4 h-4 text-foreground" />}
                                          </div>
                                       );
                                    })}
                                    {projects.length === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-2">No hay proyectos creados.</span>}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {/* Tasks */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> To-Dos y Tareas</label>
                        <div className="relative z-10 w-full" onMouseLeave={() => setIsTasksDropdownOpen(false)}>
                           <button 
                              type="button"
                              onClick={() => setIsTasksDropdownOpen(!isTasksDropdownOpen)}
                              className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm focus:border-erani-blue focus:outline-none transition-all text-foreground text-left flex items-center justify-between"
                           >
                              <span className={selectedTasks.length ? "text-foreground font-bold text-[10px] uppercase" : "text-gray-500 font-bold text-[10px] uppercase truncate max-w-[80%]"}>
                                 {selectedTasks.length ? `${selectedTasks.length} tareas` : "Sin tareas"}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTasksDropdownOpen ? 'rotate-180' : ''}`} />
                           </button>
                           <AnimatePresence>
                              {isTasksDropdownOpen && (
                                 <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full mt-2 left-0 w-[200%] z-50 bg-background border border-glass-border shadow-2xl rounded-xl p-3 max-h-48 overflow-y-auto"
                                 >
                                    <div className="flex flex-col gap-1">
                                       {tasks.map(t => {
                                          const isSelected = selectedTasks.includes(t.id);
                                          return (
                                             <div 
                                                key={t.id} 
                                                onClick={() => setSelectedTasks(prev => isSelected ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-foreground/5' : 'hover:bg-foreground/5'}`}
                                             >
                                                <span className="text-[10px] font-bold uppercase truncate">{t.title}</span>
                                                {isSelected && <Check className="w-4 h-4 text-foreground" />}
                                             </div>
                                          );
                                       })}
                                       {tasks.length === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-2">Sin tareas.</span>}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                      </div>

                      {/* Sessions */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Sesiones</label>
                        <div className="relative z-10 w-full" onMouseLeave={() => setIsSessionsDropdownOpen(false)}>
                           <button 
                              type="button"
                              onClick={() => setIsSessionsDropdownOpen(!isSessionsDropdownOpen)}
                              className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm focus:border-erani-blue focus:outline-none transition-all text-foreground text-left flex items-center justify-between"
                           >
                              <span className={selectedSessions.length ? "text-foreground font-bold text-[10px] uppercase" : "text-gray-500 font-bold text-[10px] uppercase truncate max-w-[80%]"}>
                                 {selectedSessions.length ? `${selectedSessions.length} sesiones` : "Sin sesiones"}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isSessionsDropdownOpen ? 'rotate-180' : ''}`} />
                           </button>
                           <AnimatePresence>
                              {isSessionsDropdownOpen && (
                                 <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full mt-2 right-0 w-[200%] z-50 bg-background border border-glass-border shadow-2xl rounded-xl p-3 max-h-48 overflow-y-auto"
                                 >
                                    <div className="flex flex-col gap-1">
                                       {dbSessions.map(s => {
                                          const isSelected = selectedSessions.includes(s.id);
                                          return (
                                             <div 
                                                key={s.id} 
                                                onClick={() => setSelectedSessions(prev => isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-foreground/5' : 'hover:bg-foreground/5'}`}
                                             >
                                                <span className="text-[10px] font-bold uppercase truncate">{s.title}</span>
                                                {isSelected && <Check className="w-4 h-4 text-foreground" />}
                                             </div>
                                          );
                                       })}
                                       {googleEvents.map(e => {
                                          const isSelected = selectedSessions.includes(e.id);
                                          return (
                                             <div 
                                                key={e.id} 
                                                onClick={() => setSelectedSessions(prev => isSelected ? prev.filter(id => id !== e.id) : [...prev, e.id])}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-foreground/5' : 'hover:bg-foreground/5'}`}
                                             >
                                                <span className="text-[10px] font-bold uppercase truncate text-erani-blue flex items-center gap-2">
                                                   <Video className="w-3 h-3" />
                                                   {e.summary || "Sesión de Google"}
                                                </span>
                                                {isSelected && <Check className="w-4 h-4 text-foreground" />}
                                             </div>
                                          );
                                       })}
                                       {dbSessions.length === 0 && googleEvents.length === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-2">Sin sesiones.</span>}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                       </div>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex gap-4 pt-4 mt-2 border-t border-glass-border">
                   <button 
                     type="button"
                     onClick={() => setIsCreateModalOpen(false)}
                     className="flex-1 py-3 px-4 rounded-xl border border-glass-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all text-[10px] uppercase font-black tracking-widest"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     disabled={isCreating || !newColName.trim()}
                     className={`flex-1 py-3 px-4 rounded-xl transition-all text-[10px] uppercase font-black tracking-widest shadow-lg flex items-center justify-center gap-2 text-white bg-${activeColorToken} hover:opacity-90 shadow-${activeColorToken}/20 disabled:opacity-50`}
                   >
                     {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Espacio Unificado"}
                   </button>
                 </div>
                 </div>
              </form>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 ${toastMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} backdrop-blur-xl`}
          >
            {toastMessage.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-widest">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {collectionToDelete && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCollectionToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-background border border-glass-border rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider text-foreground mb-2">Eliminar Colección</h3>
              <p className="text-xs text-gray-500 mb-6">¿Estás seguro de eliminar esta colección? Esta acción no se puede deshacer.</p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setCollectionToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-glass-border text-gray-500 hover:bg-foreground/5 hover:text-foreground transition-all text-[10px] uppercase font-black tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all text-[10px] uppercase font-black tracking-widest"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

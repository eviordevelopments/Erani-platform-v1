"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MoreVertical,
  Kanban,
  CalendarCheck,
  Plus,
  X,
  FileText,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Video,
  Edit2,
  Copy,
  Trash2,
  Tag,
  Loader2,
  Activity,
  List,
  Grid,
  AlignLeft
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import UnifiedWorkspace from "@/components/workspaces/UnifiedWorkspace";
import { useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/lib/supabaseClient";

type SessionStatus = "todo" | "scheduled" | "completed";

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  notes: string;
  status: SessionStatus;
  calendly_url?: string;
  ai_summary?: string;
  color_tag?: string;
  audit_id?: string;
  collection_id?: string;
  collaborators?: string[];
  responsables?: string[];
  start_date?: string;
  deadline?: string;
  google_event_id?: string;
  item_type?: string;
}

const COLUMNS: { id: SessionStatus; title: string }[] = [
  { id: "todo", title: "To-Do / Por Agendar" },
  { id: "scheduled", title: "Agendadas / En Progreso" },
  { id: "completed", title: "Finalizadas / Resumen" }
];

const COLOR_TAGS = [
  { id: 'erani-blue', label: 'Azul', bg: 'bg-erani-blue', border: 'border-erani-blue/30', text: 'text-erani-blue', bgSoft: 'bg-erani-blue/10' },
  { id: 'erani-purple', label: 'Morado', bg: 'bg-erani-purple', border: 'border-erani-purple/30', text: 'text-erani-purple', bgSoft: 'bg-erani-purple/10' },
  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-500', bgSoft: 'bg-emerald-500/10' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-500', bgSoft: 'bg-amber-500/10' },
  { id: 'coral', label: 'Coral', bg: 'bg-erani-coral', border: 'border-erani-coral/30', text: 'text-erani-coral', bgSoft: 'bg-erani-coral/10' },
  { id: 'gray', label: 'Gris', bg: 'bg-gray-500', border: 'border-gray-500/30', text: 'text-gray-500', bgSoft: 'bg-gray-500/10' }
];

// Custom Select Component for modern toggles
const CustomSelect = ({ value, onChange, options, placeholder, isOpen, toggleOpen, label }: any) => {
  const selectedOption = options.find((o: any) => o.value === value);
  return (
    <div className="flex flex-col gap-2 relative">
      <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">{label}</label>
      <div 
        onClick={toggleOpen}
        className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm cursor-pointer flex justify-between items-center text-foreground hover:bg-foreground/10 transition-colors"
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

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-erani-purple/20 border-t-erani-purple rounded-full animate-spin" />
        <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Cargando Módulo de Sesiones...</p>
      </div>
    }>
      <SessionsContent />
    </Suspense>
  );
}

function SessionsContent() {
  const router = useRouter();
  const { isSidebarCollapsed } = useDashboard();
  const [activeTab, setActiveTab] = useState<"unified" | "sessions" | "operations" | "tasks" | "calendar" | "ai_summaries">("unified");
  const [dbSessions, setDbSessions] = useState<Session[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<string | null>(null);
  const [meetUrl, setMeetUrl] = useState<string>("");
  const [isSpawningBot, setIsSpawningBot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "calendar" | "table">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    return new Date(d.setDate(diff));
  };
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);

  // Modal for New To-Do
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    notes: string;
    colorTags: string[];
    auditId: string;
    collectionId: string;
    collaborators: string[];
    startDate: string;
    deadline: string;
    googleEventId: string;
    itemType?: string;
    status: string;
  }>({ 
    title: "", 
    notes: "",
    colorTags: [] as string[],
    auditId: "",
    collectionId: "",
    collaborators: [] as string[],
    startDate: "",
    deadline: "",
    googleEventId: "",
    itemType: "task",
    status: "todo"
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const [audits, setAudits] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<any | null>(null);
  const [googleEventConfig, setGoogleEventConfig] = useState({
    colorTag: "gray",
    auditId: "",
    collectionId: "",
    collaborators: [] as string[]
  });
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [inviteModalData, setInviteModalData] = useState({ isOpen: false, sessionId: '', meetUrl: '' });
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null);

  const [workspaceTags, setWorkspaceTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("erani-blue");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const [hasOpenedUrlTask, setHasOpenedUrlTask] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasOpenedUrlTask) {
      const taskId = searchParams?.get('taskId');
      const gEventId = searchParams?.get('googleEventId');

      if (taskId && dbSessions.length > 0) {
        const task = dbSessions.find(s => s.id === taskId);
        if (task) {
          setEditingTaskId(task.id);
          setFormData({
            title: task.title,
            notes: task.notes || "",
            colorTags: task.color_tag ? task.color_tag.split(',') : [],
            auditId: task.audit_id || "",
            collectionId: task.collection_id || "",
            collaborators: task.collaborators || task.responsables || [],
            startDate: task.start_date ? task.start_date.substring(0, 16) : "",
            deadline: task.deadline ? task.deadline.substring(0, 16) : "",
            googleEventId: task.google_event_id || "",
            status: task.status || "todo"
          });
          setIsModalOpen(true);
          setHasOpenedUrlTask(true);
        }
      }

      if (gEventId && googleEvents.length > 0) {
        const ev = googleEvents.find(e => e.id === gEventId);
        if (ev) {
          setSelectedGoogleEvent(ev);
          setHasOpenedUrlTask(true);
        }
      }
    }
  }, [dbSessions, googleEvents, hasOpenedUrlTask, searchParams]);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);

  const [allEventConfigs, setAllEventConfigs] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erani_google_event_configs');
      if (saved) setAllEventConfigs(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const handleConfigChange = (newConfig: any) => {
    setGoogleEventConfig(newConfig);
    if (selectedGoogleEvent) {
      const updatedConfigs = { ...allEventConfigs, [selectedGoogleEvent.id]: newConfig };
      setAllEventConfigs(updatedConfigs);
      localStorage.setItem('erani_google_event_configs', JSON.stringify(updatedConfigs));
    }
  };

  useEffect(() => {
    if (selectedGoogleEvent) {
       try {
         const saved = localStorage.getItem('erani_google_event_configs');
         const configs = saved ? JSON.parse(saved) : {};
         setAllEventConfigs(configs); // ensure we have the latest
         if (configs[selectedGoogleEvent.id]) {
            setGoogleEventConfig(configs[selectedGoogleEvent.id]);
         } else {
            setGoogleEventConfig({ colorTag: "gray", auditId: "", collectionId: "", collaborators: [] });
         }
       } catch(e) {
         setGoogleEventConfig({ colorTag: "gray", auditId: "", collectionId: "", collaborators: [] });
       }
    } else {
       setGoogleEventConfig({ colorTag: "gray", auditId: "", collectionId: "", collaborators: [] });
    }
  }, [selectedGoogleEvent]);

  const getGoogleEventColorClass = (event: any, config: any, baseType: "small" | "medium" | "large") => {
    if (baseType === "small") {
        if (config?.colorTag === 'erani-blue') return 'bg-erani-blue/20 text-erani-blue hover:bg-erani-blue/30';
        if (config?.colorTag === 'erani-purple') return 'bg-erani-purple/20 text-erani-purple hover:bg-erani-purple/30';
        if (config?.colorTag === 'emerald') return 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30';
        if (config?.colorTag === 'coral') return 'bg-erani-coral/20 text-erani-coral hover:bg-erani-coral/30';
        if (config?.colorTag === 'amber') return 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30';
        return event.hangoutLink ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-foreground/10 text-gray-300 hover:bg-foreground/20';
    } else if (baseType === "medium") {
        if (config?.colorTag === 'erani-blue') return 'bg-erani-blue/10 border border-erani-blue/30 text-erani-blue hover:bg-erani-blue/20';
        if (config?.colorTag === 'erani-purple') return 'bg-erani-purple/10 border border-erani-purple/30 text-erani-purple hover:bg-erani-purple/20';
        if (config?.colorTag === 'emerald') return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
        if (config?.colorTag === 'coral') return 'bg-erani-coral/10 border border-erani-coral/30 text-erani-coral hover:bg-erani-coral/20';
        if (config?.colorTag === 'amber') return 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20';
        return event.hangoutLink ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20' : 'bg-foreground/5 border border-glass-border text-gray-300 hover:bg-foreground/10';
    } else {
        if (config?.colorTag === 'erani-blue') return 'bg-erani-blue/10 border-erani-blue/30 hover:bg-erani-blue/20';
        if (config?.colorTag === 'erani-purple') return 'bg-erani-purple/10 border-erani-purple/30 hover:bg-erani-purple/20';
        if (config?.colorTag === 'emerald') return 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20';
        if (config?.colorTag === 'coral') return 'bg-erani-coral/10 border-erani-coral/30 hover:bg-erani-coral/20';
        if (config?.colorTag === 'amber') return 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20';
        return event.hangoutLink ? 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20' : 'bg-foreground/5 border-glass-border hover:bg-foreground/10';
    }
  };

  const parseAiSummary = (summaryText: string) => {
    if (!summaryText) return { executive: "Sin resumen disponible.", todos: [] };
    
    const parts = summaryText.split(/2\.\s*Tareas.*?:|To-Dos Asignados:/i);
    const executive = parts[0]?.replace(/1\.\s*Resumen\s*?:/i, '').trim() || summaryText;
    
    const todosRaw = parts[1] ? parts[1].trim() : "";
    const todos = todosRaw 
      ? todosRaw.split('\n').filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./)).map(line => line.replace(/^-\s*|^\d+\.\s*/, '').trim())
      : [];
      
    return { executive, todos };
  };

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sessions', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) setDbSessions(data);
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGoogleEvents = useCallback(async () => {
    setIsLoadingGoogle(true);
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data);
        setIsGoogleLinked(true);
      } else {
        setIsGoogleLinked(false);
      }
    } catch (e) {
      console.error("Error fetching Google Calendar:", e);
      setIsGoogleLinked(false);
    } finally {
      setIsLoadingGoogle(false);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (profile?.organization_id) {
         const [auditsRes, collectionsRes, membersRes, tagsRes, operationsRes] = await Promise.all([
            supabase.from('audits').select('*').eq('organization_id', profile.organization_id),
            supabase.from('collections').select('*').eq('organization_id', profile.organization_id),
            supabase.from('org_members').select('id, email, profile_id, profiles(full_name, avatar_url)').eq('organization_id', profile.organization_id),
            supabase.from('workspace_tags').select('*').eq('organization_id', profile.organization_id),
            supabase.from('operations').select('*').eq('organization_id', profile.organization_id)
         ]);
         if (auditsRes.data) setAudits(auditsRes.data);
         if (collectionsRes.data) setCollections(collectionsRes.data);
         if (membersRes.data) setOrgMembers(membersRes.data.map((m: any) => ({ ...m, profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles })));
         if (tagsRes.data) setWorkspaceTags(tagsRes.data);
         if (operationsRes.data) setOperations(operationsRes.data);
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchGoogleEvents();
    fetchMetadata();

    const interval = setInterval(() => {
      fetchSessions();
      fetchGoogleEvents();
    }, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [fetchSessions, fetchGoogleEvents, fetchMetadata]);

  const handleCreateTag = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!newTagName.trim() || !profile?.organization_id) return;
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

  const updateSessionStatus = async (id: string, newStatus: SessionStatus) => {
    // Optimistic update
    setDbSessions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (e) {
      console.error("Error updating status:", e);
      // Revert on error
      fetchSessions();
    }
  };

  const updateOperationStatus = async (id: string, newStatus: string) => {
    setOperations(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/operations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (e) {
      fetchMetadata();
    }
  };

  const updateOperationField = async (id: string, updates: any) => {
    setOperations((prev: any[]) => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setSelectedOperation((prev: any) => prev && prev.id === id ? { ...prev, ...updates } : prev);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/operations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ id, ...updates })
      });
    } catch (e) {
      fetchMetadata();
    }
  };

  const handleDeleteOperation = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/operations?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error("Error deleting operation");
      setOperations(prev => prev.filter(o => o.id !== id));
      setOperationToDelete(null);
      setSelectedOperation(null);
    } catch(e) {
      console.error(e);
    }
  };

  const handleDuplicateOperation = async (operation: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const payload = {
        title: `${operation.title} (Copia)`,
        status: 'todo',
        responsables: operation.responsables || [],
        project_id: operation.project_id,
        tags: operation.tags || [],
        linked_sessions: operation.linked_sessions || [],
        organization_id: operation.organization_id
      };
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error duplicating operation");
      fetchMetadata();
    } catch (e) {
      console.error(e);
    }
  };

  const [isNotifying, setIsNotifying] = useState(false);
  const notifyCollaborators = async (session: Session | any, isGoogle: boolean = false) => {
    setIsNotifying(true);
    try {
      let emails: string[] = [];
      let attendeesInfo: {name: string, role: string}[] = [];
      let sessionTitle = isGoogle ? session.summary : session.title;
      let meetLink = isGoogle ? session.hangoutLink : (session.calendly_url || "https://meet.google.com");
      let notes = isGoogle ? session.description : session.notes;
      let rawDate = isGoogle ? (session.start?.dateTime || session.start?.date) : session.scheduled_at;
      let date = isGoogle ? new Date(rawDate).toLocaleString('es-ES') : new Date(rawDate).toLocaleString('es-ES');
      let projectName = "Auditoría General";

      if (!isGoogle && session.collaborators && session.collaborators.length > 0) {
        emails = orgMembers.filter(m => session.collaborators.includes(m.id)).map(m => m.email);
        attendeesInfo = orgMembers.filter(m => session.collaborators.includes(m.id)).map(m => ({
           name: m.profiles?.full_name || m.email,
           role: "Colaborador ERANI"
        }));
        if (session.audit_id) {
           const proj = audits.find(a => a.id === session.audit_id);
           if (proj) projectName = proj.metadata?.name || projectName;
        }
      } else if (isGoogle) {
        if (session.attendees) {
           emails = session.attendees.map((a: any) => a.email);
           attendeesInfo = session.attendees.map((a: any) => ({
              name: a.email,
              role: "Invitado Externo"
           }));
        }
        // Agrega a los colaboradores de la organización que fueron seleccionados manualmente
        if (googleEventConfig.collaborators && googleEventConfig.collaborators.length > 0) {
           const extraMembers = orgMembers.filter(m => (googleEventConfig.collaborators || []).includes(m.id));
           const extraEmails = extraMembers.map(m => m.email);
           emails = [...new Set([...emails, ...extraEmails])]; // Merge sin duplicados
           
           const extraInfo = extraMembers.map(m => ({
              name: m.profiles?.full_name || m.email,
              role: "Colaborador ERANI"
           }));
           attendeesInfo = [...attendeesInfo, ...extraInfo].filter((v,i,a)=>a.findIndex(t=>(t.name === v.name))===i);
        }
        if (googleEventConfig.auditId) {
           const proj = audits.find(a => a.id === googleEventConfig.auditId);
           if (proj) projectName = proj.metadata?.name || projectName;
        }
      }

      if (emails.length === 0) {
        alert("No hay colaboradores vinculados con correos válidos para notificar.");
        setIsNotifying(false);
        return;
      }

      let linkedTasks: any[] = [];
      if (isGoogle) {
         linkedTasks = dbSessions.filter(s => s.google_event_id === session.id).map(t => ({ title: t.title, notes: t.notes }));
      } else {
         linkedTasks = dbSessions.filter(s => s.google_event_id === session.google_event_id && s.id !== session.id).map(t => ({ title: t.title, notes: t.notes }));
      }

      const isTask = !isGoogle && (session.item_type === 'task' || !session.calendly_url);

      // Obtener datos del usuario actual y la organización
      const { data: { user } } = await supabase.auth.getUser();
      let inviterName = "El Administrador";
      let inviterRole = "Project Manager";
      let inviterAvatarUrl = "https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/default-avatar.png";
      let organizationName = "ERANI";

      if (user) {
         const currentUser = orgMembers.find(m => m.profile_id === user.id);
         if (currentUser) {
            inviterName = currentUser.profiles?.full_name || currentUser.email || inviterName;
            inviterRole = currentUser.role || inviterRole;
            inviterAvatarUrl = currentUser.profiles?.avatar_url || inviterAvatarUrl;
         }
         const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
         if (profile?.organization_id) {
            const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.organization_id).single();
            if (org) organizationName = org.name || organizationName;
         }
      }

      const res = await fetch('/api/send-invite', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            sessionTitle,
            projectManagerName: inviterName,
            date,
            rawDate,
            meetLink,
            notes: notes?.replace(new RegExp("(<([^>]+)>)", "gi"), "") || "",
            projectName,
            collaboratorEmails: emails,
            attendeesInfo,
            linkedTasks,
            isTask,
            inviterName,
            inviterRole,
            inviterAvatarUrl,
            organizationName
         })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.error || "Error al enviar correos");
      }
      setSuccessToast("¡Invitaciones enviadas exitosamente!");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch(e: any) {
      setErrorToast("Error: " + e.message);
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setIsNotifying(false);
    }
  };

  const notifyOperationsCollaborators = async (op: any, isManual: boolean = false) => {
    setIsNotifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let creatorName = "Administrador";
      let creatorEmail = user?.email || "";
      let orgName = "ERANI";

      if (user) {
         const currentUser = orgMembers.find(m => m.profile_id === user.id);
         if (currentUser) {
            creatorName = currentUser.profiles?.full_name || currentUser.email || creatorName;
         }
         const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
         if (profile?.organization_id) {
            const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.organization_id).single();
            if (org) orgName = org.name || orgName;
         }
      }

      const res = await fetch('/api/operations/notify', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            operation: op,
            orgName,
            creatorName,
            creatorEmail
         })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (isManual) throw new Error(errorData.error || errorData.message || "Error al enviar correos");
      }
      if (isManual) {
        setSuccessToast("¡Notificaciones de operación enviadas!");
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch(e: any) {
      if (isManual) {
        setErrorToast("Error: " + e.message);
        setTimeout(() => setErrorToast(null), 3000);
      }
    } finally {
      setIsNotifying(false);
    }
  };

  const deleteSession = (id: string) => {
    setSessionToDelete(id);
  };

  const confirmDeleteSession = async () => {
    const id = sessionToDelete;
    if (!id) return;
    setSessionToDelete(null);
    setDbSessions(prev => prev.filter(s => s.id !== id));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/sessions?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
    } catch (e) {
      console.error("Error deleting session:", e);
      fetchSessions();
    }
  };

  const generateAiSummary = async (sessionId: string) => {
    setIsGeneratingAi(sessionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sessions/ai-summary', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setDbSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ai_summary: data.summary } : s));
      alert("Resumen de IA generado exitosamente.");
    } catch (e: any) {
      alert("Error al generar resumen: " + e.message);
    } finally {
      setIsGeneratingAi(null);
    }
  };

  const inviteRecallBot = async (sessionId: string) => {
    if (!meetUrl.includes("meet.google.com") && !meetUrl.includes("zoom.us") && !meetUrl.includes("teams.microsoft.com")) {
      alert("Por favor ingresa un enlace válido de Google Meet, Zoom o Teams.");
      return;
    }
    setIsSpawningBot(sessionId);
    try {
      const res = await fetch('/api/sessions/recall/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, meetingUrl: meetUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert("¡ERANI AI está en camino! Acéptalo en tu llamada para que empiece a grabar y transcribir.");
      setMeetUrl("");
    } catch (e: any) {
      alert("Error al invitar a ERANI AI: " + e.message);
    } finally {
      setIsSpawningBot(null);
    }
  };

  const handleNotifySummary = async (sessionId: string) => {
    try {
      setSuccessToast('Enviando...');
      const res = await fetch('/api/sessions/notify-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setSuccessToast('Resumen enviado por correo exitosamente.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (e: any) {
      setErrorToast(e.message);
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: SessionStatus) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    if (activeTab === 'operations') {
        let opStatus = status as string;
        if (opStatus === 'scheduled') opStatus = 'in_progress';
        
        const op = operations.find(o => o.id === draggedItem);
        if (op && op.status !== opStatus) updateOperationStatus(draggedItem, opStatus);
    } else {
        const session = dbSessions.find(s => s.id === draggedItem);
        if (session && session.status !== status) {
          updateSessionStatus(draggedItem, status);
        }
    }
    setDraggedItem(null);
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', session?.user?.id).single();
      const isOperation = activeTab === 'operations';
      const endpoint = isOperation ? '/api/operations' : '/api/sessions';

      let bodyPayload: any = {
        title: formData.title,
        scheduledAt: new Date().toISOString(), // Default to now
        notes: formData.notes,
        colorTag: formData.colorTags.join(','),
        auditId: formData.auditId || null,
        collectionId: formData.collectionId || null,
        collaborators: formData.collaborators,
        deadline: formData.deadline || null,
        googleEventId: formData.googleEventId || null,
        itemType: 'task'
      };

      if (isOperation) {
          bodyPayload = {
              title: formData.title,
              status: formData.status || 'todo',
              responsables: formData.collaborators,
              project_id: formData.auditId || null,
              tags: formData.colorTags,
              linked_sessions: formData.googleEventId ? [formData.googleEventId] : [],
              start_date: formData.startDate ? new Date(formData.startDate).toISOString() : null,
              deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
          };
      }

      if (editingTaskId) {
         const res = await fetch(endpoint, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'x-org-id': profile?.organization_id || '' },
           body: JSON.stringify({ ...bodyPayload, id: editingTaskId })
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || "Error al actualizar");
         fetchMetadata(); // Refetch everything
         setSuccessToast(isOperation ? "Operación actualizada" : "Tarea actualizada con éxito");
      } else {
         const res = await fetch(endpoint, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'x-org-id': profile?.organization_id || '' },
           body: JSON.stringify(bodyPayload)
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || "Error al guardar");
         
         if (isOperation) {
             // We need to pass the created operation data, which data should contain
             // However, /api/operations POST might return { data: [ { id: ... } ] }
             // We can reconstruct it from formData for the email
             const tempOp = {
                 ...bodyPayload,
                 id: data.data?.[0]?.id || "new"
             };
             await notifyOperationsCollaborators(tempOp, false);
         }

         fetchMetadata();
         setSuccessToast(isOperation ? "Operación creada" : "Tarea guardada con éxito");
      }
      
      setIsModalOpen(false);
      setEditingTaskId(null);
      setTimeout(() => setSuccessToast(null), 3000);
      setFormData({ 
        title: "", 
        notes: "",
        colorTags: [],
        auditId: "",
        collectionId: "",
        collaborators: [],
        startDate: "",
        deadline: "",
        googleEventId: "",
        status: "todo"
      });
    } catch (e) {
      console.error("Error creating session:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-8 relative overflow-hidden h-screen flex flex-col`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-blue/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-[1600px] w-full flex flex-col gap-4 h-full">
          
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 gap-4">
            <div className="flex flex-col gap-2">
               <h1 className="text-3xl font-black uppercase tracking-tight text-foreground whitespace-nowrap">
                  Workspaces de <span className="text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-erani-purple">Estrategia</span>
               </h1>
               <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Centro de Comando Forense y Operativo
               </p>
               <button 
                  onClick={() => router.push('/agent')}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  className="mt-4 relative inline-flex items-center w-max gap-3 px-6 py-2.5 bg-gradient-to-b from-foreground/5 to-transparent hover:from-foreground/10 hover:to-foreground/5 border border-glass-border rounded-xl text-[10px] uppercase tracking-[0.2em] text-foreground transition-all shadow-[0_8px_30px_rgba(158,128,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:shadow-[0_10px_40px_rgba(158,128,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] overflow-hidden group"
               >
                  <motion.div 
                     animate={{ x: ["-100%", "100%"] }} 
                     transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} 
                     className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-erani-purple/20 to-transparent pointer-events-none" 
                  />
                  <Bot className="w-4 h-4 text-erani-purple drop-shadow-[0_0_8px_rgba(158,128,255,0.8)] relative z-10" />
                  <span className="relative z-10 font-medium">Consultar Agente Forense</span>
               </button>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-background/50 backdrop-blur-md border border-glass-border rounded-xl overflow-x-auto custom-scrollbar">
               <button 
                 onClick={() => setActiveTab("unified")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all shrink-0 ${activeTab === 'unified' ? 'bg-gradient-to-r from-erani-blue to-erani-purple text-white shadow-[0_0_15px_rgba(158,128,255,0.4)]' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
               >
                 <Kanban className="w-4 h-4" /> Workspace
               </button>
               <button 
                 onClick={() => setActiveTab("sessions")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all shrink-0 ${activeTab === 'sessions' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
               >
                 <CalendarIcon className="w-4 h-4" /> Calendario
               </button>
               <button 
                 onClick={() => setActiveTab("operations")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all shrink-0 ${activeTab === 'operations' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
               >
                 <Activity className="w-4 h-4" /> Operaciones
               </button>
               <button 
                 onClick={() => setActiveTab("tasks")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all shrink-0 ${activeTab === 'tasks' ? 'bg-erani-purple text-white shadow-[0_0_15px_rgba(158,128,255,0.3)]' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
               >
                 <Check className="w-4 h-4" /> Tareas
               </button>
               <button 
                 onClick={() => setActiveTab("calendar")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all shrink-0 ${activeTab === 'calendar' ? 'bg-erani-blue text-white shadow-[0_0_15px_rgba(0,85,160,0.3)]' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
               >
                 <Video className="w-4 h-4" /> Sesiones
               </button>
               <button 
                 onClick={() => setActiveTab("ai_summaries")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all shrink-0 ${activeTab === 'ai_summaries' ? 'bg-gradient-to-r from-erani-purple to-erani-blue text-white shadow-[0_0_20px_rgba(158,128,255,0.4)]' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
               >
                 <Bot className="w-4 h-4 text-erani-purple" /> Resúmenes IA
               </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative">
             <AnimatePresence mode="wait">
                
                {/* AI SUMMARIES TAB */}
                {activeTab === 'ai_summaries' && (
                  <motion.div 
                    key="ai_summaries"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 w-full h-full bg-background rounded-2xl border border-glass-border shadow-2xl overflow-y-auto custom-scrollbar p-8"
                  >
                     <div className="flex justify-between items-center mb-8">
                       <div>
                         <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-erani-purple to-erani-blue uppercase tracking-tighter">Resúmenes Forenses AI</h2>
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Transcripciones y Actionables generados por ERANI AI</p>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                       {dbSessions.filter(s => s.ai_summary).map(session => {
                         const parsed = parseAiSummary(session.ai_summary || "");
                         return (
                           <div key={session.id} className="bg-foreground/5 border border-glass-border rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-erani-purple/10 blur-[40px] rounded-full group-hover:bg-erani-purple/20 transition-all"></div>
                             
                             <div className="flex justify-between items-start z-10 gap-2">
                               <h3 className="text-sm font-black text-white uppercase tracking-wider line-clamp-2 pr-2">{session.title}</h3>
                               <div className="flex flex-col gap-2 shrink-0 items-end">
                                 <span className="text-[10px] bg-erani-purple/20 text-erani-purple px-2 py-1 rounded font-bold uppercase tracking-widest border border-erani-purple/30 flex items-center gap-1">
                                   <Bot className="w-3 h-3" /> Analizado
                                 </span>
                                 <button
                                   onClick={() => handleNotifySummary(session.id)}
                                   className="text-[9px] bg-foreground/5 text-gray-400 hover:text-white hover:bg-foreground/20 px-2 py-1 rounded font-black uppercase tracking-widest border border-glass-border flex items-center gap-1 transition-all"
                                   title="Enviar a colaboradores"
                                 >
                                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                   Email
                                 </button>
                               </div>
                             </div>
                             
                             <div className="z-10 flex flex-col gap-1">
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" /> {new Date(session.scheduled_at).toLocaleDateString()}
                               </p>
                             </div>

                             <div className="z-10 bg-background/40 p-4 rounded-xl border border-glass-border/50 shadow-inner mt-2">
                               <p className="text-[10px] text-erani-purple font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                 <AlignLeft className="w-3 h-3" /> Resumen Ejecutivo
                               </p>
                               <p className="text-xs text-gray-300 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">{parsed.executive}</p>
                             </div>
                             
                             {parsed.todos.length > 0 && (
                               <div className="mt-2 z-10 flex-1 border-t border-glass-border pt-4">
                                 <p className="text-[10px] text-erani-blue font-black uppercase tracking-widest mb-3 flex items-center gap-1">
                                   <Check className="w-3 h-3" /> Tareas Extraídas ({parsed.todos.length})
                                 </p>
                                 <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                   {parsed.todos.map((todo, idx) => (
                                     <div key={idx} className="bg-background/80 border border-glass-border hover:border-erani-blue/50 p-3 rounded-lg flex flex-col gap-3 transition-colors group/todo shadow-sm">
                                       <p className="text-xs text-gray-200">{todo}</p>
                                       <button 
                                         onClick={() => {
                                            setFormData({
                                               ...formData,
                                               title: todo,
                                               notes: `Extraído automáticamente del resumen de la sesión: ${session.title}\n\nResumen de junta:\n${parsed.executive}`,
                                               itemType: 'task',
                                               status: 'todo'
                                            });
                                            setEditingTaskId(null);
                                            setIsModalOpen(true);
                                         }}
                                         className="text-[9px] font-black uppercase tracking-widest bg-erani-blue/10 text-erani-blue hover:bg-erani-blue hover:text-white px-3 py-1.5 rounded-md transition-all self-end flex items-center gap-1 opacity-80 group-hover/todo:opacity-100"
                                       >
                                         <Plus className="w-3 h-3" /> Convertir a Tarea
                                       </button>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                       })}
                       
                       {dbSessions.filter(s => s.ai_summary).length === 0 && (
                         <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                            <img src="/eanilogo.png" className="w-24 mb-4 filter grayscale brightness-50 opacity-40" alt="ERANI AI" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">No hay resúmenes de IA todavía</h3>
                            <p className="text-xs text-gray-500 mt-2 max-w-md">Invita al Agente Forense de ERANI a tus sesiones de Google Meet. Cuando la sesión termine, procesará la llamada con ERANI AI, y el resumen aparecerá mágicamente aquí.</p>
                         </div>
                       )}
                     </div>
                  </motion.div>
                )}

                {/* UNIFIED WORKSPACE TAB */}
                {activeTab === 'unified' && (
                  <motion.div 
                    key="unified"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 w-full h-full"
                  >
                     <UnifiedWorkspace audits={audits} collections={collections} operations={operations} dbSessions={dbSessions} googleEvents={googleEvents} workspaceTags={workspaceTags} orgMembers={orgMembers} />
                  </motion.div>
                )}

                {/* CALENDAR TAB */}
                {activeTab === 'calendar' && (
                  <motion.div 
                    key="calendar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 w-full h-full glassmorphism rounded-3xl border border-glass-border overflow-hidden flex flex-col shadow-2xl"
                  >
                     <div className="p-4 border-b border-glass-border bg-background/50 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black tracking-widest text-foreground flex items-center gap-2">
                           <CalendarIcon className="w-4 h-4 text-erani-blue" />
                           Reserva Oficial de Google Calendar
                        </span>
                     </div>
                     <div className="flex-1 w-full bg-white relative">
                        <iframe 
                          src="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2EUR-bCUz7R604ttZTsBVNw5TRByBuPyoL8Os2axIgH2v1hjAh0OJURYc2TiH92bH-O5kkJf94?gv=true" 
                          width="100%" 
                          height="100%" 
                          frameBorder="0"
                          className="absolute inset-0"
                        />
                     </div>
                  </motion.div>
                )}

                {/* DYNAMIC KANBAN TABS (Operations, Tasks, Sessions) */}
                {['tasks', 'sessions', 'operations'].includes(activeTab) && (
                  <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-10"
                  >
              {/* Header section with Toggles */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-glass-border pb-6">
                <div>
                    <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
                       {activeTab === 'operations' ? 'Gestión de Operaciones' : activeTab === 'tasks' ? 'Gestión de Tareas y To-Dos' : 'Sesiones Estratégicas'}
                    </h2>
                    <p 
                       className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-2 opacity-80"
                       style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                       {activeTab === 'operations' ? 'Administra las operaciones de tus auditorías y data rooms' : activeTab === 'tasks' ? 'Organiza y vincula tus tareas' : 'Agenda y analiza tus sesiones con IA'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab !== 'sessions' && (
                        <div className="bg-foreground/5 p-1 rounded-xl flex items-center border border-glass-border">
                          {activeTab === 'operations' && (
                              <button 
                                onClick={() => setViewMode("table")}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}
                              >
                                Tabla
                              </button>
                          )}
                          <button 
                            onClick={() => setViewMode("calendar")}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}
                          >
                            Calendario
                          </button>
                          <button 
                            onClick={() => setViewMode("kanban")}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}
                          >
                            Kanban
                          </button>
                        </div>
                    )}
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="button-premium py-2 px-5 rounded-xl text-xs flex items-center gap-2 uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" />
                      {activeTab === 'operations' ? 'Añadir Operación' : activeTab === 'tasks' ? 'Añadir To-Do' : 'Nueva Sesión'}
                    </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 w-full relative">
                {isLoading ? (
                    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-erani-purple/10 blur-[120px] rounded-full pointer-events-none" />
                      <div className="flex flex-col items-center gap-6 relative z-10">
                         <Image src="/isologo.png" alt="Cargando..." width={64} height={64} className="object-contain animate-pulse logo-adaptive drop-shadow-[0_0_15px_rgba(116,4,255,0.5)]" />
                         <p className="text-sm uppercase tracking-widest font-black text-gray-400">Cargando Espacios de Trabajo...</p>
                      </div>
                    </div>
                ) : (activeTab === 'sessions' ? 'calendar' : viewMode) === "table" && activeTab === 'operations' ? (
                    <div className="flex flex-col h-full bg-background/40 backdrop-blur-md border border-glass-border rounded-3xl relative overflow-auto custom-scrollbar">
                       <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-glass-border">
                             <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <th className="p-5">Título de Operación</th>
                                <th className="p-5">Estado</th>
                                <th className="p-5">Proyecto (Auditoría)</th>
                                <th className="p-5">Etiquetas</th>
                                <th className="p-5 text-right">Acciones</th>
                             </tr>
                          </thead>
                          <tbody>
                             {operations.map(op => (
                                <tr key={op.id} className="border-b border-glass-border hover:bg-foreground/5 cursor-pointer transition-colors" onClick={() => setSelectedOperation(op)}>
                                   <td className="p-5">
                                      <span className="text-sm font-black text-foreground uppercase tracking-tight">{op.title}</span>
                                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Creado: {new Date(op.created_at).toLocaleDateString()}</div>
                                   </td>
                                   <td className="p-5">
                                      <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${op.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : op.status === 'in_progress' ? 'bg-erani-blue/10 text-erani-blue border-erani-blue/30' : 'bg-orange-500/10 text-orange-500 border-orange-500/30'}`}>
                                         {op.status === 'todo' ? 'Por Hacer' : op.status === 'in_progress' ? 'En Progreso' : 'Completado'}
                                      </span>
                                   </td>
                                   <td className="p-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                      {audits.find(a => a.id === op.project_id)?.metadata?.name || audits.find(a => a.id === op.project_id)?.title || 'Ninguno'}
                                   </td>
                                   <td className="p-5">
                                      <div className="flex flex-wrap gap-1">
                                         {op.tags && op.tags.length > 0 ? op.tags.map((tId: string) => {
                                            const tag = workspaceTags.find(wt => wt.id === tId);
                                            if (!tag) {
                                               const colorDef = COLOR_TAGS.find(c => c.id === tId);
                                               if (!colorDef) return <span key={tId} className="px-2 py-0.5 rounded border border-glass-border text-[9px] font-black uppercase tracking-widest bg-foreground/10 text-foreground">{tId}</span>;
                                               return <span key={tId} className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>{colorDef.label}</span>;
                                            }
                                            const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                                            return <span key={tId} className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>{tag.name}</span>;
                                         }) : <span className="text-[10px] text-muted-foreground">--</span>}
                                      </div>
                                   </td>
                                   <td className="p-5 text-right">
                                      <button onClick={(e) => { e.stopPropagation(); setSelectedOperation(op); }} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-colors bg-emerald-500/10 px-4 py-2 rounded-xl">Detalles</button>
                                   </td>
                                </tr>
                             ))}
                             {operations.length === 0 && (
                                <tr>
                                   <td colSpan={5} className="p-10 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">No hay operaciones creadas.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                ) : (activeTab === 'sessions' ? 'calendar' : viewMode) === "kanban" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-10">
                        {COLUMNS.map(col => {
                           const mappedGoogleEvents = googleEvents.map(e => ({
                               id: e.id,
                               title: e.summary || 'Google Meet',
                               status: 'scheduled',
                               item_type: 'session',
                               scheduled_at: e.start?.dateTime || e.start?.date || new Date(),
                               isGoogle: true,
                               originalEvent: e
                           }));
                           const allSessionsForKanban = [
                               ...dbSessions.filter(s => s.item_type === 'session' || !!s.calendly_url),
                               ...mappedGoogleEvents
                           ];

                           const filteredItems = activeTab === 'operations' 
                              ? operations.filter(o => o.status === col.id || (col.id === 'todo' && !o.status) || (col.id === 'scheduled' && o.status === 'in_progress'))
                              : activeTab === 'tasks'
                              ? dbSessions.filter(s => (s.status === col.id || (col.id === 'todo' && !s.status)) && s.item_type !== 'session' && !s.calendly_url)
                              : allSessionsForKanban.filter(s => s.status === col.id || (col.id === 'todo' && !s.status));
                           
                           return (
                          <div 
                            key={col.id} 
                            className="flex flex-col h-full bg-background/40 backdrop-blur-md border border-glass-border rounded-3xl overflow-hidden"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                          >
                              <div className="p-5 border-b border-glass-border bg-background/50 flex items-center justify-between shrink-0">
                                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{col.title}</h3>
                                <span className="bg-foreground/5 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold">
                                    {filteredItems.length}
                                </span>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                                {filteredItems.map(session => (
                                      <div 
                                        key={session.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, session.id)}
                                        onClick={() => {
                                            if (activeTab === 'operations') setSelectedOperation(session);
                                            else session.isGoogle ? setSelectedGoogleEvent(session.originalEvent) : setSelectedSession(session);
                                        }}
                                        className="bg-background border border-glass-border rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-erani-purple/50 hover:shadow-[0_0_15px_rgba(158,128,255,0.15)] transition-all group relative"
                                      >
                                        <div className="flex items-start justify-between">
                                            <h4 className="text-sm font-black text-foreground uppercase tracking-tight leading-snug pr-4">{session.title}</h4>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === session.id ? null : session.id); }}
                                                className="p-1 text-gray-500 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors relative z-20"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            <AnimatePresence>
                                                {menuOpenId === session.id && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute top-12 right-4 bg-background border border-glass-border shadow-2xl rounded-xl overflow-hidden z-50 py-1 min-w-[120px]"
                                                    >
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setMenuOpenId(null); 
                                                                setEditingTaskId(session.id);
                                                                setFormData({
                                                                    title: session.title,
                                                                    notes: session.notes || "",
                                                                    colorTags: activeTab === 'operations' ? (session.tags || []) : (session.color_tag ? session.color_tag.split(',') : []),
                                                                    auditId: activeTab === 'operations' ? (session.project_id || "") : (session.audit_id || ""),
                                                                    collectionId: session.collection_id || "",
                                                                    collaborators: activeTab === 'operations' ? (session.responsables || []) : (session.collaborators || []),
                                                                    startDate: activeTab === 'operations' ? (session.start_date || "") : "",
                                                                    deadline: session.deadline || "",
                                                                    googleEventId: session.google_event_id || "",
                                                                    status: session.status || "todo"
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 flex items-center gap-2"
                                                        >
                                                            <Edit2 className="w-3 h-3" /> Editar
                                                        </button>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                setMenuOpenId(null);
                                                                if (activeTab === 'operations') {
                                                                    handleDuplicateOperation(session);
                                                                } else {
                                                                    try {
                                                                       const { data: { session: authSession } } = await supabase.auth.getSession();
                                                                       const res = await fetch('/api/sessions', {
                                                                     method: 'POST',
                                                                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession?.access_token}` },
                                                                     body: JSON.stringify({
                                                                       title: session.title + " (Copia)",
                                                                       scheduledAt: session.scheduled_at || new Date().toISOString(),
                                                                       notes: session.notes,
                                                                       colorTag: session.color_tag,
                                                                       auditId: session.audit_id,
                                                                       collectionId: session.collection_id,
                                                                       collaborators: session.collaborators,
                                                                       deadline: session.deadline,
                                                                       itemType: session.item_type || 'task',
                                                                       status: session.status
                                                                     })
                                                                   });
                                                                   const newSession = await res.json();
                                                                   if(res.ok) {
                                                                     fetchSessions(); // Refresh from DB to get full updated state
                                                                   } else {
                                                                     const errData = await newSession;
                                                                     console.error("Error duplicating:", errData);
                                                                     setErrorToast("Error: " + (errData.error || JSON.stringify(errData) || "Error desconocido"));
                                                                     setTimeout(() => setErrorToast(null), 5000);
                                                                   }
                                                                } catch(err) { console.error(err); }
                                                                }
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 flex items-center gap-2 text-erani-blue"
                                                        >
                                                            <Copy className="w-3 h-3" /> Duplicar
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); setMenuOpenId(null); }}
                                                            className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-3 h-3" /> Borrar
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="pt-3 border-t border-glass-border mt-1 flex flex-col gap-3">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                  <Clock className={`w-3 h-3 ${col.id === 'scheduled' ? 'text-erani-blue' : 'text-gray-400'}`} />
                                                  {new Date(activeTab === 'operations' ? (session.deadline || session.start_date || session.created_at) : (session.deadline || session.scheduled_at)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </div>
                                                {(() => {
                                                   const colorTagsArray = activeTab === 'operations' ? (session.tags || []) : (session.color_tag ? session.color_tag.split(',') : []);
                                                   if (colorTagsArray.length > 0) {
                                                      return (
                                                         <div className="flex flex-wrap gap-1">
                                                            {colorTagsArray.map((tId: string) => {
                                                               const tag = workspaceTags.find(wt => wt.id === tId);
                                                               if (!tag) {
                                                                  const colorDef = COLOR_TAGS.find(c => c.id === tId);
                                                                  if (!colorDef) return null;
                                                                  return (
                                                                     <span key={tId} className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>
                                                                        {colorDef.label}
                                                                     </span>
                                                                  );
                                                               }
                                                               const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                                                               return (
                                                                  <span key={tId} className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>
                                                                     {tag.name}
                                                                  </span>
                                                               );
                                                            })}
                                                         </div>
                                                      );
                                                   }
                                                   return null;
                                                })()}
                                            </div>
                                            {(() => {
                                                const collaboratorsArray = activeTab === 'operations' ? (session.responsables || []) : (session.collaborators || []);
                                                if (collaboratorsArray.length > 0) {
                                                   return (
                                                      <div className="flex items-center gap-1 -space-x-2 mt-1">
                                                         {collaboratorsArray.map((id: string) => {
                                                      const member = orgMembers.find(m => m.id === id);
                                                      if (!member) return null;
                                                      const initials = (member.profiles?.full_name || member.email).substring(0,2).toUpperCase();
                                                      return (
                                                         <div key={id} className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-[8px] font-black border border-glass-border shadow-sm z-10 hover:z-20 transition-all overflow-hidden" title={member.profiles?.full_name || member.email}>
                                                            {member.profiles?.avatar_url ? (
                                                               <img src={member.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                               initials
                                                            )}
                                                         </div>
                                                      );
                                                         })}
                                                      </div>
                                                   );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                        )})}
                    </div>
                ) : (
                    <div className="h-full pb-10">
                      {/* Calendar UI */}
                      <div className="glassmorphism border border-glass-border rounded-3xl p-6 h-full flex flex-col">
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                                {calendarView === 'month' && currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                {calendarView === 'week' && `Semana del ${getStartOfWeek(currentDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                                {calendarView === 'day' && currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                {!isGoogleLinked && (
                                    <button onClick={() => window.location.href = "/api/auth/google"} className="text-[10px] bg-erani-blue/10 text-erani-blue border border-erani-blue/30 px-3 py-1.5 rounded-lg hover:bg-erani-blue hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                                        <CalendarIcon className="w-3 h-3" /> Vincular Google
                                    </button>
                                )}
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="bg-foreground/5 p-1 rounded-xl flex items-center border border-glass-border">
                                    <button onClick={() => setCalendarView('month')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${calendarView === 'month' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}>Mes</button>
                                    <button onClick={() => setCalendarView('week')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${calendarView === 'week' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}>Semana</button>
                                    <button onClick={() => setCalendarView('day')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${calendarView === 'day' ? 'bg-erani-blue text-white shadow-lg' : 'text-gray-400 hover:text-foreground'}`}>Día</button>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                          if (calendarView === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
                                          if (calendarView === 'week') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
                                          if (calendarView === 'day') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
                                      }}
                                      className="p-2 border border-glass-border rounded-xl hover:bg-foreground/5 transition-all text-foreground"
                                    >
                                      <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                          if (calendarView === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
                                          if (calendarView === 'week') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
                                          if (calendarView === 'day') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
                                      }}
                                      className="p-2 border border-glass-border rounded-xl hover:bg-foreground/5 transition-all text-foreground"
                                    >
                                      <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                          </div>
                                                 {calendarView === 'month' && (
                              <>
                                  <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                        <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 py-2">
                                          {day}
                                        </div>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-7 gap-2 flex-1">
                                    {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                                        <div key={`blank-${i}`} className="bg-transparent rounded-2xl min-h-[100px]" />
                                    ))}
                                    {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                        const day = i + 1;
                                        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                        const daySessions = activeTab === 'operations' ? [] : activeTab === 'tasks' ? dbSessions.filter(s => {
                                          const d = new Date(s.scheduled_at);
                                          return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear() && s.item_type !== 'session' && !s.calendly_url;
                                        }) : dbSessions.filter(s => {
                                          const d = new Date(s.scheduled_at);
                                          return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear() && (s.item_type === 'session' || !!s.calendly_url);
                                        });
                                        const dayGoogleEvents = activeTab === 'sessions' ? googleEvents.filter(e => {
                                          const d = new Date(e.start?.dateTime || e.start?.date);
                                          return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear();
                                        }) : [];
                                        const dayOperations = activeTab === 'operations' ? operations.filter(o => {
                                          const d = new Date(o.start_date || o.deadline || o.created_at);
                                          return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear();
                                        }) : [];
                                        return (
                                          <div key={`day-${day}`} className="bg-foreground/5 border border-glass-border rounded-2xl min-h-[100px] p-2 flex flex-col gap-1 hover:border-erani-purple/50 transition-all overflow-hidden group">
                                              <span className="text-xs font-black text-gray-400 self-end">{day}</span>
                                              <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                                {daySessions.map(session => (
                                                    <div 
                                                      key={session.id} 
                                                      onClick={() => setSelectedSession(session)}
                                                      className={`text-[9px] font-bold uppercase p-1.5 rounded flex items-center gap-1 cursor-pointer truncate ${session.status === 'completed' ? 'bg-green-500/20 text-green-400' : session.status === 'scheduled' ? 'bg-erani-blue/20 text-erani-blue' : 'bg-gray-500/20 text-gray-400'}`}
                                                    >
                                                      {session.status === 'completed' ? <Check className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
                                                      <span className="truncate">{session.title}</span>
                                                    </div>
                                                ))}
                                                {dayOperations.map(op => (
                                                    <div 
                                                      key={op.id} 
                                                      onClick={(e) => { e.stopPropagation(); setSelectedOperation(op); }}
                                                      className="text-[10px] font-bold uppercase p-2 rounded-lg truncate cursor-pointer bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                                                    >
                                                      {op.title}
                                                    </div>
                                                ))}
                                                {dayGoogleEvents.map((event: any) => {
                                                    const config = allEventConfigs[event.id];
                                                    const colorClass = getGoogleEventColorClass(event, config, "small");
                                                    return (
                                                      <div 
                                                        key={event.id}
                                                        onClick={() => setSelectedGoogleEvent(event)}
                                                        className={`text-[9px] font-bold uppercase p-1.5 rounded flex flex-col gap-1 cursor-pointer transition-colors ${colorClass}`}
                                                      >
                                                      <div className="flex items-center gap-1 w-full">
                                                        <CalendarIcon className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{event.summary || "Sin título"}</span>
                                                      </div>
                                                      {event.hangoutLink && (
                                                        <div className="flex items-center gap-1 text-[8px] text-purple-300 mt-0.5">
                                                          <Video className="w-3 h-3 shrink-0" /> Meet Link
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                          </div>
                                        );
                                    })}
                                  </div>
                              </>
                          )}

                          {calendarView === 'week' && (
                              <div className="grid grid-cols-7 gap-4 flex-1 h-full">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const cellDate = new Date(getStartOfWeek(currentDate));
                                    cellDate.setDate(cellDate.getDate() + i);
                                    
                                    const daySessions = activeTab === 'operations' ? [] : activeTab === 'tasks' ? dbSessions.filter(s => {
                                      const d = new Date(s.scheduled_at);
                                      return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear() && s.item_type !== 'session' && !s.calendly_url;
                                    }) : dbSessions.filter(s => {
                                      const d = new Date(s.scheduled_at);
                                      return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear() && (s.item_type === 'session' || !!s.calendly_url);
                                    });
                                    const dayGoogleEvents = activeTab === 'sessions' ? googleEvents.filter(e => {
                                      const d = new Date(e.start?.dateTime || e.start?.date);
                                      return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear();
                                    }) : [];
                                    const dayOperations = activeTab === 'operations' ? operations.filter(o => {
                                      const d = new Date(o.start_date || o.deadline || o.created_at);
                                      return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear();
                                    }) : [];
                                    return (
                                      <div key={`week-day-${i}`} className="bg-foreground/5 border border-glass-border rounded-3xl p-4 flex flex-col gap-3 hover:border-erani-purple/50 transition-all h-full">
                                          <div className="flex flex-col items-center pb-3 border-b border-glass-border shrink-0">
                                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{cellDate.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                              <span className={`text-2xl font-black ${cellDate.getDate() === new Date().getDate() && cellDate.getMonth() === new Date().getMonth() ? 'text-erani-blue' : 'text-foreground'}`}>{cellDate.getDate()}</span>
                                          </div>
                                          <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
                                            {daySessions.map(session => (
                                                <div 
                                                  key={session.id} 
                                                  onClick={() => setSelectedSession(session)}
                                                  className={`text-[10px] font-bold uppercase p-3 rounded-xl flex flex-col gap-2 cursor-pointer ${session.status === 'completed' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : session.status === 'scheduled' ? 'bg-erani-blue/10 border border-erani-blue/20 text-erani-blue' : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'}`}
                                                >
                                                  <div className="flex items-center gap-1">
                                                    {session.status === 'completed' ? <Check className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
                                                    <span className="truncate">{session.title}</span>
                                                  </div>
                                                </div>
                                            ))}
                                            {dayOperations.map(op => (
                                                <div 
                                                  key={op.id} 
                                                  onClick={() => setSelectedOperation(op)}
                                                  className={`text-[10px] font-bold uppercase p-3 rounded-xl flex flex-col gap-2 cursor-pointer bg-emerald-500/10 border border-emerald-500/20 text-emerald-500`}
                                                >
                                                  <div className="flex items-center gap-1">
                                                    <Activity className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{op.title}</span>
                                                  </div>
                                                </div>
                                            ))}
                                            {dayGoogleEvents.map((event: any) => {
                                                const config = allEventConfigs[event.id];
                                                const colorClass = getGoogleEventColorClass(event, config, "medium");
                                                return (
                                                  <div 
                                                    key={event.id}
                                                    onClick={() => setSelectedGoogleEvent(event)}
                                                    className={`text-[10px] font-bold uppercase p-3 rounded-xl flex flex-col gap-2 cursor-pointer transition-colors ${colorClass}`}
                                                  >
                                                  <div className="flex items-center gap-1 w-full">
                                                    <CalendarIcon className="w-3 h-3 shrink-0" />
                                                    <span className="line-clamp-2">{event.summary || "Sin título"}</span>
                                                  </div>
                                                  <span className="text-[8px] text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" /> 
                                                    {new Date(event.start?.dateTime || event.start?.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                  </span>
                                                  {event.hangoutLink && (
                                                    <div className="flex items-center gap-1 text-[9px] text-purple-300 mt-1 bg-purple-500/20 p-1.5 rounded-lg justify-center">
                                                      <Video className="w-3 h-3 shrink-0" /> Unirse
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                      </div>
                                    );
                                })}
                              </div>
                          )}

                          {calendarView === 'day' && (
                              <div className="flex-1 w-full flex flex-col mx-auto h-full px-20">
                                  <div className="bg-foreground/5 border border-glass-border rounded-3xl p-8 flex flex-col h-full">
                                      <div className="flex items-center justify-between pb-6 border-b border-glass-border mb-6 shrink-0">
                                          <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                                              {currentDate.toLocaleDateString('es-ES', { weekday: 'long' })} <span className="text-erani-blue">{currentDate.getDate()}</span>
                                          </h3>
                                      </div>
                                      
                                      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                                          {(() => {
                                              const daySessions = activeTab === 'operations' ? [] : activeTab === 'tasks' ? dbSessions.filter(s => {
                                                const d = new Date(s.scheduled_at);
                                                return d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear() && s.item_type !== 'session' && !s.calendly_url;
                                              }) : dbSessions.filter(s => {
                                                const d = new Date(s.scheduled_at);
                                                return d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear() && (s.item_type === 'session' || !!s.calendly_url);
                                              });
                                              const dayGoogleEvents = activeTab === 'sessions' ? googleEvents.filter(e => {
                                                const d = new Date(e.start?.dateTime || e.start?.date);
                                                return d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                                              }) : [];
                                              const dayOperations = activeTab === 'operations' ? operations.filter(o => {
                                                const d = new Date(o.start_date || o.deadline || o.created_at);
                                                return d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                                              }) : [];
                                              
                                              const allEvents = [...daySessions, ...dayOperations, ...dayGoogleEvents].sort((a: any, b: any) => {
                                                  const dateA = new Date(a.scheduled_at || a.start_date || a.created_at || a.start?.dateTime || a.start?.date).getTime();
                                                  const dateB = new Date(b.scheduled_at || b.start_date || b.created_at || b.start?.dateTime || b.start?.date).getTime();
                                                  return dateA - dateB;
                                              });

                                              if (allEvents.length === 0) {
                                                  return (
                                                      <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                                          <CalendarIcon className="w-12 h-12 mb-4 text-gray-500" />
                                                          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Día libre, sin tareas agendadas.</p>
                                                      </div>
                                                  );
                                              }

                                              return allEvents.map((item: any, idx) => {
                                                  const isGoogle = !!item.start;
                                                  const itemDate = new Date(item.scheduled_at || item.start?.dateTime || item.start?.date);
                                                  
                                                  if (isGoogle) {
                                                      const config = allEventConfigs[item.id];
                                                      const colorClass = getGoogleEventColorClass(item, config, "large");
                                                      return (
                                                        <div 
                                                          key={`google-${item.id}-${idx}`}
                                                          onClick={() => setSelectedGoogleEvent(item)}
                                                          className={`p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${colorClass}`}
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className="bg-background/50 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px]">
                                                                    <span className="text-sm font-black text-foreground">{itemDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-lg font-black uppercase text-foreground">{item.summary || "Sin título"}</span>
                                                                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1 mt-1">
                                                                        <CalendarIcon className="w-3.5 h-3.5" /> Google Calendar
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {item.hangoutLink && (
                                                                <button className="bg-purple-500/20 text-purple-400 px-5 py-3 rounded-xl text-xs uppercase font-black tracking-widest flex items-center gap-2 hover:bg-purple-500 hover:text-white transition-all">
                                                                    <Video className="w-4 h-4" /> Unirse al Meet
                                                                </button>
                                                            )}
                                                        </div>
                                                      );
                                                  } else {
                                                      return (
                                                        <div 
                                                          key={`erani-${item.id}-${idx}`}
                                                          onClick={() => activeTab === 'operations' ? setSelectedOperation(item) : setSelectedSession(item)}
                                                          className={`p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${item.status === 'completed' ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' : 'bg-erani-blue/10 border-erani-blue/30 hover:bg-erani-blue/20'}`}
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className="bg-background/50 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px]">
                                                                    <span className="text-sm font-black text-foreground">{itemDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-lg font-black uppercase text-foreground">{item.title}</span>
                                                                    <span className="text-xs font-bold uppercase tracking-widest text-erani-blue flex items-center gap-1 mt-1">
                                                                        <Clock className="w-3.5 h-3.5" /> Erani Session
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {item.collaborators && item.collaborators.length > 0 && (
                                                                <div className="flex items-center gap-1 -space-x-2 mt-2">
                                                                   {item.collaborators.map((id: string) => {
                                                                      const member = orgMembers.find(m => m.id === id);
                                                                      if (!member) return null;
                                                                      const initials = (member.profiles?.full_name || member.email).substring(0,2).toUpperCase();
                                                                      return (
                                                                         <div key={id} className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-[8px] font-black border border-glass-border shadow-sm z-10 hover:z-20 transition-all" title={member.profiles?.full_name || member.email}>
                                                                            {initials}
                                                                         </div>
                                                                      );
                                                                   })}
                                                                </div>
                                                            )}
                                                        </div>
                                                      );
                                                  }
                                              });
                                          })()}
                                      </div>
                                  </div>
                              </div>
                          )}       
                      </div>
                    </div>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </main>

      {/* Session Detail Side Panel */}
      <AnimatePresence>
         {selectedSession && (
            <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none w-full justify-end">
               <motion.div 
                 initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="relative w-full max-w-2xl bg-background border-l border-glass-border shadow-2xl z-10 flex flex-col gap-6 p-8 overflow-y-auto pointer-events-auto h-full"
               >
                  <button onClick={() => setSelectedSession(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
                     <X className="w-6 h-6" />
                  </button>
                  <div>
                     <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter pr-8">{selectedSession.title}</h3>
                     <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                        <CalendarCheck className="w-4 h-4 text-erani-blue" />
                        {new Date(selectedSession.scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                     </div>
                  </div>

                  <div className="bg-foreground/5 border border-glass-border rounded-2xl p-5 flex flex-col gap-4">
                     <div className="flex flex-col gap-3 pb-4 border-b border-glass-border">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Colaboradores de la Tarea</span>
                        </div>
                        <div className="flex flex-col gap-2">
                           {selectedSession.collaborators && selectedSession.collaborators.length > 0 ? (
                              selectedSession.collaborators.map(id => {
                                 const member = orgMembers.find(m => m.id === id);
                                 if (!member) return null;
                                 const initials = (member.profiles?.full_name || member.email).substring(0,2).toUpperCase();
                                 return (
                                    <div key={id} className="flex gap-4 items-center bg-foreground/5 p-3 rounded-2xl border border-glass-border">
                                       <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xs font-black border border-glass-border shadow-sm overflow-hidden">
                                          {member.profiles?.avatar_url ? (
                                             <img src={member.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                          ) : (
                                             initials
                                          )}
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-sm font-black text-foreground uppercase tracking-tight">{member.profiles?.full_name || member.email}</span>
                                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{member.email}</span>
                                       </div>
                                    </div>
                                 );
                              })
                           ) : (
                              <span className="text-xs text-muted-foreground">Sin colaboradores asignados.</span>
                           )}
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Detalles de la Sesión</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                           {selectedSession.notes || "Sin transcripción o notas registradas."}
                        </p>
                     </div>

                     {/* Atributos Especiales para Tareas / To-Dos */}
                     {(selectedSession.item_type === 'task' || !selectedSession.calendly_url) && (
                        <div className="flex flex-col gap-3 pt-4 border-t border-glass-border">
                           <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Atributos y Vinculaciones de Tarea</span>
                           
                           {/* Etiquetas */}
                           {selectedSession.color_tag && selectedSession.color_tag.split(',').length > 0 && (
                              <div className="flex flex-col gap-1">
                                 <span className="text-[9px] uppercase font-bold text-gray-500">Etiquetas</span>
                                 <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedSession.color_tag.split(',').map((tId: string) => {
                                       const tag = workspaceTags.find(wt => wt.id === tId);
                                       if (!tag) {
                                          const colorDef = COLOR_TAGS.find(c => c.id === tId);
                                          if (!colorDef) return null;
                                          return <span key={tId} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border transition-all ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>{colorDef.label}</span>;
                                       }
                                       const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                                       return <span key={tId} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border transition-all ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>{tag.name}</span>;
                                    })}
                                 </div>
                              </div>
                           )}

                           {/* Deadline */}
                           {selectedSession.deadline && (
                              <div className="flex flex-col gap-1 mt-2">
                                 <span className="text-[9px] uppercase font-bold text-gray-500">Deadline</span>
                                 <span className="text-xs text-foreground font-medium">{new Date(selectedSession.deadline).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </div>
                           )}

                           {/* Proyecto vinculado */}
                           {selectedSession.audit_id && (
                              <div className="flex flex-col gap-1 mt-2">
                                 <span className="text-[9px] uppercase font-bold text-gray-500">Proyecto Vinculado</span>
                                 <span className="text-xs text-foreground font-medium">{audits.find(a => a.id === selectedSession.audit_id)?.metadata?.name || 'Proyecto Desconocido'}</span>
                              </div>
                           )}

                           {/* Sesión Google vinculada */}
                           {selectedSession.google_event_id && (
                              <div className="flex flex-col gap-1 mt-2">
                                 <span className="text-[9px] uppercase font-bold text-gray-500">Sesión Vinculada</span>
                                 <span className="text-xs text-foreground font-medium line-clamp-1">{googleEvents.find(e => e.id === selectedSession.google_event_id)?.summary || 'Sesión Desconocida'}</span>
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  {selectedSession.ai_summary && (
                     <div className="bg-erani-purple/10 border border-erani-purple/30 rounded-2xl p-5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-erani-purple flex items-center gap-2 mb-2">
                           <Bot className="w-3 h-3" /> Resumen y To-Dos (ERANI AI)
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                           {selectedSession.ai_summary}
                        </p>
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4 pb-20">
                     {(!selectedSession.item_type || selectedSession.item_type === 'session') && selectedSession.calendly_url && (
                        <>
                           <button 
                             onClick={() => {
                                setInviteModalData({ isOpen: true, sessionId: selectedSession.id, meetUrl: '' });
                             }}
                             className="bg-erani-blue/10 border border-erani-blue/30 text-erani-blue py-3 rounded-xl text-xs uppercase font-black hover:bg-erani-blue hover:text-white transition-all flex items-center justify-center gap-2"
                           >
                             <Video className="w-4 h-4" /> Invitar ERANI AI
                           </button>
                           <button 
                             onClick={() => window.open(selectedSession.calendly_url || "https://meet.google.com", "_blank")}
                             className="bg-foreground/10 border border-glass-border text-foreground py-3 rounded-xl text-xs uppercase font-black hover:bg-foreground/20 transition-all flex items-center justify-center gap-2"
                           >
                             Unirse a la Llamada
                           </button>
                        </>
                     )}
                     <button 
                       onClick={() => notifyCollaborators(selectedSession, false)}
                       disabled={isNotifying}
                       className={`${(!selectedSession.item_type || selectedSession.item_type === 'session') ? 'col-span-2' : 'col-span-2'} bg-erani-purple/10 border border-erani-purple/30 text-erani-purple py-3 rounded-xl text-xs uppercase font-black hover:bg-erani-purple hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                     >
                       {isNotifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Notificar Colaboradores por Email"}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* SELECTED OPERATION LATERAL PANEL */}
      <AnimatePresence>
         {selectedOperation && (
            <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none w-full justify-end">
               <motion.div 
                 initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="relative w-full max-w-2xl bg-background border-l border-glass-border shadow-2xl z-10 flex flex-col gap-6 p-8 overflow-y-auto pointer-events-auto h-full"
               >
                  <button onClick={() => setSelectedOperation(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
                     <X className="w-6 h-6" />
                  </button>
                  <div>
                     <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter pr-8">{selectedOperation.title}</h3>
                     <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                        <CalendarCheck className="w-4 h-4 text-emerald-500" />
                        {new Date(selectedOperation.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                     </div>
                  </div>

                  <div className="bg-foreground/5 border border-glass-border rounded-2xl p-5 flex flex-col gap-4">
                     <div className="flex flex-col gap-3 pb-4 border-b border-glass-border">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Responsables</span>
                        </div>
                        <div className="flex flex-col gap-2">
                           {selectedOperation.responsables && selectedOperation.responsables.length > 0 ? (
                              selectedOperation.responsables.map((id: string) => {
                                 const member = orgMembers.find(m => m.id === id);
                                 if (!member) return null;
                                 const initials = (member.profiles?.full_name || member.email).substring(0,2).toUpperCase();
                                 return (
                                    <div key={id} className="flex gap-4 items-center bg-foreground/5 p-3 rounded-2xl border border-glass-border">
                                       <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xs font-black border border-glass-border shadow-sm overflow-hidden">
                                          {member.profiles?.avatar_url ? (
                                             <img src={member.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                          ) : (
                                             initials
                                          )}
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-sm font-black text-foreground uppercase tracking-tight">{member.profiles?.full_name || member.email}</span>
                                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{member.email}</span>
                                       </div>
                                    </div>
                                 );
                              })
                           ) : (
                              <span className="text-xs text-muted-foreground">Sin responsables asignados.</span>
                           )}
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Proyecto</span>
                        <div className="text-sm font-bold text-foreground">
                           {audits.find(a => a.id === selectedOperation.project_id)?.metadata?.name || audits.find(a => a.id === selectedOperation.project_id)?.title || 'Ninguno'}
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 pt-4 border-t border-glass-border">
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Etiquetas</span>
                        <div className="flex gap-1 flex-wrap">
                           {selectedOperation.tags && selectedOperation.tags.length > 0 ? selectedOperation.tags.map((tId: string) => {
                              const tag = workspaceTags.find(wt => wt.id === tId);
                              if (!tag) {
                                 const colorDef = COLOR_TAGS.find(c => c.id === tId);
                                 if (!colorDef) return <span key={tId} className="px-2 py-0.5 rounded border border-glass-border text-[10px] font-black uppercase tracking-widest bg-foreground/10 text-foreground">{tId}</span>;
                                 return <span key={tId} className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>{colorDef.label}</span>;
                              }
                              const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                              return <span key={tId} className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${colorDef.bgSoft} ${colorDef.text} ${colorDef.border}`}>{tag.name}</span>;
                           }) : <span className="text-[10px] text-muted-foreground">--</span>}
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 pt-4 border-t border-glass-border">
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Estado</span>
                        <div>
                           <span className={`px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-widest ${selectedOperation.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : selectedOperation.status === 'in_progress' ? 'bg-erani-blue/10 text-erani-blue border-erani-blue/30' : 'bg-orange-500/10 text-orange-500 border-orange-500/30'}`}>
                              {selectedOperation.status === 'todo' ? 'Por Hacer' : selectedOperation.status === 'in_progress' ? 'En Progreso' : 'Completado'}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                     <button 
                        onClick={() => {
                           setEditingTaskId(selectedOperation.id);
                           setFormData({
                              title: selectedOperation.title,
                              notes: selectedOperation.notes || "",
                              colorTags: selectedOperation.tags || [],
                              auditId: selectedOperation.project_id || "",
                              collectionId: "",
                              collaborators: selectedOperation.responsables || [],
                              startDate: selectedOperation.start_date || "",
                              deadline: selectedOperation.deadline || "",
                              googleEventId: "",
                              status: selectedOperation.status || "todo"
                           });
                           setIsModalOpen(true);
                           setSelectedOperation(null);
                        }}
                        className="bg-erani-blue/10 border border-erani-blue/30 text-erani-blue py-3 rounded-xl text-xs uppercase font-black hover:bg-erani-blue hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                        <Edit2 className="w-4 h-4" /> Editar Operación
                     </button>
                     <button 
                       onClick={() => {
                          setSelectedOperation(null);
                          handleDuplicateOperation(selectedOperation);
                       }}
                       className="bg-foreground/10 border border-glass-border text-foreground py-3 rounded-xl text-xs uppercase font-black hover:bg-foreground/20 transition-all flex items-center justify-center gap-2"
                     >
                       <Copy className="w-4 h-4" /> Duplicar Operación
                     </button>
                     <button 
                       onClick={() => {
                          setOperationToDelete(selectedOperation.id);
                       }}
                       className="bg-red-500/10 border border-red-500/30 text-red-500 py-3 rounded-xl text-xs uppercase font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                       <Trash2 className="w-4 h-4" /> Eliminar Operación
                     </button>
                  </div>
                  
                  <button 
                    onClick={() => notifyOperationsCollaborators(selectedOperation, true)}
                    disabled={isNotifying}
                    className="col-span-2 bg-erani-purple/10 border border-erani-purple/30 text-erani-purple py-3 rounded-xl text-xs uppercase font-black hover:bg-erani-purple hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 pb-safe mb-20"
                  >
                    {isNotifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Notificar Manualmente"}
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* NEW TO-DO LATERAL PANEL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none w-full justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-background/60 pointer-events-auto"
            />
            <motion.div 
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-background border-l border-glass-border shadow-2xl flex flex-col gap-6 p-8 overflow-y-auto pointer-events-auto h-full"
            >
               <button onClick={() => { setIsModalOpen(false); setEditingTaskId(null); setFormData({ title: "", notes: "", colorTags: [], auditId: "", collectionId: "", collaborators: [], startDate: "", deadline: "", googleEventId: "", status: "todo" }); }} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-foreground transition-colors bg-foreground/5 rounded-full">
                  <X className="w-5 h-5" />
               </button>

               <div className="flex flex-col gap-2 mt-4">
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                     {activeTab === 'operations' ? (editingTaskId ? "Editar Operación" : "Nueva Operación") : (editingTaskId ? "Editar To-Do / Tarea" : "Nuevo To-Do / Tarea")}
                  </h2>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                     {activeTab === 'operations' ? (editingTaskId ? "Edita los detalles de la operación" : "Registra una nueva operación para tus auditorías") : (editingTaskId ? "Edita los detalles o reprograma la tarea" : "Agrega un punto a tratar o acción pendiente")}
                  </p>
               </div>

               <form onSubmit={handleCreateTodo} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Título de la Tarea</label>
                     <input 
                        required
                        placeholder="Ej: Revisar documentación financiera"
                        className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-blue transition-colors text-foreground"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                     />
                  </div>

                  {activeTab !== 'operations' && (
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Notas o Descripción</label>
                        <textarea 
                           rows={3}
                           placeholder="Detalles sobre este punto..."
                           className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-blue transition-colors text-foreground custom-scrollbar resize-none"
                           value={formData.notes}
                           onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                     </div>
                  )}

                  {activeTab === 'operations' && (
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Fecha de Inicio</label>
                        <input 
                           type="datetime-local"
                           className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-blue transition-colors text-foreground [color-scheme:dark]"
                           value={formData.startDate ? new Date(new Date(formData.startDate).getTime() - new Date(formData.startDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                           onChange={e => setFormData({...formData, startDate: new Date(e.target.value).toISOString()})}
                        />
                     </div>
                  )}

                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">Deadline / Fecha Límite</label>
                     <input 
                        type="datetime-local"
                        className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-blue transition-colors text-foreground [color-scheme:dark]"
                        value={formData.deadline ? new Date(new Date(formData.deadline).getTime() - new Date(formData.deadline).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                        onChange={e => setFormData({...formData, deadline: new Date(e.target.value).toISOString()})}
                     />
                  </div>

                  <div className="flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Etiquetas de Proyecto</label>
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
                              className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm flex items-center justify-between cursor-pointer text-muted-foreground"
                           >
                              {formData.colorTags.length > 0 ? (
                                 <div className="flex gap-2 flex-wrap">
                                    {formData.colorTags.map((tagId: string) => {
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
                                          const isSelected = formData.colorTags.includes(t.id);
                                          const colorDef = COLOR_TAGS.find(c => c.id === t.color) || COLOR_TAGS[0];
                                          return (
                                             <div 
                                                key={t.id} 
                                                onClick={() => {
                                                   setFormData({...formData, colorTags: isSelected ? formData.colorTags.filter((id: string) => id !== t.id) : [...formData.colorTags, t.id]});
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

                  <CustomSelect 
                     label="Proyecto (Auditoría)"
                     value={formData.auditId}
                     onChange={(val: string) => setFormData({...formData, auditId: val})}
                     placeholder="Sin Proyecto Vinculado"
                     options={audits.map(a => ({ value: a.id, label: a.metadata?.name || 'Proyecto Sin Nombre' }))}
                     isOpen={openDropdown === 'todoAudit'}
                     toggleOpen={() => setOpenDropdown(openDropdown === 'todoAudit' ? null : 'todoAudit')}
                  />

                  {activeTab === 'operations' && (
                     <CustomSelect 
                        label="Estado de la Operación"
                        value={formData.status}
                        onChange={(val: string) => setFormData({...formData, status: val})}
                        placeholder="Seleccionar Estado"
                        options={[
                           { value: 'todo', label: 'Por Hacer' },
                           { value: 'in_progress', label: 'En Progreso' },
                           { value: 'completed', label: 'Completado' }
                        ]}
                        isOpen={openDropdown === 'todoStatus'}
                        toggleOpen={() => setOpenDropdown(openDropdown === 'todoStatus' ? null : 'todoStatus')}
                     />
                  )}

                  {activeTab !== 'operations' && (
                     <CustomSelect 
                        label="Sesión Vinculada (Google Calendar)"
                        value={formData.googleEventId}
                        onChange={(val: string) => setFormData({...formData, googleEventId: val})}
                        placeholder="No vincular a ninguna sesión"
                        options={googleEvents.map(e => ({ value: e.id, label: e.summary || 'Sesión sin nombre' }))}
                        isOpen={openDropdown === 'todoGoogleEvent'}
                        toggleOpen={() => setOpenDropdown(openDropdown === 'todoGoogleEvent' ? null : 'todoGoogleEvent')}
                     />
                  )}

                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest ml-1">
                        {activeTab === 'operations' ? 'Responsables de Operación' : 'Colaboradores a Notificar'}
                     </label>
                     <div className="flex flex-col gap-2 bg-foreground/5 border border-glass-border rounded-xl p-3 max-h-40 overflow-y-auto">
                        {orgMembers.length === 0 && <span className="text-xs text-muted-foreground p-2">No hay miembros en la organización.</span>}
                        {orgMembers.map(m => {
                           const isSelected = (formData.collaborators || []).includes(m.id);
                           return (
                           <div key={m.id} 
                                className={`flex items-center gap-3 cursor-pointer p-2 hover:bg-foreground/5 rounded-lg transition-colors ${isSelected ? 'bg-erani-blue/10' : ''}`}
                                onClick={() => {
                                    const currentCols = formData.collaborators || [];
                                    if (!isSelected) {
                                       setFormData({...formData, collaborators: [...currentCols, m.id]});
                                    } else {
                                       setFormData({...formData, collaborators: currentCols.filter(id => id !== m.id)});
                                    }
                                }}
                           >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-erani-blue text-white shadow-[0_0_10px_rgba(0,85,160,0.4)]' : 'bg-foreground/10 text-muted-foreground hover:bg-foreground/20'}`}>
                                 {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-foreground">{m.profiles?.full_name || m.email}</span>
                                 <span className="text-[10px] text-muted-foreground">{m.email}</span>
                              </div>
                           </div>
                           );
                        })}
                     </div>
                  </div>

                  <button 
                    disabled={isSaving}
                    className="button-premium w-full py-4 mt-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                     {activeTab === 'operations' ? 'Guardar Operación' : 'Guardar Tarea'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Event Detail Side Panel */}
      <AnimatePresence>
         {selectedGoogleEvent && (
            <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none w-full justify-end">
               <motion.div 
                 initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="relative w-full max-w-2xl bg-background border-l border-glass-border shadow-2xl flex flex-col gap-6 p-8 overflow-y-auto pointer-events-auto h-full"
               >
                  <button onClick={() => setSelectedGoogleEvent(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
                     <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col gap-2 pr-8">
                     <div className="flex items-center gap-2 text-erani-blue mb-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Google Calendar</span>
                     </div>
                     <h2 className="text-2xl font-black text-foreground">{selectedGoogleEvent.summary || "Sin título"}</h2>
                     <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedGoogleEvent.start?.dateTime || selectedGoogleEvent.start?.date).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     </div>
                  </div>

                  {selectedGoogleEvent.description && (
                     <div className="bg-foreground/5 border border-glass-border rounded-2xl p-5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2 block flex items-center gap-2">
                           <FileText className="w-3 h-3" /> Detalles
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                           {selectedGoogleEvent.description.replace(new RegExp("(<([^>]+)>)", "gi"), "")}
                        </p>
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 my-6">
                     <button 
                       onClick={() => {
                          if(selectedGoogleEvent.hangoutLink) { 
                             setMeetUrl(selectedGoogleEvent.hangoutLink); 
                             inviteRecallBot("google-" + selectedGoogleEvent.id); 
                          } else {
                             setErrorToast("Esta junta no tiene un enlace de Google Meet activo.");
                             setTimeout(() => setErrorToast(null), 3000);
                          }
                       }}
                       className="bg-erani-blue/10 border border-erani-blue/30 text-erani-blue py-3 rounded-xl text-xs uppercase font-black hover:bg-erani-blue hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                       <Video className="w-4 h-4" /> Invitar ERANI AI
                     </button>
                     {selectedGoogleEvent.hangoutLink ? (
                         <button 
                           onClick={() => window.open(selectedGoogleEvent.hangoutLink, "_blank")}
                           className="bg-foreground/10 border border-glass-border text-foreground py-3 rounded-xl text-xs uppercase font-black hover:bg-foreground/20 transition-all flex items-center justify-center gap-2"
                         >
                           Unirse a Google Meet
                         </button>
                     ) : (
                         <button 
                           disabled
                           className="bg-foreground/5 border border-glass-border text-muted-foreground py-3 rounded-xl text-xs uppercase font-black cursor-not-allowed flex items-center justify-center gap-2"
                         >
                           Sin link de Meet
                         </button>
                     )}
                     <button 
                       onClick={() => notifyCollaborators(selectedGoogleEvent, true)}
                       disabled={isNotifying}
                       className="md:col-span-2 bg-erani-purple/10 border border-erani-purple/30 text-erani-purple py-3 rounded-xl text-xs uppercase font-black hover:bg-erani-purple hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                       {isNotifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Notificar Invitados por Email"}
                     </button>
                  </div>

                  {/* Configuraciones Adicionales de Erani para este Evento de Google */}
                  <div className="flex flex-col gap-4 border-t border-glass-border pt-4 mt-2">
                     <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2">
                            Configuración de Tareas y Vinculación
                        </span>
                        <div className="flex items-center gap-2">
                           {[
                             { id: "gray", bg: "bg-gray-500" },
                             { id: "erani-blue", bg: "bg-erani-blue" },
                             { id: "erani-purple", bg: "bg-erani-purple" },
                             { id: "emerald", bg: "bg-emerald-500" },
                             { id: "amber", bg: "bg-amber-500" },
                             { id: "coral", bg: "bg-erani-coral" }
                           ].map(c => (
                             <button
                               key={c.id}
                               onClick={() => handleConfigChange({...googleEventConfig, colorTag: c.id})}
                               className={`w-4 h-4 rounded-full ${c.bg} transition-all border-2 ${googleEventConfig.colorTag === c.id ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                               title={`Etiqueta de Color`}
                             />
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-2">
                        <CustomSelect 
                           label="Proyecto"
                           value={googleEventConfig.auditId}
                           onChange={(val: string) => handleConfigChange({...googleEventConfig, auditId: val})}
                           placeholder="Sin Proyecto"
                           options={audits.map(a => ({ value: a.id, label: a.metadata?.name || 'Proyecto' }))}
                           isOpen={openDropdown === 'googleAudit'}
                           toggleOpen={() => setOpenDropdown(openDropdown === 'googleAudit' ? null : 'googleAudit')}
                        />
                        <CustomSelect 
                           label="Colección"
                           value={googleEventConfig.collectionId}
                           onChange={(val: string) => handleConfigChange({...googleEventConfig, collectionId: val})}
                           placeholder="Sin Colección"
                           options={collections.map(c => ({ value: c.id, label: c.name }))}
                           isOpen={openDropdown === 'googleCollection'}
                           toggleOpen={() => setOpenDropdown(openDropdown === 'googleCollection' ? null : 'googleCollection')}
                        />
                     </div>

                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Colaboradores de la Organización a Notificar</label>
                        <div className="flex flex-col gap-2 bg-foreground/5 border border-glass-border rounded-xl p-3 max-h-32 overflow-y-auto">
                           {orgMembers.length === 0 && <span className="text-xs text-muted-foreground">Sin miembros.</span>}
                           {orgMembers.map(m => {
                              const isSelected = (googleEventConfig.collaborators || []).includes(m.id);
                              return (
                              <div key={m.id} 
                                   className={`flex items-center gap-3 cursor-pointer p-2 hover:bg-foreground/5 rounded-lg transition-colors ${isSelected ? 'bg-erani-blue/10' : ''}`}
                                   onClick={() => {
                                         const currentCols = googleEventConfig.collaborators || [];
                                         if (isSelected) {
                                            handleConfigChange({...googleEventConfig, collaborators: currentCols.filter(id => id !== m.id)});
                                         } else {
                                            handleConfigChange({...googleEventConfig, collaborators: [...currentCols, m.id]});
                                         }
                                   }}
                              >
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-erani-blue text-white shadow-[0_0_10px_rgba(0,85,160,0.4)]' : 'bg-foreground/10 text-muted-foreground hover:bg-foreground/20'}`}>
                                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">{m.profiles?.full_name || m.email}</span>
                                    <span className="text-[10px] text-muted-foreground">{m.email}</span>
                                 </div>
                              </div>
                              );
                           })}
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                     <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Tareas Vinculadas a esta Sesión</label>
                     <div className="flex flex-col gap-2 bg-foreground/5 border border-glass-border rounded-xl p-3">
                        {dbSessions.filter(s => s.google_event_id === selectedGoogleEvent.id).length === 0 ? (
                           <span className="text-xs text-muted-foreground">No hay tareas vinculadas.</span>
                        ) : (
                           dbSessions.filter(s => s.google_event_id === selectedGoogleEvent.id).map(task => (
                              <div key={task.id} className="flex flex-col gap-1 p-3 bg-background/50 rounded-lg border border-glass-border">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${task.color_tag ? 'bg-' + task.color_tag : 'bg-erani-blue'}`} />
                                    <span className="text-sm font-bold">{task.title}</span>
                                 </div>
                                 <span className="text-[10px] text-muted-foreground line-clamp-1 ml-4">{task.notes || 'Sin descripción'}</span>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>

       {/* Invite AI Modal */}
       <AnimatePresence>
         {inviteModalData.isOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setInviteModalData({ isOpen: false, sessionId: '', meetUrl: '' })}
               className="absolute inset-0 bg-background/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-md bg-background border border-glass-border p-8 flex flex-col gap-6 shadow-2xl relative rounded-[2rem] z-10"
             >
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Vincular ERANI AI</h3>
                <p className="text-sm text-muted-foreground">Pega el enlace de Google Meet de la sesión para invitar al agente forense.</p>
                <input 
                   autoFocus
                   placeholder="https://meet.google.com/xxx-xxxx-xxx"
                   className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-blue transition-colors text-foreground"
                   value={inviteModalData.meetUrl}
                   onChange={e => setInviteModalData({...inviteModalData, meetUrl: e.target.value})}
                />
                <button 
                   onClick={() => {
                      if (inviteModalData.meetUrl) {
                         setMeetUrl(inviteModalData.meetUrl);
                         inviteRecallBot(inviteModalData.sessionId);
                         setInviteModalData({ isOpen: false, sessionId: '', meetUrl: '' });
                      }
                   }}
                   className="bg-erani-blue text-white py-3 rounded-xl text-xs uppercase font-black tracking-widest hover:bg-blue-600 transition-all"
                >
                   Invitar a la Sesión
                </button>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Success Toast */}
       <AnimatePresence>
          {successToast && (
             <motion.div 
               initial={{ opacity: 0, y: 50, x: "-50%" }}
               animate={{ opacity: 1, y: 0, x: "-50%" }}
               exit={{ opacity: 0, y: 50, x: "-50%" }}
               className="fixed bottom-10 left-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2"
             >
               <Check className="w-4 h-4" />
               {successToast}
             </motion.div>
          )}
       </AnimatePresence>

       {/* Error Toast */}
       <AnimatePresence>
          {errorToast && (
             <motion.div 
               initial={{ opacity: 0, y: 50, x: "-50%" }}
               animate={{ opacity: 1, y: 0, x: "-50%" }}
               exit={{ opacity: 0, y: 50, x: "-50%" }}
               className="fixed bottom-10 left-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl"
             >
               {errorToast}
             </motion.div>
          )}
       </AnimatePresence>

       {/* Custom Delete Modal */}
       <AnimatePresence>
         {sessionToDelete && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSessionToDelete(null)}
               className="absolute inset-0 bg-background/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-sm bg-background border border-glass-border p-8 flex flex-col gap-6 shadow-2xl relative rounded-[2rem] z-10 text-center items-center justify-center"
             >
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2">
                    <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">¿Eliminar Tarea?</h3>
                <p className="text-sm text-muted-foreground">Esta acción es permanente y no se puede deshacer.</p>
                
                <div className="flex items-center gap-3 w-full mt-2">
                    <button 
                       onClick={() => setSessionToDelete(null)}
                       className="flex-1 bg-foreground/5 border border-glass-border text-foreground py-3 rounded-xl text-xs uppercase font-black hover:bg-foreground/10 transition-all"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={confirmDeleteSession}
                       className="flex-1 bg-red-500/10 border border-red-500/30 text-red-500 py-3 rounded-xl text-xs uppercase font-black hover:bg-red-500 hover:text-white transition-all"
                    >
                       Eliminar
                    </button>
                </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Custom Delete Modal for Operations */}
       <AnimatePresence>
         {operationToDelete && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setOperationToDelete(null)}
               className="absolute inset-0 bg-background/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-sm bg-background border border-glass-border p-8 flex flex-col gap-6 shadow-2xl relative rounded-[2rem] z-10 text-center items-center justify-center"
             >
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2">
                    <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">¿Eliminar Operación?</h3>
                <p className="text-sm text-muted-foreground">Esta acción es permanente y no se puede deshacer.</p>
                
                <div className="flex items-center gap-3 w-full mt-2">
                    <button 
                       onClick={() => setOperationToDelete(null)}
                       className="flex-1 bg-foreground/5 border border-glass-border text-foreground py-3 rounded-xl text-xs uppercase font-black hover:bg-foreground/10 transition-all"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => handleDeleteOperation(operationToDelete)}
                       className="flex-1 bg-red-500/10 border border-red-500/30 text-red-500 py-3 rounded-xl text-xs uppercase font-black hover:bg-red-500 hover:text-white transition-all"
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

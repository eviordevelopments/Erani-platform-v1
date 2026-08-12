"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { pdf } from '@react-pdf/renderer';
import ForensicPDFDocument from '@/components/pdf/ForensicPDFDocument';
import Sidebar from "@/components/Sidebar";
import { 
  Plus, 
  Folder, 
  Settings, 
  Trash2, 
  Search, 
  Shield, 
  History, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  UploadCloud,
  X,
  AlertTriangle,
  Database,
  ArrowLeft,
  ArrowDown,
  Copy,
  Edit2,
  Calendar,
  Layers,
  Cpu,
  Target,
  Briefcase,
  BarChart3,
  Globe,
  Users,
  Timer,
  Cloud,
  Lock,
  Zap,
  TrendingUp,
  ArrowUpRight,
  BarChart,
  FileJson,
  Server,
  Gem,
  Tag,
  ChevronDown,
  User,
  HelpCircle,
  ArrowRight,
  SlidersHorizontal
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { auditLogger } from "@/lib/auditLogger";
import { useRef } from "react";
import { ForensicReport } from "@/types/forensic";
import DonutChart from "@/components/DonutChart";
import RealtimeLogTerminal from "@/components/RealtimeLogTerminal";
import InAppTour from "@/components/InAppTour";
import { supabase } from "@/lib/supabaseClient";

interface ForensicFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "ingesting" | "completed" | "error";
  progress: number;
  error?: string;
  path?: string;
}

interface ProjectTag {
  id: string;
  label: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  icon?: string;
  size: "small" | "medium" | "large";
  tags?: ProjectTag[];
  files: ForensicFile[];
  status: "idle" | "processing" | "completed";
  createdAt: string;
  serverRegion: string;
  teamAccess: string[];
  isTemporal: boolean;
  expirationHours: number;
  settings: {
    allowStorage: boolean;
    historicalContext: boolean;
    aiModel: string;
    aiTemperature: number;
  };
  collection_id?: string | null;
  auditSessions?: AuditSession[];
}

export interface AuditSession {
  id: string;
  project_id: string;
  name: string;
  status: "pending" | "processing" | "completed";
  created_at: string;
  updated_at: string;
  files?: ForensicFile[];
}

const PROJECT_SIZES = {
  small: { label: "Pequeño", description: "25 registros o menos", color: "erani-blue" },
  medium: { label: "Mediano", description: "25 a 50 registros", color: "erani-purple" },
  large: { label: "Grande", description: "75 registros o más", color: "erani-coral" }
};

const COLOR_TAGS = [
  { id: 'erani-blue', label: 'Azul', bg: 'bg-erani-blue', border: 'border-erani-blue/30', text: 'text-erani-blue', bgSoft: 'bg-erani-blue/10' },
  { id: 'erani-purple', label: 'Morado', bg: 'bg-erani-purple', border: 'border-erani-purple/30', text: 'text-erani-purple', bgSoft: 'bg-erani-purple/10' },
  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-500', bgSoft: 'bg-emerald-500/10' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-500', bgSoft: 'bg-amber-500/10' },
  { id: 'coral', label: 'Coral', bg: 'bg-erani-coral', border: 'border-erani-coral/30', text: 'text-erani-coral', bgSoft: 'bg-erani-coral/10' },
  { id: 'gray', label: 'Gris', bg: 'bg-gray-500', border: 'border-gray-500/30', text: 'text-gray-500', bgSoft: 'bg-gray-500/10' }
];

export default function AuditProtocolPage() {
  const { isSidebarCollapsed, uploadedFiles, storageStats } = useDashboard();
  const { user, profile, updateErisBalance, org } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"manage" | "config" | "suite" | "evidence" | "processing" | "report">("manage");
  const [selectedAuditSessionId, setSelectedAuditSessionId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const activeProject = projects.find(p => p.id === activeProjectId);
  const [hasExistingReport, setHasExistingReport] = useState<boolean>(false);
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("all");
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [isSizeFilterOpen, setIsSizeFilterOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectingIconFor, setSelectingIconFor] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tagColor, setTagColor] = useState("erani-blue");
  const [isTagsEnabled, setIsTagsEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actualFiles, setActualFiles] = useState<Record<string, File[]>>({});
  const [uploadedPaths, setUploadedPaths] = useState<Record<string, string[]>>({});
  
  // New Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceTags, setWorkspaceTags] = useState<any[]>([]);
  const [collectionsData, setCollectionsData] = useState<any[]>([]);
  const [acceptedTC, setAcceptedTC] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  useEffect(() => {
    if (activeProjectId) {
      supabase.from('forensic_reports').select('id').eq('project_id', activeProjectId).single().then(({ data, error }) => {
        setHasExistingReport(!!data && !error);
      });
    } else {
      setHasExistingReport(false);
    }
  }, [activeProjectId]);

  // Processing Animation State
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [analysisLogs, setAnalysisLogs] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([]);
  const [analysisError, setAnalysisError] = useState<{ message: string; stage: string } | null>(null);
  const [inferenceStats, setInferenceStats] = useState({ memory: 0.8, params: 12.1 });
  
  const ICON_LIBRARY = [
    { id: 'folder', icon: Folder },
    { id: 'shield', icon: Shield },
    { id: 'database', icon: Database },
    { id: 'layers', icon: Layers },
    { id: 'cpu', icon: Cpu },
    { id: 'target', icon: Target },
    { id: 'briefcase', icon: Briefcase },
    { id: 'barchart', icon: BarChart3 },
  ];

  const PROCESSING_STEPS = [
    { id: "METADATA_PARSING", label: "Consolidación de Auditorías y Metadata", icon: FileText },
    { id: "RAG_RETRIEVAL", label: "Triangulación de Logs Operativos (RAG)", icon: Layers },
    { id: "MODEL_INIT", label: "Inicializando Motor de Inferencia ERANI V1", icon: Cpu },
    { id: "GEMINI_INFERENCE", label: "Análisis Forense con Inferencia Estratégica", icon: Database },
    { id: "REPORT_PERSISTENCE", label: "Generando Reporte Ejecutivo de Alta Fidelidad", icon: FileJson }
  ];

  const SETUP_TOUR_STEPS = [
    {
      targetId: "tour-audit-name",
      title: "Nombre del Proyecto",
      content: "Asigna un nombre claro a tu misión forense para identificarla fácilmente en el futuro.",
      position: "bottom" as const
    },
    {
      targetId: "tour-audit-size",
      title: "Volumen Estimado",
      content: "Selecciona el volumen de registros a auditar. Esto nos ayuda a asignar los recursos computacionales necesarios.",
      position: "bottom" as const
    },
    {
      targetId: "tour-audit-region",
      title: "Región del Servidor",
      content: "Elige la ubicación geográfica de nuestros servidores donde se procesará tu información.",
      position: "bottom" as const
    },
    {
      targetId: "tour-audit-team",
      title: "Acceso y Colaboradores",
      content: "Agrega miembros de tu organización. Por seguridad, todos los proyectos son privados por defecto (Solo tú).",
      position: "bottom" as const
    },
    {
      targetId: "tour-audit-policies",
      title: "Privacidad y Modo Temporal",
      content: "Determina si el proyecto tendrá persistencia en la nube o si se autodestruirá configurando un temporizador.",
      position: "bottom" as const
    },
    {
      targetId: "tour-audit-ai",
      title: "Calibración IA",
      content: "Controla qué modelo de IA forense usar y ajusta la 'Creatividad' (temperatura). Usa un valor bajo para hallazgos exactos.",
      position: "top" as const
    },
    {
      targetId: "tour-audit-submit",
      title: "¡Todo Listo!",
      content: "Haz clic aquí cuando estés listo para crear el proyecto y comenzar a subir tu evidencia (Logs, CSV, Reportes).",
      position: "top" as const
    }
  ];

const getModelLabel = (modelId?: string) => {
  switch (modelId) {
    case 'gemini-2.5-flash-lite': return 'Erani Engine 2.5 Flash-Lite (Gemini)';
    case 'gemini-2.5-pro': return 'Erani Engine 2.5 Pro (Gemini)';
    case 'openrouter/deepseek-chat': return 'OpenRouter DeepSeek V3';
    case 'openrouter/deepseek-r1': return 'OpenRouter DeepSeek R1';
    case 'openrouter/claude-3.5-sonnet': return 'OpenRouter Claude 3.5 Sonnet';
    case 'openrouter/gpt-4o': return 'OpenRouter GPT-4o';
    case 'openrouter/llama-3.3-70b': return 'OpenRouter Llama 3.3 70B';
    case 'gemini-2.5-flash':
    default:
      return 'Erani Engine 2.5 Flash (Gemini)';
  }
};

const getModelShortLabel = (modelId?: string) => {
  if (!modelId) return 'Flash';
  if (modelId.startsWith('openrouter/')) {
    const modelName = modelId.replace('openrouter/', '');
    if (modelName.includes('deepseek-r1')) return 'OR: DeepSeek R1';
    if (modelName.includes('deepseek')) return 'OR: DeepSeek V3';
    if (modelName.includes('claude')) return 'OR: Claude 3.5';
    if (modelName.includes('gpt-4o')) return 'OR: GPT-4o';
    if (modelName.includes('llama')) return 'OR: Llama 3.3';
    return `OR: ${modelName}`;
  }
  if (modelId === 'gemini-2.5-flash-lite') return 'Flash-Lite';
  if (modelId === 'gemini-2.5-pro') return 'Pro';
  return 'Flash';
};

  const handleChangeIcon = (projectId: string, iconId: string) => {
      setProjects(projects.map(p => p.id === projectId ? { ...p, icon: iconId } : p));
      setSelectingIconFor(null);
  };

  const toggleProjectSetting = (projectId: string, setting: 'allowStorage' | 'historicalContext' | 'aiModel' | 'aiTemperature', value?: any) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updated = { ...p, settings: { ...p.settings, [setting]: value !== undefined ? value : !p.settings[setting as keyof typeof p.settings] } };
        // Sync to DB
        syncProjectToDB(updated);
        return updated;
      }
      return p;
    }));
  };

  const syncProjectToDB = async (project: Project) => {
    if (!profile?.organization_id) return;
    
    const { error } = await supabase
      .from('audits')
      .upsert({
        id: project.id.includes('-') && project.id.length > 20 ? project.id : undefined, // Check if it's a UUID
        organization_id: profile.organization_id,
        created_by: profile.id,
        status: project.status,
        metadata: {
          ...project,
          // Avoid circular or redundant data if needed
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) console.error("Error syncing project to DB:", error);
  };

  // New Project Form
  const [newProject, setNewProject] = useState({
    name: "",
    icon: "folder",
    size: "small" as "small" | "medium" | "large",
    allowStorage: true,
    historicalContext: true,
    serverRegion: "us-west",
    teamAccess: [] as string[],
    isTemporal: false,
    expirationHours: 24,
    aiModel: "gemini-2.5-flash",
    aiTemperature: 0.7,
    tags: [] as ProjectTag[]
  });

  const loadProjectIntoConfig = (project: Project) => {
    setNewProject({
      name: project.name,
      icon: (project as any).icon || "folder",
      size: project.size,
      allowStorage: project.settings.allowStorage,
      historicalContext: project.settings.historicalContext,
      serverRegion: project.serverRegion || "us-west",
      teamAccess: project.teamAccess || [],
      isTemporal: project.isTemporal || false,
      expirationHours: project.expirationHours || 24,
      aiModel: project.settings.aiModel || "gemini-2.5-flash",
      aiTemperature: project.settings.aiTemperature || 0.7,
      tags: project.tags || []
    });
    setSelectedCollectionId(project.collection_id || "");
  };

  const [orgMembers, setOrgMembers] = useState<{ id: string; email: string; role: string; profile_type: string; profile_id: string | null; profiles: { full_name: string; avatar_url: string } | null }[]>([]);
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);
  const [isCollectionSelectorOpen, setIsCollectionSelectorOpen] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const openQuickEditModal = () => {
    if (activeProject) {
      loadProjectIntoConfig(activeProject);
      setIsQuickEditModalOpen(true);
    }
  };

  const handleSaveQuickParameters = async () => {
    if (!activeProjectId || !activeProject) return;

    const updatedMetadata = {
      name: newProject.name || activeProject.name,
      icon: activeProject.icon || "folder",
      size: newProject.size || activeProject.size,
      files: activeProject.files || [],
      serverRegion: newProject.serverRegion,
      teamAccess: newProject.teamAccess,
      isTemporal: newProject.isTemporal,
      expirationHours: newProject.expirationHours,
      tags: newProject.tags || activeProject.tags || [],
      collection_id: selectedCollectionId || activeProject.collection_id || null,
      settings: { 
        allowStorage: newProject.allowStorage, 
        historicalContext: newProject.historicalContext,
        aiModel: newProject.aiModel,
        aiTemperature: newProject.aiTemperature
      }
    };

    const { data, error } = await supabase
      .from('audits')
      .update({ metadata: updatedMetadata })
      .eq('id', activeProjectId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando parámetros en Supabase:", error);
      alert(`Error al guardar parámetros: ${error.message}`);
      return;
    }

    const projectIndex = projects.findIndex(p => p.id === activeProjectId);
    if (projectIndex !== -1) {
      const updatedProjects = [...projects];
      updatedProjects[projectIndex] = { 
        ...updatedProjects[projectIndex], 
        name: updatedMetadata.name,
        size: updatedMetadata.size,
        serverRegion: updatedMetadata.serverRegion,
        teamAccess: updatedMetadata.teamAccess,
        isTemporal: updatedMetadata.isTemporal,
        expirationHours: updatedMetadata.expirationHours,
        settings: updatedMetadata.settings
      };
      setProjects(updatedProjects);
    }
    setIsQuickEditModalOpen(false);
  };

  // Fetch Org Members
  useEffect(() => {
    if (profile?.organization_id) {
      const fetchMembers = async () => {
        const { data, error } = await supabase
          .from('org_members')
          .select(`
            id,
            email,
            role,
            profile_type,
            profile_id,
            profiles:profile_id (
              full_name,
              avatar_url
            )
          `)
          .eq('organization_id', profile.organization_id);
        
        if (!error && data) {
          // data.profiles might be an array if supabase thinks it's a one-to-many, but it's a one-to-one so it might be an object or array of 1.
          // Let's coerce it to the expected type safely:
          const members = data.map((m: any) => ({
            ...m,
            profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
          }));
          setOrgMembers(members);
        }
      };
      fetchMembers();
    }
  }, [profile]);

  // Load projects from Supabase
  useEffect(() => {
    if (profile?.organization_id) {
      const fetchProjects = async () => {
        const { data, error } = await supabase
          .from('audits')
          .select('*, audit_sessions(*)')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error loading audits:", error);
          return;
        }

        if (data && data.length > 0) {
          const mappedProjects: Project[] = data.map(d => ({
            id: d.id,
            name: d.metadata?.name || "Proyecto sin nombre",
            icon: d.metadata?.icon || "folder",
            size: d.metadata?.size || "medium",
            files: d.metadata?.files || [],
            tags: d.metadata?.tags || [],
            status: d.status as any,
            createdAt: d.created_at,
            serverRegion: d.metadata?.serverRegion || "us-west",
            teamAccess: d.metadata?.teamAccess || [],
            isTemporal: d.metadata?.isTemporal || false,
            expirationHours: d.metadata?.expirationHours || 24,
            collection_id: d.metadata?.collection_id || null,
            settings: d.metadata?.settings || {
              allowStorage: true,
              historicalContext: true,
              aiModel: "gemini-2.5-flash",
              aiTemperature: 0.7
            },
            auditSessions: d.audit_sessions || []
          }));
          const now = new Date();
          const validProjects: Project[] = [];
          const expiredProjectIds: string[] = [];

          mappedProjects.forEach(p => {
            if (p.isTemporal) {
              const expirationDate = new Date(new Date(p.createdAt).getTime() + p.expirationHours * 60 * 60 * 1000);
              if (now > expirationDate) {
                expiredProjectIds.push(p.id);
                return;
              }
            }
            validProjects.push(p);
          });

          setProjects(validProjects);

          // Trigger cleanup for expired projects
          expiredProjectIds.forEach(id => {
            fetch('/api/forensic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'cleanup', projectId: id })
            });
          });
        } else {
          setProjects([]);
        }

        // Fetch Workspace Tags and Collections for the Dropdown
        const [tagsRes, colsRes] = await Promise.all([
          supabase.from('workspace_tags').select('*').eq('organization_id', profile.organization_id),
          supabase.from('collections').select('id, name').eq('organization_id', profile.organization_id)
        ]);

        if (tagsRes.data) setWorkspaceTags(tagsRes.data);
        if (colsRes.data) setCollectionsData(colsRes.data);
      };
      fetchProjects();
    }
  }, [profile]);

  const handleCreateTag = async () => {
    if (!tagInput.trim() || !profile?.organization_id) return;
    try {
      const { data, error } = await supabase.from('workspace_tags').insert({
        organization_id: profile.organization_id,
        name: tagInput.trim(),
        color: tagColor
      }).select().single();
      
      if (error) throw error;
      
      if (data) {
        setWorkspaceTags(prev => [...prev, data]);
        setTagInput("");
        setIsTagsEnabled(false);
        setNewProject(prev => ({...prev, tags: [...prev.tags, data]}));
      }
    } catch (e: any) {
      console.error("Error creating tag:", e);
      alert("Error al crear la etiqueta: " + e.message);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    
    setCreateProjectError(null);

    if (!user || !profile) {
      setCreateProjectError("Debes iniciar sesión para poder crear proyectos y almacenar auditorías.");
      return;
    }

    if (!activeProjectId) {
      // Trial limits: only 1 project is allowed if not paid subscription
      if (org && !org.paid_subscription && projects.length >= 1) {
        setCreateProjectError("En el modo de prueba (Trial) solo puedes crear un proyecto. Adquiere o activa tu suscripción de ERANI Beta para tener proyectos ilimitados.");
        return;
      }

      // Deduct ERIS based on project size
      const cost = newProject.size === 'small' ? 15 : newProject.size === 'large' ? 45 : 30;
      const erisBalance = profile?.eris_balance ?? 20;

      if (erisBalance < cost) {
        setCreateProjectError(`Balance de ERIS insuficiente. Crear este proyecto cuesta ${cost} ERIS, pero tu balance actual es de ${erisBalance} ERIS. Por favor adquiere o activa tu suscripción.`);
        return;
      }
      
      await updateErisBalance(Math.max(0, erisBalance - cost));
    }

    let finalData;

    if (activeProjectId && activeProject) {
      // UPDATE EXISTING
      const updatedMetadata = {
        name: newProject.name,
        icon: activeProject.icon || "folder",
        size: newProject.size,
        files: activeProject.files || [],
        serverRegion: newProject.serverRegion,
        teamAccess: newProject.teamAccess,
        isTemporal: newProject.isTemporal,
        expirationHours: newProject.expirationHours,
        tags: newProject.tags,
        collection_id: selectedCollectionId || null,
        settings: { 
          allowStorage: newProject.allowStorage, 
          historicalContext: newProject.historicalContext,
          aiModel: newProject.aiModel,
          aiTemperature: newProject.aiTemperature
        }
      };

      const { data, error } = await supabase
        .from('audits')
        .update({ metadata: updatedMetadata })
        .eq('id', activeProjectId)
        .select()
        .single();

      if (error) {
        console.error("Error updating project in Supabase:", error);
        alert(`Error de base de datos: ${error.message}`);
        return;
      }
      finalData = data;

      const projectIndex = projects.findIndex(p => p.id === activeProjectId);
      if (projectIndex !== -1) {
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = { 
          ...updatedProjects[projectIndex], 
          name: updatedMetadata.name,
          icon: updatedMetadata.icon,
          size: updatedMetadata.size,
          files: updatedMetadata.files,
          serverRegion: updatedMetadata.serverRegion,
          teamAccess: updatedMetadata.teamAccess,
          isTemporal: updatedMetadata.isTemporal,
          expirationHours: updatedMetadata.expirationHours,
          tags: updatedMetadata.tags,
          collection_id: updatedMetadata.collection_id,
          settings: updatedMetadata.settings
        };
        setProjects(updatedProjects);
      }
      
      await auditLogger.log('PROJECT_UPDATE', `Proyecto actualizado: ${newProject.name}`, { projectId: activeProjectId }, 'update');
      setView("suite");
    } else {
      // INSERT NEW
      const { data, error } = await supabase
        .from('audits')
        .insert({
          organization_id: profile?.organization_id,
          created_by: profile?.id,
          status: 'idle',
          metadata: {
            name: newProject.name,
            icon: "folder",
            size: newProject.size,
            files: [],
            serverRegion: newProject.serverRegion,
            teamAccess: newProject.teamAccess,
            isTemporal: newProject.isTemporal,
            expirationHours: newProject.expirationHours,
            tags: newProject.tags,
            collection_id: selectedCollectionId || null,
            settings: { 
              allowStorage: newProject.allowStorage, 
              historicalContext: newProject.historicalContext,
              aiModel: newProject.aiModel,
              aiTemperature: newProject.aiTemperature
            }
          }
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating project in Supabase:", error);
        alert(`Error de base de datos (${error.code || '401'}): ${error.message}\nAsegúrate de haber iniciado sesión y tener permisos de escritura en la tabla 'audits'.`);
        return;
      }
      finalData = data;

      const project: Project = {
        id: finalData.id,
        name: finalData.metadata.name,
        icon: finalData.metadata.icon,
        size: finalData.metadata.size,
        files: [],
        tags: finalData.metadata.tags || [],
        status: "idle",
        createdAt: finalData.created_at,
        serverRegion: finalData.metadata.serverRegion,
        teamAccess: finalData.metadata.teamAccess,
        isTemporal: finalData.metadata.isTemporal,
        expirationHours: finalData.metadata.expirationHours,
        collection_id: finalData.metadata.collection_id || null,
        settings: finalData.metadata.settings
      };
      
      setProjects([project, ...projects]);
      setActiveProjectId(project.id);
      setView("suite");

      await auditLogger.log('PROJECT_CREATE', `Proyecto creado: ${project.name}`, { 
        projectId: project.id, 
        size: project.size,
        region: project.serverRegion
      }, 'plus');
    }

    setNewProject({ 
      name: "", 
      icon: "folder",
      size: "small", 
      allowStorage: true, 
      historicalContext: true,
      serverRegion: "us-west",
      teamAccess: [] as string[],
      isTemporal: false,
      expirationHours: 24,
      aiModel: "gemini-2.5-flash",
      aiTemperature: 0.7,
      tags: []
    });
  };

  const handleCreateAuditSession = async () => {
    if (!activeProjectId || !newSessionName.trim()) return;
    
    const { data, error } = await supabase
      .from('audit_sessions')
      .insert({
        project_id: activeProjectId,
        name: newSessionName.trim(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating audit session:", error);
      alert("Error al crear auditoría: " + error.message);
      return;
    }

    // Refresh projects to include the new session
    const updatedProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          auditSessions: [data, ...(p.auditSessions || [])]
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    setIsCreateSessionModalOpen(false);
    setNewSessionName("");
  };

  const handleDeleteProject = (id: string) => {
    setProjectToDelete(id);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const { error } = await supabase
      .from('audits')
      .delete()
      .eq('id', projectToDelete);

    if (error) {
      console.error("Error deleting project:", error);
      return;
    }

    setProjects(projects.filter(p => p.id !== projectToDelete));
    if (activeProjectId === projectToDelete) setActiveProjectId(null);
    setProjectToDelete(null);
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      const orgId = profile?.organization_id;
      if (!orgId) throw new Error("No organization found");
      
      const newProjectId = crypto.randomUUID();
      
      const clonedFiles = [...project.files];
      for (let i = 0; i < clonedFiles.length; i++) {
        const f = clonedFiles[i];
        if (f.path) {
          const fileExt = f.name.split('.').pop() || 'dat';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const newPath = `${orgId}/${newProjectId}/${fileName}`;
          
          const { error } = await supabase.storage.from('forensic_evidence').copy(f.path, newPath);
          if (!error) {
            clonedFiles[i] = { ...f, path: newPath };
          } else {
            console.warn("Could not copy file", f.path, error);
          }
        }
      }

      const newProject: Project = {
        ...project,
        id: newProjectId,
        name: `${project.name} (Copia)`,
        files: clonedFiles,
        status: "idle",
        createdAt: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('audits')
        .insert({
          id: newProjectId,
          organization_id: orgId,
          created_by: profile?.id,
          status: newProject.status,
          metadata: newProject
        });

      if (dbError) throw dbError;

      setProjects([newProject, ...projects]);
      
      await auditLogger.log('PROJECT_DUPLICATE', `Proyecto duplicado: ${project.name}`, { 
        originalId: project.id, 
        newId: newProjectId 
      }, 'copy');
      
    } catch (err: any) {
      console.error("Error duplicando proyecto:", err);
      alert("No se pudo duplicar el proyecto: " + err.message);
    }
  };

  const ingestFile = async (projectId: string, file: File, fileId: string) => {
    try {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            files: p.files.map(f => f.id === fileId ? { ...f, status: "ingesting", progress: 10 } : f)
          };
        }
        return p;
      }));

      const activeProject = projects.find(p => p.id === projectId);
      
      let filePath = '';
      if (activeProject?.settings.allowStorage) {
        // Generate a unique path for the file
        const orgId = profile?.organization_id || 'unknown_org';
        const fileExt = file.name.split('.').pop() || 'dat';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        filePath = `${orgId}/${projectId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('forensic_evidence')
          .upload(filePath, file);

        if (error) {
          throw new Error(error.message);
        }

        setUploadedPaths(prev => ({
          ...prev,
          [projectId]: [...(prev[projectId] || []), filePath]
        }));
      } else {
        // Just simulate delay if not uploading to storage
        await new Promise(r => setTimeout(r, 500));
      }

        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            const updatedProject = {
              ...p,
              files: p.files.map(f => f.id === fileId ? { ...f, status: "completed" as const, progress: 100, path: filePath || undefined } : f)
            };
            syncProjectToDB(updatedProject);
            return updatedProject;
          }
          return p;
        }));

      // LOG: File Uploaded to Storage
      await auditLogger.log('FILE_UPLOAD', `Archivo almacenado en Storage Seguro: ${file.name}`, { 
        projectId, 
        fileName: file.name,
        path: filePath
      }, 'upload-cloud');
    } catch (error: any) {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            files: p.files.map(f => f.id === fileId ? { ...f, status: "error" as const, progress: 100, error: error.message } : f)
          };
        }
        return p;
      }));
    }
  };

  const handleDeleteFile = async (projectId: string, fileId: string, filePath?: string) => {
    if (filePath) {
      await supabase.storage.from('forensic_evidence').remove([filePath]);
    }
    
    let updatedProject: Project | undefined;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        updatedProject = { ...p, files: p.files.filter(f => f.id !== fileId) };
        return updatedProject;
      }
      return p;
    }));

    setUploadedPaths(prev => {
      if (!prev[projectId]) return prev;
      return { ...prev, [projectId]: prev[projectId].filter(p => p !== filePath) };
    });

    if (updatedProject) {
      syncProjectToDB(updatedProject);
      await auditLogger.log('FILE_DELETE', `Archivo eliminado`, { projectId, fileId }, 'trash-2');
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from('forensic_evidence').createSignedUrl(filePath, 60 * 60);
    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.target = "_blank";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Failed to download file:", error);
    }
  };

  const handleFiles = (incomingFiles: File[]) => {
    if (activeProjectId && incomingFiles.length > 0) {
      // Store actual File objects for the session (non-persisted)
      setActualFiles(prev => ({
        ...prev,
        [activeProjectId]: [...(prev[activeProjectId] || []), ...incomingFiles]
      }));

      const newFiles: ForensicFile[] = incomingFiles.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        name: f.name,
        size: f.size,
        type: f.type,
        status: "pending",
        progress: 0
      }));

      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            files: [...p.files, ...newFiles]
          };
        }
        return p;
      }));

      // Start ingestion for each file
      incomingFiles.forEach((file, index) => {
        ingestFile(activeProjectId, file, newFiles[index].id);
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileClick = () => fileInputRef.current?.click();

  // Progress Simulation & API Integration Effect
  useEffect(() => {
    if (view === "processing" && activeProject) {
      setProcessingProgress(0);
      setCurrentStepIdx(0);
      setAnalysisLogs([]);
      setAnalysisError(null);
      
      let isSubscribed = true;

      const addLog = (msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        if (!isSubscribed) return;
        setAnalysisLogs(prev => [...prev.slice(-15), { id: Math.random().toString(36).substr(2, 9), msg, type }]);
      };

      const triggerAnalysis = async () => {
        try {
          // Manual progress increments for UX while waiting for stages
          const progressInterval = setInterval(() => {
            setProcessingProgress(prev => {
              const stepSize = 100 / PROCESSING_STEPS.length;
              const targetMax = (currentStepIdx + 0.8) * stepSize;
              if (prev < targetMax) return prev + 0.15;
              return prev;
            });
          }, 60);

          // Simulate some granular logs based on steps
          const logInterval = setInterval(() => {
            const step = PROCESSING_STEPS[currentStepIdx];
            const randomLogs = {
              METADATA_PARSING: ["Analizando headers de archivos...", "Extrayendo metadatos de usuario...", "Validando integridad de hashes...", "Estructurando vectores base..."],
              RAG_RETRIEVAL: ["Consultando base de vectores...", "Triangulando patrones históricos...", "Recuperando fragmentos de contexto...", "Aumentando precisión de búsqueda..."],
              MODEL_INIT: ["Calentando motores de inferencia...", "Sincronizando pesos del modelo...", "Estableciendo conexión segura...", "Optimizando latencia de clúster..."],
              GEMINI_INFERENCE: ["Ejecutando razonamiento probabilístico...", "Detectando anomalías operativas...", "Calculando impacto de inacción (COI)...", "Verificando consistencia semántica..."],
              REPORT_PERSISTENCE: ["Compilando hallazgos técnicos...", "Generando visualizaciones ejecutivas...", "Finalizando reporte de peritaje...", "Cifrando reporte de salida..."]
            };
            const currentMsgs = randomLogs[step.id as keyof typeof randomLogs] || [];
            const msg = currentMsgs[Math.floor(Math.random() * currentMsgs.length)];
            addLog(msg);

            // Update stats
            setInferenceStats(prev => ({
              memory: Math.min(3.8, prev.memory + Math.random() * 0.1),
              params: prev.params + Math.random() * 0.05
            }));
          }, 2000);

          addLog(`Iniciando auditoría: ${activeProject.name}`, 'info');
          addLog(`Configurando entorno en región ${activeProject.serverRegion}`, 'info');

          const formData = new FormData();
          formData.append('action',           'analyze');
          formData.append('organizationId',    profile?.organization_id || '');
          formData.append('projectId',         activeProject.id);
          formData.append('allowStorage',      String(activeProject.settings.allowStorage));
          formData.append('historicalContext', String(activeProject.settings.historicalContext));
          formData.append('aiModel',           activeProject.settings.aiModel || 'gemini-2.5-flash'); 
          formData.append('aiTemperature',     String(activeProject.settings.aiTemperature));
          formData.append('isTemporal',        String(activeProject.isTemporal));
          formData.append('projectName',       activeProject.name || "Proyecto Sin Nombre");
          formData.append('projectSize',       activeProject.size || "medium");
          
          if (isTagsEnabled && activeProject.tags && activeProject.tags.length > 0) {
            formData.append('tags', JSON.stringify(activeProject.tags));
          }

          // ── Attach uploaded file paths for Backend fetching ─────────────────
          const projectUploadedPaths = Array.from(new Set([
            ...(uploadedPaths[activeProject.id] || []),
            ...(activeProject.files?.filter(f => f.path).map(f => f.path as string) || [])
          ]));
          if (projectUploadedPaths.length > 0) {
            addLog(`Enlazando ${projectUploadedPaths.length} archivo(s) desde Storage Seguro...`, 'info');
            formData.append('filePaths', JSON.stringify(projectUploadedPaths));
          } else {
            // Fallback for smaller files if storage upload failed
            const projectActualFiles = actualFiles[activeProject.id] || [];
            if (projectActualFiles.length > 0) {
              addLog(`Adjuntando ${projectActualFiles.length} archivo(s) directos como respaldo...`, 'info');
              projectActualFiles.forEach(f => formData.append('files', f));
            }
          }

          const { data: { session: analyzeSession } } = await supabase.auth.getSession();
          const analyzeToken = analyzeSession?.access_token;
          if (!analyzeToken) throw { message: "Sesión expirada. Por favor recarga la página.", stage: "ERROR" };

          const response = await fetch(`/api/forensic?action=analyze`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${analyzeToken}` },
            body: formData,
          });

          clearInterval(progressInterval);
          clearInterval(logInterval);

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw { 
              message: result.error || `Error del servidor: ${response.status}`, 
              stage: result.stage || "ERROR" 
            };
          }
          
          if (isSubscribed) {
            console.log("Análisis forense completado en backend");
            setProcessingProgress(100);
            setCurrentStepIdx(PROCESSING_STEPS.length - 1);
            
            if (result.report) {
              addLog("Análisis completado con éxito", 'success');
              setForensicReport(result.report);
              
              // ── SEND EMAIL NOTIFICATIONS ──
              if (profile?.organization_id && result.dbRecord?.id) {
                try {
                  const { data: orgConfig } = await supabase
                    .from('organizations')
                    .select('email_alerts, audit_notification_recipients, name, logo_url, paid_subscription, plan')
                    .eq('id', profile.organization_id)
                    .single();
                  
                  if (orgConfig?.email_alerts && orgConfig.audit_notification_recipients && orgConfig.audit_notification_recipients.length > 0) {
                    addLog("Generando PDF para envío automático...", 'info');
                    
                    // Transform report data for PDF
                    const p = result.dbRecord.payload_completo || {};
                    const reportData = {
                      projectName: p.report_metadata?.project_name || result.dbRecord.project_name || "PROYECTO SIN NOMBRE",
                      impactoDirecto: p.slide_1_impacto_directo?.fuga_confirmada_mxn || result.dbRecord.impacto_directo || 0,
                      impactoFuturo: p.slide_1_impacto_directo?.riesgo_latente_mensual_mxn || result.dbRecord.impacto_futuro || 0,
                      scopeCreep: p.slide_1_impacto_directo?.desviacion_scope_creep_pct || result.dbRecord.scope_creep || 0,
                      rentabilidadPoint: p.slide_1_impacto_directo?.punto_conciencia_rentabilidad_mxn || result.dbRecord.rentabilidad_point || 0,
                      coiAnual: p.slide_1_impacto_directo?.coi_anual_mxn || result.dbRecord.coi_anual || 0,
                      tickets: (p.slide_2_analisis_forense?.top_5_tickets || result.dbRecord.tickets || []).map((t: any) => ({
                        id: t.ticket_id || t.id || Math.random().toString(36).substr(2, 9),
                        description: t.descripcion || t.description || "Sin descripción",
                        filter: t.filtro || t.filter || "General",
                        hrs: t.hrs_calc || t.hrs || 0,
                        cost: t.costo_invisible_mxn || t.cost || 0,
                        status: (t.costo_invisible_mxn || t.cost) > 5000 ? 'capital_leak' : ((t.hrs_calc || t.hrs) > 10 ? 'blindspot' : 'execution')
                      })),
                      resumenConsolidacion: {
                        fugaExterna: p.slide_2_analisis_forense?.resumen_consolidacion?.fuga_externa_mxn || 0,
                        fugaInterna: p.slide_2_analisis_forense?.resumen_consolidacion?.fuga_interna_mxn || 0,
                        totalConciliado: p.slide_2_analisis_forense?.resumen_consolidacion?.total_conciliado_monto_mxn || 0,
                        estadoInventario: p.slide_2_analisis_forense?.resumen_consolidacion?.estado_inventario_desc || ""
                      },
                      anexoTecnico: p.slide_4_anexo_tecnico?.metricas_calculadas || [],
                      anexoMetodologico: p.slide_4_anexo_tecnico?.marcos_metodologicos_aplicados || [],
                      anexoGlosario: p.slide_4_anexo_tecnico?.glosario_terminos_utilizados || [],
                      firewallRecomendations: p.slide_3_firewall_rentabilidad?.recomendaciones_inmediatas || [],
                      roiInversion: p.slide_3_firewall_rentabilidad?.roi_estimado_inversion || "",
                      projectSize: activeProject.size,
                      aiModel: activeProject.settings.aiModel,
                      erisCost: 30
                    };

                    const blob = await pdf(<ForensicPDFDocument data={reportData as any} org={orgConfig} reportId={result.dbRecord.id} />).toBlob();
                    
                    const fileName = `report_${result.dbRecord.id}_${Date.now()}.pdf`;
                    const { error: uploadError } = await supabase.storage
                      .from('reports')
                      .upload(fileName, blob, { contentType: 'application/pdf', upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabase.storage.from('reports').getPublicUrl(fileName);
                    
                    addLog("Enviando correos de notificación...", 'info');
                    const { error: funcErr } = await supabase.functions.invoke('send-audit-notification', {
                      body: {
                        emails: orgConfig.audit_notification_recipients,
                        projectName: reportData.projectName,
                        reportId: result.dbRecord.id,
                        pdfUrl: publicUrlData.publicUrl,
                        orgName: orgConfig.name,
                        orgLogo: orgConfig.logo_url
                      }
                    });

                    if (funcErr) throw funcErr;
                    addLog("Correos enviados exitosamente.", 'success');
                  }
                } catch (emailErr: any) {
                  console.error("Error sending email notification:", emailErr);
                  addLog("Error al enviar notificaciones por correo.", 'error');
                }
              }

              // Small delay to let the user see the 100% completion
              setTimeout(() => {
                if (isSubscribed) {
                   // Redirect to the dedicated forensic view with the specific report ID
                   if (result.dbRecord?.id) {
                     router.push(`/forensic?id=${result.dbRecord.id}&t=${Date.now()}`);
                   } else {
                     router.push(`/forensic?t=${Date.now()}`);
                   }
                }
              }, 1200);
            }
          }
        } catch (err: any) {
          const errDetail = typeof err === 'string' 
            ? err 
            : (err?.message || err?.error || (typeof err === 'object' && Object.keys(err).length > 0 ? JSON.stringify(err) : "Fallo crítico en el motor forense."));
          console.error("Error en auditoría forense:", errDetail, err);
          if (isSubscribed) {
            let errorMessage = errDetail;
            
            // Specifically handle Google's high demand (503) error
            if (errorMessage.toLowerCase().includes("high demand") || errorMessage.toLowerCase().includes("service unavailable")) {
              errorMessage = "⚠️ ALTA DEMANDA: El modelo seleccionado está saturado en los servidores. Por favor, intenta con 'Erani Engine 2.5 Flash-Lite' o reintenta en unos minutos.";
            }

            setAnalysisError({
              message: errorMessage,
              stage: err?.stage || "ERROR"
            });
            // Jump to the failing stage in UI if possible
            const stageIdx = PROCESSING_STEPS.findIndex(s => s.id === err.stage);
            if (stageIdx !== -1) {
              setCurrentStepIdx(stageIdx);
              setProcessingProgress((stageIdx / PROCESSING_STEPS.length) * 100 + 5);
            }
          }
        }
      };

      triggerAnalysis();
      
      return () => {
        isSubscribed = false;
      };
    }
  }, [view, activeProject]);



  // Extract dynamic tags for filter
  const uniqueTagsMap = new Map<string, ProjectTag>();
  projects.forEach(p => {
    (p.tags || []).forEach(t => {
      uniqueTagsMap.set(t.label, t);
    });
  });
  const allAvailableTags = Array.from(uniqueTagsMap.values());
  
  // Sort projects by date descending
  const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative flex flex-col h-screen`}>
        <AnimatePresence>
          {createProjectError && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -50, x: '-50%' }}
              className="fixed top-8 left-1/2 z-[999999] min-w-[400px] max-w-2xl bg-background/95 backdrop-blur-xl border border-erani-coral/30 shadow-2xl shadow-erani-coral/10 rounded-2xl p-4 flex items-start gap-4"
            >
              <Shield className="w-6 h-6 text-erani-coral shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-black uppercase tracking-wider text-erani-coral">Acción Bloqueada</span>
                <span className="text-xs font-medium text-foreground/80 mt-1 leading-relaxed">
                  {createProjectError}
                </span>
              </div>
              <button 
                onClick={() => setCreateProjectError(null)}
                className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-gray-500 hover:text-foreground hover:bg-foreground/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {projectToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background border border-glass-border rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-erani-coral" />
                    Eliminar Proyecto
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    ¿Estás seguro de que deseas eliminar este proyecto? Esta acción es irreversible y todos los datos asociados serán eliminados permanentemente de la bóveda de gobernanza.
                  </p>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => setProjectToDelete(null)}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-foreground/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDeleteProject}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-erani-coral/10 text-erani-coral border border-erani-coral/30 hover:bg-erani-coral hover:text-white transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isCreateSessionModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background border border-glass-border rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                    <Plus className="w-5 h-5 text-erani-blue" />
                    Nueva Auditoría
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium mb-2">
                    Ingresa un nombre para esta sesión de auditoría.
                  </p>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej. Análisis Forense Mayo 2026"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    className="bg-background border border-glass-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-erani-blue/50 transition-colors placeholder:text-gray-400 text-foreground w-full"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => { setIsCreateSessionModalOpen(false); setNewSessionName(""); }}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-foreground/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateAuditSession}
                    disabled={!newSessionName.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-erani-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Crear
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-erani-blue/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-erani-purple/5 blur-[150px] rounded-full pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="p-8 pb-0 flex items-center justify-between z-20">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-nav-text">
                   Diagnóstico Forense de Infraestructura
                </span>
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                Gestión de <span className="text-gradient-brand">Auditorías y Proyectos</span>
             </h1>
          </div>

          <div className="flex items-center gap-4">
            {view === "manage" && (
              <>
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
                <input 
                  type="text"
                  placeholder="Buscar en proyectos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-foreground/5 border border-glass-border rounded-full pl-12 pr-6 py-3 text-[11px] font-bold w-48 focus:outline-none focus:border-erani-blue/50 transition-all placeholder:text-gray-600"
                />
             </div>
             
             {/* Tag Filter */}
             <div className="relative">
               <button 
                 onClick={() => { setIsTagFilterOpen(!isTagFilterOpen); setIsSizeFilterOpen(false); }}
                 className="bg-foreground/5 hover:bg-foreground/10 border border-glass-border rounded-full pl-10 pr-4 py-3 text-[10px] font-bold text-foreground cursor-pointer transition-all flex items-center gap-2 relative min-w-[160px] text-left"
               >
                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                 <span className="flex-1 truncate">{filterTag === 'all' ? 'Todas las Colecciones' : collectionsData.find(c => c.id === filterTag)?.name || 'Colección'}</span>
                 <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isTagFilterOpen ? 'rotate-180' : ''}`} />
               </button>
               <AnimatePresence>
                 {isTagFilterOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute top-full mt-2 left-0 w-56 z-50 p-2 rounded-2xl border border-glass-border shadow-2xl bg-background backdrop-blur-xl flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar"
                   >
                     <button 
                       onClick={() => { setFilterTag('all'); setIsTagFilterOpen(false); }}
                       className={`text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${filterTag === 'all' ? 'bg-erani-blue/10 text-erani-blue' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
                     >
                       Todas las Colecciones
                     </button>
                     {collectionsData.map(c => (
                        <button 
                          key={c.id}
                          onClick={() => { setFilterTag(c.id); setIsTagFilterOpen(false); }}
                          className={`text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${filterTag === c.id ? 'bg-erani-blue/10 text-erani-blue' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

             {/* Size Filter */}
             <div className="relative">
               <button 
                 onClick={() => { setIsSizeFilterOpen(!isSizeFilterOpen); setIsTagFilterOpen(false); }}
                 className="bg-foreground/5 hover:bg-foreground/10 border border-glass-border rounded-full pl-10 pr-4 py-3 text-[10px] font-bold text-foreground cursor-pointer transition-all flex items-center gap-2 relative min-w-[150px] text-left"
               >
                 <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                 <span className="flex-1 truncate">
                   {filterSize === 'all' ? 'Cualquier Tamaño' : 
                    filterSize === 'small' ? 'Small (Pequeño)' : 
                    filterSize === 'medium' ? 'Medium (Mediano)' : 
                    'Large (Grande)'}
                 </span>
                 <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isSizeFilterOpen ? 'rotate-180' : ''}`} />
               </button>
               <AnimatePresence>
                 {isSizeFilterOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute top-full mt-2 left-0 w-48 z-50 p-2 rounded-2xl border border-glass-border shadow-2xl bg-background backdrop-blur-xl flex flex-col gap-1"
                   >
                     {[
                       { id: 'all', label: 'Cualquier Tamaño' },
                       { id: 'small', label: 'Small (Pequeño)' },
                       { id: 'medium', label: 'Medium (Mediano)' },
                       { id: 'large', label: 'Large (Grande)' }
                     ].map(size => (
                       <button 
                         key={size.id}
                         onClick={() => { setFilterSize(size.id); setIsSizeFilterOpen(false); }}
                         className={`text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${filterSize === size.id ? 'bg-erani-coral/10 text-erani-coral' : 'text-gray-500 hover:text-foreground hover:bg-foreground/5'}`}
                       >
                         {size.label}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
             </>
            )}
             {view === "manage" && (
              <button 
                id="tour-audit-new"
                onClick={() => { setIsCreateModalOpen(true); setActiveProjectId(null); }}
                className="px-8 py-3 rounded-xl text-[12px] font-medium tracking-widest transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-[#1E50BA] to-[#7404FF] text-white shadow-xl shadow-[#7404FF]/20 hover:shadow-2xl hover:shadow-[#7404FF]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[1.5]" />
                <span>NUEVO</span>
              </button>
             )}
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {/* VIEW: MANAGE PROJECTS */}
            {view === "manage" && (
              <motion.div 
                key="manage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {(() => {
                  const filtered = sortedProjects.filter(p => {
                     const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
                     const matchTag = filterTag === "all" || p.collection_id === filterTag;
                     const matchSize = filterSize === "all" || p.size === filterSize;
                     return matchSearch && matchTag && matchSize;
                  });
                  
                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-glass-border rounded-[3rem] bg-foreground/5 opacity-80 hover:opacity-100 hover:border-erani-blue/50 transition-all cursor-pointer" onClick={() => { setIsCreateModalOpen(true); setActiveProjectId(null); }}>
                         <div className="w-20 h-20 rounded-3xl bg-erani-blue/10 flex items-center justify-center text-erani-blue mb-2">
                            <Folder className="w-10 h-10" />
                         </div>
                         <div className="text-center flex flex-col gap-2">
                             <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Aún no hay auditorías</h3>
                             <p className="text-xs font-medium text-gray-500 max-w-md">No se encontraron proyectos forenses o auditorías. Inicia configurando tu primer entorno de proyecto para comenzar.</p>
                         </div>
                         <button className="mt-4 px-8 py-4 bg-erani-blue text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-erani-blue/20">
                            <Plus className="w-4 h-4" /> Agrega tu primer proyecto
                         </button>
                      </div>
                    )
                  }

                  return (
                    <>
                      {filtered.map((project) => (
                        <div key={project.id} className="premium-border-container group h-full">
                          <div className="premium-border-inner p-6 flex flex-col items-stretch h-full w-full">
                            
                            {/* Top Row: Icon + Actions */}
                            <div className="flex justify-between items-start w-full mb-6">
                              <div className="relative z-20">
                                 <button 
                                   onClick={() => setSelectingIconFor(selectingIconFor === project.id ? null : project.id)}
                                   className="w-12 h-12 rounded-2xl bg-erani-blue/10 flex items-center justify-center text-erani-blue hover:bg-erani-blue/20 transition-colors border border-erani-blue/20 shadow-inner"
                                 >
                                    {(() => {
                                       const IconComp = ICON_LIBRARY.find(i => i.id === (project.icon || 'folder'))?.icon || Folder;
                                       return <IconComp className="w-6 h-6" />;
                                    })()}
                                 </button>
                                 
                                 <AnimatePresence>
                                   {selectingIconFor === project.id && (
                                      <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute top-14 left-0 z-50 glassmorphism p-3 rounded-2xl border border-glass-border shadow-2xl grid grid-cols-4 gap-2 w-48 bg-background/80 backdrop-blur-xl"
                                      >
                                         {ICON_LIBRARY.map((item) => (
                                            <button 
                                              key={item.id}
                                              onClick={() => handleChangeIcon(project.id, item.id)}
                                              className={`p-2.5 flex items-center justify-center rounded-xl transition-colors ${project.icon === item.id || (!project.icon && item.id === 'folder') ? 'bg-erani-blue/20 text-erani-blue' : 'text-gray-500 hover:bg-foreground/10 hover:text-foreground'}`}
                                            >
                                               <item.icon className="w-4 h-4" />
                                            </button>
                                         ))}
                                      </motion.div>
                                   )}
                                 </AnimatePresence>
                              </div>

                              <div className="flex gap-1.5 relative z-10 bg-foreground/5 p-1 rounded-xl border border-glass-border">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDuplicateProject(project); }}
                                  className="p-1.5 rounded-lg hover:bg-background/80 text-gray-500 hover:text-erani-blue transition-all"
                                  title="Duplicar"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { setActiveProjectId(project.id); loadProjectIntoConfig(project); setIsCreateModalOpen(true); }}
                                  className="p-1.5 rounded-lg hover:bg-background/80 text-gray-500 hover:text-foreground transition-all"
                                  title="Configuración"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="p-1.5 rounded-lg hover:bg-erani-coral/10 text-gray-500 hover:text-erani-coral transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Title & ID */}
                            <div className="flex flex-col flex-1 mb-6 w-full">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-erani-blue/80 w-full truncate mb-2" title={project.id}>
                                {project.id}
                              </span>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl leading-snug font-black uppercase tracking-tight text-foreground line-clamp-2" title={project.name}>{project.name}</h3>
                                <button 
                                  onClick={() => { setActiveProjectId(project.id); loadProjectIntoConfig(project); setIsCreateModalOpen(true); }}
                                  className="p-1.5 rounded-lg bg-erani-blue/10 hover:bg-erani-blue text-erani-blue hover:text-white transition-colors shrink-0"
                                  title="Cambiar configuración"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-3 mb-2">
                                 <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                 <span className="text-[10px] font-bold text-gray-500">{new Date(project.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {(project.tags && project.tags.length > 0) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {project.tags.map((tag: any) => {
                                    const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                                    return (
                                      <span key={tag.id} className={`px-2 py-0.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${colorDef.bgSoft} ${colorDef.border} ${colorDef.text}`}>
                                        {tag.name || tag.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Stats Stacked Banners */}
                            <div className="flex flex-col gap-3 mb-6 w-full">
                              <div className="px-5 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border flex justify-between items-center w-full">
                                <span className="text-[9px] uppercase font-black text-gray-500 tracking-wider">Auditorías</span>
                                <span className="text-xl font-black text-foreground">{project.files.length}</span>
                              </div>
                              <div className="px-5 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border flex justify-between items-center w-full">
                                <span className="text-[9px] uppercase font-black text-gray-500 tracking-wider">Volumen Estimado</span>
                                <span className={`text-[10px] font-black uppercase text-${PROJECT_SIZES[project.size].color}`}>
                                  {PROJECT_SIZES[project.size].label}
                                </span>
                              </div>
                            </div>

                            {/* Bottom Action */}
                            <div className="flex items-center justify-between gap-4 pt-5 border-t border-glass-border mt-auto w-full">
                              <div className="flex items-center gap-3">
                                 <History className={`w-4 h-4 ${project.settings.historicalContext ? 'text-emerald-500' : 'text-gray-500'}`} />
                                 <div className="flex flex-col">
                                     <span className="text-[8px] uppercase font-black text-gray-500 tracking-widest">Contexto AI</span>
                                     <span className={`text-[9px] font-bold uppercase ${project.settings.historicalContext ? 'text-emerald-500' : 'text-gray-500'}`}>
                                       {project.settings.historicalContext ? 'Activo' : 'Inactivo'}
                                     </span>
                                 </div>
                              </div>
                              <button 
                                onClick={() => { setActiveProjectId(project.id); setView("suite"); }}
                                className="flex flex-1 items-center justify-center px-4 py-3 rounded-xl bg-erani-blue/10 hover:bg-erani-blue text-erani-blue hover:text-white text-[9px] font-black uppercase tracking-widest transition-all gap-2 ml-4"
                              >
                                Abrir <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                        </div>
                      ))}
                      
                      {/* Persistent Animated 'Add Project' Card */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                           setNewProject({ 
                             name: "", icon: "folder", size: "small", allowStorage: true, historicalContext: true,
                             serverRegion: "us-west", teamAccess: [], isTemporal: false,
                             expirationHours: 24, aiModel: "gemini-2.5-flash", aiTemperature: 0.7,
                             tags: []
                           });
                           setActiveProjectId(null); 
                           setIsCreateModalOpen(true); 
                        }}
                        className="premium-border-container cursor-pointer h-full min-h-[350px]"
                      >
                        <div className="premium-border-inner p-6 flex flex-col items-center justify-center h-full w-full bg-foreground/5 hover:bg-erani-blue/5 transition-all text-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-erani-blue/10 flex items-center justify-center text-erani-blue animate-pulse">
                              <Plus className="w-8 h-8" />
                           </div>
                           <div className="flex flex-col gap-1">
                              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Nuevo Proyecto</h3>
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Inicia una nueva auditoría</span>
                           </div>
                        </div>
                      </motion.div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* VIEW: SETUP PROJECT */}
            {view === "config" && (
              <motion.div 
                key="setup-new"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 h-full"
              >
                <div className="flex items-center justify-between">
                   <button 
                    onClick={() => setView("manage")}
                    className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-all"
                   >
                     <ArrowLeft className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Volver a Proyectos</span>
                   </button>
                   <div className="flex flex-col items-end">
                      <h2 className="text-2xl font-black uppercase tracking-tight">{activeProjectId ? "Actualizar" : "Nueva"} <span className="text-gradient-brand">Misión Forense</span></h2>
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Configuración de Parámetros</p>
                   </div>
                </div>

                {/* Storage Warning Banner in Project Setup */}
                {storageStats?.isCritical && (
                  <div className="mb-8 p-4 rounded-2xl bg-erani-coral/10 border border-erani-coral/30 flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-erani-coral shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex flex-col">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-erani-coral">Almacenamiento Crítico</h4>
                      <p className="text-xs text-foreground/80 font-medium mt-1">
                        {storageStats.isFull 
                          ? "Has superado tu límite de almacenamiento. No es posible crear este proyecto. Elimina auditorías o cambia de plan." 
                          : `Has usado ${storageStats.usedGB.toFixed(2)}GB de ${storageStats.limitGB}GB. Considera crear proyectos en Modo Temporal (Sin Almacenamiento).`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="glassmorphism p-10 rounded-[3rem] border border-glass-border flex-1 grid lg:grid-cols-2 gap-12">
                   <div className="flex flex-col gap-10">
                      <div className="flex flex-col gap-4">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Nombre de la Auditoría / Proyecto</label>
                          <input 
                            id="tour-audit-name"
                            type="text"
                            placeholder="Ej. Auditoría de Marketing Q2 - Agencia X"
                            value={newProject.name}
                            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                            className="input-premium py-6"
                          />
                      </div>

                      <div className="flex flex-col gap-4" id="tour-audit-size">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Volumen de Datos Estimado</label>
                          <div className="grid grid-cols-3 gap-4">
                            {(Object.keys(PROJECT_SIZES) as Array<keyof typeof PROJECT_SIZES>).map(size => (
                              <button
                                key={size}
                                onClick={() => setNewProject({...newProject, size})}
                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 text-center ${
                                  newProject.size === size 
                                  ? `bg-erani-${PROJECT_SIZES[size].color}/10 border-erani-${PROJECT_SIZES[size].color} shadow-lg` 
                                  : "bg-foreground/5 border-glass-border hover:border-foreground/20"
                                }`}
                              >
                                <span className={`text-[10px] font-black uppercase tracking-widest ${newProject.size === size ? `text-erani-${PROJECT_SIZES[size].color}` : 'text-foreground'}`}>
                                  {PROJECT_SIZES[size].label}
                                </span>
                                <span className="text-[8px] font-bold text-gray-500 uppercase">{PROJECT_SIZES[size].description}</span>
                              </button>
                            ))}
                          </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-8 lg:border-l lg:border-glass-border lg:pl-12">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="flex flex-col gap-4" id="tour-audit-region">
                             <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Región del Servidor</label>
                             <div className="relative">
                                <select 
                                  value={newProject.serverRegion}
                                  onChange={(e) => setNewProject({...newProject, serverRegion: e.target.value})}
                                  className="input-premium py-4 w-full appearance-none bg-foreground/5"
                                  style={{ paddingLeft: '3rem' }}
                                >
                                  <option value="us-west">US West (Oregon)</option>
                                  <option value="us-east">US East (N. Virginia)</option>
                                  <option value="eu-central">EU Central (Frankfurt)</option>
                                  <option value="latam-south">LATAM South (Sao Paulo)</option>
                                </select>
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-erani-blue" />
                             </div>
                          </div>

                          <div className="flex flex-col gap-4 relative" id="tour-audit-team">
                             <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Acceso de Equipo</label>
                                <span className="text-[8px] text-gray-500 font-medium bg-foreground/5 px-2 py-0.5 rounded-full">
                                  {newProject.teamAccess.length} Miembros
                                </span>
                             </div>
                             
                             <div className="p-4 bg-foreground/5 border border-glass-border rounded-2xl flex items-center gap-3 flex-wrap">
                                {/* Selected Members */}
                                {newProject.teamAccess.length === 0 && (
                                  <span className="text-xs text-nav-text italic flex-1">Solo tú (Administrador)</span>
                                )}
                                {newProject.teamAccess.map((memberId, i) => {
                                   const member = orgMembers.find(m => m.id === memberId);
                                   const fullName = member?.profiles?.full_name || member?.email?.split('@')[0] || "Usuario";
                                   const avatarUrl = member?.profiles?.avatar_url;
                                   
                                   return (
                                     <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-erani-blue/10 border border-erani-blue/20">
                                       {avatarUrl ? (
                                         <img src={avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                                       ) : (
                                         <div className="w-4 h-4 rounded-full bg-erani-blue/20 flex items-center justify-center">
                                           <span className="text-[8px] text-erani-blue font-black uppercase">
                                             {fullName[0]}
                                           </span>
                                         </div>
                                       )}
                                       <span className="text-[10px] font-black uppercase text-erani-blue">{fullName.split(' ')[0]}</span>
                                       <button onClick={() => setNewProject(prev => ({...prev, teamAccess: prev.teamAccess.filter(id => id !== memberId)}))} className="text-erani-blue/50 hover:text-erani-blue ml-1">
                                          <X className="w-3 h-3" />
                                       </button>
                                     </div>
                                   );
                                })}

                                {/* Add Member Button */}
                                <div className="relative">
                                  <button 
                                    onClick={() => setIsTeamSelectorOpen(!isTeamSelectorOpen)}
                                    className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-dashed border-glass-border flex items-center justify-center text-gray-500 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>

                                  <AnimatePresence>
                                    {isTeamSelectorOpen && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-10 right-0 w-64 bg-background/95 backdrop-blur-xl border border-glass-border rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right"
                                      >
                                        <div className="p-3 border-b border-glass-border bg-foreground/5 flex items-center justify-between">
                                          <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Miembros</span>
                                          <button onClick={() => setIsTeamSelectorOpen(false)} className="text-gray-500 hover:text-foreground"><X className="w-3 h-3" /></button>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto no-scrollbar flex flex-col p-2">
                                           {orgMembers.filter(m => m.profile_id !== profile?.id).length === 0 && (
                                              <div className="p-4 text-center">
                                                <span className="text-xs text-nav-text">No hay más miembros en tu organización.</span>
                                              </div>
                                           )}
                                           {orgMembers.filter(m => m.profile_id !== profile?.id).map(member => {
                                             const isSelected = newProject.teamAccess.includes(member.id);
                                             const fullName = member.profiles?.full_name || member.email.split('@')[0] || "Usuario";
                                             const avatarUrl = member.profiles?.avatar_url;
                                             const displayRole = member.role || member.profile_type || "Miembro";
                                             
                                             return (
                                               <button 
                                                 key={member.id}
                                                 onClick={() => {
                                                   if (isSelected) {
                                                     setNewProject(prev => ({...prev, teamAccess: prev.teamAccess.filter(id => id !== member.id)}));
                                                   } else {
                                                     setNewProject(prev => ({...prev, teamAccess: [...prev.teamAccess, member.id]}));
                                                   }
                                                 }}
                                                 className="flex items-center justify-between p-2 rounded-xl hover:bg-foreground/5 transition-colors text-left"
                                               >
                                                 <div className="flex items-center gap-3 overflow-hidden">
                                                   {avatarUrl ? (
                                                     <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-glass-border shrink-0" />
                                                   ) : (
                                                     <div className="w-6 h-6 rounded-full bg-erani-purple/10 border border-erani-purple/20 flex items-center justify-center shrink-0">
                                                       <span className="text-[10px] text-erani-purple font-black uppercase">
                                                         {fullName[0]}
                                                       </span>
                                                     </div>
                                                   )}
                                                   <div className="flex flex-col overflow-hidden pr-2">
                                                     <span className="text-xs font-bold text-foreground truncate block">{fullName}</span>
                                                     <span className="text-[9px] uppercase font-black tracking-widest text-nav-text truncate block">{displayRole}</span>
                                                   </div>
                                                 </div>
                                                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-erani-blue border-erani-blue' : 'border-glass-border'}`}>
                                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                 </div>
                                               </button>
                                             );
                                           })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                             </div>
                           </div>
                        </div>

                       {/* TAGS SECTION */}
                       <div className="flex flex-col gap-4" id="tour-audit-tags">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Organización y Colecciones</label>
                          <div className="flex flex-col p-5 rounded-2xl bg-foreground/5 border border-glass-border gap-4">
                             <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                      <Tag className="w-4 h-4 text-erani-purple" />
                                      <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Habilitar Etiquetas</span>
                                   </div>
                                   <span className="text-[8px] text-gray-500">Agrupa este proyecto en colecciones y colores</span>
                                </div>
                                <button 
                                  onClick={() => setIsTagsEnabled(!isTagsEnabled)}
                                  className={`w-10 h-6 rounded-full p-1 transition-all ${isTagsEnabled ? 'bg-erani-purple' : 'bg-gray-700'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${isTagsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                             </div>

                             <AnimatePresence>
                               {isTagsEnabled && (
                                 <motion.div 
                                   initial={{ height: 0, opacity: 0 }}
                                   animate={{ height: 'auto', opacity: 1 }}
                                   exit={{ height: 0, opacity: 0 }}
                                   className="flex flex-col gap-4 overflow-hidden pt-4 border-t border-glass-border"
                                 >
                                    <div className="flex gap-2 items-center">
                                       <input
                                         type="text"
                                         placeholder="Nueva etiqueta..."
                                         value={tagInput}
                                         onChange={(e) => setTagInput(e.target.value)}
                                         className="flex-1 bg-background/50 border border-glass-border rounded-xl px-3 py-2 text-[10px] font-bold text-foreground placeholder-gray-600 focus:outline-none focus:border-erani-purple"
                                         onKeyDown={(e) => {
                                           if (e.key === 'Enter' && tagInput.trim()) {
                                              e.preventDefault();
                                              setNewProject(prev => ({
                                                ...prev, 
                                                tags: [...prev.tags, { id: crypto.randomUUID(), label: tagInput.trim(), color: tagColor }]
                                              }));
                                              setTagInput("");
                                           }
                                         }}
                                       />
                                       <select 
                                         value={tagColor}
                                         onChange={(e) => setTagColor(e.target.value)}
                                         className="bg-background/50 border border-glass-border rounded-xl px-2 py-2 text-[10px] font-bold text-foreground focus:outline-none"
                                       >
                                         <option value="erani-blue">Azul</option>
                                         <option value="erani-purple">Morado</option>
                                         <option value="erani-coral">Coral</option>
                                         <option value="emerald-500">Esmeralda</option>
                                         <option value="amber-500">Ámbar</option>
                                       </select>
                                       <button 
                                         onClick={() => {
                                           if (tagInput.trim()) {
                                              setNewProject(prev => ({
                                                ...prev, 
                                                tags: [...prev.tags, { id: crypto.randomUUID(), label: tagInput.trim(), color: tagColor }]
                                              }));
                                              setTagInput("");
                                           }
                                         }}
                                         className="bg-erani-purple text-white rounded-xl px-3 py-2 text-[10px] font-black hover:bg-erani-purple/80 transition-all"
                                       >
                                         Add
                                       </button>
                                    </div>
                                    {newProject.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {newProject.tags.map(tag => (
                                          <div key={tag.id} className={`flex items-center gap-1 px-2 py-1 rounded-md bg-${tag.color}/10 border border-${tag.color}/20 text-${tag.color}`}>
                                            <span className="text-[9px] font-bold">{tag.label}</span>
                                            <button 
                                              onClick={() => setNewProject(prev => ({...prev, tags: prev.tags.filter(t => t.id !== tag.id)}))}
                                              className="ml-1 opacity-70 hover:opacity-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       </div>

                       <div className="flex flex-col gap-4" id="tour-audit-policies">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Políticas de Privacidad e Ingesta</label>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="flex items-center justify-between p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-emerald-500" />
                                      <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Almacenamiento</span>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => setNewProject({...newProject, allowStorage: !newProject.allowStorage})}
                                  className={`w-10 h-6 rounded-full p-1 transition-all ${newProject.allowStorage ? 'bg-erani-blue' : 'bg-gray-700'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${newProject.allowStorage ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                             </div>

                             <div className="flex items-center justify-between p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                      <Timer className="w-4 h-4 text-erani-coral" />
                                      <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Modo Temporal</span>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => setNewProject({...newProject, isTemporal: !newProject.isTemporal})}
                                  className={`w-10 h-6 rounded-full p-1 transition-all ${newProject.isTemporal ? 'bg-erani-coral' : 'bg-gray-700'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${newProject.isTemporal ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                             </div>
                          </div>

                          {newProject.isTemporal && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-5 rounded-2xl bg-erani-coral/5 border border-erani-coral/20 flex flex-col gap-3"
                            >
                               <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-erani-coral">Tiempo de Eliminación</span>
                                  <span className="text-[10px] font-bold text-foreground">{newProject.expirationHours} Horas</span>
                               </div>
                               <input 
                                 type="range"
                                 min="1"
                                 max="168"
                                 value={newProject.expirationHours}
                                 onChange={(e) => setNewProject({...newProject, expirationHours: parseInt(e.target.value)})}
                                 className="w-full accent-erani-coral"
                               />
                               <p className="text-[8px] text-erani-coral/60 italic">Los datos se borrarán automáticamente de {newProject.serverRegion} tras este periodo.</p>
                            </motion.div>
                          )}
                       </div>

                       <div className="flex flex-col gap-6 pt-6 border-t border-glass-border" id="tour-audit-ai">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-erani-blue flex items-center gap-2">
                             <Cpu className="w-4 h-4" /> Configuración del Motor IA
                          </label>
                        <div className="grid grid-cols-2 gap-6">
                             <div className="flex flex-col gap-3">
                                <label className="text-[9px] uppercase font-bold text-gray-500">Modelo AI (Motor)</label>
                                <select 
                                   value={newProject.aiModel || "gemini-2.5-flash"}
                                   onChange={(e) => setNewProject({...newProject, aiModel: e.target.value})}
                                   className="select-premium text-[10px] font-black"
                                 >
                                    <optgroup label="Motores Gemini (Google)">
                                      <option value="gemini-2.5-flash">Erani Engine 2.5 Flash (Forense Primario)</option>
                                      <option value="gemini-2.5-flash-lite">Erani Engine 2.5 Flash-Lite (Alta Disponibilidad)</option>
                                      <option value="gemini-2.5-pro">Erani Engine 2.5 Pro (Análisis Profundo)</option>
                                    </optgroup>
                                    <optgroup label="Motores OpenRouter (Alternativos / Respaldo)">
                                      <option value="openrouter/deepseek-chat">OpenRouter DeepSeek V3</option>
                                      <option value="openrouter/deepseek-r1">OpenRouter DeepSeek R1</option>
                                      <option value="openrouter/claude-3.5-sonnet">OpenRouter Claude 3.5 Sonnet</option>
                                      <option value="openrouter/gpt-4o">OpenRouter GPT-4o</option>
                                      <option value="openrouter/llama-3.3-70b">OpenRouter Llama 3.3 70B</option>
                                    </optgroup>
                                  </select>
                             </div>
                             <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                   <label className="text-[9px] uppercase font-bold text-gray-500">Temperatura (Creatividad)</label>
                                   <span className="text-[10px] font-black text-foreground">{newProject.aiTemperature}</span>
                                </div>
                                <input 
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={newProject.aiTemperature}
                                  onChange={(e) => setNewProject({...newProject, aiTemperature: parseFloat(e.target.value)})}
                                  className="w-full accent-erani-blue h-1.5 bg-foreground/10 rounded-full"
                                />
                                <div className="flex justify-between text-[7px] font-bold text-gray-600 uppercase tracking-widest">
                                   <span>Forense</span>
                                   <span>Creativo</span>
                                </div>
                             </div>
                          </div>
                       </div>

                      <div className="mt-auto pt-6 lg:border-t lg:border-glass-border">
                          <button 
                            id="tour-audit-submit"
                            onClick={handleCreateProject}
                            disabled={!newProject.name || storageStats?.isFull}
                            className="button-premium w-full py-6 rounded-[2rem] text-[11px] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-erani-blue/20"
                            title={storageStats?.isFull ? "Almacenamiento lleno" : ""}
                          >
                            {storageStats?.isFull ? "Almacenamiento Lleno" : activeProjectId ? "Guardar Configuración y Continuar" : "Crear Proyecto y Configurar Evidencia"} <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                      
                      {projects.length === 0 && (
                        <InAppTour 
                           tourKey="audit-project-setup" 
                           steps={SETUP_TOUR_STEPS} 
                           isSubscriptionActive={true}
                        />
                      )}
                   </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: SUITE (AUDITORIAS DENTRO DE PROYECTO) */}
            {view === "suite" && activeProjectId && activeProject && (
              <motion.div 
                key="suite"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between mb-4">
                   <div className="flex flex-col gap-1">
                      <div 
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-foreground cursor-pointer transition-colors mb-2"
                        onClick={() => setView("manage")}
                      >
                         <ArrowLeft className="w-4 h-4" /> Volver a Proyectos
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
                         <Shield className="w-8 h-8 text-erani-blue" />
                         {activeProject.name}
                      </h2>
                      <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Suite de Auditorías Internas</p>
                   </div>
                   <button 
                     onClick={() => setIsCreateSessionModalOpen(true)}
                     className="px-6 py-3 rounded-full bg-erani-blue text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-erani-blue/20"
                   >
                     <Plus className="w-4 h-4" /> Nueva Auditoría
                   </button>
                </div>

                {activeProject.auditSessions && activeProject.auditSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeProject.auditSessions.map(session => (
                       <div key={session.id} className="group relative bg-black/5 dark:bg-white/5 border border-glass-border rounded-[2rem] p-6 hover:bg-black/10 dark:hover:bg-white/10 hover:border-erani-blue/30 transition-all cursor-pointer shadow-xl shadow-black/5" onClick={() => { setSelectedAuditSessionId(session.id); setView("evidence"); }}>
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-erani-blue/10 flex items-center justify-center text-erani-blue shadow-sm">
                               <Shield className="w-6 h-6" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-glass-border bg-background/50">
                               {session.status === 'pending' ? 'Pendiente' : session.status === 'processing' ? 'Procesando' : 'Completado'}
                            </span>
                          </div>
                          <h4 className="text-lg font-black uppercase tracking-tight text-foreground mb-2 group-hover:text-erani-blue transition-colors">
                            {session.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-4 text-gray-500">
                             <Calendar className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-bold">{new Date(session.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                       </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-glass-border rounded-[3rem] bg-foreground/5 opacity-80">
                     <div className="w-20 h-20 rounded-3xl bg-erani-blue/10 flex items-center justify-center text-erani-blue mb-2">
                        <Shield className="w-10 h-10" />
                     </div>
                     <div className="flex flex-col items-center gap-2 text-center max-w-sm">
                        <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Sin Auditorías</h3>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Este proyecto aún no contiene auditorías. Crea tu primera sesión para comenzar a subir evidencias.</p>
                     </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW: SETUP PROJECT (EXISTING) */}
            {view === "evidence" && activeProjectId && (
              <motion.div 
                key="setup-existing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 h-full"
              >
                <div className="flex items-center justify-between">
                   <button 
                    onClick={() => setView("manage")}
                    className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-all"
                   >
                     <ArrowLeft className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Volver a Proyectos</span>
                   </button>

                   <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue">{activeProject?.id}</span>
                        <div className="flex items-center gap-2 group">
                          <input 
                            type="text" 
                            defaultValue={activeProject?.name}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            onBlur={async (e) => {
                              const newName = e.target.value.trim();
                              if (newName && newName !== activeProject?.name) {
                                 const updatedMetadata = { ...activeProject, name: newName };
                                 // Optimistic update using functional state to prevent stale closures
                                 setProjects(prev => prev.map(p => p.id === activeProject?.id ? { ...p, name: newName } : p));
                                 // DB update
                                 const { error } = await supabase.from('audits').update({ metadata: updatedMetadata }).eq('id', activeProject?.id);
                                 if (error) {
                                    console.error("Error updating project name:", error);
                                 } else {
                                    auditLogger.log("PROJECT_RENAME", `Proyecto renombrado a ${newName}`, { projectId: activeProject?.id }, 'update');
                                 }
                              }
                            }}
                            className="text-2xl font-black uppercase tracking-tight bg-transparent border-b-2 border-transparent hover:border-glass-border focus:border-erani-blue focus:outline-none transition-all text-right w-[300px] truncate"
                            title="Haz clic para editar"
                          />
                          <Edit2 className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="w-px h-10 bg-glass-border" />
                      <div className={`px-4 py-2 rounded-xl bg-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color}/10 border border-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color}/20 text-erani-${PROJECT_SIZES[activeProject?.size || 'small'].color} text-[10px] font-black uppercase tracking-widest`}>
                        {PROJECT_SIZES[activeProject?.size || 'small'].label}
                      </div>
                   </div>
                </div>
                     <div className="glassmorphism p-10 rounded-[3rem] border border-glass-border flex-1 grid lg:grid-cols-[1fr_400px] gap-12 overflow-hidden min-h-0">
                   {/* Left Column: Evidence Ingestion */}
                   <div className="flex flex-col gap-8 overflow-hidden">
                       <input 
                         type="file"
                         ref={fileInputRef}
                         onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                         className="hidden"
                         multiple
                       />
                       <div 
                         onClick={handleFileClick}
                         onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                         onDragLeave={() => setIsDragging(false)}
                         onDrop={handleDrop}
                         className={`relative h-56 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden shrink-0 cursor-pointer group ${
                           isDragging ? 'border-erani-blue bg-erani-blue/5' : 'border-glass-border bg-foreground/5 hover:border-erani-blue/30'
                         }`}
                       >
                         <motion.div 
                           animate={isDragging ? { scale: 1.1, rotate: [0, 5, -5, 0] } : {}}
                           className="w-16 h-16 rounded-2xl bg-foreground/5 border border-glass-border flex items-center justify-center text-erani-blue relative z-10 shadow-xl group-hover:scale-110 transition-transform"
                         >
                            <UploadCloud className="w-8 h-8" />
                         </motion.div>
                         <div className="flex flex-col items-center gap-1 relative z-10 text-center">
                            <span className="text-xl font-black uppercase tracking-tight group-hover:text-erani-blue transition-colors">Ingesta de Evidencia</span>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Haz clic o arrastra metadata operativa (Jira, Slack, Notion)</p>
                         </div>                     
                         
                         {/* Visual accents */}
                         <div className="absolute top-6 left-6 p-2 rounded-lg glassmorphism border-glass-border flex items-center gap-2 opacity-20 scale-75">
                            <FileText className="w-4 h-4 text-erani-blue" />
                            <span className="text-[8px] font-black uppercase">CSV / XLSX</span>
                         </div>
                         <div className="absolute bottom-6 right-6 p-2 rounded-lg glassmorphism border-glass-border flex items-center gap-2 opacity-20 scale-75">
                            <Database className="w-4 h-4 text-erani-purple" />
                            <span className="text-[8px] font-black uppercase">JSON Logs</span>
                         </div>
                      </div>

                   {/* Right Column: Uploaded Files */}
                   <div className="flex flex-col gap-4 overflow-hidden flex-1">
                         <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Auditorías Cargadas ({activeProject?.files.length})</h3>
                            {activeProject?.files.length! > 0 && (
                               <span className="text-[9px] font-black text-erani-blue uppercase tracking-widest">Evidencia Lista</span>
                            )}
                         </div>
                         
                         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-3">
                                {activeProject?.files.map((file, idx) => (
                                 <div key={file.id || idx} className="glassmorphism p-4 rounded-2xl flex flex-col gap-3 border border-glass-border group hover:border-erani-blue/30 transition-all">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 truncate">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                          file.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                                          file.status === 'error' ? 'bg-erani-coral/10 text-erani-coral' : 
                                          'bg-erani-blue/10 text-erani-blue'
                                        }`}>
                                           {file.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : 
                                            file.status === 'error' ? <X className="w-4 h-4" /> : 
                                            <FileText className="w-4 h-4" />}
                                        </div>
                                        <div className="flex flex-col truncate">
                                           <span className="text-[10px] font-bold text-foreground truncate">{file.name}</span>
                                           <span className="text-[8px] font-black text-gray-600">
                                             {(file.size / 1024).toFixed(1)} KB • {
                                               file.status === 'completed' ? 'Procesado' : 
                                               file.status === 'ingesting' ? 'Ingestando...' :
                                               file.status === 'error' ? 'Fallo' : 'Pendiente'
                                             }
                                           </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {file.path && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleDownloadFile(file.path!, file.name); }}
                                            className="p-1.5 rounded-lg text-gray-700 hover:text-erani-blue hover:bg-erani-blue/10 transition-all"
                                            title="Descargar"
                                          >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteFile(activeProject!.id, file.id, file.path); }}
                                          className="p-1.5 rounded-lg text-gray-700 hover:text-erani-coral hover:bg-erani-coral/10 transition-all"
                                          title="Eliminar"
                                        >
                                           <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Progress Bar for Ingestion */}
                                    {(file.status === 'ingesting' || file.status === 'completed' || file.status === 'error') && (
                                      <div className="flex flex-col gap-1.5">
                                        <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${file.progress}%` }}
                                            className={`h-full ${
                                              file.status === 'completed' ? 'bg-emerald-500' : 
                                              file.status === 'error' ? 'bg-erani-coral' : 
                                              'bg-erani-blue animate-pulse'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {file.status === 'error' && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <AlertTriangle className="w-3 h-3 text-erani-coral shrink-0" />
                                        <span className="text-[7px] font-black text-erani-coral uppercase truncate leading-tight" title={file.error}>
                                          Error: {file.error}
                                        </span>
                                      </div>
                                    )}
                                 </div>
                               ))}
                                {activeProject?.files.length === 0 && (
                                  <div className="col-span-2 h-40 flex flex-col items-center justify-center border border-dashed border-glass-border rounded-[2rem] opacity-30 bg-foreground/5">
                                     <Folder className="w-8 h-8 mb-2" />
                                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">Esperando Ingesta...</span>
                                  </div>
                                )}
                             </div>
                          </div>

                          {/* Digital Twins Checklist Moved Here */}
                          <div className="mt-4 pt-6 border-t border-glass-border">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue">Protocolos Gemelos Digitales</span>
                                <div className="flex gap-1">
                                   <div className="w-1.5 h-1.5 rounded-full bg-erani-blue animate-pulse" />
                                   <div className="w-1.5 h-1.5 rounded-full bg-erani-purple animate-pulse delay-75" />
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                                {[
                                  { label: "Verificación de Infraestructura", icon: Database },
                                  { label: "Validación de Contexto Histórico", icon: Clock },
                                  { label: "Blindaje de Datos Personales", icon: Shield },
                                  { label: "Alineación Forense Erani Engine", icon: Cpu }
                                ].map((item, i) => {
                                  const isChecked = activeProject?.status === 'completed' || (activeProject?.files && activeProject.files.some(f => f.status === 'completed'));
                                  return (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/5 border border-glass-border transition-colors hover:bg-foreground/10">
                                     <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isChecked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-background/50 border-glass-border'}`}>
                                        {isChecked ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />}
                                     </div>
                                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</span>
                                  </div>
                                )})}
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Right Column: Confirmation & Execution */}
                    <div className="flex flex-col gap-8 lg:border-l lg:border-glass-border lg:pl-12 min-h-0">
                      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0 pb-4">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-erani-blue" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue">Confirmación de Parámetros</span>
                             </div>
                             <button
                               type="button"
                               onClick={openQuickEditModal}
                               className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-erani-blue/10 hover:bg-erani-blue/20 text-erani-blue border border-erani-blue/20 text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105"
                               title="Editar Parámetros de Auditoría"
                             >
                                <Edit2 className="w-3 h-3" /> Editar
                             </button>
                          </div>

                         <div className="p-6 rounded-3xl bg-foreground/5 border border-glass-border flex flex-col gap-6">
                            
                            {/* Server & Team */}
                            <div className="grid grid-cols-2 gap-4">
                               <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                     <Globe className="w-3.5 h-3.5 text-gray-500" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Región</span>
                                  </div>
                                  <span className="text-[10px] font-black text-foreground">{activeProject?.serverRegion === 'us-west' ? 'US West' : activeProject?.serverRegion || 'US West'}</span>
                               </div>
                               <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                     <Users className="w-3.5 h-3.5 text-gray-500" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Acceso</span>
                                  </div>
                                  <span className="text-[10px] font-black text-foreground">
                                    {(activeProject?.teamAccess?.length || 0) === 0 ? "Solo Admin" : `${activeProject?.teamAccess?.length} Miembros`}
                                  </span>
                               </div>
                            </div>

                            <div className="w-full h-px bg-glass-border" />

                            {/* Storage & Privacy */}
                            <div className="grid grid-cols-2 gap-4">
                               <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                     <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Almacenamiento</span>
                                  </div>
                                  <span className={`text-[10px] font-black uppercase ${activeProject?.settings.allowStorage ? 'text-emerald-500' : 'text-erani-coral'}`}>
                                    {activeProject?.settings.allowStorage ? 'Cifrado Blindado' : 'Sin Almacenamiento'}
                                  </span>
                               </div>
                               <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                     <Timer className="w-3.5 h-3.5 text-erani-coral" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Modo Temporal</span>
                                  </div>
                                  <span className={`text-[10px] font-black uppercase ${activeProject?.isTemporal ? 'text-erani-coral' : 'text-gray-500'}`}>
                                    {activeProject?.isTemporal ? `${activeProject?.expirationHours} Horas` : 'Inactivo'}
                                  </span>
                               </div>
                            </div>

                            <div className="w-full h-px bg-glass-border" />

                            {/* Engine & Context */}
                            <div className="flex flex-col gap-4">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <Cpu className="w-3.5 h-3.5 text-erani-blue" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Motor Forense</span>
                                  </div>
                                  <span className="text-[10px] font-black text-erani-blue">
                                     {getModelShortLabel(activeProject?.settings.aiModel)}
                                  </span>
                               </div>
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <Zap className="w-3.5 h-3.5 text-amber-500" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Temperatura</span>
                                  </div>
                                  <span className="text-[10px] font-black text-foreground">{activeProject?.settings.aiTemperature}</span>
                               </div>
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <History className="w-3.5 h-3.5 text-erani-purple" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Contexto Histórico</span>
                                  </div>
                                  <span className={`text-[10px] font-black uppercase ${activeProject?.settings.historicalContext ? 'text-erani-purple' : 'text-gray-500'}`}>
                                     {activeProject?.settings.historicalContext ? 'Activo' : 'Inactivo'}
                                  </span>
                               </div>
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <Gem className="w-3.5 h-3.5 text-[#E2B75A]" />
                                     <span className="text-[9px] uppercase font-bold text-gray-500">Costo Operativo</span>
                                  </div>
                                  <span className="text-[10px] font-black text-[#E2B75A]">
                                     {activeProject?.size === 'small' ? '15 ERIS' : activeProject?.size === 'large' ? '45 ERIS' : '30 ERIS'}
                                  </span>
                               </div>
                            </div>
                            
                            <div className="p-3 rounded-xl bg-erani-blue/5 border border-erani-blue/10 text-[8px] text-erani-blue font-bold leading-tight flex items-center gap-2 mt-2">
                               <AlertTriangle className="w-3 h-3 shrink-0" />
                               Soberanía de Datos: Vectorización cifrada de metadata.
                            </div>
                         </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-glass-border flex flex-col gap-4 shrink-0">
                          {hasExistingReport && (
                            <button 
                               onClick={() => router.push(`/forensic?id=${activeProject?.id}&t=${Date.now()}`)}
                               className="w-full py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 border border-erani-blue text-erani-blue hover:bg-erani-blue/10 transition-all shadow-lg"
                            >
                               <FileText className="w-4 h-4" /> Ver Reporte y Descargar PDF
                            </button>
                          )}
                          <button 
                             onClick={() => setView("processing")}
                             disabled={activeProject?.files.length === 0 || !activeProject?.files.some(f => f.status === 'completed')}
                             className="button-premium w-full py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 disabled:opacity-30 shadow-xl shadow-erani-blue/20"
                          >
                             {hasExistingReport ? 'Re-Ejecutar Análisis' : 'Ejecutar Análisis Forense'} <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: PROCESSING */}
            {view === "processing" && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center overflow-hidden rounded-[3rem] border border-glass-border shadow-2xl"
              >
                {/* Header Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-foreground/5 z-20 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                    className="h-full bg-gradient-brand shadow-[0_0_15px_rgba(0,183,255,0.5)]"
                  />
                </div>

                {/* Central Container */}
                <div className="flex flex-col items-center justify-center max-w-2xl w-full z-10 px-6 gap-8">
                  
                  {/* Radar Animation */}
                  <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-erani-blue/5 blur-[80px] rounded-full animate-pulse" />
                      <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-erani-purple/5 blur-[80px] rounded-full animate-pulse delay-700" />
                    </div>

                    {/* Rotating Lines / Grid */}
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 500 500">
                      <defs>
                        <pattern id="hexGrid" width="50" height="43.3" patternUnits="userSpaceOnUse">
                          <path d="M25 0 L50 14.4 L50 43.3 L25 57.7 L0 43.3 L0 14.4 Z" fill="none" stroke="currentColor" strokeWidth="0.2" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#hexGrid)" />

                      <motion.circle 
                        cx="250" cy="250" r="220" 
                        fill="none" stroke="var(--erani-blue)" strokeWidth="0.5" strokeDasharray="10 15"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.circle 
                        cx="250" cy="250" r="160" 
                        fill="none" stroke="var(--erani-purple)" strokeWidth="0.5" strokeDasharray="5 10"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      />
                    </svg>

                    {/* Central Core (Erani Logo) */}
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-20"
                    >
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-background/40 backdrop-blur-3xl rounded-full flex items-center justify-center border border-erani-blue/30 shadow-[0_0_40px_rgba(0,183,255,0.2)] relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-brand opacity-10" />
                         <Image src="/isologo.png" alt="ERANI" width={70} height={70} className="logo-adaptive relative z-10" />
                      </div>
                    </motion.div>

                    {/* Active Radar Sweep */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute w-[340px] h-[340px] pointer-events-none rounded-full overflow-hidden"
                      style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 183, 255, 0.1) 60deg, transparent 60deg)' }}
                    />
                  </div>

                  {/* Info Header */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-erani-blue/10 border border-erani-blue/20">
                       <div className="w-1.5 h-1.5 rounded-full bg-erani-blue animate-ping" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-erani-blue">Forensic Inference Engine</span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.h2 
                        key={currentStepIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground font-montserrat leading-tight"
                      >
                         {PROCESSING_STEPS[currentStepIdx]?.label || "Analizando Evidencia"}
                      </motion.h2>
                    </AnimatePresence>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 font-montserrat tracking-widest uppercase">
                      Etapa {currentStepIdx + 1}/5 — <span className="text-erani-blue">{(processingProgress).toFixed(0)}%</span> Completado
                    </p>
                  </div>

                  {/* AI Streaming Logs */}
                  <div className="w-full h-40 sm:h-48 bg-foreground/5 rounded-3xl border border-glass-border p-4 sm:p-6 font-mono text-[9px] sm:text-[10px] overflow-hidden flex flex-col justify-end relative shadow-inner">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[var(--background)] to-transparent z-10 pointer-events-none" />
                    
                    <div className="flex flex-col gap-2 z-0 justify-end h-full">
                      <AnimatePresence mode="popLayout">
                        {analysisLogs.map((log) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3 py-0.5 text-gray-400"
                          >
                            <span className="text-erani-blue opacity-70 shrink-0">&gt;</span>
                            <span className={log.type === 'success' ? 'text-emerald-500 font-bold' : log.type === 'warning' ? 'text-amber-500 font-bold' : 'text-foreground/80'}>
                              {log.msg}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div className="flex items-center gap-3 py-0.5 mt-2">
                        <span className="text-erani-blue opacity-70 shrink-0">&gt;</span>
                        <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-3.5 bg-erani-blue" />
                      </div>
                    </div>
                  </div>

                  <button 
                     onClick={() => setView("manage")}
                     className="mt-4 px-6 py-3 rounded-2xl bg-erani-coral/10 hover:bg-erani-coral/20 text-erani-coral text-[9px] font-black uppercase tracking-widest transition-all border border-erani-coral/20"
                   >
                     Interrumpir Análisis
                   </button>
                </div>

                {/* Error Overlay (Relative to Right Panel) */}
                <AnimatePresence>
                  {analysisError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-8 z-50 bg-background/95 backdrop-blur-xl rounded-[2.5rem] border border-erani-coral/30 p-12 flex flex-col items-center justify-center text-center shadow-2xl"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-erani-coral/10 border border-erani-coral/20 flex items-center justify-center text-erani-coral mb-6">
                        <AlertTriangle className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">Fallo Crítico Detectado</h3>
                      <p className="text-sm font-medium text-gray-500 max-w-md mb-10 leading-relaxed font-montserrat">
                        {typeof analysisError === 'string' ? analysisError : (analysisError as any).message}
                      </p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setView("manage")}
                          className="px-10 py-4 rounded-full bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-widest transition-all border border-glass-border"
                        >
                          Cancelar Operación
                        </button>
                        <button 
                            onClick={async () => {
                              setAnalysisError(null);
                              setProcessingProgress(0);
                              setCurrentStepIdx(0);
                              // Log the event
                              await auditLogger.log('FORENSIC_RETRY', 'Reintento de análisis forense', {}, 'rotate-ccw');
                              setView("manage");
                              setTimeout(() => setView("processing"), 100);
                            }}
                          className="px-12 py-4 rounded-full bg-erani-coral text-white shadow-xl shadow-erani-coral/30 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          Reintentar Análisis
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}


            {/* VIEW: BENTO REPORT */}
            {view === "report" && forensicReport && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 pb-12"
              >
                {/* Report Header */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-erani-blue">
                        {forensicReport.report_metadata.audit_id}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-glass-border" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        {forensicReport.report_metadata.project_name}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                      Resultado del <span className="text-gradient-brand">Peritaje Forense</span>
                    </h2>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setView("manage")}
                      className="px-6 py-3 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-glass-border text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Cerrar Reporte
                    </button>
                    <button 
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forensicReport, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", `erani-report-${forensicReport.report_metadata?.audit_id || 'export'}.json`);
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                      }}
                      className="px-6 py-3 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
                      title="Descargar datos en crudo"
                    >
                      <FileJson className="w-4 h-4" /> JSON
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="px-8 py-3 rounded-full bg-erani-blue text-white shadow-lg shadow-erani-blue/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      <FileText className="w-4 h-4" /> Exportar PDF
                    </button>
                  </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Slide 1: Impacto Directo (Wide) */}
                  <div className="md:col-span-2 glassmorphism p-8 rounded-[2.5rem] border border-glass-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-32 h-32 text-erani-blue" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-nav-text">Impacto Directo y Scorecard</h3>
                        <span className="px-3 py-1 rounded-full bg-erani-coral/10 text-erani-coral text-[9px] font-black uppercase tracking-widest">Pérdida Crítica Detectada</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">Fuga Confirmada</span>
                          <span className="text-3xl font-black text-erani-coral">${forensicReport.slide_1_impacto_directo.fuga_confirmada_mxn.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-gray-500 uppercase">Tickets Liquidados</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">Riesgo Latente</span>
                          <span className="text-3xl font-black text-black dark:text-white">${forensicReport.slide_1_impacto_directo.riesgo_latente_mensual_mxn.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-gray-500 uppercase">Mensual Proyectado</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">Scope Creep</span>
                          <span className="text-3xl font-black text-erani-purple">{forensicReport.slide_1_impacto_directo.desviacion_scope_creep_pct}%</span>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-gray-500 uppercase">Desviación de Alcance</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">COI Anual</span>
                          <span className="text-3xl font-black text-erani-blue">${forensicReport.slide_1_impacto_directo.coi_anual_mxn.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-gray-500 uppercase">Costo de Inacción</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide 3: KPIs de Salud (Single) */}
                  <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-nav-text">Monitores de Salud AI</h3>
                    
                    <div className="flex flex-col gap-6">
                      {[
                        { label: "Bucle de Ineficiencia", val: forensicReport.slide_3_kpis_salud.monitor_bucle_pct, color: "#00B7FF" },
                        { label: "Índice de Fricción", val: forensicReport.slide_3_kpis_salud.indice_friccion_pct, color: "#9e80ff" },
                        { label: "Dark Data Index", val: forensicReport.slide_3_kpis_salud.dark_data_index_pct, color: "#FF5C5C" }
                      ].map((kpi, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <DonutChart percentage={kpi.val} size={50} strokeWidth={6} color={kpi.color} />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">{kpi.label}</span>
                            <span className="text-lg font-black text-black dark:text-white">{kpi.val}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                       <span className="text-[8px] font-black uppercase text-erani-blue tracking-widest block mb-1">Ceguera Operativa</span>
                       <p className="text-[9px] font-medium text-slate-800 dark:text-gray-300 italic leading-relaxed">{forensicReport.slide_3_kpis_salud.analisis_ceguera_operativa}</p>
                    </div>
                  </div>

                  {/* Slide 2: Análisis Forense (Full Width Bottom) */}
                  <div className="md:col-span-2 glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-nav-text">Hemorragias Críticas (Top 5)</h3>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded bg-erani-blue/10 text-erani-blue text-[8px] font-black uppercase">Consolidación Activa</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-glass-border">
                            <th className="py-4 text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">Ticket ID</th>
                            <th className="py-4 text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">Descripción</th>
                            <th className="py-4 text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">Origen</th>
                            <th className="py-4 text-[9px] font-black uppercase text-slate-600 dark:text-gray-400">Inferencia</th>
                            <th className="py-4 text-[9px] font-black uppercase text-slate-600 dark:text-gray-400 text-right">Costo Invisible</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forensicReport.slide_2_analisis_forense.top_5_tickets.map((ticket, i) => (
                            <tr key={i} className="border-b border-glass-border/50 group/row hover:bg-foreground/5 transition-colors">
                              <td className="py-4 text-[10px] font-mono font-bold text-erani-blue">{ticket.ticket_id}</td>
                              <td className="py-4 text-[10px] font-bold text-slate-800 dark:text-white max-w-[200px] truncate">{ticket.descripcion}</td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ticket.filtro === '[INT]' ? 'bg-amber-500/10 text-amber-500' : 'bg-erani-purple/10 text-erani-purple'}`}>
                                  {ticket.filtro}
                                </span>
                              </td>
                              <td className="py-4 text-[10px] font-bold text-slate-600 dark:text-gray-400">{ticket.hrs_calc}h Est.</td>
                              <td className="py-4 text-[10px] font-black text-black dark:text-white text-right">${ticket.costo_invisible_mxn.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-erani-blue/5">
                            <td colSpan={4} className="py-4 px-4 text-[10px] font-black uppercase text-slate-700 dark:text-gray-400">
                              Otros {forensicReport.slide_2_analisis_forense.resumen_consolidacion.otros_tickets_cantidad} Tickets Consolidados
                            </td>
                            <td className="py-4 px-4 text-[10px] font-black text-black dark:text-white text-right">
                              ${forensicReport.slide_2_analisis_forense.resumen_consolidacion.otros_tickets_monto_mxn.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Slide 4: Estrategia Firewall */}
                  <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-8 relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 opacity-5">
                       <Shield className="w-40 h-40 text-emerald-500" />
                    </div>
                    
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-nav-text">Estrategia de Blindaje</h3>
                    
                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-emerald-500">ROI Proyectado</span>
                        </div>
                        <span className="text-3xl font-black text-black dark:text-white">{forensicReport.slide_4_estrategia_firewall.roi_dias} Días</span>
                      </div>

                      <div className="p-5 rounded-3xl bg-erani-blue/10 border border-erani-blue/20 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-erani-blue" />
                          <span className="text-[10px] font-black uppercase text-erani-blue">Mejora de Margen</span>
                        </div>
                        <span className="text-3xl font-black text-black dark:text-white">+{forensicReport.slide_4_estrategia_firewall.proyeccion_margen_pct}%</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-500 tracking-widest">Protocolos de Bloqueo</span>
                        <p className="text-[10px] font-medium text-slate-800 dark:text-gray-300 leading-relaxed">{forensicReport.slide_4_estrategia_firewall.protocolos_bloqueo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Technical Annex (Full Width) */}
                  <div className="md:col-span-3 glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-erani-purple/10">
                        <FileJson className="w-5 h-5 text-erani-purple" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-nav-text">Anexo Técnico Forense</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-500 tracking-widest block">Metodología de Inferencia</span>
                        <p className="text-[10px] font-medium text-slate-800 dark:text-gray-300 leading-relaxed bg-foreground/5 p-4 rounded-2xl border border-glass-border">
                          {forensicReport.anexo_tecnico.metodologia_inferencia}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <span className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-500 tracking-widest block">Vectores de Auditoría</span>
                        <div className="flex flex-wrap gap-2">
                          {forensicReport.anexo_tecnico.vectores_auditados.map((vector, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full bg-erani-blue/10 border border-erani-blue/20 text-[9px] font-bold text-erani-blue">
                              {vector}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
            {/* Add InAppTour */}
            <InAppTour 
              tourKey="audit" 
              steps={[
                { targetId: "tour-audit-new", title: "Nuevo Proyecto", content: "Haz clic aquí para iniciar una nueva configuración de auditoría forense.", position: "bottom" },
                { targetId: "tour-audit-name", title: "Nombre de Auditoría", content: "Define un nombre descriptivo para identificar tu misión forense.", position: "right" }
              ]} 
            />
          </AnimatePresence>
        </div>

        {/* Floating Modal for Project Creation */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl bg-background border border-glass-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
              >
                <div className="p-6 border-b border-glass-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-foreground">
                      <Shield className="w-5 h-5 text-erani-blue" /> 
                      Nuevo Proyecto de <span className="text-erani-blue">Gobernanza</span>
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mt-1">Configuración Estricta de Retención y Análisis</p>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-gray-500 hover:text-foreground hover:bg-foreground/10 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                  {/* Narrative */}
                  <div className="p-4 rounded-2xl bg-erani-blue/5 border border-erani-blue/20">
                    <p className="text-xs text-erani-blue/90 leading-relaxed font-medium">
                      Estás por crear un entorno seguro de gobernanza de datos. Cada proyecto aprovisiona <strong className="text-erani-blue">512MB</strong> de almacenamiento en la bóveda, y cada auditoría interna consume <strong className="text-erani-blue">256MB</strong>. Este espacio será deducido de tu cuota global de ERANI Cloud.
                    </p>
                  </div>

                  {storageStats.usedGB + 0.5 >= storageStats.limitGB * 0.8 && (
                    <div className="p-4 rounded-2xl bg-erani-coral/10 border border-erani-coral/30 flex items-start gap-3">
                       <AlertTriangle className="w-5 h-5 text-erani-coral shrink-0 mt-0.5" />
                       <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-wider text-erani-coral">Aviso de Límite de Capacidad</span>
                          <span className="text-[10px] text-erani-coral/80 mt-1">
                             La creación de este proyecto y sus auditorías subsecuentes te acercarán a más del 80% del límite de tu plan ERANI Cloud ({storageStats.limitGB} GB). Te sugerimos actualizar tu suscripción para evitar interrupciones.
                          </span>
                       </div>
                    </div>
                  )}



                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Nombre del Proyecto Forense</label>
                    <div className="flex gap-3 relative">
                      <div className="relative">
                        <button 
                          onClick={() => setSelectingIconFor(selectingIconFor === 'new_project' ? null : 'new_project')}
                          className="w-12 h-12 rounded-xl bg-erani-blue/10 flex items-center justify-center text-erani-blue hover:bg-erani-blue/20 transition-colors border border-erani-blue/20 shrink-0"
                        >
                          {(() => {
                            const IconComp = ICON_LIBRARY.find(i => i.id === (newProject.icon || 'folder'))?.icon || Folder;
                            return <IconComp className="w-5 h-5" />;
                          })()}
                        </button>
                        <AnimatePresence>
                          {selectingIconFor === 'new_project' && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className="absolute top-14 left-0 z-50 glassmorphism p-3 rounded-2xl border border-glass-border shadow-2xl grid grid-cols-4 gap-2 w-48 bg-background/90 backdrop-blur-xl"
                            >
                              {ICON_LIBRARY.map((item) => (
                                <button 
                                  key={item.id}
                                  onClick={() => { setNewProject({...newProject, icon: item.id}); setSelectingIconFor(null); }}
                                  className={`p-2.5 flex items-center justify-center rounded-xl transition-colors ${newProject.icon === item.id || (!newProject.icon && item.id === 'folder') ? 'bg-erani-blue/20 text-erani-blue' : 'text-gray-500 hover:bg-foreground/10 hover:text-foreground'}`}
                                >
                                  <item.icon className="w-4 h-4" />
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <input 
                        type="text" 
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                        placeholder="Ej. Auditoría Corporativa Q4"
                        className="bg-background border border-glass-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-erani-blue/50 transition-colors placeholder:text-gray-400 flex-1 text-foreground"
                      />
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-4 relative z-[60]">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-foreground/5 relative group">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          Almacenamiento Activo
                          <HelpCircle className="w-3 h-3 text-gray-500 cursor-help" />
                        </span>
                        <span className="text-[9px] text-gray-500">Permitir ingesta en ERANI Cloud</span>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" checked={newProject.allowStorage} onChange={(e) => setNewProject({...newProject, allowStorage: e.target.checked})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-400 dark:border-gray-700 checked:border-erani-blue checked:right-0 checked:bg-erani-blue transition-all" />
                        <label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                      
                      <div className="absolute top-full mt-2 left-0 w-80 p-4 bg-background/95 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                         <p className="text-xs font-medium text-slate-600 dark:text-gray-300 leading-relaxed">Si no activa almacenamiento no se consumirá espacio en ERANI Cloud y podrá guardar su auditoría solo en formato PDF (se enviará a su correo, previa configuración de notificaciones).</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-foreground/5 relative group">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          Habilitar ERANI AI
                          <HelpCircle className="w-3 h-3 text-gray-500 cursor-help" />
                        </span>
                        <span className="text-[9px] text-gray-500">Habilitar inferencia profunda</span>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" checked={newProject.historicalContext} onChange={(e) => setNewProject({...newProject, historicalContext: e.target.checked})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-400 dark:border-gray-700 checked:border-erani-blue checked:right-0 checked:bg-erani-blue transition-all" />
                        <label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer"></label>
                      </div>
                      
                      <div className="absolute top-full mt-2 right-0 w-80 p-4 bg-background/95 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                         <p className="text-xs font-medium text-slate-600 dark:text-gray-300 leading-relaxed">Permite a la IA evaluar y analizar tu proyecto y las auditorías en tiempo real. Solo aplica a las evidencias que hayan sido almacenadas activamente.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 relative z-[55]">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Etiquetas Universales</label>
                    
                    {/* The Multi-Select Input Banner */}
                    <div 
                      className="min-h-[46px] bg-background border border-glass-border rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center cursor-text transition-colors hover:border-erani-blue/50 focus-within:border-erani-blue" 
                      onClick={() => setIsTagsEnabled(true)}
                    >
                       {/* Render Selected Tags inside the Banner */}
                       {newProject.tags.map((tag: any) => {
                          const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                          return (
                             <span key={tag.id} className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${colorDef.bgSoft} ${colorDef.border} ${colorDef.text}`}>
                               {tag.name}
                               <button 
                                 type="button" 
                                 onClick={(e) => { 
                                   e.stopPropagation(); 
                                   setNewProject({...newProject, tags: newProject.tags.filter((t: any) => t.id !== tag.id)}); 
                                 }} 
                                 className="hover:text-foreground hover:scale-110 transition-transform"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             </span>
                          );
                       })}
                       
                       {/* The internal text input for filtering / creating */}
                       <input 
                         type="text"
                         value={tagInput}
                         onChange={(e) => { setTagInput(e.target.value); setIsTagsEnabled(true); }}
                         onFocus={() => setIsTagsEnabled(true)}
                         placeholder={newProject.tags.length === 0 ? "Seleccionar o crear etiquetas..." : ""}
                         className="flex-1 min-w-[150px] bg-transparent outline-none text-xs text-foreground placeholder:text-gray-500 font-medium"
                       />
                       <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 pointer-events-none" />
                    </div>

                    {/* The Dropdown Menu */}
                    <AnimatePresence>
                      {isTagsEnabled && (
                         <motion.div 
                           initial={{ opacity: 0, y: -5 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -5 }}
                           className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl p-3 z-50 overflow-hidden"
                         >
                            {/* Close overlay to catch outside clicks (simplified version for demo, usually implemented via a hook) */}
                            
                            {/* List of existing unselected tags */}
                            {workspaceTags.filter(t => !newProject.tags.find((pt: any) => pt.id === t.id)).length > 0 && (
                              <div className="mb-3">
                                <span className="text-[9px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Disponibles en la Organización</span>
                                <div className="flex flex-wrap gap-2">
                                   {workspaceTags.filter(t => !newProject.tags.find((pt: any) => pt.id === t.id)).map(tag => {
                                      const colorDef = COLOR_TAGS.find(c => c.id === tag.color) || COLOR_TAGS[0];
                                      return (
                                        <div 
                                          key={tag.id} 
                                          onClick={(e) => { 
                                            e.stopPropagation();
                                            setNewProject({...newProject, tags: [...newProject.tags, tag]}); 
                                            setTagInput(''); 
                                            setIsTagsEnabled(false); 
                                          }} 
                                          className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all ${colorDef.bgSoft} ${colorDef.border} ${colorDef.text}`}
                                        >
                                          {tag.name}
                                        </div>
                                      );
                                   })}
                                </div>
                              </div>
                            )}
                            
                            {/* Create new tag UI if the user is typing something that doesn't exist */}
                            {tagInput.trim() && !workspaceTags.find(t => t.name.toLowerCase() === tagInput.trim().toLowerCase()) && (
                               <div className="p-3 bg-foreground/5 rounded-xl border border-glass-border">
                                 <span className="text-xs font-bold text-foreground block mb-3">
                                   Crear nueva etiqueta: <span className="text-erani-purple">"{tagInput}"</span>
                                 </span>
                                 <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-wrap gap-2">
                                       {COLOR_TAGS.map(c => (
                                         <button 
                                           key={c.id} 
                                           type="button" 
                                           onClick={(e) => { e.stopPropagation(); setTagColor(c.id); }} 
                                           className={`w-5 h-5 rounded-full ${c.bg} border-2 ${tagColor === c.id ? 'border-foreground shadow-sm scale-110' : 'border-transparent opacity-50'} transition-all`} 
                                           title={c.label} 
                                         />
                                       ))}
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); handleCreateTag(); }} 
                                      className="px-4 py-1.5 rounded-lg bg-erani-blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
                                    >
                                      Crear
                                    </button>
                                 </div>
                               </div>
                            )}

                            {/* Empty state when they haven't typed anything and there are no tags */}
                            {!tagInput.trim() && workspaceTags.filter(t => !newProject.tags.find((pt: any) => pt.id === t.id)).length === 0 && (
                              <p className="text-xs text-gray-500 italic p-2 text-center">Escribe para crear tu primera etiqueta universal.</p>
                            )}
                         </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col gap-2 relative z-50">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Workspace / Data Room de Destino</label>
                    <div className="relative">
                      <div 
                        onClick={() => setIsCollectionSelectorOpen(!isCollectionSelectorOpen)}
                        className="bg-background border border-glass-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-erani-blue/50 transition-colors text-foreground cursor-pointer flex items-center justify-between"
                      >
                        <span className={selectedCollectionId ? "text-foreground" : "text-gray-500"}>
                          {selectedCollectionId ? collectionsData.find(c => c.id === selectedCollectionId)?.name : "(Opcional) Seleccionar Data Room"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCollectionSelectorOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      <AnimatePresence>
                        {isCollectionSelectorOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                          >
                            <div 
                              onClick={() => { setSelectedCollectionId(""); setIsCollectionSelectorOpen(false); }}
                              className={`px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${!selectedCollectionId ? 'bg-erani-blue/10 text-erani-blue' : 'text-gray-500 hover:bg-foreground/5 hover:text-foreground'}`}
                            >
                              (Opcional) Seleccionar Data Room
                            </div>
                            {collectionsData.map(c => (
                              <div 
                                key={c.id} 
                                onClick={() => { setSelectedCollectionId(c.id); setIsCollectionSelectorOpen(false); }}
                                className={`px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${selectedCollectionId === c.id ? 'bg-erani-blue/10 text-erani-blue' : 'text-foreground hover:bg-foreground/5'}`}
                              >
                                {c.name}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Acceso a Miembros del Equipo</label>
                    <div className="flex flex-wrap gap-2">
                      {orgMembers.filter(m => m.profile_id !== profile?.id).length === 0 && (
                        <p className="text-xs text-gray-500 italic">No hay otros miembros en tu organización.</p>
                      )}
                      {orgMembers.filter(m => m.profile_id !== profile?.id).map(member => {
                        const isSelected = newProject.teamAccess.includes(member.id);
                        const fullName = member.profiles?.full_name || member.email.split('@')[0] || "Usuario";
                        const avatarUrl = member.profiles?.avatar_url;
                        return (
                          <div 
                            key={member.id}
                            onClick={() => {
                              if (isSelected) {
                                setNewProject(prev => ({...prev, teamAccess: prev.teamAccess.filter(id => id !== member.id)}));
                              } else {
                                setNewProject(prev => ({...prev, teamAccess: [...prev.teamAccess, member.id]}));
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${isSelected ? 'bg-erani-blue/10 border-erani-blue/30 text-erani-blue ring-1 ring-erani-blue/50' : 'bg-foreground/5 border-glass-border text-gray-500 hover:text-foreground hover:border-gray-400'}`}
                          >
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={fullName} className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-erani-blue/20 flex items-center justify-center">
                                <User className="w-2.5 h-2.5 text-erani-blue" />
                              </div>
                            )}
                            <span className="text-[10px] font-bold">{fullName}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-erani-purple/20 bg-erani-purple/5">
                    <input 
                      type="checkbox" 
                      checked={acceptedTC}
                      onChange={(e) => setAcceptedTC(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 text-erani-purple focus:ring-erani-purple bg-background"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-erani-purple uppercase tracking-wider">Declaración de Responsabilidad</span>
                      <span className="text-[10px] text-gray-400 mt-1">Acepto los <a href="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/T&C_ERANI.pdf" target="_blank" className="underline">Términos y Condiciones</a>, y comprendo que el contenido ingresado estará sujeto a análisis heurístico bajo mi consentimiento explícito.</span>
                    </div>
                  </label>

                </div>
                
                <div className="p-6 border-t border-glass-border flex justify-end gap-3">
                  <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-foreground transition-colors">
                    Cancelar
                  </button>
                  <button 
                    disabled={!acceptedTC || !newProject.name}
                    onClick={() => {
                      handleCreateProject();
                      setIsCreateModalOpen(false);
                    }} 
                    className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-erani-blue text-white shadow-lg shadow-erani-blue/20 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Aprovisionar Proyecto <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
          {/* Quick Edit Parameters Modal */}
          {isQuickEditModalOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-2xl overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-3xl glassmorphism rounded-[2.5rem] p-8 border border-glass-border shadow-2xl relative my-auto flex flex-col gap-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-glass-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-erani-blue/10 text-erani-blue border border-erani-blue/20">
                      <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                        Editar Parámetros de Auditoría
                      </h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Configura acceso, almacenamiento, región, IA y retención en tiempo real
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuickEditModalOpen(false)}
                    className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-gray-400 hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* 1. ACCESO DEL EQUIPO */}
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2">
                        <Users className="w-4 h-4" /> Acceso del Equipo
                      </label>
                      <span className="text-[9px] font-bold text-gray-400 bg-foreground/5 px-2 py-0.5 rounded-full">
                        {newProject.teamAccess.length === 0 ? 'Solo Admin' : `${newProject.teamAccess.length} Miembros`}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => setNewProject(prev => ({ ...prev, teamAccess: [] }))}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          newProject.teamAccess.length === 0
                            ? 'bg-erani-blue/10 border-erani-blue text-erani-blue'
                            : 'bg-background/40 border-glass-border text-foreground/70 hover:bg-foreground/5'
                        }`}
                      >
                        <span>Solo Administrador</span>
                        {newProject.teamAccess.length === 0 && <CheckCircle2 className="w-4 h-4 text-erani-blue" />}
                      </button>

                      {orgMembers.filter(m => m.profile_id !== profile?.id).map(member => {
                        const isSelected = newProject.teamAccess.includes(member.id);
                        const fullName = member.profiles?.full_name || member.email.split('@')[0] || "Usuario";
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setNewProject(prev => ({ ...prev, teamAccess: prev.teamAccess.filter(id => id !== member.id) }));
                              } else {
                                setNewProject(prev => ({ ...prev, teamAccess: [...prev.teamAccess, member.id] }));
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-erani-blue/10 border-erani-blue text-erani-blue'
                                : 'bg-background/40 border-glass-border text-foreground/70 hover:bg-foreground/5'
                            }`}
                          >
                            <span className="truncate">{fullName}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-erani-blue shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. REGIÓN DEL ALMACENAMIENTO DE DATOS (Custom ERANI UI Dropdown) */}
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-foreground/5 border border-glass-border relative">
                    <label className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Región de Almacenamiento
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegionDropdownOpen(!isRegionDropdownOpen);
                          setIsModelDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-background/50 border border-glass-border hover:border-erani-blue/40 text-xs font-bold text-foreground transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-erani-blue/10 border border-erani-blue/20 flex items-center justify-center text-erani-blue shrink-0">
                            <Globe className="w-4 h-4" />
                          </div>
                          <span className="font-black text-foreground">
                            {newProject.serverRegion === 'us-west' ? 'US West (Oregon)' :
                             newProject.serverRegion === 'us-east' ? 'US East (N. Virginia)' :
                             newProject.serverRegion === 'eu-central' ? 'EU Central (Frankfurt)' :
                             newProject.serverRegion === 'latam-south' ? 'LATAM South (Sao Paulo)' : 'US West (Oregon)'}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180 text-erani-blue' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isRegionDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-background/95 backdrop-blur-2xl border border-glass-border rounded-2xl shadow-2xl flex flex-col gap-1.5 overflow-hidden"
                          >
                            {[
                              { id: 'us-west', label: 'US West (Oregon)', desc: 'Servidor Forense Primario' },
                              { id: 'us-east', label: 'US East (N. Virginia)', desc: 'Alta Capacidad & Baja Latencia' },
                              { id: 'eu-central', label: 'EU Central (Frankfurt)', desc: 'Cumplimiento GDPR Estricto' },
                              { id: 'latam-south', label: 'LATAM South (Sao Paulo)', desc: 'Soberanía de Datos Regional' },
                            ].map((region) => {
                              const isSelected = newProject.serverRegion === region.id;
                              return (
                                <button
                                  key={region.id}
                                  type="button"
                                  onClick={() => {
                                    setNewProject(prev => ({ ...prev, serverRegion: region.id }));
                                    setIsRegionDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? 'bg-erani-blue/10 border-erani-blue/40 text-erani-blue shadow-sm'
                                      : 'bg-background/40 border-glass-border hover:bg-foreground/5 text-foreground/80'
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-wider">{region.label}</span>
                                    <span className="text-[8px] font-bold text-gray-400">{region.desc}</span>
                                  </div>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-erani-blue shrink-0" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-[8px] text-gray-500 italic">Garantiza el cumplimiento normativo y la soberanía territorial de datos.</p>
                  </div>

                  {/* 3. SELECCIÓN DEL MODELO Y TEMPERATURA (Custom ERANI UI Dropdown) */}
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-foreground/5 border border-glass-border relative">
                    <label className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2">
                      <Cpu className="w-4 h-4" /> Motor Forense IA & Temperatura
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModelDropdownOpen(!isModelDropdownOpen);
                          setIsRegionDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-background/50 border border-glass-border hover:border-erani-blue/40 text-xs font-bold text-foreground transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-erani-blue/10 border border-erani-blue/20 flex items-center justify-center text-erani-blue shrink-0">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <span className="font-black text-foreground">
                             {getModelLabel(newProject.aiModel)}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180 text-erani-blue' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isModelDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            className="absolute top-full left-0 right-0 mt-2 z-50 p-2.5 bg-background/95 backdrop-blur-2xl border border-glass-border rounded-2xl shadow-2xl flex flex-col gap-2 max-h-[320px] overflow-y-auto"
                          >
                            {[
                              {
                                category: 'Motores Gemini (Google)',
                                items: [
                                  { id: 'gemini-2.5-flash', label: 'Erani Engine 2.5 Flash (Gemini)', desc: 'Forense Primario • Velocidad & Precisión' },
                                  { id: 'gemini-2.5-flash-lite', label: 'Erani Engine 2.5 Flash-Lite (Gemini)', desc: 'Alta Disponibilidad • Respuesta Ultra Rápida' },
                                  { id: 'gemini-2.5-pro', label: 'Erani Engine 2.5 Pro (Gemini)', desc: 'Análisis Profundo • Heurística Multimodal' },
                                ]
                              },
                              {
                                category: 'Motores OpenRouter (Alternativos / Respaldo)',
                                items: [
                                  { id: 'openrouter/deepseek-chat', label: 'OpenRouter DeepSeek V3', desc: 'Respaldo Eficiente • Razonamiento Estructurado' },
                                  { id: 'openrouter/deepseek-r1', label: 'OpenRouter DeepSeek R1', desc: 'Inferencia Avanzada • Lógica Forense Profunda' },
                                  { id: 'openrouter/claude-3.5-sonnet', label: 'OpenRouter Claude 3.5 Sonnet', desc: 'Máxima Precisión Auditora & Análisis Complejo' },
                                  { id: 'openrouter/gpt-4o', label: 'OpenRouter GPT-4o', desc: 'Síntesis Multimodal & Evaluación Global' },
                                  { id: 'openrouter/llama-3.3-70b', label: 'OpenRouter Llama 3.3 70B', desc: 'Motor Abierto de Alto Rendimiento' },
                                ]
                              }
                            ].map((group) => (
                              <div key={group.category} className="flex flex-col gap-1">
                                <div className="text-[9px] uppercase font-black tracking-widest text-erani-blue/80 px-2 pt-1.5 pb-0.5 border-b border-glass-border/40">
                                  {group.category}
                                </div>
                                {group.items.map((model) => {
                                  const isSelected = newProject.aiModel === model.id;
                                  return (
                                    <button
                                      key={model.id}
                                      type="button"
                                      onClick={() => {
                                        setNewProject(prev => ({ ...prev, aiModel: model.id }));
                                        setIsModelDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                        isSelected
                                          ? 'bg-erani-blue/10 border-erani-blue/40 text-erani-blue shadow-sm'
                                          : 'bg-background/40 border-glass-border hover:bg-foreground/5 text-foreground/80'
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-wider">{model.label}</span>
                                        <span className="text-[8px] font-bold text-gray-400">{model.desc}</span>
                                      </div>
                                      {isSelected && <CheckCircle2 className="w-4 h-4 text-erani-blue shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] uppercase font-bold text-gray-400">Temperatura (Creatividad):</span>
                      <span className="text-xs font-black text-erani-blue">{newProject.aiTemperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={newProject.aiTemperature}
                      onChange={(e) => setNewProject({ ...newProject, aiTemperature: parseFloat(e.target.value) })}
                      className="w-full accent-erani-blue h-1.5 bg-foreground/10 rounded-full"
                    />
                  </div>

                  {/* 4. MODO TEMPORAL Y CONTEXTO HISTÓRICO */}
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-foreground/5 border border-glass-border">
                    <label className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Retención & Contexto Histórico
                    </label>

                    {/* Modo Temporal ERANI UI Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-background/40 border border-glass-border shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <Timer className="w-4 h-4 text-erani-coral" />
                        <span className="text-xs font-bold text-foreground">Modo Temporal</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewProject(prev => ({ ...prev, isTemporal: !prev.isTemporal }))}
                        className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 relative border shadow-inner flex items-center ${
                          newProject.isTemporal 
                            ? 'bg-gradient-to-r from-erani-coral/80 to-erani-coral border-erani-coral/50 shadow-[0_0_12px_rgba(255,107,107,0.4)]' 
                            : 'bg-foreground/10 border-glass-border'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform flex items-center justify-center text-[9px] font-black ${
                          newProject.isTemporal ? 'translate-x-6 text-erani-coral' : 'translate-x-0 text-gray-400'
                        }`}>
                          {newProject.isTemporal ? '✓' : ''}
                        </div>
                      </button>
                    </div>

                    {newProject.isTemporal && (
                      <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-erani-coral/10 border border-erani-coral/20">
                        <div className="flex justify-between text-[9px] font-bold text-erani-coral">
                          <span>Autodestrucción:</span>
                          <span>{newProject.expirationHours} Horas</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="168"
                          value={newProject.expirationHours}
                          onChange={(e) => setNewProject({ ...newProject, expirationHours: parseInt(e.target.value) })}
                          className="w-full accent-erani-coral"
                        />
                      </div>
                    )}

                    {/* Contexto Histórico ERANI UI Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-background/40 border border-glass-border shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <History className="w-4 h-4 text-erani-purple" />
                        <span className="text-xs font-bold text-foreground">Contexto Histórico</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewProject(prev => ({ ...prev, historicalContext: !prev.historicalContext }))}
                        className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 relative border shadow-inner flex items-center ${
                          newProject.historicalContext 
                            ? 'bg-gradient-to-r from-erani-purple/80 to-erani-purple border-erani-purple/50 shadow-[0_0_12px_rgba(116,4,255,0.4)]' 
                            : 'bg-foreground/10 border-glass-border'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform flex items-center justify-center text-[9px] font-black ${
                          newProject.historicalContext ? 'translate-x-6 text-erani-purple' : 'translate-x-0 text-gray-400'
                        }`}>
                          {newProject.historicalContext ? '✓' : ''}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickEditModalOpen(false);
                      if (activeProject) {
                        loadProjectIntoConfig(activeProject);
                        setView("config");
                      }
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-erani-blue hover:underline"
                  >
                    Configuración Avanzada Completa →
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsQuickEditModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-[10px] font-black uppercase tracking-widest transition-all border border-glass-border"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveQuickParameters}
                      className="button-premium px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Guardar Parámetros
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

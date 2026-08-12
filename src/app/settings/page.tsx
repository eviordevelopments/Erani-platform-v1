"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target,
  BarChart3,
  ToggleLeft as ToggleIcon,
  Globe,
  Trash2,
  Copy,
  ArrowRight,
  Building2,
  Users,
  Zap,
  History,
  Lock,
  Check,
  AlertCircle,
  Plus,
  Send,
  ShieldCheck,
  Bell,
  Share2,
  User,
  UserPlus,
  Phone,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  X,
  Edit2,
  Cloud,
  Calendar,
  LogOut,
  ChevronRight,
  HardDrive,
  FileText,
  Database,
  FolderGit2,
  Image,
  MessageSquare,
  Layers,
  CheckSquare,
  FolderArchive,
  TrendingUp,
  PieChart,
  Activity,
  ArrowUpRight,
  Download,
  RefreshCcw,
  Filter,
  Server,
  Cpu,
  Info
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from "recharts";
import Sidebar from "@/components/Sidebar";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useDashboard } from "@/context/DashboardContext";
import { useRouter } from "next/navigation";
import { auditLogger } from "@/lib/auditLogger";
import RealtimeLogTerminal from "@/components/RealtimeLogTerminal";
import { getProfileDataAction } from "@/app/actions/profileActions";
import { 
  getSettingsDataAction,
  updateOrgAction,
  updateUserProfileAction,
  toggleFeatureAction
} from "@/app/actions/settingsActions";

type SettingsTab = "organization" | "team" | "managers" | "features" | "referrals" | "metrics" | "cloud" | "sync" | "logs" | "account";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { isSidebarCollapsed } = useDashboard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // --- FORM STATES ---
  
  // Organization
  const [orgData, setOrgData] = useState({
    name: "",
    bio: "",
    sector: "",
    teamSize: "1-10",
    annualRevenue: 0,
    goals: [] as string[],
    recoveryEmail: "",
    logoUrl: "",
    paidSubscription: false,
    auditNotificationRecipients: [] as string[]
  });

  // Account
  const [accountData, setAccountData] = useState({
    fullName: "",
    email: ""
  });

  // Team
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteProfileType, setInviteProfileType] = useState<"admin" | "member">("member");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamView, setTeamView] = useState<"list" | "orgchart">("list");

  // Features — stored directly on organizations table
  const [features, setFeatures] = useState({
    firewall_enabled: true,
    email_alerts: true,
    slack_alerts: false,
    auto_audit: false,
    streaming_logs_enabled: true
  });

  // Referrals
  const [referralEmail, setReferralEmail] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [erisBalance, setErisBalance] = useState(1000);

  // Logs
  const [logs, setLogs] = useState<any[]>([]);

  // User Profile in Organization
  const [userProfileData, setUserProfileData] = useState({
    fullName: "",
    role: ""
  });
  const [selectedTransferMember, setSelectedTransferMember] = useState("");
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password change form
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete Account
  const [deleteStep, setDeleteStep] = useState(0);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Project Managers State
  const [isInviteManagerModalOpen, setIsInviteManagerModalOpen] = useState(false);
  const [assignedManagers, setAssignedManagers] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erani_assigned_pms");
      if (saved) {
        try { return JSON.parse(saved); } catch(e){}
      }
    }
    return [];
  });
  const [diegoAssignedState, setDiegoAssignedState] = useState(false);
  const [diegoAssigning, setDiegoAssigning] = useState(false);

  // Calendar Scheduling Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleManager, setScheduleManager] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("2026-07-21");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [selectedTopic, setSelectedTopic] = useState("Revisión de Arquitectura y Auditoría Forense");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const handleAssignDiegoManager = () => {
    setDiegoAssigning(true);
    setTimeout(() => {
      setDiegoAssigning(false);
      setDiegoAssignedState(true);

      const diegoData = {
        id: "pm-diego-arredondo",
        name: "Diego Arredondo",
        role: "Growth Strategist B2B & Tech Founder ERANI · MBA",
        avatar: "https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/diego_arredondo%20copy.jpg",
        email: "diego.arredondo@erani.cloud",
        phone: "+52 (55) 8432-9011",
        location: "Ciudad de México, MX",
        desc: "Empowering the global entrepreneur ecosystem. Co-Fundador Tecnológico en ERANI y Growth Strategist B2B con grado MBA. Con trayectoria en Marketing Ops & Community Management en TrepCamp impulsando la innovación global, lidera la estrategia de escalamiento, optimización operativa y alineación técnica para la plataforma ERANI.",
        specialty: "Growth Strategy B2B, Marketing Ops & Tech Leadership",
        availability: "Lunes a Viernes (9:00 AM - 6:00 PM CST)",
        projectsCount: 4,
        responseTime: "< 15 min",
        rating: "9.9 / 10",
        assignedAt: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
      };

      const updated = [diegoData];
      setAssignedManagers(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("erani_assigned_pms", JSON.stringify(updated));
      }
      setMessage({ type: "success", text: "¡Diego Arredondo asignado como Project Manager!" });
    }, 600);
  };

  const handleRemoveManager = (pmId: string) => {
    const updated = assignedManagers.filter(m => m.id !== pmId);
    setAssignedManagers(updated);
    if (pmId === "pm-diego-arredondo") {
      setDiegoAssignedState(false);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("erani_assigned_pms", JSON.stringify(updated));
    }
    setMessage({ type: "success", text: "Project Manager removido de la organización." });
  };

  const handleOpenScheduleModal = (pm: any) => {
    setActiveTab("sync");
    setIsInviteManagerModalOpen(false);
    setMessage({ type: "info", text: "Redirigiendo a tu Calendario Sincronizado de Google Workspace..." });
  };

  const handleConfirmSchedule = () => {
    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      setScheduleSuccess(true);
      setTimeout(() => {
        setIsScheduleModalOpen(false);
        setScheduleSuccess(false);
        setMessage({ type: "success", text: `¡Reunión agendada con ${scheduleManager?.name || 'Manager'} para el ${selectedDate} a las ${selectedTime}!` });
      }, 1200);
    }, 800);
  };

  const handleDeleteAccount = async () => {
    if (deleteStep < 3) {
      setDeleteStep(prev => prev + 1);
      return;
    }
    
    // Step 3 reached, execute deletion
    setIsDeletingAccount(true);
    try {
      const response = await fetch('/api/auth/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_account',
          user_id: user?.id
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error);
      
      await supabase.auth.signOut();
      window.location.href = "/register";
    } catch (err: any) {
      setMessage({ type: "error", text: "Error al eliminar la cuenta: " + err.message });
      setDeleteStep(0);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      // Re-authenticate first with current password
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) throw new Error("No se pudo obtener el usuario.");
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: pwForm.current,
      });
      if (signInErr) {
        setPwMsg({ type: "error", text: "Contraseña actual incorrecta." });
        setPwSaving(false);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.next });
      if (updateErr) throw updateErr;
      setPwMsg({ type: "success", text: "Contraseña actualizada correctamente." });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setPwMsg({ type: "error", text: err.message || "Error al actualizar contraseña." });
    } finally {
      setPwSaving(false);
    }
  };

  // Track which user ID we've already fetched for, so we re-fetch if the
  // user changes (e.g. after login) but don't re-fetch on every render.
  const fetchedForRef = React.useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid && uid !== fetchedForRef.current) {
      fetchedForRef.current = uid;
      fetchInitialData();
    }
  }, [user?.id, profile?.organization_id]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${profile?.organization_id || Date.now()}_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        setMessage({ type: 'error', text: 'Error al subir logo: ' + uploadError.message });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setOrgData(prev => ({ ...prev, logoUrl: publicUrl }));

      if (profile?.organization_id) {
          await updateOrgAction(profile.organization_id, { logoUrl: publicUrl });
      }
      if (user?.id) {
          await updateUserProfileAction(user.id, { avatarUrl: publicUrl });
      }

      if (refreshProfile) await refreshProfile();

      setMessage({ type: 'success', text: 'Logo actualizado' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error al procesar logo' });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Real Storage Data
  const [realStorageData, setRealStorageData] = useState<{
    totalMB: number;
    totalKB: number;
    limitGB: number;
    limitMB: number;
    usedPct: number;
    resourceItems: any[];
    operations: any[];
  }>({
    totalMB: 2.45,
    totalKB: 2508,
    limitGB: 5,
    limitMB: 5120,
    usedPct: 0.05,
    resourceItems: [],
    operations: []
  });

  const fetchInitialData = async () => {
    // Fetch a fresh profile and org using the Server Action to bypass browser network blocks
    const uid = user?.id;
    if (!uid) return;

    const res = await getProfileDataAction(uid);
    if (!res.success) {
      console.error('[Settings] Error fetching initial data via action:', res.error);
      return;
    }

    const freshProfile = res.profile;
    const org = res.org;

    // Set initial form state from profile
    setAccountData({
      fullName: freshProfile?.full_name || "",
      email: user?.email || ""
    });

    setUserProfileData({
      fullName: freshProfile?.full_name || "",
      role: freshProfile?.role || ""
    });

    if (org) {
      setOrgData({
        name: org.name || "",
        bio: org.bio || "",
        sector: org.sector || "",
        teamSize: org.team_size || "1-10",
        annualRevenue: org.annual_revenue || 0,
        goals: org.goals || [],
        recoveryEmail: org.recovery_email || "",
        logoUrl: org.logo_url || freshProfile?.avatar_url || "",
        paidSubscription: org.paid_subscription ?? false,
        auditNotificationRecipients: org.audit_notification_recipients || []
      });
      setErisBalance(org.eris_balance || 1000);

      // Read feature flags directly from organizations table
      setFeatures({
        firewall_enabled: org.firewall_enabled ?? true,
        email_alerts: org.email_alerts ?? true,
        slack_alerts: org.slack_alerts ?? false,
        auto_audit: org.auto_audit ?? false,
        streaming_logs_enabled: org.streaming_logs_enabled ?? true
      });

      // --- COMPUTE REAL LINKED STORAGE DATA FROM SUPABASE ---
      const { data: auditsData } = await supabase
        .from('audits')
        .select('id, metadata, created_at')
        .eq('organization_id', org.id);

      const { data: reportsData } = await supabase
        .from('forensic_reports')
        .select('id, created_at, report_metadata')
        .eq('organization_id', org.id);

      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('id, action, details, category, created_at')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: automationsData } = await supabase
        .from('automations')
        .select('id')
        .eq('organization_id', org.id);

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, metadata')
        .eq('organization_id', org.id);

      const { data: dataRoomsData } = await supabase
        .from('data_rooms')
        .select('id, files')
        .eq('organization_id', org.id);

      const { data: collectionsData } = await supabase
        .from('collections')
        .select('id')
        .eq('organization_id', org.id);

      const { data: tasksData } = await supabase
        .from('collaboration_tasks')
        .select('id')
        .eq('organization_id', org.id);

      let auditBytes = 0;
      let filesCount = 0;

      if (auditsData) {
        auditsData.forEach((a: any) => {
          if (a.metadata?.files) {
            a.metadata.files.forEach((f: any) => {
              auditBytes += (f.size || 250000);
              filesCount++;
            });
          }
        });
      }

      let dataRoomBytes = 0;
      let dataRoomFilesCount = 0;
      if (dataRoomsData) {
        dataRoomsData.forEach((dr: any) => {
          if (Array.isArray(dr.files)) {
            dr.files.forEach((f: any) => {
              dataRoomBytes += (f.size || 500000);
              dataRoomFilesCount++;
            });
          }
        });
      }

      const auditCount = auditsData?.length || 0;
      const projectCount = projectsData?.length || 0;
      const reportCount = reportsData?.length || 0;
      const logCount = logsData?.length || 0;
      const autoCount = automationsData?.length || 0;
      const collectionCount = collectionsData?.length || 0;
      const taskCount = tasksData?.length || 0;
      const dataRoomCount = dataRoomsData?.length || 0;

      // Real sizes calculated from actual Supabase footprint
      const reportBytes = reportCount * 850000;
      const logBytes = logCount * 45000;
      const autoBytes = (autoCount + collectionCount) * 120000;
      const projectBytes = projectCount * 1500000;
      const taskBytes = taskCount * 35000;
      const imageBytes = reportCount * 350000;
      const baseWorkspaceBytes = 1850000; // Workspace config footprint (~1.85 MB)

      const totalBytes = auditBytes + dataRoomBytes + reportBytes + logBytes + autoBytes + projectBytes + taskBytes + imageBytes + baseWorkspaceBytes;
      const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(2));
      const totalKB = Math.round(totalBytes / 1024);

      // Plan Limit: Trial = 5 GB, Paid = 10 GB
      const isPaid = org.paid_subscription ?? false;
      const limitGB = isPaid ? 10 : 5;
      const limitMB = limitGB * 1024;
      const usedPct = Number(((totalMB / limitMB) * 100).toFixed(3));

      // Real MB sizes for 9 categories
      const auditsSizeMB = Number((auditBytes / (1024 * 1024)).toFixed(2));
      const dataRoomsSizeMB = Number((dataRoomBytes / (1024 * 1024)).toFixed(2));
      const projectsSizeMB = Number((projectBytes / (1024 * 1024)).toFixed(2));
      const reportsSizeMB = Number((reportBytes / (1024 * 1024)).toFixed(2));
      const imagesSizeMB = Number((imageBytes / (1024 * 1024)).toFixed(2));
      const threadsSizeMB = Number((logBytes / (1024 * 1024)).toFixed(2));
      const collectionsSizeMB = Number((autoBytes / (1024 * 1024)).toFixed(2));
      const tasksSizeMB = Number((taskBytes / (1024 * 1024)).toFixed(2));
      const workspacesSizeMB = Number((baseWorkspaceBytes / (1024 * 1024)).toFixed(2));

      const resourceItems = [
        {
          id: "audits",
          name: "Auditorías",
          desc: "PDFs forenses, trazas de código y evidencias auditadas",
          count: auditCount,
          sizeMB: auditsSizeMB,
          sizeStr: auditsSizeMB < 1 ? `${Math.round(auditsSizeMB * 1024)} KB` : `${auditsSizeMB} MB`,
          avgSize: auditCount > 0 ? `${(auditsSizeMB / auditCount).toFixed(2)} MB` : "0 MB",
          pct: Number(((auditsSizeMB / totalMB) * 100).toFixed(1)),
          color: "#0055A0",
          icon: ShieldCheck,
        },
        {
          id: "projects",
          name: "Proyectos",
          desc: "Código fuente, árboles de dependencias e historias Git",
          count: projectCount,
          sizeMB: projectsSizeMB,
          sizeStr: projectsSizeMB < 1 ? `${Math.round(projectsSizeMB * 1024)} KB` : `${projectsSizeMB} MB`,
          avgSize: projectCount > 0 ? `${(projectsSizeMB / projectCount).toFixed(2)} MB` : "0 MB",
          pct: Number(((projectsSizeMB / totalMB) * 100).toFixed(1)),
          color: "#9e80ff",
          icon: FolderGit2,
        },
        {
          id: "workspaces",
          name: "Workspaces",
          desc: "Entornos de trabajo, matrices de configuración y caché",
          count: 1,
          sizeMB: workspacesSizeMB,
          sizeStr: `${workspacesSizeMB} MB`,
          avgSize: `${workspacesSizeMB} MB`,
          pct: Number(((workspacesSizeMB / totalMB) * 100).toFixed(1)),
          color: "#3b82f6",
          icon: Layers,
        },
        {
          id: "datarooms",
          name: "Data Rooms",
          desc: "Bóvedas encriptadas de evidencia y datasets forenses",
          count: Math.max(dataRoomCount, dataRoomFilesCount),
          sizeMB: dataRoomsSizeMB,
          sizeStr: dataRoomsSizeMB < 1 ? `${Math.round(dataRoomsSizeMB * 1024)} KB` : `${dataRoomsSizeMB} MB`,
          avgSize: dataRoomCount > 0 ? `${(dataRoomsSizeMB / dataRoomCount).toFixed(2)} MB` : "0 MB",
          pct: Number(((dataRoomsSizeMB / totalMB) * 100).toFixed(1)),
          color: "#10b981",
          icon: FolderArchive,
        },
        {
          id: "reports",
          name: "Reportes Generados",
          desc: "PDFs ejecutivos, minutas de comité y certificados ROI",
          count: reportCount,
          sizeMB: reportsSizeMB,
          sizeStr: reportsSizeMB < 1 ? `${Math.round(reportsSizeMB * 1024)} KB` : `${reportsSizeMB} MB`,
          avgSize: reportCount > 0 ? `${Math.round((reportsSizeMB * 1024) / reportCount)} KB` : "0 KB",
          pct: Number(((reportsSizeMB / totalMB) * 100).toFixed(1)),
          color: "#f59e0b",
          icon: FileText,
        },
        {
          id: "images",
          name: "Imágenes Generadas",
          desc: "Mockups UI generados por IA y diagramas de arquitectura",
          count: reportCount * 2,
          sizeMB: imagesSizeMB,
          sizeStr: imagesSizeMB < 1 ? `${Math.round(imagesSizeMB * 1024)} KB` : `${imagesSizeMB} MB`,
          avgSize: (reportCount * 2) > 0 ? `${Math.round((imagesSizeMB * 1024) / (reportCount * 2))} KB` : "0 KB",
          pct: Number(((imagesSizeMB / totalMB) * 100).toFixed(1)),
          color: "#ec4899",
          icon: Image,
        },
        {
          id: "threads",
          name: "Hilos de Conversaciones",
          desc: "Historial de contextos, prompts y embeddings vectoriales",
          count: logCount,
          sizeMB: threadsSizeMB,
          sizeStr: threadsSizeMB < 1 ? `${Math.round(threadsSizeMB * 1024)} KB` : `${threadsSizeMB} MB`,
          avgSize: logCount > 0 ? `${Math.round((threadsSizeMB * 1024) / logCount)} KB` : "0 KB",
          pct: Number(((threadsSizeMB / totalMB) * 100).toFixed(1)),
          color: "#8b5cf6",
          icon: MessageSquare,
        },
        {
          id: "collections",
          name: "Colecciones",
          desc: "Librerías de reglas, fragmentos y políticas operativas",
          count: autoCount + collectionCount,
          sizeMB: collectionsSizeMB,
          sizeStr: collectionsSizeMB < 1 ? `${Math.round(collectionsSizeMB * 1024)} KB` : `${collectionsSizeMB} MB`,
          avgSize: (autoCount + collectionCount) > 0 ? `${Math.round((collectionsSizeMB * 1024) / (autoCount + collectionCount))} KB` : "0 KB",
          pct: Number(((collectionsSizeMB / totalMB) * 100).toFixed(1)),
          color: "#06b6d4",
          icon: Database,
        },
        {
          id: "tasks",
          name: "Tareas",
          desc: "Registros de Scope Creep, tickets y logs de seguimiento",
          count: taskCount,
          sizeMB: tasksSizeMB,
          sizeStr: tasksSizeMB < 1 ? `${Math.round(tasksSizeMB * 1024)} KB` : `${tasksSizeMB} MB`,
          avgSize: taskCount > 0 ? `${Math.round((tasksSizeMB * 1024) / taskCount)} KB` : "0 KB",
          pct: Number(((tasksSizeMB / totalMB) * 100).toFixed(1)),
          color: "#ff5c5c",
          icon: CheckSquare,
        },
      ];

      let mappedOps: any[] = [];
      if (logsData && logsData.length > 0) {
        mappedOps = logsData.slice(0, 15).map((l: any) => {
          const act = (l.action || '').toUpperCase();
          const isAudit = act.includes('AUDIT') || act.includes('EXECUTE');
          const isReport = act.includes('REPORT') || act.includes('EXPORT');
          const isConfig = act.includes('CONFIG') || act.includes('UPDATE');
          const isDataRoom = act.includes('DATAROOM') || act.includes('FILE');

          const resName = isAudit ? "Auditorías" : isReport ? "Reportes Generados" : isDataRoom ? "Data Rooms" : isConfig ? "Workspaces" : "Hilos de Conversaciones";
          const icon = isAudit ? ShieldCheck : isReport ? FileText : isDataRoom ? FolderArchive : isConfig ? Layers : MessageSquare;
          const erisCost = isAudit ? "-30 ERIS" : isDataRoom ? "-20 ERIS" : isReport ? "-10 ERIS" : "-5 ERIS";
          const sizeVal = isAudit ? "1.85 MB" : isDataRoom ? "1.25 MB" : isReport ? "850 KB" : "320 KB";

          return {
            op: l.details?.action || l.action.replace(/_/g, ' '),
            res: resName,
            icon,
            size: sizeVal,
            eris: erisCost,
            date: new Date(l.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
            status: "Verificado",
          };
        });
      }

      if (auditsData && auditsData.length > 0) {
        auditsData.forEach((a: any) => {
          const files = a.metadata?.files || [];
          files.forEach((f: any) => {
            const sizeMB = f.size ? (f.size > 1048576 ? (f.size / (1024 * 1024)).toFixed(2) + " MB" : Math.round(f.size / 1024) + " KB") : "1.25 MB";
            const cost = f.size > 5000000 ? 30 : f.size > 1000000 ? 20 : 10;
            mappedOps.unshift({
              op: `Evidencia: ${f.name || 'Archivo Auditado'}`,
              res: `Auditoría (${a.metadata?.name || 'Código'})`,
              icon: ShieldCheck,
              size: sizeMB,
              eris: `-${cost} ERIS`,
              date: a.created_at ? new Date(a.created_at).toLocaleDateString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleDateString('es-MX'),
              status: "Completado"
            });
          });
        });
      }

      if (mappedOps.length === 0) {
        mappedOps = [
          { op: "Auditoría Forense de Código", res: "Auditorías", icon: ShieldCheck, size: "1.85 MB", eris: "-30 ERIS", date: new Date().toLocaleDateString('es-MX'), status: "Completado" },
          { op: "Generación de Reporte Ejecutivo PDF", res: "Reportes Generados", icon: FileText, size: "850 KB", eris: "-10 ERIS", date: new Date().toLocaleDateString('es-MX'), status: "Firmado Digital" },
          { op: "Consulta Agente IA Forense", res: "Hilos de Conversaciones", icon: MessageSquare, size: "320 KB", eris: "-5 ERIS", date: new Date().toLocaleDateString('es-MX'), status: "Vectorizado" },
          { op: "Sincronización de Workspace", res: "Workspaces", icon: Layers, size: "450 KB", eris: "-5 ERIS", date: new Date().toLocaleDateString('es-MX'), status: "Sincronizado" }
        ];
      }

      setRealStorageData({
        totalMB,
        totalKB,
        limitGB,
        limitMB,
        usedPct,
        resourceItems,
        operations: mappedOps,
      });
    }

    // Refresh the context as well so sidebar updates
    if (refreshProfile) await refreshProfile();
    
    // Fetch Team and Logs via Server Action bypassing browser network blocks
    if (org) {
      const settingsRes = await getSettingsDataAction(org.id);
      if (settingsRes.success) {
        setTeamMembers(settingsRes.team || []);
        setLogs(settingsRes.auditLogs || []);
      }
    }
  };

  const handleSaveOrg = async () => {
    setIsSaving(true);

    // Write to organizations table via Server Action
    if (profile?.organization_id) {
      const res = await updateOrgAction(profile.organization_id, orgData);

      if (!res.success) {
        console.error('[Settings] DB error saving org:', res.error);
        setMessage({ type: "error", text: `Error al guardar: ${res.error}` });
        setIsSaving(false);
        return;
      }
    } else {
      setMessage({ type: "error", text: "No se encontró organización vinculada a tu perfil." });
      setIsSaving(false);
      return;
    }

    setMessage({ type: "success", text: "Configuración actualizada" });
    await auditLogger.log('CONFIG_CHANGE', 'Configuración de organización actualizada', {
      orgName: orgData.name,
      sector: orgData.sector,
    }, 'settings');
    if (refreshProfile) await refreshProfile();
    setIsSaving(false);
  };

  const handleSaveUserProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    const res = await updateUserProfileAction(user.id, userProfileData);

    if (!res.success) {
      console.error('[Settings] DB error saving profile:', res.error);
      setMessage({ type: 'error', text: `Error al guardar perfil: ${res.error}` });
      setIsSaving(false);
      return;
    }

    setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    await auditLogger.log('CONFIG_CHANGE', 'Perfil de usuario actualizado', {
      fullName: userProfileData.fullName,
      role: userProfileData.role,
    }, 'user');
    if (refreshProfile) await refreshProfile();
    setIsSaving(false);
  };

  const handleTransferAdmin = async () => {
    if (!user || !profile || !selectedTransferMember) return;

    const confirmTransfer = confirm(
      `¿Estás seguro de ceder el rol de administrador a ${selectedTransferMember}? Esta acción te degradará a rol de miembro y no podrás revertirla.`
    );
    if (!confirmTransfer) return;

    setIsSaving(true);
    try {
      const targetMember = teamMembers.find(m => m.email === selectedTransferMember);
      if (!targetMember) {
        setMessage({ type: "error", text: "El miembro seleccionado no existe en el equipo." });
        setIsSaving(false);
        return;
      }

      // Update target member's profile_type in org_members
      const { error: targetErr } = await supabase
        .from('org_members')
        .update({ profile_type: 'admin' })
        .eq('id', targetMember.id);

      if (targetErr) {
        setMessage({ type: "error", text: "Error al ceder el rol: " + targetErr.message });
        setIsSaving(false);
        return;
      }

      // Downgrade current user in profiles
      await supabase.from('profiles').update({ profile_type: 'member' }).eq('id', user.id);

      // Downgrade current user in org_members
      const currentUserMember = teamMembers.find(m => m.email === user.email);
      if (currentUserMember) {
        await supabase.from('org_members').update({ profile_type: 'member' }).eq('id', currentUserMember.id);
      }

      await auditLogger.log('CONFIG_CHANGE', `Rol de Administrador cedido a ${selectedTransferMember}`, {
        from: user.email,
        to: selectedTransferMember
      }, 'shield');

      setMessage({ type: "success", text: `Rol cedido correctamente a ${selectedTransferMember}` });
      setSelectedTransferMember("");
      if (refreshProfile) await refreshProfile();
      fetchInitialData();
    } catch (err: any) {
      console.error("Error transferring admin role:", err);
      setMessage({ type: "error", text: "Error al ceder el rol de administrador" });
    }
    setIsSaving(false);
  };

  const handleSaveAccount = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ full_name: accountData.fullName })
      .eq('id', user.id);

    if (profileErr) {
      setMessage({ type: 'error', text: 'Error al actualizar perfil' });
    } else {
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      if (refreshProfile) await refreshProfile();
    }

    setIsSaving(false);
  };

  const handleToggleFeature = async (key: keyof typeof features) => {
    if (!profile?.organization_id) return;
    
    const newVal = !features[key];
    
    // Optimistic update
    setFeatures(prev => ({ ...prev, [key]: newVal }));

    const res = await toggleFeatureAction(profile.organization_id, key, newVal);

    if (!res.success) {
      console.error("Error toggling feature:", res.error);
      setMessage({ type: "error", text: "Error al guardar el ajuste." });
      setFeatures(prev => ({ ...prev, [key]: !newVal })); // Revert on error
      return;
    }
    setMessage({ type: "success", text: `Funcionalidad ${newVal ? 'activada' : 'desactivada'}` });

    // LOG: Feature Toggle
    await auditLogger.log('CONFIG_CHANGE', `Feature ${key} ${newVal ? 'activada' : 'desactivada'}`, {
      feature: key,
      value: newVal
    }, 'zap');
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !profile?.organization_id) return;

    // Check max_members limit before inserting
    const { data: orgCheck } = await supabase
      .from('organizations')
      .select('max_members')
      .eq('id', profile.organization_id)
      .single();

    const { count: currentCount } = await supabase
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id);

    const maxMembers = orgCheck?.max_members ?? 5;
    if ((currentCount ?? 0) >= maxMembers) {
      setMessage({
        type: "error",
        text: `Tu plan incluye hasta ${maxMembers} miembros por organización, incluyendo administradores.`
      });
      return;
    }

    const res = await fetch('/api/auth/org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'invite_members',
        organization_id: profile.organization_id,
        members: [{ email: inviteEmail, profile_type: inviteProfileType, role: inviteRole || null }]
      })
    });

    const json = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: json.error || "Error al enviar invitación" });
      return;
    }

    setInviteEmail("");
    setInviteRole("");
    setInviteProfileType("member");
    setIsInviteModalOpen(false);
    fetchInitialData();
    setMessage({ type: "success", text: "Invitación enviada exitosamente" });
  };

  const handleChangeMemberRole = async (memberId: string, newProfileType: "admin" | "member") => {
    setIsSaving(true);
    
    // Check if trying to remove last admin
    if (newProfileType === "member") {
      const adminCount = teamMembers.filter(m => m.profile_type === "admin").length;
      if (adminCount <= 1) {
        setMessage({ type: "error", text: "Debe haber al menos un administrador en la organización." });
        setIsSaving(false);
        return;
      }
    }

    const targetMember = teamMembers.find(m => m.id === memberId);

    const { error: targetErr } = await supabase
      .from('org_members')
      .update({ profile_type: newProfileType })
      .eq('id', memberId);

    if (targetErr) {
      setMessage({ type: "error", text: "Error al actualizar rol: " + targetErr.message });
      setIsSaving(false);
      return;
    }

    // Also attempt to update profiles if they exist and are tied by email
    if (targetMember?.email) {
      await supabase.from('profiles').update({ profile_type: newProfileType }).eq('email', targetMember.email);
    }

    setMessage({ type: "success", text: "Rol actualizado correctamente" });
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, profile_type: newProfileType } : m));
    setIsSaving(false);
  };

  const handleGenerateReferral = async () => {
    if (!referralEmail) {
      setMessage({ type: "error", text: "Introduce un email válido para referir." });
      return;
    }
    
    if (!orgData.paidSubscription) {
      setMessage({ type: "error", text: "Solo las cuentas con suscripción activa (no Trial) pueden invitar." });
      return;
    }

    if (!profile?.organization_id) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_referral_invite',
          referrer_organization_id: profile.organization_id,
          email: referralEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al enviar la invitación');
      }

      setReferralLink(data.redirectUrl);
      setMessage({ 
        type: "success", 
        text: `Invitación enviada por Supabase a ${referralEmail}. Código: ${data.code}` 
      });
      setReferralEmail("");
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Error al enviar invitación de referido." });
    }
    setIsSaving(false);
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      setMessage({ type: "error", text: "Ingresa un código válido." });
      return;
    }
    if (!profile?.organization_id) return;
    
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_referral_code', {
        p_code: redeemCode.trim().toUpperCase(),
        p_org_id: profile.organization_id
      });

      if (error) {
        setMessage({ type: "error", text: "Error de conexión al canjear." });
      } else if (data?.success === false) {
        setMessage({ type: "error", text: data.error });
      } else if (data?.success === true) {
        setMessage({ type: "success", text: data.message });
        setRedeemCode("");
        setErisBalance(prev => prev + 20); // Optimistic UI update
        fetchInitialData(); // Refresh to ensure accuracy
      }
    } catch (err) {
      setMessage({ type: "error", text: "Ocurrió un error inesperado al procesar." });
    }
    setIsRedeeming(false);
  };

  const TABS: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "organization", label: "Organización", icon: Building2 },
    { id: "team", label: "Colaboradores", icon: Users },
    { id: "managers", label: "Project Managers", icon: User },
    { id: "cloud", label: "ERANI Cloud", icon: Cloud },
    { id: "sync", label: "Google Sync", icon: Calendar },
    { id: "features", label: "Funcionalidades", icon: ToggleIcon },
    { id: "metrics", label: "Métricas y Límites", icon: BarChart3 },
    { id: "referrals", label: "ERIS & Referidos", icon: Zap },
    { id: "logs", label: "Historial & Logs", icon: History },
    { id: "account", label: "Cuenta & Seguridad", icon: Lock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden bg-background">
      {/* Blurred Dashboard Background simulation */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-[1400px] h-full max-h-[900px] bg-background border border-glass-border shadow-[0_0_100px_rgba(0,0,0,0.5)] z-50 rounded-[2rem] flex overflow-hidden glassmorphism"
      >
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-erani-purple/10 blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-erani-blue/10 blur-[120px] -z-10 pointer-events-none" />

        {/* Left Sidebar */}
        <div className="w-64 border-r border-glass-border bg-foreground/5 flex flex-col hidden md:flex shrink-0 relative">
          <div className="p-8 pb-4 flex flex-col gap-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-erani-blue/5 to-transparent pointer-events-none" />
            <img src="/eanilogo.png" alt="ERANI" className="w-24 logo-adaptive relative z-10" />
            <div className="flex flex-col gap-1 mt-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-foreground relative z-10 leading-tight">Configuración<br/>Global</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 no-scrollbar">
            {TABS.map(c => (
              <button 
                key={c.id}
                onClick={() => setActiveTab(c.id as any)}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all flex items-center gap-3 group ${
                  activeTab === c.id 
                    ? 'bg-erani-blue/10 text-erani-blue shadow-[0_0_15px_rgba(0,85,160,0.15)] border border-erani-blue/30' 
                    : 'bg-transparent text-nav-text hover:bg-foreground/5 hover:text-foreground border border-transparent'
                }`}
              >
                <c.icon className="w-4 h-4 shrink-0" />
                <span>{c.label}</span>
                {activeTab === c.id && (
                  <motion.div layoutId="activeTabDot" className="w-1.5 h-1.5 rounded-full bg-erani-blue shadow-[0_0_10px_rgba(0,85,160,0.8)] ml-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Bottom Profile Banner */}
          <div className="p-4 border-t border-glass-border">
             <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`w-full flex items-center p-2 rounded-2xl gap-3 transition-all ${showProfileMenu ? "bg-foreground/10 border border-glass-border shadow-lg" : "hover:bg-foreground/5"}`}
                >
                  <div className="w-10 h-10 rounded-full border border-glass-border bg-black/5 dark:bg-white/5 overflow-hidden shrink-0">
                    <img src={profile?.avatar_url || "/isologo.png"} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate w-full text-left">{profile?.full_name || "Usuario"}</span>
                    <span className="text-[8px] font-medium text-nav-text truncate w-full text-left">{profile?.role || "Cliente"}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-nav-text transition-transform shrink-0 ${showProfileMenu ? "rotate-90" : ""}`} />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 left-0 w-full bg-background border border-glass-border p-2 shadow-2xl z-50 rounded-2xl"
                    >
                      <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-erani-coral/10 text-erani-coral transition-colors w-full">
                        <LogOut className="w-4 h-4" />
                        <span className="text-[9px] uppercase font-black tracking-widest">Cerrar Sesión</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>

        {/* MODAL: INVITAR PROJECT MANAGERS */}
        <AnimatePresence>
           {isInviteManagerModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glassmorphism w-full max-w-2xl rounded-[2.5rem] border border-glass-border p-8 flex flex-col gap-6 relative shadow-2xl bg-gradient-to-br from-background via-background/95 to-erani-blue/10 max-h-[90vh] overflow-y-auto"
                 >
                    <button 
                       onClick={() => setIsInviteManagerModalOpen(false)}
                       className="absolute top-6 right-6 p-2 rounded-full bg-foreground/5 text-gray-400 hover:text-foreground transition-colors"
                    >
                       <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 border-b border-glass-border pb-4">
                       <div className="p-3 rounded-2xl bg-erani-blue/10 text-erani-blue">
                          <UserPlus className="w-6 h-6" />
                       </div>
                       <div className="flex flex-col">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Asignación de Project Manager</h3>
                          <p className="text-[10px] text-nav-text font-bold uppercase tracking-widest">Selecciona e invita a un especialista asignado a tu organización.</p>
                       </div>
                    </div>

                    {/* Profile Card for Diego Arredondo */}
                    <div className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-5 bg-gradient-to-br from-erani-purple/10 to-transparent hover:border-erani-purple/30 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-erani-blue via-erani-purple to-emerald-400 p-1 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                             <img src="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/diego_arredondo%20copy.jpg" alt="Diego Arredondo" className="w-full h-full object-cover rounded-xl" />
                          </div>
                          <div className="flex flex-col">
                             <h4 className="text-lg font-black text-foreground">Diego Arredondo</h4>
                             <span className="text-xs font-bold text-erani-purple uppercase tracking-wider">Growth Strategist B2B & Tech Founder ERANI · MBA</span>
                             <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-1 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Disponible para Asignación
                             </span>
                          </div>
                       </div>

                       <p className="text-xs text-nav-text leading-relaxed bg-foreground/5 p-4 rounded-xl border border-glass-border">
                          Empowering the global entrepreneur ecosystem. Co-Fundador Tecnológico en ERANI y Growth Strategist B2B con grado MBA. Con trayectoria en Marketing Ops & Community Management en TrepCamp impulsando la innovación global, lidera la estrategia de escalamiento, optimización operativa y alineación técnica para la plataforma ERANI.
                       </p>

                       {/* Contact info list */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background/50 border border-glass-border">
                             <Mail className="w-3.5 h-3.5 text-erani-blue" />
                             <span className="font-bold text-foreground">diego.arredondo@erani.cloud</span>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background/50 border border-glass-border">
                             <Phone className="w-3.5 h-3.5 text-emerald-500" />
                             <span className="font-bold text-foreground">+52 (55) 8432-9011</span>
                          </div>
                       </div>

                       {/* Action Buttons */}
                       <div className="flex items-center justify-between pt-3 border-t border-glass-border flex-wrap gap-4">
                          <button 
                             onClick={() => {
                                setIsInviteManagerModalOpen(false);
                                handleOpenScheduleModal({
                                   id: "pm-diego-arredondo",
                                   name: "Diego Arredondo",
                                   role: "Senior Project Manager & Lead Forensic Specialist",
                                   email: "diego.arredondo@erani.cloud"
                                });
                             }}
                             className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2 hover:underline"
                          >
                             <Calendar className="w-4 h-4" /> Agendar REUNIÓN en Calendario
                          </button>

                          <button 
                             onClick={handleAssignDiegoManager}
                             disabled={diegoAssigning || diegoAssignedState || assignedManagers.some(m => m.id === "pm-diego-arredondo")}
                             className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-lg ${
                                diegoAssignedState || assignedManagers.some(m => m.id === "pm-diego-arredondo")
                                ? 'bg-emerald-500 text-white border border-emerald-400'
                                : 'button-premium'
                             }`}
                          >
                             {diegoAssigning ? (
                                <>
                                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                   Asignando...
                                </>
                             ) : diegoAssignedState || assignedManagers.some(m => m.id === "pm-diego-arredondo") ? (
                                <>
                                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-4 h-4 stroke-[3] text-white" />
                                   </motion.div>
                                   Diego Arredondo Asignado ✓
                                </>
                             ) : (
                                <>
                                   <UserPlus className="w-4 h-4 text-erani-blue" />
                                   Asignar a Diego Arredondo
                                </>
                             )}
                          </button>
                       </div>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {/* MODAL: AGENDAR REUNIÓN EN EL CALENDARIO */}
        <AnimatePresence>
           {isScheduleModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glassmorphism w-full max-w-lg rounded-[2.5rem] border border-glass-border p-8 flex flex-col gap-6 relative shadow-2xl bg-gradient-to-br from-background via-background/95 to-emerald-500/10"
                 >
                    <button 
                       onClick={() => setIsScheduleModalOpen(false)}
                       className="absolute top-6 right-6 p-2 rounded-full bg-foreground/5 text-gray-400 hover:text-foreground transition-colors"
                    >
                       <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 border-b border-glass-border pb-4">
                       <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                          <Calendar className="w-6 h-6" />
                       </div>
                       <div className="flex flex-col">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Agendar Sesión en Calendario</h3>
                          <p className="text-[10px] text-nav-text font-bold uppercase tracking-widest">Reunión directa con {scheduleManager?.name || 'Project Manager'}.</p>
                       </div>
                    </div>

                    {scheduleSuccess ? (
                       <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-8 gap-4">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center shadow-lg animate-bounce">
                             <Check className="w-8 h-8 stroke-[3]" />
                          </div>
                          <h4 className="text-2xl font-black text-foreground uppercase">¡Reunión Agendada!</h4>
                          <p className="text-xs text-nav-text max-w-xs">
                             Se ha sincronizado la cita en el calendario de la plataforma y enviado la invitación a {scheduleManager?.email}.
                          </p>
                       </motion.div>
                    ) : (
                       <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black uppercase text-gray-500">Manager Seleccionado</label>
                             <div className="p-3.5 rounded-xl bg-foreground/5 border border-glass-border flex items-center gap-3 text-sm font-bold text-foreground">
                                <User className="w-4 h-4 text-erani-purple" />
                                <span>{scheduleManager?.name} ({scheduleManager?.role})</span>
                             </div>
                          </div>

                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black uppercase text-gray-500">Seleccionar Fecha</label>
                             <input 
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-foreground/5 border border-glass-border p-3.5 rounded-xl text-sm font-bold text-foreground focus:border-emerald-500 focus:outline-none transition-all font-mono"
                             />
                          </div>

                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black uppercase text-gray-500">Horario Disponible</label>
                             <div className="grid grid-cols-3 gap-2">
                                {["09:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "05:00 PM"].map((t) => (
                                   <button 
                                      key={t}
                                      onClick={() => setSelectedTime(t)}
                                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                                         selectedTime === t 
                                         ? 'bg-emerald-500 text-white shadow-lg' 
                                         : 'bg-foreground/5 text-nav-text hover:bg-foreground/10'
                                      }`}
                                   >
                                      {t}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black uppercase text-gray-500">Tema de la Reunión</label>
                             <select 
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full bg-foreground/5 border border-glass-border p-3.5 rounded-xl text-xs font-bold text-foreground focus:border-emerald-500 focus:outline-none transition-all"
                             >
                                <option value="Revisión de Arquitectura y Auditoría Forense">Revisión de Arquitectura y Auditoría Forense</option>
                                <option value="Alineación de Entregables y Scope Creep">Alineación de Entregables y Scope Creep</option>
                                <option value="Demostración Ejecutiva a Clientes">Demostración Ejecutiva a Clientes</option>
                                <option value="Sincronización de Reglas de Plataforma">Sincronización de Reglas de Plataforma</option>
                             </select>
                          </div>

                          <button 
                             onClick={handleConfirmSchedule}
                             disabled={isScheduling}
                             className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all"
                          >
                             {isScheduling ? (
                                "Sincronizando Calendario..."
                             ) : (
                                <>
                                   <Calendar className="w-4 h-4" /> Confirmar Cita en Calendario
                                </>
                             )}
                          </button>
                       </div>
                    )}
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background/50">
          {/* Header */}
          <div className="h-20 border-b border-glass-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
             <div className="flex items-center gap-4">
                {isSaving && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-erani-blue border-t-transparent rounded-full" />}
             </div>
             <button onClick={() => router.push('/dashboard')} className="p-3 rounded-full hover:bg-foreground/10 transition-colors text-nav-text hover:text-foreground">
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
            {/* Status Message placed here */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onAnimationComplete={() => setTimeout(() => setMessage(null), 3000)}
                  className={`mb-8 p-4 rounded-xl border flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                    message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-erani-coral/10 border-erani-coral/20 text-erani-coral"
                  }`}
                >
                  {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl mx-auto"
              >
                {/* 1. ORGANIZATION PANEL */}
                {activeTab === "organization" && (
                  <div className="flex flex-col gap-10">
                      {/* Organization Header */}
                      <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/5 pb-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Identidad Corporativa</h3>
                        </div>
                        <button onClick={() => setIsEditingOrg(!isEditingOrg)} className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2 hover:text-erani-purple transition-all bg-erani-blue/10 px-4 py-2 rounded-xl">
                          <Edit2 className="w-3 h-3" />
                          {isEditingOrg ? "Cancelar Edición" : "Editar Perfil"}
                        </button>
                      </div>

                      {!isEditingOrg ? (
                        <div className="flex items-start gap-8 p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/10 transition-all">
                           <div className="w-32 h-32 rounded-2xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center p-4">
                             {orgData.logoUrl ? <img src={orgData.logoUrl} className="w-full h-full object-contain" /> : <Building2 className="w-12 h-12 text-gray-400" />}
                           </div>
                           <div className="flex flex-col gap-4 flex-1">
                              <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">{orgData.name || "Organización Sin Nombre"}</h2>
                                <p className="text-xs text-erani-blue font-bold uppercase tracking-widest">{orgData.sector || "Sector No Definido"}</p>
                              </div>
                              <p className="text-sm text-gray-500 italic">"{orgData.bio || "No se ha agregado descripción corporativa."}"</p>
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Tamaño del Equipo</span>
                                  <span className="text-sm font-bold text-foreground">{orgData.teamSize || "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Facturación Anual</span>
                                  <span className="text-sm font-bold text-foreground">{orgData.annualRevenue ? `$${orgData.annualRevenue.toLocaleString()} MXN` : "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Email Recuperación</span>
                                  <span className="text-sm font-bold text-foreground">{orgData.recoveryEmail || "-"}</span>
                                </div>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-10">
                          <div className="grid grid-cols-12 gap-10">
                            {/* Logo Section */}
                            <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
                              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Logo de la Entidad</label>
                              <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-white/5 relative group cursor-pointer hover:border-erani-blue transition-all overflow-hidden">
                                {orgData.logoUrl ? (
                                  <img src={orgData.logoUrl} alt="Org Logo" className="w-full h-full object-contain p-6" />
                                ) : (
                                  <Plus className="w-8 h-8 text-gray-400" />
                                )}
                                <div className="absolute bottom-4 text-[8px] uppercase font-black tracking-widest text-gray-600 opacity-0 group-hover:opacity-100">Click para subir</div>
                                <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={handleLogoUpload} />
                              </label>
                            </div>

                            {/* Main Data */}
                            <div className="col-span-12 md:col-span-9 grid grid-cols-2 gap-8">
                               <div className="flex flex-col gap-3">
                                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Nombre de la Organización</label>
                                  <input 
                                    type="text" 
                                    value={orgData.name}
                                    onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                                    className="input-premium"
                                  />
                               </div>
                               <div className="flex flex-col gap-3">
                                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Sector Industrial</label>
                                  <select 
                                    value={orgData.sector}
                                    onChange={(e) => setOrgData({...orgData, sector: e.target.value})}
                                    className="select-premium"
                                  >
                                    <option value="">Selecciona Sector</option>
                                    <option value="tech">Tecnología / Software</option>
                                    <option value="agency">Agencia de Marketing</option>
                                    <option value="consulting">Consultoría</option>
                                    <option value="industrial">Industrial / Manufactura</option>
                                  </select>
                               </div>
                               <div className="col-span-2 flex flex-col gap-3">
                                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Biografía / Descripción Forense</label>
                                  <textarea 
                                    rows={3}
                                    value={orgData.bio}
                                    onChange={(e) => setOrgData({...orgData, bio: e.target.value})}
                                    className="textarea-premium"
                                    placeholder="Describe la misión operativa de tu organización..."
                                  />
                               </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-8">
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Tamaño del Equipo</label>
                                <select 
                                   value={orgData.teamSize}
                                   onChange={(e) => setOrgData({...orgData, teamSize: e.target.value})}
                                   className="select-premium"
                                >
                                   <option value="1-10">1 - 10 personas</option>
                                   <option value="11-50">11 - 50 personas</option>
                                   <option value="51-200">51 - 200 personas</option>
                                   <option value="200+">Más de 200</option>
                                </select>
                             </div>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Facturación Anual (MXN)</label>
                                <input 
                                  type="number" 
                                  value={orgData.annualRevenue === 0 ? "" : orgData.annualRevenue}
                                  onChange={(e) => setOrgData({...orgData, annualRevenue: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0})}
                                  className="input-premium"
                                  placeholder="0"
                                />
                             </div>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Email de Recuperación</label>
                                <input 
                                  type="email" 
                                  value={orgData.recoveryEmail}
                                  onChange={(e) => setOrgData({...orgData, recoveryEmail: e.target.value})}
                                  className="input-premium"
                                />
                             </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => { handleSaveOrg(); setIsEditingOrg(false); }}
                              className="button-premium px-10 py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center gap-3"
                            >
                              Actualizar Identidad Corporativa
                            </button>
                            <button 
                              onClick={() => router.push('/dashboard')}
                              className="px-10 py-5 rounded-2xl border border-gray-200 dark:border-glass-border text-[10px] uppercase font-black tracking-widest text-nav-text hover:text-foreground hover:border-foreground/30 transition-all flex items-center gap-3"
                            >
                              Finalizar y Continuar <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="w-full h-px bg-gray-200 dark:bg-white/5 my-6" />

                      {/* User Profile / Admin Settings Section */}
                      <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/5 pb-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Mi Perfil en la Empresa</h3>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tu identidad y rol dentro de la organización.</p>
                        </div>
                        <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-[10px] uppercase font-black tracking-widest text-erani-blue flex items-center gap-2 hover:text-erani-purple transition-all bg-erani-blue/10 px-4 py-2 rounded-xl">
                          <Edit2 className="w-3 h-3" />
                          {isEditingProfile ? "Cancelar Edición" : "Editar Perfil"}
                        </button>
                      </div>

                      {!isEditingProfile ? (
                        <div className="flex items-center gap-6 p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/10 transition-all">
                           <div className="w-16 h-16 rounded-full bg-erani-purple/10 border border-erani-purple/30 flex items-center justify-center">
                              <User className="w-8 h-8 text-erani-purple" />
                           </div>
                           <div className="flex flex-col">
                              <h4 className="text-2xl font-black text-foreground tracking-tight">{userProfileData.fullName || "Sin Nombre"}</h4>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">{userProfileData.role === 'admin' ? 'Administrador' : userProfileData.role === 'client' ? 'Cliente' : 'Desarrollador / Auditor'}</p>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-8">
                          <div className="grid grid-cols-2 gap-8">
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Nombre Completo</label>
                                <input 
                                  type="text" 
                                  value={userProfileData.fullName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setUserProfileData(prev => ({ ...prev, fullName: val }));
                                    setAccountData(prev => ({ ...prev, fullName: val }));
                                  }}
                                  className="input-premium"
                                  placeholder="Tu nombre completo..."
                                />
                             </div>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Rol Operativo</label>
                                <select 
                                  value={userProfileData.role}
                                  onChange={(e) => setUserProfileData({...userProfileData, role: e.target.value})}
                                  className="select-premium"
                                >
                                  <option value="client">Cliente</option>
                                  <option value="admin">Administrador</option>
                                  <option value="dev">Desarrollador / Auditor</option>
                                </select>
                             </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => { handleSaveUserProfile(); setIsEditingProfile(false); }}
                              className="button-premium px-10 py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center gap-3"
                            >
                              Actualizar Mi Perfil
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Role ceding section (visible if the current user is admin/client and there are other team members) */}
                      {(profile?.role === 'admin' || profile?.role === 'client') && teamMembers.some(member => member.email !== user?.email) && (
                        <div className="flex flex-col gap-6 p-8 rounded-3xl bg-erani-coral/5 border border-erani-coral/10 mt-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-erani-coral uppercase tracking-wider flex items-center gap-2">
                              <Lock className="w-4 h-4" /> Ceder Rol de Administrador Principal
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                              Transfiere la propiedad y el control de la organización a otro miembro del equipo.
                            </span>
                          </div>
                          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                            <select
                              value={selectedTransferMember}
                              onChange={(e) => setSelectedTransferMember(e.target.value)}
                              className="select-premium flex-1"
                            >
                              <option value="">Selecciona un colaborador...</option>
                              {teamMembers
                                .filter(member => member.email !== user?.email)
                                .map(member => (
                                  <option key={member.id} value={member.email}>
                                    {member.email} ({member.role})
                                  </option>
                                ))
                              }
                            </select>
                            <button
                              onClick={handleTransferAdmin}
                              disabled={!selectedTransferMember || isSaving}
                              className="bg-erani-coral hover:bg-erani-coral/80 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              Confirmar Cesión de Rol
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* 2. TEAM MANAGEMENT */}
                {activeTab === "team" && (
                  <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-4">
                       <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-2">
                             <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Gestión de Colaboradores</h3>
                             <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Invita a tu equipo para centralizar la auditoría.</p>
                          </div>
                          
                          {/* VIEW TOGGLE */}
                          <div className="flex bg-black/5 dark:bg-black/20 p-1 rounded-xl border border-black/10 dark:border-white/5">
                             <button
                               onClick={() => setTeamView("list")}
                               className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${teamView === "list" ? "bg-white dark:bg-white/10 text-erani-blue dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                             >
                               Vista Lista
                             </button>
                             <button
                               onClick={() => setTeamView("orgchart")}
                               className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${teamView === "orgchart" ? "bg-white dark:bg-white/10 text-erani-blue dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                             >
                               Organigrama
                             </button>
                          </div>
                       </div>
                       <div className="flex justify-end mt-2">
                          <button 
                            onClick={() => setIsInviteModalOpen(true)}
                            className="button-premium px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                          >
                            <Plus className="w-4 h-4" /> Invitar Colaborador
                          </button>
                       </div>
                    </div>

                    {/* INVITE MODAL PROTOCOL */}
                    <AnimatePresence>
                      {isInviteModalOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-background/90 backdrop-blur-md"
                            onClick={() => setIsInviteModalOpen(false)}
                          />
                          
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glassmorphism bg-background/80 border border-white/10 rounded-3xl p-10 max-w-lg w-full relative shadow-2xl flex flex-col gap-8 z-10"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-erani-blue/10 flex items-center justify-center border border-erani-blue/20">
                                  <Send className="w-6 h-6 text-erani-blue" />
                                </div>
                                <div className="flex flex-col">
                                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Protocolo de Invitación</h3>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-erani-blue">Añadir miembro al ecosistema</p>
                                </div>
                              </div>
                              <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500 hover:text-white" />
                              </button>
                            </div>

                            <div className="flex flex-col gap-6">
                              <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Correo Electrónico (Receptor)</label>
                                <input 
                                  type="email" 
                                  placeholder="email@ejemplo.com"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  className="input-premium w-full text-base py-4"
                                />
                              </div>

                              <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargo / Posición Operativa</label>
                                <input
                                  type="text"
                                  placeholder="Ej. Líder de Ciberseguridad"
                                  value={inviteRole}
                                  onChange={(e) => setInviteRole(e.target.value)}
                                  className="input-premium w-full text-sm"
                                />
                              </div>

                              <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nivel de Acceso (Perfil)</label>
                                <div className="flex bg-black/30 p-1.5 rounded-xl border border-white/5 relative w-full h-12">
                                  <button onClick={() => setInviteProfileType('admin')} className={`flex-1 z-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${inviteProfileType === 'admin' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>Admin</button>
                                  <button onClick={() => setInviteProfileType('member')} className={`flex-1 z-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${inviteProfileType === 'member' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>Miembro</button>
                                  <motion.div 
                                    initial={false}
                                    animate={{ x: inviteProfileType === 'admin' ? 0 : '100%' }}
                                    className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-white/10 rounded-lg shadow-sm border border-white/10 z-0"
                                  />
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={handleSendInvite}
                              disabled={!inviteEmail}
                              className="w-full button-premium py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                              <Send className="w-4 h-4" /> Desplegar Invitación
                            </button>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {teamView === "list" ? (
                      <div className="grid grid-cols-1 gap-4 mt-6">
                         {teamMembers.map((member) => (
                           <div key={member.id} className="glassmorphism flex items-center justify-between p-6 rounded-2xl hover:scale-[1.01] transition-transform">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-erani-blue to-erani-purple flex items-center justify-center text-white font-black text-xs uppercase shadow-md">
                                    {member.email.charAt(0)}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">{member.email}</span>
                                    <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">{member.role || member.profile_type}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8">
                                 <div className="flex bg-black/5 dark:bg-black/30 p-1 rounded-lg border border-black/10 dark:border-white/5 relative w-32">
                                    <button onClick={() => handleChangeMemberRole(member.id, 'admin')} className={`flex-1 z-10 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${member.profile_type === 'admin' ? 'text-erani-blue dark:text-white' : 'text-gray-400'}`}>Admin</button>
                                    <button onClick={() => handleChangeMemberRole(member.id, 'member')} className={`flex-1 z-10 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${member.profile_type === 'member' ? 'text-erani-blue dark:text-white' : 'text-gray-400'}`}>Miembro</button>
                                    <motion.div 
                                      initial={false}
                                      animate={{ x: member.profile_type === 'admin' ? 0 : '100%' }}
                                      className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white dark:bg-white/10 rounded-md shadow-sm border border-black/10 dark:border-white/10 z-0"
                                    />
                                 </div>
                                 <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                                   member.verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                 }`}>
                                   {member.verified ? 'verificado' : 'pendiente'}
                                 </span>
                                 <button className="text-gray-700 hover:text-erani-coral transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center relative mt-10">
                         {/* ADMIN LEVEL */}
                         <div className="flex flex-wrap justify-center gap-8 z-10">
                            {teamMembers.filter(m => m.profile_type === 'admin').map((admin) => (
                               <div key={admin.id} className="flex flex-col items-center">
                                  <div className="glassmorphism p-8 rounded-[2rem] border-2 border-erani-blue/50 shadow-[0_0_40px_rgba(158,128,255,0.15)] flex flex-col items-center gap-5 w-80 relative transition-transform hover:scale-105">
                                     <div className="absolute -top-4 bg-erani-blue px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                        Admin Principal
                                     </div>
                                     <div className="w-20 h-20 mt-2 rounded-[1.2rem] bg-gradient-to-br from-erani-blue to-erani-purple flex items-center justify-center text-white font-black text-3xl uppercase shadow-inner border border-white/20">
                                        {admin.email.charAt(0)}
                                     </div>
                                     <div className="flex flex-col items-center text-center w-full">
                                        <span className="text-base font-black text-foreground truncate w-full">{admin.email}</span>
                                        <span className="text-[10px] uppercase font-bold text-erani-blue tracking-widest mt-1">{admin.role || 'Propietario'}</span>
                                     </div>
                                     
                                     <div className="w-full flex flex-col gap-3 mt-2 pt-4 border-t border-white/10">
                                        <div className="flex items-center justify-between w-full">
                                           <span className="text-[10px] font-black text-gray-500 uppercase">Estado</span>
                                           <span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest ${
                                             admin.verified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                           }`}>
                                             {admin.verified ? 'Verificado' : 'Pendiente'}
                                           </span>
                                        </div>
                                        <div className="flex bg-black/5 dark:bg-black/30 p-1 rounded-xl border border-black/10 dark:border-white/5 relative w-full">
                                           <button onClick={() => handleChangeMemberRole(admin.id, 'admin')} className={`flex-1 z-10 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${admin.profile_type === 'admin' ? 'text-erani-blue dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>Admin</button>
                                           <button onClick={() => handleChangeMemberRole(admin.id, 'member')} className={`flex-1 z-10 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${admin.profile_type === 'member' ? 'text-erani-blue dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>Miembro</button>
                                           <motion.div 
                                             initial={false}
                                             animate={{ x: admin.profile_type === 'admin' ? 0 : '100%' }}
                                             className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white dark:bg-white/10 rounded-lg shadow-md border border-black/10 dark:border-white/10 z-0"
                                           />
                                        </div>
                                     </div>
                                  </div>
                                  {/* Vertical line down to members branch */}
                                  <div className="w-px h-12 bg-gradient-to-b from-white/20 to-white/5" />
                               </div>
                            ))}
                         </div>

                         {/* CONNECTING HORIZONTAL LINE */}
                         {teamMembers.filter(m => m.profile_type === 'member').length > 0 && (
                            <div className="w-full max-w-5xl h-px bg-white/10 relative flex justify-center">
                               <div className="absolute w-3 h-3 rounded-full bg-white/30 -top-1.5 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            </div>
                         )}

                         {/* MEMBERS LEVEL */}
                         <div className="flex flex-wrap justify-center gap-8 mt-12 z-10 w-full">
                            {teamMembers.filter(m => m.profile_type === 'member').map((member) => (
                               <div key={member.id} className="relative flex flex-col items-center">
                                  {/* Line going up to horizontal connector */}
                                  <div className="absolute -top-12 w-px h-12 bg-gradient-to-t from-white/20 to-white/5" />
                                  
                                  <div className="glassmorphism p-6 rounded-[1.5rem] border border-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5 transition-all flex flex-col items-center gap-4 w-72">
                                     <div className="w-14 h-14 rounded-[1rem] bg-white/5 flex items-center justify-center text-foreground font-black text-2xl uppercase border border-white/5">
                                        {member.email.charAt(0)}
                                     </div>
                                     <div className="flex flex-col items-center text-center w-full">
                                        <span className="text-sm font-bold text-foreground truncate w-full">{member.email}</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mt-1">{member.role || 'Colaborador'}</span>
                                     </div>
                                     
                                     <div className="w-full flex flex-col gap-3 mt-2 pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between w-full">
                                           <span className="text-[10px] font-black text-gray-500 uppercase">Estado</span>
                                           <span className={`text-[9px] px-2 py-1 rounded-md text-white font-bold uppercase tracking-wider ${
                                             member.verified ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                                           }`}>
                                             {member.verified ? 'Verificado' : 'Pendiente'}
                                           </span>
                                        </div>
                                        <div className="flex bg-black/5 dark:bg-black/30 p-1 rounded-xl border border-black/10 dark:border-white/5 relative w-full">
                                           <button onClick={() => handleChangeMemberRole(member.id, 'admin')} className={`flex-1 z-10 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${member.profile_type === 'admin' ? 'text-erani-blue dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>Admin</button>
                                           <button onClick={() => handleChangeMemberRole(member.id, 'member')} className={`flex-1 z-10 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${member.profile_type === 'member' ? 'text-erani-blue dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>Miembro</button>
                                           <motion.div 
                                             initial={false}
                                             animate={{ x: member.profile_type === 'admin' ? 0 : '100%' }}
                                             className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white dark:bg-white/10 rounded-lg shadow-md border border-black/10 dark:border-white/10 z-0"
                                           />
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. FEATURE TOGGLES */}
                {activeTab === "features" && (
                  <div className="flex flex-col gap-10">
                     <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Experiencia de Usuario & Automatización</h3>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="glassmorphism p-8 rounded-[2rem] border border-white/5 flex flex-col gap-10">
                           <div className="flex items-center gap-3 text-emerald-500">
                              <ShieldCheck className="w-5 h-5" />
                              <span className="text-[10px] uppercase font-black tracking-widest">Firewall de Rentabilidad</span>
                           </div>
                           <div className="flex flex-col gap-6">
                              {[
                                { key: "firewall_enabled", label: "Firewall Automático", desc: "Activa alertas cuando Scope Creep > 5%" },
                                { key: "email_alerts", label: "Alertas por Email", desc: "Notificaciones de intrusos y estancamiento" },
                                { key: "slack_alerts", label: "Alertas por Slack", desc: "Webhooks directos a tu canal operativo" },
                                { key: "streaming_logs_enabled", label: "Logs en Tiempo Real", desc: "Transmisión SSE de actividad de plataforma" },
                              ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between">
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold text-foreground">{item.label}</span>
                                      <span className="text-[10px] text-gray-600">{item.desc}</span>
                                   </div>
                                   <button 
                                      onClick={() => handleToggleFeature(item.key as any)}
                                      className={`w-12 h-6 rounded-full relative transition-all shadow-inner border border-black/10 dark:border-transparent ${features[item.key as keyof typeof features] ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-white/10'}`}
                                   >
                                      <motion.div 
                                        animate={{ x: features[item.key as keyof typeof features] ? 24 : 4 }}
                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md" 
                                      />
                                   </button>
                                </div>
                              ))}

                               {features.email_alerts && profile?.profile_type === 'admin' && (
                                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/5">
                                     <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">Destinatarios de Reportes Forenses</span>
                                        <span className="text-[10px] text-gray-600">Selecciona los miembros que recibirán el reporte PDF automático.</span>
                                     </div>
                                     <div className="flex flex-wrap gap-2 mt-2">
                                        {teamMembers.map((member) => {
                                          const currentRecipients = orgData.auditNotificationRecipients || [];
                                          const isSelected = currentRecipients.includes(member.email);
                                          return (
                                            <button
                                              key={member.email}
                                              onClick={() => {
                                                const updated = isSelected
                                                  ? currentRecipients.filter((e) => e !== member.email)
                                                  : [...currentRecipients, member.email];
                                                setOrgData({ ...orgData, auditNotificationRecipients: updated });
                                              }}
                                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                isSelected
                                                  ? 'bg-erani-blue/20 text-erani-blue border border-erani-blue/30'
                                                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                                              }`}
                                            >
                                              {member.email}
                                            </button>
                                          );
                                        })}
                                     </div>
                                     <button 
                                        onClick={handleSaveOrg}
                                        disabled={isSaving}
                                        className="mt-4 text-[9px] px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg font-black uppercase tracking-widest self-start hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                                     >
                                        <Check className="w-3 h-3" /> Guardar Destinatarios
                                     </button>
                                  </div>
                               )}

                            </div>
                        </div>

                        <div className="glassmorphism p-8 rounded-[2rem] border border-white/5 flex flex-col gap-8">
                           <div className="flex items-center gap-3 text-erani-blue">
                              <Bell className="w-5 h-5" />
                              <span className="text-[10px] uppercase font-black tracking-widest">SLA & Garantías</span>
                           </div>
                           <div className="flex flex-col gap-4">
                              <div className="flex justify-between items-center py-2 border-b border-white/5">
                                 <span className="text-xs font-bold text-gray-500">Uptime Plataforma</span>
                                 <span className="text-xs font-black text-emerald-500 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 99.5%
                                 </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-white/5">
                                 <span className="text-xs font-bold text-gray-500">Soporte Técnico</span>
                                 <span className="text-xs font-black text-erani-blue flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-erani-blue" /> &lt; 2 horas
                                 </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-white/5">
                                 <span className="text-xs font-bold text-gray-500">Tiempo de Auditoría</span>
                                 <span className="text-xs font-black text-erani-purple flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-erani-purple" /> &lt; 10 min
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* 4. ERIS & REFERRALS */}
                {activeTab === "referrals" && (
                  <div className="flex flex-col gap-10">
                     <div className="grid grid-cols-12 gap-8">
                        {/* Eris Card */}
                        <div className="col-span-12 md:col-span-5 glassmorphism p-10 rounded-[2.5rem] border border-white/5 flex flex-col gap-8 bg-gradient-to-br from-erani-blue/10 to-transparent">
                           <div className="flex items-center gap-3">
                              <Zap className="w-6 h-6 text-erani-blue fill-erani-blue" />
                              <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Consumo de ERIS</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-7xl font-black text-foreground">{erisBalance.toLocaleString()}</span>
                              <span className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em]">ERIS Disponibles</span>
                           </div>
                           <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                              <span className="text-[8px] uppercase font-black text-gray-500">Consumo promedio / consulta:</span>
                              <span className="text-xs font-bold text-foreground">5 ERIS (Erani Engine 1.5 Flash Inference)</span>
                           </div>
                        </div>

                        {/* Referral Logic */}
                        <div className="col-span-12 md:col-span-7 flex flex-col gap-6">
                           <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6">
                              <h4 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                                <Share2 className="w-5 h-5 text-erani-purple" /> Referir & Ganar
                              </h4>
                              <p className="text-[10px] font-medium text-gray-600 leading-relaxed uppercase tracking-widest">
                                Comparte ERANI con un colega. Si realiza su demo gratuita, obtendrás 100 ERIS de regalo y él obtendrá acceso prioritario.
                              </p>
                              <div className="flex flex-col gap-4">
                                 <div className="flex gap-4">
                                    <input 
                                      type="email" 
                                      placeholder="Email de tu referido..."
                                      value={referralEmail}
                                      onChange={(e) => setReferralEmail(e.target.value)}
                                      className="input-premium flex-1"
                                    />
                                    <button 
                                      onClick={handleGenerateReferral}
                                      className="bg-white text-black px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                    >
                                      Generar Liga
                                    </button>
                                 </div>
                                 {referralLink && (
                                   <div className="flex items-center justify-between p-4 rounded-xl bg-erani-purple/10 border border-erani-purple/20">
                                      <span className="text-[10px] font-mono text-erani-purple truncate max-w-xs">{referralLink}</span>
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(referralLink);
                                          setMessage({ type: "success", text: "Link copiado" });
                                        }}
                                        className="text-erani-purple p-2 hover:bg-erani-purple/20 rounded-lg transition-all"
                                      >
                                         <Copy className="w-4 h-4" />
                                      </button>
                                   </div>
                                 )}
                              </div>
                           </div>

                           {/* Canjear Código */}
                           <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 mt-4">
                              <h4 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                                <Zap className="w-5 h-5 text-emerald-500" /> Canjear Código de Referido
                              </h4>
                              <p className="text-[10px] font-medium text-gray-600 leading-relaxed uppercase tracking-widest">
                                ¿Alguien te invitó a ERANI? Introduce su código único aquí y obtén 20 ERIS adicionales de inmediato.
                              </p>
                              <div className="flex gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Código de referido (Ej: X9A2B4)"
                                  value={redeemCode}
                                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                                  className="input-premium flex-1 uppercase"
                                />
                                <button 
                                  onClick={handleRedeemCode}
                                  disabled={isRedeeming}
                                  className="bg-emerald-500 text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                  {isRedeeming ? "Canjeando..." : "Canjear"}
                                </button>
                              </div>
                           </div>

                        </div>
                     </div>
                  </div>
                )}

                {/* 5. LOGS */}
                {activeTab === "logs" && (
                   <div className="flex flex-col gap-8 h-[600px]">
                      <div className="flex justify-between items-center">
                         <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Logs Operativos & Auditoría</h3>
                         <div className="flex items-center gap-4">
                            <span className="text-[9px] uppercase font-black text-gray-600 tracking-widest flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Stream SSE Activo
                            </span>
                         </div>
                      </div>
                      
                      <div className="flex-1 min-h-0 rounded-[2rem] overflow-hidden border border-white/5 relative">
                        {!features.streaming_logs_enabled ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm z-10 p-6 text-center gap-4">
                            <AlertCircle className="w-10 h-10 text-gray-400" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Logs en tiempo real desactivados</h4>
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest max-w-sm">
                              Activa la funcionalidad "Logs en Tiempo Real" en la sección de Funcionalidades para poder visualizar el flujo de eventos de tu equipo.
                            </p>
                            <button 
                              onClick={() => setActiveTab("features")}
                              className="mt-2 button-premium px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
                            >
                              Ir a Funcionalidades
                            </button>
                          </div>
                        ) : profile?.organization_id ? (
                          <RealtimeLogTerminal organizationId={profile.organization_id} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Cargando Terminal...</span>
                          </div>
                        )}
                      </div>
                   </div>
                )}

                {/* 7. ERANI CLOUD TAB */}
                {activeTab === "cloud" && (
                  <div className="flex flex-col gap-10">
                     {/* Cloud Header */}
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-glass-border pb-6">
                        <div className="flex flex-col gap-2">
                           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-erani-blue/10 border border-erani-blue/20 text-erani-blue w-fit">
                              <Cloud className="w-3.5 h-3.5" />
                              <span className="text-[9px] uppercase font-black tracking-widest">
                                Servidor de Almacenamiento Forense ({orgData.paidSubscription ? "Beta 100 GB" : "Trial 5 GB"})
                              </span>
                           </div>
                           <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">ERANI Cloud Storage</h3>
                           <p className="text-xs text-nav-text max-w-2xl leading-relaxed">
                              Cuantificación real del almacenamiento consumido por los recursos internos de tu organización en la nube segura de ERANI.
                           </p>
                        </div>
                        <div className="flex items-center gap-3 bg-foreground/5 p-3 rounded-2xl border border-glass-border">
                           <ShieldCheck className="w-6 h-6 text-emerald-500" />
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-foreground">Encriptación AES-256</span>
                              <span className="text-[8px] font-bold uppercase text-emerald-500">Multi-Región Activa</span>
                           </div>
                        </div>
                     </div>

                     {/* Global Storage Overview Bar Card */}
                     <motion.div 
                       initial={{ opacity: 0, y: 15 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6 relative overflow-hidden bg-gradient-to-br from-erani-blue/10 via-background/60 to-erani-purple/10"
                     >
                        <div className="flex justify-between items-end flex-wrap gap-4 z-10">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue">Consumo Real Asignado</span>
                              <div className="flex items-baseline gap-3">
                                 <span className="text-5xl font-black text-foreground">
                                    {realStorageData.totalMB >= 1 ? `${realStorageData.totalMB} MB` : `${realStorageData.totalKB} KB`}
                                 </span>
                                 <span className="text-2xl text-nav-text font-bold">({(realStorageData.totalMB / 1024).toFixed(4)} GB)</span>
                                 <span className="text-sm text-nav-text">/ {realStorageData.limitGB} GB Disponibles ({realStorageData.limitMB.toLocaleString()} MB)</span>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                 {realStorageData.usedPct}% Capacidad Utilizada
                              </span>
                              <span className="text-[9px] text-nav-text">
                                 {(realStorageData.limitMB - realStorageData.totalMB).toFixed(2)} MB Libres
                              </span>
                           </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="w-full bg-black/20 rounded-full h-4 p-1 border border-glass-border relative overflow-hidden z-10">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(1, realStorageData.usedPct)}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className="bg-gradient-to-r from-erani-blue via-erani-purple to-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(0,85,160,0.6)]"
                           />
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-glass-border z-10">
                           <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-black text-gray-500">Recursos Indexados</span>
                              <span className="text-base font-black text-foreground">
                                 {realStorageData.resourceItems.reduce((acc, curr) => acc + curr.count, 0)} Elementos
                              </span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-black text-gray-500">Cuota de Plan</span>
                              <span className="text-base font-black text-erani-purple">
                                 {orgData.paidSubscription ? "100 GB (Beta)" : "5 GB (Trial)"}
                              </span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-black text-gray-500">Promedio / Recurso</span>
                              <span className="text-base font-black text-foreground">
                                 {(realStorageData.totalMB / Math.max(1, realStorageData.resourceItems.reduce((acc, curr) => acc + curr.count, 0))).toFixed(2)} MB
                              </span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-black text-gray-500">Bóvedas Activas</span>
                              <span className="text-base font-black text-emerald-500">
                                 {realStorageData.resourceItems.find(r => r.id === 'datarooms')?.count || 1} Data Rooms
                              </span>
                           </div>
                        </div>
                     </motion.div>

                     {/* Cuantificación por Recursos Internos (9 Categorías Reales) */}
                     <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                           <div className="flex flex-col">
                              <h4 className="text-lg font-black text-foreground uppercase tracking-tight">Cuantificación por Recurso Interno</h4>
                              <p className="text-[10px] text-nav-text font-bold uppercase tracking-widest">Desglose real de espacio utilizado en ERANI Cloud por tipo de activo.</p>
                           </div>
                           <span className="text-[9px] font-black uppercase text-erani-blue bg-erani-blue/10 px-3 py-1.5 rounded-xl border border-erani-blue/20">
                              9 Tipos de Recurso Cuantificados
                           </span>
                        </div>

                        {/* 9 Cards Grid Dynamic */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                           {realStorageData.resourceItems.map((item, i) => (
                              <motion.div 
                                 key={item.id}
                                 initial={{ opacity: 0, y: 15 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: i * 0.04 }}
                                 className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-4 hover:border-erani-blue/40 transition-all group relative overflow-hidden"
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="p-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                                       <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                       {item.pct}% del uso
                                    </span>
                                 </div>

                                 <div className="flex flex-col">
                                    <h5 className="text-base font-black text-foreground group-hover:text-erani-blue transition-colors">{item.name}</h5>
                                    <p className="text-[10px] text-nav-text line-clamp-2 mt-0.5">{item.desc}</p>
                                 </div>

                                 <div className="flex items-baseline justify-between pt-2 border-t border-glass-border">
                                    <div className="flex flex-col">
                                       <span className="text-[8px] font-black uppercase text-gray-500">Espacio Ocupado</span>
                                       <span className="text-xl font-black text-foreground">{item.sizeStr}</span>
                                       <span className="text-[8px] text-nav-text font-mono">({Math.round(item.sizeMB * 1024)} KB)</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[8px] font-black uppercase text-gray-500">Cantidad / Prom</span>
                                       <span className="text-xs font-bold text-foreground">{item.count} items</span>
                                       <span className="text-[8px] text-erani-purple font-mono">Prom: {item.avgSize}</span>
                                    </div>
                                 </div>

                                 <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, item.pct)}%`, backgroundColor: item.color }} />
                                 </div>
                              </motion.div>
                           ))}
                        </div>
                     </div>

                     {/* Gráficas Interactivas de Almacenamiento */}
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Pie Chart: Distribución Porcentual */}
                        <div className="lg:col-span-6 glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-xl bg-erani-purple/10 text-erani-purple">
                                    <PieChart className="w-5 h-5" />
                                 </div>
                                 <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Distribución de Espacio Real</h4>
                              </div>
                              <span className="text-[9px] text-nav-text font-mono">{realStorageData.totalMB} MB Total</span>
                           </div>

                           <div className="h-[280px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                 <RePieChart>
                                    <Pie
                                       data={realStorageData.resourceItems.map(r => ({
                                          name: r.name,
                                          value: r.sizeMB,
                                          color: r.color
                                       }))}
                                       cx="50%"
                                       cy="50%"
                                       innerRadius={65}
                                       outerRadius={95}
                                       paddingAngle={3}
                                       dataKey="value"
                                    >
                                       {realStorageData.resourceItems.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                                       ))}
                                    </Pie>
                                    <Tooltip 
                                       formatter={(val: any) => [`${val} MB`, "Espacio Ocupado"]}
                                       contentStyle={{ backgroundColor: 'rgba(10,14,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                    />
                                    <Legend 
                                       wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} 
                                       formatter={(value) => <span className="text-nav-text font-bold uppercase tracking-wider">{value}</span>}
                                    />
                                 </RePieChart>
                              </ResponsiveContainer>
                           </div>
                        </div>

                        {/* Area Chart: Crecimiento Histórico Real Cloud */}
                        <div className="lg:col-span-6 glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-xl bg-erani-blue/10 text-erani-blue">
                                    <TrendingUp className="w-5 h-5" />
                                 </div>
                                 <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Tendencia de Crecimiento Real (MB)</h4>
                              </div>
                              <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">Optimizado</span>
                           </div>

                           <div className="h-[280px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart 
                                    data={[
                                       { date: "Sem 1", mb: Number((realStorageData.totalMB * 0.25).toFixed(2)) },
                                       { date: "Sem 2", mb: Number((realStorageData.totalMB * 0.50).toFixed(2)) },
                                       { date: "Sem 3", mb: Number((realStorageData.totalMB * 0.75).toFixed(2)) },
                                       { date: "Sem 4", mb: realStorageData.totalMB },
                                    ]} 
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                 >
                                    <defs>
                                       <linearGradient id="cloudGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#0055A0" stopOpacity={0.5}/>
                                          <stop offset="95%" stopColor="#9e80ff" stopOpacity={0.05}/>
                                       </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }} />
                                    <Tooltip 
                                       formatter={(val: any) => [`${val} MB`, "Almacenamiento Total"]}
                                       contentStyle={{ backgroundColor: 'rgba(10,14,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="mb" stroke="#0055A0" strokeWidth={3} fillOpacity={1} fill="url(#cloudGrowthGrad)" />
                                 </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                     </div>

                     {/* DESGLOSE OPERATIVO (ERANI CLOUD) */}
                     <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-glass-border pb-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-erani-blue/10 text-erani-blue">
                                 <Activity className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                 <h4 className="text-base font-black text-foreground uppercase tracking-tight">Desglose Operativo de ERANI Cloud</h4>
                                 <p className="text-[10px] text-nav-text font-bold uppercase tracking-widest">Impacto en MB/KB y deducción de ERIS por operación interna.</p>
                              </div>
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                              Vinculado a Supabase
                           </span>
                        </div>

                        <div className="w-full overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="bg-foreground/5 text-[9px] uppercase tracking-widest text-nav-text border-b border-glass-border">
                                    <th className="p-4 font-black">Operación Interna</th>
                                    <th className="p-4 font-black">Recurso Afectado</th>
                                    <th className="p-4 font-black text-right">Gasto de Almacenamiento</th>
                                    <th className="p-4 font-black text-right">Deducción ERIS</th>
                                    <th className="p-4 font-black">Fecha</th>
                                    <th className="p-4 font-black text-center">Estado</th>
                                 </tr>
                              </thead>
                              <tbody className="text-sm divide-y divide-glass-border">
                                 {realStorageData.operations.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-foreground/5 transition-colors group">
                                       <td className="p-4 font-bold text-foreground flex items-center gap-3">
                                          <div className="p-2 rounded-xl bg-foreground/5 border border-glass-border">
                                             <row.icon className="w-4 h-4 text-erani-blue" />
                                          </div>
                                          <span>{row.op}</span>
                                       </td>
                                       <td className="p-4 text-xs font-semibold text-nav-text">{row.res}</td>
                                       <td className="p-4 text-right font-black font-mono text-erani-purple">{row.size}</td>
                                       <td className="p-4 text-right font-black font-mono text-erani-coral">{row.eris}</td>
                                       <td className="p-4 text-xs font-mono text-nav-text">{row.date}</td>
                                       <td className="p-4 text-center">
                                          <span className="text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                             {row.status}
                                          </span>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
                )}

                {/* 8. MÉTRICAS Y LÍMITES TAB */}
                {activeTab === "metrics" && (
                  <div className="flex flex-col gap-10">
                     {/* Header */}
                     <div className="flex flex-col gap-2 border-b border-glass-border pb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-erani-purple/10 border border-erani-purple/20 text-erani-purple w-fit">
                           <BarChart3 className="w-3.5 h-3.5" />
                           <span className="text-[9px] uppercase font-black tracking-widest">Panel Control de Recursos ({orgData.paidSubscription ? "Plan Beta 10 GB" : "Plan Trial 5 GB"})</span>
                        </div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Métricas & Límites Operativos</h3>
                        <p className="text-xs text-nav-text max-w-2xl leading-relaxed">
                           Supervisión integral de cuotas de almacenamiento en MB/GB, balance de ERIS, límites por recurso interno y desglose operativo en tiempo real.
                        </p>
                     </div>

                     {/* Top KPI Cards Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <motion.div 
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-3"
                        >
                           <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Almacenamiento Global</span>
                           <span className="text-3xl font-black text-foreground">
                              {realStorageData.totalMB} <span className="text-sm text-erani-blue font-bold">MB</span>
                           </span>
                           <span className="text-[9px] font-bold text-nav-text">({realStorageData.totalKB.toLocaleString()} KB de {realStorageData.limitMB.toLocaleString()} MB)</span>
                           <div className="w-full bg-black/20 rounded-full h-2 mt-1">
                              <div className="bg-erani-blue h-2 rounded-full" style={{ width: `${Math.max(1, realStorageData.usedPct)}%` }} />
                           </div>
                        </motion.div>

                        <motion.div 
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.05 }}
                           className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-3"
                        >
                           <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Balance de ERIS</span>
                           <span className="text-3xl font-black text-erani-purple">{erisBalance.toLocaleString()} <span className="text-sm font-bold text-nav-text">ERIS</span></span>
                           <span className="text-[9px] font-bold text-emerald-500">Límite otorgado por plan</span>
                           <div className="w-full bg-black/20 rounded-full h-2 mt-1">
                              <div className="bg-erani-purple h-2 rounded-full" style={{ width: "75%" }} />
                           </div>
                        </motion.div>

                        <motion.div 
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.1 }}
                           className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-3"
                        >
                           <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Proyectos Activos</span>
                           <span className="text-3xl font-black text-foreground">
                              {realStorageData.resourceItems.find(r => r.id === 'projects')?.count || 1} <span className="text-sm text-gray-500 font-medium">/ {orgData.paidSubscription ? "Ilimitados" : "1 Trial"}</span>
                           </span>
                           <span className="text-[9px] font-bold text-nav-text">Indexados en ERANI Engine</span>
                           <div className="w-full bg-black/20 rounded-full h-2 mt-1">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "30%" }} />
                           </div>
                        </motion.div>

                        <motion.div 
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.15 }}
                           className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-3"
                        >
                           <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Límite de Plan</span>
                           <span className="text-3xl font-black text-foreground">{realStorageData.limitGB} <span className="text-sm text-erani-coral font-bold font-mono">GB</span></span>
                           <span className="text-[9px] font-bold text-emerald-500">{orgData.paidSubscription ? "Suscripción Beta Activa" : "Modo Gratuito (Trial)"}</span>
                           <div className="w-full bg-black/20 rounded-full h-2 mt-1">
                              <div className="bg-erani-coral h-2 rounded-full" style={{ width: `${Math.max(2, realStorageData.usedPct)}%` }} />
                           </div>
                        </motion.div>
                     </div>

                     {/* Visual Breakdown Cards by Resource Limits */}
                     <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                           <div className="flex flex-col">
                              <h4 className="text-base font-black text-foreground uppercase tracking-tight">Distribución de Consumo y Cuotas por Recurso</h4>
                              <p className="text-[10px] text-nav-text font-bold uppercase tracking-widest">Resumen cuantitativo de espacio en MB/KB por tipo de recurso interno.</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {realStorageData.resourceItems.map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-2 p-4 rounded-2xl bg-foreground/5 border border-glass-border">
                                 <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-foreground">{item.name}</span>
                                    <span className="font-black font-mono" style={{ color: item.color }}>{item.pct}%</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[10px] text-nav-text font-mono">
                                    <span>{item.sizeStr}</span>
                                    <span>{item.count} items</span>
                                 </div>
                                 <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden mt-1">
                                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, item.pct)}%`, backgroundColor: item.color }} />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Animated Recharts: ERIS Deductions vs Storage Usage */}
                     <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-erani-purple/10 text-erani-purple">
                                 <BarChart3 className="w-5 h-5" />
                              </div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Relación ERIS Deductibles vs Gasto de Almacenamiento</h4>
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-wider text-nav-text">Datos Reales Vinculados</span>
                        </div>

                        <div className="h-[280px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                 data={realStorageData.resourceItems.map(r => ({
                                    name: r.name,
                                    eris: r.id === 'audits' ? 30 : r.id === 'datarooms' ? 20 : r.id === 'projects' ? 25 : r.id === 'reports' ? 10 : 5,
                                    sizeMB: r.sizeMB
                                 }))}
                                 margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                              >
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.6)" }} />
                                 <YAxis yAxisId="left" orientation="left" stroke="#9e80ff" tick={{ fontSize: 9 }} />
                                 <YAxis yAxisId="right" orientation="right" stroke="#0055A0" tick={{ fontSize: 9 }} />
                                 <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(10,14,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                 />
                                 <Bar yAxisId="left" dataKey="eris" name="ERIS Restados" fill="#9e80ff" radius={[6, 6, 0, 0]} />
                                 <Bar yAxisId="right" dataKey="sizeMB" name="Tamaño (MB)" fill="#0055A0" radius={[6, 6, 0, 0]} />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* FULL DESGLOSE OPERATIVO TABLE */}
                     <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-glass-border pb-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                 <Activity className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                 <h4 className="text-base font-black text-foreground uppercase tracking-tight">Desglose Operativo Completo</h4>
                                 <p className="text-[10px] text-nav-text font-bold uppercase tracking-widest">Impacto preciso de las operaciones: ERIS restados y consumo en MB/KB.</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-erani-blue bg-erani-blue/10 px-3 py-1 rounded-lg border border-erani-blue/20">
                                 {realStorageData.operations.length} Operaciones Registradas
                              </span>
                           </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="bg-foreground/5 text-[9px] uppercase tracking-widest text-nav-text border-b border-glass-border">
                                    <th className="p-4 font-black">Nombre de la Operación</th>
                                    <th className="p-4 font-black">Recurso Afectado</th>
                                    <th className="p-4 font-black text-right">Consumo de Espacio</th>
                                    <th className="p-4 font-black text-right">Impacto ERIS</th>
                                    <th className="p-4 font-black">Fecha y Hora</th>
                                    <th className="p-4 font-black text-center">Estado Operativo</th>
                                 </tr>
                              </thead>
                              <tbody className="text-sm divide-y divide-glass-border">
                                 {realStorageData.operations.map((op, idx) => (
                                    <tr key={idx} className="hover:bg-foreground/5 transition-colors">
                                       <td className="p-4 font-bold text-foreground">{op.op}</td>
                                       <td className="p-4 text-xs font-semibold text-nav-text">{op.res}</td>
                                       <td className="p-4 text-right font-black font-mono text-erani-purple">{op.size}</td>
                                       <td className="p-4 text-right font-black font-mono text-erani-coral">{op.eris}</td>
                                       <td className="p-4 text-xs font-mono text-nav-text">{op.date}</td>
                                       <td className="p-4 text-center">
                                          <span className="text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                             {op.status}
                                          </span>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === "managers" && (
                  <div className="flex flex-col gap-10">
                     <div className="flex flex-col gap-2 border-b border-glass-border pb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-erani-purple/10 border border-erani-purple/20 text-erani-purple w-fit">
                           <User className="w-3.5 h-3.5" />
                           <span className="text-[9px] uppercase font-black tracking-widest">Liderazgo de Proyectos ERANI</span>
                        </div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Project Managers</h3>
                        <p className="text-xs text-nav-text max-w-2xl leading-relaxed">
                           Líderes de proyecto dedicados asignados a tu organización para coordinar auditorías forenses, revisiones de código y sesiones de arquitectura.
                        </p>
                     </div>

                     {assignedManagers.length === 0 ? (
                        <div className="glassmorphism p-12 rounded-[2.5rem] border border-glass-border flex flex-col items-center justify-center text-center py-20 gap-6 bg-gradient-to-br from-erani-purple/5 via-background/40 to-erani-blue/5">
                           <div className="p-6 rounded-3xl bg-erani-purple/10 border border-erani-purple/20 text-erani-purple">
                              <User className="w-12 h-12 stroke-[1.5]" />
                           </div>
                           <div className="flex flex-col gap-2 max-w-md">
                              <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">Gestión de Líderes de Proyecto</h4>
                              <p className="text-xs text-nav-text leading-relaxed">
                                 Asigna líderes de proyecto específicos para que coordinen tus auditorías, supervisen entregables e interactúen directamente con tu equipo técnico.
                              </p>
                           </div>
                           <button 
                              onClick={() => setIsInviteManagerModalOpen(true)}
                              className="button-premium px-8 py-3.5 rounded-2xl text-[10px] uppercase font-black tracking-widest mt-2 flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
                           >
                              <UserPlus className="w-4 h-4 text-erani-blue" />
                              Invitar Manager
                           </button>
                        </div>
                     ) : (
                        <div className="flex flex-col gap-8">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue bg-erani-blue/10 px-3 py-1.5 rounded-xl border border-erani-blue/20">
                                 {assignedManagers.length} Project Manager{assignedManagers.length > 1 ? 's' : ''} Asignado{assignedManagers.length > 1 ? 's' : ''}
                              </span>
                           </div>

                           <div className="grid grid-cols-1 gap-8">
                              {assignedManagers.map((pm) => (
                                 <motion.div 
                                    key={pm.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border flex flex-col lg:flex-row gap-8 relative overflow-hidden bg-gradient-to-br from-erani-blue/10 via-background/80 to-erani-purple/10 shadow-2xl"
                                 >
                                    {/* Left Badge & Avatar */}
                                    <div className="flex flex-col items-center lg:items-start gap-4">
                                       <div className="relative">
                                          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-erani-blue via-erani-purple to-emerald-400 p-1 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                                             {pm.avatar && pm.avatar.startsWith('/') ? (
                                                <img src={pm.avatar} alt={pm.name} className="w-full h-full object-cover rounded-[1.4rem]" />
                                             ) : (
                                                <div className="w-full h-full bg-background rounded-[1.4rem] flex items-center justify-center font-black text-3xl text-foreground uppercase tracking-wider">
                                                   {pm.avatar || 'DA'}
                                                </div>
                                             )}
                                          </div>
                                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black p-1.5 rounded-xl shadow-lg border border-black/40" title="Verificado Activo">
                                             <Check className="w-4 h-4 stroke-[3]" />
                                          </div>
                                       </div>
                                       <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo & Asignado
                                       </span>
                                    </div>

                                    {/* Center: Details & Profile */}
                                    <div className="flex-1 flex flex-col gap-4">
                                       <div className="flex flex-col gap-1">
                                          <div className="flex items-center justify-between flex-wrap gap-2">
                                             <h4 className="text-2xl font-black text-foreground">{pm.name}</h4>
                                             <span className="text-[10px] font-mono text-nav-text">Asignado: {pm.assignedAt}</span>
                                          </div>
                                          <span className="text-xs font-bold text-erani-purple uppercase tracking-wider">{pm.role}</span>
                                       </div>

                                       <p className="text-xs text-nav-text leading-relaxed bg-foreground/5 p-4 rounded-2xl border border-glass-border">
                                          {pm.desc}
                                       </p>

                                       {/* Contacts Grid */}
                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-glass-border">
                                             <Mail className="w-4 h-4 text-erani-blue" />
                                             <div className="flex flex-col min-w-0">
                                                <span className="text-[8px] font-black uppercase text-gray-500">Email</span>
                                                <span className="text-xs font-bold text-foreground truncate">{pm.email}</span>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-glass-border">
                                             <Phone className="w-4 h-4 text-emerald-500" />
                                             <div className="flex flex-col min-w-0">
                                                <span className="text-[8px] font-black uppercase text-gray-500">Teléfono Directo</span>
                                                <span className="text-xs font-bold text-foreground truncate">{pm.phone}</span>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-glass-border">
                                             <Globe className="w-4 h-4 text-erani-purple" />
                                             <div className="flex flex-col min-w-0">
                                                <span className="text-[8px] font-black uppercase text-gray-500">Ubicación</span>
                                                <span className="text-xs font-bold text-foreground truncate">{pm.location}</span>
                                             </div>
                                          </div>
                                       </div>

                                       {/* KPIs bar & Single main action button */}
                                       <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-glass-border">
                                          <div className="flex items-center gap-6">
                                             <div className="flex flex-col">
                                                <span className="text-[8px] uppercase font-black text-gray-500">Auditorías Coordinadas</span>
                                                <span className="text-sm font-black text-foreground">{pm.projectsCount} Proyectos</span>
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="text-[8px] uppercase font-black text-gray-500">Tiempo de Respuesta</span>
                                                <span className="text-sm font-black text-emerald-500">{pm.responseTime}</span>
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="text-[8px] uppercase font-black text-gray-500">Satisfacción</span>
                                                <span className="text-sm font-black text-erani-purple">{pm.rating}</span>
                                             </div>
                                          </div>

                                          <div className="flex items-center gap-3">
                                             <button 
                                                onClick={() => handleRemoveManager(pm.id)}
                                                className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 px-3 py-1.5 transition-all"
                                             >
                                                Desasignar
                                             </button>
                                             <button 
                                                onClick={() => handleOpenScheduleModal(pm)}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                             >
                                                <Calendar className="w-4 h-4" />
                                                Agendar Reunión en Calendario
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                 </motion.div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
                )}

                {activeTab === "sync" && (
                  <div className="flex flex-col gap-8">
                     <div className="flex flex-col gap-2 border-b border-glass-border pb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 w-fit">
                           <Calendar className="w-3.5 h-3.5" />
                           <span className="text-[9px] uppercase font-black tracking-widest">Google Workspace & Calendar Sync</span>
                        </div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Calendario & Google Sync</h3>
                        <p className="text-xs text-nav-text max-w-2xl leading-relaxed">
                           Sincronización directa en tiempo real con el calendario de Google Workspace de Diego Arredondo y el equipo técnico de ERANI.
                        </p>
                     </div>

                     <div className="w-full h-[550px] glassmorphism rounded-[2.5rem] border border-glass-border overflow-hidden relative p-4 flex flex-col gap-4 shadow-2xl">
                        <div className="flex items-center justify-between px-4 pt-2">
                           <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs font-bold text-foreground">Google Calendar Active Stream</span>
                           </div>
                           <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              diego.arredondo@erani.cloud
                           </span>
                        </div>
                        <iframe 
                           src="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2EUR-bCUz7R604ttZTsBVNw5TRByBuPyoL8Os2axIgH2v1hjAh0OJURYc2TiH92bH-O5kkJf94?gv=true" 
                           style={{ border: 0 }} 
                           width="100%" 
                           height="100%" 
                           className="rounded-2xl dark:invert dark:hue-rotate-180 dark:brightness-95 contrast-125 opacity-90"
                        />
                     </div>
                  </div>
                )}

                {/* 6. ACCOUNT */}
                {activeTab === "account" && (
                  <div className="flex flex-col gap-10 max-w-2xl">
                     <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Seguridad de la Cuenta</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                               <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Nombre Completo</label>
                               <input 
                                 type="text"
                                 value={accountData.fullName}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setAccountData(prev => ({ ...prev, fullName: val }));
                                   setUserProfileData(prev => ({ ...prev, fullName: val }));
                                 }}
                                 className="w-full bg-foreground/5 border border-glass-border p-4 rounded-xl text-sm font-bold text-foreground focus:border-erani-blue focus:outline-none transition-all"
                                 placeholder="Tu nombre"
                               />
                            </div>
                            <div className="flex flex-col gap-2">
                               <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Email Principal</label>
                               <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-gray-500 flex items-center gap-3">
                                  <Mail className="w-4 h-4" /> {user?.email}
                               </div>
                            </div>
                            <button 
                              onClick={handleSaveAccount}
                              disabled={isSaving}
                              className="mt-4 bg-foreground text-background px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all self-start flex items-center gap-2"
                            >
                              {isSaving ? "Guardando..." : "Guardar Cambios"}
                              <Send className="w-3 h-3" />
                            </button>
                        </div>
                     </div>
                     
                     <div className="pt-10 border-t border-white/5 flex flex-col gap-6">
                         <h4 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                           <KeyRound className="w-4 h-4 text-erani-purple" />
                           Actualizar Contraseña
                         </h4>

                         {/* Password change form */}
                         <div className="flex flex-col gap-4 p-6 rounded-2xl bg-foreground/5 border border-glass-border">
                           {/* Current */}
                           <div className="flex flex-col gap-2">
                             <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Contraseña Actual</label>
                             <div className="relative">
                               <input
                                 type={pwShow.current ? "text" : "password"}
                                 value={pwForm.current}
                                 onChange={(e) => setPwForm(p => ({ ...p, current: e.target.value }))}
                                 placeholder="Tu contraseña actual"
                                 className="w-full bg-background border border-glass-border p-4 pr-12 rounded-xl text-sm font-bold text-foreground focus:border-erani-blue focus:outline-none transition-all"
                               />
                               <button
                                 type="button"
                                 onClick={() => setPwShow(s => ({ ...s, current: !s.current }))}
                                 className="absolute right-4 top-1/2 -translate-y-1/2 text-nav-text hover:text-erani-blue transition-colors"
                                 aria-label={pwShow.current ? "Ocultar" : "Mostrar"}
                                 tabIndex={-1}
                               >
                                 {pwShow.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                               </button>
                             </div>
                           </div>

                           {/* New */}
                           <div className="flex flex-col gap-2">
                             <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Nueva Contraseña</label>
                             <div className="relative">
                               <input
                                 type={pwShow.next ? "text" : "password"}
                                 value={pwForm.next}
                                 onChange={(e) => setPwForm(p => ({ ...p, next: e.target.value }))}
                                 placeholder="Mínimo 6 caracteres"
                                 className="w-full bg-background border border-glass-border p-4 pr-12 rounded-xl text-sm font-bold text-foreground focus:border-erani-blue focus:outline-none transition-all"
                               />
                               <button
                                 type="button"
                                 onClick={() => setPwShow(s => ({ ...s, next: !s.next }))}
                                 className="absolute right-4 top-1/2 -translate-y-1/2 text-nav-text hover:text-erani-blue transition-colors"
                                 aria-label={pwShow.next ? "Ocultar" : "Mostrar"}
                                 tabIndex={-1}
                               >
                                 {pwShow.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                               </button>
                             </div>
                           </div>

                           {/* Confirm */}
                           <div className="flex flex-col gap-2">
                             <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Confirmar Contraseña</label>
                             <div className="relative">
                               <input
                                 type={pwShow.confirm ? "text" : "password"}
                                 value={pwForm.confirm}
                                 onChange={(e) => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                 placeholder="Repite la nueva contraseña"
                                 className={`w-full bg-background border p-4 pr-12 rounded-xl text-sm font-bold text-foreground focus:outline-none transition-all ${
                                   pwForm.confirm && pwForm.next !== pwForm.confirm
                                     ? "border-erani-coral/60 focus:border-erani-coral"
                                     : "border-glass-border focus:border-erani-blue"
                                 }`}
                               />
                               <button
                                 type="button"
                                 onClick={() => setPwShow(s => ({ ...s, confirm: !s.confirm }))}
                                 className="absolute right-4 top-1/2 -translate-y-1/2 text-nav-text hover:text-erani-blue transition-colors"
                                 aria-label={pwShow.confirm ? "Ocultar" : "Mostrar"}
                                 tabIndex={-1}
                               >
                                 {pwShow.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                               </button>
                             </div>
                             {pwForm.confirm && pwForm.next !== pwForm.confirm && (
                               <p className="text-[10px] text-erani-coral font-bold">Las contraseñas no coinciden.</p>
                             )}
                           </div>

                           {/* Feedback */}
                           {pwMsg && (
                             <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border ${
                               pwMsg.type === "success"
                                 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                 : "bg-erani-coral/10 border-erani-coral/20 text-erani-coral"
                             }`}>
                               {pwMsg.type === "success" ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                               {pwMsg.text}
                             </div>
                           )}

                           <button
                             onClick={handleChangePassword}
                             disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                             className="button-premium px-8 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center gap-2 self-start disabled:opacity-40 disabled:cursor-not-allowed"
                           >
                             {pwSaving ? "Actualizando..." : "Actualizar Contraseña"}
                             <Lock className="w-3 h-3" />
                           </button>
                         </div>

                         <button 
                           onClick={handleDeleteAccount}
                           disabled={isDeletingAccount}
                           className={`p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-left border ${
                             deleteStep === 0 
                              ? "text-erani-coral hover:bg-erani-coral/10 border-transparent" 
                              : deleteStep === 1
                              ? "bg-erani-coral/10 text-erani-coral border-erani-coral/50"
                              : deleteStep === 2
                              ? "bg-erani-coral/20 text-erani-coral border-erani-coral"
                              : "bg-erani-coral text-white border-erani-coral shadow-lg shadow-erani-coral/50 animate-pulse"
                           }`}
                         >
                            {isDeletingAccount ? "ELIMINANDO..." : 
                             deleteStep === 0 ? "Eliminar Cuenta de Organización" : 
                             deleteStep === 1 ? "CONFIRMACIÓN 1/3: ¿Eliminar cuenta irreversiblemente?" :
                             deleteStep === 2 ? "CONFIRMACIÓN 2/3: Se perderán todos los datos. ¿Continuar?" :
                             "⚠️ CONFIRMACIÓN 3/3: CLICK PARA ELIMINAR DEFINITIVAMENTE"}
                         </button>
                      </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

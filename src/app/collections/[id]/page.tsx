"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import { useDashboard } from "@/context/DashboardContext";
import { ChatProvider } from "@/context/ChatContext";
import ChatInterface from "@/components/chat/ChatInterface";
import Image from "next/image";
import { 
  FolderOpen, 
  ArrowLeft, 
  ArrowRight,
  Plus, 
  Trash2, 
  FileText, 
  Loader2, 
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  Check,
  AlertTriangle,
  X,
  ChevronDown,
  Kanban,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface ForensicReport {
  id: number;
  project_id: string;
  project_name: string;
  impacto_directo: number;
  created_at: string;
}

export default function CollectionDataRoomPage() {
  const params = useParams();
  const collectionId = params?.id as string;
  const router = useRouter();
  
  const { isSidebarCollapsed } = useDashboard();
  const { profile } = useAuth();

  const [collection, setCollection] = useState<any>(null);
  const [reports, setReports] = useState<ForensicReport[]>([]);
  const [collectionCollaboratorProfiles, setCollectionCollaboratorProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para agregar reportes
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableReports, setAvailableReports] = useState<ForensicReport[]>([]);
  const [addingReportId, setAddingReportId] = useState<number | null>(null);

  // Modal para agregar colaboradores
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [addingCollaboratorId, setAddingCollaboratorId] = useState<string | null>(null);
  const [addedCollaborators, setAddedCollaborators] = useState<Set<string>>(new Set());
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Data Room Creation State
  const [isCreateDataRoomModalOpen, setIsCreateDataRoomModalOpen] = useState(false);
  const [newDataRoomName, setNewDataRoomName] = useState("");
  const [newDataRoomDesc, setNewDataRoomDesc] = useState("");
  const [selectedColorTag, setSelectedColorTag] = useState("erani-purple");
  const [selectedDataRoomCollaborators, setSelectedDataRoomCollaborators] = useState<string[]>([]);
  const [isCollaboratorsDropdownOpen, setIsCollaboratorsDropdownOpen] = useState(false);
  const [isCreatingDataRoom, setIsCreatingDataRoom] = useState(false);
  const [dataRooms, setDataRooms] = useState<any[]>([]);
  const [linkedSessions, setLinkedSessions] = useState<any[]>([]);

  const [workspaceTags, setWorkspaceTags] = useState<any[]>([]);
  const [isTasksSidebarOpen, setIsTasksSidebarOpen] = useState(false);

  useEffect(() => {
    if (collectionId && profile?.organization_id) {
      fetchCollectionData();
    }
  }, [collectionId, profile]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener la colección
      const { data: colData, error: colError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .eq('organization_id', profile?.organization_id)
        .single();
        
      if (colError) throw colError;
      setCollection(colData);

      // 2. Obtener reportes asociados a los proyectos vinculados
      const linkedProjects = colData.linked_projects || [];
      let repData: any[] = [];
      
      if (linkedProjects.length > 0) {
        const { data, error } = await supabase
          .from('forensic_reports')
          .select('id, project_id, project_name, created_at, payload_completo')
          .in('project_id', linkedProjects);
          
        if (!error && data) repData = data;
      }

      if (repData.length > 0) {
        // Mapear nombres reales desde localStorage y DB
        let localProjectsMap = new Map<string, string>();
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('erani_projects');
            if (stored) {
              JSON.parse(stored).forEach((p: any) => localProjectsMap.set(p.id, p.name));
            }
          } catch(e) {}
        }

        const mapped = repData.map((row: any) => {
           let finalName = localProjectsMap.get(row.project_id) || 
                           row.payload_completo?.report_metadata?.project_name || 
                           row.project_name || "Sin Nombre";
                           
           const slide2 = row.payload_completo?.slide_2_analisis_forense || {};
           const fugaInterna = slide2?.resumen_consolidacion?.fuga_interna_mxn || 0;
           const fugaExterna = slide2?.resumen_consolidacion?.fuga_externa_mxn || 0;
           
           return { ...row, project_name: finalName, impacto_directo: fugaInterna + fugaExterna };
        });

        setReports(mapped);
      } else {
        setReports([]);
      }

      // 3. Fetch collaborator profiles to show in the UI
      if (colData.collaborators && colData.collaborators.length > 0) {
         const { data: collabProfiles } = await supabase
           .from('profiles')
           .select('id, full_name, email')
           .in('id', colData.collaborators);
         if (collabProfiles) setCollectionCollaboratorProfiles(collabProfiles);
         setAddedCollaborators(new Set(colData.collaborators));
      } else {
         setCollectionCollaboratorProfiles([]);
      }

      // 3. Obtener Data Rooms asociados a esta colección
      const { data: drData, error: drError } = await supabase
        .from('data_rooms')
        .select('*')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });

      if (drError && drError.code !== '42P01') { // Ignore relation does not exist error before migration runs
        throw drError;
      }
      
      if (drData) {
        setDataRooms(drData);
      } else {
        setDataRooms([]);
      }

      // 4. Obtener Sesiones y To-Dos asociados a esta colección (Directos o por Proyectos)
      const allSessionsMap = new Map();

      // 4.1. Sesiones vinculadas por el array de linked_sessions o por collection_id
      const linkedSessionIds = colData.linked_sessions || [];
      let directSessions: any[] = [];
      
      if (linkedSessionIds.length > 0) {
        const { data: linkedData } = await supabase
          .from('sessions')
          .select('*')
          .in('id', linkedSessionIds);
        if (linkedData) directSessions = [...directSessions, ...linkedData];
      }

      const { data: legacyDirect } = await supabase
        .from('sessions')
        .select('*')
        .eq('collection_id', collectionId);
        
      if (legacyDirect) {
         directSessions = [...directSessions, ...legacyDirect];
      }

      if (directSessions.length > 0) {
        directSessions.forEach(s => allSessionsMap.set(s.id, s));
      }

      // 4.2. Obtener Sesiones de Google Calendar si están en linked_sessions
      if (linkedSessionIds.length > 0) {
         try {
            const res = await fetch('/api/calendar/events');
            if (res.ok) {
               const gEvents = await res.json();
               const linkedGEvents = gEvents.filter((e: any) => linkedSessionIds.includes(e.id));
               linkedGEvents.forEach((e: any) => {
                  allSessionsMap.set(e.id, {
                     id: e.id,
                     title: e.summary || "Sesión de Google",
                     status: 'scheduled',
                     scheduled_at: e.start?.dateTime || e.start?.date,
                     color_tag: 'erani-blue',
                     is_google_event: true,
                     item_type: 'session'
                  });
               });
            }
         } catch(err) { console.error("Error fetching google events for collection:", err); }
      }

      // 4.3. Sesiones vinculadas a los proyectos/auditorías de esta colección
      if (linkedProjects && linkedProjects.length > 0) {
        const { data: projectSessions } = await supabase
          .from('sessions')
          .select('*')
          .in('audit_id', linkedProjects);
          
        if (projectSessions) {
          projectSessions.forEach(s => allSessionsMap.set(s.id, s));
        }
      }

      const mergedSessions = Array.from(allSessionsMap.values());
      mergedSessions.sort((a, b) => new Date(b.scheduled_at || 0).getTime() - new Date(a.scheduled_at || 0).getTime());
      
      setLinkedSessions(mergedSessions);

      // 5. Fetch workspace tags
      const { data: tagsData } = await supabase
        .from('workspace_tags')
        .select('*')
        .eq('organization_id', profile?.organization_id);
      if (tagsData) setWorkspaceTags(tagsData);

    } catch (err) {
      console.error("Error fetching collection details:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = async () => {
    setIsAddModalOpen(true);
    // Fetch todos los reportes de la org que NO esten ya en la colección
    try {
      // Avoid fetching massive payload_completo for the list. Use JSON path if supported, but here we just drop it to prevent timeouts.
      const { data, error } = await supabase
        .from('forensic_reports')
        .select('id, project_id, project_name, created_at')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const currentIds = new Set(reports.map(r => r.id));
      
      let localProjectsMap = new Map<string, string>();
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('erani_projects');
          if (stored) {
            JSON.parse(stored).forEach((p: any) => localProjectsMap.set(p.id, p.name));
          }
        } catch(e) {}
      }

      const available = (data || [])
        .filter(r => !currentIds.has(r.id))
        .map((row: any) => {
           let finalName = localProjectsMap.get(row.project_id) || 
                           row.project_name || "Sin Nombre";
           return { ...row, project_name: finalName };
        });

      setAvailableReports(available);
    } catch (err) {
      console.error("Error fetching available reports:", err);
    }
  };

  const handleAddReport = async (reportId: number) => {
    try {
      setAddingReportId(reportId);
      const { error } = await supabase
        .from('collection_reports')
        .insert({
          collection_id: collectionId,
          report_id: reportId
        });
        
      if (error) throw error;
      await fetchCollectionData();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error agregando reporte:", err);
      alert("No se pudo agregar el reporte.");
    } finally {
      setAddingReportId(null);
    }
  };

  const handleRemoveReport = async (reportId: number) => {
    try {
      const { error } = await supabase
        .from('collection_reports')
        .delete()
        .eq('collection_id', collectionId)
        .eq('report_id', reportId);
        
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error("Error removiendo reporte:", err);
    }
  };

  const toggleInviteSection = async () => {
    const nextState = !isInviteModalOpen;
    setIsInviteModalOpen(nextState);
    if (nextState && orgMembers.length === 0) {
      try {
        // Fetch org members
        const { data: membersData, error: membersError } = await supabase
          .from('org_members')
          .select(`id, profile_id, email, role, profiles:profile_id (full_name, avatar_url)`)
          .eq('organization_id', profile?.organization_id);
          
        if (membersError) throw membersError;
        
        // Fetch existing collaborators to mark them as "Agregado"
        const { data: existingCollabs, error: collabsError } = await supabase
          .from('collection_collaborators')
          .select('user_id')
          .eq('collection_id', collectionId);

        if (!collabsError && existingCollabs) {
          const existingIds = existingCollabs.map((c: any) => c.user_id);
          setAddedCollaborators(prev => new Set([...prev, ...existingIds]));
        }

        // Map data to expected format and optionally filter out current user
        const members = (membersData || [])
          .filter((u: any) => u.profile_id !== profile?.id)
          .map((u: any) => {
            const p = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
            return {
              id: u.profile_id,
              full_name: p?.full_name || null,
              email: u.email,
              role: u.role
            };
          });
          
        setOrgMembers(members);
      } catch (err) {
        console.error("Error fetching org members:", err);
      }
    }
  };

  const handleAddCollaborator = async (userId: string) => {
    try {
      setAddingCollaboratorId(userId);
      setInviteFeedback(null);
      const { error } = await supabase
        .from('collection_collaborators')
        .insert({
          collection_id: collectionId,
          user_id: userId
        });
        
      // If error is 23505 it means it's already in the DB, so we treat it as success
      if (error && error.code !== '23505') throw error;
      
      setAddedCollaborators(prev => new Set(prev).add(userId));
      setInviteFeedback({ type: 'success', message: 'Colaborador agregado a la colección.' });
      
      // Auto-hide success message after 3s
      setTimeout(() => setInviteFeedback(null), 3000);
      
    } catch (err: any) {
      console.error("Error agregando colaborador completo:", JSON.stringify(err, null, 2));
      setInviteFeedback({ type: 'error', message: `No se pudo agregar: ${err.message || "Es posible que ya tenga acceso."}` });
    } finally {
      setAddingCollaboratorId(null);
    }
  };

  const handleCreateDataRoom = async () => {
    if (!newDataRoomName.trim()) {
      alert("Por favor ingresa un nombre para el Data Room.");
      return;
    }
    try {
      setIsCreatingDataRoom(true);
      const { data: profileData } = await supabase.from('profiles').select('organization_id').eq('id', profile?.id).single();
      const orgId = profileData?.organization_id;

      const { data: newRoom, error: createError } = await supabase
        .from('data_rooms')
        .insert({
          collection_id: collectionId,
          organization_id: orgId,
          name: newDataRoomName.trim(),
          description: newDataRoomDesc.trim(),
          color_tag: selectedColorTag,
          created_by: profile?.id
        })
        .select()
        .single();
        
      if (createError) throw createError;

      // Add collaborators
      const collabsToInsert = selectedDataRoomCollaborators.map(userId => ({
        data_room_id: newRoom.id,
        user_id: userId,
        added_by: profile?.id
      }));

      if (collabsToInsert.length > 0) {
        const { error: collabsError } = await supabase
          .from('data_room_collaborators')
          .insert(collabsToInsert);
        if (collabsError) throw collabsError;

        // Send email invitations by fetching emails directly from DB
        const { data: memberProfiles } = await supabase
          .from('profiles')
          .select('email')
          .in('id', selectedDataRoomCollaborators);

        const memberEmails = (memberProfiles || [])
          .map(p => p.email)
          .filter(Boolean);

        if (memberEmails.length > 0) {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://platform.erani.mx';
          fetch('/api/send-dataroom-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: memberEmails,
              dataRoomName: newDataRoomName.trim(),
              dataRoomDesc: newDataRoomDesc.trim(),
              collectionName: collection?.name,
              inviterName: profile?.full_name || 'El Administrador',
              inviterRole: profile?.role || 'Administrador',
              inviterAvatarUrl: profile?.avatar_url || 'https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/default-avatar.png',
              organizationName: 'Tu Organización',
              dataRoomUrl: `${baseUrl}/collections/${collectionId}/dataroom/${newRoom.id}`
            })
          }).catch(console.error);
        }
      }

      await fetchCollectionData(); // Refresh list
      setIsCreateDataRoomModalOpen(false);
      setNewDataRoomName("");
      setNewDataRoomDesc("");
      setSelectedDataRoomCollaborators([]);
      router.push(`/collections/${collectionId}/dataroom/${newRoom.id}`);

    } catch (err) {
      console.error("Error creating data room:", err);
      alert("Hubo un error al crear el Data Room. Es posible que no se hayan ejecutado las migraciones en Supabase.");
    } finally {
      setIsCreatingDataRoom(false);
    }
  };

  const totalImpact = reports.reduce((acc, curr) => acc + (curr.impacto_directo || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />

      <main className={`flex-1 transition-all duration-500 overflow-y-auto ${isSidebarCollapsed ? "ml-20" : "ml-64"} flex relative`}>
        {/* Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-erani-blue/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        
        {loading ? (
           <div className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden h-screen">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-erani-purple/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="flex flex-col items-center gap-6 relative z-10">
           <Image src="/isologo.png" alt="Cargando..." width={64} height={64} className="object-contain animate-pulse logo-adaptive drop-shadow-[0_0_15px_rgba(116,4,255,0.5)]" />
           <p className="text-sm uppercase tracking-widest font-black text-gray-400">Abriendo Colección...</p>
        </div>
      </div>
        ) : !collection ? (
           <div className="flex-1 flex items-center justify-center">
             <p className="text-gray-500 font-bold uppercase tracking-widest">Colección no encontrada</p>
           </div>
        ) : (
          <>
            {/* LEFT SIDE: Data Room Management */}
            <div className="flex-1 p-4 md:p-8 pl-8 md:pl-16 flex flex-col gap-8 h-screen overflow-y-auto">
               
               {/* Nav & Header */}
               <div className="flex flex-col gap-6">
                 <button 
                   onClick={() => router.push('/collections')}
                   className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-erani-purple transition-colors w-max"
                 >
                   <ArrowLeft className="w-4 h-4" /> Volver a Colecciones
                 </button>
                 
                 <div className="flex items-start justify-between">
                   <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-erani-purple bg-erani-purple/10 border border-erani-purple/20 px-3 py-1 rounded-full w-max">
                           Colección
                        </span>
                        {collection?.color_tag && collection.color_tag.split(',').map((tagId: string) => {
                           const tag = workspaceTags.find(t => t.id === tagId);
                           if (!tag) return null;
                           const tColor = tag.color || 'erani-blue';
                           // Map tailwind colors
                           const bgCol = tColor === 'emerald' ? 'bg-emerald-500' : tColor === 'amber' ? 'bg-amber-500' : tColor === 'gray' ? 'bg-gray-500' : `bg-${tColor}`;
                           const textCol = tColor === 'emerald' ? 'text-emerald-500' : tColor === 'amber' ? 'text-amber-500' : tColor === 'gray' ? 'text-gray-500' : `text-${tColor}`;
                           const borderCol = tColor === 'emerald' ? 'border-emerald-500' : tColor === 'amber' ? 'border-amber-500' : tColor === 'gray' ? 'border-gray-500' : `border-${tColor}`;
                           
                           return (
                              <span key={tagId} className={`text-[10px] font-black uppercase tracking-widest ${bgCol}/10 ${borderCol}/30 border ${textCol} px-3 py-1 rounded-full`}>
                                 {tag.name}
                              </span>
                           );
                        })}
                     </div>
                     <h1 className="text-3xl font-black uppercase tracking-tight text-foreground pr-4 break-words">{collection.name}</h1>
                     {collection.description && (
                       <p className="text-sm text-gray-400 mt-2">{collection.description}</p>
                     )}
                   </div>
                   
                   {/* Create Data Room Button */}
                   <button 
                     onClick={() => setIsCreateDataRoomModalOpen(true)}
                     className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-gradient-to-r from-[#1E50BA] to-[#7404FF] text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                   >
                     <Plus className="w-4 h-4" />
                     Crear Data Room
                   </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="glassmorphism p-5 rounded-2xl border border-glass-border">
                       <p className="text-[9px] uppercase font-black tracking-widest text-gray-500">Proyectos Vinculados</p>
                       <p className="text-2xl font-black text-foreground mt-1">{reports.length}</p>
                    </div>
                     <div className="glassmorphism p-5 rounded-2xl border border-glass-border">
                       <p className="text-[9px] uppercase font-black tracking-widest text-gray-500">Fuga Total Consolidada</p>
                       <p className="text-2xl font-black text-erani-coral mt-1">${totalImpact.toLocaleString()} <span className="text-xs">MXN</span></p>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                   {/* Render collection collaborators */}
                   {collectionCollaboratorProfiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                         {collectionCollaboratorProfiles.map(member => (
                            <div key={member.id} className="px-3 py-1.5 rounded-xl border border-glass-border bg-background/50 flex items-center gap-2 shadow-sm text-[10px] uppercase font-bold tracking-widest text-foreground">
                               <div className="w-4 h-4 rounded-full bg-erani-purple/20 flex items-center justify-center">
                                  <span className="text-erani-purple text-[8px]">{member.full_name ? member.full_name[0] : member.email[0]}</span>
                               </div>
                               {member.full_name || member.email}
                            </div>
                         ))}
                      </div>
                   )}

                   <button 
                     onClick={toggleInviteSection}
                     className="w-full py-4 rounded-2xl bg-erani-blue/10 border border-erani-blue/20 text-erani-blue hover:bg-erani-blue/20 transition-all flex items-center justify-center gap-3 text-[10px] uppercase font-black tracking-widest"
                   >
                     <Plus className={`w-4 h-4 transition-transform ${isInviteModalOpen ? 'rotate-45' : ''}`} /> 
                     {isInviteModalOpen ? 'Cerrar' : 'Invitar Colaboradores'}
                   </button>

                   <AnimatePresence>
                     {isInviteModalOpen && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                       >
                         <div className="p-4 mt-2 bg-background/50 backdrop-blur-md border border-glass-border rounded-2xl flex flex-col gap-3">
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-nav-text mb-1">Miembros de la Organización</h3>
                           
                           {inviteFeedback && (
                             <motion.div 
                               initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                               className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${inviteFeedback.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
                             >
                               {inviteFeedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                               {inviteFeedback.message}
                             </motion.div>
                           )}

                           {orgMembers.length === 0 ? (
                              <p className="text-center text-xs text-gray-500 py-4">No hay otros miembros visibles (Revisa tus políticas RLS en Supabase).</p>
                           ) : (
                             orgMembers.map(member => {
                               const isAdded = addedCollaborators.has(member.id);
                               return (
                               <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                  <div className="flex flex-col min-w-0 flex-1 pr-4">
                                    <p className="text-xs font-bold text-foreground truncate">{member.full_name || "Usuario Desconocido"}</p>
                                    <p className="text-[9px] text-gray-500 truncate">{member.email}</p>
                                  </div>
                                  <button
                                    onClick={() => handleAddCollaborator(member.id)}
                                    disabled={addingCollaboratorId === member.id || isAdded}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-widest transition-all flex items-center gap-2 ${isAdded ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-erani-blue/10 text-erani-blue border border-erani-blue/30 hover:bg-erani-blue hover:text-white disabled:opacity-50'}`}
                                  >
                                    {addingCollaboratorId === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : isAdded ? <><Check className="w-3 h-3" /> Agregado</> : "Agregar"}
                                  </button>
                               </div>
                               );
                             })
                           )}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               </div>

               {/* Data Rooms List */}
               <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-sm uppercase font-black tracking-widest text-foreground flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-erani-purple" />
                       Data Rooms Analíticos
                     </h2>
                     <button 
                       onClick={() => setIsCreateDataRoomModalOpen(true)}
                       className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-erani-purple hover:text-erani-blue transition-colors"
                     >
                       <Plus className="w-3 h-3" /> Crear
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {dataRooms.length === 0 ? (
                       <div className="col-span-1 md:col-span-2 p-8 border border-dashed border-erani-purple/20 bg-erani-purple/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                         <TrendingUp className="w-8 h-8 text-erani-purple/50" />
                         <p className="text-xs text-gray-400">No hay Data Rooms creados para esta colección.</p>
                       </div>
                     ) : (
                       dataRooms.map(dr => (
                         <div 
                           key={dr.id} 
                           onClick={() => router.push(`/collections/${collectionId}/dataroom/${dr.id}`)}
                           className="flex flex-col p-4 bg-background/50 backdrop-blur-sm border border-glass-border rounded-2xl hover:border-erani-purple/50 hover:shadow-[0_0_20px_rgba(116,4,255,0.15)] transition-all cursor-pointer group"
                         >
                            <div className="flex items-start justify-between mb-2">
                               <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-lg bg-${dr.color_tag || 'erani-purple'}/10 flex items-center justify-center text-${dr.color_tag || 'erani-purple'}`}>
                                    <TrendingUp className="w-4 h-4" />
                                 </div>
                                 <h3 className="text-sm font-black text-foreground uppercase tracking-wider group-hover:text-erani-purple transition-colors">{dr.name}</h3>
                               </div>
                               <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-erani-purple transition-all -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
                            </div>
                            {dr.description && <p className="text-[10px] text-gray-500 line-clamp-1 mb-3">{dr.description}</p>}
                            <div className="flex items-center gap-2 mt-auto text-[9px] uppercase font-bold text-gray-500 tracking-widest border-t border-glass-border pt-3">
                               <Calendar className="w-3 h-3" />
                               {new Date(dr.created_at).toLocaleDateString()}
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>

               {/* Sessions and To-Dos List */}
               <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-sm uppercase font-black tracking-widest text-foreground flex items-center gap-2">
                       <Kanban className="w-4 h-4 text-emerald-500" />
                       Sesiones y Tareas Asignadas
                     </h2>
                     <button 
                       onClick={() => setIsTasksSidebarOpen(true)}
                       className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
                     >
                       <ArrowRight className="w-3 h-3" /> Ver Tablero Completo
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {linkedSessions.length === 0 ? (
                       <div className="col-span-1 md:col-span-2 p-8 border border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                         <Kanban className="w-8 h-8 text-emerald-500/50" />
                         <p className="text-xs text-gray-400">No hay tareas o sesiones programadas para esta colección.</p>
                       </div>
                     ) : (
                       linkedSessions.map(session => (
                         <div 
                           key={session.id} 
                           onClick={() => {
                              if (session.is_google_event) {
                                 router.push(`/sessions?googleEventId=${session.id}`);
                              } else {
                                 router.push(`/sessions?taskId=${session.id}`);
                              }
                           }}
                           className="flex flex-col p-4 bg-background/50 backdrop-blur-sm border border-glass-border rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all cursor-pointer group"
                         >
                            <div className="flex items-start justify-between mb-2">
                               <div className="flex items-center gap-3 w-full">
                                 <div className={`w-8 h-8 shrink-0 rounded-lg bg-${session.color_tag || 'emerald'}-500/10 flex items-center justify-center text-${session.color_tag || 'emerald'}-500`}>
                                    {session.status === 'completed' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                 </div>
                                 <h3 className="text-sm font-black text-foreground uppercase tracking-wider group-hover:text-emerald-500 transition-colors truncate">{session.title}</h3>
                                 <span className={`ml-auto shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border text-${session.status === 'completed' ? 'green-500' : session.status === 'scheduled' ? 'erani-blue' : 'gray-400'} border-${session.status === 'completed' ? 'green-500/30' : session.status === 'scheduled' ? 'erani-blue/30' : 'gray-500/30'} bg-${session.status === 'completed' ? 'green-500/10' : session.status === 'scheduled' ? 'erani-blue/10' : 'gray-500/10'}`}>
                                     {session.status === 'completed' ? 'Finalizada' : session.status === 'scheduled' ? 'Agendada' : 'To-Do'}
                                 </span>
                               </div>
                            </div>
                            {session.notes && <p className="text-[10px] text-gray-500 line-clamp-1 mb-3 mt-1">{session.notes}</p>}
                            <div className="flex items-center gap-2 mt-auto text-[9px] uppercase font-bold text-gray-500 tracking-widest border-t border-glass-border pt-3">
                               <Calendar className="w-3 h-3" />
                               {session.deadline ? new Date(session.deadline).toLocaleDateString() : new Date(session.scheduled_at).toLocaleDateString()}
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>

               {/* Reports List */}
               <div className="flex flex-col gap-4 flex-1">
                  <div className="flex items-center justify-between">
                     <h2 className="text-sm uppercase font-black tracking-widest text-foreground flex items-center gap-2">
                       <Layers className="w-4 h-4 text-erani-blue" />
                       Auditorías en Colección
                     </h2>
                     <button 
                       onClick={openAddModal}
                       className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-erani-blue hover:text-erani-purple transition-colors"
                     >
                       <Plus className="w-3 h-3" /> Agregar
                     </button>
                  </div>

                  <div className="flex flex-col gap-3">
                     {reports.length === 0 ? (
                       <div className="p-10 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                         <FolderOpen className="w-8 h-8 text-gray-600" />
                         <p className="text-xs text-gray-500">No hay reportes en esta Colección.</p>
                       </div>
                     ) : (
                       reports.map(rep => (
                         <div key={rep.id} className="flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm border border-glass-border rounded-2xl hover:border-erani-blue/30 hover:shadow-sm transition-all group">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-erani-blue/10 flex items-center justify-center text-erani-blue">
                               <FileText className="w-5 h-5" />
                             </div>
                             <div className="flex flex-col">
                               <p className="text-sm font-bold text-foreground uppercase tracking-wider">{rep.project_name}</p>
                               <p className="text-[10px] text-gray-500 uppercase tracking-widest">${(rep.impacto_directo || 0).toLocaleString()} MXN Fuga</p>
                             </div>
                           </div>
                           <button 
                             onClick={() => handleRemoveReport(rep.id)}
                             className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          </>
        )}
      </main>

      {/* Modal para Agregar Reportes */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] flex flex-col bg-background border border-glass-border rounded-3xl p-8 z-50 shadow-2xl"
            >
               <div className="flex items-center justify-between mb-6 shrink-0">
                 <h2 className="text-xl font-black uppercase tracking-wider text-foreground">Agregar Auditorías</h2>
                 <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-foreground">✕</button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                 {availableReports.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-10">No tienes más auditorías disponibles para agregar.</p>
                 ) : (
                   availableReports.map(rep => (
                     <div key={rep.id} className="flex items-center justify-between p-4 bg-background/50 border border-glass-border rounded-xl hover:border-erani-blue/50 hover:shadow-[0_0_15px_rgba(0,85,160,0.15)] transition-all">
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-foreground uppercase tracking-wider">{rep.project_name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(rep.created_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleAddReport(rep.id)}
                          disabled={addingReportId === rep.id}
                          className="px-4 py-2 bg-erani-blue/10 text-erani-blue border border-erani-blue/30 rounded-lg text-[10px] uppercase font-black tracking-widest hover:bg-erani-blue hover:text-white hover:shadow-[0_0_15px_rgba(0,85,160,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {addingReportId === rep.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Agregar
                        </button>
                     </div>
                   ))
                 )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Data Room Slide-over */}
      <AnimatePresence>
        {isCreateDataRoomModalOpen && (
          <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none w-full justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateDataRoomModalOpen(false)}
              className="fixed inset-0 bg-transparent pointer-events-auto"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-background border-l border-glass-border shadow-2xl flex flex-col p-8 overflow-y-auto pointer-events-auto h-full"
            >
               <button onClick={() => setIsCreateDataRoomModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-foreground transition-colors bg-foreground/5 rounded-full z-10">
                  <X className="w-5 h-5" />
               </button>

              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl bg-${selectedColorTag}/10 text-${selectedColorTag}`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-foreground">Nuevo Data Room</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Espacio Analítico Especializado</p>
                </div>
              </div>

              <div className="flex flex-col gap-6 flex-1">
                {/* Nombre */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nombre del Data Room</label>
                  <input 
                    type="text" 
                    value={newDataRoomName}
                    onChange={e => setNewDataRoomName(e.target.value)}
                    placeholder="Ej. Análisis Forense Q3 2024"
                    className="w-full bg-foreground/5 border border-glass-border rounded-xl p-4 text-sm focus:outline-none focus:border-erani-blue/50 transition-colors placeholder:text-gray-600 text-foreground font-bold"
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Objetivo Estratégico</label>
                  <textarea 
                    value={newDataRoomDesc}
                    onChange={e => setNewDataRoomDesc(e.target.value)}
                    placeholder="Describe el objetivo de los análisis cruzados para este cuarto..."
                    className="w-full h-32 bg-foreground/5 border border-glass-border rounded-xl p-4 text-sm focus:outline-none focus:border-erani-blue/50 transition-colors placeholder:text-gray-600 text-foreground resize-none"
                  />
                </div>

                {/* Colaboradores */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                    <span>Colaboradores Invitados</span>
                    <button onClick={toggleInviteSection} className="text-erani-blue hover:text-erani-purple transition-colors">
                       Cargar Miembros
                    </button>
                  </label>
                  
                  <div className="relative z-30 w-full" onMouseLeave={() => setIsCollaboratorsDropdownOpen(false)}>
                     <button 
                        type="button"
                        onClick={() => setIsCollaboratorsDropdownOpen(!isCollaboratorsDropdownOpen)}
                        className="w-full bg-foreground/5 border border-glass-border rounded-xl py-3 px-4 text-sm focus:border-erani-blue focus:outline-none transition-all text-foreground text-left flex items-center justify-between"
                     >
                        <span className={selectedDataRoomCollaborators.length ? "text-foreground font-bold text-[10px] uppercase" : "text-gray-500 font-bold text-[10px] uppercase"}>
                           {selectedDataRoomCollaborators.length ? `${selectedDataRoomCollaborators.length} colaboradores seleccionados` : "Seleccionar colaboradores..."}
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
                                 {orgMembers.map(member => {
                                    const isSelected = selectedDataRoomCollaborators.includes(member.id);
                                    return (
                                       <div 
                                          key={member.id} 
                                          onClick={() => {
                                             if (isSelected) {
                                                setSelectedDataRoomCollaborators(prev => prev.filter(id => id !== member.id));
                                             } else {
                                                setSelectedDataRoomCollaborators(prev => [...prev, member.id]);
                                             }
                                          }}
                                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-foreground/5' : 'hover:bg-foreground/5'}`}
                                       >
                                          <div className="flex items-center gap-2">
                                             <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${isSelected ? 'border-erani-purple' : 'border-gray-500'}`}>
                                                {isSelected && <Check className="w-2 h-2 text-erani-purple" />}
                                             </div>
                                             <span className="text-[10px] font-bold truncate max-w-[200px]">{member.full_name || member.email}</span>
                                          </div>
                                       </div>
                                    );
                                 })}
                                 {orgMembers.length === 0 && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-2 text-center block">Haz clic en "Cargar Miembros" arriba para importar usuarios.</span>}
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>

                  {/* Render selected collaborators as badges */}
                  {selectedDataRoomCollaborators.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-2">
                        {selectedDataRoomCollaborators.map(id => {
                           const member = orgMembers.find(m => m.id === id);
                           if (!member) return null;
                           return (
                              <div key={id} className="px-2 py-1 rounded-md border text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 bg-erani-purple/20 border-erani-purple/50 text-erani-purple">
                                 <Check className="w-3 h-3" />
                                 {member.full_name || member.email}
                              </div>
                           );
                        })}
                     </div>
                  )}

                  <p className="text-[10px] text-gray-500 font-bold mt-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                    Solo los colaboradores seleccionados tendrán acceso a este Data Room (RLS).
                  </p>
                </div>

                {/* Acciones (Inside Scroll) */}
                <div className="pt-6 mt-4 flex gap-4">
                  <button 
                    onClick={() => setIsCreateDataRoomModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-glass-border text-[11px] uppercase font-black tracking-widest text-gray-400 hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateDataRoom}
                    disabled={isCreatingDataRoom || !newDataRoomName.trim()}
                    className="flex-1 px-4 py-3 rounded-xl text-[11px] uppercase font-black tracking-widest transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#1E50BA] to-[#7404FF] text-white shadow-xl hover:shadow-2xl hover:shadow-erani-purple/20 disabled:opacity-50 disabled:hover:shadow-xl"
                  >
                    {isCreatingDataRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    {isCreatingDataRoom ? "Creando..." : "Crear e Ingresar"}
                  </button>
                </div>

              </div>


            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tasks Sidebar */}
      <AnimatePresence>
        {isTasksSidebarOpen && (
          <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none w-full justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTasksSidebarOpen(false)}
              className="fixed inset-0 bg-transparent pointer-events-auto"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-background border-l border-glass-border shadow-2xl flex flex-col p-8 overflow-y-auto pointer-events-auto h-full"
            >
               <button onClick={() => setIsTasksSidebarOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-foreground transition-colors bg-foreground/5 rounded-full z-10">
                  <X className="w-5 h-5" />
               </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Kanban className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-foreground">Sesiones y Tareas</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">{linkedSessions.length} Actividades Asignadas</p>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                 {/* TO-DOS / TASKS SECTION */}
                 <div className="flex flex-col gap-4">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-emerald-500 border-b border-glass-border pb-2 flex items-center gap-2">
                       <Check className="w-3 h-3" /> To-Dos y Tareas
                    </h3>
                    {linkedSessions.filter(s => s.item_type !== 'session' && !s.is_google_event).length === 0 ? (
                       <p className="text-xs text-gray-500 font-medium">No hay tareas programadas.</p>
                    ) : (
                       linkedSessions.filter(s => s.item_type !== 'session' && !s.is_google_event).map(session => {
                          const cColor = session.color_tag || 'emerald';
                          const textCol = cColor === 'emerald' ? 'text-emerald-500' : cColor === 'amber' ? 'text-amber-500' : cColor === 'gray' ? 'text-gray-500' : `text-${cColor}`;
                          const bgCol = cColor === 'emerald' ? 'bg-emerald-500' : cColor === 'amber' ? 'bg-amber-500' : cColor === 'gray' ? 'bg-gray-500' : `bg-${cColor}`;
                          
                          return (
                          <div 
                            key={session.id} 
                            onClick={() => {
                               if (session.is_google_event) {
                                  router.push(`/sessions?googleEventId=${session.id}`);
                               } else {
                                  router.push(`/sessions?taskId=${session.id}`);
                               }
                            }}
                            className="flex flex-col p-4 bg-background/50 backdrop-blur-sm border border-glass-border rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
                          >
                             <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3 w-full">
                                  <div className={`w-8 h-8 shrink-0 rounded-lg ${bgCol}/10 flex items-center justify-center ${textCol}`}>
                                     {session.status === 'completed' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                  </div>
                                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider group-hover:text-emerald-500 transition-colors truncate">{session.title}</h3>
                                  <span className={`ml-auto shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border text-${session.status === 'completed' ? 'green-500' : session.status === 'scheduled' ? 'erani-blue' : 'gray-400'} border-${session.status === 'completed' ? 'green-500/30' : session.status === 'scheduled' ? 'erani-blue/30' : 'gray-500/30'} bg-${session.status === 'completed' ? 'green-500/10' : session.status === 'scheduled' ? 'erani-blue/10' : 'gray-500/10'}`}>
                                      {session.status === 'completed' ? 'Finalizada' : session.status === 'scheduled' ? 'Agendada' : 'To-Do'}
                                  </span>
                                </div>
                             </div>
                             {session.notes && <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 mt-1 font-medium">{session.notes}</p>}
                             <div className="flex items-center gap-2 mt-auto text-[9px] uppercase font-bold text-gray-500 tracking-widest border-t border-glass-border pt-3">
                                <Calendar className="w-3 h-3" />
                                {session.deadline ? new Date(session.deadline).toLocaleDateString() : 'Sin Fecha'}
                             </div>
                          </div>
                       )})
                    )}
                 </div>

                 {/* SESSIONS SECTION */}
                 <div className="flex flex-col gap-4">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-erani-blue border-b border-glass-border pb-2 flex items-center gap-2">
                       <Clock className="w-3 h-3" /> Sesiones Estratégicas
                    </h3>
                    {linkedSessions.filter(s => s.item_type === 'session' || s.is_google_event).length === 0 ? (
                       <p className="text-xs text-gray-500 font-medium">No hay sesiones agendadas.</p>
                    ) : (
                       linkedSessions.filter(s => s.item_type === 'session' || s.is_google_event).map(session => {
                          const cColor = session.color_tag || 'erani-blue';
                          const textCol = cColor === 'emerald' ? 'text-emerald-500' : cColor === 'amber' ? 'text-amber-500' : cColor === 'gray' ? 'text-gray-500' : `text-${cColor}`;
                          const bgCol = cColor === 'emerald' ? 'bg-emerald-500' : cColor === 'amber' ? 'bg-amber-500' : cColor === 'gray' ? 'bg-gray-500' : `bg-${cColor}`;
                          
                          return (
                          <div 
                            key={session.id} 
                            onClick={() => {
                               if (session.is_google_event) {
                                  router.push(`/sessions?googleEventId=${session.id}`);
                               } else {
                                  router.push(`/sessions?taskId=${session.id}`);
                               }
                            }}
                            className="flex flex-col p-4 bg-background/50 backdrop-blur-sm border border-glass-border rounded-2xl hover:border-erani-blue/50 transition-all cursor-pointer group shadow-sm"
                          >
                             <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3 w-full">
                                  <div className={`w-8 h-8 shrink-0 rounded-lg ${bgCol}/10 flex items-center justify-center ${textCol}`}>
                                     {session.status === 'completed' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                  </div>
                                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider group-hover:text-erani-blue transition-colors truncate">{session.title}</h3>
                                  <span className={`ml-auto shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border text-${session.status === 'completed' ? 'green-500' : session.status === 'scheduled' ? 'erani-blue' : 'gray-400'} border-${session.status === 'completed' ? 'green-500/30' : session.status === 'scheduled' ? 'erani-blue/30' : 'gray-500/30'} bg-${session.status === 'completed' ? 'green-500/10' : session.status === 'scheduled' ? 'erani-blue/10' : 'gray-500/10'}`}>
                                      {session.status === 'completed' ? 'Finalizada' : session.status === 'scheduled' ? 'Agendada' : 'To-Do'}
                                  </span>
                                </div>
                             </div>
                             {session.notes && <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 mt-1 font-medium">{session.notes}</p>}
                             <div className="flex items-center justify-between mt-auto border-t border-glass-border pt-3">
                                <div className="flex items-center gap-2 text-[9px] uppercase font-bold text-gray-500 tracking-widest">
                                   <Calendar className="w-3 h-3" />
                                   {session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString() : 'Sin Fecha'}
                                </div>
                                {session.google_meet_link && (
                                   <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-erani-blue tracking-widest bg-erani-blue/10 px-2 py-1 rounded border border-erani-blue/20">
                                      Meet Activo
                                   </div>
                                )}
                             </div>
                          </div>
                       )})
                    )}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

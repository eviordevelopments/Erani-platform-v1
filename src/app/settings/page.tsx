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
  Mail,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useDashboard } from "@/context/DashboardContext";
import { useRouter } from "next/navigation";
import { auditLogger } from "@/lib/auditLogger";
import RealtimeLogTerminal from "@/components/RealtimeLogTerminal";

type SettingsTab = "organization" | "team" | "features" | "referrals" | "logs" | "account";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { isSidebarCollapsed } = useDashboard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    logoUrl: ""
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
  const [erisBalance, setErisBalance] = useState(1000);

  // Logs
  const [logs, setLogs] = useState<any[]>([]);

  // User Profile in Organization
  const [userProfileData, setUserProfileData] = useState({
    fullName: "",
    role: ""
  });
  const [selectedTransferMember, setSelectedTransferMember] = useState("");

  // Password change form
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          await supabase.from('organizations').update({ logo_url: publicUrl }).eq('id', profile.organization_id);
      }
      if (user?.id) {
          await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
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

  const fetchInitialData = async () => {
    // Get a fresh session directly from Supabase (not from stale context)
    const { data: { session } } = await supabase.auth.getSession();
    const freshUser = session?.user ?? user;

    // Fetch the profile fresh from DB using the session user id
    let freshProfile = profile;
    if (freshUser?.id) {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', freshUser.id)
        .single();
      if (dbProfile) freshProfile = dbProfile;
    }

    console.log('[Settings] fetchInitialData — profile.organization_id:', freshProfile?.organization_id);

    // Set initial form state from profile
    setAccountData({
      fullName: freshProfile?.full_name || "",
      email: freshUser?.email || ""
    });

    setUserProfileData({
      fullName: freshProfile?.full_name || "",
      role: freshProfile?.role || ""
    });

    const orgId = freshProfile?.organization_id;
    if (!orgId) {
      console.warn('[Settings] No organization_id on profile — cannot fetch org data from DB');
      return;
    }
    
    // Fetch Org from DB
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    
    console.log('[Settings] org from DB:', org, 'error:', orgErr?.message);
    
    if (org) {
      setOrgData({
        name: org.name || "",
        bio: org.bio || "",
        sector: org.sector || "",
        teamSize: org.team_size || "1-10",
        annualRevenue: org.annual_revenue || 0,
        goals: org.goals || [],
        recoveryEmail: org.recovery_email || "",
        logoUrl: org.logo_url || freshProfile?.avatar_url || ""
      });
      setErisBalance(org.eris_balance || 1000);

      // Read feature flags directly from organizations table
      setFeatures({
        firewall_enabled: org.firewall_enabled ?? true,
        email_alerts: org.email_alerts ?? true,
        slack_alerts: org.slack_alerts ?? false,
        auto_audit: org.auto_audit ?? false,
        streaming_logs_enabled: org.streaming_logs_enabled ?? true,
      });
    }

    // Fetch Team from org_members
    const { data: team } = await supabase
      .from('org_members')
      .select('*')
      .eq('organization_id', orgId);
    if (team) setTeamMembers(team);

    // Fetch Logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(15);
    if (auditLogs) setLogs(auditLogs);
  };

  const handleSaveOrg = async () => {
    setIsSaving(true);

    // Write to organizations table (source of truth)
    if (profile?.organization_id) {
      const { error: dbError } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
          bio: orgData.bio,
          sector: orgData.sector,
          team_size: orgData.teamSize,
          annual_revenue: orgData.annualRevenue || 0,
          goals: orgData.goals,
          recovery_email: orgData.recoveryEmail,
        })
        .eq('id', profile.organization_id);

      if (dbError) {
        console.error('[Settings] DB error saving org:', dbError.code, dbError.message);
        setMessage({ type: "error", text: `Error al guardar: ${dbError.message}` });
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

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        full_name: userProfileData.fullName,
        role: userProfileData.role,
      })
      .eq('id', user.id);

    if (profileErr) {
      console.error('[Settings] DB error saving profile:', profileErr.message);
      setMessage({ type: 'error', text: `Error al guardar perfil: ${profileErr.message}` });
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
    const newVal = !features[key];
    setFeatures(prev => ({ ...prev, [key]: newVal }));
    
    if (profile?.organization_id) {
      await supabase
        .from('organizations')
        .update({ [key]: newVal })
        .eq('id', profile.organization_id);
    }

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
    fetchInitialData();
    setMessage({ type: "success", text: "Invitación enviada" });
  };

  const handleGenerateReferral = () => {
    if (!referralEmail) return;
    const code = Math.random().toString(36).substring(7).toUpperCase();
    const link = `https://erani.ai/register?ref=${code}`;
    setReferralLink(link);
    setMessage({ type: "success", text: "Link de referido generado" });
  };

  const TABS: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "organization", label: "Organización", icon: Building2 },
    { id: "team", label: "Colaboradores", icon: Users },
    { id: "features", label: "Funcionalidades", icon: ToggleIcon },
    { id: "referrals", label: "ERIS & Referidos", icon: Zap },
    { id: "logs", label: "Historial & Logs", icon: History },
    { id: "account", label: "Cuenta & Seguridad", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-12 relative overflow-hidden`}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-erani-blue/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-erani-purple/5 blur-[100px] rounded-full -z-10" />

        <div className="max-w-6xl flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-4">
              Configuración Global
              {isSaving && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-erani-blue border-t-transparent rounded-full" />}
            </h1>
            <p className="text-xs uppercase font-bold tracking-widest text-gray-500">Gestiona tu ecosistema forense, equipo y parámetros de IA.</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 self-start overflow-x-auto no-scrollbar max-w-full">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                  ? "bg-gradient-to-r from-erani-blue to-erani-purple text-white shadow-xl shadow-erani-blue/20" 
                  : "text-gray-400 hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onAnimationComplete={() => setTimeout(() => setMessage(null), 3000)}
                className={`p-4 rounded-xl border flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                  message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-erani-coral/10 border-erani-coral/20 text-erani-coral"
                }`}
              >
                {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bento Content Area */}
          <div className="glassmorphism p-10 rounded-[2.5rem] min-h-[600px] border border-white/5 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* 1. ORGANIZATION PANEL */}
                {activeTab === "organization" && (
                  <div className="flex flex-col gap-10">
                    <div className="grid grid-cols-12 gap-10">
                      {/* Logo Section */}
                      <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Logo de la Entidad</label>
                        <label className="aspect-square border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white/5 relative group cursor-pointer hover:border-erani-blue transition-all overflow-hidden">
                          {orgData.logoUrl ? (
                            <img src={orgData.logoUrl} alt="Org Logo" className="w-full h-full object-contain p-6" />
                          ) : (
                            <Plus className="w-8 h-8 text-gray-700" />
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
                        onClick={handleSaveOrg}
                        className="button-premium px-10 py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center gap-3"
                      >
                        Actualizar Identidad Corporativa
                      </button>

                      <button 
                        onClick={() => router.push('/dashboard')}
                        className="px-10 py-5 rounded-2xl border border-glass-border text-[10px] uppercase font-black tracking-widest text-nav-text hover:text-foreground hover:border-foreground/30 transition-all flex items-center gap-3"
                      >
                        Finalizar y Continuar <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-full h-px bg-white/5 my-6" />

                    {/* User Profile / Admin Settings Section */}
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Mi Perfil en la Empresa</h3>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Actualiza tu nombre y rol o transfiere el rol de administrador.</p>
                      </div>

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
                          onClick={handleSaveUserProfile}
                          className="button-premium px-10 py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center gap-3"
                        >
                          Actualizar Mi Perfil
                        </button>
                      </div>

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
                  </div>
                )}

                {/* 2. TEAM MANAGEMENT */}
                {activeTab === "team" && (
                  <div className="flex flex-col gap-10">
                    <div className="flex justify-between items-end">
                       <div className="flex flex-col gap-2">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Gestión de Colaboradores</h3>
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Invita a tu equipo para centralizar la auditoría.</p>
                       </div>
                       <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <input 
                              type="email" 
                              placeholder="Email del colaborador..."
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="input-premium"
                            />
                            <select
                              value={inviteProfileType}
                              onChange={(e) => setInviteProfileType(e.target.value as "admin" | "member")}
                              className="select-premium"
                            >
                              <option value="member">Miembro</option>
                              <option value="admin">Admin</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Rol (ej. Marketing Lead)..."
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              className="input-premium"
                            />
                            <button 
                              onClick={handleSendInvite}
                              className="bg-erani-blue p-3 rounded-xl hover:scale-105 transition-all text-white"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       {teamMembers.map((member) => (
                         <div key={member.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-erani-blue to-erani-purple flex items-center justify-center text-white font-black text-xs uppercase">
                                  {member.email.charAt(0)}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">{member.email}</span>
                                  <span className="text-[9px] uppercase font-black text-gray-600 tracking-widest">{member.role || member.profile_type}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-8">
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
                                      className={`w-12 h-6 rounded-full relative transition-all ${features[item.key as keyof typeof features] ? 'bg-emerald-500' : 'bg-white/10'}`}
                                   >
                                      <motion.div 
                                        animate={{ x: features[item.key as keyof typeof features] ? 24 : 4 }}
                                        className="absolute top-1 w-4 h-4 bg-white rounded-full" 
                                      />
                                   </button>
                                </div>
                              ))}
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
                              <span className="text-xs font-bold text-foreground">5 ERIS (Gemini 1.5 Flash Inference)</span>
                           </div>
                        </div>

                        {/* Referral Logic */}
                        <div className="col-span-12 md:col-span-7 flex flex-col gap-6">
                           <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6">
                              <h4 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                                <Share2 className="w-5 h-5 text-erani-purple" /> Referir & Ganar
                              </h4>
                              <p className="text-[10px] font-medium text-gray-600 leading-relaxed uppercase tracking-widest">
                                Comparte ERANI con un colega. Si realiza su demo gratuita, obtendrás **100 ERIS de regalo** y él obtendrá acceso prioritario.
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
                      
                      <div className="flex-1 min-h-0 rounded-[2rem] overflow-hidden border border-white/5">
                        {profile?.organization_id ? (
                          <RealtimeLogTerminal organizationId={profile.organization_id} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Cargando Terminal...</span>
                          </div>
                        )}
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

                         <button className="p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-erani-coral hover:bg-erani-coral/10 transition-all text-left">
                            Eliminar Cuenta de Organización
                         </button>
                      </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

    </div>
  );
}

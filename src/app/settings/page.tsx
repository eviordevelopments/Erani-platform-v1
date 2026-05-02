"use client";

import { useState, useEffect } from "react";
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
  Mail
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useDashboard } from "@/context/DashboardContext";
import { useRouter } from "next/navigation";

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

  // Team
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");

  // Features
  const [features, setFeatures] = useState({
    firewall_enabled: true,
    email_alerts: true,
    slack_alerts: false,
    auto_audit: false
  });

  // Referrals
  const [referralEmail, setReferralEmail] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [erisBalance, setErisBalance] = useState(1000);

  // Logs
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (profile || user) {
      fetchInitialData();
    }
  }, [profile, user]);

  const fetchInitialData = async () => {
    // Retrieve fallback metadata from onboarding
    const meta = user?.user_metadata || {};
    setOrgData({
      name: meta.orgName || "",
      bio: meta.bio || "",
      sector: meta.sector || "",
      teamSize: meta.teamSize || "1-10",
      annualRevenue: 0,
      goals: meta.goals || [],
      recoveryEmail: meta.recoveryEmail || "",
      logoUrl: profile?.avatar_url || ""
    });

    if (!profile?.organization_id) return;
    
    // Fetch Org
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single();
    
    if (org) {
      setOrgData({
        name: org.name || meta.orgName || "",
        bio: org.bio || meta.bio || "",
        sector: org.sector || meta.sector || "",
        teamSize: org.team_size || meta.teamSize || "1-10",
        annualRevenue: org.annual_revenue || 0,
        goals: org.goals || meta.goals || [],
        recoveryEmail: org.recovery_email || meta.recoveryEmail || "",
        logoUrl: org.logo_url || profile?.avatar_url || ""
      });
      setErisBalance(org.eris_balance || 1000);
    }

    // Fetch Features
    const { data: feat } = await supabase
      .from('organization_features')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .single();
    if (feat) setFeatures(feat);

    // Fetch Team
    const { data: team } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', profile.organization_id);
    if (team) setTeamMembers(team);

    // Fetch Logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(15);
    if (auditLogs) setLogs(auditLogs);
  };

  const handleSaveOrg = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgData.name,
        bio: orgData.bio,
        sector: orgData.sector,
        team_size: orgData.teamSize,
        annual_revenue: orgData.annualRevenue,
        goals: orgData.goals,
        recovery_email: orgData.recoveryEmail
      })
      .eq('id', profile?.organization_id);
    
    if (error) setMessage({ type: "error", text: "Error al guardar organización" });
    else setMessage({ type: "success", text: "Organización actualizada" });
    setIsSaving(false);
  };

  const handleToggleFeature = async (key: keyof typeof features) => {
    const newVal = !features[key];
    setFeatures(prev => ({ ...prev, [key]: newVal }));
    
    await supabase
      .from('organization_features')
      .upsert({
        organization_id: profile?.organization_id,
        [key]: newVal
      });
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    const { error } = await supabase
      .from('team_members')
      .insert({
        organization_id: profile?.organization_id,
        email: inviteEmail,
        status: 'pending'
      });
    
    if (!error) {
      setInviteEmail("");
      fetchInitialData();
      setMessage({ type: "success", text: "Invitación enviada" });
    }
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
                        <div className="aspect-square border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white/5 relative group cursor-pointer hover:border-erani-blue transition-all">
                          {orgData.logoUrl ? (
                            <Image src={orgData.logoUrl} alt="Org Logo" width={200} height={200} className="object-contain p-6" />
                          ) : (
                            <Plus className="w-8 h-8 text-gray-700" />
                          )}
                          <div className="absolute bottom-4 text-[8px] uppercase font-black tracking-widest text-gray-600 opacity-0 group-hover:opacity-100">Click para subir</div>
                        </div>
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
                            value={orgData.annualRevenue}
                            onChange={(e) => setOrgData({...orgData, annualRevenue: parseFloat(e.target.value)})}
                            className="input-premium"
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
                       <div className="flex items-center gap-3">
                          <input 
                            type="email" 
                            placeholder="Email del colaborador..."
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
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

                    <div className="grid grid-cols-1 gap-4">
                       {teamMembers.map((member) => (
                         <div key={member.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-erani-blue to-erani-purple flex items-center justify-center text-white font-black text-xs uppercase">
                                  {member.email.charAt(0)}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">{member.email}</span>
                                  <span className="text-[9px] uppercase font-black text-gray-600 tracking-widest">{member.role}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-8">
                               <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                                 member.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                               }`}>
                                 {member.status}
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
                   <div className="flex flex-col gap-8">
                      <div className="flex justify-between items-center">
                         <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Logs Operativos & Auditoría</h3>
                         <span className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Mostrando últimos {logs.length} eventos</span>
                      </div>
                      <div className="flex flex-col gap-2">
                         {logs.map((log) => (
                           <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all">
                              <div className="flex items-center gap-5">
                                 <div className={`w-2 h-2 rounded-full ${log.action.includes('error') ? 'bg-erani-coral' : 'bg-erani-blue'}`} />
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{log.action}</span>
                                    <span className="text-[10px] text-gray-600 font-medium">{log.description}</span>
                                 </div>
                              </div>
                              <span className="text-[10px] font-mono text-gray-700">{new Date(log.created_at).toLocaleString()}</span>
                           </div>
                         ))}
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
                              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Propietario</label>
                              <div className="p-4 rounded-xl bg-foreground/5 border border-glass-border text-sm font-bold text-foreground flex items-center gap-3">
                                 <User className="w-4 h-4 text-erani-blue" /> {profile?.full_name}
                              </div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Email Principal</label>
                              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-gray-500 flex items-center gap-3">
                                 <Mail className="w-4 h-4" /> {user?.email}
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     <div className="pt-10 border-t border-white/5 flex flex-col gap-6">
                        <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Control de Acceso</h4>
                        <button className="bg-foreground/5 border border-glass-border p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-foreground hover:bg-foreground/10 transition-all text-left flex justify-between items-center group">
                           Actualizar Contraseña Maestra
                           <Lock className="w-4 h-4 text-nav-text group-hover:text-foreground transition-all" />
                        </button>
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

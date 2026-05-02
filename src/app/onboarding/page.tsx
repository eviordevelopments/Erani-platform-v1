"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Building2, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  Lock, 
  FileCheck,
  ArrowLeft,
  X,
  Play,
  Mail,
  Target,
  BarChart3,
  Users,
  Briefcase,
  Layers,
  Globe,
  Plus,
  Send,
  Trash2,
  Image as ImageIcon,
  UploadCloud
} from "lucide-react";
import OnboardingModal from "@/components/OnboardingModal";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type RegStep = "form-org" | "form-user" | "processing" | "config-platform" | "team-invite" | "checklist" | "success" | "tour";

export default function Onboarding() {
  const [step, setStep] = useState<RegStep>("form-org");
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    orgName: "",
    fullName: "",
    email: user?.email || "",
    role: "client",
    bio: "",
    sector: "",
    teamSize: "1-10",
    annualRevenue: "",
    goals: [] as string[],
    recoveryEmail: "",
    logoBase64: ""
  });

  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [currentTeamEmail, setCurrentTeamEmail] = useState("");
  const [checkedFiles, setCheckedFiles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email! }));
    }
  }, [user]);

  const runSimulation = () => {
    setStep("processing");
    setTimeout(() => {
        setStep("config-platform");
    }, 3000);
  };

  const handleAddTeamEmail = () => {
    if (currentTeamEmail && !teamEmails.includes(currentTeamEmail)) {
        setTeamEmails([...teamEmails, currentTeamEmail]);
        setCurrentTeamEmail("");
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
        ...prev,
        goals: prev.goals.includes(goal) 
            ? prev.goals.filter(g => g !== goal) 
            : [...prev.goals, goal]
    }));
  };

  const toggleFile = (file: string) => {
    setCheckedFiles(prev => prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinishConfig = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      // Save metadata to Auth User (excluding the massive base64 string to avoid JWT bloat)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          onboardingCompleted: true,
          eris_balance: 100,
          fullName: formData.fullName,
          orgName: formData.orgName,
          bio: formData.bio,
          sector: formData.sector,
          teamSize: formData.teamSize,
          goals: formData.goals,
          recoveryEmail: formData.recoveryEmail,
          checkedFiles,
          teamEmails
        }
      });

      if (authError) throw authError;

      // Update public profile with the logo Base64
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.fullName,
        organization_id: formData.orgName, // Simple mapping for now
        avatar_url: formData.logoBase64 // Store base64 here instead of user_metadata
      }).eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();

      setStep("success");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0055A0', '#9e80ff', '#FF5C5C']
      });
    } catch (error: any) {
      console.error("Error saving onboarding data", error);
      alert("Hubo un error al guardar la configuración: " + (error.message || "Inténtalo de nuevo."));
    } finally {
      setIsSaving(false);
    }
  };

  const GOALS = [
    "Maximizar Rentabilidad",
    "Automatizar Auditorías",
    "Blindaje Legal",
    "Optimizar Operaciones",
    "Escalar Agencia"
  ];

  const FILES_CHECKLIST = [
    { id: "slack", label: "Export de Slack (.json/.csv)", icon: Mail },
    { id: "jira", label: "Logs de Gestión (Jira/Asana)", icon: Target },
    { id: "billing", label: "Reporte de Facturación", icon: BarChart3 },
    { id: "legal", label: "Contratos de Operación", icon: Shield }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral z-50" />

      {/* Theme Toggle */}
      <div className="absolute top-8 right-8 z-50">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl glassmorphism border border-white/10 dark:border-white/5 text-gray-500 hover:text-erani-blue transition-all active:scale-95 shadow-xl"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
      </div>

      {/* Animated Flowing Background for Final Steps */}
      <AnimatePresence>
        {(step === "success" || step === "tour") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          >
            <motion.div
              animate={{
                x: ["-10%", "10%", "-10%"],
                y: ["-10%", "10%", "-10%"],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-[50%] opacity-40 dark:opacity-30 bg-[radial-gradient(circle_at_center,rgba(0,85,160,0.3),rgba(158,128,255,0.2),rgba(255,92,92,0.1),transparent_60%)] blur-[80px]"
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-[50%] opacity-20 dark:opacity-30 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(0,85,160,0.2),rgba(158,128,255,0.2),rgba(255,92,92,0.2),rgba(0,85,160,0.2))] blur-[100px] origin-center"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* STEP 1 & 2: PROTOCOLO DE REGISTRO */}
        {(step === "form-org" || step === "form-user") && (
          <motion.div 
            key="forms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl glassmorphism p-12 flex flex-col gap-10 shadow-2xl relative m-6 border border-white/20 dark:border-white/5 rounded-[2.5rem]"
          >
            <div className="flex flex-col items-center gap-6 text-center">
                <Link href="/">
                    <Image src="/eanilogo.png" alt="ERANI" width={160} height={60} className="mb-4 logo-adaptive" />
                </Link>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                   {step === "form-org" ? "Comienza con tu registro" : "PERFIL DE TU ORGANIZACIÓN"}
                </h1>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                   Preparando el protocolo de auditoría e infraestructura.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {step === "form-org" ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 ml-1">Organización / Agencia</label>
                    <div className="relative group">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-erani-blue transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Nombre de tu Agencia"
                            className="input-premium !pl-14"
                            value={formData.orgName}
                            onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                        />
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep("form-user")}
                    disabled={!formData.orgName}
                    className="button-premium w-full py-5 rounded-2xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-erani-blue/20"
                  >
                     Continuar Protocolo <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 ml-1">Nombre Completo</label>
                        <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-erani-purple transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Nombre y Apellido"
                                className="input-premium !pl-14"
                                value={formData.fullName}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 ml-1">Email Corporativo</label>
                        <div className="relative group">
                            <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-erani-purple transition-colors" />
                            <input 
                                type="email" 
                                placeholder="email@agencia.com"
                                className="input-premium !pl-14"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep("form-org")}
                      className="px-6 py-5 rounded-2xl border border-white/10 text-gray-500 hover:text-foreground transition-colors bg-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={runSimulation}
                      disabled={!formData.fullName || !formData.email}
                      className="bg-gradient-to-r from-erani-purple to-erani-blue flex-1 py-5 rounded-2xl text-xs uppercase tracking-[0.2em] text-white flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20 disabled:opacity-50"
                    >
                       Siguiente Fase <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PROCESSING STEP */}
        {step === "processing" && (
          <motion.div 
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-12"
          >
            <div className="relative">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-48 rounded-full border-t-2 border-r-2 border-erani-blue shadow-[0_0_60px_rgba(0,85,160,0.2)]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Image src="/isologo.png" alt="ERANI" width={80} height={80} className="animate-pulse logo-adaptive" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
                <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-foreground">Sincronizando</h2>
                <p className="text-xs uppercase font-bold text-gray-500 tracking-[0.2em]">Estructurando protocolos de seguridad...</p>
            </div>
          </motion.div>
        )}

        {/* STEP 4: DEEP CONFIGURATION (SPLIT SCREEN) */}
        {step === "config-platform" && (
          <motion.div 
            key="config-platform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full min-h-screen flex bg-background"
          >
            {/* Left Side: Fields */}
            <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col gap-12 overflow-y-auto max-h-screen no-scrollbar relative z-10">
                <div className="flex flex-col gap-3">
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-blue">Nivel 2: Operación</span>
                    <h2 className="text-4xl font-black uppercase tracking-tight text-foreground leading-tight">Configura tu Entorno Forense</h2>
                    <p className="text-sm font-medium text-gray-500">Personaliza los parámetros operativos para tu recuperación de rentabilidad.</p>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-500" /> Logo de la Organización
                        </label>
                        <div className="flex items-center gap-6">
                            <label className="w-20 h-20 rounded-[1.5rem] bg-black/5 dark:bg-white/5 border border-erani-blue dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-erani-blue dark:hover:border-erani-blue transition-colors group overflow-hidden relative">
                               {formData.logoBase64 ? (
                                   <img src={formData.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                               ) : (
                                   <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-erani-blue transition-colors" />
                               )}
                               <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                            </label>
                            <div className="flex flex-col gap-2">
                                <label className="button-premium px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer text-center">
                                    Subir Logotipo
                                    <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                                </label>
                                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">PNG, JPG hasta 5MB</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-erani-blue" /> Biografía de la Organización
                        </label>
                        <textarea 
                            rows={3}
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            className="textarea-premium rounded-[1.5rem]"
                            placeholder="Ej: Agencia boutique enfocada en retail con +20 clientes..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-4">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-erani-purple" /> Sector
                            </label>
                            <select 
                                value={formData.sector}
                                onChange={(e) => setFormData({...formData, sector: e.target.value})}
                                className="select-premium"
                            >
                                <option value="">Selecciona</option>
                                <option value="tech">Marketing Tech</option>
                                <option value="creative">Agencia Creativa</option>
                                <option value="consulting">Consultoría</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-4">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                <Users className="w-4 h-4 text-erani-coral" /> Tamaño
                            </label>
                            <select 
                                value={formData.teamSize}
                                onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                                className="select-premium"
                            >
                                <option value="1-10">1-10 pax</option>
                                <option value="11-50">11-50 pax</option>
                                <option value="50+">50+ pax</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                         <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <Target className="w-4 h-4 text-erani-blue" /> Metas Principales
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {GOALS.map(goal => (
                                <button
                                    key={goal}
                                    onClick={() => toggleGoal(goal)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        formData.goals.includes(goal)
                                        ? "bg-erani-blue border-erani-blue text-white shadow-lg shadow-erani-blue/20"
                                        : "bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/10 text-gray-500 hover:border-black/40 dark:hover:border-white/30"
                                    }`}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" /> Email de Recuperación
                        </label>
                        <input 
                            type="email"
                            value={formData.recoveryEmail}
                            onChange={(e) => setFormData({...formData, recoveryEmail: e.target.value})}
                            className="input-premium"
                            placeholder="email-respaldo@agencia.com"
                        />
                    </div>
                </div>

                <button 
                  onClick={() => setStep("team-invite")}
                  disabled={!formData.logoBase64 || !formData.bio || !formData.sector || !formData.teamSize || formData.goals.length === 0 || !formData.recoveryEmail}
                  className="button-premium w-full py-6 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 mt-4 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Siguiente Fase: Mi Equipo <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* Right Side: Animations */}
            <div className="hidden md:flex w-1/2 bg-foreground/5 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-erani-blue/5 via-transparent to-erani-purple/5" />
                <div className="relative z-10 w-full max-w-lg p-10 flex flex-col gap-8">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="glassmorphism p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-erani-blue animate-pulse" />
                                <span className="text-[11px] uppercase font-black tracking-[0.2em] text-foreground">Auditoría en Tiempo Real</span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-erani-blue/10 text-erani-blue text-[9px] font-black uppercase tracking-widest">
                                TRL-4 ACTIVE
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    animate={{ width: ["0%", "92%", "88%", "98%"] }}
                                    transition={{ duration: 12, repeat: Infinity }}
                                    className="h-full bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral shadow-[0_0_15px_rgba(158,128,255,0.5)]" 
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-5">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="aspect-square rounded-[1.5rem] bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 flex flex-col items-center justify-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-erani-blue' : i === 2 ? 'bg-erani-purple' : 'bg-erani-coral'} animate-bounce`} style={{ animationDelay: `${i * 0.2}s` }} />
                                        <div className="w-10 h-1.5 bg-black/10 dark:bg-white/10 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Inferencia Gemini 1.5 Flash</span>
                                <div className="flex gap-1.5 h-4 items-end">
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <motion.div 
                                            key={i}
                                            animate={{ height: [4, 16, 8, 14, 4] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                            className="w-1.5 bg-erani-purple rounded-full opacity-60"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: TEAM INVITE */}
        {step === "team-invite" && (
           <motion.div 
             key="team-invite"
             initial={{ opacity: 0, x: 100 }}
             animate={{ opacity: 1, x: 0 }}
             className="w-full min-h-screen flex bg-background"
           >
              <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col gap-12 overflow-y-auto max-h-screen no-scrollbar relative z-10">
                 <div className="flex flex-col gap-3">
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-purple">Nivel 3: Colaboración</span>
                    <h2 className="text-4xl font-black uppercase tracking-tight text-foreground leading-tight">Expande tu Fuerza Operativa</h2>
                    <p className="text-sm font-medium text-gray-500">Invita a tus colaboradores principales para iniciar la auditoría conjunta.</p>
                 </div>

                 <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Email del Colaborador</label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="email" 
                                    placeholder="socio@tuagencia.com"
                                    className="input-premium !pl-14"
                                    value={currentTeamEmail}
                                    onChange={(e) => setCurrentTeamEmail(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleAddTeamEmail}
                                className="bg-foreground text-background px-6 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">Invitaciones Pendientes ({teamEmails.length})</span>
                        <div className="flex flex-col gap-3">
                            {teamEmails.map((email) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={email} 
                                    className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-erani-blue flex items-center justify-center text-[10px] font-black text-white">
                                            {email[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-foreground">{email}</span>
                                    </div>
                                    <button onClick={() => setTeamEmails(teamEmails.filter(e => e !== email))} className="text-gray-500 hover:text-erani-coral">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                 </div>

                 <div className="mt-auto flex gap-4">
                    <button onClick={() => setStep("config-platform")} className="px-8 py-6 rounded-2xl border border-white/10 text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={() => setStep("checklist")} className="button-premium flex-1 py-6 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4">Protocolo de Verificación <ArrowRight className="w-5 h-5" /></button>
                 </div>
              </div>

              <div className="hidden md:flex w-1/2 bg-foreground/5 items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tl from-erani-purple/10 via-transparent to-transparent" />
                 <div className="relative z-10 w-full max-w-md grid grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <motion.div 
                            key={i}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                            className="aspect-square glassmorphism rounded-[2.5rem] border border-white/10 flex items-center justify-center bg-white/10"
                        >
                            <User className={`w-10 h-10 ${i % 2 === 0 ? 'text-erani-blue' : 'text-erani-purple'}`} />
                        </motion.div>
                    ))}
                 </div>
              </div>
           </motion.div>
        )}

        {/* STEP 6: CHECKLIST */}
        {step === "checklist" && (
            <motion.div 
                key="checklist"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full min-h-screen flex items-center justify-center bg-background p-10"
            >
                <div className="w-full max-w-2xl flex flex-col gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-coral">Protocolo de Datos</span>
                        <h2 className="text-4xl font-black uppercase tracking-tight text-foreground">Verificación de Infraestructura</h2>
                        <p className="text-sm font-medium text-gray-500">Confirma que tienes los archivos mínimos necesarios para la auditoría forense.</p>
                    </div>

                    <div className="grid gap-3">
                        {FILES_CHECKLIST.map((file) => (
                            <button 
                                key={file.id}
                                onClick={() => toggleFile(file.id)}
                                className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                                    checkedFiles.includes(file.id) 
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-xl shadow-emerald-500/10" 
                                    : "bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/10 text-gray-500 hover:border-black/40 dark:hover:border-white/20"
                                }`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`p-3 rounded-2xl ${checkedFiles.includes(file.id) ? 'bg-emerald-500/20' : 'bg-black/5 dark:bg-white/5'}`}>
                                        <file.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">{file.label}</span>
                                </div>
                                {checkedFiles.includes(file.id) && <CheckCircle2 className="w-5 h-5" />}
                            </button>
                        ))}
                    </div>

                    <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest mt-2">
                        Transparencia de auditoría con todos los datos. Por la Ley de Protección de Datos Personales del Estado de Guanajuato, no tomamos ni vemos los datos, todos están cifrados de manera segura y blindados para tu administración.
                    </p>

                    <div className="flex gap-4">
                        <button onClick={() => setStep("team-invite")} className="px-8 py-6 rounded-2xl border border-white/10 text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
                        <button 
                            disabled={checkedFiles.length === 0 || isSaving}
                            onClick={handleFinishConfig} 
                            className="button-premium flex-1 py-6 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 disabled:opacity-30"
                        >
                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finalizar Blindaje Forense <CheckCircle2 className="w-6 h-6" /></>}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl glassmorphism p-16 flex flex-col items-center text-center gap-10 relative z-10 overflow-hidden m-6 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
            <Image src="/eanilogo.png" alt="ERANI" width={220} height={80} className="mb-6 logo-adaptive" />
            
            <div className="flex flex-col gap-6">
               <h1 className="text-4xl font-black uppercase tracking-tight text-foreground leading-tight">
                  Bienvenido a la Era de la <span className="text-erani-blue">Rentabilidad Asegurada</span>
               </h1>
               <p className="text-xl font-bold text-gray-500 italic">"Asegura tu rentabilidad en 90 días."</p>
            </div>

            <button 
              onClick={() => setStep("tour")}
              className="button-premium w-full py-6 rounded-2xl text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl shadow-erani-blue/20"
            >
               Comenzar Tour Estratégico <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* TOUR */}
        {step === "tour" && (
          <motion.div 
            key="tour"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl glassmorphism p-16 flex flex-col gap-12 relative z-10 m-6 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
          >
            <button 
                onClick={() => router.push('/dashboard')}
                className="absolute top-10 right-10 text-gray-500 hover:text-foreground transition-colors p-2 hover:bg-white/5 rounded-xl"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col gap-3">
                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-erani-blue">Protocolo de Seguridad</span>
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Transparencia Operativa Total</h2>
                <p className="text-sm font-medium text-gray-500 max-w-xl">No requerimos credenciales. Tú controlas el flujo de datos enviando únicamente los metadatos necesarios.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { icon: Shield, title: "Export de Canales", desc: "Historial de mensajes técnicos de Slack o Teams." },
                    { icon: FileCheck, title: "Logs de Gestión", desc: "Reportes en CSV de Jira, ClickUp o Asana." },
                    { icon: Lock, title: "Cifrado de Extremo", desc: "Solo leemos metadatos operativos." },
                    { icon: Zap, title: "Impacto Real", desc: "Cruce de datos facturados vs esfuerzo operativo." }
                ].map((item, idx) => (
                    <div key={idx} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex gap-6 hover:border-erani-blue/30 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-erani-blue shrink-0 group-hover:scale-110 transition-transform">
                            <item.icon className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-xs uppercase font-black text-foreground tracking-widest">{item.title}</span>
                            <span className="text-[10px] text-gray-500 font-bold leading-relaxed">{item.desc}</span>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => setIsOnboardingOpen(true)}
                className="button-premium w-full py-6 rounded-2xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-erani-blue/20"
            >
                Activar Blindaje Forense <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Meta Logs */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-2 opacity-10 font-mono text-[8px] text-erani-blue hidden lg:flex">
         <span>[PROT] SYSTEM READY...</span>
         <span>[AUTH] HANDSHAKE COMPLETE.</span>
         <span>[TRL4] INFRASTRUCTURE VERIFIED.</span>
      </div>

      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => router.push('/dashboard')} 
      />


    </main>
  );
}

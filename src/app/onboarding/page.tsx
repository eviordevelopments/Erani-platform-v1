"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Mail,
  Target,
  Users,
  Briefcase,
  Layers,
  Image as ImageIcon,
  UploadCloud,
  Plus,
  Trash2,
  UserCheck,
  UserCog,
  Lock,
  Eye,
  EyeOff,
  Search,
  Zap,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  FileJson,
  FileCode,
  File
} from "lucide-react";
import OnboardingModal from "@/components/OnboardingModal";
import OnboardingProgressBar from "@/components/OnboardingProgressBar";
import InfoTooltip from "@/components/InfoTooltip";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
// supabase client — used in tasks 6.2, 6.4, 6.5
import { supabase } from "@/lib/supabaseClient";

// ─── State Machine ────────────────────────────────────────────────────────────
type OnboardingState =
  | "intro"
  | "entry"
  | "step-1-org"
  | "step-done-1"
  | "syncing"
  | "step-2-env"
  | "step-done-2"
  | "syncing-2"
  | "step-3-team"
  | "step-done-3"
  | "syncing-3"
  | "step-4-account"
  | "syncing-final"
  | "feature-audits"
  | "feature-widgets"
  | "feature-tools"
  | "feature-agent"
  | "feature-session"
  | "feature-feedback"
  | "success";

const STATE_ORDER: OnboardingState[] = [
  "intro",
  "entry",
  "step-1-org",
  "step-done-1",
  "syncing",
  "step-2-env",
  "step-done-2",
  "syncing-2",
  "step-3-team",
  "step-done-3",
  "syncing-3",
  "step-4-account",
  "syncing-final",
  "success",
  "feature-audits",
  "feature-widgets",
  "feature-tools",
  "feature-agent",
  "feature-session",
  "feature-feedback",
];

/** Maps onboarding state → progress bar step number (null = hide bar) */
function stateToProgressStep(state: OnboardingState): number | null {
  switch (state) {
    case "step-1-org":
    case "step-done-1":  return 1;
    case "step-2-env":
    case "step-done-2":  return 2;
    case "step-3-team":
    case "step-done-3":  return 3;
    case "feature-widgets": return null; // Interstitial feature showcase
    case "step-4-account": return 4;
    case "success":        return 5;
    default:               return null;
  }
}

/** Returns the completed steps array for the progress bar */
function completedSteps(state: OnboardingState): number[] {
  const step = stateToProgressStep(state);
  if (step === null) return [];
  const completed: number[] = [];
  for (let i = 1; i < step; i++) completed.push(i);
  return completed;
}

// ─── Form Data ────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1 - Org
  orgName: string;
  sector: string;
  teamSize: string;
  logoUrl: string;
  logoBase64: string;
  logoFile: File | null;
  bio: string;
  goals: string[];
  recoveryEmail: string;
  // Step 3 - Team
  members: Array<{ email: string; profile_type: "admin" | "member"; role: string }>;
  // Step 4 - Account + Personal Profile
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  adminRole: string;
  // Internal
  organizationId: string;
  auditedFileTypes: string[];
}

const INITIAL_FORM_DATA: FormData = {
  orgName: "",
  sector: "",
  teamSize: "1-10",
  logoUrl: "",
  logoBase64: "",
  logoFile: null,
  bio: "",
  goals: [],
  recoveryEmail: "",
  members: [],
  adminEmail: "",
  adminPassword: "",
  adminFullName: "",
  adminRole: "",
  organizationId: "",
  auditedFileTypes: [],
};

// (Legacy RegStep type removed — state machine now handles all navigation)

export default function Onboarding() {
  // ── State machine ──────────────────────────────────────────────────────────
  const [machineState, setMachineState] = useState<OnboardingState>("entry");

  // ── Legacy step kept for screens not yet migrated (6.2–6.5) ───────────────
  // (will be removed once all steps are migrated to the state machine)

  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  // ── Unified form state — preserves data across all steps ─────────────────
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM_DATA,
    adminEmail: user?.email || "",
  });

  const { theme, toggleTheme } = useTheme();
// ── Bootstrap: show intro screen first ────────────────────────────────────
  useEffect(() => {
    setMachineState("intro");
  }, []);

  // ── Sync user email into form when auth loads ──────────────────────────────
  useEffect(() => {
    if (user?.email && !formData.adminEmail) {
      setFormData(prev => ({ ...prev, adminEmail: user.email! }));
    }
  }, [user]);

  // ── Auto-advance syncing states after 3000 ms ──────────────────────────────
  useEffect(() => {
    const syncingStates: OnboardingState[] = ["syncing", "syncing-2", "syncing-3"];
    const stepDoneStates: OnboardingState[] = ["step-done-1", "step-done-2", "step-done-3"];

    if (stepDoneStates.includes(machineState)) {
      const t = setTimeout(() => {
        const idx = STATE_ORDER.indexOf(machineState);
        if (idx < STATE_ORDER.length - 1) setMachineState(STATE_ORDER[idx + 1]);
      }, 1600);
      return () => clearTimeout(t);
    }

    if (syncingStates.includes(machineState)) {
      const t = setTimeout(() => {
        const idx = STATE_ORDER.indexOf(machineState);
        if (idx < STATE_ORDER.length - 1) setMachineState(STATE_ORDER[idx + 1]);
      }, 3000);
      return () => clearTimeout(t);
    }
    if (machineState === "syncing-final") {
      const t = setTimeout(() => {
        const idx = STATE_ORDER.indexOf(machineState);
        if (idx < STATE_ORDER.length - 1) setMachineState(STATE_ORDER[idx + 1]);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [machineState]);

  useEffect(() => {
    if (machineState === "success") {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#0055A0", "#9e80ff", "#FF5C5C"],
        });
    }
  }, [machineState]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goToNext = () => {
    const idx = STATE_ORDER.indexOf(machineState);
    if (idx < STATE_ORDER.length - 1) {
      setMachineState(STATE_ORDER[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = STATE_ORDER.indexOf(machineState);
    let prevIdx = idx - 1;
    const syncStates = ["syncing", "syncing-2", "syncing-3", "syncing-final", "step-done-1", "step-done-2", "step-done-3"];
    while (prevIdx > 0 && syncStates.includes(STATE_ORDER[prevIdx])) {
      prevIdx--;
    }
    if (prevIdx >= 0) {
      setMachineState(STATE_ORDER[prevIdx]);
    }
  };

  // ── Step 1 — Org creation state ───────────────────────────────────────────
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // ── Step 3 — Team invite state ─────────────────────────────────────────────
  const [isInviting, setIsInviting] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // ── Step 4 — Admin account state ───────────────────────────────────────────
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [step4Error, setStep4Error] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [successAnimationStep, setSuccessAnimationStep] = useState(0);

  useEffect(() => {
    if (machineState === "success") {
      setSuccessAnimationStep(0);
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setSuccessAnimationStep(step);
        if (step >= 4) {
          clearInterval(timer);
        }
      }, 700);
      return () => clearInterval(timer);
    }
  }, [machineState]);

  // Polling for email confirmation on success screen if pending
  useEffect(() => {
    if (machineState !== "success" || isEmailConfirmed) return;
    
    const interval = setInterval(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.adminEmail,
        password: formData.adminPassword,
      });
      
      if (!error && data.user) {
        setIsEmailConfirmed(true);
        await refreshProfile();
        clearInterval(interval);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [machineState, isEmailConfirmed, formData, refreshProfile]);

  const MAX_INVITES = 4; // 1 slot reserved for admin

  const addMember = () => {
    if (formData.members.length >= MAX_INVITES) return;
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { email: "", profile_type: "member", role: "" }],
    }));
  };

  const removeMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const updateMember = (
    index: number,
    field: keyof FormData["members"][number],
    value: string
  ) => {
    setFormData(prev => {
      const updated = [...prev.members];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, members: updated };
    });
  };

  const handleInviteTeam = async () => {
    setStep3Error(null);

    // Validate member count (Req 2.12)
    if (formData.members.length > MAX_INVITES) {
      setStep3Error("Tu plan incluye hasta 5 miembros por organización, incluyendo administradores.");
      return;
    }

    // If no members, skip the API call and advance
    if (formData.members.length === 0) {
      goToNext();
      return;
    }

    // Validate each email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const m of formData.members) {
      if (!m.email.trim() || !emailRegex.test(m.email.trim())) {
        setStep3Error("Todos los miembros deben tener un email válido.");
        return;
      }
    }

    setIsInviting(true);
    try {
      const res = await fetch("/api/auth/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite_members",
          organization_id: formData.organizationId,
          members: formData.members.map(m => ({
            email: m.email.trim(),
            profile_type: m.profile_type,
            role: m.role.trim() || undefined,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStep3Error(json.error ?? "Error al invitar miembros.");
        return;
      }
      goToNext();
    } catch {
      setStep3Error("Error de red. Intenta de nuevo.");
    } finally {
      setIsInviting(false);
    }
  };

  /** POST /api/auth/org with action: 'create_org', store organization_id, advance state */
  const handleCreateOrg = async () => {
    if (!formData.orgName.trim()) return;
    setIsCreatingOrg(true);
    setStep1Error(null);
    try {
      const res = await fetch("/api/auth/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_org",
          name: formData.orgName.trim(),
          sector: formData.sector || undefined,
          team_size: formData.teamSize || undefined,
          logo_url: formData.logoUrl || undefined,
          bio: formData.bio || undefined,
          goals: formData.goals.length > 0 ? formData.goals : undefined,
          recovery_email: formData.recoveryEmail || undefined,
          audited_file_types: formData.auditedFileTypes.length > 0 ? formData.auditedFileTypes : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStep1Error(json.error ?? "Error al crear la organización.");
        return;
      }
      setFormData(prev => ({ ...prev, organizationId: json.organization_id }));
      goToNext();
    } catch {
      setStep1Error("Error de red. Intenta de nuevo.");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  /** Step 4: signUp + create_admin_profile → syncing-final (Req 2.7, 2.8, 2.9) */
  const handleCreateAccount = async () => {
    setStep4Error(null);

    const email = formData.adminEmail.trim();
    const password = formData.adminPassword;

    if (!email || !password) {
      setStep4Error("Email y contraseña son requeridos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStep4Error("Ingresa un email válido.");
      return;
    }

    if (password.length < 6) {
      setStep4Error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      // 1. Sign up using the server to trigger the confirmation email 
      //    and bypass the user's browser network blocks (Failed to fetch).
      const res = await fetch("/api/auth/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_admin_with_email",
          organization_id: formData.organizationId,
          email,
          password,
          full_name: formData.adminFullName.trim() || undefined,
          role: formData.adminRole.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStep4Error(json.error ?? "Error al registrar la cuenta.");
        setIsCreatingAccount(false);
        return;
      }

      // 2. Attempt to sign in. Since email confirmation is required, this will fail 
      //    until the user clicks the link in their email.
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      let userId = signInData?.user?.id;
      let confirmed = false;

      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          setIsEmailConfirmed(false);
          confirmed = false;
        } else {
          setStep4Error("Error al iniciar sesión: " + signInError.message);
          setIsCreatingAccount(false);
          return;
        }
      } else if (!signInData.user) {
        setStep4Error("Error desconocido al iniciar sesión.");
        setIsCreatingAccount(false);
        return;
      } else {
        setIsEmailConfirmed(true);
        confirmed = true;
      }

      if (userId) {
        // Create preferences (best-effort, non-blocking)
        fetch("/api/auth/org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_user_preferences",
            user_id: userId,
            organization_id: formData.organizationId,
          }),
        }).catch(() => {});
      }

      // Refresh context and advance
      if (confirmed) {
        await refreshProfile();
      }
      goToNext();
    } catch {
      setStep4Error("Error de red. Intenta de nuevo.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // ── Legacy helpers (used by screens not yet migrated) ─────────────────────
  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
        ...prev,
        goals: prev.goals.includes(goal) 
            ? prev.goals.filter(g => g !== goal) 
            : [...prev.goals, goal]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoBase64: reader.result as string, logoFile: file }));
      };
      reader.readAsDataURL(file);
    }
  };



  const GOALS = [
    "Maximizar Rentabilidad",
    "Automatizar Auditorías",
    "Blindaje Legal",
    "Optimizar Operaciones",
    "Escalar Agencia"
  ];

  const FILE_TYPES = [
    { id: "excel", label: "Excel", icon: FileSpreadsheet },
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "csv", label: "CSV", icon: FileSpreadsheet },
    { id: "json", label: "JSON", icon: FileJson },
    { id: "xml", label: "XML", icon: FileCode },
    { id: "otros", label: "Otros", icon: File },
  ];

  const toggleFileType = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      auditedFileTypes: prev.auditedFileTypes.includes(typeId)
        ? prev.auditedFileTypes.filter(t => t !== typeId)
        : [...prev.auditedFileTypes, typeId]
    }));
  };

  // ── Derived progress bar values ────────────────────────────────────────────
  const progressStep = stateToProgressStep(machineState);
  const progressCompleted = completedSteps(machineState);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral z-50" />

      {/* Progress Bar — full-width frosted header */}
      {progressStep !== null && progressStep < 5 && machineState !== "intro" && (
        <div className="fixed top-0 left-0 right-0 z-40">
          <OnboardingProgressBar
            currentStep={progressStep}
            completedSteps={progressCompleted}
          />
        </div>
      )}

      {/* Theme Toggle */}
      <div className="absolute top-8 right-8 z-50">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl glassmorphism border border-white/10 dark:border-white/5 text-gray-500 hover:text-erani-blue transition-all active:scale-95 shadow-xl"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
      </div>

      {/* Animated Flowing Background for success */}
      <AnimatePresence>
        {machineState === "success" && (
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

      {/* ── State Machine Screens ─────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-center flex-1">
        <AnimatePresence mode="wait">

          {/* ENTRY — redirect immediately (handled by useEffect) */}
          {machineState === "entry" && (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <Loader2 className="w-10 h-10 animate-spin text-erani-blue" />
            </motion.div>
          )}

          {/* INTRO — overview screen shown before onboarding starts */}
          {machineState === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="w-full min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-6 py-20"
            >
              {/* Background glows */}
              <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-erani-purple/15 blur-[180px] pointer-events-none" />
              <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] rounded-full bg-erani-blue/8 blur-[160px] pointer-events-none" />

              <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-12">
                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Image src="/eanilogo.png" alt="ERANI" width={180} height={65} className="logo-adaptive" />
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <span className="text-[10px] uppercase font-black tracking-[0.4em] text-erani-blue">
                    Configuración de Organización
                  </span>
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-tight">
                    Tu infraestructura forense<br />
                    <span className="text-gradient-brand">en 4 pasos</span>
                  </h1>
                  <p className="text-base text-nav-text max-w-xl leading-relaxed font-medium">
                    Vamos a configurar tu organización en ERANI. El proceso toma aproximadamente{" "}
                    <span className="text-foreground font-black">5 minutos</span> y solo necesitarás
                    los datos básicos de tu agencia.
                  </p>
                </motion.div>

                {/* Steps grid */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="w-full grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {[
                    {
                      num: "01",
                      color: "erani-blue",
                      label: "Organización",
                      desc: "Nombre, sector, logo y metas de tu agencia.",
                    },
                    {
                      num: "02",
                      color: "erani-purple",
                      label: "Entorno Forense",
                      desc: "Parámetros operativos para la auditoría.",
                    },
                    {
                      num: "03",
                      color: "erani-coral",
                      label: "Equipo",
                      desc: "Invita hasta 4 colaboradores a tu organización.",
                    },
                    {
                      num: "04",
                      color: "emerald-400",
                      label: "Tu Cuenta",
                      desc: "Crea tus credenciales de acceso como administrador.",
                    },
                  ].map((step, i) => (
                    <motion.div
                      key={step.num}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                      className="glassmorphism rounded-[1.5rem] border border-glass-border p-6 flex flex-col gap-4 relative overflow-hidden"
                    >
                      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-${step.color}/10 blur-[30px] pointer-events-none`} />
                      <span className={`text-3xl font-black text-${step.color} leading-none`}>{step.num}</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase font-black tracking-widest text-foreground">{step.label}</span>
                        <span className="text-[11px] text-nav-text leading-relaxed">{step.desc}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  onClick={() => setMachineState("step-1-org")}
                  className="button-premium px-16 py-5 rounded-2xl text-sm uppercase tracking-[0.25em] font-black flex items-center gap-4 shadow-2xl shadow-erani-blue/20"
                >
                  Comenzar Configuración <ArrowRight className="w-5 h-5" />
                </motion.button>

                {/* Back to home */}
                <Link
                  href="/"
                  className="text-[10px] uppercase font-black tracking-widest text-nav-text hover:text-foreground transition-colors"
                >
                  ← Volver al inicio
                </Link>
              </div>
            </motion.div>
          )}

          {/* INTERSTITIAL — Auditorías Forenses */}
          {machineState === "feature-audits" && (
            <motion.div
              key="feature-audits"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full min-h-screen flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl z-0" />
              
              <div className="relative z-10 max-w-5xl w-full p-8 flex flex-col md:flex-row items-center gap-16">
                
                <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] uppercase font-black tracking-widest rounded-full w-max mx-auto md:mx-0">
                    Core Engine
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Auditorías</span><br/>
                    Forenses
                  </h2>
                  <p className="text-sm font-medium text-nav-text leading-relaxed">
                    Nuestra tecnología central rastrea cada centavo invertido, detecta fugas de capital y crea protocolos de auditoría en tiempo real para blindar tus utilidades.
                  </p>
                  
                  <button 
                    onClick={goToNext}
                    className="button-premium px-8 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest w-max mx-auto md:mx-0 mt-4 shadow-xl shadow-emerald-500/20 flex items-center gap-3"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 relative w-full h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full" />
                  
                  <div className="w-full h-full relative flex items-center justify-center p-4 border border-glass-border bg-foreground/5 rounded-[2rem] overflow-hidden glassmorphism shadow-2xl">
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-64 h-80 bg-background border border-glass-border rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden"
                    >
                      <div className="w-full h-2 bg-foreground/5 rounded-full" />
                      <div className="w-3/4 h-2 bg-foreground/5 rounded-full" />
                      <div className="w-5/6 h-2 bg-foreground/5 rounded-full" />
                      
                      <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_#10b981]"
                      />

                      <div className="mt-auto">
                        <div className="flex items-end gap-2 h-16">
                           {[1, 2, 3, 4, 5].map((i) => (
                             <motion.div 
                               key={i}
                               animate={{ height: ["20%", "80%", "40%"] }}
                               transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                               className="flex-1 bg-emerald-500/50 rounded-t-sm"
                             />
                           ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* INTERSTITIAL — Feature Showcase for Widgets */}
          {machineState === "feature-widgets" && (
            <motion.div
              key="feature-widgets"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full min-h-screen flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl z-0" />
              
              <div className="relative z-10 max-w-5xl w-full p-8 flex flex-col md:flex-row items-center gap-16">
                
                {/* Text Context */}
                <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
                  <span className="px-3 py-1 bg-erani-purple/10 border border-erani-purple/30 text-erani-purple text-[10px] uppercase font-black tracking-widest rounded-full w-max mx-auto md:mx-0">
                    Nuevo Feature
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-erani-purple">Personaliza</span> tu<br/>
                    Firewall
                  </h2>
                  <p className="text-sm font-medium text-nav-text leading-relaxed">
                    Hemos integrado una **Biblioteca de Widgets Interactiva**. Ahora podrás adaptar tu Dashboard arrastrando módulos forenses, gráficos de flujo y alertas predictivas según las necesidades de tu agencia.
                  </p>
                  
                  <button 
                    onClick={goToNext}
                    className="button-premium px-8 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest w-max mx-auto md:mx-0 mt-4 shadow-xl shadow-erani-purple/20 flex items-center gap-3"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Animated Graphic */}
                <div className="flex-1 relative w-full h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-erani-purple/5 blur-[80px] rounded-full" />
                  
                  {/* Mock Dashboard Grid */}
                  <div className="w-full h-full relative grid grid-cols-2 gap-4 p-4 border border-glass-border bg-foreground/5 rounded-[2rem] overflow-hidden glassmorphism shadow-2xl">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="col-span-2 h-24 bg-background/50 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative"
                    >
                      <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500 to-emerald-500/20 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sankey Diagram</span>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="col-span-1 bg-background/50 rounded-xl border border-white/5 flex items-center justify-center relative"
                    >
                      <div className="w-12 h-12 rounded-full border-4 border-erani-coral/30 border-t-erani-coral animate-spin" />
                    </motion.div>
                    
                    {/* Floating Dragging Widget */}
                    <motion.div 
                      initial={{ x: 100, y: 100, opacity: 0, scale: 0.8, rotate: 5 }}
                      animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        damping: 12, 
                        stiffness: 100, 
                        delay: 0.8 
                      }}
                      className="absolute bottom-6 right-6 w-40 h-40 bg-background/80 backdrop-blur-xl border border-erani-purple shadow-2xl shadow-erani-purple/20 rounded-xl flex flex-col items-center justify-center gap-2 z-20"
                    >
                      <div className="p-2 bg-erani-purple/20 rounded-full">
                        <Target className="w-6 h-6 text-erani-purple" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-foreground mt-2">Widget Predictivo</span>
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-erani-blue rounded-full"
                      />
                    </motion.div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* INTERSTITIAL — Vistas y Herramientas */}
          {machineState === "feature-tools" && (
            <motion.div
              key="feature-tools"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full min-h-screen flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl z-0" />
              
              <div className="relative z-10 max-w-5xl w-full p-8 flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
                  <span className="px-3 py-1 bg-erani-blue/10 border border-erani-blue/30 text-erani-blue text-[10px] uppercase font-black tracking-widest rounded-full w-max mx-auto md:mx-0">
                    Productividad
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-cyan-400">Vistas y</span><br/>
                    Herramientas
                  </h2>
                  <p className="text-sm font-medium text-nav-text leading-relaxed">
                    Accede a herramientas analíticas avanzadas, filtros predictivos y múltiples configuraciones de vista para un control absoluto sobre tu rentabilidad.
                  </p>
                  
                  <button 
                    onClick={goToNext}
                    className="button-premium px-8 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest w-max mx-auto md:mx-0 mt-4 shadow-xl shadow-erani-blue/20 flex items-center gap-3"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 relative w-full h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-erani-blue/5 blur-[80px] rounded-full" />
                  <div className="w-full h-full relative flex items-center justify-center p-4 border border-glass-border bg-foreground/5 rounded-[2rem] overflow-hidden glassmorphism shadow-2xl gap-4">
                    {/* Mock Sidebar Expansion */}
                    <motion.div 
                      initial={{ width: 20 }}
                      animate={{ width: 120 }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      className="h-full bg-background/50 border border-glass-border rounded-xl"
                    />
                    <div className="flex-1 h-full flex flex-col gap-4">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="h-16 bg-background/50 border border-glass-border rounded-xl w-full"
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex-1 bg-background/50 border border-glass-border rounded-xl w-full flex p-4 gap-4"
                      >
                         <div className="w-1/2 h-full bg-foreground/5 rounded-lg" />
                         <div className="w-1/2 h-full flex flex-col gap-2">
                           <div className="w-full h-8 bg-foreground/5 rounded-lg" />
                           <div className="w-full h-8 bg-foreground/5 rounded-lg" />
                           <div className="w-full h-8 bg-foreground/5 rounded-lg" />
                         </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* INTERSTITIAL — Agente Forense */}
          {machineState === "feature-agent" && (
            <motion.div
              key="feature-agent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full min-h-screen flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl z-0" />
              
              <div className="relative z-10 max-w-5xl w-full p-8 flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
                  <span className="px-3 py-1 bg-erani-coral/10 border border-erani-coral/30 text-erani-coral text-[10px] uppercase font-black tracking-widest rounded-full w-max mx-auto md:mx-0">
                    Inteligencia Artificial
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-erani-coral to-orange-500">Agente</span><br/>
                    Forense
                  </h2>
                  <p className="text-sm font-medium text-nav-text leading-relaxed">
                    Tu asistente de IA exclusivo. Hazle preguntas sobre tus datos, analiza discrepancias y genera resúmenes estratégicos al instante mediante comandos en lenguaje natural.
                  </p>
                  
                  <button 
                    onClick={goToNext}
                    className="button-premium px-8 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest w-max mx-auto md:mx-0 mt-4 shadow-xl shadow-erani-coral/20 flex items-center gap-3"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 relative w-full h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-erani-coral/5 blur-[80px] rounded-full" />
                  <div className="w-full h-full relative flex items-center justify-center p-8 border border-glass-border bg-foreground/5 rounded-[2rem] overflow-hidden glassmorphism shadow-2xl">
                    <div className="w-full h-full bg-background border border-glass-border rounded-xl flex flex-col p-4 gap-4 relative">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="self-end bg-erani-coral/20 border border-erani-coral/30 p-3 rounded-2xl rounded-tr-none w-3/4"
                      >
                        <div className="h-2 w-full bg-erani-coral/50 rounded-full" />
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="self-start bg-foreground/10 border border-glass-border p-3 rounded-2xl rounded-tl-none w-3/4 flex gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-erani-coral flex items-center justify-center animate-pulse" />
                        <div className="flex-1 flex flex-col gap-2 pt-1">
                          <div className="h-2 w-full bg-foreground/20 rounded-full" />
                          <div className="h-2 w-4/5 bg-foreground/20 rounded-full" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* INTERSTITIAL — Sesión Exploratoria */}
          {machineState === "feature-session" && (
            <motion.div
              key="feature-session"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full min-h-screen flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl z-0" />
              
              <div className="relative z-10 max-w-5xl w-full p-8 flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] uppercase font-black tracking-widest rounded-full w-max mx-auto md:mx-0">
                    Acompañamiento
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Sesión</span><br/>
                    Exploratoria
                  </h2>
                  <p className="text-sm font-medium text-nav-text leading-relaxed">
                    Tu plan incluye sesiones estratégicas 1 a 1. Agenda con un experto forense para interpretar tus primeros datos y optimizar la escalabilidad de tu agencia.
                  </p>
                  
                  <button 
                    onClick={goToNext}
                    className="button-premium px-8 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest w-max mx-auto md:mx-0 mt-4 shadow-xl shadow-amber-500/20 flex items-center gap-3"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 relative w-full h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-500/5 blur-[80px] rounded-full" />
                  <div className="w-full h-full relative flex items-center justify-center p-8 border border-glass-border bg-foreground/5 rounded-[2rem] overflow-hidden glassmorphism shadow-2xl">
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-48 h-48 bg-background border border-glass-border rounded-2xl flex flex-col items-center justify-center relative shadow-2xl shadow-amber-500/10"
                    >
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white border-4 border-background">
                        ✓
                      </div>
                      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3">
                         <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Agendada</span>
                      </div>
                      <div className="w-full h-10 bg-foreground/5 border-t border-glass-border flex items-center justify-center">
                         <span className="text-[8px] text-nav-text uppercase font-bold">Videollamada Activa</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* INTERSTITIAL — Feedback */}
          {machineState === "feature-feedback" && (
            <motion.div
              key="feature-feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full min-h-screen flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl z-0" />
              
              <div className="relative z-10 max-w-5xl w-full p-8 flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
                  <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/30 text-pink-500 text-[10px] uppercase font-black tracking-widest rounded-full w-max mx-auto md:mx-0">
                    Soporte Premium
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Feedback y</span><br/>
                    Soporte
                  </h2>
                  <p className="text-sm font-medium text-nav-text leading-relaxed">
                    ERANI es una plataforma viva. Usa nuestra herramienta de Feedback para reportar issues, votar por nuevas integraciones y dar forma al futuro de la plataforma.
                  </p>
                  
                  <button 
                    onClick={async () => {
                      // Clear internal tour so it fires on first dashboard visit
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('erani_tour_completed_dashboard');
                      }
                      await refreshProfile();
                      router.push('/dashboard');
                    }}
                    className="button-premium px-8 py-4 rounded-xl text-[10px] uppercase font-black tracking-widest w-max mx-auto md:mx-0 mt-4 shadow-xl shadow-pink-500/20 flex items-center gap-3"
                  >
                    Entrar a la Plataforma <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 relative w-full h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-pink-500/5 blur-[80px] rounded-full" />
                  <div className="w-full h-full relative flex items-center justify-center p-8 border border-glass-border bg-foreground/5 rounded-[2rem] overflow-hidden glassmorphism shadow-2xl">
                    <div className="flex gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                          className="w-10 h-10 flex items-center justify-center"
                        >
                          <svg className={`w-8 h-8 ${i <= 4 ? "text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" : "text-gray-600"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Org Creation (Req 2.2, 2.3) */}
          {(machineState === "step-1-org" || machineState === "step-done-1") && (
            <motion.div
              key="step-1-org"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full min-h-screen flex bg-background"
            >
              {/* Left Side: Form */}
              <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col gap-10 overflow-y-auto max-h-screen no-scrollbar relative z-10">
                {/* Header */}
                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Image src="/eanilogo.png" alt="ERANI" width={120} height={44} className="mb-2 logo-adaptive" />
                  </Link>
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-blue">Nivel 1: Organización</span>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-foreground leading-tight">
                    Crear Organización
                  </h1>
                  <p className="text-sm font-medium text-gray-500">
                    Configura los datos de tu agencia para comenzar.
                  </p>
                </div>

                <div className="flex flex-col gap-8">
                  {/* Org Name */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-erani-blue" /> Nombre de la Organización <span className="text-erani-coral">*</span>
                    </label>
                    <div className="relative group">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-erani-blue transition-colors" />
                      <input
                        type="text"
                        placeholder="Nombre de tu Agencia"
                        className="input-premium !pl-14"
                        value={formData.orgName}
                        onChange={(e) => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Sector + Team Size */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-erani-purple" /> Sector
                      </label>
                      <select
                        value={formData.sector}
                        onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                        className="select-premium"
                      >
                        <option value="">Selecciona</option>
                        <option value="tech">Marketing Tech</option>
                        <option value="creative">Agencia Creativa</option>
                        <option value="consulting">Consultoría</option>
                        <option value="ecommerce">E-Commerce</option>
                        <option value="finance">Finanzas</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4 text-erani-coral" /> Tamaño del Equipo
                      </label>
                      <select
                        value={formData.teamSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
                        className="select-premium"
                      >
                        <option value="1-10">1-10 pax</option>
                        <option value="11-50">11-50 pax</option>
                        <option value="50+">50+ pax</option>
                      </select>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-500" /> Logo de la Organización
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="w-20 h-20 rounded-[1.5rem] bg-black/5 dark:bg-white/5 border border-erani-blue/30 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-erani-blue dark:hover:border-erani-blue transition-colors group overflow-hidden relative">
                        {formData.logoBase64 ? (
                          <img src={formData.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-erani-blue transition-colors" />
                        )}
                        <input type="file" accept="image/png, image/jpeg" className="sr-only" onChange={handleImageUpload} />
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="button-premium px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer text-center">
                          Subir Logotipo
                          <input type="file" accept="image/png, image/jpeg" className="sr-only" onChange={handleImageUpload} />
                        </label>
                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">PNG, JPG hasta 5MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-erani-blue" /> Biografía de la Organización
                    </label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="textarea-premium rounded-[1.5rem]"
                      placeholder="Ej: Agencia boutique enfocada en retail con +20 clientes..."
                    />
                  </div>

                  {/* Goals */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Target className="w-4 h-4 text-erani-blue" /> Metas Principales
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {GOALS.map(goal => (
                        <button
                          key={goal}
                          type="button"
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

                  {/* Recovery Email */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" /> Email de Recuperación
                      <InfoTooltip text="Este email se usará para recuperar el acceso a tu organización si pierdes las credenciales de administrador. Usa un email al que siempre tengas acceso." />
                    </label>
                    <input
                      type="email"
                      value={formData.recoveryEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, recoveryEmail: e.target.value }))}
                      className="input-premium"
                      placeholder="email-respaldo@agencia.com"
                    />
                  </div>

                  {/* Error message */}
                  {step1Error && (
                    <div className="p-4 rounded-2xl bg-erani-coral/10 border border-erani-coral/30 text-erani-coral text-xs font-bold uppercase tracking-widest">
                      {step1Error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleCreateOrg}
                    disabled={!formData.orgName.trim() || isCreatingOrg}
                    className="button-premium w-full py-5 rounded-2xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-erani-blue/20 mt-2"
                  >
                    {isCreatingOrg ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Creando organización...
                      </>
                    ) : (
                      <>
                        Continuar <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Side: Decorative panel */}
              <div className="hidden md:flex w-1/2 bg-foreground/5 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-erani-blue/5 via-transparent to-erani-purple/5" />
                <div className="relative z-10 w-full max-w-lg p-10 flex flex-col gap-8">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glassmorphism p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl"
                  >
                    {/* ERANI logo */}
                    <div className="mb-8">
                      <Image src="/eanilogo.png" alt="ERANI" width={90} height={32} className="logo-adaptive opacity-60" />
                    </div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-erani-blue animate-pulse" />
                        <span className="text-[11px] uppercase font-black tracking-[0.2em] text-foreground">Organización ERANI</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-erani-blue/10 text-erani-blue text-[9px] font-black uppercase tracking-widest">
                        NIVEL 1
                      </div>
                    </div>
                    <div className="flex flex-col gap-6">
                      {[
                        { label: "Nombre", value: formData.orgName || "Tu Agencia", color: "text-erani-blue" },
                        { label: "Sector", value: formData.sector || "—", color: "text-erani-purple" },
                        { label: "Equipo", value: formData.teamSize, color: "text-erani-coral" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">{label}</span>
                          <span className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{value}</span>
                        </div>
                      ))}
                      {formData.goals.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                          {formData.goals.map(g => (
                            <span key={g} className="px-2 py-1 rounded-lg bg-erani-blue/10 text-erani-blue text-[8px] font-black uppercase tracking-widest">{g}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Infraestructura ERANI</span>
                        <div className="flex gap-1.5 h-4 items-end">
                          {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <motion.div key={i} animate={{ height: [4, 16, 8, 14, 4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }} className="w-1.5 bg-erani-blue rounded-full opacity-60" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          {(machineState === "syncing" || machineState === "syncing-2" || machineState === "syncing-3" || machineState === "syncing-final") && (
            <motion.div
              key={machineState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0E14]"
            >
              {/* Ambient glow blob — blue only */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-erani-blue/15 blur-[120px] pointer-events-none" />

              {/* Content */}
              <div className="relative flex flex-col items-center gap-12 z-10">
                {/* Single blue spinning ring + isologo */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "conic-gradient(from 0deg, transparent 0deg, #0055A0 120deg, transparent 270deg)",
                      WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px))",
                      mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px))",
                    }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <Image
                      src="/isologo.png"
                      alt="ERANI"
                      width={80}
                      height={80}
                      className="drop-shadow-[0_0_20px_rgba(0,85,160,0.6)]"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                  </motion.div>
                </div>

                {/* Text */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-white">
                    SINCRONIZANDO
                  </h2>
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.3em]"
                  >
                    {machineState === "syncing"       && "Registrando tu organización..."}
                    {machineState === "syncing-2"     && "Preparando tu entorno forense..."}
                    {machineState === "syncing-3"     && "Enviando invitaciones al equipo..."}
                    {machineState === "syncing-final" && "Finalizando configuración..."}
                  </motion.p>
                </div>

                {/* Animated dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                      className="w-2 h-2 rounded-full bg-erani-blue"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Forensic Environment */}
          {(machineState === "step-2-env" || machineState === "step-done-2") && (
            <motion.div
              key="step-2-env"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full min-h-screen flex bg-background"
            >
              {/* Left Side */}
              <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col gap-12 overflow-y-auto max-h-screen no-scrollbar relative z-10">
                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Image src="/eanilogo.png" alt="ERANI" width={120} height={44} className="mb-2 logo-adaptive" />
                  </Link>
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-purple">Nivel 2: Operación</span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-tight">Configura tu Entorno Forense</h2>
                  <p className="text-sm font-medium text-gray-500">Tu infraestructura de auditoría está siendo preparada. Revisa los parámetros operativos para tu recuperación de rentabilidad.</p>
                </div>

                {/* Feature highlights */}
                <div className="flex flex-col gap-4">
                  {[
                    { icon: <Search className="w-6 h-6 text-erani-blue" />, title: "Inferencia de Nivel 2", desc: "Triangulación de metadata operativa para detectar fugas de capital en tiempo real." },
                    { icon: <Zap className="w-6 h-6 text-erani-purple" />, title: "Auditoría con Erani Engine 1.5 Flash", desc: "Resultados de análisis forense en menos de 10 minutos." },
                    { icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />, title: "Aislamiento por Organización", desc: "Row Level Security garantiza que tus datos sean exclusivamente tuyos." },
                  ].map((item) => (
                    <div key={item.title} className="glassmorphism p-5 rounded-2xl border border-glass-border flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{item.icon}</div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase font-black tracking-widest text-foreground">{item.title}</span>
                        <span className="text-[11px] text-nav-text leading-relaxed">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* File Types Selection */}
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-foreground">Tipos de Archivos Auditados</span>
                    <span className="text-[11px] text-nav-text leading-relaxed">Selecciona los formatos de datos con los que trabajas principalmente.</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FILE_TYPES.map((ft) => {
                      const isSelected = formData.auditedFileTypes.includes(ft.id);
                      const Icon = ft.icon;
                      return (
                        <button
                          key={ft.id}
                          onClick={() => toggleFileType(ft.id)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                            isSelected 
                              ? "bg-erani-purple/10 border-erani-purple shadow-[0_0_15px_rgba(158,128,255,0.15)]" 
                              : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-400"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? "text-erani-purple" : "opacity-60"}`} />
                          <span className={`text-[10px] font-black tracking-widest uppercase ${isSelected ? "text-erani-purple" : ""}`}>
                            {ft.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 mt-auto">
                  <button
                    onClick={goBack}
                    className="px-6 py-5 rounded-2xl border border-white/10 text-gray-500 hover:text-foreground transition-colors bg-white/5"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="button-premium flex-1 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4"
                  >
                    Siguiente Fase: Mi Equipo <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right Side: Animations — preserved exactly */}
              <div className="hidden md:flex w-1/2 bg-foreground/5 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-erani-blue/5 via-transparent to-erani-purple/5" />
                <div className="relative z-10 w-full max-w-lg p-10 flex flex-col gap-8">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glassmorphism p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl"
                  >
                    {/* ERANI logo */}
                    <div className="mb-8">
                      <Image src="/eanilogo.png" alt="ERANI" width={90} height={32} className="logo-adaptive opacity-60" />
                    </div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-erani-blue animate-pulse" />
                        <span className="text-[11px] uppercase font-black tracking-[0.2em] text-foreground">Auditoría en Tiempo Real</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-erani-blue/10 text-erani-blue text-[9px] font-black uppercase tracking-widest">TRL-4 ACTIVE</div>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div animate={{ width: ["0%", "92%", "88%", "98%"] }} transition={{ duration: 12, repeat: Infinity }} className="h-full bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral shadow-[0_0_15px_rgba(158,128,255,0.5)]" />
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
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Inferencia Erani Engine 1.5 Flash</span>
                        <div className="flex gap-1.5 h-4 items-end">
                          {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <motion.div key={i} animate={{ height: [4, 16, 8, 14, 4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }} className="w-1.5 bg-erani-purple rounded-full opacity-60" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Team Invite (Req 2.5, 2.6, 2.12) */}
          {(machineState === "step-3-team" || machineState === "step-done-3") && (
            <motion.div
              key="step-3-team"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full min-h-screen flex bg-background"
            >
              {/* Left Side: Form */}
              <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col gap-10 overflow-y-auto max-h-screen no-scrollbar relative z-10">
                {/* Header */}
                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Image src="/eanilogo.png" alt="ERANI" width={120} height={44} className="mb-2 logo-adaptive" />
                  </Link>
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-purple">Nivel 3: Colaboración</span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-tight">
                    Invitar Equipo
                  </h2>
                  <p className="text-sm font-medium text-gray-500">
                    Agrega hasta 4 miembros a tu organización. Puedes omitir este paso.
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Member limit label + tooltip */}
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4 text-erani-purple" />
                      Miembros Invitados ({formData.members.length}/{MAX_INVITES})
                      <InfoTooltip text="Tu plan incluye hasta 5 miembros por organización, incluyendo al administrador. Puedes invitar un máximo de 4 personas adicionales." />
                    </label>
                    <button
                      type="button"
                      onClick={addMember}
                      disabled={formData.members.length >= MAX_INVITES}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-erani-purple/10 border border-erani-purple/30 text-erani-purple text-[10px] font-black uppercase tracking-widest hover:bg-erani-purple/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>

                  {/* Member rows */}
                  {formData.members.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white/5 dark:bg-white/3 border border-dashed border-white/20 dark:border-white/10 flex flex-col items-center gap-3 text-center">
                      <Users className="w-8 h-8 text-erani-purple opacity-40" />
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                        Sin invitados aún — haz clic en "Agregar" para comenzar
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {formData.members.map((member, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="glassmorphism p-5 rounded-2xl border border-white/10 dark:border-white/5 flex flex-col gap-4"
                        >
                          {/* Row header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-erani-purple">
                              Miembro {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-erani-coral hover:bg-erani-coral/10 transition-colors"
                              aria-label="Eliminar miembro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Email */}
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-erani-purple transition-colors" />
                            <input
                              type="email"
                              placeholder="email@agencia.com"
                              value={member.email}
                              onChange={(e) => updateMember(index, "email", e.target.value)}
                              className="input-premium !pl-11 !py-3 text-sm"
                            />
                          </div>

                          {/* Profile type + Role */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Profile type toggle */}
                            <div className="flex flex-col gap-2">
                              <label className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400">
                                Tipo de Perfil
                              </label>
                              <div className="flex rounded-xl overflow-hidden border border-white/10 dark:border-white/5">
                                <button
                                  type="button"
                                  onClick={() => updateMember(index, "profile_type", "member")}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors ${
                                    member.profile_type === "member"
                                      ? "bg-erani-purple text-white"
                                      : "bg-white/5 text-gray-500 hover:bg-white/10"
                                  }`}
                                >
                                  <UserCheck className="w-3 h-3" /> Miembro
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateMember(index, "profile_type", "admin")}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors ${
                                    member.profile_type === "admin"
                                      ? "bg-erani-blue text-white"
                                      : "bg-white/5 text-gray-500 hover:bg-white/10"
                                  }`}
                                >
                                  <UserCog className="w-3 h-3" /> Admin
                                </button>
                              </div>
                            </div>

                            {/* Role */}
                            <div className="flex flex-col gap-2">
                              <label className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400">
                                Rol (opcional)
                              </label>
                              <div className="relative group">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-erani-purple transition-colors" />
                                <input
                                  type="text"
                                  placeholder="Ej: Marketing Lead"
                                  value={member.role}
                                  onChange={(e) => updateMember(index, "role", e.target.value)}
                                  className="input-premium !pl-9 !py-2.5 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Limit warning */}
                  {formData.members.length >= MAX_INVITES && (
                    <div className="p-3 rounded-xl bg-erani-coral/10 border border-erani-coral/20 text-erani-coral text-[10px] font-bold uppercase tracking-widest text-center">
                      Límite alcanzado — máximo {MAX_INVITES} invitados
                    </div>
                  )}

                  {/* Error */}
                  {step3Error && (
                    <div className="p-4 rounded-2xl bg-erani-coral/10 border border-erani-coral/30 text-erani-coral text-xs font-bold uppercase tracking-widest">
                      {step3Error}
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-4 mt-auto">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-6 py-5 rounded-2xl border border-white/10 text-gray-500 hover:text-foreground transition-colors bg-white/5"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleInviteTeam}
                    disabled={isInviting}
                    className="button-premium flex-1 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Invitando...
                      </>
                    ) : (
                      <>
                        {formData.members.length === 0 ? "Omitir" : "Confirmar Invitaciones"} <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Side: Decorative panel */}
              <div className="hidden md:flex w-1/2 bg-foreground/5 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-erani-purple/5 via-transparent to-erani-blue/5" />
                <div className="relative z-10 w-full max-w-lg p-10 flex flex-col gap-8">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glassmorphism p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl"
                  >
                    {/* ERANI logo */}
                    <div className="mb-8">
                      <Image src="/eanilogo.png" alt="ERANI" width={90} height={32} className="logo-adaptive opacity-60" />
                    </div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-erani-purple animate-pulse" />
                        <span className="text-[11px] uppercase font-black tracking-[0.2em] text-foreground">Equipo ERANI</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-erani-purple/10 text-erani-purple text-[9px] font-black uppercase tracking-widest">NIVEL 3</div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-erani-blue/10 border border-erani-blue/20">
                        <div className="w-9 h-9 rounded-xl bg-erani-blue/20 flex items-center justify-center">
                          <UserCog className="w-4 h-4 text-erani-blue" />
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue">Administrador</span>
                          <span className="text-[9px] text-gray-400 truncate">{formData.adminEmail || "tú"}</span>
                        </div>
                        <span className="text-[8px] uppercase font-black tracking-widest text-erani-blue bg-erani-blue/10 px-2 py-1 rounded-lg">Admin</span>
                      </div>
                      {formData.members.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 rounded-2xl bg-erani-purple/10 border border-erani-purple/20">
                          <div className="w-9 h-9 rounded-xl bg-erani-purple/20 flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-erani-purple" />
                          </div>
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-erani-purple truncate">{m.email || `Miembro ${i + 1}`}</span>
                            <span className="text-[9px] text-gray-400">{m.role || "Sin rol asignado"}</span>
                          </div>
                          <span className={`text-[8px] uppercase font-black tracking-widest px-2 py-1 rounded-lg ${m.profile_type === "admin" ? "text-erani-blue bg-erani-blue/10" : "text-erani-purple bg-erani-purple/10"}`}>{m.profile_type}</span>
                        </motion.div>
                      ))}
                      {Array.from({ length: MAX_INVITES - formData.members.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-white/10 dark:border-white/5 opacity-40">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-[9px] uppercase font-black tracking-widest text-gray-500">Slot disponible</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">{formData.members.length + 1} / 5 miembros</span>
                      <div className="flex gap-1.5 h-4 items-end">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`w-2 rounded-full transition-all duration-300 ${i <= formData.members.length + 1 ? "h-4 bg-erani-purple" : "h-1.5 bg-white/10"}`} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Admin Account (Req 2.7, 2.8, 2.9) */}
          {machineState === "step-4-account" && (
            <motion.div
              key="step-4-account"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full min-h-screen flex bg-background"
            >
              {/* Left Side: Form */}
              <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col gap-10 overflow-y-auto max-h-screen no-scrollbar relative z-10">
                {/* Header */}
                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Image src="/eanilogo.png" alt="ERANI" width={120} height={44} className="mb-2 logo-adaptive" />
                  </Link>
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-coral">Nivel 4: Cuenta</span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-tight">
                    Crea tu Acceso
                  </h2>
                  <p className="text-sm font-medium text-gray-500">
                    Define las credenciales con las que ingresarás a tu organización.
                  </p>
                </div>

                <div className="flex flex-col gap-8">
                  {/* Full Name */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-erani-coral" /> Tu Nombre Completo <span className="text-erani-coral">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: María García"
                      className="input-premium"
                      value={formData.adminFullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminFullName: e.target.value }))}
                      autoComplete="name"
                    />
                  </div>

                  {/* Role */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-erani-coral" /> Tu Rol en la Organización
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Director General, CEO, Marketing Lead"
                      className="input-premium"
                      value={formData.adminRole}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminRole: e.target.value }))}
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-erani-coral" /> Email de Acceso <span className="text-erani-coral">*</span>
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-erani-coral transition-colors" />
                      <input
                        type="email"
                        placeholder="admin@tuagencia.com"
                        className="input-premium !pl-14"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-erani-coral" /> Contraseña <span className="text-erani-coral">*</span>
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-erani-coral transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        className="input-premium !pl-14 !pr-14"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-erani-coral transition-colors"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={formData.adminPassword} />
                  </div>

                  {/* Error message */}
                  {step4Error && (
                    <div className="p-4 rounded-2xl bg-erani-coral/10 border border-erani-coral/30 text-erani-coral text-xs font-bold uppercase tracking-widest">
                      {step4Error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={!formData.adminEmail.trim() || !formData.adminPassword || !formData.adminFullName.trim() || isCreatingAccount}
                    className="button-premium w-full py-5 rounded-2xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-erani-coral/20 mt-2"
                  >
                    {isCreatingAccount ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Creando cuenta...
                      </>
                    ) : (
                      <>
                        Finalizar Configuración <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Back button */}
                <div className="flex gap-4 mt-auto">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isCreatingAccount}
                    className="px-6 py-5 rounded-2xl border border-white/10 text-gray-500 hover:text-foreground transition-colors bg-white/5 disabled:opacity-40"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1" />
                </div>
              </div>

              {/* Right Side: Decorative panel */}
              <div className="hidden md:flex w-1/2 bg-foreground/5 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-erani-coral/5 via-transparent to-erani-purple/5" />
                <div className="relative z-10 w-full max-w-lg p-10 flex flex-col gap-8">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glassmorphism p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl"
                  >
                    {/* ERANI logo */}
                    <div className="mb-8">
                      <Image src="/eanilogo.png" alt="ERANI" width={90} height={32} className="logo-adaptive opacity-60" />
                    </div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-erani-coral animate-pulse" />
                        <span className="text-[11px] uppercase font-black tracking-[0.2em] text-foreground">Tu Acceso</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-erani-coral/10 text-erani-coral text-[9px] font-black uppercase tracking-widest">
                        NIVEL 4
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      {/* Name preview */}
                      {formData.adminFullName && (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-erani-coral/10 border border-erani-coral/20">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-erani-coral/20 flex items-center justify-center">
                              <UserCog className="w-4 h-4 text-erani-coral" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] uppercase font-black tracking-widest text-erani-coral">Administrador</span>
                              <span className="text-[10px] text-gray-400 truncate max-w-[160px]">{formData.adminFullName}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Role preview */}
                      {formData.adminRole && (
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Rol</span>
                          <span className="text-[11px] font-black uppercase tracking-widest text-erani-purple truncate max-w-[160px]">{formData.adminRole}</span>
                        </div>
                      )}

                      {/* Email preview */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Email</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[160px]">{formData.adminEmail || "admin@tuagencia.com"}</span>
                      </div>

                      {/* Org preview */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Organización</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-erani-blue truncate max-w-[160px]">{formData.orgName || "—"}</span>
                      </div>

                      {/* Password strength preview */}
                      {formData.adminPassword && (
                        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                          <span className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400">Seguridad de Contraseña</span>
                          <PasswordStrengthIndicator password={formData.adminPassword} />
                        </div>
                      )}
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Cifrado ERANI</span>
                        <div className="flex gap-1.5 h-4 items-end">
                          {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 16, 8, 14, 4] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                              className="w-1.5 bg-erani-coral rounded-full opacity-60"
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

          {/* SUCCESS — Success_Screen (Req 2.10, 10.3) */}
          {machineState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-3xl glassmorphism p-12 md:p-16 flex flex-col items-center text-center gap-10 relative z-10 overflow-hidden m-6 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
            >
              {/* Decorative glows */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-erani-blue/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-erani-purple/10 blur-[80px] rounded-full pointer-events-none" />

              {/* Logo */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Image src="/eanilogo.png" alt="ERANI" width={220} height={80} className="mb-2 logo-adaptive" />
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col gap-4"
              >
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground leading-tight">
                  Bienvenido a la Era de la <br />
                  <span className="text-gradient-brand">Rentabilidad Asegurada</span>
                </h1>
                <p className="text-base font-bold text-gray-500 italic">
                  Gracias por crear tu cuenta.
                </p>
              </motion.div>

              {/* Modulos completados */}
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {[
                  { label: "1. Organización" },
                  { label: "2. Entorno" },
                  { label: "3. Equipo" },
                  { label: "4. Cuenta" },
                ].map((step, i) => {
                  const isActive = successAnimationStep > i;
                  const isCurrent = successAnimationStep === i;
                  
                  return (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                        : isCurrent
                        ? 'bg-erani-blue/10 border-erani-blue/30 shadow-[0_0_15px_rgba(0,85,160,0.2)] scale-105'
                        : 'bg-white/5 border-white/10 opacity-50'
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none"
                      />
                    )}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ 
                        scale: isActive ? 1 : isCurrent ? 1.2 : 0.8, 
                        opacity: isActive || isCurrent ? 1 : 0.5,
                        rotate: isActive ? 0 : isCurrent ? [0, 10, -10, 0] : 0
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 1.5, ease: "linear" },
                        type: "spring", stiffness: 200 
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-emerald-500/20 text-emerald-500' : 
                        isCurrent ? 'bg-erani-blue/20 text-erani-blue' : 
                        'bg-white/10 text-gray-500'
                      }`}
                    >
                      {isActive ? <ShieldCheck className="w-5 h-5" /> : 
                       isCurrent ? <div className="w-4 h-4 border-2 border-erani-blue border-t-transparent rounded-full animate-spin" /> :
                       <div className="w-2 h-2 rounded-full bg-gray-500" />}
                    </motion.div>
                    <span className={`text-[10px] uppercase font-black tracking-widest ${
                      isActive ? 'text-emerald-500' : isCurrent ? 'text-erani-blue' : 'text-gray-500'
                    }`}>{step.label}</span>
                  </motion.div>
                )})}
              </div>

              {/* Confirmation Status & CTA wrapper (Staggered after blocks) */}
              <AnimatePresence>
                {successAnimationStep >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full flex flex-col gap-6 mt-4"
                  >
                    {/* Confirmation Status */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border ${isEmailConfirmed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-erani-coral/10 border-erani-coral/30'}`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        {isEmailConfirmed ? (
                          <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-erani-coral/20 flex items-center justify-center shrink-0">
                            <span className="text-erani-coral font-black text-lg">!</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-widest text-foreground">
                            {isEmailConfirmed ? "Cuenta Confirmada" : "Cuenta pendiente de confirmar"}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 mt-1">
                            {isEmailConfirmed 
                              ? "Tu correo ha sido verificado exitosamente. Ya puedes acceder a tu organización."
                              : `Hemos enviado un correo desde Supabase a ${formData.adminEmail}. Da click en el enlace para confirmar (esta ventana se actualizará sola cuando confirmes).`}
                          </span>
                        </div>
                      </div>
                      {isEmailConfirmed && (
                        <span className="text-[9px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg shrink-0 hidden sm:block">
                          Listo
                        </span>
                      )}
                    </motion.div>

                    {/* CTA */}
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      onClick={async () => {
                        // Always advance to the feature tour, regardless of email confirmation status
                        if (isEmailConfirmed) {
                          await refreshProfile();
                        }
                        goToNext();
                      }}
                      className="button-premium w-full py-6 rounded-2xl text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl shadow-erani-blue/20"
                    >
                      {isEmailConfirmed ? "Comenzar Recorrido" : "Continuar"} <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating Meta Logs */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-2 opacity-10 font-mono text-[8px] text-erani-blue hidden lg:flex">
        <span>[PROT] SYSTEM READY...</span>
        <span>[AUTH] HANDSHAKE COMPLETE.</span>
        <span>[TRL4] INFRASTRUCTURE VERIFIED.</span>
      </div>

      <OnboardingModal
        isOpen={false}
        onClose={() => router.push('/dashboard')}
      />

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-8 bg-black/70 backdrop-blur-md border-t border-white/5">
        <span className="text-[8px] uppercase font-black tracking-widest text-white/30">v0.1.0 ERANI BETA</span>
        <div className="flex items-center gap-6">
          <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-colors">Aviso de Privacidad</a>
          <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-colors">Términos y Condiciones</a>
          <a href="mailto:soporte@erani.mx" className="text-[8px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-colors">Soporte</a>
          <span className="text-white/10">|</span>
          <a href="https://erani.mx" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-erani-blue/50 hover:text-erani-blue transition-colors">erani.mx</a>
        </div>
      </footer>
    </main>
  );
}

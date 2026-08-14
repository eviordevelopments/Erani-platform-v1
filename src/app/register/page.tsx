"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Building2, UserCircle2, ArrowRight, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import TopRightActions from "@/components/TopRightActions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Sun, Moon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import PrivacyModal from "@/components/PrivacyModal";
import DataTransparencyCard from "@/components/DataTransparencyCard";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { loginAction } from "../login/actions";

// ─── State Machine ────────────────────────────────────────────────────────────
// Member Join Flow: welcome → option-select → option-a-login | option-b-lookup
//                  → member-welcome → profile-setup → syncing → success
// Requirements: 3.1, 3.2

type MemberState =
  | "welcome"
  | "option-select"
  | "option-a-login"
  | "option-b-lookup"
  | "member-welcome"
  | "profile-setup"
  | "syncing"
  | "success";

// Linear order used for simple back/forward navigation.
// Note: option-a-login and option-b-lookup are parallel branches;
// the actual branch taken is stored in formData.selectedOption.
const STATE_ORDER: MemberState[] = [
  "welcome",
  "option-select",
  "option-b-lookup",   // default branch (Option B)
  "member-welcome",
  "profile-setup",
  "syncing",
  "success",
];

// ─── Form Data ────────────────────────────────────────────────────────────────
// Unified form state — preserved across all state transitions (Req 2.13 pattern)

type SelectedOption = "a" | "b" | null;

interface LookupResult {
  org: {
    id: string;
    name: string;
    logo_url: string | null;
    plan: string;
  };
  member: {
    email: string;
    profile_type: "admin" | "member";
    role: string | null;
    verified: boolean;
  };
}

interface MemberFormData {
  // Welcome
  privacyAccepted: boolean;
  // Option select
  selectedOption: SelectedOption;
  // Option A — login
  loginEmail: string;
  loginPassword: string;
  // Option B — lookup
  lookupEmail: string;
  lookupOrgName: string;
  // Lookup result (populated after successful lookup)
  lookupResult: LookupResult | null;
  // Profile setup
  displayName: string;
  bio: string;
  password: string;
}

const INITIAL_FORM_DATA: MemberFormData = {
  privacyAccepted: false,
  selectedOption: null,
  loginEmail: "",
  loginPassword: "",
  lookupEmail: "",
  lookupOrgName: "",
  lookupResult: null,
  displayName: "",
  bio: "",
  password: "",
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function Register() {
  // ── State machine ──────────────────────────────────────────────────────────
  const [machineState, setMachineState] = useState<MemberState>("welcome");

  // ── Unified form state ─────────────────────────────────────────────────────
  const [formData, setFormData] = useState<MemberFormData>(INITIAL_FORM_DATA);

  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { refreshProfile } = useAuth();

  // ── Navigation helpers ─────────────────────────────────────────────────────

  /** Advance to the next state in the linear order */
  const goToNext = () => {
    const idx = STATE_ORDER.indexOf(machineState);
    if (idx < STATE_ORDER.length - 1) {
      setMachineState(STATE_ORDER[idx + 1]);
    }
  };

  /** Go back, skipping syncing states */
  const goBack = () => {
    const idx = STATE_ORDER.indexOf(machineState);
    let prevIdx = idx - 1;
    while (prevIdx > 0 && STATE_ORDER[prevIdx] === "syncing") {
      prevIdx--;
    }
    if (prevIdx >= 0) {
      setMachineState(STATE_ORDER[prevIdx]);
    }
  };

  /** Navigate to a specific state */
  const goTo = (state: MemberState) => setMachineState(state);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const updateForm = (patch: Partial<MemberFormData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 pb-10">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral z-50" />

      {/* Purple background blobs — always visible */}
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-erani-purple/15 blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] rounded-full bg-erani-blue/8 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-erani-purple/10 blur-[120px] pointer-events-none" />

      {/* Theme Toggle & Accessibility */}
      <TopRightActions />

      {/* Animated background for success state */}
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
                scale: [1, 1.1, 1],
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

      {/* ── State Machine Screens ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ── WELCOME — Req 3.1 ───────────────────────────────────────────── */}
        {machineState === "welcome" && (
          <WelcomeScreen
            privacyAccepted={formData.privacyAccepted}
            onPrivacyChange={(v) => updateForm({ privacyAccepted: v })}
            onContinue={goToNext}
          />
        )}

        {/* ── OPTION SELECT — Req 3.2 ─────────────────────────────────────── */}
        {machineState === "option-select" && (
          <OptionSelectScreen
            onSelectA={() => { updateForm({ selectedOption: "a" }); goTo("option-a-login"); }}
            onSelectB={() => { updateForm({ selectedOption: "b" }); goTo("option-b-lookup"); }}
            onBack={goBack}
          />
        )}

        {/* ── OPTION A LOGIN — Req 3.2 ────────────────────────────────────── */}
        {machineState === "option-a-login" && (
          <OptionALoginScreen
            email={formData.loginEmail}
            password={formData.loginPassword}
            onEmailChange={(v) => updateForm({ loginEmail: v })}
            onPasswordChange={(v) => updateForm({ loginPassword: v })}
            onBack={() => goTo("option-select")}
          />
        )}

        {/* ── OPTION B LOOKUP — Req 3.3, 3.4, 3.5, 3.10 ──────────────────── */}
        {machineState === "option-b-lookup" && (
          <OptionBLookupScreen
            email={formData.lookupEmail}
            orgName={formData.lookupOrgName}
            onEmailChange={(v) => updateForm({ lookupEmail: v })}
            onOrgNameChange={(v) => updateForm({ lookupOrgName: v })}
            onBack={() => goTo("option-select")}
            onSuccess={(result) => {
              updateForm({ 
                lookupResult: result,
                loginEmail: result.member.email
              });
              if (result.member.verified) {
                // Ya tiene cuenta → debe iniciar sesión con "Ya tengo cuenta"
                goTo("option-a-login");
              } else {
                // Primera vez → flujo de bienvenida y configuración de perfil
                goTo("member-welcome");
              }
            }}
          />
        )}

        {/* ── MEMBER WELCOME — Req 3.6 ────────────────────────────────────── */}
        {machineState === "member-welcome" && (
          <MemberWelcomeScreen
            lookupResult={formData.lookupResult}
            onContinue={goToNext}
          />
        )}

        {/* ── PROFILE SETUP — Req 3.7, 3.8, 3.9 ──────────────────────────── */}
        {machineState === "profile-setup" && (
          <ProfileSetupScreen
            displayName={formData.displayName}
            bio={formData.bio}
            password={formData.password}
            lookupResult={formData.lookupResult}
            onDisplayNameChange={(v) => updateForm({ displayName: v })}
            onBioChange={(v) => updateForm({ bio: v })}
            onPasswordChange={(v) => updateForm({ password: v })}
            onSuccess={() => goTo("syncing")}
            onSyncDone={() => goTo("success")}
            refreshProfile={refreshProfile}
          />
        )}

        {/* ── SYNCING — Req 10.1 (Sincronizando_Screen) ───────────────────── */}
        {machineState === "syncing" && (
          <motion.div
            key="syncing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0E14]"
          >
            {/* Ambient glow blobs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-erani-blue/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-erani-purple/10 blur-[100px] pointer-events-none" />

            {/* Glassmorphism card */}
            <div className="relative flex flex-col items-center gap-12 glassmorphism px-20 py-16 rounded-[3rem] border border-white/10 shadow-2xl z-10">
              {/* Spinning border + isologo */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer spinning ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, #0055A0 90deg, #9e80ff 180deg, transparent 270deg)",
                    WebkitMask:
                      "radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px))",
                  }}
                />
                {/* Inner glow ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-3 rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 180deg, transparent 0deg, #9e80ff 90deg, #FF5C5C 180deg, transparent 270deg)",
                    WebkitMask:
                      "radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))",
                    opacity: 0.5,
                  }}
                />
                {/* Isologo */}
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
                    className="logo-adaptive drop-shadow-[0_0_20px_rgba(0,85,160,0.6)]"
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
                  Creando tu perfil...
                </motion.p>
              </div>

              {/* Animated dots */}
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
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

        {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
        {machineState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl glassmorphism p-16 flex flex-col items-center text-center gap-10 relative z-10 overflow-hidden m-6 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-erani-blue/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-erani-purple/10 blur-[80px] rounded-full pointer-events-none" />

            <Image
              src="/eanilogo.png"
              alt="ERANI"
              width={220}
              height={80}
              className="mb-6 logo-adaptive relative z-10"
            />

            <div className="flex flex-col gap-6 relative z-10">
              <h1 className="text-3xl font-black uppercase tracking-tight text-foreground leading-tight">
                ¡Bienvenido a{" "}
                <span className="text-erani-blue">
                  {formData.lookupResult?.org.name ?? "ERANI"}
                </span>
                !
              </h1>
              <p className="text-sm font-bold text-nav-text uppercase tracking-widest">
                Tu perfil ha sido creado exitosamente.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="button-premium w-full py-6 rounded-2xl text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl shadow-erani-blue/20 relative z-10"
            >
              Ir al Dashboard
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Floating meta logs — decorative */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-2 opacity-10 font-mono text-[8px] text-erani-blue hidden lg:flex">
        <span>[PROT] MEMBER FLOW READY...</span>
        <span>[AUTH] HANDSHAKE COMPLETE.</span>
        <span>[TRL4] INFRASTRUCTURE VERIFIED.</span>
      </div>

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

// ─── Sub-components ───────────────────────────────────────────────────────────

// ── WelcomeScreen — Req 3.1 ───────────────────────────────────────────────────

interface WelcomeScreenProps {
  privacyAccepted: boolean;
  onPrivacyChange: (v: boolean) => void;
  onContinue: () => void;
}

function WelcomeScreen({ privacyAccepted, onPrivacyChange, onContinue }: WelcomeScreenProps) {

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl glassmorphism p-10 flex flex-col gap-6 relative z-10 m-6 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl"
    >
      {/* Logo */}
      <div className="flex justify-center">
        <Image
          src="/eanilogo.png"
          alt="ERANI"
          width={200}
          height={72}
          className="logo-adaptive"
        />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-black uppercase text-foreground">
          Bienvenido a ERANI
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-nav-text">
          Plataforma de auditoría forense industrial
        </p>
      </div>

      {/* Data transparency */}
      <DataTransparencyCard />

      {/* Privacy checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-erani-blue flex-shrink-0"
        />
        <span className="text-[11px] text-nav-text leading-relaxed">
          He leído y acepto la{" "}
          <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-erani-blue hover:underline">
            Política de Privacidad y los Términos de Uso
          </a>
        </span>
      </label>

      {/* View full policy */}
      <a
        href="/TC_ERANI.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] uppercase tracking-widest font-black text-erani-blue hover:text-erani-purple transition-colors self-start"
      >
        Ver política completa
      </a>

      {/* Continue button */}
      <button
        onClick={onContinue}
        disabled={!privacyAccepted}
        className="button-premium w-full py-4 rounded-2xl text-xs uppercase tracking-[0.25em] font-black disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar
      </button>

      <PrivacyModal isOpen={false} onClose={() => {}} />
    </motion.div>
  );
}

// ── OptionSelectScreen — Req 3.2, 10.7 ───────────────────────────────────────

interface OptionSelectScreenProps {
  onSelectA: () => void;
  onSelectB: () => void;
  onBack: () => void;
}

function OptionSelectScreen({ onSelectA, onSelectB, onBack }: OptionSelectScreenProps) {
  return (
    <motion.div
      key="option-select"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl glassmorphism p-10 flex flex-col gap-6 relative z-10 m-6 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl"
    >
      <div className="flex justify-start mb-1">
        <Image src="/eanilogo.png" alt="ERANI" width={130} height={46} className="logo-adaptive" />
      </div>
      <h1 className="text-3xl font-black uppercase text-foreground">
        ¿Cómo quieres acceder?
      </h1>

      <div className="flex flex-col gap-4">
        {/* Option A */}
        <button
          onClick={onSelectA}
          className="cursor-pointer glassmorphism p-8 rounded-2xl border border-glass-border hover:border-erani-blue/50 transition-all flex flex-col gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <LogIn className="w-5 h-5 text-erani-blue flex-shrink-0" />
            <span className="text-sm font-black uppercase tracking-widest text-foreground">
              Ya tengo cuenta
            </span>
          </div>
          <p className="text-[11px] text-nav-text">
            Inicia sesión con tu email y contraseña
          </p>
        </button>

        {/* Option B */}
        <button
          onClick={onSelectB}
          className="cursor-pointer glassmorphism p-8 rounded-2xl border border-glass-border hover:border-erani-purple/50 transition-all flex flex-col gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-erani-purple flex-shrink-0" />
            <span className="text-sm font-black uppercase tracking-widest text-foreground">
              Soy nuevo miembro
            </span>
          </div>
          <p className="text-[11px] text-nav-text">
            Fui invitado por mi organización
          </p>
        </button>
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        className="text-[10px] uppercase tracking-widest font-black text-nav-text hover:text-foreground transition-colors flex items-center gap-2"
      >
        ← Volver
      </button>
    </motion.div>
  );
}

// ── OptionALoginScreen — Req 3.2 ──────────────────────────────────────────────

interface OptionALoginScreenProps {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onBack: () => void;
}

function OptionALoginScreen({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onBack,
}: OptionALoginScreenProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.session) {
        setError("Credenciales inválidas. Verifica tu email y contraseña.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="option-a-login"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl glassmorphism p-10 flex flex-col gap-6 relative z-10 m-6 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl"
    >
      <div className="flex justify-start mb-1">
        <Image src="/eanilogo.png" alt="ERANI" width={130} height={46} className="logo-adaptive" />
      </div>
      <h1 className="text-3xl font-black uppercase text-foreground">
        Iniciar Sesión
      </h1>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-foreground">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-5 py-4 rounded-2xl bg-foreground/5 border border-glass-border text-base text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 transition-colors"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-foreground">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="w-full px-5 py-4 rounded-2xl bg-foreground/5 border border-glass-border text-base text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 transition-colors pr-14"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-nav-text hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-500 font-bold">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !email || !password}
        className="button-premium w-full py-4 rounded-2xl text-xs uppercase tracking-[0.25em] font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Iniciar Sesión
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        className="text-[10px] uppercase tracking-widest font-black text-nav-text hover:text-foreground transition-colors flex items-center gap-2"
      >
        ← Volver
      </button>
    </motion.div>
  );
}

// ── OptionBLookupScreen — Req 3.3, 3.4, 3.5, 3.10 ────────────────────────────

interface OptionBLookupScreenProps {
  email: string;
  orgName: string;
  onEmailChange: (v: string) => void;
  onOrgNameChange: (v: string) => void;
  onBack: () => void;
  onSuccess: (result: LookupResult) => void;
}

function OptionBLookupScreen({
  email,
  orgName,
  onEmailChange,
  onOrgNameChange,
  onBack,
  onSuccess,
}: OptionBLookupScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup_member",
          email,
          org_name: orgName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al buscar la invitación.");
      } else {
        onSuccess(data as LookupResult);
      }
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="option-b-lookup"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl glassmorphism p-10 flex flex-col gap-6 relative z-10 m-6 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl"
    >
      <div className="flex justify-start mb-1">
        <Image src="/eanilogo.png" alt="ERANI" width={130} height={46} className="logo-adaptive" />
      </div>
      <h1 className="text-3xl font-black uppercase text-foreground">
        Unirme a mi Organización
      </h1>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-foreground">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-5 py-4 rounded-2xl bg-foreground/5 border border-glass-border text-base text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 transition-colors"
        />
      </div>

      {/* Org name */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-foreground">
          Nombre de la Organización
        </label>
        <input
          type="text"
          value={orgName}
          onChange={(e) => onOrgNameChange(e.target.value)}
          placeholder="Nombre exacto de tu organización"
          className="w-full px-5 py-4 rounded-2xl bg-foreground/5 border border-glass-border text-base text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-500 font-bold">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !email || !orgName}
        className="button-premium w-full py-4 rounded-2xl text-xs uppercase tracking-[0.25em] font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Buscar mi invitación
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        className="text-[10px] uppercase tracking-widest font-black text-nav-text hover:text-foreground transition-colors flex items-center gap-2"
      >
        ← Volver
      </button>
    </motion.div>
  );
}

// ── MemberWelcomeScreen — Req 3.6 ─────────────────────────────────────────────

interface MemberWelcomeScreenProps {
  lookupResult: LookupResult | null;
  onContinue: () => void;
}

function MemberWelcomeScreen({ lookupResult, onContinue }: MemberWelcomeScreenProps) {
  const displayRole = lookupResult?.member.role ?? "Miembro";
  const displayType =
    lookupResult?.member.profile_type === "admin" ? "Administrador" : "Miembro";

  return (
    <motion.div
      key="member-welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl glassmorphism p-10 flex flex-col gap-6 relative z-10 m-6 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl"
    >
      <div className="flex justify-start mb-1">
        <Image src="/eanilogo.png" alt="ERANI" width={130} height={46} className="logo-adaptive" />
      </div>
      <h1 className="text-3xl font-black uppercase text-foreground">
        ¡Te estábamos esperando!
      </h1>

      {/* Org name */}
      {lookupResult?.org.name && (
        <div className="glassmorphism px-5 py-4 rounded-2xl border border-glass-border">
          <p className="text-[10px] uppercase tracking-widest font-black text-nav-text mb-1">
            Organización
          </p>
          <p className="text-sm font-black text-foreground">{lookupResult.org.name}</p>
        </div>
      )}

      {/* Role & profile type */}
      <div className="flex gap-3">
        <div className="flex-1 glassmorphism px-5 py-4 rounded-2xl border border-glass-border">
          <p className="text-[10px] uppercase tracking-widest font-black text-nav-text mb-1">
            Tu rol
          </p>
          <p className="text-sm font-black text-foreground">{displayRole}</p>
        </div>
        <div className="flex-1 glassmorphism px-5 py-4 rounded-2xl border border-glass-border">
          <p className="text-[10px] uppercase tracking-widest font-black text-nav-text mb-1">
            Tipo de perfil
          </p>
          <p className="text-sm font-black text-foreground">{displayType}</p>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={onContinue}
        className="button-premium w-full py-4 rounded-2xl text-xs uppercase tracking-[0.25em] font-black"
      >
        Configurar mi perfil
      </button>
    </motion.div>
  );
}

// ── ProfileSetupScreen — Req 3.7, 3.8, 3.9 ───────────────────────────────────

interface ProfileSetupScreenProps {
  displayName: string;
  bio: string;
  password: string;
  lookupResult: LookupResult | null;
  onDisplayNameChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSuccess: () => void;
  onSyncDone: () => void;
  refreshProfile: () => Promise<void>;
}

function ProfileSetupScreen({
  displayName,
  bio,
  password,
  lookupResult,
  onDisplayNameChange,
  onBioChange,
  onPasswordChange,
  onSuccess,
  onSyncDone,
  refreshProfile,
}: ProfileSetupScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!lookupResult) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Backend handles everything: find/create auth user, set password,
      //    upsert profile, mark org_members.verified = true
      const res = await fetch("/api/auth/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_member_onboarding",
          email: lookupResult.member.email,
          organization_id: lookupResult.org.id,
          display_name: displayName,
          bio,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear tu cuenta.");
        setLoading(false);
        return;
      }

      // 2. Open client session with the password they just set
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: lookupResult.member.email,
        password,
      });
      if (signInError) {
        setError("Cuenta creada. Intenta ingresar desde 'Ya tengo cuenta'.");
        setLoading(false);
        return;
      }

      // 3. Create preferences (best-effort, non-blocking)
      fetch("/api/auth/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_user_preferences",
          user_id: data.user_id,
          organization_id: lookupResult.org.id,
        }),
      }).catch(() => {});

      // 4. Wait briefly for AuthContext.onAuthStateChange(SIGNED_IN) to fire
      //    so that fetchProfile has the valid session token before we call refreshProfile.
      await new Promise(r => setTimeout(r, 600));

      // 5. Refresh context → syncing → success
      await refreshProfile();
      onSuccess();
      setTimeout(() => { onSyncDone(); }, 2000);
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="profile-setup"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md glassmorphism p-8 flex flex-col gap-6 relative z-10 m-6 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl"
    >
      <h1 className="text-2xl font-black uppercase text-foreground">
        Configura tu Perfil
      </h1>

      {/* Display name */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-foreground">
          Nombre visible
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Tu nombre visible"
          className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-glass-border text-sm text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 transition-colors"
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-foreground">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Cuéntanos sobre ti..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-glass-border text-sm text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 transition-colors resize-none"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-foreground">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-glass-border text-sm text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-blue/50 transition-colors pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-nav-text hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <PasswordStrengthIndicator password={password} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-500 font-bold">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !displayName || !password}
        className="button-premium w-full py-4 rounded-2xl text-xs uppercase tracking-[0.25em] font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Crear mi cuenta
      </button>
    </motion.div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, Loader2, ArrowRight, ChevronLeft, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";

type Stage = "input" | "loading" | "success" | "error";

// ─── Welcome-to-ERANI-Beta animation screen ───────────────────────────────────
function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#050507] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      {/* Animated bg */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      {/* Orbiting rings */}
      {[1, 1.6, 2.2].map((scale, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-indigo-500/10"
          style={{ width: `${scale * 200}px`, height: `${scale * 200}px` }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 8 + i * 4, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        {/* Shield icon with pulsing glow */}
        <motion.div
          className="relative"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 14, delay: 0.3 }}
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <ShieldCheck className="w-14 h-14 text-white" strokeWidth={1.5} />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.4) 0%, transparent 70%)" }}
            animate={{ scale: [1, 2], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Suscripción Activada</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white leading-tight">
            Bienvenido a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-pulse">
              ERANI Beta
            </span>
          </h1>
          <p className="text-white/40 text-sm font-medium max-w-sm mx-auto leading-relaxed">
            Tu organización ahora tiene acceso completo al Firewall de Rentabilidad con <strong className="text-white/60">100 ERIS</strong> activos.
          </p>
        </motion.div>

        {/* Features unlocked */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          {[
            { label: "100 ERIS Activos", sub: "Para toda tu organización" },
            { label: "Auditorías Ilimitadas", sub: "Motor forense L2 completo" },
            { label: "Agente AI Forense", sub: "Consultas sin restricción" },
          ].map((feat, i) => (
            <motion.div
              key={i}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1 text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.1 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-white uppercase tracking-wide">{feat.label}</span>
              </div>
              <span className="text-[10px] text-white/30 font-medium pl-5">{feat.sub}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading bar then redirect */}
        <motion.div
          className="flex flex-col items-center gap-3 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.8, ease: "easeInOut", delay: 1.2 }}
              onAnimationComplete={onComplete}
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
            Preparando tu dashboard...
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main activation page ─────────────────────────────────────────────────────
export default function SubscriptionActivatePage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [stage, setStage] = useState<Stage>("input");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Three separate inputs, one per segment
  const [seg1, setSeg1] = useState("");
  const [seg2, setSeg2] = useState("");
  const [seg3, setSeg3] = useState("");

  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);

  const handleSegmentChange = (
    val: string,
    setter: (v: string) => void,
    nextRef?: React.RefObject<HTMLInputElement>
  ) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
    setter(clean);
    if (clean.length === 4 && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    prevRef?: React.RefObject<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "" && prevRef?.current) {
      prevRef.current.focus();
    }
  };

  const isComplete = seg1.length === 4 && seg2.length === 4 && seg3.length === 4;
  const fullCode = `${seg1}-${seg2}-${seg3}`;

  const handleValidate = useCallback(async () => {
    if (!isComplete) return;
    setStage("loading");
    setErrorMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sesión no encontrada");

      const res = await fetch("/api/access-code/validate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Código inválido o ya utilizado");
      }

      // Refresh profile so org now shows paid_subscription=true and 100 ERIS
      await refreshProfile();
      setStage("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al validar el código";
      setErrorMsg(msg);
      setStage("error");
    }
  }, [isComplete, fullCode, refreshProfile]);

  // Called when the welcome animation finishes its loading bar
  const handleWelcomeComplete = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <>
      {/* Welcome animation overlay */}
      <AnimatePresence>
        {stage === "success" && <WelcomeScreen onComplete={handleWelcomeComplete} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-600/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-600/8 rounded-full blur-[100px]" />
        </div>

        <motion.div
          className="relative max-w-lg w-full"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-8"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          {/* Card */}
          <div className="bg-[#13141A] border border-white/[0.07] rounded-2xl p-8 md:p-10 relative overflow-hidden">
            {/* Gradient overlay inside card */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 pointer-events-none rounded-2xl" />

            <div className="relative z-10 flex flex-col gap-7">
              {/* Header */}
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                    Validar Suscripción
                  </h1>
                  <p className="text-sm text-white/40 font-medium mt-1 leading-relaxed">
                    Ingresa el código de activación que recibiste al correo de tu organización para activar <strong className="text-white/60">100 ERIS</strong> y el acceso completo a ERANI Beta.
                  </p>
                </div>
              </div>

              {/* Code input */}
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  Código de Activación
                </label>

                <div className="flex items-center gap-3 justify-center">
                  {/* Segment 1 */}
                  <input
                    ref={ref1}
                    value={seg1}
                    onChange={(e) => handleSegmentChange(e.target.value, setSeg1, ref2)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    maxLength={4}
                    placeholder="XXXX"
                    className={`w-24 h-14 text-center font-mono text-xl font-black tracking-[0.3em] uppercase bg-[#0B0C0E] border rounded-xl transition-all outline-none placeholder-white/10 text-indigo-300 ${
                      seg1.length === 4 ? "border-indigo-500/50" : "border-white/10 focus:border-indigo-500/40"
                    }`}
                    autoFocus
                  />

                  <span className="text-white/20 font-black text-2xl select-none">–</span>

                  {/* Segment 2 */}
                  <input
                    ref={ref2}
                    value={seg2}
                    onChange={(e) => handleSegmentChange(e.target.value, setSeg2, ref3)}
                    onKeyDown={(e) => handleKeyDown(e, ref1)}
                    maxLength={4}
                    placeholder="XXXX"
                    className={`w-24 h-14 text-center font-mono text-xl font-black tracking-[0.3em] uppercase bg-[#0B0C0E] border rounded-xl transition-all outline-none placeholder-white/10 text-indigo-300 ${
                      seg2.length === 4 ? "border-indigo-500/50" : "border-white/10 focus:border-indigo-500/40"
                    }`}
                  />

                  <span className="text-white/20 font-black text-2xl select-none">–</span>

                  {/* Segment 3 */}
                  <input
                    ref={ref3}
                    value={seg3}
                    onChange={(e) => handleSegmentChange(e.target.value, setSeg3)}
                    maxLength={4}
                    placeholder="XXXX"
                    className={`w-24 h-14 text-center font-mono text-xl font-black tracking-[0.3em] uppercase bg-[#0B0C0E] border rounded-xl transition-all outline-none placeholder-white/10 text-indigo-300 ${
                      seg3.length === 4 ? "border-indigo-500/50" : "border-white/10 focus:border-indigo-500/40"
                    }`}
                    onKeyDown={(e) => {
                      handleKeyDown(e, ref2);
                      if (e.key === "Enter" && isComplete) handleValidate();
                    }}
                  />
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2">
                  {[seg1, seg2, seg3].map((seg, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        seg.length === 4 ? "w-8 bg-indigo-500" : "w-4 bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                {/* Error */}
                {stage === "error" && errorMsg && (
                  <motion.div
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="flex-1">{errorMsg}</span>
                  </motion.div>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleValidate}
                disabled={!isComplete || stage === "loading"}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  isComplete && stage !== "loading"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01]"
                    : "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                }`}
              >
                {stage === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Validando...</>
                ) : (
                  <>Activar ERANI Beta <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Help */}
              <p className="text-center text-[10px] text-white/20 font-medium">
                ¿No recibiste el código?{" "}
                <a
                  href="mailto:diego.a182700@gmail.com"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                >
                  Contáctanos
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

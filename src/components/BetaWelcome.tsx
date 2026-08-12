"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import { ArrowRight, MessageSquare, Zap, Users, Star } from "lucide-react";

type Phase =
  | "boot"          // 0–1.2s: black screen + isologo fade-in
  | "pulse"         // 1.2–3.5s: logo pulses, rings expand
  | "reveal"        // 3.5–6.5s: ERANI wordmark types in, tagline appears
  | "scan"          // 6.5–9s: horizontal scan line + grid overlay
  | "transition"    // 9–10s: fade to beta screen
  | "beta"          // 10s+: beta welcome screen
  | "done";         // user clicked continue

const PHASE_TIMINGS: Record<string, number> = {
  boot: 0,
  pulse: 1200,
  reveal: 3500,
  scan: 6500,
  transition: 9000,
  beta: 10000,
};

interface BetaWelcomeProps {
  onDone: () => void;
}

export default function BetaWelcome({ onDone }: BetaWelcomeProps) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [typedText, setTypedText] = useState("");
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const ERANI = "ERANI";
  const TAGLINE = "Profitability Firewall v0.1.0 BETA";

  useEffect(() => {
    // Schedule phase transitions
    const phases: Phase[] = ["boot", "pulse", "reveal", "scan", "transition", "beta"];
    phases.forEach((p, i) => {
      if (i === 0) return;
      const t = setTimeout(() => setPhase(phases[i]), PHASE_TIMINGS[phases[i]]);
      timerRef.current.push(t);
    });

    return () => timerRef.current.forEach(clearTimeout);
  }, []);

  // Typewriter effect during "reveal" phase
  useEffect(() => {
    if (phase !== "reveal") return;
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(ERANI.slice(0, i + 1));
      i++;
      if (i >= ERANI.length) {
        clearInterval(interval);
        setTimeout(() => setTaglineVisible(true), 400);
      }
    }, 180);
    return () => clearInterval(interval);
  }, [phase]);

  // Scan line animation during "scan" phase
  useEffect(() => {
    if (phase !== "scan") return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setScanProgress(Math.min(progress, 100));
      if (progress >= 100) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <AnimatePresence mode="wait">
      {(phase === "boot" || phase === "pulse" || phase === "reveal" || phase === "scan" || phase === "transition") && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
          style={{ background: "#000" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* Ambient purple/blue glows */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(158,128,255,0.12) 0%, rgba(0,85,160,0.06) 50%, transparent 70%)" }}
            animate={phase === "pulse" || phase === "reveal" || phase === "scan"
              ? { scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }
              : { opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Grid overlay — appears in scan phase */}
          {(phase === "scan" || phase === "transition") && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.06 }}
              transition={{ duration: 0.5 }}
              style={{
                backgroundImage: "linear-gradient(rgba(158,128,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(158,128,255,0.5) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          )}

          {/* Scan line */}
          {phase === "scan" && (
            <motion.div
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{
                top: `${scanProgress}%`,
                background: "linear-gradient(90deg, transparent, rgba(0,85,160,0.8), rgba(158,128,255,1), rgba(0,85,160,0.8), transparent)",
                boxShadow: "0 0 20px rgba(158,128,255,0.8), 0 0 40px rgba(0,85,160,0.4)",
              }}
            />
          )}

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-10">

            {/* Spinning rings around isologo */}
            <div className="relative flex items-center justify-center">
              {/* Outer ring */}
              {(phase !== "boot") && (
                <motion.div
                  className="absolute rounded-full"
                  initial={{ width: 120, height: 120, opacity: 0 }}
                  animate={{ width: 200, height: 200, opacity: 0.6, rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear", opacity: { duration: 0.8 } }}
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0deg, #0055A0 90deg, #9e80ff 200deg, transparent 300deg)",
                    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))",
                    filter: "drop-shadow(0 0 8px rgba(0,85,160,0.8))",
                  }}
                />
              )}

              {/* Middle ring */}
              {(phase === "reveal" || phase === "scan" || phase === "transition") && (
                <motion.div
                  className="absolute rounded-full"
                  initial={{ width: 0, height: 0, opacity: 0 }}
                  animate={{ width: 260, height: 260, opacity: 0.4, rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear", width: { duration: 0.6 }, height: { duration: 0.6 }, opacity: { duration: 0.6 } }}
                  style={{
                    background: "conic-gradient(from 180deg, transparent 0deg, #9e80ff 120deg, transparent 240deg)",
                    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))",
                    filter: "drop-shadow(0 0 6px rgba(158,128,255,0.6))",
                  }}
                />
              )}

              {/* Isologo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={phase === "boot" ? { opacity: 0, scale: 0.6 } : { opacity: 1, scale: [1, 1.08, 1] }}
                transition={{ opacity: { duration: 0.8 }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 } }}
                style={{ filter: "drop-shadow(0 0 30px rgba(158,128,255,0.6)) brightness(0) invert(1)" }}
              >
                <Image src="/isologo.png" alt="ERANI" width={80} height={80} priority />
              </motion.div>
            </div>

            {/* ERANI wordmark typewriter */}
            {(phase === "reveal" || phase === "scan" || phase === "transition") && (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="flex gap-1 items-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {typedText.split("").map((char, i) => (
                    <motion.span
                      key={i}
                      className="text-7xl md:text-9xl font-black tracking-[0.15em] text-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ textShadow: "0 0 40px rgba(158,128,255,0.4)" }}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {/* Blinking cursor */}
                  {typedText.length < ERANI.length && (
                    <motion.span
                      className="text-7xl md:text-9xl font-black text-erani-purple"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.div>

                <AnimatePresence>
                  {taglineVisible && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] uppercase tracking-[0.5em] font-black text-erani-purple"
                    >
                      {TAGLINE}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── BETA WELCOME SCREEN ── */}
      {phase === "beta" && (
        <motion.div
          key="beta"
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#050710]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Background glows */}
          <div className="absolute -top-60 -right-60 w-[900px] h-[900px] rounded-full bg-erani-purple/10 blur-[200px] pointer-events-none" />
          <div className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full bg-erani-blue/8 blur-[180px] pointer-events-none" />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(158,128,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(158,128,255,1) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          <div className="relative z-10 w-full max-w-3xl mx-auto px-8 flex flex-col items-center gap-12 text-center">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Image src="/eanilogo.png" alt="ERANI" width={180} height={65} style={{ filter: "brightness(0) invert(1)" }} />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-erani-purple/40 bg-erani-purple/10"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-erani-purple"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[11px] uppercase font-black tracking-[0.4em] text-erani-purple">
                Primera Versión Pública — BETA v0.1.0
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="flex flex-col gap-4"
            >
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-[0.9]">
                Bienvenido a<br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #0055A0, #9e80ff, #0055A0)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    animation: "brand-glow 3s linear infinite",
                  }}
                >
                  ERANI Platform
                </span>
              </h1>
              <p className="text-lg text-white/60 font-medium leading-relaxed max-w-xl mx-auto">
                Estás entre los primeros en acceder al{" "}
                <span className="text-white font-black">Firewall de Rentabilidad Industrial</span>.
                Este es un lanzamiento beta exclusivo para desarrolladores y miembros fundadores.
              </p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75 }}
              className="w-full grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {[
                {
                  icon: Zap,
                  color: "text-erani-blue",
                  bg: "bg-erani-blue/10",
                  border: "border-erani-blue/20",
                  title: "Auditoría Forense",
                  desc: "Análisis con Erani Engine 1.5 Flash en menos de 10 minutos.",
                },
                {
                  icon: MessageSquare,
                  color: "text-erani-purple",
                  bg: "bg-erani-purple/10",
                  border: "border-erani-purple/20",
                  title: "Tu Opinión Importa",
                  desc: "Usa la página de Feedback para sugerir mejoras en tiempo real.",
                },
                {
                  icon: Users,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                  title: "Miembros Fundadores",
                  desc: "Acceso anticipado y prioridad en el roadmap del producto.",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.85 + i * 0.1 }}
                  className={`flex flex-col gap-3 p-5 rounded-2xl border ${card.border} ${card.bg} text-left`}
                >
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                  <div>
                    <p className="text-[11px] uppercase font-black tracking-widest text-white mb-1">{card.title}</p>
                    <p className="text-[11px] text-white/50 leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Feedback CTA note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-erani-purple/20 bg-erani-purple/5"
            >
              <Star className="w-4 h-4 text-erani-purple flex-shrink-0" />
              <p className="text-[11px] text-white/60 leading-relaxed">
                La página de{" "}
                <span className="text-erani-purple font-black">Feedback</span>{" "}
                es pública — cualquier persona puede enviar sugerencias y reportar errores sin necesidad de cuenta.
              </p>
            </motion.div>

            {/* CTA button */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              onClick={onDone}
              className="group relative px-16 py-5 rounded-2xl text-sm uppercase tracking-[0.3em] font-black text-white overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0055A0, #9e80ff)",
                boxShadow: "0 0 40px rgba(158,128,255,0.3), 0 4px 24px rgba(0,85,160,0.4)",
              }}
              whileHover={{ scale: 1.03, boxShadow: "0 0 60px rgba(158,128,255,0.5), 0 8px 32px rgba(0,85,160,0.5)" }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10 flex items-center gap-3">
                Entrar a ERANI <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            {/* Version */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 1.5 }}
              className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-black"
            >
              ERANI Platform · v0.1.0 Public Beta · {new Date().getFullYear()}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

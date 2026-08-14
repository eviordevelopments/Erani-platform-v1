"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, Users, Plus, CalendarCheck2, TrendingUp, ShieldCheck, Search, AlertTriangle, Sun, Moon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import InAppTour from "@/components/InAppTour";
import TopRightActions from "@/components/TopRightActions";
import { useTheme } from "@/context/ThemeContext";

// ── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 2) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

const entryOptions = [
  {
    id: "admin",
    icon: Building2,
    label: "Soy Administrador",
    sublabel: "de Organización",
    href: "/login",
    gradient: "from-erani-blue/20 to-transparent",
    hoverBorder: "border-erani-blue/60",
    iconColor: "text-erani-blue",
    glow: "rgba(0,85,160,0.18)",
  },
  {
    id: "member",
    icon: Users,
    label: "Soy Miembro",
    sublabel: "de Organización",
    href: "/register",
    gradient: "from-erani-purple/20 to-transparent",
    hoverBorder: "border-erani-purple/60",
    iconColor: "text-erani-purple",
    glow: "rgba(158,128,255,0.18)",
  },
  {
    id: "create",
    icon: Plus,
    label: "Crear Organización",
    sublabel: "Comienza ahora",
    href: "/onboarding",
    gradient: "from-erani-coral/20 to-transparent",
    hoverBorder: "border-erani-coral/60",
    iconColor: "text-erani-coral",
    glow: "rgba(255,92,92,0.14)",
  },
  {
    id: "demo",
    icon: CalendarCheck2,
    label: "Demo Personalizada",
    sublabel: "Agenda tu sesión",
    href: "/onboarding",
    gradient: "from-emerald-500/20 to-transparent",
    hoverBorder: "border-emerald-500/60",
    iconColor: "text-emerald-400",
    glow: "rgba(52,211,153,0.14)",
  },
];

export default function Hero() {
  const roi      = useCounter(85, 1.8);
  const savings  = useCounter(720, 2.2);
  const accuracy = useCounter(99, 1.5);
  const [hovered, setHovered] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  return (
    <section
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background"
      style={{ paddingBottom: "2.5rem" }}
    >
      {/* ── Theme Toggle & Accessibility ── */}
      <TopRightActions />

      {/* ── Background ambient glows ── */}
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-erani-purple/18 blur-[200px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 w-[700px] h-[700px] rounded-full bg-erani-blue/10 blur-[180px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-erani-purple/12 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full h-full px-6 lg:px-14 xl:px-20 flex items-center">
        
        {/* ── FLOATING BANNERS (Screen-Level) ── */}
        {/* Pink Area 1: Top Center-Left */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute top-[12%] left-[45%] hidden lg:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shadow-xl shadow-erani-blue/20 z-50"
        >
          <div className="w-10 h-10 rounded-full bg-erani-blue/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-erani-blue" />
          </div>
          <div className="flex flex-col">
            <span className="text-black dark:text-white text-sm font-bold">+ $1.2M</span>
            <span className="text-nav-text text-[9px] uppercase tracking-widest">Capital Recuperado</span>
          </div>
        </motion.div>

        {/* Pink Area 2: Top Right */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute top-[12%] right-[2%] hidden lg:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shadow-xl shadow-erani-purple/20 z-50"
        >
          <div className="w-10 h-10 rounded-full bg-erani-purple/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-erani-purple" />
          </div>
          <div className="flex flex-col">
            <span className="text-black dark:text-white text-sm font-bold">Inferencia Nivel 2</span>
            <span className="text-nav-text text-[9px] uppercase tracking-widest">Metadata Cruzada</span>
          </div>
        </motion.div>

        {/* Pink Area 3: Bottom Center-Right */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[38%] hidden lg:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shadow-xl shadow-erani-coral/20 z-50"
        >
          <div className="w-10 h-10 rounded-full bg-erani-coral/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-erani-coral" />
          </div>
          <div className="flex flex-col">
            <span className="text-black dark:text-white text-sm font-bold">100% Blindaje</span>
            <span className="text-nav-text text-[9px] uppercase tracking-widest">Prevención de Fuga</span>
          </div>
        </motion.div>

        {/* Pink Area 4: Bottom Right */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[8%] hidden lg:flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 z-50"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-black dark:text-white text-sm font-bold">Auditoría en tiempo real</span>
            <span className="text-nav-text text-[9px] uppercase tracking-widest">Protección Activa</span>
          </div>
        </motion.div>

        <div className="w-full grid lg:grid-cols-[1fr_600px] xl:grid-cols-[1fr_660px] gap-10 xl:gap-16 items-center">

          {/* ── LEFT ── */}
          <div className="flex flex-col gap-6 xl:gap-8 relative">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
              <Image src="/eanilogo.png" alt="ERANI" width={170} height={60} className="logo-adaptive" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-[clamp(3rem,6vw,6.5rem)] font-black uppercase tracking-tighter leading-[0.86] text-foreground relative z-10"
            >
              DETÉN LA{" "}
              <span className="relative inline-block">
                {/* Purple internal light flow */}
                <span
                  className="relative"
                  style={{
                    background: "linear-gradient(90deg, #7000FF 0%, #c084fc 40%, #9e80ff 60%, #7000FF 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    animation: "brand-glow 2.5s linear infinite",
                    fontWeight: 900,
                    textShadow: "none",
                    filter: "drop-shadow(0 0 18px rgba(158,128,255,0.5))",
                  }}
                >
                  FUGA
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full"
                  style={{ background: "linear-gradient(90deg, #9e80ff, transparent)" }}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.9, delay: 0.9 }}
                />
              </span>{" "}
              DE CAPITAL EN{" "}
              <span className="relative inline-block">
                {/* Blue internal light flow */}
                <span
                  className="relative"
                  style={{
                    background: "linear-gradient(90deg, #0055A0 0%, #4d9de0 40%, #0ea5e9 60%, #0055A0 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    animation: "brand-glow 2.5s linear infinite",
                    fontWeight: 900,
                    filter: "drop-shadow(0 0 18px rgba(0,85,160,0.5))",
                  }}
                >
                  21 DÍAS
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full"
                  style={{ background: "linear-gradient(90deg, #0055A0, transparent)" }}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.9, delay: 1.1 }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="text-[clamp(1rem,1.6vw,1.2rem)] text-nav-text max-w-2xl leading-relaxed font-medium relative z-10"
            >
              Ecosistema industrial que extrae la verdad operativa mediante{" "}
              <span className="text-foreground italic">Inferencia de Nivel 2</span>.
              Triangulamos tu metadata para eliminar la ceguera financiera.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-12 pt-3 border-t border-white/5 relative z-10"
            >
              {[
                { value: `${(roi / 10).toFixed(1)}x`, label: "ROI Garantizado", glow: "rgba(0,85,160,0.5)" },
                { value: `$${savings}k`,               label: "Ahorro Promedio", glow: "rgba(158,128,255,0.5)" },
                { value: `${accuracy}%`,               label: "Precisión Forense", glow: "rgba(52,211,153,0.5)" },
              ].map(({ value, label, glow }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span
                    className="text-[clamp(2.2rem,4.5vw,4rem)] font-semibold font-sans leading-none text-black dark:text-white tracking-tight"
                    style={{ textShadow: `0 0 20px ${glow}` }}
                  >
                    {value}
                  </span>
                  <span className="text-[clamp(0.6rem,0.8vw,0.7rem)] uppercase font-bold font-sans tracking-[0.2em] text-nav-text">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Entry Card ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="glassmorphism rounded-[2.5rem] border border-glass-border shadow-2xl shadow-erani-purple/15 flex flex-col gap-6 relative overflow-hidden p-10 xl:p-12"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-erani-blue/12 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-erani-purple/15 blur-[80px] rounded-full pointer-events-none" />

            {/* Logo inside card */}
            <div className="relative z-10">
              <Image src="/eanilogo.png" alt="ERANI" width={100} height={36} className="logo-adaptive" />
            </div>

            {/* Card header */}
            <div className="relative z-10 flex flex-col gap-1">
              <p className="text-[10px] uppercase font-black tracking-[0.35em] text-erani-blue">Portal de Acceso</p>
              <h2 className="text-[clamp(1.1rem,1.6vw,1.5rem)] font-black uppercase tracking-tight text-foreground">
                ¿Cómo deseas ingresar?
              </h2>
            </div>

            {/* Entry options */}
            <div className="relative z-10 flex flex-col gap-3">
              {entryOptions.map((opt, i) => (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 + i * 0.07 }}
                >
                  <Link
                    id={`tour-landing-${opt.id}`}
                    href={opt.href}
                    onMouseEnter={() => setHovered(opt.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`flex items-center gap-5 px-6 py-5 rounded-2xl border transition-all duration-300 ${
                      hovered === opt.id 
                        ? `bg-gradient-to-r ${opt.gradient} ${opt.hoverBorder} scale-[1.015]`
                        : "bg-foreground/5 border-foreground/10"
                    }`}
                    style={hovered === opt.id ? { boxShadow: `0 8px 32px ${opt.glow}` } : {}}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 flex-shrink-0 transition-transform duration-300 ${hovered === opt.id ? "scale-110" : ""}`}>
                      <opt.icon className={`w-6 h-6 ${opt.iconColor}`} />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-[clamp(0.7rem,1vw,0.9rem)] font-black uppercase tracking-widest text-foreground">{opt.label}</span>
                      <span className="text-[clamp(0.6rem,0.75vw,0.7rem)] font-medium text-nav-text">{opt.sublabel}</span>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-nav-text flex-shrink-0 transition-all duration-300 ${hovered === opt.id ? "translate-x-1 opacity-100" : "opacity-30"}`} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
      
      {/* ── Landing Tour ── */}
      <InAppTour
        tourKey="landing_tour_v2"
        steps={[
          {
            targetId: "tour-landing-create",
            title: "Crea tu Organización",
            content: "Si eres nuevo en ERANI y quieres implementar la plataforma en tu empresa, comienza creando el entorno de tu organización como Administrador Maestro.",
            position: "left"
          }
        ]}
      />
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Hero from "@/components/Hero";
import BetaWelcome from "@/components/BetaWelcome";

const SEEN_KEY = "erani_beta_welcome_seen";

export default function Home() {
  const [splashDone, setSplashDone] = useState(false);
  const [betaSeen, setBetaSeen] = useState<boolean | null>(null); // null = not yet checked

  // Check sessionStorage — show Beta welcome once per session
  useEffect(() => {
    const seen = typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY) === "true";
    setBetaSeen(seen);
    if (seen) {
      setSplashDone(true); // skip splash too if already seen this session
    }
  }, []);

  const handleBetaDone = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SEEN_KEY, "true");
    }
    setBetaSeen(true);
    setSplashDone(true);
  };

  // Still checking sessionStorage
  if (betaSeen === null) return null;

  // Show Beta welcome (includes its own 10s intro animation)
  if (!betaSeen) {
    return <BetaWelcome onDone={handleBetaDone} />;
  }

  return (
    <>
      {/* ── Splash screen ────────────────────────────────────────────── */}
      <AnimatePresence>
        {!splashDone && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0E14]"
          >
            {/* Purple ambient glow behind logo */}
            <div className="absolute w-80 h-80 rounded-full bg-erani-purple/20 blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative flex items-center justify-center"
            >
              {/* Spinning circular ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute w-52 h-52 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, #0055A0 100deg, #9e80ff 200deg, transparent 280deg)",
                  WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px))",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px))",
                  filter: "drop-shadow(0 0 12px rgba(0,85,160,0.9))",
                }}
              />

              {/* Logo */}
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 32px rgba(158,128,255,0.6))" }}
              >
                <Image
                  src="/isologo.png"
                  alt="ERANI"
                  width={120}
                  height={120}
                  style={{ filter: "brightness(0) invert(1)" }}
                  priority
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Landing ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {splashDone && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 overflow-hidden"
          >
            <Hero />

            {/* Disclaimer above footer */}
            <div className="fixed bottom-10 left-0 right-0 z-40 flex px-8 pb-3 pointer-events-none">
              <span className="font-montserrat text-[10px] italic font-normal text-foreground/70 dark:text-white/50 truncate whitespace-nowrap">
                Disclaimer: La información y proyecciones aquí presentadas se basan en modelos algorítmicos. Los resultados reales pueden variar dependiendo de la integridad de la metadata.
              </span>
            </div>

            {/* Fixed disclaimer footer */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-8 bg-black/70 backdrop-blur-md border-t border-white/5">
              <span className="text-[8px] uppercase font-black tracking-widest text-white">
                v0.1.0 ERANI BETA
              </span>
              <div className="flex items-center gap-6">
                <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-white hover:text-white/80 transition-colors">
                  Aviso de Privacidad
                </a>
                <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-white hover:text-white/80 transition-colors">
                  Términos y Condiciones
                </a>
                <a href="mailto:soporte@erani.mx" className="text-[8px] uppercase font-black tracking-widest text-white hover:text-white/80 transition-colors">
                  Soporte
                </a>
                <span className="text-white/50">|</span>
                <a
                  href="https://erani.mx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[8px] uppercase font-black tracking-widest text-erani-blue hover:text-erani-blue/80 transition-colors"
                >
                  erani.mx
                </a>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

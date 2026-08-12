"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  X,
  Mail,
  Phone,
  MessageCircle,
  ChevronRight,
  Zap,
} from "lucide-react";

const SUPPORT_EMAIL = "emilcastle2608@gmail.com";
const SUPPORT_PHONE = "+524623071972"; // WhatsApp format (no spaces/hyphens)
const SUPPORT_PHONE_DISPLAY = "+52 462 307 1972";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Stop the attention pulse after the first 6 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleEmail = () => {
    const subject = encodeURIComponent("Soporte ERANI — Solicitud de Ayuda");
    const body = encodeURIComponent(
      "Hola equipo ERANI,\n\nNecesito ayuda con:\n\n[Describe tu problema aquí]\n\nGracias."
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${subject}&body=${body}`,
      "_blank"
    );
    setOpen(false);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      "Hola! Necesito soporte con la plataforma ERANI."
    );
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${msg}`, "_blank");
    setOpen(false);
  };

  const handlePhone = () => {
    window.location.href = `tel:${SUPPORT_PHONE}`;
    setOpen(false);
  };

  return (
    <>
      {/* ── Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="support-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
            />

            {/* Card */}
            <motion.div
              key="support-panel"
              initial={{ opacity: 0, scale: 0.9, y: 20, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed bottom-28 right-6 z-[9999] w-[300px] rounded-[2rem] overflow-hidden shadow-2xl border border-glass-border bg-background/95"
              style={{
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4">
                {/* Decorative gradient blob */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(158,128,255,0.25) 0%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(0,85,160,0.2) 0%, transparent 70%)",
                  }}
                />

                <div className="relative flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    {/* Badge */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[8px] uppercase font-black tracking-[0.25em] text-emerald-400">
                        En Línea
                      </span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground leading-tight">
                      Soporte ERANI
                    </h3>
                    <p className="text-[9px] text-gray-500 font-medium mt-0.5">
                      Respuesta en menos de 24 hrs
                    </p>
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all border border-glass-border hover:border-foreground/20"
                  >
                    <X className="w-3.5 h-3.5 text-foreground/60" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px mx-6 bg-gradient-to-r from-transparent via-glass-border to-transparent" />

              {/* Actions */}
              <div className="flex flex-col gap-2 px-4 py-4">
                {/* Gmail */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEmail}
                  className="group flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-glass-border hover:border-erani-purple/40 transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(158,128,255,0.08) 0%, rgba(0,85,160,0.05) 100%)",
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA4335] to-[#c5221f] flex items-center justify-center shadow-lg shadow-red-900/30 shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start gap-0.5 flex-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-foreground">
                      Correo Gmail
                    </span>
                    <span className="text-[8px] text-gray-500 font-medium truncate w-full text-left">
                      {SUPPORT_EMAIL}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-erani-purple group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.button>

                {/* WhatsApp */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWhatsApp}
                  className="group flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-glass-border hover:border-emerald-500/40 transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(18,140,126,0.05) 100%)",
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-green-900/30 shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start gap-0.5 flex-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-foreground">
                      WhatsApp
                    </span>
                    <span className="text-[8px] text-gray-500 font-medium">
                      {SUPPORT_PHONE_DISPLAY}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.button>

                {/* Direct Call */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePhone}
                  className="group flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-glass-border hover:border-erani-blue/40 transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0,85,160,0.08) 0%, rgba(0,40,90,0.05) 100%)",
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0055A0] to-[#003570] flex items-center justify-center shadow-lg shadow-blue-900/30 shrink-0">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start gap-0.5 flex-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-foreground">
                      Llamada Directa
                    </span>
                    <span className="text-[8px] text-gray-500 font-medium">
                      {SUPPORT_PHONE_DISPLAY}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-erani-blue group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-1.5 pb-4 px-6">
                <Zap className="w-3 h-3 text-erani-purple/60" />
                <span className="text-[8px] uppercase font-black tracking-[0.2em] text-gray-400">
                  Powered by ERANI Engine
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FAB Button ──────────────────────────────────────────── */}
      <motion.button
        id="erani-support-fab"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl focus:outline-none"
        title="Soporte ERANI"
        style={{
          background: open
            ? "linear-gradient(135deg, #9e80ff 0%, #0055A0 100%)"
            : "linear-gradient(135deg, #0055A0 0%, #9e80ff 100%)",
          boxShadow: open
            ? "0 0 0 4px rgba(158,128,255,0.25), 0 8px 32px rgba(158,128,255,0.4)"
            : "0 0 0 0px rgba(158,128,255,0), 0 8px 32px rgba(0,85,160,0.5)",
          transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* Pulse ring — only during the first few seconds */}
        {pulse && !open && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: "rgba(158,128,255,0.35)",
              animationDuration: "1.5s",
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Headphones className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

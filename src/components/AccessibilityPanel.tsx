"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useTheme } from "@/context/ThemeContext";
import { X, Moon, Sun, Type, Ear, Contrast, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function AccessibilityPanel() {
  const {
    isPanelOpen,
    setIsPanelOpen,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    voiceAssistance,
    setVoiceAssistance,
  } = useAccessibility();
  
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPanelOpen(false)}
            className="fixed inset-0 z-[10000] bg-background/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-[90vw] max-w-md bg-card/95 border border-glass-border p-6 rounded-3xl shadow-[0_0_50px_rgba(158,128,255,0.15)] flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-accent-purple" />
                Panel de Accesibilidad
              </h2>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-2 rounded-full hover:bg-foreground/5 transition-colors"
                aria-label="Cerrar panel de accesibilidad"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-foreground/5 rounded-xl text-accent-blue">
                    {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Tema Visual</h3>
                    <p className="text-xs text-nav-text">Cambiar modo oscuro/claro</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-foreground/10 hover:bg-foreground/15 transition-colors"
                >
                  Cambiar a {theme === "dark" ? "Claro" : "Oscuro"}
                </button>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-foreground/5 rounded-xl text-accent-coral">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Tamaño de Texto</h3>
                    <p className="text-xs text-nav-text">Ajusta la lectura</p>
                  </div>
                </div>
                <div className="flex gap-1 bg-foreground/5 p-1 rounded-xl">
                  {(["normal", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        fontSize === size ? "bg-card shadow-sm text-foreground" : "text-nav-text hover:text-foreground"
                      }`}
                    >
                      {size === "normal" ? "A" : size === "medium" ? "A+" : "A++"}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-foreground/5 rounded-xl text-emerald-500">
                    <Contrast className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Alto Contraste</h3>
                    <p className="text-xs text-nav-text">Mejora la visibilidad visual</p>
                  </div>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    highContrast ? "bg-emerald-500" : "bg-foreground/20"
                  }`}
                  aria-pressed={highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      highContrast ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Voice Assistance */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-foreground/5 rounded-xl text-amber-500">
                    <Ear className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Asistencia de Voz</h3>
                    <p className="text-xs text-nav-text">Lee textos al pasar el mouse</p>
                  </div>
                </div>
                <button
                  onClick={() => setVoiceAssistance(!voiceAssistance)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    voiceAssistance ? "bg-amber-500" : "bg-foreground/20"
                  }`}
                  aria-pressed={voiceAssistance}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      voiceAssistance ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingDown, Cpu, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AutomationSimulatorModal({
  isOpen,
  onClose,
  automation,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  automation: any;
  onApply?: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      const timer = setInterval(() => {
        setStep(s => (s < 3 ? s + 1 : s));
      }, 1500);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen || !automation) return null;

  const currentCoi = automation.coi_recovery_amount || 50000;
  const projectedCoi = Math.round(currentCoi * (1 - (automation.roi_projection || 50)/100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-background border border-glass-border rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-8"
        >
          {/* Left Column: Flow Simulation */}
          <div className="flex-1 flex flex-col gap-6 relative">
            <button onClick={onClose} className="absolute -top-2 -right-2 p-2 md:hidden">
              <X className="w-5 h-5 text-nav-text" />
            </button>
            
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-erani-blue mb-2 block">Simulador de Nodo Forense</span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">{automation.name}</h3>
              <p className="text-nav-text text-sm mt-2">{automation.description}</p>
            </div>

            <div className="flex-1 bg-foreground/5 rounded-2xl border border-glass-border p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
               {/* Animated Flow Nodes */}
               <div className="flex flex-col items-center gap-2 relative z-10 w-full">
                  <motion.div 
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ opacity: step >= 0 ? 1 : 0.5, scale: step >= 0 ? 1 : 0.9 }}
                    className={`w-full max-w-[200px] p-3 rounded-xl border flex items-center gap-3 ${step >= 0 ? 'bg-erani-blue/20 border-erani-blue' : 'bg-background border-glass-border'}`}
                  >
                     <div className="w-6 h-6 rounded-full bg-erani-blue/20 flex items-center justify-center shrink-0">1</div>
                     <span className="text-[9px] uppercase font-black">Trigger: Análisis de Fuga</span>
                  </motion.div>
                  
                  <div className="w-px h-6 bg-glass-border relative">
                     {step >= 1 && <motion.div layoutId="flowLine" className="absolute inset-0 bg-erani-blue origin-top" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />}
                  </div>

                  <motion.div 
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ opacity: step >= 1 ? 1 : 0.5, scale: step >= 1 ? 1 : 0.9 }}
                    className={`w-full max-w-[200px] p-3 rounded-xl border flex items-center gap-3 ${step >= 1 ? 'bg-erani-purple/20 border-erani-purple' : 'bg-background border-glass-border'}`}
                  >
                     <div className="w-6 h-6 rounded-full bg-erani-purple/20 flex items-center justify-center shrink-0">2</div>
                     <span className="text-[9px] uppercase font-black">Procesamiento n8n</span>
                  </motion.div>

                  <div className="w-px h-6 bg-glass-border relative">
                     {step >= 2 && <motion.div layoutId="flowLine2" className="absolute inset-0 bg-erani-purple origin-top" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />}
                  </div>

                  <motion.div 
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ opacity: step >= 2 ? 1 : 0.5, scale: step >= 2 ? 1 : 0.9 }}
                    className={`w-full max-w-[200px] p-3 rounded-xl border flex items-center gap-3 ${step >= 2 ? 'bg-emerald-500/20 border-emerald-500' : 'bg-background border-glass-border'}`}
                  >
                     <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-emerald-500"/></div>
                     <span className="text-[9px] uppercase font-black">Resolución y Recovery</span>
                  </motion.div>
               </div>
               
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-erani-blue/5 via-transparent to-transparent" />
            </div>
          </div>

          {/* Right Column: COI & Metrics */}
          <div className="w-full md:w-80 flex flex-col gap-6 relative">
            <button onClick={onClose} className="absolute -top-2 -right-2 p-2 hidden md:block">
              <X className="w-5 h-5 text-nav-text" />
            </button>
            
            <div className="bg-foreground/5 p-5 rounded-2xl border border-glass-border">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] uppercase font-black tracking-widest text-nav-text">Impacto en COI (Mensual)</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-nav-text line-through">Monto de Fuga Actual</span>
                  <span className="text-sm font-bold text-foreground opacity-50">${currentCoi.toLocaleString()} MXN</span>
                </div>
                <div className="h-px w-full bg-glass-border" />
                <div className="flex justify-between items-end">
                  <span className="text-xs text-emerald-500 font-bold">Proyección Post-Automatización</span>
                  <span className="text-2xl font-black text-emerald-500">${projectedCoi.toLocaleString()} MXN</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-foreground/5 p-4 rounded-2xl border border-glass-border flex flex-col gap-1">
                <BarChart3 className="w-4 h-4 text-erani-blue mb-1" />
                <span className="text-[9px] uppercase font-black tracking-widest text-nav-text">Recovery</span>
                <span className="text-xl font-black text-foreground">+{automation.roi_projection || 0}%</span>
              </div>
              <div className="bg-foreground/5 p-4 rounded-2xl border border-glass-border flex flex-col gap-1">
                <Clock className="w-4 h-4 text-erani-purple mb-1" />
                <span className="text-[9px] uppercase font-black tracking-widest text-nav-text">Ahorro</span>
                <span className="text-xl font-black text-foreground">{automation.hours_saved_monthly || 0}h</span>
              </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={onApply}
                className="w-full py-4 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 bg-gradient-to-r from-erani-blue to-erani-purple text-white shadow-lg hover:scale-105 transition-transform"
              >
                Instalar Automatización
              </button>
              <p className="text-[9px] text-center text-nav-text mt-3">Esta acción modificará el estado del flujo a En Línea.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

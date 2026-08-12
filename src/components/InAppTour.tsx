"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, BookOpen } from "lucide-react";

export interface TourStep {
  targetId: string;
  title: string;
  content: string | React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  isFeaturePlus?: boolean; // For specific logic like Erani Services+
}

interface InAppTourProps {
  tourKey: string;
  steps: TourStep[];
  onComplete?: () => void;
  isSubscriptionActive?: boolean; // Required for restricting steps
}

export default function InAppTour({ tourKey, steps, onComplete, isSubscriptionActive = false }: InAppTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `erani_tour_completed_${tourKey}`;
      const isCompleted = localStorage.getItem(storageKey);
      if (!isCompleted) {
        // Add a slight delay to let the UI render completely
        const timer = setTimeout(() => {
          setIsActive(true);
          // Mark as completed immediately so if they navigate away without clicking X, it doesn't reappear
          localStorage.setItem(storageKey, "true");
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [tourKey]);

  const updateRect = useCallback(() => {
    if (!isActive) return;
    
    // Filter steps logic (e.g. skip Services+ if not subscribed, or just show it disabled in the text)
    // The instructions say "Erani Services+ (solo disponibles para miembros con suscripcion, configura tambien esto en la logica)"
    // We will show the step, but the text will adapt, or the step itself might be styled differently.
    
    const currentStep = steps[currentStepIndex];
    if (currentStep) {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        // Scroll into view gently if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        
        // Wait a tiny bit for scroll to finish, then get rect
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        }, 300);
      } else {
        // Element not found, might be collapsed sidebar or similar, fallback
        setTargetRect(null);
      }
    }
  }, [isActive, currentStepIndex, steps]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true); // capture scroll
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  const endTour = () => {
    setIsActive(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`erani_tour_completed_${tourKey}`, "true");
    }
    if (onComplete) onComplete();
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isActive) return null;

  const currentStep = steps[currentStepIndex];
  
  let popoverStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  
  if (targetRect) {
    const spacing = 20; // distance from element
    const padding = 20; // safe area from screen edge
    const popoverWidth = 340; 
    const popoverHeight = 350; // Estimated max height including content
    
    const pos = currentStep.position || "right";
    
    let x = 0;
    let y = 0;

    // Base coordinates
    if (pos === "right") {
      x = targetRect.right + spacing;
      y = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
    } else if (pos === "left") {
      x = targetRect.left - spacing - popoverWidth;
      y = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
    } else if (pos === "bottom") {
      x = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
      y = targetRect.bottom + spacing;
    } else if (pos === "top") {
      x = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
      y = targetRect.top - spacing - popoverHeight;
    }

    // Strict clamping to viewport
    if (typeof window !== "undefined") {
      x = Math.max(padding, Math.min(x, window.innerWidth - popoverWidth - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - popoverHeight - padding));
    }

    // We no longer need transform centering, we are using absolute px coordinates
    popoverStyle = { top: y, left: x };
  }

  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
          {/* Backdrop overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-sm"
          />

          {/* Spotlight cutout */}
          {targetRect && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute border-2 border-erani-blue shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-2xl pointer-events-none z-10"
              style={{
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px 5px rgba(158,128,255,0.4)"
              }}
            />
          )}

          {/* Popover Card */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={popoverStyle}
            className="absolute z-20 w-[340px] glassmorphism bg-background/95 border border-glass-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-erani-blue/20 text-erani-blue flex items-center justify-center text-xs">
                  {currentStepIndex + 1}
                </span>
                {currentStep.title}
              </h3>
              <button onClick={endTour} className="p-1 hover:bg-white/10 rounded-full text-nav-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-nav-text font-medium leading-relaxed">
              {currentStep.content}
              {currentStep.isFeaturePlus && !isSubscriptionActive && (
                <div className="mt-3 p-2 rounded bg-erani-purple/10 border border-erani-purple/20 text-erani-purple font-bold flex gap-2">
                  <span className="text-[10px]">🔒 Requiere suscripción activa para desbloquear</span>
                </div>
              )}
            </div>

            {/* If last step, show tutorials link */}
            {isLastStep && (
              <div className="mt-2 p-3 rounded-xl bg-erani-blue/10 border border-erani-blue/20 flex flex-col gap-2 cursor-pointer hover:bg-erani-blue/20 transition-colors" onClick={() => window.open('https://erani.mx/tutoriales', '_blank')}>
                <div className="flex items-center gap-2 text-erani-blue">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Ver Tutoriales</span>
                </div>
                <p className="text-[10px] text-erani-blue/70">Aprende tips, funcionalidades y FAQs.</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Paso {currentStepIndex + 1} de {steps.length}
              </span>
              <div className="flex gap-2">
                {currentStepIndex > 0 && (
                  <button onClick={prevStep} className="p-2 rounded-xl border border-glass-border hover:bg-white/5 text-nav-text transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <button onClick={nextStep} className="button-premium px-4 py-2 rounded-xl flex items-center gap-2 text-xs uppercase tracking-widest">
                  {isLastStep ? (
                    <>Entendido <Check className="w-4 h-4" /></>
                  ) : (
                    <>Siguiente <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

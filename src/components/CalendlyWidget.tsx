"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Update this with the real link once available
const DEFAULT_CALENDLY_URL = "https://calendly.com/erani-team/15-min-audit";

export default function CalendlyWidget() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Inject Calendly CSS
    const link = document.createElement('link');
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Initial check for Calendly on window
    const checkCalendly = () => {
      if ((window as any).Calendly) return true;
      return false;
    };

    const interval = setInterval(() => {
      if (checkCalendly()) clearInterval(interval);
    }, 500);

    return () => {
      clearInterval(interval);
      document.head.removeChild(link);
    };
  }, []);

  const openCalendly = () => {
    if ((window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({ url: DEFAULT_CALENDLY_URL });
    } else {
      window.open(DEFAULT_CALENDLY_URL, "_blank");
    }
  };

  return (
    <>
      <button 
        onClick={openCalendly}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-erani-blue to-erani-purple flex items-center justify-center gap-3 group transition-all duration-500 hover:shadow-[0_0_20px_rgba(158,128,255,0.4)] relative overflow-hidden"
      >
        <Calendar className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
        <span className="text-[10px] uppercase font-black tracking-widest text-white">Agendar Sesión</span>
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
      </button>

      {/* Optional fallback disclaimer if Calendly doesn't load */}
      <div className="flex items-center justify-center gap-2 mt-4 opacity-30 hover:opacity-100 transition-opacity">
        <span className="text-[8px] uppercase font-bold text-gray-400 tracking-tighter">Powered by Calendly</span>
        <ExternalLink className="w-2 h-2 text-gray-400" />
      </div>
    </>
  );
}

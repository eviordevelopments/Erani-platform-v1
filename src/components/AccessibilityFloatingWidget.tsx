"use client";

import { useAccessibility } from "@/context/AccessibilityContext";
import { Accessibility } from "lucide-react";
import { motion } from "framer-motion";

export default function AccessibilityFloatingWidget() {
  const { isPanelOpen, setIsPanelOpen } = useAccessibility();

  if (isPanelOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsPanelOpen(true)}
      className="fixed bottom-6 right-6 z-40 p-4 bg-accent-purple text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-accent-purple/20 transition-all flex items-center justify-center"
      aria-label="Abrir panel de accesibilidad"
    >
      <Accessibility className="w-6 h-6" />
    </motion.button>
  );
}

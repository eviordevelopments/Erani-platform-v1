"use client";

import { useTheme } from "@/context/ThemeContext";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Sun, Moon, Accessibility } from "lucide-react";

export default function TopRightActions() {
  const { theme, toggleTheme } = useTheme();
  const { setIsPanelOpen } = useAccessibility();

  return (
    <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
      <button
        onClick={() => setIsPanelOpen(true)}
        className="p-3 rounded-2xl glassmorphism border border-white/10 dark:border-white/5 text-nav-text hover:text-foreground transition-all active:scale-95 shadow-xl"
        aria-label="Accesibilidad"
      >
        <Accessibility className="w-5 h-5" />
      </button>
      <button
        onClick={toggleTheme}
        className="p-3 rounded-2xl glassmorphism border border-white/10 dark:border-white/5 text-nav-text hover:text-foreground transition-all active:scale-95 shadow-xl"
        aria-label="Cambiar tema"
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
}

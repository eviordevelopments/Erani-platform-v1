"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type FontSize = "normal" | "medium" | "large";

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  voiceAssistance: boolean;
  setVoiceAssistance: (val: boolean) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (val: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("normal");
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [voiceAssistance, setVoiceAssistanceState] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  // Load from LocalStorage
  useEffect(() => {
    const storedFontSize = localStorage.getItem("erani-font-size") as FontSize;
    const storedContrast = localStorage.getItem("erani-high-contrast") === "true";
    const storedVoice = localStorage.getItem("erani-voice-assistance") === "true";

    if (storedFontSize) setFontSizeState(storedFontSize);
    if (storedContrast) setHighContrastState(storedContrast);
    if (storedVoice) setVoiceAssistanceState(storedVoice);
  }, []);

  // Setters that also update LocalStorage
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("erani-font-size", size);
  };
  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem("erani-high-contrast", String(val));
  };
  const setVoiceAssistance = (val: boolean) => {
    setVoiceAssistanceState(val);
    localStorage.setItem("erani-voice-assistance", String(val));
    if (!val) {
      window.speechSynthesis.cancel();
    }
  };

  // Effect: Font Size
  useEffect(() => {
    const root = document.documentElement;
    let sizeValue = "16px";
    if (fontSize === "medium") sizeValue = "18px";
    if (fontSize === "large") sizeValue = "20px";
    root.style.setProperty("--platform-font-size", sizeValue);
  }, [fontSize]);

  // Effect: High Contrast
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [highContrast]);

  // Effect: Voice Assistance (Hover to Read)
  useEffect(() => {
    if (!voiceAssistance) {
      window.speechSynthesis.cancel();
      return;
    }

    let speakingTimeout: NodeJS.Timeout;
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip if it's not a text-heavy element or if it's the body
      if (target.tagName === "BODY" || target.tagName === "HTML" || target.tagName === "DIV" && !target.innerText) return;
      
      const textToRead = target.getAttribute("aria-label") || target.title || (target.textContent?.length && target.textContent.length < 200 ? target.textContent : null);
      
      if (textToRead && textToRead.trim().length > 0) {
        // Debounce reading slightly to avoid spam
        clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToRead.trim());
          utterance.lang = "es-MX";
          window.speechSynthesis.speak(utterance);
        }, 500);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      clearTimeout(speakingTimeout);
      window.speechSynthesis.cancel();
    };
  }, [voiceAssistance]);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        voiceAssistance,
        setVoiceAssistance,
        isPanelOpen,
        setIsPanelOpen
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}

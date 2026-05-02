"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { InsightData } from "@/lib/insightEngine";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProcessingState = "idle" | "parsing" | "computing" | "complete";

export type UploadedSource = "jira" | "slack" | "notion" | "clickup" | "generic";

export interface UploadedFile {
  id: string;
  name: string;
  source: UploadedSource;
  uploadedAt: Date;
  rowCount: number;
}

export interface SessionRecord {
  id: string;
  title: string;
  scheduledAt: Date;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  calendlyUrl?: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  type: "bug" | "feature" | "improvement";
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  reportedBy: string;
  createdAt: Date;
}

export interface AutomationFlow {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "error";
  category: "forense" | "financiera" | "operativa";
  roi_projection: number; // Percentage
  hours_saved_monthly: number;
  n8n_id?: string;
  last_run?: Date;
}

export interface DashboardState {
  processingState: ProcessingState;
  processingStep: string;
  processingProgress: number;
  uploadedFiles: UploadedFile[];
  insights: InsightData | null;
  sessions: SessionRecord[];
  bentoOrder: string[];
  feedback: FeedbackItem[];
  automations: AutomationFlow[];
}

export interface UserPreferences {
  font_size: number;
  theme_color: string;
  custom_logo_url: string | null;
}

interface DashboardContextType extends DashboardState {
  preferences: UserPreferences;
  startProcessing: (step: string, progress: number) => void;
  completeProcessing: (file: UploadedFile, insights: InsightData) => void;
  resetProcessing: () => void;
  addSession: (session: SessionRecord) => void;
  removeSession: (id: string) => void;
  updateBentoOrder: (order: string[]) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addFeedback: (item: FeedbackItem) => void;
  updateFeedbackStatus: (id: string, status: FeedbackItem["status"]) => void;
  toggleAutomation: (id: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

// ─── Default Bento Card Order ────────────────────────────────────────────────

export const DEFAULT_BENTO_ORDER = ["sankey", "dark-data", "scope-creep", "alerts"];

// ─── Context ─────────────────────────────────────────────────────────────────

const DashboardContext = createContext<DashboardContextType>({
  processingState: "idle",
  processingStep: "",
  processingProgress: 0,
  uploadedFiles: [],
  insights: null,
  sessions: [],
  bentoOrder: DEFAULT_BENTO_ORDER,
  feedback: [],
  automations: [],
  preferences: { font_size: 16, theme_color: "#0055A0", custom_logo_url: null },
  startProcessing: () => {},
  completeProcessing: () => {},
  resetProcessing: () => {},
  addSession: () => {},
  removeSession: () => {},
  updateBentoOrder: () => {},
  updatePreferences: () => {},
  addFeedback: () => {},
  updateFeedbackStatus: () => {},
  toggleAutomation: () => {},
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<DashboardState>({
    processingState: "idle",
    processingStep: "",
    processingProgress: 0,
    uploadedFiles: [],
    insights: null,
    sessions: [],
    bentoOrder: DEFAULT_BENTO_ORDER,
    feedback: [],
    automations: [
      {
        id: "1",
        name: "Protección de Fugitividad de Capital",
        description: "Detección en tiempo real de transferencias no autorizadas y alertas de liquidez.",
        status: "active",
        category: "financiera",
        roi_projection: 320,
        hours_saved_monthly: 45,
        n8n_id: "flow_001",
        last_run: new Date()
      },
      {
        id: "2",
        name: "Auditoría Automática de Jira",
        description: "Sincronización forense de logs de actividad para detectar Scope Creep.",
        status: "active",
        category: "forense",
        roi_projection: 150,
        hours_saved_monthly: 12,
        n8n_id: "flow_002",
        last_run: new Date()
      },
      {
        id: "3",
        name: "Conciliación Bancaria IA",
        description: "Match inteligente de facturas vs depósitos bancarios mediante GPT-4o.",
        status: "inactive",
        category: "financiera",
        roi_projection: 480,
        hours_saved_monthly: 60,
        n8n_id: "flow_003"
      }
    ],
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    font_size: 16,
    theme_color: "#0055A0",
    custom_logo_url: null,
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Apply preferences as CSS variables
  React.useEffect(() => {
    document.documentElement.style.setProperty('--platform-font-size', `${preferences.font_size}px`);
    document.documentElement.style.setProperty('--platform-theme-color', preferences.theme_color);
  }, [preferences]);

  const startProcessing = useCallback((step: string, progress: number) => {
    setState((prev) => ({
      ...prev,
      processingState: progress < 100 ? "parsing" : "computing",
      processingStep: step,
      processingProgress: progress,
    }));
  }, []);

  const completeProcessing = useCallback((file: UploadedFile, insights: InsightData) => {
    setState((prev) => ({
      ...prev,
      processingState: "complete",
      processingStep: "Análisis Completado",
      processingProgress: 100,
      uploadedFiles: [...prev.uploadedFiles, file],
      insights,
    }));
  }, []);

  const resetProcessing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      processingState: "idle",
      processingStep: "",
      processingProgress: 0,
    }));
  }, []);

  const addSession = useCallback((session: SessionRecord) => {
    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, session],
    }));
  }, []);

  const removeSession = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== id),
    }));
  }, []);

  const updateBentoOrder = useCallback((order: string[]) => {
    setState((prev) => ({ ...prev, bentoOrder: order }));
  }, []);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  }, []);

  const addFeedback = useCallback((item: FeedbackItem) => {
    setState((prev) => ({
      ...prev,
      feedback: [item, ...prev.feedback],
    }));
  }, []);

  const updateFeedbackStatus = useCallback((id: string, status: FeedbackItem["status"]) => {
    setState((prev) => ({
      ...prev,
      feedback: prev.feedback.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
  }, []);

  const toggleAutomation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      automations: prev.automations.map((a) => 
        a.id === id ? { ...a, status: a.status === "active" ? "inactive" : "active" } : a
      ),
    }));
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        ...state,
        preferences,
        startProcessing,
        completeProcessing,
        resetProcessing,
        addSession,
        removeSession,
        updateBentoOrder,
        updatePreferences,
        addFeedback,
        updateFeedbackStatus,
        toggleAutomation,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { InsightData } from "@/lib/insightEngine";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

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
  const { profile } = useAuth();
  const [hasFetched, setHasFetched] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>({
    font_size: 16,
    theme_color: "#0055A0",
    custom_logo_url: null,
  });

  const [state, setState] = useState<DashboardState>({
    processingState: "idle",
    processingStep: "",
    processingProgress: 0,
    uploadedFiles: [],
    insights: null,
    sessions: [],
    bentoOrder: DEFAULT_BENTO_ORDER,
    feedback: [],
    automations: [],
  });

  // ─── Fetch from Supabase on mount ──────────────────────────────────────────
  useEffect(() => {
    if (profile && !hasFetched) {
      const fetchData = async () => {
        try {
          const { data: prefs, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', profile.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error("Error fetching preferences:", error);
          }

          if (prefs) {
            setPreferences({
              font_size: prefs.font_size || 16,
              theme_color: prefs.theme_color || "#0055A0",
              custom_logo_url: prefs.custom_logo_url || null,
            });
            setState(prev => ({
              ...prev,
              bentoOrder: prefs.bento_order || DEFAULT_BENTO_ORDER,
            }));
          }
          // Fetch Feedback
          const { data: feedbackData } = await supabase
            .from('feedback')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });
          
          if (feedbackData) {
            setState(prev => ({
              ...prev,
              feedback: feedbackData.map(f => ({
                id: f.id,
                title: f.title,
                description: f.description,
                type: f.type,
                status: f.status,
                priority: f.priority,
                reportedBy: f.reported_by,
                createdAt: new Date(f.created_at)
              }))
            }));
          }

          // Fetch Automations
          const { data: automationsData } = await supabase
            .from('automations')
            .select('*')
            .eq('organization_id', profile.organization_id);
          
          if (automationsData && automationsData.length > 0) {
            setState(prev => ({
              ...prev,
              automations: automationsData.map(a => ({
                id: a.id,
                name: a.name,
                description: a.description,
                status: a.status,
                category: a.category,
                roi_projection: a.roi_projection,
                hours_saved_monthly: a.hours_saved_monthly,
                n8n_id: a.n8n_id,
                last_run: a.last_run ? new Date(a.last_run) : undefined
              }))
            }));
          }
        } catch (err) {
          console.error("Unexpected error in DashboardContext:", err);
        } finally {
          setHasFetched(true);
        }
      };
      fetchData();
    }
  }, [profile, hasFetched]);

  // Apply preferences as CSS variables
  useEffect(() => {
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
    if (profile) {
      supabase
        .from('user_preferences')
        .upsert({ 
          user_id: profile.id, 
          bento_order: order,
          updated_at: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) console.error("Error saving bento order:", error);
        });
    }
  }, [profile]);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, ...prefs };
      if (profile) {
        supabase
          .from('user_preferences')
          .upsert({ 
            user_id: profile.id, 
            ...newPrefs,
            updated_at: new Date().toISOString()
          })
          .then(({ error }) => {
            if (error) console.error("Error saving preferences:", error);
          });
      }
      return newPrefs;
    });
  }, [profile]);

  const addFeedback = useCallback((item: FeedbackItem) => {
    setState((prev) => ({
      ...prev,
      feedback: [item, ...prev.feedback],
    }));
    if (profile?.organization_id) {
      supabase
        .from('feedback')
        .insert({
          organization_id: profile.organization_id,
          title: item.title,
          description: item.description,
          type: item.type,
          status: item.status,
          priority: item.priority,
          reported_by: item.reportedBy
        })
        .then(({ error }) => {
          if (error) console.error("Error saving feedback:", error);
        });
    }
  }, [profile]);

  const updateFeedbackStatus = useCallback((id: string, status: FeedbackItem["status"]) => {
    setState((prev) => ({
      ...prev,
      feedback: prev.feedback.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
    if (profile) {
      supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error("Error updating feedback status:", error);
        });
    }
  }, [profile]);

  const toggleAutomation = useCallback((id: string) => {
    setState((prev) => {
      const automation = prev.automations.find(a => a.id === id);
      const newStatus = automation?.status === "active" ? "inactive" : "active";
      
      if (profile) {
        supabase
          .from('automations')
          .update({ status: newStatus })
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error("Error updating automation status:", error);
          });
      }

      return {
        ...prev,
        automations: prev.automations.map((a) => 
          a.id === id ? { ...a, status: newStatus } : a
        ),
      };
    });
  }, [profile]);

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

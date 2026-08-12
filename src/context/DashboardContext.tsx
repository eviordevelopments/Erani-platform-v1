"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { InsightData } from "@/lib/insightEngine";
import { getProfileDataAction } from "@/app/actions/profileActions";
import { 
  addFeedbackAction, 
  deleteFeedbackAction, 
  editFeedbackAction, 
  updateFeedbackStatusAction 
} from "@/app/actions/feedbackActions";
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
  userId?: string;
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

export interface WidgetConfig {
  id: string;
  widgetKey: string;
  colSpan: number;
  projectId?: string;
}

export interface StorageStats {
  usedGB: number;
  limitGB: number;
  isCritical: boolean;
  isFull: boolean;
}

export interface DashboardState {
  processingState: ProcessingState;
  processingStep: string;
  processingProgress: number;
  uploadedFiles: UploadedFile[];
  insights: InsightData | null;
  sessions: SessionRecord[];
  bentoOrder: WidgetConfig[];
  feedback: FeedbackItem[];
  automations: AutomationFlow[];
  storageStats: StorageStats;
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
  updateBentoOrder: (order: WidgetConfig[]) => void;
  addWidget: (widgetKey: string, colSpan?: number) => void;
  removeWidget: (instanceId: string) => void;
  updateWidgetConfig: (instanceId: string, updates: Partial<WidgetConfig>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addFeedback: (item: FeedbackItem) => Promise<void>;
  editFeedback: (item: FeedbackItem) => Promise<void>;
  updateFeedbackStatus: (id: string, status: FeedbackItem["status"]) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  toggleAutomation: (id: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

// ─── Default Bento Card Order ────────────────────────────────────────────────

export const DEFAULT_BENTO_ORDER: WidgetConfig[] = [
  { id: "sankey-default", widgetKey: "sankey", colSpan: 2 },
  { id: "dark-data-default", widgetKey: "dark-data", colSpan: 1 },
  { id: "scope-creep-default", widgetKey: "scope-creep", colSpan: 1 },
  { id: "alerts-default", widgetKey: "alerts", colSpan: 2 }
];

export const migrateBentoOrder = (order: any[]): WidgetConfig[] => {
  if (!order || !Array.isArray(order) || order.length === 0) return DEFAULT_BENTO_ORDER;
  
  return order.map((item, i) => {
    let parsedItem = item;
    
    // 1. If it's a string, try parsing it as JSON
    if (typeof item === 'string') {
      try {
        parsedItem = JSON.parse(item);
      } catch (e) {
        return {
          id: `${item}-migrated-${i}`,
          widgetKey: item,
          colSpan: (item === "sankey" || item === "alerts") ? 2 : 1
        };
      }
    }
    
    // 2. Now it should be an object. Check for corrupted widgetKey
    if (typeof parsedItem === 'object' && parsedItem !== null) {
      if (typeof parsedItem.widgetKey === 'string' && parsedItem.widgetKey.startsWith('{')) {
        try {
          const innerParsed = JSON.parse(parsedItem.widgetKey);
          return { ...parsedItem, ...innerParsed } as WidgetConfig;
        } catch(e) {}
      }
      return parsedItem as WidgetConfig;
    }
    
    // Fallback
    return {
      id: `unknown-migrated-${i}`,
      widgetKey: "unknown",
      colSpan: 1
    };
  });
};

// ─── Mapper for DB Forensic Reports to InsightData ───────────────────────────

export function mapPayloadToInsights(payload: any): InsightData {
  if (!payload) {
    return {
      darkDataIndex: 0,
      scopeCreepPct: 0,
      roiRecovered: 0,
      trlLevel: 1,
      totalTasks: 0,
      tasksWithoutEstimate: 0,
      scopeCreepTasks: 0,
      alerts: [],
      revenueData: [
        { name: "Capital Auditado", value: 0, recovered: 0 },
        { name: "Dark Data Loss", value: 0, recovered: 0 },
        { name: "Scope Creep Loss", value: 0, recovered: 0 },
        { name: "Post-Intervención", value: 0, recovered: 0 },
      ],
      processingSourceLabel: "Archivo Procesado",
      timestamp: new Date().toISOString(),
    };
  }

  const slide1 = payload.slide_1_impacto_directo || {};
  const slide2 = payload.slide_2_analisis_forense || {};
  const slide3 = payload.slide_3_kpis_salud || {};
  const metadata = payload.report_metadata || {};
  
  const roiRecovered = Number(slide1.fuga_confirmada_mxn) || 0;
  const darkDataIndex = Number(slide3.dark_data_index_pct) || 0;
  const scopeCreepPct = Number(slide3.intensidad_scope_creep_pct) || 0;
  
  const topTickets = slide2.top_5_tickets || [];
  const otrosCantidad = Number(slide2.resumen_consolidacion?.otros_tickets_cantidad) || 0;
  const totalTasks = topTickets.length + otrosCantidad;
  
  const tasksWithoutEstimate = Math.round(totalTasks * (darkDataIndex / 100));
  const scopeCreepTasks = Math.round(totalTasks * (scopeCreepPct / 100));
  
  const alerts = topTickets.map((t: any, idx: number) => ({
    id: t.ticket_id || `t-${idx}`,
    ticket: t.ticket_id || `TCK-${idx}`,
    description: `${t.descripcion || 'Fuga detectada'} (Costo: $${(Number(t.costo_invisible_mxn) || 0).toLocaleString()} MXN, ${t.hrs_calc || 0} hrs)`,
    riskLevel: (Number(t.costo_invisible_mxn) > 10000 ? "critical" : "high") as any,
  }));
  
  // Build sankey/revenue flow data using real project values without 100k mock fallback
  const baseline = Number(slide2.resumen_consolidacion?.total_conciliado_monto_mxn) || (roiRecovered * 5) || 0;
  const riesgoLatente = Number(slide1.riesgo_latente_mensual_mxn) || 0;
  const totalLeak = roiRecovered + riesgoLatente;
  
  const darkWeight = darkDataIndex / ((darkDataIndex + scopeCreepPct) || 100);
  const darkLoss = Math.round(totalLeak * darkWeight);
  const scopeLoss = totalLeak - darkLoss;
  const recovered = Math.round(roiRecovered);
  
  const revenueData = [
    { name: "Capital Auditado", value: baseline, recovered: 0 },
    { name: "Dark Data Loss", value: Math.max(0, baseline - darkLoss), recovered: 0 },
    { name: "Scope Creep Loss", value: Math.max(0, baseline - darkLoss - scopeLoss), recovered: 0 },
    { name: "Post-Intervención", value: Math.max(0, baseline - darkLoss - scopeLoss + recovered), recovered },
  ];
  
  return {
    darkDataIndex,
    scopeCreepPct,
    roiRecovered,
    trlLevel: 5,
    totalTasks,
    tasksWithoutEstimate,
    scopeCreepTasks,
    alerts,
    revenueData,
    processingSourceLabel: `Auditoría Forense (${metadata.project_name || 'IA'})`,
    timestamp: metadata.audit_date || new Date().toISOString(),
  };
}

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
  storageStats: { usedGB: 0, limitGB: 2, isCritical: false, isFull: false },
  preferences: { font_size: 16, theme_color: "#0055A0", custom_logo_url: null },
  startProcessing: () => {},
  completeProcessing: () => {},
  resetProcessing: () => {},
  addSession: () => {},
  removeSession: () => {},
  updateBentoOrder: () => {},
  addWidget: () => {},
  removeWidget: () => {},
  updateWidgetConfig: () => {},
  updatePreferences: () => {},
  addFeedback: async () => {},
  editFeedback: async () => {},
  updateFeedbackStatus: async () => {},
  deleteFeedback: async () => {},
  toggleAutomation: () => {},
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, org } = useAuth();
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
    storageStats: { usedGB: 0, limitGB: 2, isCritical: false, isFull: false },
  });

  // ─── Reset fetch state on profile change ───────────────────────────────────
  useEffect(() => {
    setHasFetched(false);
  }, [profile?.id]);

  // ─── Fetch from Supabase on mount ──────────────────────────────────────────
  useEffect(() => {
    if (profile && !hasFetched) {
      const fetchData = async () => {
        try {
          // user_preferences table — skip gracefully if not present
          try {
            const { data: prefs, error } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', profile.id)
              .single();
            
            if (!error && prefs) {
              setPreferences({
                font_size: prefs.font_size || 16,
                theme_color: prefs.theme_color || "#0055A0",
                custom_logo_url: prefs.custom_logo_url || null,
              });
              setState(prev => ({
                ...prev,
                bentoOrder: migrateBentoOrder(prefs.bento_order),
              }));
            }
          } catch { /* table may not exist */ }

          // Fetch the latest forensic report for organization
          if (profile.organization_id) {
            const { data: reportData, error: reportError } = await supabase
              .from('forensic_reports')
              .select('*')
              .eq('organization_id', profile.organization_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (reportError) {
              console.error("Error fetching forensic report:", reportError);
            } else if (reportData && reportData.payload_completo) {
              const parsedInsights = mapPayloadToInsights(reportData.payload_completo);
              setState(prev => ({
                ...prev,
                insights: parsedInsights,
              }));
            } else {
              setState(prev => ({
                ...prev,
                insights: null,
              }));
            }
          }

          // Fetch Feedback — skip if table doesn't exist
          if (profile.organization_id) {
            try {
              const { data: feedbackData } = await supabase
                .from('feedback')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .order('created_at', { ascending: false });
              
              if (feedbackData) {
                setState(prev => ({
                  ...prev,
                  feedback: feedbackData.map(f => {
                    const fbId = f.id;
                    const extractedUserId = fbId.includes('_') ? fbId.substring(fbId.indexOf('_') + 1) : undefined;
                    
                    return {
                      id: fbId,
                      title: f.title,
                      description: f.description,
                      type: f.type,
                      status: f.status,
                      priority: f.priority,
                      reportedBy: f.reported_by || "Comunidad Erani",
                      userId: extractedUserId,
                      createdAt: new Date(f.created_at),
                    };
                  }),
                }));
              }
            } catch { /* table may not exist yet */ }
          }

          // Fetch Automations — skip if table doesn't exist
          if (profile.organization_id) {
            try {
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
                }))
              }
            } catch { /* table may not exist yet */ }
          }
          // Fetch Storage Stats globally
          if (profile.organization_id) {
            try {
              const { data: auditsData } = await supabase
                .from('audits')
                .select('metadata')
                .eq('organization_id', profile.organization_id);
              
              let currentGB = 0.002; // Base overhead (~2 MB)
              if (auditsData) {
                auditsData.forEach(d => {
                  if (d.metadata?.files) {
                    d.metadata.files.forEach((f: any) => {
                      currentGB += (f.size || 1000) / (1024 * 1024 * 1024);
                    });
                  }
                });
              }
              const limitGB = org?.paid_subscription ? 10 : 5;
              const isCritical = currentGB >= limitGB * 0.8;
              const isFull = currentGB >= limitGB;
              
              setState(prev => ({
                ...prev,
                storageStats: { 
                  usedGB: Number(currentGB.toFixed(4)), 
                  limitGB, 
                  isCritical, 
                  isFull 
                }
              }));
            } catch (e) {
              console.error("Error computing storage stats", e);
            }
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

  const updateBentoOrder = useCallback((order: WidgetConfig[]) => {
    setState((prev) => ({ ...prev, bentoOrder: order }));
    if (profile) {
      supabase
        .from('user_preferences')
        .upsert({ 
          user_id: profile.id, 
          bento_order: order,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.error("Error saving bento order:", error.message || JSON.stringify(error));
        });
    }
  }, [profile]);

  const addWidget = useCallback((widgetKey: string, colSpan: number = 1) => {
    setState(prev => {
      const newOrder = [...prev.bentoOrder, { 
        id: `${widgetKey}-${Date.now()}`, 
        widgetKey, 
        colSpan 
      }];
      updateBentoOrder(newOrder);
      return { ...prev, bentoOrder: newOrder };
    });
  }, [updateBentoOrder]);

  const removeWidget = useCallback((instanceId: string) => {
    setState(prev => {
      const newOrder = prev.bentoOrder.filter(w => w.id !== instanceId);
      updateBentoOrder(newOrder);
      return { ...prev, bentoOrder: newOrder };
    });
  }, [updateBentoOrder]);

  const updateWidgetConfig = useCallback((instanceId: string, updates: Partial<WidgetConfig>) => {
    setState(prev => {
      const newOrder = prev.bentoOrder.map(w => w.id === instanceId ? { ...w, ...updates } : w);
      updateBentoOrder(newOrder);
      return { ...prev, bentoOrder: newOrder };
    });
  }, [updateBentoOrder]);

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
          }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.error("Error saving preferences:", error.message || JSON.stringify(error));
          });
      }
      return newPrefs;
    });
  }, [profile]);

  const addFeedback = useCallback(async (item: FeedbackItem) => {
    setState((prev) => ({
      ...prev,
      feedback: [item, ...prev.feedback],
    }));
    if (profile) {
      await addFeedbackAction(item);
    }
  }, [profile]);

  const editFeedback = useCallback(async (updatedItem: FeedbackItem) => {
    setState((prev) => ({
      ...prev,
      feedback: prev.feedback.map((f) => (f.id === updatedItem.id ? updatedItem : f)),
    }));
    if (profile) {
      await editFeedbackAction(updatedItem.id, profile.id, updatedItem);
    }
  }, [profile]);

  const updateFeedbackStatus = useCallback(async (id: string, status: FeedbackItem["status"]) => {
    setState((prev) => ({
      ...prev,
      feedback: prev.feedback.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
    if (profile) {
      await updateFeedbackStatusAction(id, status);
    }
  }, [profile]);

  const deleteFeedback = useCallback(async (id: string) => {
    setState((prev) => ({
      ...prev,
      feedback: prev.feedback.filter((f) => f.id !== id),
    }));
    if (profile) {
      await deleteFeedbackAction(id, profile.id);
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
        addWidget,
        removeWidget,
        updateWidgetConfig,
        updatePreferences,
        feedback: state.feedback,
        addFeedback,
        editFeedback,
        updateFeedbackStatus,
        deleteFeedback,
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

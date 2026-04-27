import type { ParsedFile, ParsedTask } from "./fileProcessors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertInsight {
  id: string;
  ticket: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface RevenuePoint {
  name: string;
  value: number;
  recovered: number;
}

export interface InsightData {
  darkDataIndex: number;          // 0–100 %
  scopeCreepPct: number;          // 0–100 %
  roiRecovered: number;           // USD simulated
  trlLevel: number;               // 1–9
  totalTasks: number;
  tasksWithoutEstimate: number;
  scopeCreepTasks: number;
  alerts: AlertInsight[];
  revenueData: RevenuePoint[];
  processingSourceLabel: string;
  timestamp: string;
}

// ─── Scope keyword severity ───────────────────────────────────────────────────
function riskFromTask(task: ParsedTask): "low" | "medium" | "high" | "critical" {
  if (task.priority === "critical" || task.priority === "blocker") return "critical";
  if (task.isScopeCreep && !task.hasEstimate) return "high";
  if (task.isScopeCreep) return "medium";
  return "low";
}

// ─── ROI simulation model ─────────────────────────────────────────────────────
// Every unestimated task = $280 avg cost leak (industry benchmark for SMBs)
// Scope creep tasks compound 2.4x
const COST_PER_UNESTIMATED = 280;
const SCOPE_CREEP_MULTIPLIER = 2.4;

function simulateROI(
  tasksWithoutEstimate: number,
  scopeCreepTasks: number,
  totalTasks: number
): number {
  const baseLeak = tasksWithoutEstimate * COST_PER_UNESTIMATED;
  const scopeLeak = scopeCreepTasks * COST_PER_UNESTIMATED * SCOPE_CREEP_MULTIPLIER;
  // Recovery: ERANI methodology recovers 60–80% of detectable leaks
  const recoveryRate = 0.68 + (totalTasks > 50 ? 0.1 : 0);
  return Math.round((baseLeak + scopeLeak) * recoveryRate);
}

// ─── Revenue sankey data ──────────────────────────────────────────────────────
function buildRevenueData(
  totalTasks: number,
  tasksWithoutEstimate: number,
  scopeCreepTasks: number
): RevenuePoint[] {
  const baseline = 100000;
  const darkLoss = tasksWithoutEstimate * COST_PER_UNESTIMATED;
  const scopeLoss = scopeCreepTasks * COST_PER_UNESTIMATED * SCOPE_CREEP_MULTIPLIER;
  const recovered = simulateROI(tasksWithoutEstimate, scopeCreepTasks, totalTasks);

  return [
    { name: "Revenue Inicial", value: baseline, recovered: 0 },
    { name: "Dark Data Loss", value: Math.round(baseline - darkLoss), recovered: 0 },
    { name: "Scope Creep Loss", value: Math.round(baseline - darkLoss - scopeLoss), recovered: 0 },
    { name: "Post-Intervención", value: Math.round(baseline - darkLoss - scopeLoss + recovered), recovered },
  ];
}

// ─── Alert generation ─────────────────────────────────────────────────────────
function generateAlerts(tasks: ParsedTask[]): AlertInsight[] {
  const alertCandidates: AlertInsight[] = [];

  // No-estimate tasks (top 3 most impactful)
  const noEstimate = tasks.filter((t) => !t.hasEstimate).slice(0, 3);
  noEstimate.forEach((t, i) => {
    alertCandidates.push({
      id: `alert-no-est-${i}`,
      ticket: t.id.length > 10 ? t.id.slice(0, 8).toUpperCase() : t.id.toUpperCase(),
      description: `Sin Time Estimate: "${t.title.slice(0, 50)}"`,
      riskLevel: "high",
    });
  });

  // Scope creep tasks
  const scopeTasks = tasks.filter((t) => t.isScopeCreep).slice(0, 2);
  scopeTasks.forEach((t, i) => {
    alertCandidates.push({
      id: `alert-scope-${i}`,
      ticket: t.id.length > 10 ? t.id.slice(0, 8).toUpperCase() : t.id.toUpperCase(),
      description: `Scope Creep detectado: "${t.title.slice(0, 45)}"`,
      riskLevel: riskFromTask(t),
    });
  });

  // If no real alerts (clean file), generate representative ones
  if (alertCandidates.length === 0) {
    alertCandidates.push(
      {
        id: "alert-demo-1",
        ticket: "ODS-401",
        description: "Ticket sin Time Estimate creado en Jira",
        riskLevel: "high",
      },
      {
        id: "alert-demo-2",
        ticket: "REQ-22",
        description: "Mensaje sugiere cambio de alcance en Slack",
        riskLevel: "medium",
      }
    );
  }

  return alertCandidates.slice(0, 5);
}

// ─── TRL Level derivation ─────────────────────────────────────────────────────
function computeTRL(darkDataIndex: number, scopeCreepPct: number, totalTasks: number): number {
  // More data + lower dark data = higher TRL
  if (totalTasks >= 100 && darkDataIndex < 20) return 7;
  if (totalTasks >= 50 && darkDataIndex < 40) return 6;
  if (totalTasks >= 20 && darkDataIndex < 60) return 5;
  if (totalTasks >= 10) return 4;
  if (totalTasks >= 5) return 3;
  return 2;
}

// ─── Source label ─────────────────────────────────────────────────────────────
const SOURCE_LABELS: Record<string, string> = {
  jira: "Jira Cloud Export",
  slack: "Slack Workspace Export",
  notion: "Notion Database CSV",
  clickup: "ClickUp Tasks CSV",
  generic: "Archivo Genérico",
};

// ─── Main insight computation ─────────────────────────────────────────────────
export function computeInsights(parsedFile: ParsedFile): InsightData {
  const allItems = [...parsedFile.tasks];
  const totalTasks = allItems.length || 1; // avoid division by zero

  const tasksWithoutEstimate = allItems.filter((t) => !t.hasEstimate).length;
  const scopeCreepTasks = allItems.filter((t) => t.isScopeCreep).length;

  const darkDataIndex = Math.min(100, Math.round((tasksWithoutEstimate / totalTasks) * 100));
  const scopeCreepPct = Math.min(100, Math.round((scopeCreepTasks / totalTasks) * 100));

  // Add message-based scope creep to scope %
  const messageScopeCount = parsedFile.messages.filter((m) => m.mentionsScopeKeywords).length;
  const adjustedScopeCreep = Math.min(
    100,
    scopeCreepPct + Math.round((messageScopeCount / Math.max(1, parsedFile.messages.length)) * 20)
  );

  const trlLevel = computeTRL(darkDataIndex, adjustedScopeCreep, totalTasks);
  const roiRecovered = simulateROI(tasksWithoutEstimate, scopeCreepTasks, totalTasks);
  const alerts = generateAlerts(allItems);
  const revenueData = buildRevenueData(totalTasks, tasksWithoutEstimate, scopeCreepTasks);

  return {
    darkDataIndex,
    scopeCreepPct: adjustedScopeCreep,
    roiRecovered,
    trlLevel,
    totalTasks,
    tasksWithoutEstimate,
    scopeCreepTasks,
    alerts,
    revenueData,
    processingSourceLabel: SOURCE_LABELS[parsedFile.source] ?? "Archivo Procesado",
    timestamp: new Date().toISOString(),
  };
}

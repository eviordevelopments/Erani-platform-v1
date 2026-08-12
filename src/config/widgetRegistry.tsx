import React from "react";
import { AlertCircle, TrendingUp, Zap, Clock, ShieldAlert, BarChart3, PieChart, Activity } from "lucide-react";

export type WidgetCategory = "metrics" | "charts" | "forensic" | "standard";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  isBeta?: boolean;
  defaultColSpan?: number;
  mockComponent: React.ReactNode;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: "sankey",
    name: "Flujo de Rentabilidad (Sankey)",
    description: "Visualización de fuga de capital y recuperación.",
    category: "charts",
    defaultColSpan: 2,
    isBeta: false,
    mockComponent: (
      <div className="flex flex-col gap-2 h-full justify-center items-center text-center opacity-70">
        <Activity className="w-8 h-8 text-emerald-500 mb-2" />
        <span className="text-xs uppercase font-black tracking-widest text-emerald-500">Sankey Diagram</span>
        <span className="text-[10px] text-nav-text">Mock Data: $100k {"->"} Fuga {"->"} Recuperación</span>
      </div>
    )
  },
  {
    id: "dark-data",
    name: "Dark Data Index",
    description: "Porcentaje de tareas no registradas manualmente.",
    category: "forensic",
    defaultColSpan: 1,
    isBeta: false,
    mockComponent: (
      <div className="flex flex-col gap-2 h-full justify-center items-center text-center opacity-70">
        <PieChart className="w-8 h-8 text-erani-coral mb-2" />
        <span className="text-xs uppercase font-black tracking-widest text-erani-coral">Dark Data</span>
        <span className="text-[10px] text-nav-text">Mock Data: 90%</span>
      </div>
    )
  },
  {
    id: "scope-creep",
    name: "Scope Creep Intensity",
    description: "Fuga atribuible a extensiones no presupuestadas.",
    category: "forensic",
    defaultColSpan: 1,
    isBeta: false,
    mockComponent: (
      <div className="flex flex-col gap-2 h-full justify-center items-center text-center opacity-70">
        <PieChart className="w-8 h-8 text-erani-purple mb-2" />
        <span className="text-xs uppercase font-black tracking-widest text-erani-purple">Scope Creep</span>
        <span className="text-[10px] text-nav-text">Mock Data: 50%</span>
      </div>
    )
  },
  {
    id: "alerts",
    name: "Firewall Alerts",
    description: "Alertas forenses en tiempo real.",
    category: "standard",
    defaultColSpan: 2,
    isBeta: true,
    mockComponent: (
      <div className="flex flex-col gap-2 h-full justify-center items-center text-center opacity-70">
        <ShieldAlert className="w-8 h-8 text-erani-blue mb-2" />
        <span className="text-xs uppercase font-black tracking-widest text-erani-blue">Intruder Alerts</span>
        <span className="text-[10px] text-nav-text">Mock Data: 3 Alertas críticas</span>
      </div>
    )
  },
  {
    id: "roi-projection",
    name: "ROI Projection",
    description: "Proyección predictiva de retorno de inversión.",
    category: "metrics",
    defaultColSpan: 1,
    isBeta: true,
    mockComponent: (
      <div className="flex flex-col gap-2 h-full justify-center items-center text-center opacity-70">
        <TrendingUp className="w-8 h-8 text-white mb-2" />
        <span className="text-xs uppercase font-black tracking-widest text-white">ROI Predictivo</span>
        <span className="text-[10px] text-nav-text">Mock Data: +$14k USD/mes</span>
      </div>
    )
  },
  {
    id: "team-efficiency",
    name: "Eficiencia de Equipo",
    description: "Burnout risk y velocidad de entrega.",
    category: "charts",
    defaultColSpan: 1,
    isBeta: true,
    mockComponent: (
      <div className="flex flex-col gap-2 h-full justify-center items-center text-center opacity-70">
        <BarChart3 className="w-8 h-8 text-orange-400 mb-2" />
        <span className="text-xs uppercase font-black tracking-widest text-orange-400">Team Velocity</span>
        <span className="text-[10px] text-nav-text">Mock Data: Alta Carga</span>
      </div>
    )
  }
];

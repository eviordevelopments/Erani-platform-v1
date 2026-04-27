"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertCircle, Info, Database } from "lucide-react";
import { useDashboard, UploadedSource } from "@/context/DashboardContext";

interface ChecklistItem {
  id: string;
  source: UploadedSource;
  label: string;
  status: "pending" | "processing" | "completed";
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "status">[] = [
  { id: "jira", source: "jira", label: "Logs de Gestión de Tareas (Jira)" },
  { id: "slack", source: "slack", label: "Historial de Canales Operativos (Slack)" },
  { id: "notion", source: "notion", label: "Reporte de Estimaciones (Notion/ClickUp)" },
];

export default function TechChecklist() {
  const { uploadedFiles, processingState } = useDashboard();

  // Combine default items with upload status
  const checklistItems: ChecklistItem[] = DEFAULT_ITEMS.map((item) => {
    const isUploaded = uploadedFiles.some(f => f.source === item.source);
    
    let status: "pending" | "processing" | "completed" = "pending";
    if (processingState === "parsing" || processingState === "computing") {
      status = "processing";
    } else if (isUploaded) {
      status = "completed";
    }

    return { ...item, status };
  });

  const processedCount = checklistItems.filter(i => i.status === 'completed').length;
  const progressPercent = Math.round((processedCount / checklistItems.length) * 100);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">Checklist Técnico (TRL 4)</h3>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-erani-blue">{progressPercent}% PROCESADO</span>
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="bg-erani-blue h-full shadow-[0_0_10px_rgba(0,85,160,0.5)] transition-all" 
                />
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {checklistItems.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glassmorphism p-5 flex items-center justify-between border transition-all group ${
                item.status === 'completed' ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                item.status === 'processing' ? 'bg-erani-blue/10 text-erani-blue animate-pulse' :
                'bg-white/5 text-gray-600'
              }`}>
                {item.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                 item.status === 'processing' ? <Database className="w-5 h-5 animate-pulse" /> :
                 <Circle className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black tracking-widest text-erani-blue/60">{item.source}</span>
                <span className={`text-sm font-bold tracking-tight ${item.status === 'completed' ? 'text-gray-300' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-gray-700 hover:text-white transition-colors cursor-help" />
                <span className={`text-[8px] uppercase font-black tracking-widest px-2 py-1 rounded-md border ${
                    item.status === 'completed' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                    item.status === 'processing' ? 'border-erani-blue/20 text-erani-blue animate-pulse' :
                    'border-white/5 text-gray-700'
                }`}>
                    {item.status === 'completed' ? 'Ok' : statusMap[item.status]}
                </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const statusMap = {
    pending: "Pendiente",
    processing: "Analizando...",
    completed: "Verificado"
};

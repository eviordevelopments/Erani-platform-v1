"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  FileJson, 
  FileType, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  X,
  FileText,
  Clock,
  Layers,
  Database,
  Cpu
} from "lucide-react";
import { useDashboard, UploadedSource } from "@/context/DashboardContext";
import { parseFile, detectSource, FileSource } from "@/lib/fileProcessors";
import { computeInsights } from "@/lib/insightEngine";

const PLATFORMS: { id: UploadedSource; name: string; icon: any; color: string }[] = [
  { id: "jira", name: "Jira", icon: FileJson, color: "#0052CC" },
  { id: "slack", name: "Slack", icon: FileType, color: "#4A154B" },
  { id: "notion", name: "Notion", icon: FileText, color: "#000000" },
  { id: "clickup", name: "ClickUp", icon: Clock, color: "#7B68EE" },
  { id: "generic", name: "Otros", icon: Database, color: "#666666" },
];

const PROCESSING_STEPS = [
  { id: "loading", label: "Cargando archivo", icon: UploadCloud, progress: 20, duration: 800 },
  { id: "detecting", label: "Detectando estructura", icon: Database, progress: 40, duration: 1000 },
  { id: "extracting", label: "Extrayendo metadata", icon: Layers, progress: 60, duration: 1500 },
  { id: "calculating", label: "Calculando Dark Data & Scope Creep", icon: Cpu, progress: 85, duration: 1200 },
  { id: "finishing", label: "Generando insights", icon: CheckCircle, progress: 100, duration: 800 },
];

export default function FileIngestionEngine() {
  const { startProcessing, completeProcessing, resetProcessing, processingState, processingStep, processingProgress } = useDashboard();
  const [selectedPlatform, setSelectedPlatform] = useState<UploadedSource | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  const processFile = useCallback(async (file: File) => {
    startProcessing("Iniciando carga", 10);
    
    try {
      // 1. Upload to our new API endpoint
      const formData = new FormData();
      formData.append('file', file);
      // In a real app, these would come from auth context
      formData.append('organizationId', 'a1b2c3d4-0000-0000-0000-000000000001'); 
      
      setCurrentStepIndex(0);
      startProcessing("Subiendo a Evidencia Primaria", 30);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Carga fallida');
      
      const result = await response.json();
      
      // 2. Continue with local simulation for UX/UI "Analysis" feel
      for (let i = 1; i < PROCESSING_STEPS.length; i++) {
        const step = PROCESSING_STEPS[i];
        setCurrentStepIndex(i);
        startProcessing(step.label, step.progress);
        await new Promise(resolve => setTimeout(resolve, step.duration / 2)); // Slightly faster since file is already up
      }

      // 3. Process locally for immediate dashboard display (using the same logic as before)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const parsedFile = parseFile(content, file.name, selectedPlatform || undefined);
        const insights = computeInsights(parsedFile);
        
        completeProcessing({
          id: result.document.id,
          name: file.name,
          source: parsedFile.source as UploadedSource,
          uploadedAt: new Date(),
          rowCount: parsedFile.rawRowCount
        }, insights);

        // Notify other components (EvidenceLibrary) to refresh
        window.dispatchEvent(new CustomEvent('ingestion-complete'));
      };
      reader.readAsText(file);

    } catch (err) {
      console.error("Error processing file:", err);
      resetProcessing();
      alert("Error al procesar el archivo. Revisa la consola.");
    }
  }, [selectedPlatform, startProcessing, completeProcessing, resetProcessing]);

  const ACCEPTED_TYPES = ['.json', '.csv', '.pdf', '.xlsx'];

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_TYPES.some(ext => file.name.endsWith(ext))) {
      processFile(file);
    }
  }, [processFile]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-nav-text">Motor de Ingesta Forense</h3>
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-bold text-nav-text uppercase tracking-widest px-2 py-1 bg-foreground/5 rounded-md border border-glass-border">
             E-vior AI Engine v2.0
           </span>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="grid grid-cols-5 gap-3">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
              selectedPlatform === platform.id 
                ? "bg-foreground/10 border-erani-blue shadow-xl" 
                : "bg-foreground/5 border-glass-border opacity-70 hover:opacity-100"
            }`}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: `${platform.color}33`, color: platform.color }}
            >
              <platform.icon className="w-5 h-5" />
            </div>
            <span className="text-[8px] uppercase font-black tracking-widest text-foreground">{platform.name}</span>
          </button>
        ))}
      </div>

      {/* Main Drop Zone */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {processingState === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`h-72 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all bg-foreground/5 group relative overflow-hidden ${
                isDragging ? 'border-erani-blue bg-erani-blue/5' : 'border-glass-border hover:border-erani-blue/50'
              }`}
            >
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={onFileSelect}
                accept=".json,.csv,.pdf,.xlsx"
              />
              <div className="w-20 h-20 rounded-2xl bg-foreground/5 border border-glass-border flex items-center justify-center text-erani-blue group-hover:scale-110 shadow-[0_0_30px_rgba(0,85,160,0.15)] transition-transform duration-500">
                <UploadCloud className="w-10 h-10" />
              </div>
              <div className="flex flex-col items-center gap-2 mt-6">
                <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-erani-blue transition-colors">Arrastra tus archivos de metadata</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-nav-text">CSV · JSON · PDF · XLSX — Slack, Jira, ClickUp, Notion</span>
              </div>
              
              {/* Background Accent */}
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-erani-blue/5 blur-[80px] rounded-full pointer-events-none" />
            </motion.div>
          ) : processingState === "complete" ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-72 glassmorphism border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center justify-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-black text-foreground uppercase tracking-tight">Análisis Forense Completado</span>
                <span className="text-[10px] uppercase font-bold text-emerald-500/80 tracking-widest">Metadata triangulada y lista en el dashboard</span>
              </div>
                <button 
                onClick={resetProcessing}
                className="text-[10px] uppercase font-black tracking-[0.2em] text-nav-text hover:text-foreground transition-colors"
              >
                Analizar otro archivo
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-72 glassmorphism flex flex-col items-center justify-center gap-8 p-12"
            >
              <div className="w-full flex flex-col gap-6">
                 {/* Progress Indicator */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Image src="/isologo.png" alt="Processing" width={20} height={20} className="animate-spin" />
                       <span className="text-sm font-bold text-foreground tracking-tight">{processingStep}</span>
                    </div>
                    <span className="text-xs font-black text-erani-blue">{processingProgress}%</span>
                 </div>

                 {/* Bar */}
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${processingProgress}%` }}
                      className="h-full bg-gradient-to-r from-erani-blue to-erani-purple shadow-[0_0_15px_rgba(0,85,160,0.5)]"
                    />
                 </div>

                 {/* Step Log */}
                 <div className="flex flex-col gap-2">
                    {PROCESSING_STEPS.map((step, idx) => {
                      const isPast = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div key={step.id} className={`flex items-center gap-3 transition-all duration-500 ${isPast || isCurrent ? 'opacity-100' : 'opacity-10'}`}>
                           <step.icon className={`w-3 h-3 ${isPast ? 'text-emerald-500' : isCurrent ? 'text-erani-blue animate-pulse' : 'text-gray-600'}`} />
                           <span className={`text-[9px] uppercase font-bold tracking-widest ${isPast ? 'text-emerald-500/60' : isCurrent ? 'text-foreground' : 'text-nav-text'}`}>
                             {step.label}
                           </span>
                        </div>
                      );
                    })}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 p-5 rounded-2xl bg-erani-blue/5 border border-erani-blue/10">
          <AlertTriangle className="w-5 h-5 text-erani-blue shrink-0" />
          <p className="text-[10px] text-nav-text font-medium leading-relaxed">
             Importante: Para plataformas como Jira o Slack, utiliza la opción <span className="text-foreground italic">"Exportar Workspace"</span>. 
             No procesamos datos PII (información personalmente identificable), solo metadatos operativos para TRL.
          </p>
      </div>
    </div>
  );
}

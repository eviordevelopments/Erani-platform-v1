"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileJson, FileType, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function MetadataUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setStatus("uploading");
    
    // Simulate upload delay for forensic analysis
    setTimeout(() => {
        setStatus("success");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">Ingesta de Metadatos (Forensic)</h3>
        <span className="text-[10px] font-bold text-gray-700 tracking-[0.2em] uppercase px-3 py-1 bg-white/5 rounded-full border border-white/5">
            Protocolo Zero-Knowledge
        </span>
      </div>

      <motion.div 
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all bg-white/5 group ${
            isDragging ? 'border-erani-blue bg-erani-blue/5' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <AnimatePresence mode="wait">
            {status === 'idle' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-4 text-center px-8"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-erani-blue group-hover:scale-110 shadow-[0_0_20px_rgba(0,85,160,0.1)] transition-transform duration-500">
                        <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold tracking-tight text-white group-hover:text-erani-blue transition-colors">Arrastra tus archivos de metadata</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Soporta ZIP, CSV, JSON de Slack/Jira/ClickUp</span>
                    </div>
                </motion.div>
            )}

            {status === 'uploading' && (
                <motion.div 
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-center"
                >
                    <Loader2 className="w-10 h-10 text-erani-blue animate-spin" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold tracking-tight text-white">Analizando Estructura Forense...</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-erani-blue/80">Cifrando metadatos en tránsito</span>
                    </div>
                </motion.div>
            )}

            {status === 'success' && (
                <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold tracking-tight text-emerald-500">Ingesta Completada (TRL 5)</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">Metadata lista para triangulación</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Floating Icons Decore */}
        <div className="absolute top-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileJson className="w-6 h-6 text-gray-500" />
        </div>
        <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileType className="w-6 h-6 text-gray-500" />
        </div>
      </motion.div>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/10">
          <AlertTriangle className="w-4 h-4 text-erani-blue" />
          <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
             Importante: Los metadatos de Slack deben exportarse desde <span className="text-white italic">Ajustes del Espacio de Trabajo</span>. No necesitamos acceso a tus canales privados ni DM.
          </p>
      </div>
    </div>
  );
}

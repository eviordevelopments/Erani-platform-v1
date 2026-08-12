"use client";

import { FileImage, ShieldCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface DataRoomGalleryProps {
  reports: any[];
  colorTag: string;
}

export default function DataRoomGallery({ reports, colorTag }: DataRoomGalleryProps) {
  const router = useRouter();
  const hasData = reports && reports.length > 0;

  return (
    <div className="relative w-full min-h-[400px]">
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 z-10 ${!hasData ? 'opacity-30 grayscale' : ''}`}>
        {(hasData ? reports : Array(6).fill({})).map((r, i) => {
          const impact = hasData ? (r.impacto_directo || 0) : Math.random() * 500000;
          const date = hasData ? new Date(r.created_at) : new Date();
          
          return (
            <div 
               key={hasData ? r.id : i} 
               onClick={() => hasData && router.push(`/forensic?id=${r.id}`)}
               className={`glassmorphism p-5 rounded-3xl border border-glass-border flex flex-col gap-4 group hover:border-foreground/20 transition-all hover:-translate-y-1 ${hasData ? 'cursor-pointer' : ''}`}
            >
              
              {/* Header */}
              <div className="flex justify-between items-start">
                 <div className={`w-10 h-10 rounded-2xl bg-${colorTag}/10 flex items-center justify-center text-${colorTag}`}>
                    <FileImage className="w-5 h-5" />
                 </div>
                 <span className="text-[9px] uppercase font-bold text-gray-500 bg-background/50 px-2 py-1 rounded-md border border-glass-border">
                    {format(date, "MMM yyyy", { locale: es })}
                 </span>
              </div>

              {/* Title */}
              <div>
                <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-tight">
                  {hasData ? r.project_name : `Proyecto Visual de Evidencia ${i+1}`}
                </h4>
                <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase">Ref: {hasData ? r.id.toString().substring(0,8) : `REF-${i}A4B`}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                 <div className="bg-background/50 p-3 rounded-xl border border-glass-border flex flex-col gap-1">
                    <ShieldCheck className={`w-4 h-4 ${impact === 0 ? 'text-emerald-500' : 'text-gray-500'}`} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Estado</span>
                    <span className={`text-xs font-bold ${impact === 0 ? 'text-emerald-500' : 'text-erani-coral'}`}>
                      {impact === 0 ? 'Limpio' : 'Vulnerado'}
                    </span>
                 </div>
                 <div className="bg-background/50 p-3 rounded-xl border border-glass-border flex flex-col gap-1">
                    <AlertTriangle className={`w-4 h-4 ${impact > 0 ? 'text-erani-coral' : 'text-gray-500'}`} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Fuga Métrica</span>
                    <span className="text-xs font-bold text-foreground">
                      ${(impact / 1000).toFixed(1)}k
                    </span>
                 </div>
              </div>

            </div>
          )
        })}
      </div>

      {!hasData && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]">
          <div className="bg-background/80 border border-glass-border px-8 py-6 rounded-3xl flex flex-col items-center gap-4 shadow-2xl text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
               <FileImage className="w-6 h-6 text-gray-500" />
            </div>
            <div>
               <h4 className="text-sm uppercase font-black tracking-widest text-foreground">Galería Vacía</h4>
               <p className="text-xs text-gray-400 mt-2 leading-relaxed">No se encontraron evidencias gráficas o proyectos visuales con los filtros actuales.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface DataRoomTableProps {
  reports: any[];
  colorTag: string;
}

export default function DataRoomTable({ reports, colorTag }: DataRoomTableProps) {
  const router = useRouter();
  const hasData = reports && reports.length > 0;

  return (
    <div className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-6 w-full relative min-h-[400px]">
      <div className="flex justify-between items-center z-10">
        <h3 className="text-sm uppercase font-black tracking-widest text-foreground">
          Registro Tabular de Evidencia
        </h3>
      </div>

      <div className={`w-full overflow-x-auto custom-scrollbar z-10 ${!hasData ? 'opacity-30 grayscale' : ''}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-gray-500 whitespace-nowrap">ID Ref</th>
              <th className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-gray-500 whitespace-nowrap">Proyecto / Caso</th>
              <th className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-gray-500 whitespace-nowrap">Fecha de Ingreso</th>
              <th className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-gray-500 whitespace-nowrap">Fuga Detectada</th>
              <th className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-gray-500 whitespace-nowrap">Señales Riesgo</th>
              <th className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-gray-500 whitespace-nowrap">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(hasData ? reports : Array(5).fill({})).map((r, i) => {
              const impact = hasData ? (r.impacto_directo || 0) : Math.random() * 500000;
              const date = hasData ? new Date(r.created_at) : new Date();
              return (
                <tr key={hasData ? r.id : i} className="border-b border-glass-border/50 hover:bg-foreground/5 transition-colors group">
                  <td className="py-4 px-4 text-xs font-mono text-gray-400">
                    {hasData ? r.id.toString().substring(0,8).toUpperCase() : `REF-${i}A4B`}
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-foreground">
                    {hasData ? r.project_name : `Proyecto de Prueba ${i+1}`}
                  </td>
                  <td className="py-4 px-4 text-xs text-gray-400">
                    {format(date, "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className={`py-4 px-4 text-xs font-bold ${impact > 0 ? 'text-erani-coral' : 'text-gray-500'}`}>
                    ${impact.toLocaleString()} MXN
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <span className={`px-2 py-1 rounded-md bg-${colorTag}/10 text-${colorTag} border border-${colorTag}/30 text-[10px] uppercase font-bold`}>
                      {hasData ? (impact > 1000000 ? 'Alto' : impact > 0 ? 'Medio' : 'Bajo') : 'Desconocido'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button 
                       onClick={() => hasData && router.push(`/forensic?id=${r.id}`)}
                       className={`text-gray-500 hover:text-${colorTag} transition-colors p-1.5 rounded-lg hover:bg-foreground/10`}
                    >
                       <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!hasData && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]">
          <div className="bg-background/80 border border-glass-border px-8 py-6 rounded-3xl flex flex-col items-center gap-4 shadow-2xl text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
               <FileText className="w-6 h-6 text-gray-500" />
            </div>
            <div>
               <h4 className="text-sm uppercase font-black tracking-widest text-foreground">Sin Registros Tabulares</h4>
               <p className="text-xs text-gray-400 mt-2 leading-relaxed">No hay dictámenes forenses que cumplan con los filtros seleccionados para mostrar en esta tabla.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

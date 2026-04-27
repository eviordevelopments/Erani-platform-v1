"use client";

import { motion } from "framer-motion";

interface RevenuePoint {
  name: string;
  value: number;
  recovered: number;
}

interface SankeyDiagramProps {
  data?: RevenuePoint[];
}

export default function SankeyDiagram({ data }: SankeyDiagramProps) {
  // Use data from props or fallback to demo defaults
  const displayData = data || [
    { name: "Fuga Actual", value: 16800, recovered: 0 },
    { name: "Punto Crítico", value: 34000, recovered: 0 },
    { name: "Estabilización", value: 50400, recovered: 50400 },
  ];

  const first = displayData[0];
  const last = displayData[displayData.length - 1];

  return (
    <div className="w-full relative py-8 overflow-hidden rounded-3xl bg-foreground/5 border border-glass-border">
      <div className="flex justify-between items-center mb-12 px-8">
         <div className="flex flex-col gap-1 z-10">
             <span className="text-[10px] uppercase font-black text-nav-text tracking-[0.2em]">{first.name}</span>
             <span className="text-3xl font-black text-foreground">${first.value.toLocaleString()} USD</span>
         </div>
         <div className="flex flex-col gap-1 items-end z-10">
             <span className="text-[10px] uppercase font-black text-erani-blue tracking-[0.2em]">{last.name}</span>
             <span className="text-3xl font-black text-erani-blue">
               {last.recovered > 0 ? `+` : ""}${last.value.toLocaleString()} USD
             </span>
         </div>
      </div>

      <div className="relative h-28 w-full px-8 flex">
          {/* Custom SVG flow animation to mimic Sankey */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 100">
             <defs>
                 <linearGradient id="sankeyGrad" x1="0" y1="0" x2="1" y2="0">
                     <stop offset="0%" stopColor="#FF5C5C" stopOpacity="0.8" />
                     <stop offset="50%" stopColor="#9e80ff" stopOpacity="0.5" />
                     <stop offset="100%" stopColor="#0055A0" stopOpacity="0.8" />
                 </linearGradient>
             </defs>
             <motion.path 
                d={`M 0,20 C 150,20 250,80 400,80 C 550,80 650,20 800,20`}
                fill="none"
                stroke="url(#sankeyGrad)"
                strokeWidth="40"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="opacity-30"
             />
             <motion.path 
                d={`M 0,20 C 150,20 250,80 400,80 C 550,80 650,20 800,20`}
                fill="none"
                stroke="url(#sankeyGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                className="opacity-60"
                strokeDasharray="20 100"
             />
          </svg>
      </div>

      <div className="mt-12 px-8 flex justify-between">
          {displayData.map((pt, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-widest text-nav-text">{pt.name}</span>
          ))}
      </div>
    </div>
  );
}

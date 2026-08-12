"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Filter, BarChart2, Table, Image as ImageIcon, ChevronDown, Check } from "lucide-react";

function CustomSelect({ icon: Icon, label, value, options, onChange, colorTag }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-background/30 px-3 py-2 rounded-xl border border-glass-border hover:bg-foreground/5 transition-colors h-full"
      >
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[9px] uppercase font-bold text-gray-500">{label}</span>
        <span className="text-[10px] font-black uppercase text-foreground whitespace-nowrap">{selectedOption?.label || "Seleccionar"}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-max min-w-[160px] bg-background/95 backdrop-blur-md border border-glass-border rounded-xl shadow-xl overflow-hidden z-50 flex flex-col p-1 animate-fade-in origin-top-left">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${value === opt.value ? 'bg-erani-blue text-white' : 'text-gray-500 hover:bg-foreground/10 hover:text-foreground'}`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DataRoomFiltersProps {
  viewMode: 'dashboard' | 'table' | 'gallery';
  setViewMode: (val: 'dashboard' | 'table' | 'gallery') => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  xAxis: 'project' | 'date';
  setXAxis: (val: 'project' | 'date') => void;
  yAxis: 'impact' | 'alerts';
  setYAxis: (val: 'impact' | 'alerts') => void;
  colorTag: string;
  customStartDate?: string;
  setCustomStartDate?: (val: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (val: string) => void;
}

export default function DataRoomFilters({ 
  viewMode, setViewMode, 
  dateFilter, setDateFilter,
  xAxis, setXAxis,
  yAxis, setYAxis,
  colorTag,
  customStartDate, setCustomStartDate,
  customEndDate, setCustomEndDate
}: DataRoomFiltersProps) {
  
  const cssColor = colorTag.startsWith('#') ? colorTag : `var(--${colorTag}, #7404FF)`;

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between glassmorphism p-4 rounded-2xl border border-glass-border shrink-0 z-20">
      
      {/* View Selectors */}
      <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-xl border border-glass-border">
        <button 
          onClick={() => setViewMode('dashboard')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all ${viewMode === 'dashboard' ? 'bg-foreground text-background shadow-md' : 'text-gray-500 hover:text-foreground'}`}
        >
          <BarChart2 className="w-4 h-4" /> Dashboard
        </button>
        <button 
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all ${viewMode === 'table' ? 'bg-foreground text-background shadow-md' : 'text-gray-500 hover:text-foreground'}`}
        >
          <Table className="w-4 h-4" /> Tabla
        </button>
        <button 
          onClick={() => setViewMode('gallery')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all ${viewMode === 'gallery' ? 'bg-foreground text-background shadow-md' : 'text-gray-500 hover:text-foreground'}`}
        >
          <ImageIcon className="w-4 h-4" /> Galería
        </button>
      </div>

      {/* Axis & Date Filters */}
      <div className="flex flex-wrap items-stretch gap-3">
        <CustomSelect 
          icon={Filter}
          label="Eje X:"
          value={xAxis}
          onChange={setXAxis}
          options={[
            { value: 'project', label: 'Proyecto' },
            { value: 'date', label: 'Fecha' }
          ]}
          colorTag={colorTag}
        />

        <CustomSelect 
          icon={Filter}
          label="Eje Y:"
          value={yAxis}
          onChange={setYAxis}
          options={[
            { value: 'impact', label: 'Fuga de Capital' },
            { value: 'alerts', label: 'Alertas Riesgo' }
          ]}
          colorTag={colorTag}
        />

        <CustomSelect 
          icon={Calendar}
          label="Fecha:"
          value={dateFilter}
          onChange={setDateFilter}
          options={[
            { value: 'all', label: 'Histórico Total' },
            { value: '30days', label: 'Últimos 30 Días' },
            { value: 'this_year', label: 'Este Año' },
            { value: 'custom', label: 'Personalizado...' }
          ]}
          colorTag={colorTag}
        />

        {dateFilter === 'custom' && setCustomStartDate && setCustomEndDate && (
          <div className="flex items-center gap-2 bg-background/30 px-3 py-1.5 rounded-xl border border-glass-border animate-fade-in">
             <input 
               type="date" 
               value={customStartDate || ''} 
               onChange={(e) => setCustomStartDate(e.target.value)}
               className="bg-transparent text-[10px] font-black uppercase text-foreground outline-none cursor-pointer [color-scheme:dark]"
             />
             <span className="text-gray-500 text-xs">-</span>
             <input 
               type="date" 
               value={customEndDate || ''} 
               onChange={(e) => setCustomEndDate(e.target.value)}
               className="bg-transparent text-[10px] font-black uppercase text-foreground outline-none cursor-pointer [color-scheme:dark]"
             />
          </div>
        )}
      </div>

    </div>
  );
}

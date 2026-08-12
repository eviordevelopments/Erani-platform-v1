"use client";

import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from "recharts";
import { Activity, LayoutGrid, TrendingUp, ChevronDown, Check } from "lucide-react";

function CustomChartSelect({ value, options, onChange, colorHex }: any) {
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-foreground/5 transition-colors"
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
        <span className="text-[10px] font-black uppercase text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{selectedOption?.label || "Seleccionar"}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-max min-w-[160px] max-w-[200px] bg-background/95 backdrop-blur-md border border-glass-border rounded-xl shadow-xl overflow-hidden z-50 flex flex-col p-1 animate-fade-in origin-top-left">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors text-left ${value === opt.value ? 'bg-erani-blue text-white' : 'text-gray-500 hover:bg-foreground/10 hover:text-foreground'}`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check className="w-3 h-3 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DataRoomChartsProps {
  reports: any[];
  xAxis: 'project' | 'date';
  yAxis: 'impact' | 'alerts';
  colorTag: string;
}

export default function DataRoomCharts({ reports, xAxis, yAxis, colorTag }: DataRoomChartsProps) {
  // Generar datos vacíos para el Empty State
  const emptyData = [
    { project: "Prueba 1", date: "Lun", impact: 100, alerts: 1 },
    { project: "Prueba 2", date: "Mar", impact: 400, alerts: 3 },
    { project: "Prueba 3", date: "Mié", impact: 200, alerts: 0 },
    { project: "Prueba 4", date: "Jue", impact: 600, alerts: 5 },
    { project: "Prueba 5", date: "Vie", impact: 300, alerts: 2 },
  ];

  const hasData = reports && reports.length > 0;
  const displayData = hasData ? reports : emptyData;

  // Procesamiento de datos (muy simplificado para UI)
  const chartData = displayData.map(r => ({
    name: xAxis === 'project' ? r.project_name || r.project : new Date(r.created_at || Date.now()).toLocaleDateString(),
    value: yAxis === 'impact' ? (r.impacto_directo || r.impact) : (r.alertas || r.alerts || 0)
  }));

  const valueFormatter = (value: number) => {
    if (yAxis === 'impact') return `$${value.toLocaleString()} MXN`;
    return `${value} Alertas`;
  };

  const cssColor = colorTag.startsWith('#') ? colorTag : `var(--${colorTag}, #7404FF)`; // Fallback color

  // Setup options for comparative chart based on actual reports
  const reportOptions = displayData.map(r => ({
    value: r.id ? r.id.toString() : r.project,
    label: r.project_name || r.project || `Reporte ${r.id}`
  }));

  const [auditA, setAuditA] = useState<string>("");
  const [auditB, setAuditB] = useState<string>("");

  useEffect(() => {
    if (reportOptions.length > 0) {
      if (!auditA) setAuditA(reportOptions[0].value);
      if (!auditB) setAuditB(reportOptions[1]?.value || reportOptions[0].value);
    }
  }, [reportOptions, auditA, auditB]);

  const repA = displayData.find(r => (r.id ? r.id.toString() : r.project) === auditA);
  const repB = displayData.find(r => (r.id ? r.id.toString() : r.project) === auditB);

  const baseA = yAxis === 'impact' ? (repA?.impacto_directo || repA?.impact || 0) : (repA?.alertas || repA?.alerts || 0);
  const baseB = yAxis === 'impact' ? (repB?.impacto_directo || repB?.impact || 0) : (repB?.alertas || repB?.alerts || 0);

  // Generamos una curva evolutiva basada en los datos reales totales del reporte
  const comparisonData = [
    { date: "Ene", actual: Math.round(baseA * 1.5), anterior: Math.round(baseB * 1.8) },
    { date: "Feb", actual: Math.round(baseA * 1.2), anterior: Math.round(baseB * 1.4) },
    { date: "Mar", actual: Math.round(baseA * 0.9), anterior: Math.round(baseB * 1.2) },
    { date: "Abr", actual: Math.round(baseA * 0.7), anterior: Math.round(baseB * 1.0) },
    { date: "May", actual: Math.round(baseA * 0.5), anterior: Math.round(baseB * 0.8) },
    { date: "Jun", actual: Math.round(baseA * 0.2), anterior: Math.round(baseB * 0.5) },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-md border border-glass-border p-3 rounded-2xl shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-foreground mb-1">{label}</p>
          <p className="text-[11px] font-bold" style={{ color: payload[0].color }}>
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Tendencias */}
      <div className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-6 relative overflow-hidden h-[350px]">
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${colorTag}/10 text-${colorTag}`}>
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm uppercase font-black tracking-widest text-foreground">
              Tendencia de {yAxis === 'impact' ? 'Fuga' : 'Riesgo'}
            </h3>
          </div>
        </div>

        <div className={`flex-1 w-full h-full relative z-10 ${!hasData ? 'opacity-30 grayscale transition-all' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cssColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={cssColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: 'currentColor', opacity: 0.5}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: 'currentColor', opacity: 0.5}} axisLine={false} tickLine={false} tickFormatter={(val) => yAxis === 'impact' ? `$${val/1000}k` : val} />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.2 }}
                formatter={(value: any) => [valueFormatter(value), yAxis === 'impact' ? 'Fuga' : 'Alertas']}
              />
              <Area type="monotone" dataKey="value" stroke={cssColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {!hasData && (
          <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-background/80 border border-glass-border px-6 py-3 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
              <Activity className="w-6 h-6 text-gray-500" />
              <p className="text-xs uppercase font-black tracking-widest text-gray-400">Sin Datos de Tendencia</p>
            </div>
          </div>
        )}
      </div>

      {/* Comparativa */}
      <div className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-6 relative overflow-hidden h-[350px]">
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${colorTag}/10 text-${colorTag}`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h3 className="text-sm uppercase font-black tracking-widest text-foreground">
              Comparativa por {xAxis === 'project' ? 'Proyecto' : 'Fecha'}
            </h3>
          </div>
        </div>

        <div className={`flex-1 w-full h-full relative z-10 ${!hasData ? 'opacity-30 grayscale transition-all' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{fontSize: 9, fill: 'currentColor', opacity: 0.5}} axisLine={false} tickLine={false} width={80} />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{fill: 'currentColor', opacity: 0.05}}
                formatter={(value: any) => [valueFormatter(value), yAxis === 'impact' ? 'Fuga' : 'Alertas']}
              />
              <Bar dataKey="value" fill={cssColor} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {!hasData && (
          <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-background/80 border border-glass-border px-6 py-3 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
              <LayoutGrid className="w-6 h-6 text-gray-500" />
              <p className="text-xs uppercase font-black tracking-widest text-gray-400">Sin Datos para Comparar</p>
            </div>
          </div>
        )}
      </div>

      {/* Evolución Comparativa de Auditorías */}
      <div className="glassmorphism p-6 rounded-3xl border border-glass-border flex flex-col gap-6 relative overflow-hidden h-[450px] lg:col-span-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${colorTag}/10 text-${colorTag}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm uppercase font-black tracking-widest text-foreground">
              Comparativa Evolutiva
            </h3>
          </div>

          {/* Selectores de Auditoría Dinámicos */}
          <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-xl border border-glass-border">
             <CustomChartSelect 
                value={auditA}
                options={reportOptions}
                onChange={setAuditA}
                colorHex={cssColor}
             />
             <div className="w-px h-6 bg-glass-border" />
             <CustomChartSelect 
                value={auditB}
                options={reportOptions}
                onChange={setAuditB}
                colorHex="#6b7280"
             />
          </div>
        </div>

        <div className="flex-1 w-full relative z-10 mt-2 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: 'currentColor', opacity: 0.5}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: 'currentColor', opacity: 0.5}} axisLine={false} tickLine={false} tickFormatter={(val) => yAxis === 'impact' ? `$${val/1000}k` : val} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--glass-border)', borderRadius: '1rem', color: 'var(--foreground)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ fontSize: '10px', textTransform: 'uppercase', color: 'gray', marginBottom: '8px' }}
                formatter={(value: any) => [valueFormatter(value), yAxis === 'impact' ? 'Fuga' : 'Alertas']}
              />
              <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="actual" 
                name={repA?.project_name || repA?.project || "Auditoría A"} 
                stroke={cssColor} 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }} 
                activeDot={{ r: 6, strokeWidth: 0, fill: cssColor }} 
              />
              <Line 
                type="monotone" 
                dataKey="anterior" 
                name={repB?.project_name || repB?.project || "Auditoría B"} 
                stroke="#6b7280" 
                strokeWidth={3} 
                strokeDasharray="5 5" 
                dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="z-10 flex items-center justify-center border-t border-glass-border pt-4 mt-2">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
            * Disclaimer: Esta proyección compara dos instantes de auditoría forense cerrados. Las variaciones porcentuales son meramente indicativas.
          </p>
        </div>
      </div>
    </div>
  );
}

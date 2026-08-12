"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Mic, 
  Paperclip, 
  Send, 
  Bot, 
  User, 
  Image as ImageIcon,
  MoreHorizontal,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  X,
  FileText,
  Plus,
  Menu,
  ChevronDown,
  Search as SearchIcon,
  ShieldAlert,
  SlidersHorizontal,
  Sliders,
  UploadCloud,
  Trash2,
  CheckCircle2,
  FileUp,
  UserCheck,
  Settings,
  Maximize2,
  Download,
  Pin
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useChat as useChatContext } from "@/context/ChatContext";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import InAppTour from "@/components/InAppTour";
import ReactMarkdown from 'react-markdown';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Project {
  id: string;
  name: string;
  files?: { id: string; name: string; type: string }[];
}

export interface AgentFile {
  id: string;
  name: string;
  size: string;
  content: string;
}

export interface AgentSettings {
  model: string;
  mode: "Analyze" | "Deep Thinking" | "Create";
  temperature: number;
  maxTokens: number;
  userName: string;
  customSystemPrompt: string;
  files: AgentFile[];
}

export const ChartRenderer = ({ children, className, ...props }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(String(children).replace(/\n$/, ''));
    } catch {
      return null;
    }
  }, [children]);

  // Check if chart is already pinned to dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && parsed?.title) {
      try {
        const saved = localStorage.getItem("erani_pinned_charts");
        if (saved) {
          const pinnedList = JSON.parse(saved);
          const exists = pinnedList.some((c: any) => c.title === parsed.title);
          setIsPinned(exists);
        }
      } catch {}
    }
  }, [parsed]);

  const handleTogglePin = () => {
    if (typeof window === "undefined" || !parsed) return;
    try {
      const saved = localStorage.getItem("erani_pinned_charts");
      let pinnedList: any[] = saved ? JSON.parse(saved) : [];

      if (isPinned) {
        pinnedList = pinnedList.filter((c: any) => c.title !== parsed.title);
        setIsPinned(false);
      } else {
        pinnedList.push({
          id: `chart-${Date.now()}`,
          title: parsed.title || "Visualización Forense",
          type: parsed.type || 'bar',
          data: parsed.data || [],
          pinnedAt: new Date().toISOString(),
        });
        setIsPinned(true);
      }
      localStorage.setItem("erani_pinned_charts", JSON.stringify(pinnedList));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Error al fijar la gráfica en el dashboard:", err);
    }
  };

  // Dynamic user/company name for executive report header
  const displayCompanyName = useMemo(() => {
    try {
      const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('agent_settings') : null;
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings?.userName?.trim()) return parsedSettings.userName.trim();
      }
    } catch {}

    if (user?.user_metadata?.company_name) return user.user_metadata.company_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return "ORGANIZACIÓN ERANI";
  }, [user]);

  if (!parsed) return <pre className={className} {...props}>{children}</pre>;

  const chartType = parsed.type || 'bar';
  const rawChartData = parsed.data || [];
  const COLORS = ['#1E88E5', '#7404ff', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

  // 1. Detect X-Axis Key (Category / Time / Label)
  const xAxisKey = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return 'name';
    const firstRow = rawChartData[0];
    const keys = Object.keys(firstRow);

    const priorityMatch = keys.find(k => /^(name|label|year|año|mes|periodo|fecha|date|x|category|categoria)$/i.test(k));
    if (priorityMatch) return priorityMatch;

    const stringKey = keys.find(k => typeof firstRow[k] === 'string');
    if (stringKey) return stringKey;

    return keys[0] || 'name';
  }, [rawChartData]);

  // 2. Format X-Axis Values for clean presentation
  const formattedChartData = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return [];
    return rawChartData.map((row: any) => {
      const rawXVal = row[xAxisKey];
      let formattedXVal = String(rawXVal ?? '');

      if (/^(year|año)$/i.test(xAxisKey) && !isNaN(Number(rawXVal))) {
        formattedXVal = `Año ${rawXVal}`;
      }

      return {
        ...row,
        [xAxisKey]: formattedXVal
      };
    });
  }, [rawChartData, xAxisKey]);

  // 3. Y-Axis Metric Keys (Excludes the X-Axis Label Key!)
  const yAxisKeys = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return [];
    const firstRow = rawChartData[0];
    return Object.keys(firstRow).filter(k => {
      if (k === xAxisKey) return false;
      const val = firstRow[k];
      return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
    });
  }, [rawChartData, xAxisKey]);

  // ── Ultra-HD Executive Forensic Report 2D Canvas Export ────────────────────
  const handleDownloadJPG = async () => {
    try {
      setIsExporting(true);

      // 1. High-DPI Canvas Setup (2x Retina scale = 2400x1440 for zero blurriness!)
      const canvas = document.createElement("canvas");
      const scale = 2; // 2x HD Resolution
      const logicalW = 1200;
      const logicalH = 720;

      canvas.width = logicalW * scale;
      canvas.height = logicalH * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsExporting(false);
        return;
      }

      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // 2. Load ERANI Logo Image (/eanilogo.png)
      const logoImg = new window.Image();
      logoImg.src = "/eanilogo.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });

      // 3. Background Fill with sleek dark gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, logicalH);
      bgGrad.addColorStop(0, "#09090D");
      bgGrad.addColorStop(1, "#12121D");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, logicalW, logicalH);

      // 4. Top Glowing Border
      const topGrad = ctx.createLinearGradient(0, 0, logicalW, 0);
      topGrad.addColorStop(0, "#10B981");
      topGrad.addColorStop(0.5, "#7404ff");
      topGrad.addColorStop(1, "#1E88E5");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, logicalW, 6);

      // 5. Header Section
      // Left: Draw Official ERANI Logo
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoH = 32;
        const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
        ctx.drawImage(logoImg, 40, 36, logoW, logoH);
        
        ctx.fillStyle = "#10B981";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("ECOSISTEMA DE INTELIGENCIA FORENSE", 40 + logoW + 15, 48);
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "9px monospace";
        ctx.fillText("DATOS BLINDADOS & AUDITABLES", 40 + logoW + 15, 62);
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 20px sans-serif";
        ctx.fillText("ERANI PLATFORM", 40, 58);
      }

      // Right: User / Company Name & Date
      ctx.textAlign = "right";
      ctx.fillStyle = "#1E88E5";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`USUARIO / EMPRESA: ${displayCompanyName.toUpperCase()}`, logicalW - 40, 48);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "11px monospace";
      ctx.fillText(`EMISIÓN: ${new Date().toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}`, logicalW - 40, 68);
      ctx.textAlign = "left"; // Reset

      // Divider Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 88);
      ctx.lineTo(logicalW - 40, 88);
      ctx.stroke();

      // 6. Main Chart Title & Subtitle
      const chartTitle = parsed.title || "ANÁLISIS Y TENDENCIA DE DATOS";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(chartTitle.toUpperCase(), 40, 124);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`TIPO: ${chartType.toUpperCase()} | VISTA FORENSE DE ALTA PRECISIÓN`, 40, 144);

      // 7. Chart Plot Area Bounds
      const padLeft = 100;
      const padRight = logicalW - 60;
      const padTop = 180;
      const padBottom = 530;
      const plotW = padRight - padLeft;
      const plotH = padBottom - padTop;

      // Axis Labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("EJE Y: MONTO / VALOR ($)", 40, padTop - 12);

      ctx.textAlign = "right";
      ctx.fillText(`EJE X: PERÍODO / CATEGORÍA (${xAxisKey.toUpperCase()})`, padRight, padBottom + 45);
      ctx.textAlign = "left";

      // Determine Max Values for Y Axis Scaling
      let maxYVal = 0;
      formattedChartData.forEach((row: any) => {
        yAxisKeys.forEach((key: string) => {
          const val = Number(row[key]) || 0;
          if (val > maxYVal) maxYVal = val;
        });
      });
      if (maxYVal === 0) maxYVal = 100;
      maxYVal = Math.ceil(maxYVal * 1.18); // Add headroom

      // Draw Y-Axis Grid Lines & Tick Labels
      const gridCount = 5;
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      for (let i = 0; i <= gridCount; i++) {
        const yFrac = i / gridCount;
        const yPos = padBottom - yFrac * plotH;
        const valTick = Math.round(yFrac * maxYVal);

        // Grid line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(padRight, yPos);
        ctx.stroke();

        // Tick text
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillText(`$${valTick.toLocaleString()}`, padLeft - 12, yPos + 4);
      }
      ctx.setLineDash([]); // Reset line dash
      ctx.textAlign = "left";

      // Calculate X Coordinates for Data Points
      const dataCount = formattedChartData.length;
      const stepX = dataCount > 1 ? plotW / (dataCount - 1) : plotW / 2;

      // 8. Draw Chart Geometry
      if (chartType === 'line') {
        yAxisKeys.forEach((key: string, seriesIdx: number) => {
          const color = COLORS[seriesIdx % COLORS.length];

          ctx.strokeStyle = color;
          ctx.lineWidth = 4.5;
          ctx.beginPath();

          const points: { x: number; y: number; val: number; label: string }[] = [];

          formattedChartData.forEach((row: any, i: number) => {
            const x = dataCount > 1 ? padLeft + i * stepX : padLeft + plotW / 2;
            const val = Number(row[key]) || 0;
            const y = padBottom - (val / maxYVal) * plotH;
            const label = String(row[xAxisKey] || `Punto ${i + 1}`);

            points.push({ x, y, val, label });

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();

          // Draw Data Circles and High-Contrast Value Badges
          points.forEach((pt) => {
            // Glow Circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#09090D";
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Value Badge Box
            const valStr = `$${pt.val.toLocaleString()}`;
            ctx.font = "bold 12px sans-serif";
            const tw = ctx.measureText(valStr).width + 14;
            const badgeX = pt.x - tw / 2;
            const badgeY = pt.y - 32;

            ctx.fillStyle = "rgba(13, 13, 20, 0.95)";
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, tw, 22, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#FFFFFF";
            ctx.textAlign = "center";
            ctx.fillText(valStr, pt.x, badgeY + 15);
          });
          ctx.textAlign = "left";
        });
      } else if (chartType === 'bar') {
        const groupW = dataCount > 0 ? plotW / dataCount : plotW;
        const barW = Math.min(50, groupW / (yAxisKeys.length || 1) - 8);

        formattedChartData.forEach((row: any, i: number) => {
          const groupCenterX = padLeft + i * groupW + groupW / 2;

          yAxisKeys.forEach((key: string, seriesIdx: number) => {
            const val = Number(row[key]) || 0;
            const barH = (val / maxYVal) * plotH;
            const color = COLORS[seriesIdx % COLORS.length];

            const barX = groupCenterX - (yAxisKeys.length * barW) / 2 + seriesIdx * (barW + 4);
            const barY = padBottom - barH;

            // Draw Bar
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, barH, [8, 8, 0, 0]);
            ctx.fill();

            // Draw Bar Value Text
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`$${val.toLocaleString()}`, barX + barW / 2, Math.max(padTop, barY - 10));
            ctx.textAlign = "left";
          });
        });
      } else {
        // Pie Chart
        const centerX = (padLeft + padRight) / 2;
        const centerY = (padTop + padBottom) / 2;
        const radius = Math.min(plotW, plotH) / 2.5;

        let totalVal = 0;
        const key = yAxisKeys[0] || 'value';
        formattedChartData.forEach((row: any) => {
          totalVal += Number(row[key]) || 0;
        });

        let startAngle = 0;
        formattedChartData.forEach((row: any, i: number) => {
          const val = Number(row[key]) || 0;
          const sliceAngle = totalVal > 0 ? (val / totalVal) * Math.PI * 2 : (Math.PI * 2) / dataCount;
          const color = COLORS[i % COLORS.length];

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
          ctx.closePath();
          ctx.fill();

          startAngle += sliceAngle;
        });
      }

      // Draw X-Axis Labels below plot
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 12px sans-serif";
      formattedChartData.forEach((row: any, i: number) => {
        let xPos = 0;
        if (chartType === 'bar') {
          const groupW = plotW / dataCount;
          xPos = padLeft + i * groupW + groupW / 2;
        } else {
          xPos = dataCount > 1 ? padLeft + i * stepX : padLeft + plotW / 2;
        }
        const labelText = String(row[xAxisKey] || `Item ${i + 1}`);
        ctx.fillText(labelText, xPos, padBottom + 25);
      });
      ctx.textAlign = "left";

      // 9. Legend Badges
      ctx.font = "bold 11px sans-serif";
      let legendX = padLeft;
      const legendY = padBottom + 60;

      yAxisKeys.forEach((key: string, seriesIdx: number) => {
        const color = COLORS[seriesIdx % COLORS.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(legendX + 6, legendY - 4, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText(key.toUpperCase(), legendX + 18, legendY);

        legendX += ctx.measureText(key.toUpperCase()).width + 45;
      });

      // 10. Official Footer Disclaimer
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, logicalH - 45);
      ctx.lineTo(logicalW - 40, logicalH - 45);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "9px sans-serif";
      ctx.fillText(
        "DOCUMENTO CONFIDENCIAL Y PROPIETARIO - Generado automáticamente por ERANI AI Forensic Agent. Todos los datos están blindados bajo protocolo de cifrado.",
        40,
        logicalH - 24
      );

      ctx.textAlign = "right";
      ctx.fillText("ERANI AI PLATFORM v2.5", logicalW - 40, logicalH - 24);
      ctx.textAlign = "left";

      // 11. Download High-Res Canvas Image
      const imgURI = canvas.toDataURL("image/jpeg", 0.98);
      const link = document.createElement("a");
      link.download = `erani-reporte-forense-${Date.now()}.jpg`;
      link.href = imgURI;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generando reporte 2D a JPG:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const renderInnerChart = (isModal = false) => {
    const containerHeight = isModal ? "h-[450px]" : "h-72";
    return (
      <div className={`w-full ${containerHeight}`}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} vertical={false} />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="currentColor" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                className="text-foreground/70"
              />
              <YAxis 
                stroke="currentColor" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                className="text-foreground/70"
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background, #0D0D12)', 
                  color: 'var(--foreground, #FFFFFF)',
                  border: '1px solid rgba(128,128,128,0.25)', 
                  borderRadius: '16px', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)' 
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
              {yAxisKeys.map((key, i) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[i % COLORS.length]} 
                  strokeWidth={3.5} 
                  dot={{ r: 6, fill: COLORS[i % COLORS.length] }} 
                  activeDot={{ r: 9 }} 
                />
              ))}
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background, #0D0D12)', 
                  color: 'var(--foreground, #FFFFFF)',
                  border: '1px solid rgba(128,128,128,0.25)', 
                  borderRadius: '16px', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)' 
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
              <Pie 
                data={formattedChartData} 
                dataKey={yAxisKeys[0] || 'value'} 
                nameKey={xAxisKey} 
                cx="50%" 
                cy="50%" 
                innerRadius={isModal ? 90 : 55} 
                outerRadius={isModal ? 140 : 80} 
                paddingAngle={5}
              >
                {formattedChartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} vertical={false} />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="currentColor" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                className="text-foreground/70"
              />
              <YAxis 
                stroke="currentColor" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                className="text-foreground/70"
              />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(128,128,128,0.08)' }} 
                contentStyle={{ 
                  backgroundColor: 'var(--background, #0D0D12)', 
                  color: 'var(--foreground, #FFFFFF)',
                  border: '1px solid rgba(128,128,128,0.25)', 
                  borderRadius: '16px', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)' 
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
              {yAxisKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[8, 8, 0, 0]} maxBarSize={50} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <>
      <motion.div 
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full my-6 bg-background/90 text-foreground backdrop-blur-2xl rounded-3xl p-6 border border-glass-border shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-erani-purple to-erani-blue" />
        
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-glass-border">
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest shrink-0">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Visualización Forense | Modo Crear
          </div>
          {parsed.title && (
            <span className="text-xs font-black uppercase tracking-wider text-foreground text-right line-clamp-1 flex-1 min-w-[140px]">
              {parsed.title}
            </span>
          )}
        </div>

        {renderInnerChart(false)}

        {/* Action Controls Bar below Chart */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-glass-border">
          <span className="text-[9px] uppercase font-bold text-foreground/50 tracking-widest">
            Gráfica Interactiva ERANI
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePin}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border hover:scale-105 active:scale-95 ${
                isPinned 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                  : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border-glass-border shadow-sm'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : 'text-amber-500'}`} />
              {isPinned ? "Fijado en Dashboard" : "Fijar al Dashboard"}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-[9px] font-black uppercase tracking-widest transition-all border border-glass-border shadow-sm hover:scale-105 active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5 text-erani-purple" /> Ampliar
            </button>
            <button
              type="button"
              onClick={handleDownloadJPG}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" /> {isExporting ? "Generando JPG..." : "Descargar JPG"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Full-Screen Viewport Floating Modal Portal */}
      {isExpanded && mounted && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 bg-background/80 backdrop-blur-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-6xl max-h-[92vh] bg-background/95 text-foreground glassmorphism border border-glass-border p-8 rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.6)] relative flex flex-col gap-6 overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-erani-purple to-erani-blue rounded-full" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-glass-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-erani-purple/10 text-erani-purple border border-erani-purple/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-foreground">
                      {parsed.title || "Visualización Forense ERANI"}
                    </h3>
                    <p className="text-[10px] text-foreground/60 font-bold uppercase tracking-widest">
                      Vista Ampliada de Alta Resolución a Pantalla Completa
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadJPG}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" /> {isExporting ? "Generando JPG..." : "Descargar JPG"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="p-3 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Chart Body */}
              <div ref={modalCardRef} className="w-full flex-1 bg-background/60 p-6 rounded-3xl border border-glass-border shadow-inner flex flex-col justify-center">
                {renderInnerChart(true)}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const rawContent = String(children || '').trim();

    const isChartBlock = !inline && (
      (match && match[1] === 'chart') ||
      (rawContent.startsWith('{') && rawContent.includes('"type"') && rawContent.includes('"data"'))
    );

    if (isChartBlock) {
      return <ChartRenderer className={className} {...props}>{children}</ChartRenderer>;
    }
    
    if (!inline && match && match[1] === 'thought') {
       return (
         <div className="text-xs text-erani-purple italic border-l-2 border-erani-purple pl-3 my-4 bg-erani-purple/5 p-4 rounded-xl shadow-inner">
           <span className="font-bold flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest"><BrainCircuit className="w-3 h-3" /> Pensamiento Profundo</span>
           {String(children).replace(/\n$/, '')}
         </div>
       );
    }
    return <code className={className} {...props}>{children}</code>;
  }
};

const AGENT_TOUR_STEPS = [
  {
    targetId: "tour-agent-new",
    title: "Nuevo Peritaje",
    content: "Comienza un nuevo hilo de conversación limpio para iniciar una investigación desde cero.",
    position: "right" as const
  },
  {
    targetId: "tour-agent-model",
    title: "Motor de Inferencia",
    content: "Selecciona el modelo de IA que impulsará el análisis. Cada uno tiene fortalezas diferentes para el procesamiento de datos.",
    position: "right" as const
  },
  {
    targetId: "tour-agent-project",
    title: "Vincular Proyecto",
    content: "Enlaza tu conversación a un proyecto existente para que el Agente Forense tenga acceso automático a todo su contexto y evidencias.",
    position: "bottom" as const
  },
  {
    targetId: "tour-agent-library",
    title: "Librería de Evidencias",
    content: "Accede rápidamente a los archivos que ya están en la plataforma para inyectarlos en tu consulta actual.",
    position: "top" as const
  },
  {
    targetId: "tour-agent-voice",
    title: "Dictado por Voz",
    content: "Habla directamente y el Agente transcribirá tu voz a texto en tiempo real para agilizar tus solicitudes.",
    position: "top" as const
  },
  {
    targetId: "tour-agent-input",
    title: "Consola de Análisis",
    content: "Ingresa tus prompts aquí. ¡El Agente Forense está listo para procesar grandes volúmenes de datos y encontrar anomalías!",
    position: "top" as const
  }
];

export default function ChatInterface({ isEmbedded = false, embeddedProjects = [] }: { isEmbedded?: boolean, embeddedProjects?: { id: string, name: string, files?: any[] }[] }) {
  const { profile, updateErisBalance, org } = useAuth();
  const { messages, sendMessage, activeProjectId, setActiveProjectId, deleteThread, activeThread, threads, loadingThreads, loadingMessages, isChatSidebarOpen, setIsChatSidebarOpen, projects: contextProjects, needsSync, setNeedsSync } = useChatContext();
  const projects = isEmbedded ? embeddedProjects : contextProjects;
  const erisBalance = profile?.eris_balance ?? 20;
  const isPremiumUser = org?.paid_subscription === true;

  // ── Agent Settings State ───────────────────────────────────────────────────
  const DEFAULT_SETTINGS: AgentSettings = {
    model: "meta-llama/llama-3.1-8b-instruct",
    mode: "Analyze",
    temperature: 0.2,
    maxTokens: 2000,
    userName: "",
    customSystemPrompt: "",
    files: [],
  };

  const [agentSettings, setAgentSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [showModes, setShowModes] = useState(false);
  const [showModels, setShowModels] = useState(false);

  const aiModel = agentSettings.model;
  const aiMode = agentSettings.mode;

  // Sync settings post-hydration and listen to storage events
  useEffect(() => {
    const syncSettings = () => {
      const saved = localStorage.getItem("erani_agent_settings");
      if (saved) {
        try {
          setAgentSettings(JSON.parse(saved));
        } catch {}
      }
    };
    syncSettings();
    window.addEventListener("storage", syncSettings);
    return () => window.removeEventListener("storage", syncSettings);
  }, []);

  const updateMode = (newMode: "Analyze" | "Deep Thinking" | "Create") => {
    const updated = { ...agentSettings, mode: newMode };
    setAgentSettings(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("erani_agent_settings", JSON.stringify(updated));
    }
  };

  const updateModel = (newModel: string) => {
    const updated = { ...agentSettings, model: newModel };
    setAgentSettings(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("erani_agent_settings", JSON.stringify(updated));
    }
  };



  const [showMenu, setShowMenu] = useState(false);
  const [premiumAlert, setPremiumAlert] = useState(false);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (premiumAlert) {
      const timer = setTimeout(() => setPremiumAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [premiumAlert]);
  
  // Fake "encrypting" visualization
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [responseTimes, setResponseTimes] = useState<Record<string, string>>({});
  const startTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Simple streaming state
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt?: Date }>>([]);
  const [status, setStatus] = useState<'idle' | 'submitted' | 'streaming' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Sync DB messages into state when explicit sync is requested
  useEffect(() => {
    if (needsSync && !loadingThreads && !loadingMessages) {
      setAiMessages(messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content || ''
      })));
      setNeedsSync(false);
    }
    if (!activeThread?.id) {
      setAiMessages([]);
    }
  }, [messages, loadingThreads, loadingMessages, needsSync, setNeedsSync, activeThread?.id]);

  const displayMessages = aiMessages;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent | any) => {
    e?.preventDefault();
    if (!chatInput || !chatInput.trim()) return;

    if (erisBalance < 5) {
      alert('Balance de ERIS insuficiente para realizar consultas forenses con el agente.');
      return;
    }

    // Deduct ERIS
    await updateErisBalance(Math.max(0, erisBalance - 5));

    if (aiMode === 'Deep Thinking' || aiMode === 'Create') {
      setIsEncrypting(true);
    }

    startTimeRef.current = Date.now();
    const currentInput = chatInput;
    setChatInput('');

    // Persist user message to DB
    await sendMessage(currentInput, 'user');

    // Add user message to local state
    const userMsg = { id: `user-${Date.now()}`, role: 'user' as const, content: currentInput, createdAt: new Date() };
    const historyForApi = [...aiMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
    setAiMessages(prev => [...prev, userMsg]);

    // Stream from /api/agent directly
    setStatus('submitted');
    setError(null);

    const assistantId = `assistant-${Date.now()}`;
    let assistantContent = '';

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const customFilesText = agentSettings.files
        .map((f) => `--- DOCUMENTO CORPORATIVO: ${f.name} (${f.size}) ---\n${f.content}`)
        .join('\n\n');

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: historyForApi,
          model: agentSettings.model,
          mode: agentSettings.mode,
          temperature: agentSettings.temperature,
          maxTokens: agentSettings.maxTokens,
          userName: agentSettings.userName,
          customSystemPrompt: agentSettings.customSystemPrompt,
          customFilesContext: customFilesText,
          projectId: activeProjectId,
          organizationId: profile?.organization_id,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errJson.error || `Error ${res.status}`);
      }

      setIsEncrypting(false);
      setStatus('streaming');

      // Add placeholder assistant message
      setAiMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', createdAt: new Date() }]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const chunk = JSON.parse(jsonStr);
            // Handle UI message stream format (v6)
            if (chunk.type === 'text-delta' && chunk.delta) {
              assistantContent += chunk.delta;
              setAiMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
            // Handle classic OpenAI delta format (fallback)
            if (chunk.choices?.[0]?.delta?.content) {
              assistantContent += chunk.choices[0].delta.content;
              setAiMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
      setResponseTimes(prev => ({ ...prev, [assistantId]: duration }));

      // Persist assistant response to DB
      if (assistantContent) {
        sendMessage(assistantContent, 'assistant');
      }

      setStatus('idle');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      console.error('[ChatInterface] Stream error:', err);
      setError(err);
      setStatus('error');
      setIsEncrypting(false);
    }
  };

  const [isListening, setIsListening] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024 * 1024) {
      alert("El archivo excede el límite de 5GB para tu plan Trial.");
      return;
    }

    setStatus('submitted');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${profile?.organization_id || 'guest'}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat_uploads')
      .upload(filePath, file);

    if (uploadError) {
      alert("Error subiendo el archivo: " + uploadError.message);
      setStatus('idle');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat_uploads')
      .getPublicUrl(filePath);

    const isImage = file.type.startsWith('image/');
    await sendMessage(`Archivo adjunto: ${file.name}`, 'user', isImage ? 'image' : 'file', publicUrl);
    setStatus('idle');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileUpload(file);
  };

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileUpload(e.dataTransfer.files[0]);
      return;
    }

    const textData = e.dataTransfer.getData("text");
    if (textData) {
      setChatInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + textData);
    }
  };

  let recognition: any = null;

  const handleVoiceDictation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("El dictado por voz no es compatible con este navegador.");
      return;
    }

    if (isListening) {
       recognition?.stop();
       setIsListening(false);
       return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
         setChatInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + finalTranscript);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const activeProjectData = projects.find(p => p.id === activeProjectId);
  const libraryFiles = activeProjectData?.files || [];

  return (
    <div 
      className={`flex-1 flex flex-col h-full overflow-hidden bg-background/30 backdrop-blur-sm rounded-[2.5rem] border ${isDraggingOver ? 'border-erani-purple shadow-[0_0_30px_rgba(116,4,255,0.3)]' : 'border-glass-border'} shadow-2xl relative transition-all duration-300`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 bg-erani-purple/10 z-[200] flex items-center justify-center rounded-[2.5rem] backdrop-blur-sm pointer-events-none border-2 border-dashed border-erani-purple">
          <div className="flex flex-col items-center gap-3 bg-background/80 p-6 rounded-3xl border border-erani-purple/30 shadow-2xl">
            <Paperclip className="w-8 h-8 text-erani-purple animate-bounce" />
            <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Suelta archivos o texto aquí</span>
          </div>
        </div>
      )}

      {/* Premium Alert Toast */}
      <AnimatePresence>
        {premiumAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-24 left-1/2 z-[300] bg-erani-coral/10 border border-erani-coral/30 text-erani-coral px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(255,107,107,0.2)] backdrop-blur-md"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] uppercase font-black tracking-widest">Modelo Premium Restringido</span>
            <button onClick={() => setPremiumAlert(false)} className="ml-2 hover:bg-erani-coral/20 p-1 rounded-full transition-colors">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Context Bar */}
      <div className="px-8 py-4 border-b border-glass-border flex items-center justify-between bg-foreground/2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsChatSidebarOpen(!isChatSidebarOpen)}
            className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-colors mr-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-erani-blue/10 flex items-center justify-center border border-erani-blue/20 p-2 overflow-hidden shadow-inner">
             <Image src="/isologo.png" alt="ERANI" width={28} height={28} className="logo-adaptive" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">ERANI Forensic Agent</h3>
            <span className="text-[8px] uppercase font-bold text-emerald-500 tracking-widest flex items-center gap-1">
               <ShieldCheck className="w-3 h-3" /> Ecosistema de Datos Blindado
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
            {/* Mode Selector Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowModes(!showModes)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-glass-border text-foreground text-[9px] font-black uppercase tracking-widest hover:bg-foreground/10 transition-all shadow-sm"
              >
                {aiMode === "Analyze" && <SearchIcon className="w-3.5 h-3.5 text-erani-blue" />}
                {aiMode === "Deep Thinking" && <BrainCircuit className="w-3.5 h-3.5 text-erani-purple" />}
                {aiMode === "Create" && <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                {aiMode === "Analyze" ? "Analizar" : aiMode === "Deep Thinking" ? "Razonamiento Profundo" : "Crear / Gráficas"}
                <ChevronDown className={`w-3 h-3 transition-transform ${showModes ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showModes && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 glassmorphism border border-glass-border rounded-2xl p-2 z-[100] shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col gap-1"
                  >
                     <button onClick={() => { updateMode("Analyze"); setShowModes(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'Analyze' ? 'bg-erani-blue/10 text-erani-blue shadow-[inset_0_0_10px_rgba(30,136,229,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}>
                       <SearchIcon className="w-3.5 h-3.5" /> Analizar
                     </button>
                     <button onClick={() => { updateMode("Deep Thinking"); setShowModes(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'Deep Thinking' ? 'bg-erani-purple/10 text-erani-purple shadow-[inset_0_0_10px_rgba(116,4,255,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}>
                       <BrainCircuit className="w-3.5 h-3.5" /> Profundo
                     </button>
                     <button onClick={() => { updateMode("Create"); setShowModes(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'Create' ? 'bg-emerald-500/10 text-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}>
                       <Sparkles className="w-3.5 h-3.5" /> Crear
                     </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Model Selector Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowModels(!showModels)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-erani-blue/10 border border-erani-blue/20 text-erani-blue text-[9px] font-black uppercase tracking-widest hover:bg-erani-blue/20 transition-all shadow-sm"
              >
                {aiModel.includes("llama") ? "Llama 3.1 (Rápido)" : 
                 aiModel.includes("mistral") ? "Mistral (Análisis)" :
                 aiModel.includes("gemini") ? "Gemini 3.5 Flash" :
                 aiModel.includes("claude") ? "Claude Sonnet 4" :
                 aiModel.includes("grok") ? "Grok 4" : "GPT-4o"}
                <ChevronDown className={`w-3 h-3 transition-transform ${showModels ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showModels && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-56 glassmorphism border border-glass-border rounded-2xl p-2 z-[100] shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col gap-1"
                  >
                     <div className="px-3 py-2 text-[8px] uppercase font-black text-gray-500 tracking-widest">Modelos Trial (Gratis)</div>
                     <button onClick={() => { updateModel("meta-llama/llama-3.1-8b-instruct"); setShowModels(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiModel.includes('llama') ? 'bg-erani-blue/10 text-erani-blue shadow-[inset_0_0_10px_rgba(30,136,229,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}>
                       Llama 3.1 (Rápido)
                     </button>
                     <button onClick={() => { updateModel("mistralai/mistral-small-2603"); setShowModels(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiModel.includes('mistral') ? 'bg-erani-blue/10 text-erani-blue shadow-[inset_0_0_10px_rgba(30,136,229,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}>
                       Mistral Small (Análisis)
                     </button>
                     
                     <div className="px-3 py-2 mt-2 text-[8px] uppercase font-black text-erani-purple tracking-widest border-t border-glass-border pt-3">Modelos Premium (Beta)</div>
                     <button 
                       onClick={() => { 
                         if (!isPremiumUser) { setPremiumAlert(true); return; }
                         updateModel("google/gemini-3.5-flash"); 
                         setShowModels(false); 
                       }} 
                       className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isPremiumUser ? 'opacity-50 cursor-not-allowed' : ''} ${aiModel.includes('gemini') ? 'bg-erani-purple/10 text-erani-purple shadow-[inset_0_0_10px_rgba(116,4,255,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}
                     >
                       Gemini 3.5 Flash {!isPremiumUser && "🔒"}
                     </button>
                     <button 
                       onClick={() => { 
                         if (!isPremiumUser) { setPremiumAlert(true); return; }
                         updateModel("anthropic/claude-sonnet-4-5"); 
                         setShowModels(false); 
                       }} 
                       className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isPremiumUser ? 'opacity-50 cursor-not-allowed' : ''} ${aiModel.includes('claude') ? 'bg-erani-purple/10 text-erani-purple shadow-[inset_0_0_10px_rgba(116,4,255,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}
                     >
                       Claude Sonnet 4 {!isPremiumUser && "🔒"}
                     </button>
                     <button 
                       onClick={() => { 
                         if (!isPremiumUser) { setPremiumAlert(true); return; }
                         updateModel("x-ai/grok-4.5"); 
                         setShowModels(false); 
                       }} 
                       className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isPremiumUser ? 'opacity-50 cursor-not-allowed' : ''} ${aiModel.includes('grok') ? 'bg-erani-purple/10 text-erani-purple shadow-[inset_0_0_10px_rgba(116,4,255,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}
                     >
                       Grok 4 {!isPremiumUser && "🔒"}
                     </button>
                     <button 
                       onClick={() => { 
                         if (!isPremiumUser) { setPremiumAlert(true); return; }
                         updateModel("openai/gpt-4o"); 
                         setShowModels(false); 
                       }} 
                       className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isPremiumUser ? 'opacity-50 cursor-not-allowed' : ''} ${aiModel.includes('gpt') ? 'bg-erani-purple/10 text-erani-purple shadow-[inset_0_0_10px_rgba(116,4,255,0.2)]' : 'text-foreground hover:bg-foreground/5'}`}
                     >
                       GPT-4o {!isPremiumUser && "🔒"}
                     </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-foreground/5 rounded-xl text-gray-500 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full mt-2 right-0 w-48 glassmorphism border border-glass-border rounded-xl p-2 z-[100] shadow-2xl"
                  >
                    <button 
                      onClick={() => {
                        if(activeThread) deleteThread(activeThread.id);
                        setShowMenu(false);
                      }}
                      disabled={!activeThread}
                      className="w-full text-left px-4 py-2 text-[9px] uppercase font-black tracking-widest text-erani-coral hover:bg-erani-coral/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Eliminar Hilo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar relative"
      >
        {displayMessages.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
             <div className="w-64 h-24 relative flex items-center justify-center mb-10">
                <div className="absolute inset-0 bg-erani-purple/20 blur-[60px] rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-erani-blue/20 blur-[60px] rounded-full animate-pulse [animation-delay:1s]" />
                <motion.div
                   animate={{ y: [0, -10, 0] }}
                   transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                   className="relative z-10 flex items-center justify-center"
                >
                   <Image src="/eanilogo.png" alt="ERANI" width={180} height={50} className="logo-adaptive opacity-90 object-contain" />
                </motion.div>
             </div>
             <motion.h2 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-3xl md:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-erani-blue to-erani-purple text-center max-w-4xl tracking-[0.05em] leading-snug"
             >
               ¿En qué puedo ayudarte con tu<br />investigación forense hoy?
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="text-sm md:text-base text-gray-400 font-medium tracking-wide mt-6 text-center max-w-xl"
             >
               Selecciona un proyecto, adjunta evidencias o simplemente descríbeme el caso para comenzar el análisis cruzado.
             </motion.p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm font-bold text-center">
             Error del Motor AI: {error.message || JSON.stringify(error)}
          </div>
        )}
        {displayMessages.map((msg) => {
          const msgText = typeof msg.content === 'string' ? msg.content : '';
          return (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center border shadow-xl ${
              msg.role === 'assistant' 
              ? 'bg-erani-blue/10 border-erani-blue/20 text-erani-blue p-2' 
              : 'bg-erani-purple/10 border-erani-purple/20 text-erani-purple'
            }`}>
              {msg.role === 'assistant' ? <Image src="/isologo.png" alt="ERANI" width={24} height={24} className="logo-adaptive" /> : <User className="w-6 h-6" />}
            </div>
            
            <div className={`flex flex-col gap-2 max-w-[70%] ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed overflow-x-hidden ${
                msg.role === 'assistant' 
                ? 'glassmorphism border-glass-border text-foreground prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-foreground/5 prose-pre:border prose-pre:border-glass-border' 
                : 'bg-foreground/5 text-foreground border border-foreground/10'
              }`}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown components={MarkdownComponents}>
                    {msgText.replace(/<thought>([\s\S]*?)<\/thought>/g, '```thought\n$1\n```')}
                  </ReactMarkdown>
                ) : (
                  msgText
                )}
                {/* Fallback support for file rendering since standard Vercel AI SDK doesn't natively handle custom message types easily without custom annotations */}
                {/* We can skip files rendering for the SDK messages temporarily or append them manually. */}
              </div>
              <div className="flex items-center gap-4 px-2">
                 <span className="text-[8px] uppercase font-bold text-gray-500 tracking-widest">
                   {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                 </span>
                 {msg.role === 'assistant' && (
                   <div className="flex items-center gap-3">
                      <ThumbsUp className="w-3 h-3 text-gray-500 cursor-pointer hover:text-erani-blue transition-colors" />
                      <RotateCcw onClick={() => { setAiMessages(prev => prev.filter(m => m.role === 'user')); }} className="w-3 h-3 text-gray-500 cursor-pointer hover:text-erani-blue transition-colors" />
                      {responseTimes[msg.id] && (
                        <span className="text-[8px] font-mono text-emerald-500">⏱️ {responseTimes[msg.id]}s</span>
                      )}
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
          );
        })}
        {isLoading && (
          <div className="flex gap-5">
             <div className="w-11 h-11 rounded-2xl bg-erani-blue/10 border border-erani-blue/20 flex items-center justify-center p-2 shadow-inner">
                <Image src="/isologo.png" alt="ERANI" width={24} height={24} className="logo-adaptive animate-pulse" />
             </div>
             <div className="flex flex-col gap-2">
               {isEncrypting && (
                 <div className="text-[9px] font-mono text-erani-purple animate-pulse flex items-center gap-2 mb-2 bg-erani-purple/10 px-3 py-1.5 rounded-lg border border-erani-purple/20">
                   <ShieldCheck className="w-3 h-3" /> Cifrando PII y aplicando ofuscación heurística...
                 </div>
               )}
               <div className="flex items-center gap-1.5 p-5 rounded-3xl glassmorphism border border-glass-border">
                  <div className="w-2 h-2 bg-erani-blue rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-erani-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-erani-blue rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 pt-0 relative">
        {erisBalance < 5 && (
          <div className="absolute inset-x-8 bottom-0 top-0 bg-background/70 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center gap-3 rounded-[2.5rem] border border-glass-border">
            <span className="text-[9px] font-black uppercase tracking-widest text-erani-coral border border-erani-coral/20 bg-erani-coral/10 px-3 py-1 rounded-full animate-pulse">
              Acceso Bloqueado — ERIS Insuficientes
            </span>
            <p className="text-[10px] text-nav-text font-bold max-w-sm">
              Tu balance actual ({erisBalance} ERIS) es insuficiente para realizar consultas (Costo: 5 ERIS). Activa tu suscripción de ERANI Beta o compra una recarga de ERIS para continuar.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/subscription/activate"
                className="button-premium px-5 py-2.5 rounded-xl text-[9px] uppercase font-black tracking-widest shadow-lg shadow-erani-purple/20"
              >
                Activar Suscripción
              </Link>
              <Link
                href="/subscription"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] uppercase font-black tracking-widest transition-all"
              >
                Adquirir ERIS
              </Link>
            </div>
          </div>
        )}
        <div className="premium-border-container group">
          <div className="premium-border-inner p-2 gap-2">
            <button 
              type="button"
              id="tour-agent-library"
              onClick={() => setShowLibrary(true)}
              className="p-4 text-gray-400 hover:text-erani-blue transition-colors hover:bg-erani-blue/5 rounded-full shrink-0 relative z-10"
            >
                <Paperclip className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showLibrary && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full mb-4 left-0 w-80 glassmorphism border border-glass-border rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[100]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Librería de Evidencias</span>
                    <button type="button" onClick={() => setShowLibrary(false)} className="text-gray-500 hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {libraryFiles.length === 0 ? (
                      <div className="p-4 text-center text-[9px] uppercase font-bold text-gray-500">
                        No hay archivos en la librería.
                      </div>
                    ) : (
                      libraryFiles.map(file => (
                        <button 
                          key={file.id} 
                          type="button"
                          onClick={() => {
                            setChatInput(prev => prev + ` [Archivo: ${file.name}] `);
                            setShowLibrary(false);
                          }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 border border-transparent hover:border-glass-border transition-all group"
                        >
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-erani-blue/10 flex items-center justify-center text-erani-blue">
                                <FileText className="w-4 h-4" />
                             </div>
                             <span className="text-[10px] font-bold text-gray-400 group-hover:text-foreground truncate max-w-[150px]">{file.name}</span>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div id="tour-agent-input" className="flex-1 min-h-[50px] flex items-center px-2 relative z-10">
                <textarea 
                  rows={1}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Analiza las facturas de marzo y busca duplicados..."
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-bold py-2 placeholder:text-gray-500 resize-none max-h-48 custom-scrollbar text-foreground"
                />
            </div>

            <div className="flex items-center gap-2 p-1 relative z-10">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
                <button 
                  type="button"
                  id="tour-agent-voice"
                  onClick={handleVoiceDictation}
                  className={`p-3 transition-all rounded-full shrink-0 ${isListening ? 'bg-erani-blue text-white animate-pulse shadow-[0_0_15px_rgba(0,85,160,0.5)]' : 'text-gray-400 hover:text-erani-blue hover:bg-erani-blue/5'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-400 hover:text-erani-purple transition-colors hover:bg-erani-purple/5 rounded-full shrink-0"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-erani-blue to-erani-purple text-white flex items-center justify-center shadow-[0_0_20px_rgba(158,128,255,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
        
        <div className="mt-5 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-erani-blue animate-pulse" />
              <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">AI can make mistakes. Please contact support to let us know.</span>
           </div>
           <div className="h-1 w-1 rounded-full bg-gray-400" />
           <div className="flex items-center gap-2 text-erani-blue">
              <span className="text-[9px] uppercase font-black tracking-widest">Costo: 5.0 ERIS</span>
           </div>
        </div>
      </div>
      
      {(!loadingThreads && threads.length === 0) && (
        <InAppTour tourKey="agent" steps={AGENT_TOUR_STEPS} />
      )}
    </div>
  );
}

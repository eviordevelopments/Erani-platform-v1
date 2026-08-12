"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { 
  User, 
  LogIn, 
  LogOut, 
  Plus, 
  Trash, 
  FileText, 
  Download, 
  Upload, 
  Settings, 
  Users, 
  Navigation, 
  Play, 
  CheckCircle, 
  Activity,
  RotateCcw,
  Shield,
  Zap,
  Cpu
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'user': User,
  'log-in': LogIn,
  'log-out': LogOut,
  'plus': Plus,
  'trash': Trash,
  'file-text': FileText,
  'download': Download,
  'upload': Upload,
  'settings': Settings,
  'users': Users,
  'navigation': Navigation,
  'play': Play,
  'check-circle': CheckCircle,
  'rotate-ccw': RotateCcw,
  'shield': Shield,
  'zap': Zap,
  'activity': Activity
};

interface AuditLog {
  id: string;
  action: string;
  description: string;
  icon_type: string;
  created_at: string;
  metadata: any;
}

interface RealtimeLogTerminalProps {
  organizationId: string;
  limit?: number;
}

export default function RealtimeLogTerminal({ organizationId, limit = 50 }: RealtimeLogTerminalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!organizationId) return;

    // 1. Fetch initial logs
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (data) setLogs(data.reverse());
    };

    fetchLogs();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel(`audit_logs_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          setLogs((prev) => {
            const newLogs = [...prev, payload.new as AuditLog];
            if (newLogs.length > limit) return newLogs.slice(1);
            return newLogs;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, limit]);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-background rounded-[2rem] border-2 border-black/5 dark:border-white/5 overflow-hidden shadow-2xl font-montserrat relative">
      {/* GLOW EFFECTS */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-erani-blue/10 blur-[80px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-erani-purple/10 blur-[80px] pointer-events-none rounded-full" />

      <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-erani-coral/80 shadow-[0_0_10px_rgba(255,92,92,0.5)]" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="w-px h-4 bg-black/10 dark:bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">Terminal Forense SSE</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 text-erani-blue text-[9px] font-mono font-bold tracking-wider border border-erani-blue/20">
          <Cpu className="w-3.5 h-3.5" />
          SYSTEM_OK
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4 custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 z-10">
               <Activity className="w-12 h-12 mb-6 animate-pulse text-erani-blue" />
               <p className="text-xs uppercase font-black tracking-[0.3em] text-foreground">A la Espera de Eventos</p>
               <p className="text-[10px] font-medium text-gray-500 mt-2 max-w-xs">El motor forense está escuchando la red de la organización en tiempo real.</p>
            </div>
          ) : (
            logs.map((log) => {
              const Icon = ICON_MAP[log.icon_type] || Activity;
              return (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex flex-col md:flex-row md:items-center gap-4 group/log bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-erani-blue/30 p-4 rounded-2xl transition-all hover:shadow-lg z-10 relative"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-erani-blue rounded-l-2xl opacity-0 group-hover/log:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-background border border-black/10 dark:border-white/10 text-erani-blue shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-erani-blue/10 opacity-0 group-hover/log:opacity-100 transition-opacity" />
                      <Icon className="w-4 h-4 relative z-10" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                        {log.action.replace('_', ' ')}
                        <span className="px-2 py-0.5 rounded text-[8px] bg-black/10 dark:bg-white/10 text-gray-500 font-mono tracking-tighter">
                          ID: {log.id.split('-')[0]}
                        </span>
                      </span>
                      <span className="text-[11px] font-bold text-gray-500 mt-0.5">
                        {log.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-auto px-3 py-1.5 rounded-lg bg-background border border-black/5 dark:border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-gray-400 font-bold tracking-wider">
                      {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        
        {/* Connection Pulse */}
        <div className="flex items-center gap-3 pt-4 border-t border-glass-border/10">
          <div className="flex gap-1">
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-erani-blue" />
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.3 }} className="w-1.5 h-1.5 rounded-full bg-erani-blue" />
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.6 }} className="w-1.5 h-1.5 rounded-full bg-erani-blue" />
          </div>
          <span className="text-[10px] font-bold text-erani-blue/60 uppercase tracking-widest font-mono">Stream Sincronizado</span>
        </div>
      </div>
    </div>
  );
}

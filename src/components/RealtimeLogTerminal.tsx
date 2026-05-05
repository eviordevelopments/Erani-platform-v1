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
    <div className="h-full flex flex-col bg-foreground/[0.02] dark:bg-white/[0.01] rounded-3xl border border-glass-border/30 overflow-hidden group hover:border-erani-blue/20 transition-all font-montserrat">
      <div className="px-6 py-4 border-b border-glass-border/20 flex items-center justify-between bg-foreground/[0.01]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-erani-coral/40" />
            <div className="w-2 h-2 rounded-full bg-amber-500/40" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
          </div>
          <span className="ml-4 text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">Plataforma Real-Time Stream</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-foreground/5 text-erani-blue text-[8px] font-mono font-bold tracking-wider">
          <Cpu className="w-3 h-3" />
          ERANI-OVS-V1
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4 custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
               <Activity className="w-10 h-10 mb-4 animate-pulse" />
               <p className="text-[10px] uppercase font-black tracking-widest">Esperando señales del sistema...</p>
            </div>
          ) : (
            logs.map((log) => {
              const Icon = ICON_MAP[log.icon_type] || Activity;
              return (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  className="flex items-start gap-4 group/log"
                >
                  <span className="text-[9px] font-mono text-gray-500 pt-1 shrink-0">
                    [{new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-erani-blue">
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-tight text-foreground/90 leading-tight">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 leading-relaxed">
                          {log.description}
                        </span>
                      </div>
                    </div>
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

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function ServiceDetailModal({
  isOpen,
  onClose,
  service,
}: {
  isOpen: boolean;
  onClose: () => void;
  service: any;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen || !service) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-background border border-glass-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        >
          {/* Left Column: Visuals & Branding */}
          <div className="w-full md:w-1/3 bg-foreground/5 p-8 flex flex-col items-center justify-center text-center relative border-r border-glass-border">
             <button onClick={onClose} className="absolute top-4 right-4 p-2 md:hidden">
                <X className="w-5 h-5 text-nav-text" />
             </button>
             
             <div className="w-32 h-32 bg-background rounded-3xl border border-glass-border flex items-center justify-center shadow-xl p-4 mb-6">
                <img src={service.logo_url} alt={service.provider_name} className="max-w-full max-h-full object-contain" />
             </div>
             
             <span className="text-[10px] font-black uppercase tracking-widest text-erani-blue mb-2">
               {service.service_type === 'strategy' ? 'Estrategia' : service.service_type === 'maximization' ? 'Maximización' : 'Adicionales'}
             </span>
             <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">{service.title}</h3>
             <p className="text-xs font-bold text-nav-text mt-2 uppercase tracking-widest">by {service.provider_name}</p>
          </div>

          {/* Right Column: Details & CTA */}
          <div className="w-full md:w-2/3 p-8 flex flex-col relative">
             <button onClick={onClose} className="absolute top-6 right-6 p-2 hidden md:block hover:bg-foreground/5 rounded-xl transition-colors">
                <X className="w-5 h-5 text-nav-text hover:text-foreground" />
             </button>

             <div className="flex gap-6 border-b border-glass-border mb-6">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'overview' ? 'border-erani-blue text-foreground' : 'border-transparent text-nav-text hover:text-foreground'}`}
                >
                  Descripción
                </button>
                <button 
                  onClick={() => setActiveTab('features')}
                  className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'features' ? 'border-erani-blue text-foreground' : 'border-transparent text-nav-text hover:text-foreground'}`}
                >
                  Beneficios
                </button>
             </div>

             <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                     <p className="text-sm text-nav-text leading-relaxed">
                       {service.description}
                     </p>
                     
                     <div className="bg-erani-blue/5 border border-erani-blue/20 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                           <Target className="w-5 h-5 text-erani-blue" />
                           <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Aceleración Corporativa</h4>
                        </div>
                        <p className="text-xs text-nav-text leading-relaxed">
                          Al estar en una cuenta ERANI PRO/BETA, tienes acceso preferencial a este convenio. Nuestro equipo facilitará la integración o el enlace directo con el proveedor.
                        </p>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'features' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {Array.isArray(service.features) && service.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 bg-foreground/5 p-4 rounded-xl border border-glass-border">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                           <span className="text-xs font-medium text-foreground">{feature}</span>
                        </div>
                     ))}
                  </motion.div>
                )}
             </div>

             <div className="mt-8 pt-6 border-t border-glass-border">
                <button className="w-full py-4 rounded-xl text-xs uppercase font-black tracking-widest flex items-center justify-center gap-3 bg-gradient-to-r from-erani-blue to-erani-purple text-white shadow-lg hover:scale-[1.02] transition-transform">
                  <Zap className="w-4 h-4" /> Activar Beneficio o Alianza <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

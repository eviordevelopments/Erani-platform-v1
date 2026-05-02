"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  ArrowRight, 
  Target, 
  Zap, 
  Globe, 
  Shield, 
  Briefcase, 
  Cpu, 
  Layers, 
  TrendingUp,
  Users,
  Sparkles,
  Command
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useDashboard } from "@/context/DashboardContext";

interface Service {
  id: string;
  name: string;
  alliance: string;
  category: "strategy" | "maximization" | "additional";
  description: string;
  impact: string;
  icon: any;
  color: string;
  tags: string[];
}

const SERVICES: Service[] = [
  {
    id: "S-001",
    name: "Forensic Wealth Strategy",
    alliance: "Global Capital Partners",
    category: "strategy",
    description: "Análisis profundo de activos patrimoniales con blindaje fiscal y optimización de diversificación.",
    impact: "+24% Efficiency",
    icon: Shield,
    color: "erani-blue",
    tags: ["Capital", "Forense", "Elite"]
  },
  {
    id: "S-002",
    name: "Quantum Revenue Maximizer",
    alliance: "Nexus AI Lab",
    category: "maximization",
    description: "Algoritmos predictivos para identificar fugas de ingresos en tiempo real y maximizar el LTV.",
    impact: "+40% Yield",
    icon: Cpu,
    color: "erani-purple",
    tags: ["AI", "Yield", "Nexus"]
  },
  {
    id: "S-003",
    name: "Global Ops Expansion",
    alliance: "EuroScale Advisors",
    category: "additional",
    description: "Consultoría de aterrizaje operativo para empresas LATAM buscando expansión en mercados europeos.",
    impact: "EU Entry Ready",
    icon: Globe,
    color: "erani-coral",
    tags: ["Global", "Expansion", "Logistics"]
  },
  {
    id: "S-004",
    name: "Hyper-Growth Protocol",
    alliance: "Velocity Ventures",
    category: "strategy",
    description: "Framework de escalabilidad agresiva diseñado por ex-socios de Sequoia y Softbank.",
    impact: "Exponential Scale",
    icon: TrendingUp,
    color: "erani-blue",
    tags: ["Growth", "Velocity", "Protocol"]
  },
  {
    id: "S-005",
    name: "Dark Data Audit",
    alliance: "ERANI Core",
    category: "additional",
    description: "Revelación de activos de información no estructurados para monetización estratégica.",
    impact: "Data Value Unlock",
    icon: Layers,
    color: "erani-purple",
    tags: ["Data", "Audit", "Value"]
  },
  {
    id: "S-006",
    name: "Executive Concierge",
    alliance: "Private Circle",
    category: "additional",
    description: "Servicio de asistencia premium para fundadores y directivos C-Level.",
    impact: "Zero Friction",
    icon: Users,
    color: "erani-coral",
    tags: ["C-Level", "Private", "Lifestyle"]
  }
];

export default function ServicesPlusPage() {
  const { isSidebarCollapsed } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    return SERVICES.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.alliance.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory ? s.category === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} relative flex flex-col h-screen`}>
        {/* Background Gradients */}
        <div className="bg-blob-blue top-[-20%] right-[-10%] w-[600px] h-[600px]" />
        <div className="bg-blob-purple bottom-[-20%] left-[-10%] w-[500px] h-[500px]" />

        {/* Header */}
        <header className="p-8 pb-4 flex flex-col gap-6 z-20">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-blue flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Ecosistema de Alianzas Elite
              </span>
              <h1 className="text-4xl font-black uppercase tracking-tight">
                ERANI <span className="text-gradient-brand">Services+</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="premium-border-container p-0 rounded-full">
                <div className="premium-border-inner bg-background/50 backdrop-blur-xl px-2 flex items-center">
                   <Search className="w-4 h-4 ml-4 text-gray-500" />
                   <input 
                    type="text"
                    placeholder="Busca estrategias o alianzas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none py-3 px-4 text-xs font-bold w-64 focus:ring-0 placeholder:text-gray-600 outline-none"
                   />
                   <div className="mr-2 px-2 py-1 rounded-md bg-foreground/5 text-[9px] font-black uppercase text-gray-500 flex items-center gap-1 border border-glass-border">
                      <Command className="w-2.5 h-2.5" /> K
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-foreground text-background shadow-xl' : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border border-glass-border'}`}
            >
              Todos los Servicios
            </button>
            {["strategy", "maximization", "additional"].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-erani-blue text-white shadow-xl shadow-erani-blue/20' : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border border-glass-border'}`}
              >
                {cat === 'strategy' ? 'Estrategia' : cat === 'maximization' ? 'Maximización' : 'Adicionales'}
              </button>
            ))}
          </div>
        </header>

        {/* Services Grid */}
        <div className="flex-1 p-8 pt-4 overflow-y-auto custom-scrollbar z-10">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredServices.map((service) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="premium-border-container group cursor-pointer"
                >
                  <div className="premium-border-inner p-8 flex flex-col gap-6 h-[340px]">
                    <div className="flex justify-between items-start">
                      <div className={`w-14 h-14 rounded-2xl bg-${service.color}/10 border border-${service.color}/20 flex items-center justify-center text-${service.color} group-hover:scale-110 transition-transform duration-500`}>
                        <service.icon className="w-7 h-7" />
                      </div>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-foreground/5 px-3 py-1.5 rounded-lg border border-glass-border">
                        {service.id}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-erani-blue/80">
                        {service.alliance}
                      </span>
                      <h3 className="text-xl font-black uppercase tracking-tight text-foreground line-clamp-1">
                        {service.name}
                      </h3>
                      <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-3">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-tight">
                              Impacto: {service.impact}
                            </span>
                         </div>
                         <div className="flex -space-x-2">
                            {service.tags.slice(0, 2).map((tag, i) => (
                               <div key={i} className="px-2 py-1 rounded-md bg-foreground/5 border border-glass-border text-[8px] font-black uppercase text-gray-400">
                                  {tag}
                               </div>
                            ))}
                         </div>
                      </div>
                      
                      <button className="w-full py-4 rounded-2xl bg-erani-blue/10 hover:bg-erani-blue text-erani-blue hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all group-hover:shadow-lg group-hover:shadow-erani-blue/20">
                        Maximizar Oferta <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* CTA to Alliance */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="col-span-full mt-12 glassmorphism p-12 border-2 border-dashed border-erani-purple/30 flex flex-col items-center justify-center text-center gap-6 group hover:border-erani-purple/60 transition-all"
            >
               <div className="w-20 h-20 rounded-3xl bg-erani-purple/10 flex items-center justify-center text-erani-purple mb-2">
                  <Briefcase className="w-10 h-10 group-hover:rotate-12 transition-transform" />
               </div>
               <div className="max-w-xl">
                  <h2 className="text-2xl font-black uppercase tracking-tight">¿Eres una Alianza Estratégica?</h2>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-2">
                    Únete al ecosistema ERANI Services+ y ofrece tus consultorias elite a nuestra red de clientes AAA.
                  </p>
               </div>
               <button className="button-premium px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-4">
                  Postular Alianza <Plus className="w-5 h-5" />
               </button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

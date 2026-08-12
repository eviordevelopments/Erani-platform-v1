"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  ArrowRight, 
  Target, 
  Briefcase, 
  Command,
  Sparkles,
  Lock
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import AllianceRequestDrawer from "@/components/services/AllianceRequestDrawer";
import ServiceDetailModal from "@/components/services/ServiceDetailModal";

interface Service {
  id: string;
  title: string;
  provider_name: string;
  service_type: "strategy" | "maximization" | "additional";
  description: string;
  features: string[];
  logo_url: string;
  status?: string;
}

export default function ServicesPlusPage() {
  const { isSidebarCollapsed } = useDashboard();
  const { org } = useAuth();
  const isTrial = !org?.paid_subscription || org?.plan === "trial";
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.provider_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory ? s.service_type === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, activeCategory]);

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
              <h1 className="text-3xl font-black uppercase tracking-tight">
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
                {cat === 'strategy' ? 'Corporativos' : cat === 'maximization' ? 'Industriales' : 'Herramientas Digitales'}
              </button>
            ))}
          </div>
        </header>

        {/* Services Grid with Trial Overlay */}
        <div className="relative flex-1 p-8 pt-4 overflow-y-auto custom-scrollbar z-10">
          <div className={`flex flex-col gap-6 h-full ${isTrial ? 'blur-md pointer-events-none' : ''}`}>
             <motion.div 
               layout
               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
             >
               <AnimatePresence>
                 {isLoading ? (
                    <div className="col-span-full py-20 text-center text-nav-text text-xs font-bold uppercase tracking-widest animate-pulse">
                      Cargando ecosistema...
                    </div>
                 ) : filteredServices.map((service) => (
                   <motion.div
                     key={service.id}
                     layout
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     onClick={() => !isTrial && setSelectedService(service)}
                     whileHover={{ y: -5 }}
                     className="premium-border-container group cursor-pointer"
                   >
                     <div className="premium-border-inner p-8 flex flex-col gap-6 h-[340px]">
                       <div className="flex justify-between items-start">
                         <div className={`w-16 h-16 rounded-2xl bg-foreground/5 border border-glass-border flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                           {service.logo_url ? (
                             <img src={service.logo_url} alt={service.provider_name} className="max-w-full max-h-full object-contain" />
                           ) : (
                             <Briefcase className="w-6 h-6 text-nav-text" />
                           )}
                         </div>
                         <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest bg-foreground/5 px-3 py-1.5 rounded-lg border border-glass-border">
                           {service.status === 'active' ? 'Disponible' : 'Próximamente'}
                         </span>
                       </div>

                       <div className="flex flex-col gap-2">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-erani-blue/80 line-clamp-1">
                           {service.provider_name}
                         </span>
                         <h3 className="text-lg font-black uppercase tracking-tight text-foreground line-clamp-1">
                           {service.title}
                         </h3>
                         <p className="text-xs font-medium text-nav-text leading-relaxed line-clamp-2 mt-1">
                           {service.description}
                         </p>
                       </div>

                       <div className="mt-auto flex flex-col gap-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                               <Target className="w-3.5 h-3.5 text-emerald-500" />
                               <span className="text-[9px] font-black uppercase text-emerald-500 tracking-tight">
                                 Ver Beneficios
                               </span>
                            </div>
                         </div>
                         
                         <button className="w-full py-4 rounded-xl bg-erani-blue/10 hover:bg-erani-blue text-erani-blue hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all group-hover:shadow-lg group-hover:shadow-erani-blue/20">
                           Ver Detalles <ArrowRight className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               
               {/* CTA to Alliance */}
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 className="col-span-full mt-6 glassmorphism p-12 border-2 border-dashed border-erani-purple/30 flex flex-col items-center justify-center text-center gap-6 group hover:border-erani-purple/60 transition-all cursor-pointer"
                 onClick={() => !isTrial && setIsDrawerOpen(true)}
               >
                  <div className="w-20 h-20 rounded-3xl bg-erani-purple/10 flex items-center justify-center text-erani-purple mb-2">
                     <Briefcase className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="max-w-xl">
                     <h2 className="text-2xl font-black uppercase tracking-tight">¿Eres una Alianza Estratégica?</h2>
                     <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-2 leading-relaxed">
                       Únete al ecosistema ERANI Services+ y ofrece tus consultorias elite o herramientas digitales a nuestra red de clientes AAA.
                     </p>
                  </div>
                  <button className="button-premium px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-4">
                     Postular Alianza <Plus className="w-5 h-5" />
                  </button>
               </motion.div>
             </motion.div>
          </div>

          {/* Trial Locked Overlay */}
          {isTrial && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-background/20 rounded-3xl">
               <div className="p-8 rounded-3xl bg-background/80 border border-glass-border backdrop-blur-xl flex flex-col items-center text-center w-full max-w-md shadow-2xl">
                  <div className="w-16 h-16 bg-erani-blue/10 border border-erani-blue/20 rounded-2xl flex items-center justify-center mb-4">
                     <img src="/isologo.png" alt="ERANI" className="w-8 h-8 object-contain animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-2">Servicio Exclusivo</h3>
                  <p className="text-xs text-nav-text mb-8 leading-relaxed">
                    La biblioteca de integraciones y alianzas de ERANI Services+ está reservada para cuentas en fase BETA o PRO.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/checkout'}
                    className="w-full py-4 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 bg-erani-blue text-white shadow-lg shadow-erani-blue/20 hover:scale-105 transition-transform"
                  >
                    Hacer Upgrade <Lock className="w-3 h-3" />
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>

      <AllianceRequestDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <ServiceDetailModal isOpen={!!selectedService} onClose={() => setSelectedService(null)} service={selectedService} />
    </div>
  );
}

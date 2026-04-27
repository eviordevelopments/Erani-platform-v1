"use client";

import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { CreditCard, ShieldCheck, ArrowRight, Zap } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export default function SubscriptionPage() {
  const { isSidebarCollapsed } = useDashboard();
  const stripeUrl = process.env.STRIPE_BOOKING_URL || "https://book.stripe.com/9B67sMd4Y6FK9n94lO8N200";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "ml-[104px]" : "ml-[296px]"} p-8 relative`}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-erani-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-6xl flex flex-col gap-12 pt-8">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col gap-4"
             >
               <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
                 Control de <span className="text-erani-purple">Rentabilidad & Créditos</span>
               </h1>
               <p className="text-gray-400 max-w-2xl leading-relaxed font-medium">
                 El Protocolo de Auditoría Forense consume créditos de ingeniería por cada gigabyte de metadata procesada mediante Inferencia de Nivel 2.
               </p>
             </motion.div>

             <div className="grid md:grid-cols-2 gap-8">
                 
                 {/* Credit Status Card */}
                 <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glassmorphism p-8 flex flex-col gap-6"
                 >
                     <div className="flex items-center gap-4 text-erani-blue mb-4">
                         <Zap className="w-6 h-6" />
                         <h3 className="text-xs uppercase font-black tracking-widest text-gray-300">Inventario de Créditos</h3>
                     </div>
                     <div className="flex flex-col gap-2">
                         <span className="text-5xl font-black text-white">500<span className="text-xl text-gray-500 ml-2">Cr</span></span>
                         <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                             <div className="bg-erani-blue w-[25%] h-full shadow-[0_0_10px_rgba(0,85,160,0.5)]" />
                         </div>
                         <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">
                             <span>Consumo de este mes: 150Cr</span>
                             <span>Restante: 75%</span>
                         </div>
                     </div>
                 </motion.div>

                 {/* Subscription Upgrade Card */}
                 <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glassmorphism p-8 border border-erani-purple/20 bg-gradient-to-br from-erani-purple/5 to-transparent flex flex-col gap-6 relative overflow-hidden"
                 >
                     <div className="flex items-center gap-4 text-erani-purple mb-4">
                         <CreditCard className="w-6 h-6" />
                         <h3 className="text-xs uppercase font-black tracking-widest text-gray-300">Auditoría Industrial</h3>
                     </div>

                     <div className="flex flex-col gap-1">
                         <span className="text-3xl font-black text-white">$2,500 <span className="text-sm font-bold text-gray-500">MXN / Reporte</span></span>
                     </div>

                     <ul className="flex flex-col gap-3 my-4">
                         {["Análisis Forense 90 Días", "Dashboard Bento Interactivo", "Garantía Erani: 3x ROI de la Inversión"].map((feat, i) => (
                             <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-400">
                                 <ShieldCheck className="w-4 h-4 text-emerald-500" /> {feat}
                             </li>
                         ))}
                     </ul>

                     <a 
                       href={stripeUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="button-premium w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 relative z-10"
                     >
                         Activar Firewall (Checkout Seguro) <ArrowRight className="w-4 h-4" />
                     </a>
                 </motion.div>

             </div>
          </div>
      </main>
    </div>
  );
}

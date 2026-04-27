"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight, Zap, Target } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Hero() {
  const router = useRouter();
  return (
    <section className="relative min-h-[110vh] flex items-center justify-center pt-40 pb-32 px-10 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-glow blur-[120px] rounded-full -z-10 animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-erani-purple/20 blur-[120px] rounded-full -z-10 animate-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-[1600px] w-full grid lg:grid-cols-2 gap-20 items-center px-10">
        {/* Hero Text */}
        <div className="flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 rounded-full border border-accent-blue/20 bg-accent-blue/5 w-fit"
          >
            <Shield className="w-4 h-4 text-erani-blue" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-blue/80">
              Profitability Firewall v1.0
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white"
          >
            DETÉN LA <span className="brand-light-flow">FUGA</span> DE CAPITAL EN <span className="text-erani-blue">21 DÍAS</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-gray-400 max-w-xl leading-relaxed font-medium"
          >
            Erani Platform es el ecosistema industrial que extrae la verdad operativa mediante 
            <span className="text-white italic"> Inferencia de Nivel 2</span>. Triangulamos tu metadata para eliminar la ceguera financiera.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <button 
              onClick={() => router.push('/register')}
              className="button-premium px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 group"
            >
              Iniciar Auditoría Forense
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link 
              href="/register"
              className="px-8 py-4 rounded-full border border-white/10 glassmorphism text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              Ver Demo Interactiva
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex items-center gap-8 pt-6 border-t border-white/5"
          >
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-white">8.5x</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">ROI Garantizado</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-white">$720k</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Ahorro Promedio</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-white">99%</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Precisión Forense</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual Block */}
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1, delay: 0.4 }}
           className="relative aspect-square lg:aspect-video glassmorphism overflow-hidden group shadow-2xl shadow-erani-blue/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-erani-blue/10 to-transparent " />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          
          <div className="absolute inset-0 flex items-center justify-center">
             <Image 
                src="/isologo.png" 
                alt="Erani Isologo" 
                width={300} 
                height={300} 
                className="opacity-20 animate-float"
             />
          </div>

          {/* Floating UI Elements */}
          <div className="absolute top-1/4 left-1/4 glassmorphism p-4 border-erani-blue/20 animate-float" style={{ animationDelay: '1s' }}>
             <Zap className="w-6 h-6 text-erani-blue" />
          </div>
          <div className="absolute bottom-1/4 right-1/4 glassmorphism p-4 border-erani-purple/20 animate-float" style={{ animationDelay: '3s' }}>
             <Target className="w-6 h-6 text-erani-purple" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

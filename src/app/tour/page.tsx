"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Search,
  UploadCloud,
  Bot,
  Video,
  Zap,
  Cpu,
  FolderKanban,
  UserCog,
  LayoutDashboard,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MessageSquare
} from "lucide-react";
import Image from "next/image";

type TourState = 
  | "intro"
  | "security"
  | "profile"
  | "schedule"
  | "features"
  | "feedback"
  | "checkout"
  | "ready";

const featuresList = [
  { icon: ShieldCheck, title: "Seguridad y Blindaje", desc: "Protocolos avanzados para proteger tus datos." },
  { icon: Search, title: "Auditorías Forenses", desc: "Motor de búsqueda con trazabilidad total." },
  { icon: UploadCloud, title: "Carga de Archivos", desc: "Gestión documental segura." },
  { icon: Bot, title: "Consultas al Agente", desc: "Asistencia IA 24/7." },
  { icon: Video, title: "Sesiones Virtuales", desc: "Colaboración en tiempo real." },
  { icon: Zap, title: "Automatizaciones", desc: "Flujos de trabajo optimizados." },
  { icon: Cpu, title: "IA Agéntica Operativa", desc: "Operaciones autónomas inteligentes." },
  { icon: FolderKanban, title: "Creación de Proyectos", desc: "Gestión centralizada de iniciativas." },
  { icon: UserCog, title: "Gestión de Perfil", desc: "Control total de tu cuenta." },
  { icon: LayoutDashboard, title: "Widgets Dinámicos", desc: "Vistas personalizables de dashboards." },
];

export default function PostOnboardingTour() {
  const router = useRouter();
  const { profile, org } = useAuth();
  const [currentState, setCurrentState] = useState<TourState>("intro");
  const [featureIndex, setFeatureIndex] = useState(0);

  const nextFeature = () => {
    setFeatureIndex((prev) => (prev + 1) % featuresList.length);
  };

  const prevFeature = () => {
    setFeatureIndex((prev) => (prev - 1 + featuresList.length) % featuresList.length);
  };

  const renderState = () => {
    switch (currentState) {
      case "intro":
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-2xl"
          >
            <div className="w-24 h-24 rounded-full bg-erani-blue/10 flex items-center justify-center mb-4 border border-erani-blue/30">
              <Image src="/isologo.png" alt="ERANI" width={48} height={48} className="logo-adaptive" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Bienvenido a <span className="text-gradient-brand">ERANI</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Estás a un paso de tomar el control total de la rentabilidad y seguridad de tu organización.
            </p>
            <div className="w-full aspect-video bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-erani-blue/5 group-hover:bg-erani-blue/10 transition-colors" />
              <Video className="w-16 h-16 text-white/20 group-hover:text-erani-blue/60 transition-colors" />
              <div className="absolute bottom-4 left-4 text-xs font-bold text-gray-500 tracking-widest uppercase">
                Tutorial de Inicio
              </div>
            </div>
            <button
              onClick={() => setCurrentState("security")}
              className="button-premium w-full mt-4 py-4 rounded-xl text-xs uppercase tracking-widest flex justify-center items-center gap-2"
            >
              Comenzar Recorrido <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-erani-coral/10 flex items-center justify-center border border-erani-coral/30">
              <ShieldCheck className="w-10 h-10 text-erani-coral" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Protocolos de <span className="text-erani-coral">Seguridad</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="font-bold text-erani-coral uppercase text-xs tracking-widest mb-2">Cifrado Militar</h3>
                <p className="text-sm text-gray-400">Tus datos están protegidos con estándares de seguridad de nivel bancario e infraestructura aislada.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="font-bold text-erani-coral uppercase text-xs tracking-widest mb-2">Trazabilidad Total</h3>
                <p className="text-sm text-gray-400">Cada acción es registrada en un log forense inmutable para auditorías futuras.</p>
              </div>
            </div>
            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => setCurrentState("intro")}
                className="button-secondary flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Atrás
              </button>
              <button
                onClick={() => setCurrentState("profile")}
                className="button-premium flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Siguiente
              </button>
            </div>
          </motion.div>
        );

      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-2xl"
          >
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Tu <span className="text-gradient-brand">Perfil y Organización</span>
            </h2>
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-erani-blue/20 blur-[60px]" />
              <div className="flex items-center gap-6 mb-8 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-erani-purple/20 border border-erani-purple/30 flex items-center justify-center overflow-hidden">
                  {org?.logo_url ? (
                    <img src={org.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-erani-purple">{org?.name?.charAt(0) || "O"}</span>
                  )}
                </div>
                <div className="text-left flex flex-col">
                  <span className="text-2xl font-black text-white">{org?.name || "Tu Organización"}</span>
                  <span className="text-xs font-bold text-erani-purple tracking-widest uppercase">Activada</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-6 relative z-10">
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{profile?.full_name || profile?.display_name || "Administrador"}</p>
                  <p className="text-xs text-gray-400">{profile?.email || "admin@example.com"}</p>
                </div>
                <span className="bg-erani-blue/20 text-erani-blue text-[10px] uppercase font-black px-3 py-1 rounded-lg tracking-widest">
                  Admin
                </span>
              </div>
            </div>
            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => setCurrentState("security")}
                className="button-secondary flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Atrás
              </button>
              <button
                onClick={() => setCurrentState("schedule")}
                className="button-premium flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Siguiente
              </button>
            </div>
          </motion.div>
        );

      case "schedule":
        return (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-3xl"
          >
             <div className="w-20 h-20 rounded-full bg-erani-green/10 flex items-center justify-center border border-erani-green/30">
              <Calendar className="w-10 h-10 text-erani-green" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Sesión <span className="text-erani-green">Exploratoria</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Agenda tu primera sesión con nuestro equipo para alinear tus objetivos y conocer más sobre la implementación en tu empresa.
            </p>
            <div className="w-full h-[500px] bg-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
              <iframe
                src="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2EUR-bCUz7R604ttZTsBVNw5TRByBuPyoL8Os2axIgH2v1hjAh0OJURYc2TiH92bH-O5kkJf94?gv=true"
                style={{ border: 0 }}
                width="100%"
                height="100%"
                frameBorder="0"
                className="absolute inset-0"
              />
            </div>
            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => setCurrentState("profile")}
                className="button-secondary flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Atrás
              </button>
              <button
                onClick={() => setCurrentState("features")}
                className="button-premium flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        );

      case "features":
        const CurrentFeatureIcon = featuresList[featureIndex].icon;
        return (
          <motion.div
            key="features"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-2xl"
          >
             <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Descubre tus <span className="text-gradient-brand">Poderes</span>
            </h2>
            <div className="relative w-full h-80 flex items-center justify-center perspective-1000">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={featureIndex}
                   initial={{ rotateY: 90, opacity: 0 }}
                   animate={{ rotateY: 0, opacity: 1 }}
                   exit={{ rotateY: -90, opacity: 0 }}
                   transition={{ duration: 0.4 }}
                   className="absolute inset-0 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl"
                   style={{ transformStyle: "preserve-3d" }}
                 >
                   <div className="w-24 h-24 rounded-full bg-erani-blue/20 flex items-center justify-center mb-6 border border-erani-blue/40">
                      <CurrentFeatureIcon className="w-12 h-12 text-erani-blue" />
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3">{featuresList[featureIndex].title}</h3>
                   <p className="text-gray-400 text-base max-w-md">{featuresList[featureIndex].desc}</p>
                 </motion.div>
               </AnimatePresence>
               
               <button onClick={prevFeature} className="absolute left-[-20px] md:left-[-60px] p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors z-10">
                 <ArrowLeft className="w-6 h-6 text-white" />
               </button>
               <button onClick={nextFeature} className="absolute right-[-20px] md:right-[-60px] p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors z-10">
                 <ArrowRight className="w-6 h-6 text-white" />
               </button>
            </div>
            
            <div className="flex gap-2 justify-center mt-4">
              {featuresList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeatureIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === featureIndex ? 'bg-erani-blue w-6' : 'bg-white/20'}`}
                />
              ))}
            </div>

            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => setCurrentState("schedule")}
                className="button-secondary flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Atrás
              </button>
              <button
                onClick={() => setCurrentState("feedback")}
                className="button-premium flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Siguiente
              </button>
            </div>
          </motion.div>
        );

      case "feedback":
        return (
           <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-erani-purple/10 flex items-center justify-center border border-erani-purple/30">
              <MessageSquare className="w-10 h-10 text-erani-purple" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Ayúdanos a <span className="text-erani-purple">Mejorar</span>
            </h2>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl w-full">
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                {profile?.role === 'dev' && (
                  "Como Desarrollador / Auditor, este es tu espacio principal para reportar bugs técnicos, evaluar requerimientos de arquitectura y proponer optimizaciones al código. El tablero interactivo (drag and drop) te permite actualizar el estado del desarrollo y gestionar las prioridades del ecosistema de manera pública."
                )}
                {profile?.role === 'admin' && (
                  "Como Founding Member y Administrador, tu visión dirige el producto. Usa este tablero interactivo público (drag and drop) para priorizar el roadmap, validar funcionalidades, recibir el pulso de los usuarios y gestionar el avance del equipo."
                )}
                {(!profile?.role || profile?.role === 'client') && (
                  "ERANI está en constante evolución y tu opinión es nuestra guía. Usa este espacio público para sugerir nuevas ideas, funcionalidades o reportar áreas de mejora. Puedes mover libremente tus sugerencias en nuestro tablero interactivo (drag and drop) para integrarlas al Roadmap oficial."
                )}
              </p>
              <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 justify-center">
                 <div className="w-2 h-2 rounded-full bg-erani-blue animate-pulse" />
                 <span className="text-xs uppercase font-black tracking-widest text-white/60">ERANI BETA v0.1.0</span>
              </div>
            </div>
            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => setCurrentState("features")}
                className="button-secondary flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Atrás
              </button>
              <button
                onClick={() => setCurrentState("checkout")}
                className="button-premium flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Siguiente
              </button>
            </div>
          </motion.div>
        );

      case "checkout":
        return (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-4xl"
          >
             <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Desbloquea <span className="text-gradient-brand">ERANI Beta</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full text-left">
              {/* Plan Box */}
              <div className="glassmorphism p-8 rounded-[2rem] border border-erani-blue/30 relative overflow-hidden shadow-2xl shadow-erani-blue/10 flex flex-col gap-6">
                 <div className="absolute top-0 right-0 p-4">
                   <div className="px-3 py-1 rounded-full bg-erani-blue/20 border border-erani-blue/30 text-[10px] font-black uppercase tracking-widest text-erani-blue">Suscripción Beta</div>
                 </div>
                 <div className="flex flex-col gap-2">
                   <h3 className="text-2xl font-black text-foreground">ERANI Shield</h3>
                   <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-erani-blue">$999</span>
                      <span className="text-sm text-gray-500 font-bold mb-1">USD / mes</span>
                   </div>
                 </div>
                 <ul className="flex flex-col gap-3">
                    {[
                      "100 ERIS de Balance Mensual",
                      "Auditorías Forenses Ilimitadas",
                      "Trazabilidad y Cifrado Militar",
                      "Soporte Prioritario 24/7",
                      "IA Agéntica Operativa Avanzada"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                         <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                         </div>
                         <span className="text-sm text-gray-300 font-medium">{feature}</span>
                      </li>
                    ))}
                 </ul>
                 <button
                    onClick={() => router.push('/subscription')}
                    className="button-premium w-full mt-auto py-5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-erani-blue/20"
                 >
                    Adquirir Plan
                 </button>
              </div>

              {/* Comparison Box */}
              <div className="glassmorphism p-8 rounded-[2rem] border border-erani-coral/30 relative flex flex-col gap-6">
                 <div className="absolute top-0 right-0 p-4">
                   <div className="px-3 py-1 rounded-full bg-erani-coral/10 border border-erani-coral/20 text-[10px] font-black uppercase tracking-widest text-erani-coral">Impacto de Inacción</div>
                 </div>
                 <h3 className="text-lg font-black uppercase tracking-widest text-erani-coral">Fuga de Rentabilidad</h3>
                 <p className="text-sm text-gray-400">Sin una estructura forense, las organizaciones pierden en promedio:</p>
                 
                 <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end pb-2 border-b border-white/5">
                      <span className="text-xs uppercase font-bold text-gray-500">Desorden Operativo</span>
                      <span className="text-lg font-black text-erani-coral">-$3,500 <span className="text-[10px]">USD/mes</span></span>
                    </div>
                    <div className="flex justify-between items-end pb-2 border-b border-white/5">
                      <span className="text-xs uppercase font-bold text-gray-500">Scope Creep</span>
                      <span className="text-lg font-black text-erani-coral">-$8,200 <span className="text-[10px]">USD/mes</span></span>
                    </div>
                    <div className="flex justify-between items-end pt-4">
                      <span className="text-sm uppercase font-black text-white">Retorno Estimado ERANI</span>
                      <span className="text-2xl font-black text-emerald-500">+ 11x ROI</span>
                    </div>
                 </div>

                 <button
                    onClick={() => setCurrentState("ready")}
                    className="button-secondary w-full mt-auto py-5 rounded-xl text-xs uppercase tracking-widest text-gray-400 hover:text-white"
                 >
                    Omitir por ahora
                 </button>
              </div>
            </div>
            
            <div className="flex gap-4 w-full mt-2 max-w-sm">
              <button
                onClick={() => setCurrentState("feedback")}
                className="button-secondary flex-1 py-4 rounded-xl text-xs uppercase tracking-widest"
              >
                Atrás
              </button>
            </div>
          </motion.div>
        );

      case "ready":
        return (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-8 w-full max-w-2xl"
          >
            <div className="absolute inset-0 bg-erani-blue/10 blur-[100px] pointer-events-none rounded-full" />
            
            <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image src="/eanilogo.png" alt="ERANI" width={280} height={100} className="logo-adaptive" />
            </motion.div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mt-4">
              Todo <span className="text-gradient-brand">Listo</span>
            </h2>
            <p className="text-xl text-gray-400 font-bold">
              Bienvenido al futuro operativo.
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="button-premium w-full mt-8 py-6 rounded-2xl text-sm uppercase tracking-[0.25em] flex justify-center items-center gap-4 shadow-2xl shadow-erani-blue/20"
            >
              Entrar al Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 z-0 radial-gradient-dark pointer-events-none" />
      
      {/* Progress Bar (Optional context) */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {(["intro", "security", "profile", "schedule", "features", "feedback", "checkout", "ready"] as TourState[]).map((state, idx) => {
          const stateOrder = ["intro", "security", "profile", "schedule", "features", "feedback", "checkout", "ready"];
          const currentIdx = stateOrder.indexOf(currentState);
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          
          return (
            <div 
              key={state}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isCurrent ? "w-8 bg-erani-blue" : isPast ? "w-4 bg-erani-blue/50" : "w-2 bg-white/10"
              }`}
            />
          )
        })}
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <AnimatePresence mode="wait">
          {renderState()}
        </AnimatePresence>
      </div>
    </div>
  );
}

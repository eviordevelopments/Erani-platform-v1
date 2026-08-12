"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  X,
  ArrowRight,
  Shield,
  User,
  FileText,
  Lock,
  Zap
} from "lucide-react";
import Image from "next/image";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const pages = [
    {
      id: "tutorial",
      title: "Tutorial de Inicio",
      description: "Descubre cómo Erani blinda tu rentabilidad paso a paso.",
      type: "video"
    },
    {
      id: "profile",
      title: "Perfil del Administrador",
      description: "Personaliza tu experiencia operativa configurando tu identidad.",
      type: "profile"
    },
    {
      id: "meeting",
      title: "Reunión Estratégica",
      description: "Agenda tu sesión de onboarding con un especialista en auditoría forense.",
      type: "meeting"
    },
    {
      id: "security",
      title: "Transparencia Operativa Total",
      description: "No requerimos credenciales. Tú controlas el flujo de datos enviando únicamente los metadatos necesarios.",
      type: "security"
    },
    {
      id: "finish",
      title: "¡Todo Listo!",
      description: "Tu infraestructura está siendo procesada. Bienvenido a la era de la rentabilidad.",
      type: "finish"
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl glassmorphism overflow-hidden shadow-[0_0_100px_rgba(0,85,160,0.2)] border border-glass-border rounded-[2.5rem]"
          >
            {/* Background Glow */}
            <div className="absolute -top-[20%] -right-[10%] w-[400px] h-[400px] bg-erani-blue/10 blur-[100px] -z-10" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[400px] h-[400px] bg-erani-purple/10 blur-[100px] -z-10" />

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-nav-text hover:text-foreground transition-colors z-50 p-2 hover:bg-foreground/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-12 flex flex-col gap-8 min-h-[500px]">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-2">
                {pages[currentPage].id === "security" && (
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-erani-blue">Protocolo de Seguridad</span>
                )}
                <motion.h2 
                  key={`title-${currentPage}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-black uppercase tracking-widest text-foreground"
                >
                  {pages[currentPage].title}
                </motion.h2>
                <motion.p 
                  key={`desc-${currentPage}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs font-medium text-nav-text uppercase tracking-widest"
                >
                  {pages[currentPage].description}
                </motion.p>
              </div>

              {/* Page Content */}
              <div className="flex-1 flex items-center justify-center py-4">
                <AnimatePresence mode="wait">
                  {currentPage === 0 && (
                    <motion.div 
                      key="tutorial-content"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full aspect-video rounded-3xl bg-foreground/5 border border-glass-border relative overflow-hidden group cursor-pointer"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-erani-blue/20 flex items-center justify-center text-erani-blue group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,85,160,0.2)]">
                          <Play className="w-8 h-8 fill-current translate-x-1" />
                        </div>
                      </div>
                      {/* Fake Video Thumbnail Decor */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                        <div className="h-full bg-erani-blue w-[30%]" />
                      </div>
                    </motion.div>
                  )}

                  {currentPage === 1 && (
                    <motion.div 
                      key="profile-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                    >
                        {/* Left Side: Inputs */}
                        <div className="flex flex-col gap-6 text-left">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Emiliano Castillo"
                                    className="input-premium"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Cargo / Rol</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Director General"
                                    className="input-premium"
                                />
                            </div>
                        </div>

                        {/* Right Side: Animation */}
                        <div className="glassmorphism p-8 rounded-[2.5rem] border border-glass-border shadow-2xl relative overflow-hidden flex flex-col items-center justify-center h-full min-h-[200px]">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-erani-blue/10 blur-[50px] rounded-full" />
                             <div className="absolute bottom-0 left-0 w-32 h-32 bg-erani-purple/10 blur-[50px] rounded-full" />
                             <User className="w-16 h-16 text-erani-blue mb-6 animate-pulse" />
                             <div className="h-2 w-24 bg-foreground/10 rounded-full overflow-hidden">
                                  <motion.div 
                                      animate={{ width: ["0%", "100%", "0%"] }}
                                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                      className="h-full bg-gradient-to-r from-erani-blue to-erani-purple"
                                  />
                             </div>
                        </div>
                    </motion.div>
                  )}

                  {currentPage === 2 && (
                    <motion.div 
                      key="meeting-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex flex-col items-center gap-8 text-center w-full"
                    >
                      {showCalendar ? (
                        <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-white/20 bg-white/5">
                           <iframe src="https://calendar.app.google/EovZMgXzWoeHxeLKA" className="w-full h-full bg-transparent" frameBorder="0" scrolling="no"></iframe>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-erani-purple animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-erani-purple to-erani-blue flex items-center justify-center text-white shadow-xl">
                                <Calendar className="w-8 h-8" />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-4 items-center">
                              <button 
                                onClick={() => setShowCalendar(true)}
                                className="button-premium px-12 py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em]"
                              >
                                Agendar Sesión Ahora
                              </button>
                              <a 
                                href="https://calendar.app.google/EovZMgXzWoeHxeLKA"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] uppercase font-bold text-erani-blue hover:text-erani-purple tracking-widest underline decoration-dashed underline-offset-4 transition-colors"
                              >
                                Abrir en una ventana nueva
                              </a>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {currentPage === 3 && (
                    <motion.div 
                      key="security-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full flex flex-col gap-8 mt-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Card 1 */}
                        <div className="bg-foreground/5 border border-glass-border p-5 rounded-2xl flex items-start gap-4 hover:bg-foreground/10 transition-colors">
                          <div className="p-3 bg-foreground/5 rounded-xl border border-glass-border">
                            <Shield className="w-5 h-5 text-erani-blue" />
                          </div>
                          <div className="flex flex-col gap-1 text-left">
                            <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Export de Canales</span>
                            <span className="text-[9px] text-nav-text leading-relaxed">Historial de mensajes técnicos de Slack o Teams.</span>
                          </div>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-foreground/5 border border-glass-border p-5 rounded-2xl flex items-start gap-4 hover:bg-foreground/10 transition-colors">
                          <div className="p-3 bg-foreground/5 rounded-xl border border-glass-border">
                            <FileText className="w-5 h-5 text-erani-blue" />
                          </div>
                          <div className="flex flex-col gap-1 text-left">
                            <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Logs de Gestión</span>
                            <span className="text-[9px] text-nav-text leading-relaxed">Reportes en CSV de Jira, ClickUp o Asana.</span>
                          </div>
                        </div>
                        {/* Card 3 */}
                        <div className="bg-foreground/5 border border-glass-border p-5 rounded-2xl flex items-start gap-4 hover:bg-foreground/10 transition-colors">
                          <div className="p-3 bg-foreground/5 rounded-xl border border-glass-border">
                            <Lock className="w-5 h-5 text-erani-blue" />
                          </div>
                          <div className="flex flex-col gap-1 text-left">
                            <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Cifrado de Extremo</span>
                            <span className="text-[9px] text-nav-text leading-relaxed">Solo leemos metadatos operativos.</span>
                          </div>
                        </div>
                        {/* Card 4 */}
                        <div className="bg-foreground/5 border border-glass-border p-5 rounded-2xl flex items-start gap-4 hover:bg-foreground/10 transition-colors">
                          <div className="p-3 bg-foreground/5 rounded-xl border border-glass-border">
                            <Zap className="w-5 h-5 text-erani-blue" />
                          </div>
                          <div className="flex flex-col gap-1 text-left">
                            <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Impacto Real</span>
                            <span className="text-[9px] text-nav-text leading-relaxed">Cruce de datos facturados vs esfuerzo operativo.</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={nextPage}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-erani-blue to-erani-purple text-white text-[10px] uppercase font-black tracking-[0.2em] shadow-[0_0_20px_rgba(0,85,160,0.3)] hover:opacity-90 transition-opacity flex items-center justify-center gap-3 mt-4"
                      >
                        Activar Blindaje Forense <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {currentPage === 4 && (
                    <motion.div 
                      key="finish-content"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-10"
                    >
                      <div className="relative">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1.2 }}
                          transition={{ type: "spring", damping: 10, stiffness: 100 }}
                          className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full"
                        />
                        <CheckCircle2 className="w-32 h-32 text-emerald-500 relative z-10" />
                      </div>
                      
                      <div className="flex flex-col items-center gap-4">
                        <Image src="/eanilogo.png" alt="ERANI" width={160} height={40} className="logo-adaptive" />
                        <div className="h-0.5 w-12 bg-emerald-500/30 rounded-full" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Controls */}
              <div className="flex flex-col gap-6 mt-auto">
                {/* Scroll Indicator */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    {pages.map((_, i) => (
                      <div 
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          currentPage === i ? "w-8 bg-erani-blue" : "w-2 bg-foreground/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Buttons - Hidden on security page because it has its own custom button */}
                {pages[currentPage].id !== "security" && (
                  <div className="flex items-center justify-between mt-4">
                    <button 
                      onClick={prevPage}
                      disabled={currentPage === 0}
                      className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-nav-text hover:text-foreground transition-colors disabled:opacity-0"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    <button 
                      onClick={nextPage}
                      className="button-premium px-10 py-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-3"
                    >
                      {currentPage === pages.length - 1 ? "Recupera tu Rentabilidad" : "Siguiente"}
                      {currentPage < pages.length - 1 && <ChevronRight className="w-4 h-4" />}
                      {currentPage === pages.length - 1 && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

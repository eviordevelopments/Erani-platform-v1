"use client";

import { motion } from "framer-motion";
import { CheckCircle, ShieldCheck, Mail, ArrowRight, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // Fire some confetti when the component mounts
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ffffff", "#000000", "#1E3A8A"] // Using some Erani-like colors
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ffffff", "#000000", "#1E3A8A"]
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0B0C0E] text-[#111111] dark:text-[#E2E2E2] flex items-center justify-center p-4 sm:p-8 font-sans transition-colors duration-300">
      <motion.div 
        className="max-w-2xl w-full bg-white dark:bg-[#15161A] border border-[#EAEAEA] dark:border-[#2A2B30] rounded-2xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] text-center relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-64 bg-gradient-to-b from-[#111111]/5 dark:from-[#E2E2E2]/5 to-transparent opacity-50 pointer-events-none blur-3xl"></div>

        <motion.div 
          className="flex justify-center mb-8 relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <div className="w-24 h-24 bg-[#111111] dark:bg-[#E2E2E2] rounded-full flex items-center justify-center shadow-lg relative z-10">
            <CheckCircle className="w-12 h-12 text-white dark:text-[#111111]" strokeWidth={2} />
          </div>
          <motion.div 
            className="absolute inset-0 bg-[#111111]/10 dark:bg-[#E2E2E2]/10 rounded-full"
            initial={{ scale: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
        </motion.div>

        <motion.h1 
          className="text-3xl md:text-4xl font-light tracking-tight mb-4 text-[#111111] dark:text-white relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Suscripción <span className="font-medium">Confirmada</span>
        </motion.h1>

        <motion.p 
          className="text-[#666666] dark:text-[#A0A0A0] text-lg mb-10 max-w-lg mx-auto leading-relaxed relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Tu pago ha sido procesado exitosamente. Bienvenido al nivel de acceso completo de <strong className="text-[#111111] dark:text-[#E2E2E2] font-medium">ERANI Beta</strong>.
        </motion.p>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="p-5 bg-[#F9F9F9] dark:bg-[#1A1C21] rounded-xl border border-[#EEEEEE] dark:border-[#2A2B30]">
            <ShieldCheck className="w-6 h-6 text-[#111111] dark:text-[#E2E2E2] mb-3" />
            <h3 className="font-medium text-[#111111] dark:text-[#E2E2E2] mb-1">Activación de Servicios</h3>
            <p className="text-sm text-[#666666] dark:text-[#999999] leading-relaxed">
              En las próximas 24 horas recibirás un correo de confirmación de tu ejecutivo asignado con los accesos al entorno de auditoría.
            </p>
          </div>

          <div className="p-5 bg-[#F9F9F9] dark:bg-[#1A1C21] rounded-xl border border-[#EEEEEE] dark:border-[#2A2B30]">
            <Mail className="w-6 h-6 text-[#111111] dark:text-[#E2E2E2] mb-3" />
            <h3 className="font-medium text-[#111111] dark:text-[#E2E2E2] mb-1">Contrato y Facturación</h3>
            <p className="text-sm text-[#666666] dark:text-[#999999] leading-relaxed">
              La copia de tu contrato de servicios firmado digitalmente junto con tu factura (si aplica) será enviada al correo del responsable.
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#111111] dark:bg-[#E2E2E2] hover:bg-black dark:hover:bg-white text-white dark:text-[#111111] rounded-lg font-medium transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_14px_rgba(255,255,255,0.1)]">
              Ir al Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          
          <Link href="mailto:soporte@erani.mx" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-[#EAEAEA] dark:border-[#333333] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1C21] text-[#444444] dark:text-[#CCCCCC] rounded-lg font-medium transition-colors">
              <LifeBuoy className="w-4 h-4" />
              Soporte
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

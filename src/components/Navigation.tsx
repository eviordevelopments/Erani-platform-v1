"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "El Problema", href: "#problema" },
    { label: "Auditoría Forense", href: "#proceso" },
    { label: "Casos de Estudio", href: "#impacto" },
    { label: "Precios", href: "#precios" },
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex flex-col items-center px-4">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="glassmorphism max-w-[1600px] w-full px-12 h-20 flex items-center justify-between gap-10"
      >
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/eanilogo.png" 
            alt="ERANI Logo" 
            width={120} 
            height={40} 
            className="object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {navLinks.map((item) => (
            <a 
              key={item.label} 
              href={item.href} 
              className="hover:text-erani-blue transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-erani-blue transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="hidden sm:flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Ingresar
          </Link>
          
          <button className="button-premium px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:scale-105 active:scale-95 transition-transform">
            Agendar Peritaje
          </button>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-400"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden w-full mt-2"
          >
            <div className="glassmorphism p-6 flex flex-col gap-4">
              {navLinks.map((item) => (
                <a 
                  key={item.label} 
                  href={item.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-erani-blue border-b border-white/5 pb-2"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/login" className="text-xs font-black uppercase tracking-widest text-erani-purple">
                Ingresar al Portal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard,
  FileSearch,
  CreditCard,
  Settings,
  LogOut,
  CalendarCheck2,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  ShieldCheck,
  ShoppingBag,
  PlusCircle,
  Bot,
  MessageSquare,
  Activity,
  User as UserIcon,
  Headphones,
  FileText as LogsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { useDashboard } from "@/context/DashboardContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard Forense", href: "/dashboard" },
  { icon: FileSearch, label: "Protocolo de Auditoría", href: "/audit" },
  { icon: ShieldCheck, label: "Peritaje Forense", href: "/forensic" },
  { icon: CalendarCheck2, label: "Sesiones de Estrategia", href: "/sessions" },
  { icon: ShoppingBag, label: "Automatizaciones", href: "/marketplace" },
  { icon: PlusCircle, label: "ERANI Services+", href: "/services" },
  { icon: Bot, label: "Agente Forense", href: "/agent" },
  { icon: CreditCard, label: "Suscripción", href: "/subscription" },
  { icon: Settings, label: "Configuración", href: "/settings" },
  { icon: MessageSquare, label: "Feedback", href: "/feedback" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed: isCollapsed, setIsSidebarCollapsed: setIsCollapsed } = useDashboard();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const sidebarWidth = isCollapsed ? 88 : 280;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="fixed left-4 top-4 bottom-4 glassmorphism border border-glass-border flex flex-col z-40 rounded-[2.5rem] shadow-[0_0_50px_rgba(158,128,255,0.1)] group/sidebar overflow-hidden"
    >
      {/* Brand Header */}
      <div className={`flex items-center relative shrink-0 ${isCollapsed ? "flex-col h-32 justify-center gap-4" : "h-24 px-6 justify-between"}`}>
        <Link href="/" className="flex items-center">
          {isCollapsed ? (
            <Image 
              src="/isologo.png" 
              alt="ERANI" 
              width={32} 
              height={32} 
              className="object-contain logo-adaptive" 
              priority 
            />
          ) : (
            <Image 
              src="/eanilogo.png" 
              alt="ERANI" 
              width={100} 
              height={28} 
              className="object-contain logo-adaptive" 
              priority 
            />
          )}
        </Link>
        
        <button 
           onClick={() => setIsCollapsed(!isCollapsed)}
           className={`flex items-center justify-center transition-all duration-300 rounded-xl border border-glass-border hover:bg-foreground/5 text-nav-text hover:text-foreground ${
             isCollapsed ? "w-10 h-10" : "w-8 h-8"
           }`}
           title={isCollapsed ? "Expandir" : "Colapsar"}
        >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Scrollbox */}
      <div className="flex-grow overflow-y-auto px-3 custom-scrollbar flex flex-col gap-6 py-2">
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center rounded-2xl transition-all duration-300 relative group/item overflow-hidden ${
                  isActive 
                  ? "bg-foreground/5 text-foreground shadow-sm" 
                  : "text-nav-text hover:text-foreground hover:bg-foreground/5"
                } ${isCollapsed ? "justify-center h-12" : "px-4 h-12 gap-4"}`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-erani-blue shadow-[0_0_10px_rgba(0,85,160,0.8)]"
                  />
                )}

                <div className={`flex items-center justify-center shrink-0 ${isCollapsed ? "w-10 h-10" : "w-5 h-5"}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-erani-blue drop-shadow-[0_0_8px_rgba(0,85,160,0.5)]" : "group-hover/item:text-erani-purple transition-colors"}`} />
                </div>
                
                {!isCollapsed && (
                  <motion.span 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] uppercase font-black tracking-[0.1em] whitespace-nowrap"
                  >
                      {item.label}
                  </motion.span>
                )}

                {/* Tooltip for Collapsed State */}
                {isCollapsed && (
                   <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 border border-white/10 rounded-xl text-[8px] uppercase font-black tracking-widest text-white opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all -translate-x-2 group-hover/item:translate-x-0 whitespace-nowrap z-50 shadow-2xl">
                      {item.label}
                   </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ERIS Credits Card */}
        <div className={`mt-4 ${isCollapsed ? "px-0" : "px-2"}`}>
          {!isCollapsed ? (
              <div className="p-5 rounded-[2rem] bg-gradient-to-br from-erani-blue/10 via-foreground/5 to-erani-purple/10 border border-glass-border relative overflow-hidden group/credits shadow-xl">
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
                    <motion.div 
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-1/2 h-full bg-gradient-to-r from-transparent via-erani-blue to-transparent skew-x-12"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-[8px] uppercase font-black tracking-[0.2em] text-nav-text">Balance Forense</p>
                      <span className="text-xl font-black text-foreground flex items-center gap-2">
                        100 <span className="text-xs text-erani-blue italic">ERIS</span>
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-erani-blue/10 flex items-center justify-center border border-erani-blue/20">
                      <span className="text-xl animate-pulse">💎</span>
                    </div>
                  </div>

                  <div className="relative h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden border border-glass-border">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-erani-blue to-erani-purple"
                    />
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[7px] uppercase font-black text-nav-text tracking-widest">Network Load</span>
                    <span className="text-[7px] font-bold text-erani-purple uppercase cursor-pointer hover:underline">Upgrade</span>
                  </div>
              </div>
          ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-glass-border cursor-pointer hover:bg-foreground/10 transition-colors group/eris relative">
                  <span className="text-xl group-hover:scale-110 transition-transform">💎</span>
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 border border-white/10 rounded-xl text-[8px] uppercase font-black tracking-widest text-white opacity-0 group-hover/eris:opacity-100 pointer-events-none transition-all -translate-x-2 group-hover/eris:translate-x-0 whitespace-nowrap z-50">
                    100 ERIS
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Footer Container */}
      <div className="flex flex-col mt-auto p-4 border-t border-white/5 gap-2">
        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center transition-all ${
              isCollapsed ? "justify-center h-12 rounded-2xl" : "p-2 rounded-[2rem] gap-3"
            } ${showProfileMenu ? "bg-foreground/10 border border-glass-border shadow-lg" : "hover:bg-foreground/5"}`}
          >
            <div className="relative shrink-0">
              <div className={`rounded-full border-2 border-erani-blue/30 p-0.5 overflow-hidden ${isCollapsed ? "w-10 h-10" : "w-11 h-11"}`}>
                <Image src="/isologo.png" alt="Avatar" width={40} height={40} className="rounded-full object-cover logo-adaptive" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            
            {!isCollapsed && (
              <>
                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate w-full text-left">Emiliano</span>
                  <span className="text-[8px] font-medium text-nav-text lowercase truncate w-full text-left">Admin Panel</span>
                </div>
                <ChevronRight className={`w-4 h-4 ml-auto text-nav-text transition-transform shrink-0 ${showProfileMenu ? "rotate-90" : ""}`} />
              </>
            )}
          </button>

          {/* Profile Popover */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute bottom-full mb-4 bg-background border border-glass-border p-2 shadow-2xl z-50 rounded-[2rem] ${
                  isCollapsed ? "left-0 w-48" : "left-0 w-full"
                }`}
              >
                <div className="flex flex-col gap-1">
                  {[
                    { icon: Activity, label: "MIS ERIS", color: "text-erani-blue" },
                    { icon: UserIcon, label: "MI PERFIL" },
                    { icon: LogsIcon, label: "LOGS" },
                    { icon: Headphones, label: "SOPORTE" },
                  ].map((sub, i) => (
                    <button key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition-colors group/sub">
                      <sub.icon className={`w-3.5 h-3.5 ${sub.color || "text-foreground"}`} />
                      <span className="text-[8px] uppercase font-black tracking-widest">{sub.label}</span>
                    </button>
                  ))}
                  <div className="h-px bg-white/5 my-1 mx-2" />
                  <button className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-erani-coral/10 text-erani-coral transition-colors w-full">
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase font-black tracking-widest">LOGOUT</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-center pt-2">
          <button 
             onClick={toggleTheme}
             className={`w-full flex items-center justify-center h-10 rounded-xl transition-all ${
               isCollapsed ? "w-10" : "gap-3 px-4 hover:bg-foreground/5"
             } text-nav-text hover:text-erani-blue`}
             title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!isCollapsed && <span className="text-[8px] uppercase font-black tracking-widest">Cambiar Tema</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

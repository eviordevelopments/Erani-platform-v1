"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard Forense", href: "/dashboard" },
  { icon: FileSearch, label: "Auditorías y Proyectos", href: "/audit" },
  { icon: ShieldCheck, label: "Peritaje Forense", href: "/forensic" },
  { icon: LogsIcon, label: "Colecciones & Data Rooms", href: "/collections" },
  { icon: CalendarCheck2, label: "Workspaces", href: "/sessions", isNew: true },
  { icon: ShoppingBag, label: "Automatizaciones", href: "/marketplace" },
  { icon: PlusCircle, label: "ERANI Services+", href: "/services" },
  { icon: Bot, label: "Agente Forense", href: "/agent" },
  { icon: CreditCard, label: "Suscripción", href: "/subscription" },
  { icon: Settings, label: "Configuración", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed: isCollapsed, setIsSidebarCollapsed: setIsCollapsed, storageStats } = useDashboard();
  const { theme, toggleTheme } = useTheme();
  const { profile, org, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarWidth = isCollapsed ? 88 : 280;

  const confirmLogout = async () => {
    await signOut();
    router.push('/');
  };

  const openSupportEmail = () => {
    const subject = encodeURIComponent("Soporte ERANI — Solicitud de Ayuda");
    const body = encodeURIComponent("Hola equipo ERANI,\n\nNecesito ayuda con:\n\n[Describe tu problema aquí]\n\nGracias.");
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=emilcastle2608@gmail.com&su=${subject}&body=${body}`, "_blank");
    setShowProfileMenu(false);
  };

  const openSupportWhatsApp = () => {
    const msg = encodeURIComponent("Hola! Necesito soporte con la plataforma ERANI.");
    window.open(`https://wa.me/524623071972?text=${msg}`, "_blank");
    setShowProfileMenu(false);
  };

  // Avatar: use org logo_url, fallback to ERANI isologo (never user_metadata)
  const logoSrc = org?.logo_url || "/isologo.png";

  // Display name: prefer display_name, fallback to full_name
  const fullName = profile?.display_name || profile?.full_name || "Usuario";

  // ERIS balance from profile (not user_metadata)
  const erisBalance = profile?.eris_balance ?? 20;
  const erisPercentage = Math.min(100, Math.max(0, (erisBalance / 100) * 100));

  // Subtitle: "[role] | [org_name]" — safe when organization_id is null
  const userRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Cliente";
  const orgName = org?.name || "";
  const userSubtitle = orgName ? `${userRole} | ${orgName}` : userRole;

  return (
    <>
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
                id={`tour-nav-${item.href.replace('/', '')}`}
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
                  <div className="flex items-center justify-between w-full">
                    <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] uppercase font-black tracking-[0.1em] whitespace-nowrap text-left"
                    >
                        {item.label}
                    </motion.span>
                    <div className="flex items-center gap-2">
                      {item.isNew && (
                        <span className="bg-erani-purple/20 border border-erani-purple/30 text-erani-purple px-1.5 py-0.5 rounded text-[7px] font-black tracking-widest animate-pulse uppercase">
                          Nueva
                        </span>
                      )}
                      {item.href === "/subscription" && org && !org.paid_subscription && (
                        <span className="text-[7px] font-black tracking-widest text-erani-purple border border-erani-purple/30 bg-erani-purple/10 px-1.5 py-0.5 rounded-full uppercase">
                          Upgrade
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tooltip for Collapsed State */}
                {isCollapsed && (
                   <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 border border-white/10 rounded-xl text-[8px] uppercase font-black tracking-widest text-white opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all -translate-x-2 group-hover/item:translate-x-0 whitespace-nowrap z-50 shadow-2xl">
                      {item.label} {item.href === "/subscription" && org && !org.paid_subscription && "⭐"}
                   </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ERIS Credits Card */}
        <div className={`-mt-4 relative z-10 ${isCollapsed ? "px-0" : "px-2"}`}>
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
                      <span className={`text-xl font-black flex items-center gap-2 ${erisBalance === 0 ? "text-erani-coral animate-pulse" : "text-foreground"}`}>
                        {erisBalance} <span className={`text-xs italic ${erisBalance === 0 ? "text-erani-coral" : "text-erani-blue"}`}>{erisBalance === 0 ? "CONGELADO" : "ERIS"}</span>
                      </span>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${erisBalance === 0 ? "bg-erani-coral/10 border-erani-coral/20 text-erani-coral" : "bg-erani-blue/10 border-erani-blue/20"}`}>
                      <span className="text-xl animate-pulse">💎</span>
                    </div>
                  </div>

                  <div className="relative h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden border border-glass-border">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${erisPercentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`absolute top-0 left-0 h-full ${erisBalance === 0 ? "bg-erani-coral" : "bg-gradient-to-r from-erani-blue to-erani-purple"}`}
                    />
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[7px] uppercase font-black text-nav-text tracking-widest">
                      {erisBalance === 0 ? "Consumo Agotado" : "Network Load"}
                    </span>
                    {org && !org.paid_subscription ? (
                      <Link href="/subscription/activate" className="text-[7px] font-black text-erani-purple uppercase hover:underline">
                        Activar Beta
                      </Link>
                    ) : (
                      <Link href="/subscription" className="text-[7px] font-black text-erani-purple uppercase hover:underline">
                        Upgrade
                      </Link>
                    )}
                  </div>
              </div>
          ) : (
              <div className="flex flex-col items-center">
                <Link href={org && !org.paid_subscription ? "/subscription/activate" : "/subscription"}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border cursor-pointer transition-colors group/eris relative ${
                    erisBalance === 0 
                      ? "bg-erani-coral/10 border-erani-coral/30 hover:bg-erani-coral/20" 
                      : "bg-foreground/5 border-glass-border hover:bg-foreground/10"
                  }`}>
                    <span className="text-xl group-hover:scale-110 transition-transform">💎</span>
                    <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 border border-white/10 rounded-xl text-[8px] uppercase font-black tracking-widest text-white opacity-0 group-hover/eris:opacity-100 pointer-events-none transition-all -translate-x-2 group-hover/eris:translate-x-0 whitespace-nowrap z-50">
                      {erisBalance} ERIS {erisBalance === 0 && "(CONGELADO)"}
                    </div>
                  </div>
                </Link>
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
              <div className={`rounded-full border-2 border-erani-blue/30 p-0.5 overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5 ${isCollapsed ? "w-10 h-10" : "w-11 h-11"}`}>
                <img src={logoSrc} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
              
              {/* Storage Warning Icon */}
              {storageStats?.isCritical && (
                <div 
                  className="absolute -top-1 -left-1 bg-erani-coral text-white p-[3px] rounded-full shadow-[0_0_10px_rgba(255,92,92,0.8)] border-2 border-background flex items-center justify-center group/storage-warn" 
                  title="Almacenamiento Crítico"
                >
                  <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                  <div className="absolute left-full ml-2 px-3 py-2 bg-erani-coral text-white border border-white/20 rounded-xl text-[8px] uppercase font-black tracking-widest opacity-0 group-hover/storage-warn:opacity-100 pointer-events-none transition-all -translate-x-2 group-hover/storage-warn:translate-x-0 whitespace-nowrap z-50 shadow-2xl">
                    ⚠️ ALMACENAMIENTO CASI LLENO. Elimina evidencia o actualiza tu plan para crear más proyectos.
                  </div>
                </div>
              )}

              {org?.paid_subscription && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-erani-blue to-erani-purple p-[2px] rounded-full shadow-[0_0_10px_rgba(158,128,255,0.8)] border-2 border-background flex items-center justify-center" title="BETA Premium Member">
                  <span className="text-[10px] leading-none drop-shadow-md">💎</span>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <>
                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate w-full text-left">{fullName}</span>
                  <span className="text-[8px] font-medium text-nav-text truncate w-full text-left" title={userSubtitle}>{userSubtitle}</span>
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
                    ...(org && !org.paid_subscription ? [{ icon: ShieldCheck, label: "ACTIVAR BETA", color: "text-erani-purple animate-pulse", href: "/subscription/activate" }] : []),
                    { icon: Activity, label: "MIS ERIS", color: "text-erani-blue", href: "/subscription" },
                    { icon: UserIcon, label: "MI PERFIL", href: "/settings" },
                    { icon: LogsIcon, label: "LOGS", href: "/reports" },
                  ].map((sub, i) => (
                    <Link href={sub.href} key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition-colors group/sub">
                      <sub.icon className={`w-3.5 h-3.5 ${sub.color || "text-foreground"}`} />
                      <span className="text-[8px] uppercase font-black tracking-widest">{sub.label}</span>
                    </Link>
                  ))}
                  {/* Support actions */}
                  <button onClick={openSupportEmail} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition-colors w-full text-left">
                    <Headphones className="w-3.5 h-3.5 text-erani-purple" />
                    <span className="text-[8px] uppercase font-black tracking-widest">Soporte Email</span>
                  </button>
                  <button onClick={openSupportWhatsApp} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition-colors w-full text-left">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[8px] uppercase font-black tracking-widest">WhatsApp</span>
                  </button>
                  <div className="h-px bg-white/5 my-1 mx-2" />
                  <button onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutModal(true);
                    }} 
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-erani-coral/10 text-erani-coral transition-colors w-full"
                  >
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
            {mounted ? (
              theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4" /> // Placeholder to avoid mismatch
            )}
            {!isCollapsed && <span className="text-[8px] uppercase font-black tracking-widest">Cambiar Tema</span>}
          </button>
        </div>
      </div>
    </motion.aside>

    {/* Logout Confirmation Modal - Rendered outside aside to prevent clipping */}
    <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm glassmorphism p-8 flex flex-col items-center gap-6 text-center border border-erani-coral/20 rounded-[2rem] shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-erani-coral/10 flex items-center justify-center text-erani-coral border border-erani-coral/20">
                <LogOut className="w-8 h-8" />
              </div>
              
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black uppercase text-foreground tracking-widest">
                  ¿Cerrar Sesión?
                </h3>
                <p className="text-sm font-medium text-nav-text">
                  Estás a punto de salir del Firewall de Rentabilidad de ERANI.
                </p>
              </div>

              <div className="flex w-full gap-4 mt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-glass-border hover:bg-foreground/5 text-xs font-black uppercase tracking-widest text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 px-4 rounded-xl bg-erani-coral/10 border border-erani-coral/20 hover:bg-erani-coral/20 text-xs font-black uppercase tracking-widest text-erani-coral transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

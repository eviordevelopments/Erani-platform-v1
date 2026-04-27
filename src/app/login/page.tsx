"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Key, ArrowRight, Loader2, AlertCircle, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/context/ThemeContext";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-8 right-8 z-50">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl glassmorphism border border-white/10 text-gray-400 hover:text-erani-blue transition-all active:scale-95"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
      </div>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-erani-blue/5 blur-[150px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glassmorphism p-10 flex flex-col gap-8 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/">
                <Image src="/eanilogo.png" alt="ERANI" width={140} height={50} className="mb-4 logo-adaptive" />
            </Link>
          <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">
             Ingreso al Portal
          </h1>
          <p className="text-nav-text text-sm font-medium">
             Bienvenido de vuelta al Firewall de Rentabilidad.
          </p>
        </div>

        {error && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-3 p-4 rounded-xl bg-erani-coral/10 border border-erani-coral/20 text-erani-coral text-xs font-bold"
            >
               <AlertCircle className="w-4 h-4 shrink-0" />
               {error}
            </motion.div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-1">Email Corporativo</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
                        <input 
                            required
                            type="email" 
                            placeholder="email@agencia.com"
                            className="input-premium !pl-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-1">Contraseña</label>
                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
                        <input 
                            required
                            type="password" 
                            placeholder="••••••••"
                            className="input-premium !pl-12"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit"
                disabled={isLoading}
                className="button-premium w-full py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validando Credenciales...
                    </>
                ) : (
                    <>
                        Iniciar Sesión Forense <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>
        </form>

        <div className="flex flex-col items-center gap-6 pt-4 border-t border-glass-border">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                ¿Aún no tienes acceso?
            </p>
            <Link 
                href="/register" 
                className="text-xs font-black text-erani-blue uppercase tracking-widest hover:text-white transition-colors"
            >
                Solicitar Auditoría Forense
            </Link>
        </div>
      </motion.div>

      {/* Floating System Status */}
      <div className="absolute bottom-10 right-10 flex flex-col gap-2 opacity-5 font-mono text-[8px] text-erani-blue">
         <span>[AUTH] SYSTEM STANDBY...</span>
         <span>[PORT] 3000 ACTIVE.</span>
         <span>[TRL4] INFRASTRUCTURE SECURE.</span>
      </div>
    </main>
  );
}

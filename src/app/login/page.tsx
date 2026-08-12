"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Key, ArrowRight, Loader2, AlertCircle, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { loginAction } from "./actions";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Direct client-side login bypassing the Server Action that was causing context corruption
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.session || !data.user) {
        console.error("Supabase Auth Error details:", authError);
        setError(authError?.message || "Credenciales inválidas. Verifica tu email y contraseña.");
        return;
      }

      let redirectedFrom = "/dashboard";
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("redirectedFrom");
        if (ref && ref.startsWith("/")) {
          redirectedFrom = ref;
        }
      }

      // Check onboarding status client-side
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push(redirectedFrom);
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError("Error de conexión. Verifica tu internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Purple background blobs */}
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-erani-purple/15 blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] rounded-full bg-erani-blue/8 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-erani-purple/10 blur-[120px] pointer-events-none" />

      {/* Top color bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-erani-blue via-erani-purple to-erani-coral" />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl glassmorphism border border-white/10 text-gray-400 hover:text-erani-blue transition-all active:scale-95"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl glassmorphism p-12 flex flex-col gap-8 shadow-2xl shadow-erani-purple/10 relative rounded-[2.5rem] border border-glass-border"
      >
        {/* Card inner glows */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-erani-blue/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-erani-purple/12 blur-[60px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <Link href="/">
            <Image src="/eanilogo.png" alt="ERANI" width={160} height={58} className="logo-adaptive" />
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">
              Ingreso al Portal
            </h1>
            <p className="text-sm font-medium text-nav-text">
              Bienvenido de vuelta al Firewall de Rentabilidad.
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex items-center gap-3 p-4 rounded-2xl bg-erani-coral/10 border border-erani-coral/20 text-erani-coral text-sm font-bold"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-1">
                Email Corporativo
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
                <input
                  required
                  type="email"
                  placeholder="email@agencia.com"
                  className="input-premium !pl-14 !py-5 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-erani-blue transition-colors" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-premium !pl-14 !py-5 !pr-14 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-erani-blue transition-colors focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="button-premium w-full py-5 rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-erani-blue/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Validando Credenciales...
              </>
            ) : (
              <>
                Iniciar Sesión <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="relative z-10 flex flex-col items-center gap-4 pt-4 border-t border-glass-border">
          <Link
            href="/register"
            className="text-sm font-black text-erani-purple uppercase tracking-widest hover:text-erani-blue transition-colors"
          >
            Soy Miembro de Organización →
          </Link>
          <Link
            href="/onboarding"
            className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-foreground transition-colors"
          >
            Crear organización ahora
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-8 bg-black/70 backdrop-blur-md border-t border-white/5">
        <span className="text-[8px] uppercase font-black tracking-widest text-white/30">v0.1.0 ERANI BETA</span>
        <div className="flex items-center gap-6">
          <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-colors">Aviso de Privacidad</a>
          <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-colors">Términos y Condiciones</a>
          <a href="mailto:soporte@erani.mx" className="text-[8px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-colors">Soporte</a>
          <span className="text-white/10">|</span>
          <a href="https://erani.mx" target="_blank" rel="noopener noreferrer" className="text-[8px] uppercase font-black tracking-widest text-erani-blue/50 hover:text-erani-blue transition-colors">erani.mx</a>
        </div>
      </footer>
    </main>
  );
}

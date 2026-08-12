"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleTestLogin = async () => {
    addLog(`Intentando signInWithPassword para: ${email}...`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addLog(`Error de Auth: ${error.message}`);
        console.error("Auth Error:", error);
      } else {
        addLog(`¡Éxito! Logueado como: ${data.user.email}`);
        console.log("Auth Success:", data);
      }
    } catch (err: any) {
      addLog(`Excepción Capturada: ${err.message}`);
      console.error("Auth Exception:", err);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto flex flex-col gap-4 mt-20 bg-black/40 border border-white/10 rounded-2xl">
      <h1 className="text-2xl font-bold text-white mb-4">Aislamiento de Fallo (Test de Auth)</h1>
      
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-3 rounded-lg bg-black/50 border border-white/20 text-white"
      />
      
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-4 py-3 rounded-lg bg-black/50 border border-white/20 text-white"
      />

      <button
        onClick={handleTestLogin}
        className="bg-erani-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
      >
        Ejecutar Prueba Directa
      </button>

      <div className="mt-8 p-4 bg-black/80 rounded-lg border border-white/10 h-64 overflow-y-auto font-mono text-xs text-green-400 flex flex-col gap-2">
        <p className="text-white/50">-- Consola de Prueba --</p>
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

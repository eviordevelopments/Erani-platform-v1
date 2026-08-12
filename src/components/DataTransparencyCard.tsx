"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";

const DATA_TYPES = [
  { label: "Correo electrónico", description: "Para autenticación y comunicaciones" },
  { label: "Nombre completo", description: "Para personalizar tu experiencia" },
  { label: "Nombre de organización", description: "Para vincular tu cuenta a tu equipo" },
  { label: "Sector y tamaño del equipo", description: "Para adaptar las herramientas forenses" },
  { label: "Datos de auditoría forense", description: "Archivos y metadatos que tú subes" },
  { label: "Registros de actividad", description: "Para seguridad y auditoría interna" },
];

export default function DataTransparencyCard() {
  // Collapsed by default — user expands when interested
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glassmorphism overflow-hidden rounded-2xl border border-glass-border">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-foreground/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-erani-blue flex-shrink-0" />
          <span className="text-[11px] uppercase tracking-widest font-black text-foreground">
            ¿Qué datos recopilamos?
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-nav-text flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-nav-text flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-glass-border">
          <ul className="flex flex-col gap-4 mt-5">
            {DATA_TYPES.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-erani-blue mt-1.5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] uppercase tracking-widest font-black text-foreground">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-nav-text leading-relaxed">
                    {item.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[9px] text-foreground/40 uppercase tracking-widest">
            Tus datos están protegidos con cifrado y Row Level Security.
          </p>
        </div>
      )}
    </div>
  );
}

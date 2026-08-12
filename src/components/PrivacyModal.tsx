"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} aria-hidden="true" />

      {/* Modal — much bigger */}
      <div className="relative w-full max-w-4xl max-h-[90vh] glassmorphism flex flex-col overflow-hidden shadow-[0_0_100px_rgba(158,128,255,0.15)] rounded-[2.5rem] border border-glass-border">
        {/* Glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-erani-purple/12 blur-[100px] pointer-events-none -z-10" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-erani-blue/10 blur-[100px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-glass-border flex-shrink-0">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-erani-blue">ERANI Platform</p>
            <h2 id="privacy-modal-title" className="text-2xl font-black uppercase tracking-widest text-foreground">
              Política de Privacidad
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar política de privacidad"
            className="p-3 rounded-2xl text-nav-text hover:text-foreground hover:bg-foreground/5 transition-colors border border-glass-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-10 py-8 flex flex-col gap-8 text-base text-nav-text leading-relaxed">
          {[
            {
              title: "1. Información que recopilamos",
              body: "ERANI recopila información que usted nos proporciona directamente al crear una cuenta, configurar su organización o utilizar nuestros servicios. Esto incluye nombre completo, dirección de correo electrónico, nombre de la organización, sector y tamaño del equipo.",
            },
            {
              title: "2. Uso de la información",
              body: "Utilizamos la información recopilada para proveer, mantener y mejorar nuestros servicios de auditoría forense industrial. Sus datos nunca serán vendidos a terceros ni utilizados con fines publicitarios sin su consentimiento explícito.",
            },
            {
              title: "3. Almacenamiento y seguridad",
              body: "Todos los datos se almacenan en servidores seguros con cifrado en reposo y en tránsito. Implementamos Row Level Security (RLS) para garantizar que cada organización acceda únicamente a sus propios datos.",
            },
            {
              title: "4. Compartición de datos",
              body: "No compartimos su información personal con terceros, excepto cuando sea requerido por ley o con proveedores de servicios que nos ayudan a operar la plataforma, bajo estrictos acuerdos de confidencialidad.",
            },
            {
              title: "5. Sus derechos",
              body: "Usted tiene derecho a acceder, corregir o eliminar su información personal en cualquier momento. Para ejercer estos derechos, contáctenos a través de los canales oficiales de soporte de ERANI.",
            },
            {
              title: "6. Cambios a esta política",
              body: "Nos reservamos el derecho de actualizar esta política de privacidad. Le notificaremos sobre cambios significativos mediante correo electrónico o un aviso prominente en la plataforma.",
            },
          ].map(({ title, body }) => (
            <section key={title} className="flex flex-col gap-3">
              <h3 className="text-[11px] uppercase tracking-widest font-black text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed">{body}</p>
            </section>
          ))}

          <p className="text-[10px] text-foreground/30 uppercase tracking-widest">
            Última actualización: Enero 2025
          </p>
        </div>

        {/* Footer */}
        <div className="px-10 py-7 border-t border-glass-border flex-shrink-0">
          <button
            onClick={onClose}
            className="button-premium w-full py-5 rounded-2xl text-sm uppercase tracking-widest font-black"
          >
            Entendido
          </button>
          <a
            href="/TC_ERANI.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[10px] uppercase font-black tracking-widest text-nav-text hover:text-erani-blue transition-colors mt-2"
          >
            Descargar PDF
          </a>
        </div>
      </div>
    </div>
  );
}

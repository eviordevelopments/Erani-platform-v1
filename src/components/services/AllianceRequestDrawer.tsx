"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Briefcase, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AllianceRequestDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    companyName: "",
    serviceName: "",
    valueProposition: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/services/alliance-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData({ companyName: "", serviceName: "", valueProposition: "", contactName: "", contactEmail: "", contactPhone: "" });
        }, 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-glass-border shadow-2xl z-50 overflow-y-auto custom-scrollbar flex flex-col"
          >
            <div className="p-6 border-b border-glass-border flex justify-between items-center bg-foreground/5 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-erani-purple/10 flex items-center justify-center text-erani-purple border border-erani-purple/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black uppercase tracking-tight text-lg">Postular Alianza</h2>
                  <p className="text-[9px] uppercase tracking-widest text-nav-text">Ecosistema ERANI Services+</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-foreground/10 text-nav-text hover:text-foreground transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 flex-1">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-2">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Postulación Enviada</h3>
                  <p className="text-sm text-nav-text">
                    Hemos recibido tu propuesta. Se ha enviado un correo electrónico con el enlace de tu nueva sesión para dar seguimiento con un Project Manager.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="bg-erani-purple/5 border border-erani-purple/20 p-4 rounded-2xl mb-2">
                    <p className="text-xs text-erani-purple leading-relaxed">
                      Al integrar tu servicio o herramienta corporativa a nuestro ecosistema, tendrás acceso a nuestra red de clientes AAA.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Organización / Empresa</label>
                    <input required type="text" placeholder="Ej: Microsoft, Nexus AI..." value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-purple transition-colors text-foreground placeholder:text-muted-foreground" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Nombre del Servicio o Software</label>
                    <input required type="text" placeholder="Ej: CRM Enterprise..." value={formData.serviceName} onChange={e => setFormData({...formData, serviceName: e.target.value})} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-purple transition-colors text-foreground placeholder:text-muted-foreground" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Propuesta de Valor</label>
                    <textarea required rows={4} placeholder="¿Qué beneficios concretos ofreces al ecosistema de clientes ERANI?" value={formData.valueProposition} onChange={e => setFormData({...formData, valueProposition: e.target.value})} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-purple transition-colors text-foreground placeholder:text-muted-foreground resize-none" />
                  </div>

                  <div className="h-px bg-glass-border my-2" />

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Nombre de Contacto</label>
                    <input required type="text" placeholder="Tu nombre completo" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-purple transition-colors text-foreground placeholder:text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Email</label>
                       <input required type="email" placeholder="correo@empresa.com" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-purple transition-colors text-foreground placeholder:text-muted-foreground" />
                     </div>
                     <div className="flex flex-col gap-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-nav-text ml-1">Teléfono</label>
                       <input required type="tel" placeholder="+52..." value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-erani-purple transition-colors text-foreground placeholder:text-muted-foreground" />
                     </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full mt-4 py-4 rounded-xl text-xs uppercase font-black tracking-widest flex items-center justify-center gap-2 bg-gradient-to-r from-erani-blue to-erani-purple text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Enviar Propuesta <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

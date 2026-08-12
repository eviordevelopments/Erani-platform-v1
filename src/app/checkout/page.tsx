"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Building2, UserCircle, Phone, Mail, FileText, 
  CheckCircle2, ArrowRight, ChevronLeft, Building, 
  Info, AlertTriangle, Eraser, PenTool, ExternalLink, ShieldCheck,
  MapPin, UploadCloud, Check, Zap, Ticket
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const defaultStripeUrl = "https://buy.stripe.com/8x2bJ25CwaW056TbOg8N202";
  const referralStripeUrl = "https://buy.stripe.com/8x2bJ25CwaW056TbOg8N202"; // Placeholder for actual referral link if needed

  const [step, setStep] = useState(1);
  const [stripeUrl, setStripeUrl] = useState(defaultStripeUrl);
  const [referralCode, setReferralCode] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [slaAccepted, setSlaAccepted] = useState(false);
  const [hasOpenedSLA, setHasOpenedSLA] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    fullName: "",
    role: "",
    phone: "",
    email: "",
    secondaryEmail: "",
    organizationName: "",
    companyStreet: "",
    companyExt: "",
    companyInt: "",
    companyNeighborhood: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    companyCountry: "",
    termsAccepted: false,
    privacyAccepted: false,

    // Step 2
    sameAsCompany: false,
    fiscalStreet: "",
    fiscalExt: "",
    fiscalInt: "",
    fiscalNeighborhood: "",
    fiscalCity: "",
    fiscalState: "",
    constanciaUrl: "",
    constanciaFile: null as File | null,

    // Step 2 Billing
    needsInvoice: true,
    fiscalMode: "address" as "address" | "constancia",
    rfc: "",
    razonSocial: "",
    codigoPostal: "",
    regimenFiscal: "",
    usoCfdi: "",
    invoiceEmail: "",
    sameEmailForInvoice: false,
    fiscalCountry: "",
  });

  const [isDragging, setIsDragging] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => {
        const newData = { ...prev, [name]: checked };
        // Auto-fill fiscal address if "sameAsCompany" is checked
        if (name === "sameAsCompany" && checked) {
           newData.fiscalStreet = prev.companyStreet;
           newData.fiscalExt = prev.companyExt;
           newData.fiscalInt = prev.companyInt;
           newData.fiscalNeighborhood = prev.companyNeighborhood;
           newData.fiscalCity = prev.companyCity;
           newData.fiscalState = prev.companyState;
           newData.codigoPostal = prev.companyZip;
           newData.fiscalCountry = prev.companyCountry;
        }
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({ ...prev, constanciaFile: file, constanciaUrl: file.name }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, constanciaFile: file, constanciaUrl: file.name }));
    }
  };

  // Step Validations
  const isStep1Valid = () => {
    return (
      formData.fullName.trim() !== "" &&
      formData.role.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.organizationName.trim() !== "" &&
      formData.companyStreet.trim() !== "" &&
      formData.companyZip.trim() !== "" &&
      formData.termsAccepted &&
      formData.privacyAccepted
    );
  };

  const isStep2Valid = () => {
    if (!formData.needsInvoice) return true; // If no invoice, skip strict checks
    const baseValid = formData.rfc.trim() !== "" &&
      formData.razonSocial.trim() !== "" &&
      formData.codigoPostal.trim() !== "" &&
      formData.regimenFiscal.trim() !== "" &&
      formData.usoCfdi.trim() !== "" &&
      (formData.sameEmailForInvoice || formData.invoiceEmail.trim() !== "");

    if (formData.fiscalMode === "address") {
      return baseValid && formData.fiscalStreet.trim() !== "";
    } else {
      return baseValid && formData.constanciaFile !== null;
    }
  };

  // Canvas Drawing State (Step 3)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Step 4 Validation
  const [readDisclaimer, setReadDisclaimer] = useState(false);

  const handleApplyReferral = () => {
    if (referralCode.trim().toUpperCase() === "NGOMEZ4.0") {
      setReferralApplied(true);
      // Change to the discounted/referral stripe link here if available
      setStripeUrl("https://buy.stripe.com/8x2bJ25CwaW056TbOg8N202?prefilled_promo_code=NGOMEZ4.0"); 
    } else {
      alert("Código inválido");
    }
  };

  const handleStripePayment = () => {
    window.open(stripeUrl, "_blank");
    router.push("/checkout/success");
  };

  const planFeatures = [
    "Motor de IA e inferencia nivel 2", "Sesiones de estrategia semanales", 
    "Control de Scope Creep", "Dark Data Index", "Acceso completo a ERANI PLATFORM", 
    "Auditorías Forenses", "Creación de Proyectos", "Almacenamiento en ERANI CLOUD 10 GB", 
    "100 ERIS de consumo", "Agente AI Forense"
  ];

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col custom-scrollbar">
      {/* TOP NAVIGATION BAR */}
      <div className="w-full flex flex-col px-8 py-5 border-b border-glass-border bg-background/50 backdrop-blur-md z-50 sticky top-0 gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/subscription" className="flex items-center gap-2 text-nav-text hover:text-foreground transition-colors text-xs font-black uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Cancelar
          </Link>
          <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-nav-text bg-foreground/5 px-3 py-1 rounded-full border border-glass-border">
             Paso {step} de 5
          </div>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-nav-text px-1">
            <span className={`transition-colors duration-300 ${step >= 1 ? "text-erani-blue" : ""}`}>1. General</span>
            <span className={`transition-colors duration-300 ${step >= 2 ? "text-erani-blue" : ""}`}>2. Fiscal</span>
            <span className={`transition-colors duration-300 ${step >= 3 ? "text-erani-purple" : ""}`}>3. SLA</span>
            <span className={`transition-colors duration-300 ${step >= 4 ? "text-erani-purple" : ""}`}>4. Firma</span>
            <span className={`transition-colors duration-300 ${step >= 5 ? "text-emerald-500" : ""}`}>5. Pago</span>
          </div>
          <div className="w-full h-3 bg-foreground/10 rounded-full overflow-hidden relative shadow-inner">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-erani-blue via-erani-purple to-emerald-500"
              initial={{ width: `${((step - 1) / 4) * 100}%` }}
              animate={{ width: `${((step === 1 ? 0.2 : step === 2 ? 0.4 : step === 3 ? 0.6 : step === 4 ? 0.8 : 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Light flow effect inside the progress bar */}
              <motion.div 
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* LEFT COLUMN: Main Form Area */}
        <div className="flex-1 flex flex-col relative h-full">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-erani-purple/10 blur-[150px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-erani-blue/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          {/* Scrollable Form Content */}
          <div className="flex-1 px-6 md:px-12 lg:px-20 pb-20 z-10 w-full">
            <div className="w-full pt-8">
            
            <AnimatePresence mode="wait">
              
              {/* STEP 1: General Info */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-8"
                >
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-foreground">Información del Responsable</h2>
                    <p className="text-sm text-nav-text font-medium">Por favor completa los datos de la organización y el responsable de cuenta.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1 flex items-center gap-2"><UserCircle className="w-3 h-3"/> Nombre Completo</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" placeholder="Ej. Juan Pérez" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1 flex items-center gap-2"><Building2 className="w-3 h-3"/> Rol en la Organización</label>
                      <input type="text" name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" placeholder="Ej. Director de Finanzas" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1 flex items-center gap-2"><Phone className="w-3 h-3"/> Teléfono (con código de país)</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" placeholder="+52 55 1234 5678" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1 flex items-center gap-2"><Mail className="w-3 h-3"/> Correo Electrónico</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" placeholder="juan@empresa.com" />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-nav-text ml-1 flex items-center gap-2"><Building className="w-3 h-3"/> Nombre de la Empresa / Organización</label>
                      <input type="text" name="organizationName" value={formData.organizationName} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" placeholder="Empresa S.A. de C.V." />
                    </div>
                    <div className="flex flex-col gap-4 md:col-span-2 mt-4">
                      <h3 className="text-lg font-black text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-erani-blue"/> Dirección de la Empresa</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2 col-span-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Calle</label>
                          <input type="text" name="companyStreet" value={formData.companyStreet} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Num Ext</label>
                          <input type="text" name="companyExt" value={formData.companyExt} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Num Int</label>
                          <input type="text" name="companyInt" value={formData.companyInt} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                        <div className="flex flex-col gap-2 col-span-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Colonia</label>
                          <input type="text" name="companyNeighborhood" value={formData.companyNeighborhood} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                        <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Ciudad/Municipio</label>
                          <input type="text" name="companyCity" value={formData.companyCity} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                        <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Estado</label>
                          <input type="text" name="companyState" value={formData.companyState} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                        <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Código Postal</label>
                          <input type="text" name="companyZip" value={formData.companyZip} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                        <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">País</label>
                          <input type="text" name="companyCountry" value={formData.companyCountry} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-4 bg-foreground/5 rounded-xl border border-glass-border mt-2">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" id="termsAccepted" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} className="w-4 h-4 rounded bg-foreground/5 border-glass-border text-erani-purple focus:ring-erani-purple mt-0.5" />
                      <label htmlFor="termsAccepted" className="text-sm font-medium text-nav-text leading-relaxed cursor-pointer">
                        Acepto los{" "}
                        <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-erani-purple hover:underline font-bold">
                          Términos y Condiciones
                        </a>{" "}
                        del contrato de servicios ERANI Beta.
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" id="privacyAccepted" name="privacyAccepted" checked={formData.privacyAccepted} onChange={handleInputChange} className="w-4 h-4 rounded bg-foreground/5 border-glass-border text-erani-purple focus:ring-erani-purple mt-0.5" />
                      <label htmlFor="privacyAccepted" className="text-sm font-medium text-nav-text leading-relaxed cursor-pointer">
                        He leído y acepto el <a href="/TC_ERANI.pdf" target="_blank" rel="noopener noreferrer" className="text-erani-purple hover:underline font-bold">Aviso de Privacidad</a>.
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={() => setStep(2)}
                      disabled={!isStep1Valid()}
                      className="button-premium px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar a Fiscal <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Fiscal Info */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-8"
                >
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-foreground">Datos Fiscales y Facturación</h2>
                    <p className="text-sm text-nav-text font-medium">Requeridos para emitir el CFDI correspondiente al pago de tu suscripción.</p>
                  </div>

                  {/* Invoice Toggle */}
                  <div className="flex flex-col gap-3 p-5 bg-foreground/5 border border-glass-border rounded-xl shadow-inner">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <h3 className="text-sm font-black text-foreground">¿Requieres Factura?</h3>
                        <p className="text-[10px] text-nav-text">Selecciona si deseas recibir un CFDI por este pago.</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="needsInvoice" checked={formData.needsInvoice === true} onChange={() => setFormData({...formData, needsInvoice: true})} className="w-4 h-4 text-erani-blue bg-foreground/5 border-glass-border focus:ring-erani-blue" />
                          <span className="text-sm font-bold text-foreground">Sí, requiero factura</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="needsInvoice" checked={formData.needsInvoice === false} onChange={() => setFormData({...formData, needsInvoice: false})} className="w-4 h-4 text-erani-blue bg-foreground/5 border-glass-border focus:ring-erani-blue" />
                          <span className="text-sm font-bold text-foreground">No por ahora</span>
                        </label>
                      </div>
                    </div>
                    {!formData.needsInvoice && (
                      <div className="p-3 bg-erani-blue/10 border border-erani-blue/20 rounded-lg flex items-start gap-2 mt-2">
                        <Info className="w-4 h-4 text-erani-blue shrink-0 mt-0.5" />
                        <p className="text-[10px] text-erani-blue leading-relaxed font-bold">Aviso: Si no solicitas factura en este momento, no será posible generarla posteriormente para este pago. Tu recibo simple será enviado a tu correo.</p>
                      </div>
                    )}
                  </div>

                  {formData.needsInvoice && (
                    <>
                      {/* Address Section */}
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <h3 className="text-lg font-black text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-erani-blue"/> Dirección Fiscal</h3>
                          
                          <div className="flex bg-foreground/5 rounded-lg p-1 border border-glass-border w-fit">
                            <button 
                              onClick={() => setFormData({...formData, fiscalMode: "address"})}
                              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${formData.fiscalMode === "address" ? "bg-erani-blue text-white shadow-md" : "text-nav-text hover:text-foreground"}`}
                            >
                              Formulario
                            </button>
                            <button 
                              onClick={() => setFormData({...formData, fiscalMode: "constancia"})}
                              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${formData.fiscalMode === "constancia" ? "bg-erani-blue text-white shadow-md" : "text-nav-text hover:text-foreground"}`}
                            >
                              Constancia (PDF)
                            </button>
                          </div>
                        </div>

                        {formData.fiscalMode === "address" ? (
                          <div className="flex flex-col gap-4 mt-2">
                            <div className="flex items-center gap-2 self-start mb-2">
                              <input type="checkbox" id="sameAsCompany" name="sameAsCompany" checked={formData.sameAsCompany} onChange={handleInputChange} className="w-4 h-4 rounded text-erani-blue bg-foreground/5 border-glass-border focus:ring-erani-blue" />
                              <label htmlFor="sameAsCompany" className="text-xs font-bold text-nav-text uppercase tracking-widest cursor-pointer">Usar misma dirección de la empresa</label>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex flex-col gap-2 col-span-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Calle</label>
                                <input type="text" name="fiscalStreet" value={formData.fiscalStreet} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Num Ext</label>
                                <input type="text" name="fiscalExt" value={formData.fiscalExt} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Num Int</label>
                                <input type="text" name="fiscalInt" value={formData.fiscalInt} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                              </div>
                              <div className="flex flex-col gap-2 col-span-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Colonia</label>
                                <input type="text" name="fiscalNeighborhood" value={formData.fiscalNeighborhood} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                              </div>
                              <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Ciudad/Municipio</label>
                                <input type="text" name="fiscalCity" value={formData.fiscalCity} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                              </div>
                              <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Estado</label>
                                <input type="text" name="fiscalState" value={formData.fiscalState} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                              </div>
                              <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">País</label>
                                <input type="text" name="fiscalCountry" value={formData.fiscalCountry} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 mt-2">
                            <p className="text-xs text-nav-text">Si no cuentas con tu dirección fiscal a la mano, puedes subir tu Constancia de Situación Fiscal actualizada y nosotros extraeremos los datos necesarios.</p>
                            {/* Drag and Drop Constancia */}
                            <div 
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={() => document.getElementById('fileUpload')?.click()}
                              className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${isDragging ? 'border-erani-blue bg-erani-blue/10' : 'border-glass-border bg-foreground/5 hover:bg-foreground/10'}`}
                            >
                              <input type="file" id="fileUpload" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-nav-text shadow-sm border border-glass-border">
                                {formData.constanciaFile ? <Check className="w-6 h-6 text-emerald-500" /> : <UploadCloud className="w-6 h-6 text-erani-blue" />}
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-foreground">
                                  {formData.constanciaFile ? formData.constanciaFile.name : "Sube tu Constancia de Situación Fiscal"}
                                </p>
                                <p className="text-xs text-nav-text mt-1">Arrastra el archivo o haz clic para buscar (.PDF, .PNG, .JPG)</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="h-px w-full bg-glass-border" />

                      {/* Billing Details */}
                      <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-black text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-erani-blue"/> Datos de Facturación</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">RFC</label>
                        <input type="text" name="rfc" value={formData.rfc} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all uppercase" placeholder="XAXX010101000" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Nombre o Razón Social</label>
                        <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" placeholder="Empresa S.A. de C.V." />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Código Postal Fiscal</label>
                        <input type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all" placeholder="12345" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Régimen Fiscal</label>
                        <select name="regimenFiscal" value={formData.regimenFiscal} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all">
                          <option value="">Selecciona un régimen...</option>
                          <option value="601">601 - General de Ley Personas Morales</option>
                          <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                          <option value="626">626 - RESICO</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Uso de CFDI</label>
                        <select name="usoCfdi" value={formData.usoCfdi} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all">
                          <option value="">Selecciona uso...</option>
                          <option value="G03">G03 - Gastos en general</option>
                          <option value="P01">P01 - Por definir</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-nav-text ml-1">Correo para Facturación</label>
                        <div className="flex flex-col gap-1 relative">
                          <input type="email" name="invoiceEmail" disabled={formData.sameEmailForInvoice} value={formData.sameEmailForInvoice ? formData.email : formData.invoiceEmail} onChange={handleInputChange} className="w-full bg-foreground/5 border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-erani-blue focus:ring-1 focus:ring-erani-blue transition-all disabled:opacity-50" placeholder="finanzas@empresa.com" />
                          <div className="absolute right-0 -top-6 flex items-center gap-1">
                            <input type="checkbox" id="sameEmailForInvoice" name="sameEmailForInvoice" checked={formData.sameEmailForInvoice} onChange={handleInputChange} className="w-3 h-3 rounded bg-foreground/5" />
                            <label htmlFor="sameEmailForInvoice" className="text-[8px] font-bold text-nav-text uppercase cursor-pointer">Usar correo admin</label>
                          </div>
                        </div>
                      </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-4 mt-2 border-t border-glass-border">
                    <button 
                      onClick={() => setStep(1)}
                      className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-nav-text hover:text-foreground transition-colors"
                    >
                      Regresar
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      disabled={!isStep2Valid()}
                      className="button-premium px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ir a Contrato (SLA) <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: CONTRACT (SLA) */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-8"
                >
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-foreground">Contrato de Servicios (SLA)</h2>
                    <p className="text-sm text-nav-text font-medium">
                      Por favor lee, descarga y acepta el Acuerdo de Nivel de Servicio (SLA) de ERANI antes de continuar con la firma digital y el pago.
                    </p>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* SLA iframe */}
                    <div className="w-full h-[500px] rounded-2xl border border-glass-border overflow-hidden bg-background/50 relative shadow-inner">
                      <iframe
                        src="/SLA_ERANI.pdf"
                        className="w-full h-full border-0"
                        title="ERANI SLA"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex gap-3">
                        <a
                          href="/SLA_ERANI.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setHasOpenedSLA(true)}
                          className="px-5 py-3 rounded-xl border border-glass-border bg-foreground/5 hover:bg-foreground/10 text-xs font-bold uppercase tracking-widest text-foreground transition-all flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4 text-erani-blue" /> Abrir en Pestaña Nueva
                        </a>
                        <a
                          href="/SLA_ERANI.pdf"
                          download="SLA_ERANI.pdf"
                          onClick={() => setHasOpenedSLA(true)}
                          className="px-5 py-3 rounded-xl border border-glass-border bg-foreground/5 hover:bg-foreground/10 text-xs font-bold uppercase tracking-widest text-foreground transition-all flex items-center gap-2"
                        >
                          <UploadCloud className="w-4 h-4 rotate-180 text-erani-blue" /> Descargar Contrato (PDF)
                        </a>
                      </div>
                      {!hasOpenedSLA && (
                        <button
                          type="button"
                          onClick={() => setHasOpenedSLA(true)}
                          className="px-5 py-3 rounded-xl bg-erani-blue/10 border border-erani-blue/20 hover:bg-erani-blue/20 text-xs font-bold uppercase tracking-widest text-erani-blue transition-all flex items-center gap-2"
                        >
                          Habilitar Aceptación
                        </button>
                      )}
                    </div>

                    {/* Checkbox Aceptacion */}
                    <div className="flex items-start gap-3 p-5 bg-foreground/5 border border-glass-border rounded-xl">
                      <input
                        type="checkbox"
                        id="slaAccepted"
                        checked={slaAccepted}
                        disabled={!hasOpenedSLA}
                        onChange={(e) => setSlaAccepted(e.target.checked)}
                        className="w-5 h-5 rounded bg-foreground/5 border-glass-border text-erani-purple focus:ring-erani-purple mt-0.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex flex-col gap-1">
                        <label htmlFor="slaAccepted" className={`text-sm font-bold leading-none cursor-pointer ${!hasOpenedSLA ? 'text-nav-text opacity-50 cursor-not-allowed' : 'text-foreground'}`}>
                          He leído el Acuerdo de Nivel de Servicio (SLA) de ERANI y acepto sus términos y condiciones.
                        </label>
                        {!hasOpenedSLA ? (
                          <span className="text-[10px] font-medium text-erani-coral">
                            * Es obligatorio abrir o descargar el contrato usando los botones de arriba antes de aceptar.
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-500">
                            ✓ Documento visualizado correctamente. Casilla habilitada.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-glass-border">
                    <button 
                      onClick={() => setStep(2)}
                      className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-nav-text hover:text-foreground transition-colors"
                    >
                      Regresar
                    </button>
                    <button 
                      onClick={() => setStep(4)}
                      disabled={!slaAccepted}
                      className="button-premium px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar a Firma <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: CONFIRMATION & SIGNATURE */}
              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-8"
                >
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-foreground">Confirmación y Firma</h2>
                    <p className="text-sm text-nav-text font-medium">Revisa tus datos y plasma tu firma digital para el contrato de servicios.</p>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* Data Confirmation Summary */}
                    <div className="bg-foreground/5 border border-glass-border rounded-xl p-6 flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-glass-border pb-4">
                        <h3 className="text-sm font-black text-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Verifica tus Datos</h3>
                        <button onClick={() => setStep(1)} className="text-[10px] font-bold text-erani-blue uppercase tracking-widest flex items-center gap-1 hover:underline">
                          <PenTool className="w-3 h-3" /> Editar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-nav-text text-[10px] uppercase font-bold tracking-widest">Responsable de Cuenta</span>
                          <span className="text-foreground font-bold">{formData.fullName}</span>
                          <span className="text-foreground/70 text-xs">{formData.role}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-nav-text text-[10px] uppercase font-bold tracking-widest">Empresa / Organización</span>
                          <span className="text-foreground font-bold">{formData.organizationName}</span>
                          <span className="text-foreground/70 text-xs">{formData.companyStreet} {formData.companyExt}, {formData.companyCity}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-nav-text text-[10px] uppercase font-bold tracking-widest">Contacto</span>
                          <span className="text-foreground font-bold">{formData.email}</span>
                          <span className="text-foreground/70 text-xs">{formData.phone}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-nav-text text-[10px] uppercase font-bold tracking-widest">Facturación (CFDI)</span>
                          {formData.needsInvoice ? (
                            <>
                              <span className="text-foreground font-bold">{formData.rfc}</span>
                              <span className="text-foreground/70 text-xs">{formData.razonSocial}</span>
                            </>
                          ) : (
                            <span className="text-foreground/70 italic text-xs">No requiere factura para este pago</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Digital Signature */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-black text-foreground flex items-center gap-2"><PenTool className="w-4 h-4 text-erani-purple"/> Firma Digital B2B</h3>
                        <p className="text-[10px] text-nav-text leading-relaxed max-w-xl">Al firmar, estás de acuerdo en celebrar electrónicamente el contrato de servicios ERANI Beta a nombre de <strong>{formData.organizationName}</strong>, aceptando la facturación al RFC {formData.rfc}.</p>
                      </div>
                      
                      <div className="relative w-full h-[300px] bg-background border-2 border-dashed border-glass-border rounded-2xl overflow-hidden shadow-inner group">
                        {/* Contract Template Background Text */}
                        <div className="absolute inset-0 p-6 pointer-events-none opacity-20 flex flex-col justify-end pb-10">
                          <p className="text-[9px] font-mono leading-relaxed text-foreground text-center">
                            DOCUMENTO DIGITALMENTE VINCULANTE.<br/>
                            FIRMA: _________________________<br/>
                            {formData.fullName.toUpperCase()} - {formData.role.toUpperCase()}<br/>
                            {formData.razonSocial.toUpperCase()} ({formData.rfc.toUpperCase()})<br/>
                            FECHA: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                        
                        <canvas
                          ref={canvasRef}
                          width={800} // Setup large width, scale with CSS
                          height={500}
                          className="w-full h-full cursor-crosshair relative z-10 touch-none"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                        
                        {!hasSignature && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <span className="text-lg font-black text-nav-text uppercase tracking-widest opacity-50">Dibuja tu firma aquí</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <button onClick={clearSignature} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-nav-text hover:text-red-500 transition-colors">
                          <Eraser className="w-3 h-3" /> Limpiar firma
                        </button>
                      </div>
                    </div>
                  </div>

                           <div className="flex justify-between pt-4 mt-2 border-t border-glass-border">
                    <button 
                      onClick={() => setStep(3)}
                      className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-nav-text hover:text-foreground transition-colors"
                    >
                      Regresar
                    </button>
                    <button 
                      onClick={() => setStep(5)}
                      disabled={!hasSignature}
                      className="button-premium px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Validar Firma <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: PROCESSING & PAYMENT */}
              {step === 5 && (
                <motion.div 
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <ShieldCheck className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground">Procesamiento Seguro</h2>
                    <p className="text-nav-text text-sm max-w-2xl font-medium">Estás a un paso de comenzar tu intervención forense. Verifica los detalles, aplica tu código de referido si tienes uno y procesa tu pago de manera segura.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    {/* Left side: Form & Actions */}
                    <div className="flex flex-col gap-6">
                      {/* Referral Code Box */}
                      <div className="w-full bg-foreground/5 border border-glass-border p-6 rounded-2xl flex flex-col gap-3">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-erani-purple"/> ¿Tienes un código de referido?
                        </h4>
                        <div className="flex gap-2 relative">
                          <input 
                            type="text" 
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="INGRESAR CÓDIGO" 
                            disabled={referralApplied}
                            className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-nav-text focus:outline-none focus:border-erani-purple focus:ring-1 focus:ring-erani-purple transition-all uppercase disabled:opacity-50"
                          />
                          <button 
                            onClick={handleApplyReferral}
                            disabled={!referralCode || referralApplied}
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-erani-purple hover:bg-erani-purple/90 text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {referralApplied ? <Check className="w-4 h-4" /> : "Validar"}
                          </button>
                        </div>
                        {referralApplied && (
                          <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ¡Código {referralCode} aplicado correctamente! Precio actualizado en Stripe.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 w-full bg-background border-2 border-emerald-500/30 p-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-colors hover:border-emerald-500/60">
                        <input 
                          type="checkbox" 
                          id="readDisclaimer" 
                          checked={readDisclaimer} 
                          onChange={(e) => setReadDisclaimer(e.target.checked)} 
                          className="w-6 h-6 rounded bg-foreground/5 border-emerald-500/50 text-emerald-500 focus:ring-emerald-500 cursor-pointer" 
                        />
                        <label htmlFor="readDisclaimer" className="text-base font-black text-foreground cursor-pointer select-none">
                          HE LEÍDO Y ACEPTO PROCESAR EL PAGO DE MI SUSCRIPCIÓN
                        </label>
                      </div>

                      {/* SECURE STRIPE NARRATIVE & BADGE */}
                      <div className="w-full bg-[#635BFF]/5 border border-[#635BFF]/20 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#635BFF]/10 blur-[40px] rounded-full pointer-events-none transition-all group-hover:scale-150 duration-700" />
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center bg-[#635BFF] text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(99,91,255,0.4)] animate-pulse">
                            Stripe Secure
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#635BFF]">Powered by Stripe</span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-nav-text font-medium leading-relaxed">
                            Procesamos tus pagos usando <strong className="text-foreground font-bold">Stripe</strong>, líder mundial en infraestructura de pagos. Tu información financiera está completamente encriptada y resguardada bajo estándares PCI-DSS Nivel 1, asegurando una experiencia de adquisición rápida y 100% segura.
                          </p>
                          <p className="text-[11px] text-[#635BFF] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span>🔒 Encriptación SSL de 256 bits</span>
                            <span>•</span>
                            <span>🛡️ Protección Anti-Fraude Activa</span>
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#635BFF]/15 text-xs text-nav-text font-medium leading-relaxed">
                          Si tienes alguna duda o necesitas asistencia personalizada durante tu compra, por favor comunícate con nuestro equipo de Ventas y Soporte B2B al correo{" "}
                          <a href="mailto:diego.a182700@gmail.com" className="text-erani-blue font-bold hover:underline">diego.a182700@gmail.com</a>{" "}
                          o al teléfono{" "}
                          <a href="tel:+524624004066" className="text-erani-blue font-bold hover:underline">+52 462 400 4066</a>.
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
                        <button 
                          onClick={() => setStep(4)}
                          className="px-8 py-4 rounded-xl border border-glass-border bg-foreground/5 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground/10 transition-colors flex-1"
                        >
                          Regresar a Firma
                        </button>
                        {referralApplied ? (
                          <button 
                            onClick={handleStripePayment}
                            disabled={!readDisclaimer}
                            className="px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(158,128,255,0.5)] bg-erani-purple text-white hover:bg-erani-purple/90 transition-all flex-[2]"
                          >
                            Pagar con Descuento <ExternalLink className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            onClick={handleStripePayment}
                            disabled={!readDisclaimer}
                            className="button-premium px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(59,130,246,0.5)] flex-[2]"
                          >
                            Ir al Pago (Stripe) <ExternalLink className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right side: Disclaimers and Contact */}
                    <div className="flex flex-col gap-4">
                      <div className="bg-erani-blue/5 border border-erani-blue/20 p-6 rounded-2xl flex flex-col gap-4 text-left shadow-inner h-full">
                        <div className="flex items-center gap-2 border-b border-erani-blue/20 pb-3">
                          <Info className="w-5 h-5 text-erani-blue" />
                          <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Información Importante</h4>
                        </div>
                        
                        <p className="text-sm text-nav-text font-medium leading-relaxed">
                          Al realizar el pago le llegará una confirmación a su correo por parte de Stripe. Nuestro equipo validará sus datos fiscales y le enviará un correo de Bienvenida con las credenciales de la plataforma, el CFDI correspondiente y su contrato firmado.
                        </p>
                        
                        <div className="p-4 bg-erani-purple/10 border border-erani-purple/20 rounded-xl flex flex-col gap-2">
                          <p className="text-erani-purple font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Renovaciones y Convenios
                          </p>
                          <p className="text-xs text-erani-purple/80 font-medium leading-relaxed">
                            Por seguridad las renovaciones de tu plan son manuales una vez que termines tus ERIS. En caso de contar con un código de referido se respetará ese precio del servicio mientras se mantenga el convenio vigente, te mantendremos informado en caso de actualizar el convenio. Te informaremos cuando estén por terminarse. En caso de que quieras renovar te invitamos a hacerlo una vez que se hayan agotado tus ERIS disponibles. Descuida, tu información, reportes y configuraciones <strong>no se perderán.</strong>
                          </p>
                        </div>
                        
                        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-glass-border">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-nav-text">Contacto y Soporte B2B</h5>
                          <div className="flex flex-col gap-2">
                            <a href="mailto:diego.a182700@gmail.com" className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-erani-blue transition-colors w-fit">
                              <Mail className="w-4 h-4 text-erani-blue" /> diego.a182700@gmail.com
                            </a>
                            <a href="tel:+524624004066" className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-erani-blue transition-colors w-fit">
                              <Phone className="w-4 h-4 text-erani-blue" /> +52 462 400 4066
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sidebar Summary */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-foreground/5 border-l border-glass-border flex-col relative shrink-0">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex flex-col gap-8 z-10">
          
          {/* Logo Area */}
          <div className="flex justify-center w-full mb-4">
             <Image src="/eanilogo.png" alt="ERANI Logo" width={220} height={70} className="object-contain" priority />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-erani-purple bg-erani-purple/10 border border-erani-purple/20 px-3 py-1 rounded-full w-fit">
              Resumen de Compra
            </span>
            <motion.h2 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
              className="text-4xl font-black mt-2 bg-gradient-to-r from-erani-blue via-erani-purple to-erani-blue bg-[length:200%_auto] bg-clip-text text-transparent uppercase drop-shadow-[0_0_10px_rgba(158,128,255,0.5)]"
            >
              PLAN BETA
            </motion.h2>
            <p className="text-sm text-nav-text font-medium leading-relaxed">Intervención forense especializada con acceso completo a la plataforma por 90 días.</p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-4xl font-black text-foreground">$3,750 <span className="text-sm text-nav-text font-bold uppercase">MXN</span></span>
            <span className="text-xs font-bold text-erani-blue">Pago por 100 ERIS de consumo</span>
          </div>

          <div className="h-px w-full bg-glass-border" />

          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Características Incluidas</h3>
            <ul className="flex flex-col gap-3">
              {planFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-3 text-xs font-medium text-nav-text">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 
                  <span className="leading-tight">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto pt-8">
            <div className="p-4 rounded-xl bg-erani-blue/5 border border-erani-blue/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-erani-blue">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Renovación Manual</span>
              </div>
              <p className="text-[10px] text-nav-text leading-relaxed font-medium">
                Al terminar los 100 ERIS iniciales, la renovación será estrictamente manual para tu seguridad operativa.
              </p>
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}

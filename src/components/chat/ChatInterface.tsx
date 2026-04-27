"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Mic, 
  Paperclip, 
  Send, 
  Bot, 
  User, 
  Image as ImageIcon,
  MoreHorizontal,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  X,
  FileText,
  Plus
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: 'assistant',
      content: "Protocolo de Agente Forense activado. Estoy listo para analizar discrepancias en tus proyectos activos. Cada consulta consumirá 5 ERIS de tu balance operativo.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    // Simulate Streaming
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Procesando peritaje forense... Basado en el entrenamiento de 'ERANI Core', he detectado anomalías en los registros de facturación triangulados con la base de datos de Hacienda. Se recomienda una auditoría profunda en el sector de servicios Q1.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsStreaming(false);
    }, 1500);
  };

  const [isListening, setIsListening] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedProject, setSelectedProject] = useState("Auditoría General");

  const libraryFiles = [
    { id: "1", name: "Reporte_Fiscal_Q1.pdf", type: "PDF" },
    { id: "2", name: "Logs_Jira_March.csv", type: "CSV" },
    { id: "3", name: "Contrato_Servicios.docx", type: "DOCX" }
  ];

  const projects = [
    "Auditoría General",
    "Proyecto Alpha",
    "Recuperación Retail",
    "Forense Q2",
    "Nuevo Proyecto +"
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background/30 backdrop-blur-sm rounded-[2.5rem] border border-glass-border shadow-2xl relative">
      {/* Header / Context Bar */}
      <div className="px-8 py-4 border-b border-glass-border flex items-center justify-between bg-foreground/2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-erani-blue/10 flex items-center justify-center border border-erani-blue/20 p-2 overflow-hidden shadow-inner">
             <Image src="/isologo.png" alt="ERANI" width={28} height={28} className="logo-adaptive" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">ERANI Forensic Agent</h3>
            <span className="text-[8px] uppercase font-bold text-emerald-500 tracking-widest flex items-center gap-1">
               <ShieldCheck className="w-3 h-3" /> Ecosistema de Datos Blindado
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowProjects(!showProjects)}
              className="px-5 py-2 rounded-full bg-erani-purple/10 border border-erani-purple/20 text-erani-purple text-[8px] font-black uppercase tracking-widest hover:bg-erani-purple/20 transition-all shadow-lg"
            >
               Proyecto: {selectedProject}
            </button>
            <AnimatePresence>
              {showProjects && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 right-0 w-56 glassmorphism border border-glass-border rounded-2xl p-2 z-[100] shadow-2xl"
                >
                  {projects.map(p => (
                    <button 
                      key={p}
                      onClick={() => {
                        setSelectedProject(p);
                        setShowProjects(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[9px] uppercase font-black tracking-widest text-nav-text hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <button className="p-2 hover:bg-foreground/5 rounded-xl text-gray-500 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar"
      >
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center border shadow-xl ${
              msg.role === 'assistant' 
              ? 'bg-erani-blue/10 border-erani-blue/20 text-erani-blue p-2' 
              : 'bg-erani-purple/10 border-erani-purple/20 text-erani-purple'
            }`}>
              {msg.role === 'assistant' ? <Image src="/isologo.png" alt="ERANI" width={24} height={24} className="logo-adaptive" /> : <User className="w-6 h-6" />}
            </div>
            
            <div className={`flex flex-col gap-2 max-w-[70%] ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed ${
                msg.role === 'assistant' 
                ? 'glassmorphism border-glass-border text-foreground' 
                : 'bg-foreground/5 text-foreground border border-foreground/10'
              }`}>
                {msg.content}
                {msg.type === 'image' && msg.imageUrl && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-glass-border shadow-lg">
                    <img src={msg.imageUrl} alt="AI Generated" className="w-full h-auto object-cover" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 px-2">
                 <span className="text-[8px] uppercase font-bold text-gray-500 tracking-widest">
                   {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
                 {msg.role === 'assistant' && (
                   <div className="flex items-center gap-3">
                      <ThumbsUp className="w-3 h-3 text-gray-500 cursor-pointer hover:text-erani-blue transition-colors" />
                      <RotateCcw className="w-3 h-3 text-gray-500 cursor-pointer hover:text-erani-blue transition-colors" />
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
        ))}
        {isStreaming && (
          <div className="flex gap-5">
             <div className="w-11 h-11 rounded-2xl bg-erani-blue/10 border border-erani-blue/20 flex items-center justify-center p-2 shadow-inner">
                <Image src="/isologo.png" alt="ERANI" width={24} height={24} className="logo-adaptive animate-pulse" />
             </div>
             <div className="flex items-center gap-1.5 p-5 rounded-3xl glassmorphism border border-glass-border">
                <div className="w-2 h-2 bg-erani-blue rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-erani-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-erani-blue rounded-full animate-bounce [animation-delay:0.4s]" />
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 pt-0">
        <div className="premium-border-container group">
          <div className="premium-border-inner p-2 gap-2">
            <button 
              onClick={() => setShowLibrary(true)}
              className="p-4 text-gray-400 hover:text-erani-blue transition-colors hover:bg-erani-blue/5 rounded-full shrink-0 relative z-10"
            >
                <Paperclip className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showLibrary && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full mb-4 left-0 w-80 glassmorphism border border-glass-border rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[100]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Librería de Evidencias</span>
                    <button onClick={() => setShowLibrary(false)} className="text-gray-500 hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {libraryFiles.map(file => (
                      <button 
                        key={file.id} 
                        onClick={() => {
                          setInput(prev => prev + ` [Archivo: ${file.name}] `);
                          setShowLibrary(false);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 border border-transparent hover:border-glass-border transition-all group"
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-erani-blue/10 flex items-center justify-center text-erani-blue">
                              <FileText className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-gray-400 group-hover:text-foreground truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 min-h-[50px] flex items-center px-2 relative z-10">
                <textarea 
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Analiza las facturas de marzo y busca duplicados..."
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-bold py-2 placeholder:text-gray-500 resize-none max-h-48 custom-scrollbar"
                />
            </div>

            <div className="flex items-center gap-2 p-1 relative z-10">
                <button 
                  onClick={() => setIsListening(!isListening)}
                  className={`p-3 transition-all rounded-full shrink-0 ${isListening ? 'bg-erani-blue text-white animate-pulse shadow-[0_0_15px_rgba(0,85,160,0.5)]' : 'text-gray-400 hover:text-erani-blue hover:bg-erani-blue/5'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-3 text-gray-400 hover:text-erani-purple transition-colors hover:bg-erani-purple/5 rounded-full shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-erani-blue to-erani-purple text-white flex items-center justify-center shadow-[0_0_20px_rgba(158,128,255,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
        
        <div className="mt-5 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-erani-blue animate-pulse" />
              <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">AI can make mistakes. Please contact support to let us know.</span>
           </div>
           <div className="h-1 w-1 rounded-full bg-gray-400" />
           <div className="flex items-center gap-2 text-erani-blue">
              <span className="text-[9px] uppercase font-black tracking-widest">Costo: 5.0 ERIS</span>
           </div>
        </div>
      </div>
    </div>
  );
}

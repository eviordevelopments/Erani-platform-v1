"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Trash2, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Search,
  Filter
} from "lucide-react";
import Image from "next/image";

interface IngestionDocument {
  id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  status: string;
  created_at: string;
}

export default function EvidenceLibrary() {
  const [documents, setDocuments] = useState<IngestionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ingest');
      const data = await response.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    // Listen for custom event from IngestionEngine to refresh library
    window.addEventListener('ingestion-complete', fetchDocuments);
    return () => window.removeEventListener('ingestion-complete', fetchDocuments);
  }, [fetchDocuments]);

  const deleteDocument = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta evidencia primaria?")) return;
    
    try {
      const resp = await fetch(`/api/ingest?id=${id}`, { method: 'DELETE' });
      if (resp.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      }
    } catch (error) {
       console.error("Error deleting document:", error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 bg-foreground/5 border border-glass-border p-3 rounded-2xl">
        <div className="flex-1 flex items-center gap-3 px-3">
          <Search className="w-4 h-4 text-nav-text" />
          <input 
            type="text" 
            placeholder="Buscar evidencia..." 
            className="bg-transparent border-none text-[10px] uppercase font-bold tracking-widest text-foreground focus:outline-none w-full placeholder:text-nav-text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
            <button className="p-2 hover:bg-foreground/5 rounded-lg transition-colors text-nav-text">
                <Filter className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Library Table/List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-erani-blue/20 border-t-erani-blue animate-spin" />
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Sincronizando Archivos...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-4 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl">
             <FileText className="w-8 h-8 text-gray-800" />
             <span className="text-[10px] uppercase font-black tracking-widest text-gray-700">No hay documentos cargados</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
             <AnimatePresence mode="popLayout">
                {filteredDocs.map((doc) => (
                  <motion.div 
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-4 bg-foreground/[0.03] border border-glass-border rounded-2xl hover:bg-foreground/[0.06] hover:border-erani-blue/30 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-erani-blue shrink-0 border border-glass-border">
                          <FileText className="w-5 h-5" />
                       </div>
                       <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">{doc.file_name}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[8px] uppercase font-black text-nav-text">{formatSize(doc.file_size)}</span>
                             <span className="text-nav-text opacity-30">•</span>
                             <span className="text-[8px] uppercase font-black text-nav-text">{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                       {/* Status Badge */}
                       <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-[8px] uppercase font-black text-emerald-500 tracking-tighter">Evidencia Lista</span>
                       </div>

                       <div className="flex items-center bg-foreground/10 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1.5 hover:text-erani-coral text-nav-text transition-colors"
                          >
                             <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 hover:text-foreground text-nav-text transition-colors">
                             <Download className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </AnimatePresence>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-erani-purple/5 border border-erani-purple/10 flex items-start gap-4">
         <Clock className="w-4 h-4 text-erani-purple shrink-0 mt-0.5" />
         <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-erani-purple">Retención Forense</span>
            <p className="text-[8px] text-gray-500 font-medium leading-relaxed">
               Los archivos en la Capa de Ingesta se guardan con cifrado AES-256. Sirven como evidencia legal para auditorías de TRL y deducción de impuestos de I+D.
            </p>
         </div>
      </div>
    </div>
  );
}

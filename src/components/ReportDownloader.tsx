"use client";

import { DownloadCloud, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ReportDownloader({ targetId }: { targetId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    
    // Dynamic import to prevent SSR issues
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const element = document.getElementById(targetId);
    if (!element) {
        setIsGenerating(false);
        return;
    }

    try {
      // Scale: 2 ensures high resolution (Retina-like) 
      // Background must match our deep black exactly
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: "#0A0E14",
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: (document) => {
            const el = document.getElementById(targetId);
            if (el) el.style.padding = '20px';
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setProperties({ title: "ERANI Bento Report" });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save("Bento_Report_Erani_Forense.pdf");
    } catch (e) {
      console.error("Error generating PDF:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      disabled={isGenerating}
      className="button-premium px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center gap-2 disabled:opacity-50"
    >
      {isGenerating ? (
        <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generando PDF...
        </>
      ) : (
        <>
            <DownloadCloud className="w-4 h-4" />
            Descargar Reporte PDF
        </>
      )}
    </button>
  );
}

"use client";
import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ForensicPDFDocument from "./ForensicPDFDocument";
import { DownloadCloud, Loader2 } from "lucide-react";
import type { ForensicReportData } from "@/app/forensic/page";
import { auditLogger } from "@/lib/auditLogger";

export default function PDFDownloadWrapper({ data }: { data: ForensicReportData }) {
  const handleDownloadClick = async () => {
    await auditLogger.log(
      'REPORT_DOWNLOAD',
      `Descarga de reporte forense: ${data.projectName}`,
      { projectName: data.projectName },
      'download'
    );
  };

  return (
    <div onClick={handleDownloadClick}>
      <PDFDownloadLink
        document={<ForensicPDFDocument data={data} />}
        fileName={`Reporte_Forense_${data.projectName || "Erani"}.pdf`}
        className="button-premium px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center gap-2"
      >
        {({ loading }) =>
          loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando Vector PDF...
            </>
          ) : (
            <>
              <DownloadCloud className="w-4 h-4" />
              Descargar Reporte PDF
            </>
          )
        }
      </PDFDownloadLink>
    </div>
  );
}

"use client";

import { DownloadCloud } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ForensicReportData } from "@/app/forensic/page";

const PDFDownloadWrapper = dynamic(() => import("./pdf/PDFDownloadWrapper"), {
  ssr: false,
});

export default function ReportDownloader({ data, org, reportId }: { data?: ForensicReportData | null, org?: any, reportId?: string | null }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  if (!data) {
    return (
      <button disabled className="button-premium px-8 py-3.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center gap-2 opacity-50">
        <DownloadCloud className="w-4 h-4" />
        Datos no disponibles
      </button>
    );
  }

  return <PDFDownloadWrapper data={data} org={org} reportId={reportId} />;
}

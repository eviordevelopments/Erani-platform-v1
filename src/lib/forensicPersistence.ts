import { supabase } from './supabaseClient';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import ForensicPDFDocument from '@/components/pdf/ForensicPDFDocument';
import { auditLogger } from './auditLogger';
import type { ForensicReportData } from '@/app/forensic/page';

/**
 * Generates and persists a forensic PDF report to Supabase Storage.
 * Uses the service-role admin client so RLS never blocks the upload.
 * Updates the forensic_reports record with the public PDF URL.
 */
export async function persistForensicReport(
  reportId: string,
  data: ForensicReportData,
  organizationId?: string
) {
  try {
    console.log(`[Persistence] Starting PDF generation for report: ${reportId}`);

    // 1. Render PDF blob from React component
    const blob = await pdf(React.createElement(ForensicPDFDocument, { data }) as any).toBlob();

    // 2. Build storage path: clients/<org_id>/reports/<file> or reports/<file>
    const fileName = `report_${reportId}_${Date.now()}.pdf`;
    const filePath = organizationId
      ? `clients/${organizationId}/reports/${fileName}`
      : `reports/${fileName}`;

    console.log(`[Persistence] Uploading to: forensic-reports/${filePath}`);

    // 3. Upload via standard client (RLS must allow authenticated users)
    const { error: uploadError } = await supabase.storage
      .from('forensic-reports')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('forensic-reports')
      .getPublicUrl(filePath);

    // 5. Update the DB record 
    const updatePayload: Record<string, unknown> = { pdf_url: publicUrl };
    if (organizationId) updatePayload.organization_id = organizationId;

    const { error: updateError } = await supabase
      .from('forensic_reports')
      .update(updatePayload)
      .eq('id', reportId);

    if (updateError) {
      console.warn(`[Persistence] DB update for pdf_url failed: ${updateError.message}`);
    }

    // 6. Audit log
    await auditLogger.log(
      'REPORT_GENERATE',
      `Reporte PDF generado y persistido: ${data.projectName}`,
      { reportId, fileName, publicUrl, organizationId },
      'file-text'
    );

    console.log(`[Persistence] Success — PDF at: ${publicUrl}`);
    return publicUrl;

  } catch (err: any) {
    console.error(`[Persistence Critical]`, err);
    return null;
  }
}

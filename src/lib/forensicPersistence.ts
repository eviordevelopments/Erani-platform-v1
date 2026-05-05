import { supabase } from './supabaseClient';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import ForensicPDFDocument from '@/components/pdf/ForensicPDFDocument';
import { auditLogger } from './auditLogger';
import type { ForensicReportData } from '@/app/forensic/page';

/**
 * Generates and persists a forensic PDF report to Supabase Storage.
 * Updates the report record with the public URL and organization ID.
 */
export async function persistForensicReport(
  reportId: string, 
  data: ForensicReportData, 
  organizationId?: string
) {
  try {
    console.log(`[Persistence] Starting automated PDF generation for report: ${reportId}`);

    // 1. Generate Blob from PDF Component
    const blob = await pdf(React.createElement(ForensicPDFDocument, { data }) as any).toBlob();
    
    // 2. Define path using structured routing
    // clients/[client_id]/reports/[file_name]
    const fileName = `report_${reportId}_${Date.now()}.pdf`;
    const filePath = organizationId 
      ? `clients/${organizationId}/reports/${fileName}` 
      : `reports/${fileName}`;

    console.log(`[Persistence] Uploading to: forensic-reports/${filePath}`);

    // 3. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('forensic-reports')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('forensic-reports')
      .getPublicUrl(filePath);

    // 5. Update Database Record
    // We ensure organization_id is set if provided to maintain RLS integrity
    const updatePayload: any = { pdf_url: publicUrl };
    if (organizationId) updatePayload.organization_id = organizationId;

    const { error: updateError } = await supabase
      .from('forensic_reports')
      .update(updatePayload)
      .eq('id', reportId);

    if (updateError) {
      console.warn(`[Persistence] Failed to update record with PDF URL: ${updateError.message}`);
    }

    // 6. Log Audit Event
    await auditLogger.log(
      'REPORT_GENERATE', 
      `Reporte PDF generado y persistido: ${data.projectName}`,
      { reportId, fileName, publicUrl, organizationId },
      'file-text'
    );

    console.log(`[Persistence] Success! PDF available at: ${publicUrl}`);
    return publicUrl;

  } catch (err: any) {
    console.error(`[Persistence Critical]`, err);
    return null;
  }
}

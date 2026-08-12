/**
 * /api/ingest — Primary Evidence Ingestion Route
 *
 * Responsibilities:
 *  1. Upload raw file to Supabase Storage bucket `primary_evidence`
 *  2. Save metadata to `ingestion_documents` table
 *  3. Run the RAG pipeline (extract → chunk → embed) and upsert rows
 *     into `document_embeddings` so the forensic analyze action has
 *     vectorized evidence ready — files are NEVER orphaned in storage.
 *
 * Auth: organization_id is derived from the authenticated user's `profiles`
 * row (never from client-supplied form data). Members cannot write/delete.
 * Uses the service-role admin client for all DB writes to bypass RLS.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { extractTextFromFile, chunkText, embedChunks } from '@/lib/rag';

// ── Auth helper ───────────────────────────────────────────────────────────
/**
 * Resolves the authenticated user's organization_id and profile_type from
 * the `profiles` table. Validates the JWT from the Authorization header.
 * Returns a NextResponse error on failure.
 */
async function resolveOrgFromProfile(
  request: Request
): Promise<
  | { userId: string; organizationId: string; profileType: string }
  | NextResponse
> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id, profile_type')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
  }

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    profileType: profile.profile_type,
  };
}

// ── POST: upload + embed ──────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // Resolve org from authenticated profile (never from client-supplied data)
    const resolved = await resolveOrgFromProfile(req);
    if (resolved instanceof NextResponse) return resolved;

    const { userId, organizationId, profileType } = resolved;

    // Members cannot ingest files (write operation)
    if (profileType === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = (formData.get('projectId') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 1. Upload raw file to primary_evidence storage ────────────────────
    const fileExt  = file.name.split('.').pop() ?? 'bin';
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storagePath = projectId
      ? `${organizationId}/${projectId}/${safeName}`
      : `${organizationId}/${safeName}`;

    const { error: storageError } = await supabaseAdmin.storage
      .from('primary_evidence')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (storageError) {
      console.error('[Ingest] Storage upload error:', storageError);
      return NextResponse.json(
        { error: `Storage upload failed: ${storageError.message}` },
        { status: 500 }
      );
    }

    // ── 2. Save metadata to ingestion_documents ───────────────────────────
    const { data: docRecord, error: dbError } = await supabaseAdmin
      .from('ingestion_documents')
      .insert({
        organization_id: organizationId,
        user_id:         userId,
        file_name:       file.name,
        file_size:       file.size,
        content_type:    file.type,
        storage_path:    storagePath,
        status:          'processing',
        ...(projectId ? { project_id: projectId } : {}),
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Ingest] ingestion_documents insert error:', dbError);
      // Non-fatal — storage succeeded, continue with embedding
    }

    // ── 3. RAG pipeline: extract → chunk → embed → upsert ────────────────
    let embeddingStatus: 'success' | 'error' = 'success';
    let embeddingError: string | undefined;

    try {
      console.log(`[Ingest] Extracting text from ${file.name}...`);
      const parsed = await extractTextFromFile(buffer, file.name);
      const chunks = chunkText(parsed.text, parsed.fileName, parsed.fileType);

      if (chunks.length === 0) {
        throw new Error('No readable text found in file.');
      }

      console.log(`[Ingest] Embedding ${chunks.length} chunks for ${file.name}...`);
      const embedded = await embedChunks(chunks);

      const rows = embedded.map(chunk => ({
        organization_id: organizationId,
        project_id:      projectId || null,
        file_name:       chunk.fileName,
        chunk_index:     chunk.chunkIndex,
        content:         chunk.content,
        embedding:       chunk.embedding,
        storage_path:    storagePath,   // link back to raw file in storage
        metadata: {
          file_type:    chunk.fileType,
          size:         file.size,
          created_at:   new Date().toISOString(),
          ingestion_id: docRecord?.id ?? null,
        },
      }));

      const { error: embedError } = await supabaseAdmin
        .from('document_embeddings')
        .insert(rows);

      if (embedError) {
        throw new Error(`document_embeddings insert failed: ${embedError.message}`);
      }

      console.log(`[Ingest] Stored ${rows.length} embedding rows for ${file.name}`);

      // Mark ingestion_documents as completed
      if (docRecord?.id) {
        await supabaseAdmin
          .from('ingestion_documents')
          .update({ status: 'completed' })
          .eq('id', docRecord.id);
      }
    } catch (ragErr: any) {
      embeddingStatus = 'error';
      embeddingError  = ragErr.message;
      console.error('[Ingest] RAG pipeline error:', ragErr.message);

      if (docRecord?.id) {
        await supabaseAdmin
          .from('ingestion_documents')
          .update({ status: 'error', error_message: ragErr.message })
          .eq('id', docRecord.id);
      }
    }

    return NextResponse.json({
      success:         embeddingStatus === 'success',
      message:         embeddingStatus === 'success'
        ? 'File ingested and embedded successfully.'
        : 'File stored but embedding failed — forensic analysis may use inline fallback.',
      storagePath,
      document:        docRecord,
      embeddingStatus,
      embeddingError,
    }, { status: embeddingStatus === 'success' ? 200 : 207 });

  } catch (error: any) {
    console.error('[Ingest] Critical error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── GET: list ingested documents for an org/project ───────────────────────
export async function GET(req: Request) {
  try {
    const resolved = await resolveOrgFromProfile(req);
    if (resolved instanceof NextResponse) return resolved;

    const { organizationId } = resolved;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    let query = supabaseAdmin
      .from('ingestion_documents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE: remove file from storage + DB ────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const resolved = await resolveOrgFromProfile(req);
    if (resolved instanceof NextResponse) return resolved;

    const { organizationId, profileType } = resolved;

    // Members cannot delete files (write operation)
    if (profileType === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required.' }, { status: 400 });
    }

    // Verify the document belongs to the authenticated user's org
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('ingestion_documents')
      .select('storage_path, project_id, organization_id')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // Ensure the document belongs to the user's organization
    if (doc.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('primary_evidence')
      .remove([doc.storage_path]);

    if (storageError) {
      console.warn('[Ingest DELETE] Storage remove warning:', storageError.message);
    }

    // Remove embeddings for this file
    await supabaseAdmin
      .from('document_embeddings')
      .delete()
      .eq('storage_path', doc.storage_path);

    // Remove metadata record
    const { error: dbError } = await supabaseAdmin
      .from('ingestion_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document and embeddings deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

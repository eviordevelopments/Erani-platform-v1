import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos el Service Role para sobrepasar RLS o requerimos autenticación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string || 'a1b2c3d4-0000-0000-0000-000000000001'; // Fallback to demo org
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    // Usamos el ID de la organización para separar los buckets lógicamente
    const filePath = `${organizationId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Subir a Supabase Storage (Bucket: primary_evidence)
    const { data: storageData, error: storageError } = await supabase.storage
      .from('primary_evidence')
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    if (storageError) {
      console.error('Supabase Storage Error:', storageError);
      return NextResponse.json({ error: 'Error uploading file to storage' }, { status: 500 });
    }

    // 2. Guardar metadata en base de datos (ingestion_documents)
    const { data: dbData, error: dbError } = await supabase
      .from('ingestion_documents')
      .insert([
        {
          organization_id: organizationId,
          user_id: userId || null,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
          storage_path: filePath,
          status: 'uploaded',
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Supabase DB Error:', dbError);
      return NextResponse.json({ error: 'Error saving metadata' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File ingested successfully',
      document: dbData 
    });

  } catch (error: any) {
    console.error('Error during ingestion:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId') || 'a1b2c3d4-0000-0000-0000-000000000001';

    const { data, error } = await supabase
      .from('ingestion_documents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Fetch Error:', error);
      return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
    }

    return NextResponse.json({ documents: data });

  } catch (error: any) {
    console.error('Error fetching ingestion:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // 1. Get storage path first
    const { data: doc, error: fetchError } = await supabase
      .from('ingestion_documents')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('primary_evidence')
      .remove([doc.storage_path]);

    if (storageError) {
      console.error('Storage Delete Error:', storageError);
    }

    // 3. Delete from DB
    const { error: dbError } = await supabase
      .from('ingestion_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      return NextResponse.json({ error: 'Error deleting metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

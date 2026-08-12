import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { error } = await supabaseAdmin.from('document_embeddings').select('id').limit(1);
  return NextResponse.json({ error: error ? error.message : 'OK' });
}

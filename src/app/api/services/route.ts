import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for backend operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = supabaseAdmin.from('erani_services').select('*').order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('service_type', category);
    }
    
    const { data: services, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error('Error fetching erani services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services', details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/sessions - Fetch all sessions for the organization
export async function GET() {
  try {
    // In a real app, we'd get the org ID from the user's session
    // For now, we use the demo org ID
    const demoOrgId = 'a1b2c3d4-0000-0000-0000-000000000001';

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('organization_id', demoOrgId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const demoOrgId = 'a1b2c3d4-0000-0000-0000-000000000001';

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert([
        {
          organization_id: demoOrgId,
          title: body.title,
          scheduled_at: body.scheduledAt,
          notes: body.notes,
          status: 'scheduled',
          calendly_url: body.calendlyUrl
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

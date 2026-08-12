import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Helper: resolve the authenticated user's organization_id and profile_type
 * from the `profiles` table.
 *
 * Extracts the JWT from the Authorization header, validates it with
 * supabaseAdmin.auth.getUser(), then queries `profiles` for the org context.
 *
 * Returns { organizationId, profileType } on success, or a NextResponse error.
 */
async function resolveOrgFromProfile(
  request: Request
): Promise<
  | { organizationId: string; profileType: string }
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
    organizationId: profile.organization_id,
    profileType: profile.profile_type,
  };
}

// GET /api/sessions - Fetch all sessions for the organization
export async function GET(request: Request) {
  try {
    const resolved = await resolveOrgFromProfile(request);
    if (resolved instanceof NextResponse) return resolved;

    const { organizationId } = resolved;

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('organization_id', organizationId)
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
    const resolved = await resolveOrgFromProfile(request);
    if (resolved instanceof NextResponse) return resolved;

    const { organizationId, profileType } = resolved;

    // Members cannot modify org data
    if (profileType === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert([
        {
          organization_id: organizationId,
          title: body.title,
          scheduled_at: body.scheduledAt,
          notes: body.notes,
          status: body.status || 'scheduled',
          calendly_url: body.calendlyUrl,
          color_tag: body.colorTag || 'erani-blue',
          audit_id: body.auditId || null,
          collection_id: body.collectionId || null,
          collaborators: body.collaborators || [],
          deadline: body.deadline || null,
          google_event_id: body.googleEventId || null,
          item_type: body.itemType || 'session'
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (err: any) {
    console.error("API Error creating session:", err);
    return NextResponse.json({ error: err.message || err.details || "Internal Server Error", raw: err }, { status: 500 });
  }
}

// PUT /api/sessions - Update session status for Kanban
export async function PUT(request: Request) {
  try {
    const resolved = await resolveOrgFromProfile(request);
    if (resolved instanceof NextResponse) return resolved;

    const { profileType } = resolved;
    if (profileType === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, notes, title, colorTag, auditId, collectionId, collaborators, deadline, googleEventId, itemType } = body;

    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;
    if (title) updatePayload.title = title;
    if (colorTag !== undefined) updatePayload.color_tag = colorTag;
    if (auditId !== undefined) updatePayload.audit_id = auditId;
    if (collectionId !== undefined) updatePayload.collection_id = collectionId;
    if (collaborators !== undefined) updatePayload.collaborators = collaborators;
    if (deadline !== undefined) updatePayload.deadline = deadline;
    if (googleEventId !== undefined) updatePayload.google_event_id = googleEventId;
    if (itemType !== undefined) updatePayload.item_type = itemType;

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (err: any) {
    console.error("API Error updating session:", err);
    return NextResponse.json({ error: err.message || err.details || "Internal Server Error", raw: err }, { status: 500 });
  }
}

// DELETE /api/sessions - Delete a session
export async function DELETE(request: Request) {
  try {
    const resolved = await resolveOrgFromProfile(request);
    if (resolved instanceof NextResponse) return resolved;

    const { profileType } = resolved;
    if (profileType === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

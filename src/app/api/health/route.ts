import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/health
 * Tests the Supabase backend connection using the server-side admin client.
 * Returns DB status, response time, and table counts.
 */
export async function GET() {
  const start = Date.now();

  try {
    // List tables by querying information_schema
    const { data: orgCount, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('count', { count: 'exact', head: true });

    const { data: prefCount, error: prefError } = await supabaseAdmin
      .from('user_preferences')
      .select('count', { count: 'exact', head: true });

    const { data: logsCount, error: logsError } = await supabaseAdmin
      .from('audit_logs')
      .select('count', { count: 'exact', head: true });

    const elapsed = Date.now() - start;

    if (orgError || prefError || logsError) {
      return NextResponse.json(
        {
          status: 'error',
          errors: {
            organizations: orgError?.message,
            user_preferences: prefError?.message,
            audit_logs: logsError?.message,
          },
          elapsed_ms: elapsed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      elapsed_ms: elapsed,
      schema_status: {
        organizations: "ready",
        user_preferences: "ready",
        audit_logs: "ready"
      },
      counts: {
        organizations: orgCount ?? 0,
        user_preferences: prefCount ?? 0,
        audit_logs: logsCount ?? 0
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: 'fatal',
        error: err instanceof Error ? err.message : 'Unknown error',
        elapsed_ms: Date.now() - start,
      },
      { status: 500 }
    );
  }
}

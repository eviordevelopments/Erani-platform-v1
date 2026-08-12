import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import AiSummaryEmail from '@/components/emails/AiSummaryEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

const parseAiSummary = (summaryText: string) => {
  if (!summaryText) return { executive: "Sin resumen disponible.", todos: [] };
  
  const parts = summaryText.split(/2\.\s*Tareas.*?:|To-Dos Asignados:/i);
  const executive = parts[0]?.replace(/1\.\s*Resumen\s*?:/i, '').trim() || summaryText;
  
  const todosRaw = parts[1] ? parts[1].trim() : "";
  const todos = todosRaw 
    ? todosRaw.split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().match(/^\d+\./)).map((line: string) => line.replace(/^-\s*|^\d+\.\s*/, '').trim())
    : [];
    
  return { executive, todos };
};

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("Missing RESEND_API_KEY. Emails will not be sent.");
      return NextResponse.json({ error: 'Configuración de correo no encontrada' }, { status: 500 });
    }

    // 1. Fetch the Session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*, organizations(name)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Error fetching session for notification:", sessionError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.ai_summary) {
      return NextResponse.json({ message: "No AI summary generated for this session yet" }, { status: 200 });
    }

    // 2. Determine recipients (collaborators + creator)
    const collaborators = session.collaborators || [];
    const creator = session.created_by;
    
    const userIds = new Set<string>();
    if (creator) userIds.add(creator);
    collaborators.forEach((id: string) => userIds.add(id));

    if (userIds.size === 0) {
      return NextResponse.json({ message: "No users to notify" }, { status: 200 });
    }

    // 3. Fetch emails from profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('id', Array.from(userIds));

    if (profilesError || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Failed to fetch user emails" }, { status: 500 });
    }

    const recipientEmails = profiles.map(p => p.email).filter(Boolean);

    // 4. Parse the AI Summary
    const { executive, todos } = parseAiSummary(session.ai_summary);
    const orgName = session.organizations?.name || 'ERANI';

    // 5. Render HTML
    const htmlContent = await render(AiSummaryEmail({
      sessionTitle: session.title,
      date: new Date(session.scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      executiveSummary: executive,
      todos: todos,
      organizationName: orgName,
      sessionUrl: 'https://platform.erani.mx/sessions'
    }) as React.ReactElement);

    // 6. Send Email
    const { data, error } = await resend.emails.send({
      from: 'Erani AI <notificaciones@platform.erani.mx>',
      to: recipientEmails,
      subject: `🤖 Hallazgos Forenses y Resumen: ${session.title}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Notify Summary Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

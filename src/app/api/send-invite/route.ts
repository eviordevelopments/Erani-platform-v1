import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import SessionInviteEmail from '@/components/emails/SessionInviteEmail';
import { render } from '@react-email/components';
import React from 'react';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      sessionTitle, 
      projectManagerName, 
      date, 
      meetLink, 
      notes, 
      projectName, 
      collaboratorEmails,
      rawDate,
      attendeesInfo,
      linkedTasks,
      isTask,
      inviterName,
      inviterRole,
      inviterAvatarUrl,
      organizationName
    } = body;

    if (!collaboratorEmails || collaboratorEmails.length === 0) {
      return NextResponse.json({ error: 'No collaborator emails provided' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("Missing RESEND_API_KEY. Emails will not be sent.");
      return NextResponse.json({ error: 'Configuración de correo no encontrada (Missing RESEND_API_KEY)' }, { status: 500 });
    }

    const htmlContent = await render(SessionInviteEmail({
      sessionTitle,
      projectManagerName,
      date,
      rawDate,
      meetLink,
      notes,
      projectName,
      attendeesInfo,
      linkedTasks,
      isTask,
      inviterName,
      inviterRole,
      inviterAvatarUrl,
      organizationName
    }) as React.ReactElement);

    const { data, error } = await resend.emails.send({
      from: 'ERANI Platform <notificaciones@platform.erani.mx>', // Usando el dominio verificado
      to: collaboratorEmails,
      subject: isTask ? `🎯 Nueva Tarea Asignada: ${sessionTitle} 🚀` : `📅 Convocatoria Estratégica: ${sessionTitle} 🚀`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

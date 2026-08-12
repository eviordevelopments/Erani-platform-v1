import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import SessionInviteEmail from '@/components/emails/SessionInviteEmail';
import { render } from '@react-email/components';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    const { operation, orgName, creatorName, creatorEmail } = await req.json();

    if (!operation || !operation.responsables || operation.responsables.length === 0) {
      return NextResponse.json({ message: "No responsables to notify" }, { status: 200 });
    }

    // Initialize Supabase with service role or anon key. Since we just read profiles, anon is fine if RLS allows it, 
    // but better to use auth header from request if needed. Actually we can just query using anon.
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get emails of responsables
    const { data: orgMembers, error: orgError } = await supabase
      .from('org_members')
      .select('id, email, profiles(full_name)')
      .in('id', operation.responsables);

    if (orgError) {
       console.error("Error fetching org members:", orgError);
       return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    if (!orgMembers || orgMembers.length === 0) {
       return NextResponse.json({ message: "No member emails found" }, { status: 200 });
    }

    const recipientEmails = orgMembers.map(m => m.email);

    // Render using official ERANI React-Email component
    const htmlContent = await render(SessionInviteEmail({
      sessionTitle: operation.title,
      projectManagerName: creatorName || 'Administrador',
      date: operation.deadline ? new Date(operation.deadline).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha límite',
      rawDate: operation.start_date || new Date().toISOString(),
      meetLink: 'https://platform.erani.mx/sessions',
      notes: `El estado de esta operación es: ${operation.status === 'in_progress' ? 'En Progreso' : operation.status === 'completed' ? 'Completado' : 'Por Hacer'}. Te invitamos a revisar la plataforma para más detalles y actualizar su avance en el tablero Kanban interactivo.`,
      projectName: orgName || 'Tu Workspace',
      isTask: false,
      isOperation: true,
      inviterName: creatorName || 'El Administrador',
      inviterRole: 'Líder de Operación',
      inviterAvatarUrl: 'https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/default-avatar.png',
      organizationName: orgName || 'ERANI',
    }) as React.ReactElement);

    const { data, error } = await resend.emails.send({
      from: 'Erani Platform <notificaciones@platform.erani.mx>',
      to: recipientEmails,
      subject: `⚡ Nueva Operación Asignada: ${operation.title} 🚀`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Notify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

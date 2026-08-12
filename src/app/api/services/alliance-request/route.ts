import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import AllianceRequestSalesEmail from '@/components/emails/AllianceRequestSalesEmail';
import AllianceConfirmationEmail from '@/components/emails/AllianceConfirmationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      companyName, 
      serviceName, 
      valueProposition, 
      contactName, 
      contactEmail, 
      contactPhone 
    } = data;

    // 1. Lookup Diego's ID from profiles
    const { data: diegoProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'diegoa182700@gmail.com')
      .single();
      
    const diegoId = diegoProfile?.id || null;

    // 2. Create a new session in the sessions table
    const { data: newSession, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        title: `Propuesta Alianza: ${companyName}`,
        description: `Propuesta de alianza para el servicio: ${serviceName}.\n\nPropuesta de Valor:\n${valueProposition}\n\nContacto:\n${contactName}\n${contactEmail}\n${contactPhone}`,
        status: 'pending',
        type: 'alliance',
        assignee_id: diegoId
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new Error('Failed to create alliance session');
    }

    const sessionLink = `https://erani.co/sessions/${newSession.id}`;

    // 3. Send Email to Sales
    const salesEmailHtml = await render(AllianceRequestSalesEmail({
      companyName,
      serviceName,
      valueProposition,
      contactName,
      contactEmail,
      contactPhone,
      sessionLink
    }));

    await resend.emails.send({
      from: 'Erani Platform <platform@erani.co>',
      to: ['diegoa182700@gmail.com', 'emilcastle2608@gmail.com'],
      subject: `🚀 Nueva Propuesta de Alianza: ${companyName}`,
      html: salesEmailHtml
    });

    // 4. Send Confirmation Email to the User
    const userEmailHtml = await render(AllianceConfirmationEmail({
      contactName,
      companyName,
      sessionLink
    }));

    await resend.emails.send({
      from: 'Erani Services+ <services@erani.co>',
      to: [contactEmail],
      subject: `Confirmación de Solicitud de Alianza - ERANI Services+`,
      html: userEmailHtml
    });

    return NextResponse.json({ success: true, sessionId: newSession.id });
  } catch (error: any) {
    console.error('Error processing alliance request:', error);
    return NextResponse.json(
      { error: 'Failed to process alliance request', details: error.message },
      { status: 500 }
    );
  }
}

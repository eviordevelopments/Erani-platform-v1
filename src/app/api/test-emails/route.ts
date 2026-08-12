import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import ActivationCodeEmail from '@/components/emails/ActivationCodeEmail';
import WelcomeEraniBetaEmail from '@/components/emails/WelcomeEraniBetaEmail';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function GET() {
  const customerEmail = 'eviordevelopments@gmail.com';
  const customerName = 'Emiliano Castillo';
  const activationCode = 'ERANI-TEST-1234';

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Missing RESEND_API_KEY in .env' }, { status: 500 });
    }

    // Fetch SLA PDF for attachment
    let attachments: any[] = [];
    try {
      const slaPdfRes = await fetch("https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/SLA_ERANI%20(2).pdf");
      if (slaPdfRes.ok) {
        const slaBuffer = Buffer.from(await slaPdfRes.arrayBuffer());
        attachments.push({
          filename: "SLA_Contrato_Servicios_Firmado_ERANI.pdf",
          content: slaBuffer
        });
      }
    } catch (attErr) {
      console.warn("Could not fetch SLA PDF for attachment:", attErr);
    }

    // 1. Send Activation Code with attached SLA PDF
    const { error: email1Error } = await resend.emails.send({
      from: 'ERANI Platform <no-reply@platform.erani.mx>',
      to: customerEmail,
      subject: 'Confirmación de Pago y Código de Activación - ERANI',
      react: ActivationCodeEmail({ customerName: customerName, activationCode: activationCode, amountPaid: "$1,490.00 MXN" }),
      attachments: attachments.length > 0 ? attachments : undefined
    });

    if (email1Error) {
      console.error('Email 1 error:', email1Error);
      return NextResponse.json({ error: 'Email 1 failed', details: email1Error }, { status: 500 });
    }

    // 2. Send Welcome Email
    const { error: email2Error } = await resend.emails.send({
      from: 'ERANI Platform <no-reply@platform.erani.mx>',
      to: customerEmail,
      subject: 'Prueba: Bienvenido al Futuro. Acceso a ERANI Beta.',
      react: WelcomeEraniBetaEmail({ customerName: customerName }),
    });

    if (email2Error) {
      console.error('Email 2 error:', email2Error);
      return NextResponse.json({ error: 'Email 2 failed', details: email2Error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Both emails sent successfully to eviordevelopments@gmail.com' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

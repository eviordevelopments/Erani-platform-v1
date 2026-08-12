import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import ActivationCodeEmail from '@/components/emails/ActivationCodeEmail';
import WelcomeEraniBetaEmail from '@/components/emails/WelcomeEraniBetaEmail';

// This is required to get the raw body for Stripe signature verification
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

const resend = new Resend(process.env.RESEND_API_KEY || '');

function generateEraniCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ERAN-${p1}-${p2}`;
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } else {
      // For local testing without secret
      event = JSON.parse(payload);
    }
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Retrieve customer details
    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerName = session.customer_details?.name || 'Cliente ERANI';
    const stripeSessionId = session.id;

    if (!customerEmail) {
      console.error('No customer email found in session.');
      return NextResponse.json({ error: 'No customer email' }, { status: 400 });
    }

    // Generate unique code
    const activationCode = generateEraniCode();

    try {
      // 1. Save to Supabase
      const { error: dbError } = await supabaseAdmin
        .from('activation_codes')
        .insert([{
          code: activationCode,
          email: customerEmail,
          customer_name: customerName,
          stripe_session_id: stripeSessionId,
          status: 'pending'
        }]);

      if (dbError) {
        console.error('Error saving to DB:', dbError);
        return NextResponse.json({ error: 'DB Insert Error' }, { status: 500 });
      }

      console.log(`Successfully generated and saved activation code for ${customerEmail}`);

      // 2. Send Emails via Resend (asynchronous / non-blocking)
      if (process.env.RESEND_API_KEY) {
        (async () => {
          try {
            // Fetch SLA PDF for email attachment
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

            // Send Activation Code & Payment Confirmation Email with SLA PDF attached
            const { error: email1Error } = await resend.emails.send({
              from: 'ERANI Platform <no-reply@platform.erani.mx>',
              to: customerEmail,
              subject: 'Confirmación de Pago y Código de Activación - ERANI',
              react: ActivationCodeEmail({ customerName: customerName, activationCode: activationCode, amountPaid: "$1,490.00 MXN" }),
              attachments: attachments.length > 0 ? attachments : undefined
            });

            if (email1Error) {
              console.error('Error sending Activation email:', email1Error);
            } else {
              console.log(`Activation Email sent successfully to ${customerEmail}`);
            }

            // Send Welcome to ERANI Beta Email
            const { error: email2Error } = await resend.emails.send({
              from: 'ERANI Platform <no-reply@platform.erani.mx>',
              to: customerEmail,
              subject: 'Bienvenido al Futuro. Acceso a ERANI Beta.',
              react: WelcomeEraniBetaEmail({ customerName: customerName }),
            });

            if (email2Error) {
              console.error('Error sending Welcome email:', email2Error);
            } else {
              console.log(`Welcome Email sent successfully to ${customerEmail}`);
            }
          } catch (emailErr: any) {
            console.error('Error dispatching emails via Resend:', emailErr?.message || emailErr);
          }
        })();
      } else {
        console.warn('RESEND_API_KEY not configured, skipping email dispatch.');
      }

    } catch (err: any) {
      console.error('Internal Error processing checkout:', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

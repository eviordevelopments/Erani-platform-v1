import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import CustomFlowEmail from '@/components/emails/CustomFlowEmail';
import CustomFlowUserConfirmationEmail from '@/components/emails/CustomFlowUserConfirmationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { userName, userEmail, projectId, projectName, operationDetails, automationId, automationName, description, nodes } = await request.json();

    // Formatear la descripción para incluir los nodos para el DB (ingeniería)
    const formattedDescription = nodes && nodes.length > 0 
      ? `Nodos requeridos: ${nodes.join(', ')}\n\n${description}`
      : description || '';

    // 1. Guardar en la base de datos (custom_flows)
    // El frontend enviará projectId y automationId si están vinculados.
    const { error: dbError } = await supabaseAdmin
      .from('custom_flows')
      .insert({
        user_email: userEmail || 'unknown',
        audit_id: projectId || null,
        automation_id: automationId || null,
        operation_type: operationDetails || 'Otra',
        description: formattedDescription,
        status: 'pending'
      });

    if (dbError) {
      console.error("Error saving custom flow to DB:", dbError);
      // No cortamos el flujo de correos si falla la DB, pero lo registramos.
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY no está configurada, simulando envío");
      return NextResponse.json({ success: true, simulated: true });
    }

    // 2. Enviar correo al equipo de Ventas / Ingeniería
    const salesEmails = ["diegoa182700@gmail.com", "emilcastle2608@gmail.com"];
    
    const { render } = await import('@react-email/components');
    
    const salesHtml = await render(CustomFlowEmail({
       userName: userName || "Usuario Desconocido",
       userEmail: userEmail || "Sin email",
       projectName: projectName || "Sin proyecto vinculado",
       operationDetails: operationDetails || "Sin operación vinculada",
       automationName: automationName || "Flujo Personalizado",
       description: description || "No se proveyó descripción",
       nodes: nodes || [],
    }));

    await resend.emails.send({
      from: 'ERANI Automations <notificaciones@platform.erani.mx>',
      to: salesEmails,
      subject: `Solicitud Ingeniería Flujo: ${automationName}`,
      html: salesHtml
    });

    // 3. Enviar correo de Confirmación al Usuario Solicitante
    if (userEmail) {
      const userHtml = await render(CustomFlowUserConfirmationEmail({
        userName: userName || "Usuario",
        automationName: automationName || "Flujo Personalizado",
      }));

      await resend.emails.send({
        from: 'ERANI Ingeniería <notificaciones@platform.erani.mx>',
        to: [userEmail],
        subject: `🚀 Confirmación de Solicitud de Ingeniería: Flujo ${automationName} ⚙️`,
        html: userHtml
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Custom Flow Notify Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

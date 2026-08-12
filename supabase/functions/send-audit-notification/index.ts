import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { emails, projectName, reportId, pdfUrl, orgName, orgLogo } = body;

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recipients provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'ERANI Platform <onboarding@resend.dev>',
      to: emails,
      subject: `🚨 [ALERTA] Inferencia Forense Completada: ${projectName} 📊`,
      html: `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #001220 0%, #0055A0 100%); padding: 50px 40px; text-align: center; border-bottom: 2px solid #9E80FF;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 25px;">
               <img src="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/eanilogo.png" alt="ERANI Platform" style="height: 45px;" />
               ${orgLogo ? `<span style="color: rgba(255,255,255,0.3); font-size: 24px;">×</span><img src="${orgLogo}" alt="${orgName}" style="height: 45px; border-radius: 8px; object-fit: contain;" />` : ''}
            </div>
            <h1 style="color: #ffffff; text-transform: uppercase; font-size: 28px; margin: 0; letter-spacing: 2px; font-weight: 900;">INFERENCIA FORENSE COMPLETADA</h1>
            <p style="color: #A3D5FF; font-size: 13px; margin-top: 12px; letter-spacing: 4px; text-transform: uppercase; font-weight: bold;">Protocolo de Auditoría Nivel 2</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 50px;">
            <h2 style="font-size: 22px; margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">Estimado Miembro de ${orgName || 'la Organización'},</h2>
            
            <p style="color: #cccccc; font-size: 16px; line-height: 1.8;">
              El <strong>Motor de Inteligencia Artificial ERANI</strong> ha finalizado de manera exitosa el rastreo de fugas de capital y vulnerabilidades operativas en su proyecto. Hemos consolidado métricas vitales que revelan el impacto financiero real a largo plazo, descubriendo los riesgos silenciosos que actualmente amenazan la rentabilidad de su modelo de negocio.
            </p>

            <div style="background-color: #111111; padding: 25px; border-left: 4px solid #9E80FF; margin: 35px 0; border-radius: 6px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
              <p style="margin: 0; font-size: 18px; color: #ffffff;"><strong>Proyecto Analizado:</strong> <span style="color: #A3D5FF;">${projectName}</span></p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;"><strong>ID de Sesión:</strong> ${reportId || "N/A"}</p>
            </div>

            <p style="color: #cccccc; font-size: 16px; margin-bottom: 45px; line-height: 1.8;">
              Tus datos han sido procesados bajo nuestros más estrictos protocolos de <em>Soberanía de Datos</em>. Puedes acceder al reporte ejecutivo consolidado en formato PDF descargable mediante el siguiente enlace seguro.
            </p>

            <div style="text-align: center;">
              <a href="${pdfUrl}" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #9E80FF 0%, #0055A0 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 50px; font-weight: 900; text-transform: uppercase; font-size: 15px; letter-spacing: 2px; box-shadow: 0 8px 25px rgba(158, 128, 255, 0.4); transition: transform 0.2s ease;">
                Descargar Reporte Forense
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #0A0A0A; padding: 45px; text-align: center; border-top: 1px solid #1a1a1a;">
            <p style="font-size: 16px; color: #888888; margin-bottom: 8px;">Saludos estratégicos,</p>
            <p style="font-size: 20px; color: #ffffff; font-weight: 900; margin-top: 0; margin-bottom: 40px; letter-spacing: -0.5px;">El Equipo de ERANI Platform</p>
            
            <div style="background-color: #111111; border: 1px solid #222; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: left;">
              <h4 style="color: #ffffff; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">¿Necesitas apoyo directo?</h4>
              
              <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #aaaaaa;">
                <p style="margin: 0;"><strong>Ventas:</strong> <a href="mailto:diegoa182700@gmail.com" style="color: #9E80FF; text-decoration: none;">diegoa182700@gmail.com</a></p>
                <p style="margin: 0;"><strong>Soporte Técnico:</strong> <a href="mailto:emilcastle2608@gmail.com" style="color: #9E80FF; text-decoration: none;">emilcastle2608@gmail.com</a> | +52 462 307 1972</p>
              </div>
              
              <div style="margin-top: 20px; font-size: 12px; color: #888888; line-height: 1.8;">
                <p style="margin: 0;">
                  <a href="#" style="color: #A3D5FF; text-decoration: none;">LinkedIn</a> | 
                  <a href="#" style="color: #A3D5FF; text-decoration: none;">Instagram</a> | 
                  <a href="#" style="color: #A3D5FF; text-decoration: none;">Facebook</a>
                </p>
                <p style="margin: 0;"><a href="mailto:contacto@erani.mx" style="color: #9E80FF; text-decoration: none;">contacto@erani.mx</a> | +52 462 400 4066</p>
                <p style="margin: 5px 0 0 0;">Irapuato, Guanajuato, México</p>
              </div>
            </div>
            
            <div style="margin-bottom: 25px;">
              <a href="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/T&C_ERANI.pdf" target="_blank" style="color: #9E80FF; font-size: 12px; text-decoration: underline; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Términos y Condiciones</a>
              <span style="color: #444; margin: 0 10px;">|</span>
              <a href="https://erani.mx" target="_blank" style="color: #9E80FF; font-size: 12px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">erani.mx</a>
            </div>

            <p style="font-size: 10px; color: #555555; text-transform: uppercase; letter-spacing: 1px; line-height: 1.6; text-align: justify; margin-bottom: 15px;">
              <strong>Aviso legal:</strong> ERANI es una herramienta de análisis de datos financieros y operativos. Toda la información procesada es confidencial. Este mensaje y cualquier archivo adjunto son para uso exclusivo del destinatario.
            </p>
            <p style="font-size: 11px; color: #666666; font-weight: bold; letter-spacing: 0.5px;">
              © 2026 Erani Financial Systems. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

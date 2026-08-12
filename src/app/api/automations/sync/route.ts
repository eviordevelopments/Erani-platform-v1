import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { organizationId } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json({ error: "Falta organizationId" }, { status: 400 });
    }

    // 1. Obtener todas las sesiones con ai_summary para esta organización
    const { data: sessions, error: sessionsErr } = await supabaseAdmin
      .from('sessions')
      .select('id, title, ai_summary')
      .eq('organization_id', organizationId)
      .not('ai_summary', 'is', null);

    if (sessionsErr || !sessions || sessions.length === 0) {
      // Si no hay sesiones con IA aún, inyectamos 3 flujos forenses de demostración
      // para que el Marketplace no esté vacío tras la limpieza de la base de datos.
      const fallbackAutomations = [
        {
          organization_id: organizationId,
          name: "Detección de Fugas en Nómina",
          description: "Cruza datos del SAT con el sistema de nómina (Aspel/Contpaqi) para detectar empleados fantasma o pagos duplicados.",
          category: "forense",
          status: "inactive",
          roi_projection: 145,
          hours_saved_monthly: 40,
          coi_recovery_amount: 150000,
          fuga_name: "Discrepancia de Nómina"
        },
        {
          organization_id: organizationId,
          name: "Conciliación Bancaria IA",
          description: "Descarga estados de cuenta y los concilia con facturas emitidas y recibidas. Alerta sobre cobros no identificados.",
          category: "financiera",
          status: "inactive",
          roi_projection: 320,
          hours_saved_monthly: 120,
          coi_recovery_amount: 45000,
          fuga_name: "Comisiones y Cobros Ocultos"
        },
        {
          organization_id: organizationId,
          name: "Auditoría de Proveedores API",
          description: "Verifica automáticamente el estatus fiscal de proveedores ante el SAT (Listas Negras) antes de autorizar pagos.",
          category: "operativa",
          status: "active",
          roi_projection: 80,
          hours_saved_monthly: 25,
          coi_recovery_amount: 500000,
          fuga_name: "Riesgo EFOS/EDOS"
        }
      ];

      // Verificamos si ya existen estos mocks para no duplicarlos
      const { data: existingMocks } = await supabaseAdmin
         .from('automations')
         .select('id')
         .eq('organization_id', organizationId)
         .is('source_session_id', null);

      if (!existingMocks || existingMocks.length === 0) {
         await supabaseAdmin.from('automations').insert(fallbackAutomations);
         return NextResponse.json({ success: true, inserted: 3, note: "Loaded default automations" });
      }

      return NextResponse.json({ success: true, inserted: 0, note: "No AI sessions found" });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
       return NextResponse.json({ error: "No OPENROUTER_API_KEY configurada" }, { status: 500 });
    }

    let insertedCount = 0;

    // 2. Por cada sesión que no tenga automatizaciones vinculadas, analizamos y guardamos
    for (const session of sessions) {
       // Check if automations already exist for this session
       const { data: existing } = await supabaseAdmin
         .from('automations')
         .select('id')
         .eq('source_session_id', session.id);
       
       if (existing && existing.length > 0) continue; // Ya procesado

       // Pedir a Llama (o Gemini vía OpenRouter) que extraiga automatizaciones y fugas
       const prompt = `Analiza este resumen de sesión:\n\n${session.ai_summary}\n\nActúa como un ingeniero de automatización forense. Detecta si hay fugas de dinero (Costo de Inacción - COI) y recomienda 1 o 2 automatizaciones de flujo para resolverlo. DEVUELVE ESTRICTAMENTE UN ARREGLO JSON EMPEZANDO CON [ Y TERMINANDO CON ], SIN NADA MÁS ALREDEDOR, NI MARKDOWN NI EXPLICACIONES:\n[{"name": "Nombre de Automatización", "description": "Breve descripción", "category": "forense", "roi_projection": 100, "hours_saved_monthly": 10, "coi_recovery_amount": 5000, "fuga_name": "Nombre fuga"}]`;

       try {
         const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
           method: "POST",
           headers: {
             "Authorization": `Bearer ${openRouterKey}`,
             "Content-Type": "application/json"
           },
           body: JSON.stringify({
             model: "meta-llama/llama-3-8b-instruct:free",
             messages: [{ role: "user", content: prompt }]
           })
         });

         if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = aiData.choices[0].message.content;
            
            // Clean up possible markdown code blocks
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
               const parsedAutomations = JSON.parse(jsonMatch[0]);
               for (const auto of parsedAutomations) {
                  const { error: insertErr } = await supabaseAdmin
                    .from('automations')
                    .insert({
                       organization_id: organizationId,
                       source_session_id: session.id,
                       name: auto.name || "Flujo Generado por IA",
                       description: auto.description || "Sin descripción",
                       category: auto.category || "operativa",
                       status: "inactive",
                       roi_projection: auto.roi_projection || 0,
                       hours_saved_monthly: auto.hours_saved_monthly || 0,
                       coi_recovery_amount: auto.coi_recovery_amount || 0,
                       fuga_name: auto.fuga_name || "Fuga no especificada"
                    });
                  if (!insertErr) insertedCount++;
               }
            }
         }
       } catch (aiErr) {
         console.error("Error analyzing session for automations:", session.id, aiErr);
       }
    }

    return NextResponse.json({ success: true, inserted: insertedCount });
  } catch (err: any) {
    console.error("Error en Sync Automations:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

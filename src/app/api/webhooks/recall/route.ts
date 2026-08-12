import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Recall envía varios eventos (bot.joining, bot.recording, bot.done, etc)
    // Solo nos importa cuando terminó de transcribir todo
    if (payload.event !== 'bot.status_change') {
      return NextResponse.json({ received: true });
    }

    const botData = payload.data;
    if (botData.status.code !== 'done') {
      return NextResponse.json({ received: true, status: botData.status.code });
    }

    const sessionId = botData.metadata?.session_id;
    if (!sessionId) {
      console.error("Recall webhook: No session_id found");
      return NextResponse.json({ error: 'Falta metadato de sesión' }, { status: 400 });
    }

    // 1. Obtener la transcripción final directo de la API de Recall
    const recallApiKey = process.env.RECALL_API_KEY;
    const transcriptRes = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botData.id}/transcript`, {
      headers: { 'Authorization': `Token ${recallApiKey}` }
    });
    const transcriptData = await transcriptRes.json();
    
    // 2. Formatear la transcripción
    let fullTranscript = "";
    if (Array.isArray(transcriptData)) {
       fullTranscript = transcriptData.map((t: any) => `[${t.speaker || 'Speaker'}]: ${t.text || t.words?.map((w:any)=>w.text).join('')}`).join('\n');
    } else {
       fullTranscript = JSON.stringify(transcriptData);
    }

    if (!fullTranscript || fullTranscript.trim() === "") fullTranscript = "No se detectó voz o la transcripción está vacía.";

    // 3. Procesar Resumen y To-Dos con Llama-3 en OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    let finalSummary = "No se pudo generar el resumen (falta OPENROUTER_API_KEY).";
    
    if (openRouterKey) {
       const prompt = `Analiza la siguiente transcripción exacta de una junta forense:\n\n${fullTranscript}\n\nPor favor, responde estructurado de esta manera y en español:\n1. Resumen: (Un resumen ejecutivo directo de qué se trató la junta)\n2. Tareas / To-Dos Asignados: (Una lista con guiones de todas las tareas mencionadas y a quién le tocan, si se dijo).`;
       
       const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${openRouterKey}`,
           "Content-Type": "application/json",
           "HTTP-Referer": "https://platform.erani.mx",
           "X-Title": "Erani Platform"
         },
         body: JSON.stringify({
           model: "meta-llama/llama-3-8b-instruct:free",
           messages: [{ role: "user", content: prompt }]
         })
       });

       if (aiRes.ok) {
          const aiData = await aiRes.json();
          finalSummary = aiData.choices[0].message.content;
       }
    }

    // 4. Guardar transcripción como notas y el análisis IA como resumen
    await supabaseAdmin
      .from('sessions')
      .update({ 
         notes: fullTranscript, 
         ai_summary: finalSummary 
      })
      .eq('id', sessionId);

    // 5. Enviar correo automáticamente a los colaboradores
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.erani.mx';
      await fetch(`${baseUrl}/api/sessions/notify-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (notifyErr) {
      console.error("Error triggering notify-summary:", notifyErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error en Webhook Recall:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

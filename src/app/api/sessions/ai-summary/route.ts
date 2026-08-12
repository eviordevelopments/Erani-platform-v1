import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await request.json();

    // Fetch session details
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('title, notes, ai_summary')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (!sessionData.notes) return NextResponse.json({ error: 'La sesión no tiene notas para resumir' }, { status: 400 });

    // Call OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey || openRouterKey === "") {
        return NextResponse.json({ error: 'OPENROUTER_API_KEY no está configurada en .env.local' }, { status: 500 });
    }

    const prompt = `Por favor genera un resumen ejecutivo profesional y accionable (máximo 2 párrafos y unos bullet points) basado en estas notas de la sesión "${sessionData.title}":\n\n${sessionData.notes}\n\nResponde en español y ve directo al punto, omite preámbulos.`;

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://platform.erani.mx",
        "X-Title": "Erani Platform"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct:free", // Open-source free model
        messages: [
          { role: "system", content: "Eres un asistente experto de project management forense. Tu objetivo es resumir actas de reuniones." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!openRouterRes.ok) {
      throw new Error("Error comunicándose con OpenRouter AI");
    }

    const aiData = await openRouterRes.json();
    const summary = aiData.choices[0].message.content;

    // Update Session
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({ ai_summary: summary })
      .eq('id', sessionId);
      
    if (updateError) throw updateError;

    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

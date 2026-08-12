import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { sessionId, meetingUrl } = await request.json();
    if (!meetingUrl) return NextResponse.json({ error: 'Se requiere el link de Google Meet' }, { status: 400 });

    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) return NextResponse.json({ error: 'RECALL_API_KEY no configurada' }, { status: 500 });

    // Petición a Recall.ai para enviar el bot
    const botRes = await fetch('https://us-west-2.recall.ai/api/v1/bot', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${recallApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        bot_name: "ERANI AI",
        metadata: { session_id: sessionId } // Guardamos el ID de la sesión para reconocerlo después
      })
    });

    if (!botRes.ok) {
      const errText = await botRes.text();
      throw new Error(`Error de Recall: ${errText}`);
    }

    const botData = await botRes.json();
    
    // Guardamos el ID del bot en la base de datos
    await supabaseAdmin
      .from('sessions')
      .update({ recall_bot_id: botData.id })
      .eq('id', sessionId);

    return NextResponse.json({ success: true, bot: botData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

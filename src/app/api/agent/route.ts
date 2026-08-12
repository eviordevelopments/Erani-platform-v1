import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const maxDuration = 120; // Allow 2 minutes for deep thinking modes

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[API Agent] Received payload:", JSON.stringify(payload, null, 2));
    const {
      messages,
      model,
      mode,
      projectId,
      organizationId,
      temperature,
      maxTokens,
      userName,
      customSystemPrompt,
      customFilesContext,
    } = payload;

    // Detect if the user asked for a chart or visual diagram in their prompt
    const lastMsgObj = messages[messages.length - 1];
    const lastMsgText = typeof lastMsgObj?.content === 'string' 
      ? lastMsgObj.content 
      : Array.isArray(lastMsgObj?.content) 
        ? lastMsgObj.content.map((p: any) => p.text || '').join(' ') 
        : '';

    const isChartRequested = mode === "Create" || /gr[aá]fic|chart|diagrama|dibuja|dashboard|visualiz|plot|representa/i.test(lastMsgText);

    // 1. Base System Prompt
    let systemPrompt = "Eres ERANI, el Agente Forense de Inteligencia Artificial más avanzado. Analizas datos financieros, operativos y estructurales para encontrar fugas de capital y riesgos sistémicos. Tu tono es sumamente profesional, analítico, corporativo y preciso.";

    // 2. Personalization: User Name
    if (userName && typeof userName === 'string' && userName.trim()) {
      systemPrompt += `\n\nATENCIÓN DE USUARIO: El usuario con el que interactúas se llama "${userName.trim()}". Dirígete a él por su nombre de forma profesional y personalizada cuando corresponda.`;
    }

    // 3. Global Chart Generation Rules & Capabilities (MANDATORY FOR ERANI)
    systemPrompt += `\n\n[CAPACIDAD INTEGRADA DE GENERACIÓN DE GRÁFICAS E INTERFACES VISUALES]
REGLA STRICTA Y ABSOLUTA: TÚ SÍ TIENES LA CAPACIDAD TÉCNICA INTEGRADA DE GENERAR GRÁFICAS Y DASHBOARDS VISUALES EN LA INTERFAZ DEL USUARIO.
JAMÁS RESPONDAS CON FRASES COMO "No puedo generar gráficas", "No puedo crear imágenes", "No tengo la capacidad de graficar" O "Como modelo de texto...". ESTÁ TOTALMENTE PROHIBIDO NEGARTE A GENERAR GRÁFICAS.

CÓMO DEBES GENERAR LA GRÁFICA PARA QUE APAREZCA EN LA INTERFAZ DEL USUARIO:
Para construir e ilustrar una gráfica animada en vivo en la pantalla del usuario, DEBES emitir en tu respuesta un bloque de código Markdown marcado con la palabra 'chart' conteniendo un objeto JSON válido con los datos de la gráfica. El motor frontend de ERANI capturará este JSON y renderizará automáticamente la gráfica interactiva en pantalla.

ESTRUCTURA DEL BLOQUE CHART (OBLIGATORIO):
\`\`\`chart
{
  "type": "bar",
  "title": "Comparativa de Fugas Financieras por Departamento",
  "data": [
    { "name": "Tecnología", "fuga": 168000, "umbral": 120000 },
    { "name": "Diseño", "fuga": 95000, "umbral": 120000 },
    { "name": "Operaciones", "fuga": 210000, "umbral": 120000 }
  ]
}
\`\`\`

Tipos de gráfica soportados para "type":
- "bar": Para comparativas de categorías o montos.
- "line": Para tendencias, evolución temporal o líneas de tiempo (ej. tendencias de 3 años, meses, etc.).
- "pie": Para distribuciones porcentuales o de participación.

REGLA DE FORMATO DE EJES: Usa la clave "name" para las etiquetas del eje X (ejemplo: "name": "Año 1", "name": "Año 2", "name": "Año 3" o "name": "2022", "name": "2023", "name": "2024"). Usa únicamente nombres de métricas numéricas para las series en el eje Y (ejemplo: "fuga": 100000, "fuga": 50000, "fuga": 25000). NO uses "year": 1 como clave numérica secundaria.`;

    if (isChartRequested) {
      systemPrompt += `\n\n⚠️ ALERTA DE SOLICITUD DE GRÁFICA / MODO CREAR: El usuario ha solicitado una gráfica/visualización o estás en Modo Crear. ES OBLIGATORIO QUE TU RESPUESTA INCLUYA AL MENOS UN BLOQUE \`\`\`chart CON DATOS RELEVANTES O ESTIMADOS SEGÚN EL CONTEXTO Y LA CONVERSACIÓN. GENERAR LA GRÁFICA ES REQUISITO INDISPENSABLE EN ESTA RESPUESTA.`;
    }

    // 4. Mode-Specific Behavior
    if (mode === "Create") {
      systemPrompt += `\n\n[MODO CREAR ACTIVADO - GENERADOR DE DASHBOARDS Y GRÁFICAS]
Tu objetivo principal en este modo es CREAR visualizaciones, dashboards, gráficas interactivas y tablas analíticas detalladas para el usuario.`;
    } else if (mode === "Deep Thinking") {
      systemPrompt += "\n\n[MODO RAZONAMIENTO PROFUNDO ACTIVADO]\nANTES de responder al usuario, debes realizar un análisis profundo paso a paso pensando en voz alta. Utiliza el siguiente bloque al inicio de tu respuesta para tu razonamiento interno:\n<thought>\n[Tu proceso de pensamiento lógico paso a paso aquí]\n</thought>\nLuego, da tu respuesta final estructurada de forma impecable.";
    } else {
      systemPrompt += "\n\n[MODO ANALIZAR ACTIVADO]\nOfrece diagnósticos forenses directos, análisis de riesgos y soluciones ejecutivas inmediatas.";
    }

    // 4. Custom User Prompt / Directives
    if (customSystemPrompt && typeof customSystemPrompt === 'string' && customSystemPrompt.trim()) {
      systemPrompt += `\n\nINSTRUCCIONES Y REGLAS PERSONALIZADAS DE LA EMPRESA (ALTA PRIORIDAD):\n${customSystemPrompt.trim()}`;
    }

    // 5. Custom Corporate Knowledge Base Files Context
    if (customFilesContext && typeof customFilesContext === 'string' && customFilesContext.trim()) {
      systemPrompt += `\n\nCONOCIMIENTO CORPORATIVO Y DOCUMENTOS DE LA EMPRESA:\n${customFilesContext.trim()}\n(Utiliza esta información oficial para responder las consultas del usuario de forma precisa).`;
    }

    // 6. Fetch Context from Project (if provided)
    if (projectId && projectId !== "project_default") {
      const { data: project } = await supabaseAdmin
        .from('audits')
        .select('metadata')
        .eq('id', projectId)
        .single();
        
      if (project && project.metadata) {
        systemPrompt += `\n\nCONTEXTO DEL PROYECTO ACTUAL (ID: ${projectId}):\nMetadata del Proyecto: ${JSON.stringify(project.metadata, null, 2)}\n(Utiliza esta información para contextualizar tu análisis).`;
      }
    }

    // Enforce OpenRouter Model routing
    let targetModel = model || "meta-llama/llama-3.1-8b-instruct";

    // Standardize to valid OpenRouter strings
    if (targetModel.toLowerCase().includes("gemini-3") || targetModel.toLowerCase().includes("gemini-2")) {
      targetModel = "google/gemini-3.5-flash";
    } else if (targetModel.toLowerCase().includes("gemini")) {
      targetModel = "google/gemini-3.5-flash";
    } else if (targetModel.toLowerCase().includes("claude-3-5") || targetModel.toLowerCase().includes("claude-3.5")) {
      targetModel = "anthropic/claude-sonnet-4-5";
    } else if (targetModel.toLowerCase().includes("claude")) {
      targetModel = "anthropic/claude-3-haiku";
    } else if (targetModel.toLowerCase().includes("llama")) {
      targetModel = "meta-llama/llama-3.1-8b-instruct";
    } else if (targetModel.toLowerCase().includes("grok")) {
      targetModel = "x-ai/grok-4.5";
    } else if (targetModel.toLowerCase().includes("gpt-4o")) {
      targetModel = "openai/gpt-4o";
    } else {
      targetModel = "meta-llama/llama-3.1-8b-instruct";
    }

    console.log("TARGET MODEL:", targetModel);

    // Normalize messages to ensure they are standard CoreMessages with STRING content
    const formattedMessages = messages.map((msg: any) => {
      let content = msg.content;
      
      if (Array.isArray(content)) {
        content = content.map((p: any) => p.text || '').join('\n');
      }
      
      if (!content && msg.parts && Array.isArray(msg.parts)) {
        content = msg.parts.map((p: any) => p.text || '').join('\n');
      }
      
      return {
        role: msg.role || 'user',
        content: typeof content === 'string' ? content : ''
      };
    });

    const parsedTemp = typeof temperature === 'number' ? Math.max(0, Math.min(1, temperature)) : 0.2;
    const parsedMaxTokens = typeof maxTokens === 'number' ? Math.max(100, Math.min(8000, maxTokens)) : 2000;

    const result = await streamText({
      model: openrouter(targetModel),
      system: systemPrompt,
      messages: formattedMessages,
      temperature: parsedTemp,
      maxTokens: parsedMaxTokens,
    } as any);

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Agent Stream Error:', error);
    return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
  }
}

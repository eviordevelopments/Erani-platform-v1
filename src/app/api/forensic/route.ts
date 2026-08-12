/**
 * ERANI Forensic Audit API Route
 *
 * Handles multipart file uploads from the Audit Protocol page.
 * Pipeline:
 *   1. Parse multipart form (files + project config)
 *   2. If allowStorage=true  → vectorize files → upsert to Supabase → similarity search for history
 *   3. If allowStorage=false → send raw text directly to Gemini
 *   4. Call Gemini 2.5 Flash with structured output schema
 *   5. Return ForensicReport JSON to frontend
 */

import { NextResponse }    from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { SYSTEM_PROMPT_FORENSIC } from "@/lib/gemini";
import { supabaseAdmin }   from "@/lib/supabaseAdmin";
import { extractTextFromFile } from "@/lib/rag";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ── OpenRouter fallback & direct helper ────────────────────────────────────
// Uses OpenRouter's OpenAI-compatible API (for fallbacks or direct model requests).
async function callOpenRouter(systemPrompt: string, userText: string, modelName: string = "deepseek/deepseek-chat"): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY no configurada en .env.local");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://erani.ai",
      "X-Title": "ERANI Forensic Engine"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userText }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 8192
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "{}";
}

export const maxDuration = 300; // Allow up to 5 minutes for long forensic analyses

// ── Types ──────────────────────────────────────────────────────────────────
export type AuditStage = 
  | "METADATA_PARSING"
  | "RAG_RETRIEVAL"
  | "MODEL_INIT"
  | "GEMINI_INFERENCE"
  | "OPENROUTER_INFERENCE"
  | "REPORT_PERSISTENCE"
  | "COMPLETED"
  | "ERROR";

// ── Server-side Clients ───────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use supabaseAdmin (service role) for all DB operations — bypasses RLS.
// Auth is validated separately via auth.getUser() with the anon/cookie client.
const supabase = supabaseAdmin;

// ── Auth helper ───────────────────────────────────────────────────────────
/**
 * Resolves the authenticated user's organization_id and profile_type from
 * the `profiles` table. Validates the JWT from the Authorization header.
 * Returns a NextResponse error on failure.
 */
async function resolveOrgFromProfile(
  request: Request
): Promise<
  | { userId: string; organizationId: string; profileType: string }
  | NextResponse
> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id, profile_type")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 401 });
  }

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    profileType: profile.profile_type,
  };
}

// ── Gemini Response Schema ─────────────────────────────────────────────────
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    report_metadata: {
      type: SchemaType.OBJECT,
      properties: {
        project_name: { type: SchemaType.STRING },
        audit_date:   { type: SchemaType.STRING },
        auditor_id:   { type: SchemaType.STRING },
        version:      { type: SchemaType.STRING },
        model_used:   { type: SchemaType.STRING },
      },
      required: ["project_name", "audit_date"],
    },
    slide_1_impacto_directo: {
      type: SchemaType.OBJECT,
      properties: {
        fuga_confirmada_mxn:             { type: SchemaType.NUMBER },
        riesgo_latente_mensual_mxn:      { type: SchemaType.NUMBER },
        desviacion_scope_creep_pct:      { type: SchemaType.NUMBER },
        punto_conciencia_rentabilidad_mxn: { type: SchemaType.NUMBER },
        coi_anual_mxn:                   { type: SchemaType.NUMBER },
      },
      required: [
        "fuga_confirmada_mxn",
        "riesgo_latente_mensual_mxn",
        "desviacion_scope_creep_pct",
        "punto_conciencia_rentabilidad_mxn",
        "coi_anual_mxn",
      ],
    },
    slide_2_analisis_forense: {
      type: SchemaType.OBJECT,
      properties: {
        top_5_tickets: {
          type: SchemaType.ARRAY,
          description: "Lista de los EXACTAMENTE 5 tickets con mayor costo invisible detectado. NO REPETIR.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              ticket_id:          { type: SchemaType.STRING },
              descripcion:        { type: SchemaType.STRING },
              filtro:             { type: SchemaType.STRING },
              hrs_calc:           { type: SchemaType.NUMBER },
              costo_invisible_mxn: { type: SchemaType.NUMBER },
            },
            required: ["ticket_id", "descripcion", "filtro", "hrs_calc", "costo_invisible_mxn"],
          },
        },
        resumen_consolidacion: {
          type: SchemaType.OBJECT,
          properties: {
            otros_tickets_cantidad:    { type: SchemaType.NUMBER },
            otros_tickets_monto_mxn:   { type: SchemaType.NUMBER },
            fuga_externa_mxn:          { type: SchemaType.NUMBER },
            fuga_interna_mxn:          { type: SchemaType.NUMBER },
            total_conciliado_monto_mxn: { type: SchemaType.NUMBER },
            estado_inventario_desc:    { type: SchemaType.STRING },
          },
          required: [
            "fuga_externa_mxn",
            "fuga_interna_mxn",
            "total_conciliado_monto_mxn",
            "estado_inventario_desc",
          ],
        },
      },
      required: ["top_5_tickets", "resumen_consolidacion"],
    },
    slide_3_kpis_salud: {
      type: SchemaType.OBJECT,
      properties: {
        monitor_bucle_pct:          { type: SchemaType.NUMBER },
        indice_friccion_pct:        { type: SchemaType.NUMBER },
        dark_data_index_pct:        { type: SchemaType.NUMBER },
        intensidad_scope_creep_pct: { type: SchemaType.NUMBER },
        analisis_ceguera_operativa: { type: SchemaType.STRING },
      },
      required: [
        "monitor_bucle_pct",
        "indice_friccion_pct",
        "dark_data_index_pct",
        "intensidad_scope_creep_pct",
        "analisis_ceguera_operativa",
      ],
    },
    slide_4_estrategia_firewall: {
      type: SchemaType.OBJECT,
      properties: {
        protocolos_bloqueo:    { type: SchemaType.STRING },
        roi_dias:              { type: SchemaType.NUMBER },
        proyeccion_margen_pct: { type: SchemaType.NUMBER },
      },
      required: ["protocolos_bloqueo", "roi_dias", "proyeccion_margen_pct"],
    },
    slide_5_anexo_sustento: {
      type: SchemaType.OBJECT,
      properties: {
        frameworks: { 
          type: SchemaType.ARRAY, 
          description: "Lista de 3-5 frameworks (David Baker, SODA, etc.)",
          items: { type: SchemaType.STRING } 
        },
        glosario:   { 
          type: SchemaType.ARRAY, 
          description: "Glosario de 3-5 términos clave.",
          items: { type: SchemaType.STRING } 
        },
      },
      required: ["frameworks", "glosario"],
    },
    anexo_tecnico: {
      type: SchemaType.OBJECT,
      properties: {
        metodologia_inferencia: { type: SchemaType.STRING },
        vectores_auditados:     { 
          type: SchemaType.ARRAY, 
          description: "Lista de máximo 5 vectores clave analizados. NO REPETIR.",
          items: { type: SchemaType.STRING } 
        },
      },
      required: ["metodologia_inferencia", "vectores_auditados"],
    },
  },
  required: [
    "report_metadata",
    "slide_1_impacto_directo",
    "slide_2_analisis_forense",
    "slide_3_kpis_salud",
    "slide_4_estrategia_firewall",
    "slide_5_anexo_sustento",
    "anexo_tecnico",
  ],
};

// ── Route Handler ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // ── Auth: resolve organization from authenticated user's profile ──────
    const resolved = await resolveOrgFromProfile(request);
    if (resolved instanceof NextResponse) return resolved;

    const { organizationId: authOrgId, profileType } = resolved;

    // Members cannot modify org data (write operations)
    if (profileType === "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    const { searchParams } = new URL(request.url);
    let action = searchParams.get("action");

    // ── 1. Common Metadata ────────────────────────────────────────────────
    // organizationId is always derived from the authenticated profile — never
    // from client-supplied form data.
    let organizationId   = authOrgId;
    let projectId        = "project_default";
    let allowStorage     = true;
    let historicalContext = false;
    let aiModel          = "gemini-2.5-flash"; 
    let aiTemperature    = 0.4;
    let isTemporal       = false;
    let combinedText      = "";

    // Parse Body/FormData only once
    let formData: FormData | null = null;
    let bodyJson: any = null;

    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      action = action || (formData.get("action") as string);
    } else if (contentType.includes("application/json")) {
      bodyJson = await request.json().catch(() => ({}));
      action = action || bodyJson.action;
    }

    action = action || "analyze"; // Default fallback

    console.log(`[Forensic API] Action: ${action}, Content-Type: ${contentType}`);

    // Utility for retrying Supabase operations
    const retrySupabase = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
      let lastError = null;
      for (let i = 0; i < retries; i++) {
        try {
          const result = await fn();
          if (!result.error) return result;
          lastError = result.error;
          console.warn(`[SUPABASE_RETRY] Attempt ${i + 1} failed: ${lastError.message}`);
        } catch (e: any) {
          lastError = e;
          console.warn(`[SUPABASE_RETRY] Exception on attempt ${i + 1}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
      return { data: null, error: lastError };
    };

    // ── 2. Handle Action: ANALYZE ─────────────────────────────────────────
    if (action === "analyze") {
      let currentStage: AuditStage = "METADATA_PARSING";
      console.log(`[Forensic API] Starting ANALYSIS flow...`);

      try {
        if (bodyJson) {
          projectId         = bodyJson.projectId         ?? projectId;
          allowStorage      = bodyJson.allowStorage      ?? true;
          historicalContext = bodyJson.historicalContext ?? false;
          aiModel           = bodyJson.aiModel           ?? "gemini-2.5-flash";
          aiTemperature     = bodyJson.aiTemperature     ?? 0.4;
          isTemporal        = bodyJson.isTemporal        ?? false;
          combinedText      = bodyJson.rawData           ?? "";
        } else if (formData) {
          projectId         = (formData.get("projectId")         as string) || projectId;
          allowStorage      = formData.get("allowStorage")      === "true";
          historicalContext = formData.get("historicalContext") === "true";
          aiModel           = (formData.get("aiModel")           as string) || "gemini-2.5-flash";
          aiTemperature     = parseFloat((formData.get("aiTemperature") as string) || "0.4");
          isTemporal        = formData.get("isTemporal")       === "true";
          combinedText      = (formData.get("rawData")          as string) || "";
        }

        const debugLog = (msg: string) => {
          console.log(msg);
          fs.appendFileSync('/tmp/forensic.log', msg + '\\n');
        };

        debugLog(`[ANALYSIS] Params: Model=${aiModel}, Temp=${aiTemperature}, Storage=${allowStorage}, Historical=${historicalContext}`);

        // --- STAGE 1: FILE PREPARATION & GEMINI FILE API ---
        currentStage = "METADATA_PARSING";
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
        const tempFilesToClean: string[] = [];
        const uploadedGeminiFiles: any[] = [];
        const fileParts: any[] = [];

        // 1. Process Supabase Storage paths
        const filePathsRaw = formData?.get("filePaths");
        const filePaths: string[] = filePathsRaw ? JSON.parse(filePathsRaw as string) : [];
        debugLog(`[STORAGE] filePaths length: ${filePaths.length}`);

        // 2. Process inline files (fallback)
        const inlineFiles = formData?.getAll("files") || [];

        // Also extract text from each file for OpenRouter fallback (chat-based, no File API)
        const extractedTexts: string[] = [];

        const processBuffer = async (buffer: Buffer, originalName: string) => {
          const ext = originalName.split('.').pop()?.toLowerCase() || 'dat';
          let tempPath = path.join(os.tmpdir(), `${Date.now()}_${Math.random().toString(36).substring(7)}`);
          let mimeType = 'text/plain';

          // Always extract text for OpenRouter fallback
          const parsed = await extractTextFromFile(buffer, originalName);
          if (parsed.text) extractedTexts.push(`--- ${originalName} ---\n${parsed.text}`);

          if (ext === 'xlsx' || ext === 'xls') {
            // Gemini File API doesn't support XLSX natively. Extract text and upload as CSV/TXT.
            tempPath += '.txt';
            fs.writeFileSync(tempPath, parsed.text);
          } else {
            tempPath += `.${ext}`;
            fs.writeFileSync(tempPath, buffer);
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (ext === 'csv') mimeType = 'text/csv';
            else if (ext === 'json') mimeType = 'application/json';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'webp') mimeType = 'image/webp';
            else if (ext === 'html') mimeType = 'text/html';
          }
          
          tempFilesToClean.push(tempPath);

          // Upload to Gemini File API
          debugLog(`[FILE_API] Uploading ${originalName} to Gemini...`);
          try {
            const uploadResult = await fileManager.uploadFile(tempPath, {
              mimeType,
              displayName: originalName
            });
            uploadedGeminiFiles.push(uploadResult.file);
            fileParts.push({
              fileData: {
                fileUri: uploadResult.file.uri,
                mimeType: uploadResult.file.mimeType
              }
            });
            debugLog(`[FILE_API] Uploaded as ${uploadResult.file.uri}`);
          } catch (uploadErr: any) {
            debugLog(`[FILE_API] Upload failed for ${originalName}: ${uploadErr.message} — will use extracted text only`);
          }
        };

        for (const filePath of filePaths) {
          debugLog(`[STORAGE] Downloading ${filePath} from Supabase...`);
          const { data, error } = await supabase.storage.from('forensic_evidence').download(filePath);
          if (error || !data) {
            debugLog(`[STORAGE] Failed to download ${filePath}: ${error?.message}`);
            continue;
          }
          const buffer = Buffer.from(await data.arrayBuffer());
          const fileName = filePath.split('/').pop() || 'file';
          await processBuffer(buffer, fileName);
        }

        for (const f of inlineFiles) {
          if (!(f instanceof File)) continue;
          console.log(`[INLINE] Processing inline file ${f.name}...`);
          const buffer = Buffer.from(await f.arrayBuffer());
          await processBuffer(buffer, f.name);
        }

        // Build combined text for OpenRouter fallback
        const openRouterText = [
          combinedText,
          ...extractedTexts
        ].filter(Boolean).join("\n\n");

        if (fileParts.length === 0 && !openRouterText.trim()) {
          console.error(`[ANALYSIS_ERROR] No files or text content found for analysis`);
          throw new Error("No se encontró evidencia (archivos o texto) para analizar.");
        }

        // --- STAGE 2: HISTORICAL CONTEXT ---
        let historicalContext_text = "";
        if (historicalContext) {
          console.log(`[CONTEXT] Fetching historical reports...`);
          const { data: histReports } = await supabase
            .from("forensic_reports")
            .select("payload_completo")
            .eq("organization_id", organizationId)
            .neq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(3);
            
          if (histReports && histReports.length > 0) {
            historicalContext_text = "\n\n=== CONTEXTO HISTÓRICO (Auditorías Previas) ===\n" +
              histReports.map(r => JSON.stringify(r.payload_completo)).join("\n---\n") +
              "\n=== FIN DE CONTEXTO HISTÓRICO ===\n";
          }
        }

        // --- STAGE 2: MODEL INITIALIZATION ---
        currentStage = "MODEL_INIT";
        console.log(`[STAGE: ${currentStage}] Initializing model with UI request: ${aiModel}`);

        const isOpenRouterModel = aiModel.startsWith("openrouter/") || 
                                 aiModel.startsWith("deepseek/") || 
                                 aiModel.startsWith("anthropic/") || 
                                 aiModel.startsWith("openai/") || 
                                 aiModel.startsWith("meta-llama/");

        const OPENROUTER_MODEL_MAP: Record<string, string> = {
          "openrouter/deepseek-chat":     "deepseek/deepseek-chat",
          "openrouter/deepseek-r1":       "deepseek/deepseek-r1",
          "openrouter/claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
          "openrouter/gpt-4o":            "openai/gpt-4o",
          "openrouter/llama-3.3-70b":     "meta-llama/llama-3.3-70b-instruct",
        };

        const targetOpenRouterModel = OPENROUTER_MODEL_MAP[aiModel] || (aiModel.includes("/") ? aiModel : "deepseek/deepseek-chat");

        // Map UI model alias strings to real, active Google Generative AI model IDs.
        const MODEL_MAP: Record<string, string> = {
          "gemini-2.5-flash":      "gemini-2.0-flash",
          "gemini-2.5-flash-lite": "gemini-2.0-flash",
          "gemini-2.0-flash":      "gemini-2.0-flash",
          "gemini-2.0-flash-lite": "gemini-2.0-flash",
          "gemini-1.5-flash":      "gemini-2.0-flash",
          "gemini-1.5-pro":        "gemini-2.0-flash",
        };
        const targetGeminiModel = MODEL_MAP[aiModel] || "gemini-2.0-flash";

        const orUserText = [
          `PROYECTO: ${projectId}`,
          `ORGANIZACIÓN: ${organizationId}`,
          historicalContext_text,
          `\n=== EVIDENCIA DEL PROYECTO ===\n${openRouterText || combinedText}`,
          `\nINSTRUCCIÓN CRÍTICA: Analiza la evidencia de arriba. Extrae los tickets reales, calcula el Costo Invisible (horas * $450 MXN) y devuelve un JSON strictly conforme al schema solicitado. NUNCA respondas con 0 en montos financieros.`
        ].filter(Boolean).join("\n");

        let responseText = "";
        let usedOpenRouter = false;
        const startTime = Date.now();

        if (isOpenRouterModel) {
          currentStage = "OPENROUTER_INFERENCE";
          console.log(`[STAGE: ${currentStage}] Direct OpenRouter execution with model: ${targetOpenRouterModel}`);
          responseText = await callOpenRouter(SYSTEM_PROMPT_FORENSIC, orUserText, targetOpenRouterModel);
          usedOpenRouter = true;
        } else {
          // Standard Gemini execution with fallback
          currentStage = "GEMINI_INFERENCE";
          console.log(`[MODEL] Selected Gemini API model: ${targetGeminiModel} (mapped from "${aiModel}")`);

          const model = genAI.getGenerativeModel({ 
            model: targetGeminiModel,
            systemInstruction: SYSTEM_PROMPT_FORENSIC,
            generationConfig: {
              temperature: aiTemperature,
              responseMimeType: "application/json",
              responseSchema: responseSchema as any,
              maxOutputTokens: 8192,
            },
          });

          const promptText = `PROYECTO: ${projectId}\nORGANIZACIÓN: ${organizationId}\n\nDATOS DEL INVENTARIO ACTUAL PARA AUDITORÍA (revisa cuidadosamente los archivos adjuntos para obtener los tickets y datos):\n${combinedText}\n\nINSTRUCCIÓN CRÍTICA: Los datos del inventario se encuentran en los ARCHIVOS ADJUNTOS a este mensaje. DEBES leer y procesar todos los archivos adjuntos (CSVs, Excel extraídos a texto, PDFs) para encontrar la lista de tickets, calcular sus desviaciones (Costo Invisible) y extraer los 5 peores tickets. Si no extraes datos de los archivos, fallarás la auditoría.\n${historicalContext_text}`;
          
          fileParts.push({ text: promptText });

          const MAX_RETRIES = 2;
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
              const result = await model.generateContent({
                contents: [{ role: "user", parts: fileParts }]
              });
              responseText = result.response.text();
              break; // success
            } catch (genErr: any) {
              const msg: string = genErr?.message || "";
              const is429 = msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("quota");
              if (is429 && attempt < MAX_RETRIES) {
                const retryMatch = msg.match(/(\d+(?:\.\d+)?)s/);
                const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) * 1000 : (attempt + 1) * 15000;
                console.warn(`[INFERENCE] 429 on attempt ${attempt + 1}. Retrying in ${waitMs / 1000}s...`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
              }
              if (is429) {
                // OPENROUTER FALLBACK
                console.warn(`[INFERENCE] Gemini quota exhausted after ${attempt + 1} attempts. Falling back to OpenRouter (${targetOpenRouterModel})...`);
                responseText = await callOpenRouter(SYSTEM_PROMPT_FORENSIC, orUserText, targetOpenRouterModel);
                usedOpenRouter = true;
                break;
              }
              throw genErr;
            }
          }
        }

        const duration = (Date.now() - startTime) / 1000;
        console.log(`[STAGE: ${currentStage}] Inference completed in ${duration.toFixed(2)}s via ${usedOpenRouter ? `OpenRouter (${targetOpenRouterModel})` : 'Gemini'}. Size: ${responseText.length} chars`);

        // --- CLEANUP ---
        // Clean up temporary local files
        for (const tempFile of tempFilesToClean) {
          try {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
          } catch (e: any) {
            console.warn(`[CLEANUP] Failed to delete temp file ${tempFile}:`, e.message);
          }
        }
        
        // Optionally clean up Gemini files (to save storage quota)
        // We do this asynchronously so it doesn't block the user response
        Promise.all(uploadedGeminiFiles.map(f => fileManager.deleteFile(f.name).catch(() => {})))
          .then(() => console.log(`[CLEANUP] Deleted ${uploadedGeminiFiles.length} files from Gemini storage.`));
        
        // --- STAGE 4: PARSING & PERSISTENCE ---
        currentStage = "REPORT_PERSISTENCE";
        console.log(`[STAGE: ${currentStage}] Parsing result and saving report...`);
        let forensicReport;
        try {
          const cleanedText = responseText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
          forensicReport = JSON.parse(cleanedText);
        } catch (e) {
          console.error("[PARSE_ERROR] JSON Parse Error. Raw output snippet:", responseText.slice(0, 500));
          // Save for debugging
          try {
            const fs = require('fs');
            const path = require('path');
            const debugPath = path.join(process.cwd(), 'scratch', `failed_report_${Date.now()}.json`);
            fs.writeFileSync(debugPath, responseText);
            console.log(`[DEBUG] Saved failed response to ${debugPath}`);
          } catch (fsErr) {
            console.warn("[DEBUG] Failed to save debug file:", fsErr);
          }
          throw new Error("El motor forense generó una estructura de datos ilegible. Intenta reduciendo la temperatura del modelo.");
        }

        const finalProjectName = bodyJson?.projectName || formData?.get("projectName") || forensicReport.report_metadata?.project_name || "Proyecto Sin Nombre";
        const finalProjectSize = bodyJson?.projectSize || formData?.get("projectSize") || forensicReport.report_metadata?.project_size || "medium";
        
        let finalTags = [];
        try {
          const tagsRaw = bodyJson?.tags || formData?.get("tags");
          if (tagsRaw) {
            finalTags = typeof tagsRaw === 'string' ? JSON.parse(tagsRaw) : tagsRaw;
          }
        } catch(e) {
          console.warn("[PERSISTENCE] Error parsing tags:", e);
        }

        // Override Gemini's metadata with the truth from the UI
        if (!forensicReport.report_metadata) {
          forensicReport.report_metadata = {};
        }
        forensicReport.report_metadata.project_name = finalProjectName;
        forensicReport.report_metadata.project_size = finalProjectSize;
        forensicReport.report_metadata.tags = finalTags;

        let dbRecord = null;
        if (allowStorage) {
          console.log(`[PERSISTENCE] Upserting report to forensic_reports...`);
          const { data, error: dbError } = await retrySupabase(async () => 
            await supabase
              .from("forensic_reports")
              .upsert({
                organization_id:  organizationId,
                project_id:       projectId,
                project_name:     finalProjectName,
                payload_completo: forensicReport,
                updated_at:       new Date().toISOString(),
              }, { onConflict: "project_id" })
              .select().single()
          );
          
          dbRecord = data;
          if (dbError) {
            console.error(`[PERSISTENCE_ERROR] Supabase upsert failed:`, dbError);
            throw new Error(`Fallo al persistir el reporte final: ${dbError.message}`);
          }
        }

        // Cleanup if Temporal
        if (isTemporal) {
          console.log(`[CLEANUP] Removing temporal data for project: ${projectId}`);
          const { error: cleanupError } = await supabase.from("document_embeddings").delete().eq("project_id", projectId);
          if (cleanupError) console.warn(`[CLEANUP_WARNING] Failed to remove temporal embeddings:`, cleanupError.message);
        }

        console.log(`[ANALYSIS] COMPLETED SUCCESSFULLY for project: ${projectId}`);
        return NextResponse.json({ 
          success: true, 
          report: forensicReport, 
          dbRecord,
          stage: "COMPLETED" as AuditStage
        });

      } catch (err: any) {
        const rawMsg: string = err?.message || "Error interno del motor forense";
        const is429 = rawMsg.includes("429") || rawMsg.includes("Too Many Requests") || rawMsg.includes("quota") || rawMsg.includes("CUOTA");
        const friendlyMsg = is429
          ? "⚠️ CUOTA DE API AGOTADA: La API key de Gemini ha superado el límite del plan gratuito. " +
            "Verifica la clave GEMINI_API_KEY en .env.local y habilita facturación en Google AI Studio (ai.google.dev)."
          : rawMsg;
        console.error(`[CRITICAL_FAILURE] Error in stage ${currentStage}: ${rawMsg}`);
        return NextResponse.json({ 
          success: false, 
          error: friendlyMsg,
          stage: currentStage 
        }, { status: is429 ? 429 : 500 });
      }
    }

    // ── 4. Handle Action: CLEANUP ─────────────────────────────────────────
    if (action === "cleanup") {
      if (bodyJson) {
        projectId = bodyJson.projectId || projectId;
      } else if (formData) {
        projectId = (formData.get("projectId") as string) || projectId;
      }

      if (!projectId) return NextResponse.json({ success: false, error: "Project ID required for cleanup" }, { status: 400 });

      const { error: delEmbeds } = await supabase.from("document_embeddings").delete().eq("project_id", projectId);
      const { error: delReport } = await supabase.from("forensic_reports").delete().eq("project_id", projectId);

      return NextResponse.json({ success: true, deleted: { embeds: !delEmbeds, report: !delReport } });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Critical error in forensic route:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

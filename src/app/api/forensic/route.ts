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
import { createClient }    from "@supabase/supabase-js";
import { SYSTEM_PROMPT_FORENSIC } from "@/lib/gemini";
import {
  extractTextFromFile,
  processFileForRAG,
  generateQueryEmbedding,
  chunkText,
  embedChunks,
  EmbeddedChunk,
} from "@/lib/rag";

// ── Types ──────────────────────────────────────────────────────────────────
export type AuditStage = 
  | "METADATA_PARSING"
  | "RAG_RETRIEVAL"
  | "MODEL_INIT"
  | "GEMINI_INFERENCE"
  | "REPORT_PERSISTENCE"
  | "COMPLETED"
  | "ERROR";

// ── Server-side Clients ───────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const contentType = request.headers.get("content-type") ?? "";
    const { searchParams } = new URL(request.url);
    let action = searchParams.get("action");

    // ── 1. Common Metadata ────────────────────────────────────────────────
    let organizationId   = "org_erani_default";
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

    // ── 2. Handle Action: INGEST ──────────────────────────────────────────
    if (action === "ingest") {
      if (!formData) {
        return NextResponse.json({ success: false, error: "Content-Type must be multipart/form-data for ingestion" }, { status: 400 });
      }

      organizationId = (formData.get("organizationId") as string) || organizationId;
      projectId      = (formData.get("projectId")      as string) || projectId;
      
      const files = formData.getAll("files");
      const results: { fileName: string; status: "success" | "error"; error?: string }[] = [];

      console.log(`[INGEST] Starting processing for ${files.length} files...`);

      for (const file of files) {
        if (!(file instanceof File)) continue;
        
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          console.log(`[INGEST] Step 1: Extracting text from ${file.name} (${file.size} bytes)`);
          const parsed = await extractTextFromFile(buffer, file.name);
          
          console.log(`[INGEST] Step 2: Chunking text...`);
          const chunks = await chunkText(parsed);
          console.log(`[INGEST] Found ${chunks.length} chunks.`);

          if (chunks.length > 0) {
            console.log(`[INGEST] Step 3: Generating embeddings with Gemini...`);
            const embedded = await embedChunks(chunks);
            
            console.log(`[INGEST] Step 4: Inserting into Supabase table 'document_embeddings'...`);
            const rows = embedded.map((chunk) => ({
              organization_id: organizationId,
              project_id:      projectId,
              file_name:       chunk.fileName,
              chunk_index:     chunk.chunkIndex,
              content:         chunk.content,
              embedding:       chunk.embedding,
              metadata: {
                file_type:  chunk.fileType,
                size:       file.size,
                created_at: new Date().toISOString(),
              },
            }));

            const { data: insertedRows, error: dbError } = await retrySupabase(async () => 
              await supabase.from("document_embeddings").insert(rows).select()
            );

            if (dbError) {
              console.error(`[INGEST] Supabase Error for ${file.name}:`, dbError);
              throw new Error(`Error en base de datos: ${dbError.message}. ¿Ejecutaste el script SQL?`);
            }
            console.log(`[INGEST] Successfully stored ${rows.length} rows for ${file.name}`);
          } else {
            throw new Error("El archivo está vacío o no contiene texto legible.");
          }
          
          results.push({ fileName: file.name, status: "success" });
        } catch (e: any) {
          console.error(`[INGEST] Critical error for ${file.name}:`, e.message);
          results.push({ 
            fileName: file.name, 
            status: "error", 
            error: e.message 
          });
        }
      }

      const allSuccess = results.every(r => r.status === "success");
      return NextResponse.json({ 
        success: allSuccess, 
        results,
        message: allSuccess ? "Ingesta completada" : "Error en el procesamiento"
      }, { status: allSuccess ? 200 : 400 });
    }

    // ── 3. Handle Action: ANALYZE ─────────────────────────────────────────
    if (action === "analyze") {
      let currentStage: AuditStage = "METADATA_PARSING";
      console.log(`[Forensic API] Starting ANALYSIS flow...`);

      try {
        if (bodyJson) {
          organizationId    = bodyJson.organizationId    ?? organizationId;
          projectId         = bodyJson.projectId         ?? projectId;
          allowStorage      = bodyJson.allowStorage      ?? true;
          historicalContext = bodyJson.historicalContext ?? false;
          aiModel           = bodyJson.aiModel           ?? "gemini-2.5-flash";
          aiTemperature     = bodyJson.aiTemperature     ?? 0.4;
          isTemporal        = bodyJson.isTemporal        ?? false;
          combinedText      = bodyJson.rawData           ?? "";
        } else if (formData) {
          organizationId    = (formData.get("organizationId")    as string) || organizationId;
          projectId         = (formData.get("projectId")         as string) || projectId;
          allowStorage      = formData.get("allowStorage")      === "true";
          historicalContext = formData.get("historicalContext") === "true";
          aiModel           = (formData.get("aiModel")           as string) || "gemini-2.5-flash";
          aiTemperature     = parseFloat((formData.get("aiTemperature") as string) || "0.4");
          isTemporal        = formData.get("isTemporal")       === "true";
          combinedText      = (formData.get("rawData")          as string) || "";
        }

        console.log(`[ANALYSIS] Params: Model=${aiModel}, Temp=${aiTemperature}, Storage=${allowStorage}, Historical=${historicalContext}`);

        // --- STAGE 1: RAG RETRIEVAL ---
        currentStage = "RAG_RETRIEVAL";
        console.log(`[STAGE: ${currentStage}] Fetching context for project: ${projectId}`);
        let historicalContext_text = "";
        
        if (allowStorage) {
          const { data: chunks, error: fetchError } = await supabase
            .from("document_embeddings")
            .select("content, file_name")
            .eq("project_id", projectId);

          if (fetchError) {
            console.error(`[RAG_ERROR] Supabase fetch failed:`, fetchError);
            throw new Error(`Error recuperando evidencia de Supabase: ${fetchError.message}`);
          }
          
          if (chunks && chunks.length > 0) {
            combinedText = chunks.map(c => `[Archivo: ${c.file_name}]\n${c.content}`).join("\n\n---\n\n");
            console.log(`[RAG] Loaded ${chunks.length} chunks from Supabase for analysis`);
          } else {
            console.warn(`[RAG_WARNING] No chunks found for project ${projectId} in Supabase`);
          }

          if (historicalContext && combinedText.length > 0) {
            try {
              console.log(`[RAG] Searching for historical context...`);
              const queryEmbedding = await generateQueryEmbedding(combinedText.slice(0, 2000));
              const { data: similarChunks, error: searchError } = await supabase.rpc(
                "match_document_chunks",
                {
                  query_embedding:  queryEmbedding,
                  match_threshold:  0.7,
                  match_count:      5,
                  filter_org_id:    organizationId,
                }
              );

              if (searchError) {
                console.error(`[RAG_HISTORICAL_ERROR] RPC match failed:`, searchError);
              } else if (similarChunks && similarChunks.length > 0) {
                historicalContext_text = [
                  "\n\n=== CONTEXTO HISTÓRICO (AuditorIAS Previas) ===",
                  ...similarChunks.map((c: any) => `[${c.file_name}]\n${c.content}`),
                  "=== FIN DE CONTEXTO HISTÓRICO ===",
                ].join("\n");
                console.log(`[RAG] Found ${similarChunks.length} historical snippets`);
              }
            } catch (e) {
              console.warn("[RAG_WARNING] Error in historical search (Non-critical):", e);
            }
          }
        }

        // ── FALLBACK: If no chunks from Supabase, try inline file processing ──────
        // This handles the case where:
        //  1. ingest() failed (embedding dimension bug, table missing, etc.)
        //  2. The user sent files directly in the analyze FormData
        //  3. allowStorage=false was set (temporal mode without prior ingest)
        if (!combinedText.trim() && formData) {
          const inlineFiles = formData.getAll("files");
          if (inlineFiles.length > 0) {
            console.log(`[FALLBACK] No Supabase data found. Processing ${inlineFiles.length} inline file(s) directly...`);
            const { extractTextFromFile, chunkText } = await import("@/lib/rag");
            const textParts: string[] = [];
            for (const f of inlineFiles) {
              if (!(f instanceof File)) continue;
              try {
                const buffer = Buffer.from(await f.arrayBuffer());
                const parsed = await extractTextFromFile(buffer, f.name);
                const chunks = chunkText(parsed);
                textParts.push(`[Archivo: ${f.name}]\n${chunks.map(c => c.content).join("\n")}`);
                console.log(`[FALLBACK] Processed inline file: ${f.name} → ${chunks.length} chunks`);
              } catch (fe: any) {
                console.warn(`[FALLBACK] Could not parse inline file ${f.name}:`, fe.message);
              }
            }
            if (textParts.length > 0) {
              combinedText = textParts.join("\n\n---\n\n");
              console.log(`[FALLBACK] Inline text extracted: ${combinedText.length} chars`);
            }
          }
        }

        if (!combinedText.trim()) {
          console.error(`[ANALYSIS_ERROR] No text content found for analysis`);
          throw new Error(
            "No se encontró evidencia para analizar. " +
            "Asegúrate de: (1) haber ingerido los archivos ANTES de analizar, " +
            "(2) que la tabla document_embeddings exista en Supabase (ejecuta forensic_vector_schema.sql), " +
            "(3) que el proyecto ID coincida. " +
            `ProjectID usado: ${projectId}`
          );
        }


        // --- STAGE 2: MODEL INITIALIZATION ---
        currentStage = "MODEL_INIT";
        console.log(`[STAGE: ${currentStage}] Initializing Gemini with model: ${aiModel}`);
        
        // Support for 1.5, 2.0 and the user's custom "2.5" naming
        const isKnownRecentModel = aiModel.includes('1.5') || aiModel.includes('2.0') || aiModel.includes('2.5');
        const targetModel = isKnownRecentModel ? aiModel : 'gemini-1.5-flash';
        
        const model = genAI.getGenerativeModel({ 
          model: targetModel,
          systemInstruction: SYSTEM_PROMPT_FORENSIC,
          generationConfig: {
            temperature: aiTemperature,
            responseMimeType: "application/json",
            responseSchema: responseSchema as any,
            maxOutputTokens: 8192, // Prevent runaway generation/hallucinations
          },
        });

        // --- STAGE 3: INFERENCE ---
        currentStage = "GEMINI_INFERENCE";
        console.log(`[STAGE: ${currentStage}] Running forensic analysis (Inference L2)...`);
        const promptText = `PROYECTO: ${projectId}\nORGANIZACIÓN: ${organizationId}\n\nDATOS DEL INVENTARIO ACTUAL PARA AUDITORÍA:\n${combinedText}\n${historicalContext_text}`;
        
        const startTime = Date.now();
        const result = await model.generateContent(promptText);
        const responseText = result.response.text();
        const duration = (Date.now() - startTime) / 1000;
        
        console.log(`[STAGE: ${currentStage}] Inference completed in ${duration.toFixed(2)}s. Result size: ${responseText.length} chars`);
        
        // --- STAGE 4: PARSING & PERSISTENCE ---
        currentStage = "REPORT_PERSISTENCE";
        console.log(`[STAGE: ${currentStage}] Parsing result and saving report...`);
        let forensicReport;
        try {
          forensicReport = JSON.parse(responseText);
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

        let dbRecord = null;
        if (allowStorage) {
          console.log(`[PERSISTENCE] Upserting report to forensic_reports...`);
          const { data, error: dbError } = await retrySupabase(async () => 
            await supabase
              .from("forensic_reports")
              .upsert({
                organization_id:  organizationId,
                project_id:       projectId,
                project_name:     forensicReport.report_metadata.project_name || "Proyecto Sin Nombre",
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
        console.error(`[CRITICAL_FAILURE] Error in stage ${currentStage}:`, err.message);
        return NextResponse.json({ 
          success: false, 
          error: err.message || "Error interno del motor forense",
          stage: currentStage 
        }, { status: 500 });
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

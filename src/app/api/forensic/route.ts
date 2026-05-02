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
import { GoogleGenAI, Type } from "@google/genai";
import { createClient }    from "@supabase/supabase-js";
import { SYSTEM_PROMPT_FORENSIC } from "@/lib/gemini";
import {
  extractTextFromFile,
  processFileForRAG,
  generateQueryEmbedding,
  EmbeddedChunk,
} from "@/lib/rag";

// ── Server-side Clients ───────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Gemini Response Schema ─────────────────────────────────────────────────
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    report_metadata: {
      type: Type.OBJECT,
      properties: {
        project_name: { type: Type.STRING, description: "Nombre extraído del CSV" },
        audit_id:     { type: Type.STRING, description: "Folio generado para la auditoría" },
        currency:     { type: Type.STRING, description: "Moneda de reporte (ej. MXN)" },
      },
      required: ["project_name", "audit_id", "currency"],
    },
    slide_1_impacto_directo: {
      type: Type.OBJECT,
      properties: {
        fuga_confirmada_mxn:             { type: Type.NUMBER },
        riesgo_latente_mensual_mxn:      { type: Type.NUMBER },
        desviacion_scope_creep_pct:      { type: Type.NUMBER },
        punto_conciencia_rentabilidad_mxn: { type: Type.NUMBER },
        coi_anual_mxn:                   { type: Type.NUMBER },
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
      type: Type.OBJECT,
      properties: {
        top_5_tickets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ticket_id:          { type: Type.STRING },
              descripcion:        { type: Type.STRING },
              filtro:             { type: Type.STRING, enum: ["[INT]", "[EXT]"] },
              hrs_calc:           { type: Type.NUMBER },
              costo_invisible_mxn: { type: Type.NUMBER },
            },
            required: ["ticket_id", "descripcion", "filtro", "hrs_calc", "costo_invisible_mxn"],
          },
        },
        resumen_consolidacion: {
          type: Type.OBJECT,
          properties: {
            otros_tickets_cantidad:    { type: Type.INTEGER },
            otros_tickets_monto_mxn:   { type: Type.NUMBER },
            fuga_externa_mxn:          { type: Type.NUMBER },
            fuga_interna_mxn:          { type: Type.NUMBER },
            total_conciliado_monto_mxn: { type: Type.NUMBER },
            estado_inventario_desc:    { type: Type.STRING },
          },
          required: [
            "otros_tickets_cantidad",
            "otros_tickets_monto_mxn",
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
      type: Type.OBJECT,
      properties: {
        monitor_bucle_pct:          { type: Type.NUMBER },
        indice_friccion_pct:        { type: Type.NUMBER },
        dark_data_index_pct:        { type: Type.NUMBER },
        intensidad_scope_creep_pct: { type: Type.NUMBER },
        analisis_ceguera_operativa: { type: Type.STRING },
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
      type: Type.OBJECT,
      properties: {
        protocolos_bloqueo:    { type: Type.STRING },
        roi_dias:              { type: Type.INTEGER },
        proyeccion_margen_pct: { type: Type.NUMBER },
      },
      required: ["protocolos_bloqueo", "roi_dias", "proyeccion_margen_pct"],
    },
    slide_5_anexo_sustento: {
      type: Type.OBJECT,
      properties: {
        frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
        glosario:   { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["frameworks", "glosario"],
    },
    anexo_tecnico: {
      type: Type.OBJECT,
      properties: {
        metodologia_inferencia: { type: Type.STRING },
        vectores_auditados:     { type: Type.ARRAY, items: { type: Type.STRING } },
        frameworks_utilizados:  { type: Type.ARRAY, items: { type: Type.STRING } },
        glosario_terminos:      { type: Type.ARRAY, items: { type: Type.STRING } },
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

    // ── 1. Parse Incoming Request ─────────────────────────────────────────
    let organizationId   = "org_erani_default";
    let projectId        = "project_default";
    let allowStorage     = false;
    let historicalContext = false;
    let aiModel          = "gemini-2.5-flash";
    let aiTemperature    = 0.4;
    const fileBuffers: { buffer: Buffer; name: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      // Multipart: files + config from the Audit Protocol page
      const formData = await request.formData();

      organizationId    = (formData.get("organizationId")    as string) || organizationId;
      projectId         = (formData.get("projectId")         as string) || projectId;
      allowStorage      = formData.get("allowStorage")      === "true";
      historicalContext = formData.get("historicalContext") === "true";
      aiModel           = (formData.get("aiModel")           as string) || aiModel;
      aiTemperature     = parseFloat((formData.get("aiTemperature") as string) || "0.4");

      // Collect all uploaded files
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          const arrayBuffer = await value.arrayBuffer();
          fileBuffers.push({
            buffer: Buffer.from(arrayBuffer),
            name: value.name,
          });
        }
      }
    } else {
      // Fallback: JSON body (legacy / testing)
      const body = await request.json();
      organizationId    = body.organizationId    ?? organizationId;
      projectId         = body.projectId         ?? projectId;
      allowStorage      = body.allowStorage      ?? false;
      historicalContext = body.historicalContext ?? false;
      aiModel           = body.aiModel           ?? aiModel;
      aiTemperature     = body.aiTemperature     ?? aiTemperature;

      // If rawData is passed as text, wrap it for processing
      if (body.rawData) {
        const rawText = typeof body.rawData === "string"
          ? body.rawData
          : JSON.stringify(body.rawData, null, 2);
        fileBuffers.push({
          buffer: Buffer.from(rawText, "utf-8"),
          name: "rawdata.json",
        });
      }
    }

    if (fileBuffers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files or data provided" },
        { status: 400 }
      );
    }

    // ── 2. Extract Text From All Files ────────────────────────────────────
    const extractedTexts: string[] = [];

    for (const { buffer, name } of fileBuffers) {
      try {
        const parsed = await extractTextFromFile(buffer, name);
        if (parsed.text.trim()) {
          extractedTexts.push(`[Archivo: ${name}]\n${parsed.text}`);
        }
      } catch (e) {
        console.warn(`No se pudo parsear ${name}:`, e);
      }
    }

    const combinedText = extractedTexts.join("\n\n---\n\n");

    // ── 3. RAG Path: Vectorize + Store (if allowStorage=true) ─────────────
    let historicalContext_text = "";

    if (allowStorage) {
      // 3a. Vectorize all files and store in Supabase
      const allEmbeddedChunks: EmbeddedChunk[] = [];

      for (const { buffer, name } of fileBuffers) {
        try {
          const chunks = await processFileForRAG(buffer, name);
          allEmbeddedChunks.push(...chunks);
        } catch (e) {
          console.warn(`Error vectorizando ${name}:`, e);
        }
      }

      if (allEmbeddedChunks.length > 0) {
        const rows = allEmbeddedChunks.map((chunk) => ({
          organization_id: organizationId,
          project_id:      projectId,
          file_name:       chunk.fileName,
          chunk_index:     chunk.chunkIndex,
          content:         chunk.content,
          embedding:       chunk.embedding,
          metadata: {
            file_type:  chunk.fileType,
            created_at: new Date().toISOString(),
          },
        }));

        const { error: insertError } = await supabase
          .from("document_embeddings")
          .insert(rows);

        if (insertError) {
          console.error("Error almacenando embeddings:", insertError);
        } else {
          console.log(`✅ ${rows.length} chunks vectorizados y almacenados`);
        }
      }

      // 3b. Similarity Search for historical context
      if (historicalContext && combinedText.length > 0) {
        try {
          const queryEmbedding = await generateQueryEmbedding(
            combinedText.slice(0, 2000) // Use first 2000 chars as query context
          );

          const { data: similarChunks, error: searchError } = await supabase.rpc(
            "match_document_chunks",
            {
              query_embedding:  queryEmbedding,
              match_threshold:  0.7,
              match_count:      5,
              filter_org_id:    organizationId,
            }
          );

          if (!searchError && similarChunks && similarChunks.length > 0) {
            historicalContext_text = [
              "\n\n=== CONTEXTO HISTÓRICO (Auditorías Previas) ===",
              "Usa estos fragmentos de auditorías anteriores para enriquecer tu análisis:",
              ...similarChunks.map(
                (c: { file_name: string; similarity: number; content: string }) =>
                  `[${c.file_name} | Similitud: ${(c.similarity * 100).toFixed(1)}%]\n${c.content}`
              ),
              "=== FIN DE CONTEXTO HISTÓRICO ===",
            ].join("\n");

            console.log(`📚 ${similarChunks.length} fragmentos históricos recuperados`);
          }
        } catch (e) {
          console.warn("Error en similarity search:", e);
        }
      }
    }

    // ── 4. Build Gemini Prompt ────────────────────────────────────────────
    const promptText = [
      "Analiza la siguiente metadata operativa y genera el reporte forense completo:",
      "",
      combinedText,
      historicalContext_text,
    ].join("\n");

    // ── 5. Call Gemini 2.5 Flash ──────────────────────────────────────────
    const response = await ai.models.generateContent({
      model:    aiModel,
      contents: promptText,
      config: {
        temperature:      aiTemperature,
        responseMimeType: "application/json",
        responseSchema,
        systemInstruction: SYSTEM_PROMPT_FORENSIC,
      },
    });

    if (!response.text) {
      throw new Error("Respuesta vacía de Gemini");
    }

    const forensicReport = JSON.parse(response.text);

    // ── 6. Persist Structured Report to Supabase ──────────────────────────
    let dbRecord = null;
    if (allowStorage) {
      const { data, error: dbError } = await supabase
        .from("forensic_reports")
        .upsert(
          {
            organization_id:  organizationId,
            project_name:     forensicReport.report_metadata.project_name,
            payload_completo: forensicReport,
            updated_at:       new Date().toISOString(),
          },
          { onConflict: "organization_id" }
        )
        .select()
        .single();

      if (dbError) {
        console.error("Error guardando reporte en Supabase:", dbError);
      } else {
        dbRecord = data;
      }
    }

    // ── 7. Return to Frontend ─────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      report:  forensicReport,
      meta: {
        vectorized:       allowStorage,
        historicalChunks: historicalContext_text ? true : false,
        filesProcessed:   fileBuffers.map((f) => f.name),
      },
      dbRecord,
    });
  } catch (error: any) {
    console.error("Error en el peritaje forense:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Fallo en la inferencia forense" },
      { status: 500 }
    );
  }
}

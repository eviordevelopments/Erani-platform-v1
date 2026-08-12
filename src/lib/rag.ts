/**
 * ERANI RAG Pipeline — File Parsing & Embedding Engine
 * Uses Google's Gemini embedding-001 model (768 dimensions).
 *
 * Supported formats: PDF, XLSX, XLS, CSV, JSON
 */

import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { createRequire } from "module";
import * as xlsx from "xlsx";
import { parse as parseCsv } from "csv-parse/sync";
import PDFParser from "pdf2json";

// ── Gemini client (server-side only) ───────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// gemini-embedding-001: VERIFIED 3072-dimensional output (NOT 768)
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_CHUNK_CHARS  = 1000;  // Characters per chunk (safe for embedding API)
const MAX_EMBED_BATCH  = 5;     // Reduced batch size to avoid rate limits (3072-dim is heavy)
const EMBEDDING_DIMS   = 3072;  // Actual dimension for gemini-embedding-001 (verified via API test)

/**
 * Utility to parse PDF using pdf2json with a Promise
 */
async function parsePdfWithPdf2Json(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1); // 1 = text-only mode

    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve((pdfParser as any).getRawTextContent());
    });

    pdfParser.parseBuffer(buffer);
  });
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface ParsedFile {
  fileName: string;
  fileType: string;
  text: string;
  sizeBytes: number;
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  fileName: string;
  fileType: string;
}

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

// ── File Text Extraction ───────────────────────────────────────────────────

/**
 * Extracts raw text from a file buffer based on extension.
 * Returns a ParsedFile object with text and metadata.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string
): Promise<ParsedFile> {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  let text = "";

  switch (extension) {
    case "pdf": {
      text = await parsePdfWithPdf2Json(buffer);
      text = text.trim();
      break;
    }

    case "xlsx":
    case "xls": {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const parts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to CSV-like text for better semantic chunking
        const csv = xlsx.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          parts.push(`[Sheet: ${sheetName}]\n${csv}`);
        }
      }
      text = parts.join("\n\n");
      break;
    }

    case "csv": {
      const records = parseCsv(buffer, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
      }) as Record<string, string>[];
      // Keep human-readable format for better semantic understanding
      text = records
        .map((row, i) =>
          `[Row ${i + 1}] ${Object.entries(row)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ")}`
        )
        .join("\n");
      break;
    }

    case "json": {
      try {
        const parsed = JSON.parse(buffer.toString("utf-8"));
        // Pretty print for readable chunking
        text = JSON.stringify(parsed, null, 2);
      } catch {
        text = buffer.toString("utf-8");
      }
      break;
    }

    default:
      text = buffer.toString("utf-8");
  }

  return {
    fileName,
    fileType: extension,
    text,
    sizeBytes: buffer.byteLength,
  };
}

// ── Chunking & Embedding Helpers ──────────────────────────────────────────

export function chunkText(text: string, fileName: string, fileType: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const lines = text.split("\n");
  let currentChunk = "";
  let chunkIndex = 0;

  for (const line of lines) {
    if ((currentChunk + "\n" + line).length > MAX_CHUNK_CHARS) {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          fileName,
          fileType,
        });
      }
      currentChunk = line;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex++,
      fileName,
      fileType,
    });
  }

  return chunks;
}

export async function embedChunks(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
  const results: EmbeddedChunk[] = [];
  for (let i = 0; i < chunks.length; i += MAX_EMBED_BATCH) {
    const batch = chunks.slice(i, i + MAX_EMBED_BATCH);
    await Promise.all(
      batch.map(async (chunk) => {
        try {
          const res = await embeddingModel.embedContent(chunk.content);
          results.push({
            ...chunk,
            embedding: res.embedding.values,
          });
        } catch {
          results.push({
            ...chunk,
            embedding: new Array(EMBEDDING_DIMS).fill(0),
          });
        }
      })
    );
  }
  return results;
}


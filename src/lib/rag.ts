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

// ── Text Chunking ──────────────────────────────────────────────────────────

/**
 * Splits extracted text into overlapping chunks for embedding.
 * Uses sentence-aware splitting with 10% overlap for context continuity.
 */
export function chunkText(parsedFile: ParsedFile): TextChunk[] {
  const { text, fileName, fileType } = parsedFile;
  if (!text.trim()) return [];

  const chunks: string[] = [];
  // Fix: split by newlines, tabs, or sentence boundaries followed by space
  const sentences = text.split(/(?<=[.!?])\s+|[\n\t]+/);

  let current = "";
  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    // If a single sentence/block is larger than max limit, force split it
    if (sentence.length > MAX_CHUNK_CHARS) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      let remaining = sentence;
      while (remaining.length > 0) {
        const part = remaining.substring(0, MAX_CHUNK_CHARS);
        chunks.push(part.trim());
        remaining = remaining.substring(MAX_CHUNK_CHARS - 100); // 100 char overlap
        // Prevent infinite loop if remaining is too small to progress
        if (remaining.length <= 100) {
          if (remaining.trim()) chunks.push(remaining.trim());
          break;
        }
      }
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;

    if (candidate.length > MAX_CHUNK_CHARS) {
      if (current.trim()) chunks.push(current.trim());
      // Overlap: carry last ~100 chars as context for next chunk
      current = current.slice(-100) + " " + sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks
    .filter((c) => c.length > 20) // Discard trivial chunks
    .map((content, chunkIndex) => ({
      content,
      chunkIndex,
      fileName,
      fileType,
    }));
}

// ── Gemini Embedding Generation ───────────────────────────────────────────

/**
 * Generates a single embedding vector for a text string.
 * Returns a 768-dimensional float array via Gemini embedding-001.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: "user" },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  const values = result.embedding.values;
  // DO NOT truncate — gemini-embedding-001 returns exactly 3072 dims.
  // Supabase vector(3072) column must match. Truncation causes corrupt embeddings.
  return values;
}

/**
 * Generates embeddings for a query (semantic search use case).
 * Uses RETRIEVAL_QUERY task type for optimal similarity matching.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: query }], role: "user" },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return result.embedding.values;
}

/**
 * Batch-embeds all chunks from parsed files.
 * Processes in batches of MAX_EMBED_BATCH to stay within rate limits.
 */
export async function embedChunks(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
  const embedded: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += MAX_EMBED_BATCH) {
    const batch = chunks.slice(i, i + MAX_EMBED_BATCH);

    // Sequential within batch to avoid Gemini rate limits
    for (const chunk of batch) {
      const embedding = await generateEmbedding(chunk.content);
      embedded.push({ ...chunk, embedding });
    }
  }

  return embedded;
}

// ── Full Pipeline ──────────────────────────────────────────────────────────

/**
 * Complete RAG ingestion pipeline:
 * Buffer → Text Extraction → Chunking → Embedding
 *
 * @param buffer   File binary data
 * @param fileName Original file name (used to detect format)
 * @returns Array of embedded chunks ready for Supabase upsert
 */
export async function processFileForRAG(
  buffer: Buffer,
  fileName: string
): Promise<EmbeddedChunk[]> {
  const parsed = await extractTextFromFile(buffer, fileName);
  const chunks  = chunkText(parsed);
  const embedded = await embedChunks(chunks);
  return embedded;
}

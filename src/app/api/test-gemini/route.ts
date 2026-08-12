import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function GET() {
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const mockContent = `
ID_TICKET,DESCRIPCION,ESTIMACION_HRS,TIEMPO_REAL_HRS,ESTADO,COSTO_HR
TKT-101,"Desarrollo módulo pagos",40,120,COMPLETADO,500
TKT-102,"Ajuste diseño login",5,25,COMPLETADO,500
TKT-103,"Reuniones de sincronización",0,45,COMPLETADO,500
TKT-104,"Bugfix crítico producción",2,30,COMPLETADO,500
TKT-105,"Cambio alcance no documentado",0,80,COMPLETADO,500
  `.trim();
  
  const tempPath = path.join(os.tmpdir(), `mock_evidence_${Date.now()}.csv`);
  fs.writeFileSync(tempPath, mockContent);

  let uploadedFile = null;

  try {
    const uploadResponse = await fileManager.uploadFile(tempPath, {
      mimeType: 'text/csv',
      displayName: 'mock_evidence.csv',
    });
    uploadedFile = uploadResponse.file;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            top_5_tickets: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  ticket_id: { type: SchemaType.STRING },
                  descripcion: { type: SchemaType.STRING },
                  costo_invisible_mxn: { type: SchemaType.NUMBER },
                },
                required: ["ticket_id", "descripcion", "costo_invisible_mxn"],
              }
            },
            fuga_total_mxn: { type: SchemaType.NUMBER }
          },
          required: ["top_5_tickets", "fuga_total_mxn"]
        }
      }
    });

    const promptText = "Eres un auditor forense. Analiza el archivo CSV adjunto. Calcula el 'costo_invisible_mxn' para cada ticket sabiendo que Costo Invisible = (TIEMPO_REAL_HRS - ESTIMACION_HRS) * COSTO_HR. Encuentra los top tickets con mayor fuga y la fuga total.";

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } },
            { text: promptText }
          ]
        }
      ]
    });

    const jsonText = result.response.text();
    return NextResponse.json({ success: true, uri: uploadedFile.uri, result: JSON.parse(jsonText) });

  } catch (err: any) {
    fs.writeFileSync(path.join(os.tmpdir(), 'gemini_err.txt'), err.stack || err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    if (uploadedFile) {
      await fileManager.deleteFile(uploadedFile.name).catch(() => {});
    }
  }
}

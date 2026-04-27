import { NextResponse } from "next/server";
import { forensicModel, SYSTEM_PROMPT_FORENSIC } from "@/lib/gemini";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { organizationId, rawData } = await req.json();

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // 1. Send data to Gemini
    const prompt = `Analiza la siguiente metadata operativa y genera el reporte forense:\n\n${JSON.stringify(rawData)}`;
    
    const result = await forensicModel.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT_FORENSIC + "\n\n" + prompt }] }
      ],
      config: { responseMimeType: "application/json" }
    });

    const responseText = result.text ?? "{}";
    const forensicData = JSON.parse(responseText);

    // 2. Persist to Supabase
    const { data, error } = await supabase
      .from('forensic_reports')
      .upsert({
        organization_id: organizationId,
        project_name: forensicData.project_name,
        impacto_directo: forensicData.impacto_directo,
        impacto_futuro: forensicData.impacto_futuro,
        scope_creep: forensicData.scope_creep,
        rentabilidad_point: forensicData.rentabilidad_point,
        coi_anual: forensicData.coi_anual,
        tickets: forensicData.tickets,
        kpi_revisiones: forensicData.kpi_revisiones,
        kpi_friccion_talento: forensicData.kpi_friccion_talento,
        kpi_dark_data: forensicData.kpi_dark_data,
        firewall_impact: forensicData.firewall_impact,
        margen_evolucion: forensicData.margen_evolucion,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Forensic API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

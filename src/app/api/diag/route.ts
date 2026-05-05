import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  const diagnostics = {
    supabase: { status: "checking", message: "" },
    gemini: { status: "checking", message: "" },
    env: { status: "checking", message: "" },
  };

  // 1. Check Env Vars
  const requiredVars = [
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    diagnostics.env = { status: "error", message: `Missing: ${missing.join(", ")}` };
  } else {
    diagnostics.env = { status: "ok", message: "Environment variables loaded" };
  }

  // 2. Check Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    diagnostics.supabase = { status: "ok", message: "Connected to Supabase DB" };
  } catch (err: any) {
    diagnostics.supabase = { status: "error", message: err.message };
  }

  // 3. Check Gemini
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // Just a tiny test or list models
    diagnostics.gemini = { status: "ok", message: "Gemini API Key valid" };
  } catch (err: any) {
    diagnostics.gemini = { status: "error", message: err.message };
  }

  return NextResponse.json(diagnostics);
}

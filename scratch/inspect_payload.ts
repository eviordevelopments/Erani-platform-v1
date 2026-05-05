import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ctgizovelvkzahbmxwgc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Z2l6b3ZlbHZremFoYm14d2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcwNDE2OSwiZXhwIjoyMDkwMjgwMTY5fQ.T0FAdEayZB41uwa557BSCfxaaQhxHvSwWSqi00gNUyg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('forensic_reports')
    .select('id, payload_completo')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  console.log(JSON.stringify(data.payload_completo, null, 2));
}

check();

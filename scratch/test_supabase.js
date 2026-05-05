
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing Supabase connection to:", supabaseUrl);
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Supabase Success! Data:", data);
  }
}

test();

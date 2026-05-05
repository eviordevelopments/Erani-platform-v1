
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ctgizovelvkzahbmxwgc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Z2l6b3ZlbHZremFoYm14d2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDQxNjksImV4cCI6MjA5MDI4MDE2OX0.zUkl-YvvJDwBoaWr3ewd0PmLsQvREnWvGiFjfWOucVM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing Supabase connection to:", supabaseUrl);
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Supabase Success! Data:", data);
    }
  } catch (err) {
    console.error("Fetch failed entirely:", err);
  }
}

test();

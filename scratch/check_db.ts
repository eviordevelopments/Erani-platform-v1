
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function getEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  content.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const env = getEnv();
const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL']!,
  env['SUPABASE_SERVICE_ROLE_KEY']!
);

async function checkTables() {
  const tables = ['organizations', 'profiles', 'audits', 'forensic_reports', 'user_preferences', 'audit_logs', 'sessions', 'feedback', 'automations'];
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table} exists.`);
      }
    } catch (e: any) {
      console.log(`❌ Table ${table}: Exception ${e.message}`);
    }
  }
}

checkTables();

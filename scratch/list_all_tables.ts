
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

async function listAllTables() {
  // Try to use a RPC if possible, or just guess common ones.
  // Since I can't query information_schema easily, I'll try to select from likely candidates.
  const tables = ['feedback', 'automations', 'user_preferences', 'profiles', 'organizations', 'audits', 'forensic_reports', 'audit_logs', 'sessions', 'team_members', 'organization_features'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`✅ Table ${table} exists.`);
    } else {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
}

listAllTables();

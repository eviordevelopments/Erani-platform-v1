
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

async function listColumns() {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name')
    .filter('table_schema', 'eq', 'public');
    
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    const tables: Record<string, string[]> = {};
    data.forEach((row: any) => {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(row.column_name);
    });
    console.log(JSON.stringify(tables, null, 2));
  }
}

listColumns();

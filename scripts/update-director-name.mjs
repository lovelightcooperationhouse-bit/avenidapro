import * as fs from 'fs';
import * as path from 'path';

const mcpConfigPath = path.resolve(process.cwd(), '.agents/mcp_config.json');
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && fs.existsSync(mcpConfigPath)) {
  const mcp = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
  token = mcp?.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
}
const projectRef = process.env.SUPABASE_PROJECT_REF || 'xlugccxuittetcayjsxc';

async function updateDirector() {
  const sql = `UPDATE public.profiles SET first_name = 'Hope', last_name = 'd''Almeida' WHERE email = 'direction@ecole-avenida.tg';`;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  console.log("✅ Profil du Directeur Général mis à jour : Hope d'Almeida", data);
}

updateDirector();

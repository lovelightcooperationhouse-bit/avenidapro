import * as fs from 'fs';
import * as path from 'path';

const mcpConfigPath = path.resolve(process.cwd(), '.agents/mcp_config.json');
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && fs.existsSync(mcpConfigPath)) {
  const mcp = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
  token = mcp?.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
}
const projectRef = process.env.SUPABASE_PROJECT_REF || 'xlugccxuittetcayjsxc';

const sampleInvitations = [
  {
    email: 'prof.culinaire@ecole-avenida.tg',
    first_name: 'Professeur',
    last_name: 'Koffi',
    role_code: 'professeur'
  },
  {
    email: 'reception@ecole-avenida.tg',
    first_name: 'Agent',
    last_name: 'Réception Hôtel',
    role_code: 'responsable_hotel'
  },
  {
    email: 'eleve.dekon@ecole-avenida.tg',
    first_name: 'Akouvi',
    last_name: 'Mensah',
    role_code: 'eleve'
  }
];

async function seedInvitations() {
  for (const inv of sampleInvitations) {
    const sql = `
      INSERT INTO public.user_invitations (email, first_name, last_name, role_code, status)
      VALUES ('${inv.email}', '${inv.first_name}', '${inv.last_name}', '${inv.role_code}', 'pending')
      ON CONFLICT (email) DO NOTHING;
    `;
    await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    console.log(`✅ Invitation créée pour: ${inv.email} (${inv.role_code})`);
  }
}

seedInvitations();

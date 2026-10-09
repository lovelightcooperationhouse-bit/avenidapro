import * as fs from 'fs';
import * as path from 'path';

const mcpConfigPath = path.resolve(process.cwd(), '.agents/mcp_config.json');
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && fs.existsSync(mcpConfigPath)) {
  const mcp = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
  token = mcp?.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
}
const projectRef = process.env.SUPABASE_PROJECT_REF || 'xlugccxuittetcayjsxc';

const sql = `
  CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Lecture des invitations pour tous" ON public.user_invitations;
  CREATE POLICY "Lecture des invitations pour tous" 
  ON public.user_invitations FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Gestion des invitations" ON public.user_invitations;
  CREATE POLICY "Gestion des invitations" 
  ON public.user_invitations FOR ALL USING (true);
`;

async function setupInvitations() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  console.log("✅ Table public.user_invitations créée et configurée avec succès:", data);
}

setupInvitations();

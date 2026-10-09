import * as fs from 'fs';
import * as path from 'path';

// Lecture sécurisée du token depuis .agents/mcp_config.json (ignoré par Git)
const mcpConfigPath = path.resolve(process.cwd(), '.agents/mcp_config.json');
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && fs.existsSync(mcpConfigPath)) {
  const mcp = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
  token = mcp?.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
}
const projectRef = process.env.SUPABASE_PROJECT_REF || 'xlugccxuittetcayjsxc';
const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20250101000000_init_schema.sql');

if (!fs.existsSync(migrationPath)) {
  console.error("❌ Fichier de migration introuvable :", migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf-8');

console.log("=================================================");
console.log("🚀 DÉPLOIEMENT DU SCHÉMA INITIAL SUR SUPABASE");
console.log("=================================================");
console.log(`📡 Projet cible : ${projectRef} (avenidapro)`);
console.log(`📄 Fichier : supabase/migrations/20250101000000_init_schema.sql (${sql.length} caractères)`);

async function runMigration() {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("❌ Erreur retournée par Supabase :", result);
      process.exit(1);
    }

    console.log("✅ Schéma SQL initial déployé avec succès !");

    // Lister les tables publiques créées
    const listRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          SELECT table_name, rowsecurity 
          FROM information_schema.tables t
          JOIN pg_tables p ON p.tablename = t.table_name
          WHERE t.table_schema = 'public'
          ORDER BY table_name;
        `
      })
    });

    const tables = await listRes.json();
    console.log(`\n📊 Tables créées dans le schéma public : (${tables.length} tables)`);
    tables.forEach(t => console.log(`   - ${t.table_name} [RLS: ${t.rowsecurity ? 'ACTIVÉ 🛡️' : 'DÉSACTIVÉ ⚠️'}]`));

  } catch (err) {
    console.error("❌ Exception lors de la migration :", err);
    process.exit(1);
  }
}

runMigration();

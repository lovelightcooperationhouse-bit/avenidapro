import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(
  envVars['NEXT_PUBLIC_SUPABASE_URL'],
  envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']
);

async function testSignIn() {
  console.log("⏳ Test de connexion utilisateur avec Supabase Auth (clé publique anon)...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'direction@ecole-avenida.tg',
    password: 'avenidaPassword2026!'
  });

  if (error) {
    console.error("❌ Échec:", error.message);
  } else {
    console.log("✅ Connexion réussie !");
    console.log("   - User ID:", data.user.id);
    console.log("   - Email:", data.user.email);
    console.log("   - Session Token reçu:", data.session.access_token.slice(0, 30) + '...');
  }
}

testSignIn();

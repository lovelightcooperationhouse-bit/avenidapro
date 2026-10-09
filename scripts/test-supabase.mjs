import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Charger manuellement .env.local sans dépendance externe
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ Fichier .env.local introuvable à la racine du projet.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

console.log("=================================================");
console.log("🔍 DIAGNOSTIC DE CONNEXION SUPABASE — AVENIDA");
console.log("=================================================");

console.log(`📡 URL Supabase configurée : ${supabaseUrl || 'NON DÉFINIE'}`);

if (!supabaseUrl || supabaseUrl.includes('votre-projet') || supabaseUrl.includes('placeholder')) {
  console.log("⚠️  L'URL Supabase contient encore une valeur d'exemple.");
}

if (!supabaseAnonKey || supabaseAnonKey.includes('votre-cle') || supabaseAnonKey.includes('placeholder')) {
  console.log("⚠️  La clé NEXT_PUBLIC_SUPABASE_ANON_KEY contient encore une valeur d'exemple.");
} else {
  console.log("✅ Clé Anon présente (longueur:", supabaseAnonKey.length, "caractères)");
}

if (!supabaseServiceKey || supabaseServiceKey.includes('votre-cle')) {
  console.log("ℹ️  Clé SUPABASE_SERVICE_ROLE_KEY : Non configurée ou valeur par défaut.");
} else {
  console.log("✅ Clé Service Role présente (longueur:", supabaseServiceKey.length, "caractères)");
}

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('votre-projet')) {
  console.log("\n❌ Impossible de tester l'accès réseau : veuillez renseigner votre URL et vos clés réelles dans .env.local");
  process.exit(0);
}

// 2. Tester l'appel réseau
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("\n⏳ Test de liaison réseau avec Supabase...");
  try {
    const startTime = Date.now();
    // Tester un appel public (par exemple la session d'auth ou un SELECT simple)
    const { data, error } = await supabase.auth.getSession();
    const duration = Date.now() - startTime;

    if (error) {
      console.error(`❌ Échec de la communication avec Supabase (${duration}ms) :`, error.message);
    } else {
      console.log(`✅ Connexion réseau réussie avec succès ! (Temps de réponse: ${duration}ms)`);
      console.log("✅ Le client Supabase de votre application est opérationnel.");
    }
  } catch (err) {
    console.error("❌ Erreur inattendue lors de la connexion :", err.message);
  }
}

testConnection();

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Charger .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables Supabase introuvables dans .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEFAULT_ACCOUNTS = [
  {
    email: 'direction@ecole-avenida.tg',
    password: 'avenidaPassword2026!',
    first_name: 'M. Le Directeur',
    last_name: 'Général',
    role_code: 'direction',
    phone: '+228 90 20 15 15'
  },
  {
    email: 'pedagogie@ecole-avenida.tg',
    password: 'avenidaPassword2026!',
    first_name: 'Directeur',
    last_name: 'Pédagogique',
    role_code: 'responsable_pedagogique',
    phone: '+228 90 20 15 16'
  },
  {
    email: 'comptabilite@ecole-avenida.tg',
    password: 'avenidaPassword2026!',
    first_name: 'Chef',
    last_name: 'Comptable',
    role_code: 'comptable',
    phone: '+228 90 20 15 17'
  },
  {
    email: 'rh@ecole-avenida.tg',
    password: 'avenidaPassword2026!',
    first_name: 'Responsable',
    last_name: 'RH',
    role_code: 'ressources_humaines',
    phone: '+228 90 20 15 18'
  },
  {
    email: 'hotel@ecole-avenida.tg',
    password: 'avenidaPassword2026!',
    first_name: 'Responsable',
    last_name: 'Hôtel',
    role_code: 'responsable_hotel',
    phone: '+228 90 20 15 19'
  }
];

async function seedUsers() {
  console.log("=================================================");
  console.log("👥 PROVISIONNEMENT DES UTILISATEURS DANS SUPABASE AUTH");
  console.log("=================================================");

  // 1. Récupérer les rôles existants dans public.roles
  const { data: roles, error: rolesError } = await supabase.from('roles').select('id, code');
  if (rolesError) {
    console.error("❌ Erreur lecture des rôles:", rolesError.message);
    process.exit(1);
  }
  const roleMap = new Map(roles.map(r => [r.code, r.id]));

  for (const account of DEFAULT_ACCOUNTS) {
    console.log(`\n⏳ Configuration du compte: ${account.email}...`);

    // Vérifier si l'utilisateur existe déjà dans auth.users
    const { data: listData } = await supabase.auth.admin.listUsers();
    let existingUser = listData?.users?.find(u => u.email === account.email);

    let userId = existingUser?.id;

    if (!existingUser) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          first_name: account.first_name,
          last_name: account.last_name,
          role: account.role_code
        }
      });

      if (createError) {
        console.error(`   ❌ Échec création auth user:`, createError.message);
        continue;
      }
      userId = created.user.id;
      console.log(`   ✅ Utilisateur créé dans auth.users (ID: ${userId})`);
    } else {
      console.log(`   ℹ️ Utilisateur existant dans auth.users (ID: ${userId})`);
      // Mettre à jour le mot de passe pour être certain
      await supabase.auth.admin.updateUserById(userId, {
        password: account.password,
        email_confirm: true
      });
    }

    // Créer ou mettre à jour dans public.profiles
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: account.first_name,
      last_name: account.last_name,
      email: account.email,
      phone: account.phone,
      is_active: true
    });

    if (profileError) {
      console.error(`   ❌ Erreur profil:`, profileError.message);
    } else {
      console.log(`   ✅ Profil synchronisé dans public.profiles`);
    }

    // Associer le rôle
    const roleId = roleMap.get(account.role_code);
    if (roleId) {
      const { error: roleAssignError } = await supabase.from('user_roles').upsert({
        user_id: userId,
        role_id: roleId
      });
      if (roleAssignError) {
        console.error(`   ❌ Erreur affectation rôle:`, roleAssignError.message);
      } else {
        console.log(`   ✅ Rôle '${account.role_code}' attribué dans public.user_roles`);
      }
    }
  }

  console.log("\n✨ Provisionnement terminé avec succès !");
}

seedUsers();
